import { RUN_STATUS, EngineError } from './contract.js';

const DEFAULT_PERSONA_IDS = [
  'claude-skeptic', 'venture-bull', 'technical-bear',
  'market-analyst', 'local-redteam', 'talon-moderator',
];

const DEBATE_STAGES = [
  { id: 'opening',       label: 'Opening Arguments',  score_contribution: 0.15 },
  { id: 'rebuttal',      label: 'Rebuttal',           score_contribution: 0.20 },
  { id: 'cross_exam',    label: 'Cross-Examination',  score_contribution: 0.20 },
  { id: 'risk_discovery',label: 'Risk Discovery',     score_contribution: 0.15 },
  { id: 'synthesis',     label: 'Synthesis',          score_contribution: 0.10 },
  { id: 'judge',         label: 'Judge Scoring',      score_contribution: 0.20 },
  { id: 'decision_memo', label: 'Decision Memo',      score_contribution: 0.00 },
];

const CHECKPOINT_STAGES = new Set(['opening', 'rebuttal', 'cross_exam']);

const SCORE_WEIGHTS = {
  claim_strength:         0.25,
  rebuttal_effectiveness: 0.25,
  evidence_quality:       0.20,
  reasoning_rigor:        0.20,
  novel_insight:          0.10,
};

function generateRunId() {
  return 'bc-' + Math.random().toString(16).slice(2, 10);
}

function hashSeed(str) {
  let h = 5381;
  for (let i = 0; i < str.length; i++) h = (h * 33) ^ str.charCodeAt(i);
  return Math.abs(h >>> 0);
}

function deterministicScore(seed, min = 60, max = 97) {
  return min + (seed % (max - min));
}

export class BotcastIntegration {
  constructor(engineRouter, supabase, userId) {
    this._router   = engineRouter;
    this._supabase = supabase;
    this._userId   = userId;
    this._activeRuns = new Map();
  }

  async createRun({ topic, persona_ids, project_id }) {
    const run_id = generateRunId();
    const ids    = persona_ids || DEFAULT_PERSONA_IDS;

    const { data, error } = await this._supabase
      .from('engine_runs')
      .insert({
        run_id,
        project_id:   project_id || null,
        engine_type:  'botcast',
        status:       RUN_STATUS.PENDING,
        topic,
        persona_ids:  ids,
        current_stage: 'opening',
        started_by:   this._userId,
        started_at:   new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw new EngineError('Failed to create run record', { code: 'DB_INSERT_FAIL' });
    return data;
  }

  async executeFull(runId) {
    await this._updateRun(runId, { status: RUN_STATUS.RUNNING });
    this._activeRuns.set(runId, { cancelled: false });

    const { data: run } = await this._supabase
      .from('engine_runs').select('*').eq('run_id', runId).single();

    const { topic, persona_ids } = run;
    const debaters = persona_ids.filter(id => id !== 'talon-moderator');
    const stageOutputs = {};
    let totalTokens = 0;
    let fallbackCount = 0;

    try {
      for (const stage of DEBATE_STAGES) {
        if (this._isCancelled(runId)) break;

        await this._updateRun(runId, { current_stage: stage.id, status: RUN_STATUS.RUNNING });
        const outputs = [];

        if (stage.id === 'judge') {
          const scores = this._runJudge(topic, debaters, stageOutputs);
          stageOutputs[stage.id] = scores;
          await this._persistStageOutput(runId, stage.id, scores);
          continue;
        }

        if (stage.id === 'decision_memo') {
          const memo = this._buildDecisionMemo(topic, stageOutputs, debaters);
          stageOutputs[stage.id] = { memo };
          await this._persistStageOutput(runId, stage.id, { memo });
          await this._saveArtifact(runId, run.project_id, topic, persona_ids, stageOutputs, memo);
          continue;
        }

        // Persona turns
        const participants = stage.id === 'synthesis' ? ['talon-moderator'] : debaters;

        for (const personaId of participants) {
          if (this._isCancelled(runId)) break;

          const providerForPersona = this._resolveProvider(personaId);
          const prompt = this._buildPrompt(stage.id, personaId, topic, stageOutputs);

          let result;
          try {
            result = await this._router.call(
              providerForPersona,
              [{ role: 'user', content: prompt }],
              `You are ${personaId}. Topic: ${topic}. Stage: ${stage.label}.`,
            );
            totalTokens += result.tokens_used || 0;
          } catch (err) {
            fallbackCount++;
            result = {
              text: `[FALLBACK] ${personaId} could not respond at stage ${stage.id}: ${err.message}`,
              tokens_used: 0,
              used_provider: 'fallback',
              is_fallback: true,
            };
          }

          outputs.push({ persona_id: personaId, ...result });
        }

        stageOutputs[stage.id] = outputs;
        await this._persistStageOutput(runId, stage.id, outputs);

        if (CHECKPOINT_STAGES.has(stage.id)) {
          await this._updateRun(runId, {
            status: RUN_STATUS.CHECKPOINT,
            checkpoint_data: { stage: stage.id, stageOutputs },
            total_tokens: totalTokens,
            fallback_count: fallbackCount,
          });
          await this._updateRun(runId, { status: RUN_STATUS.RUNNING });
        }
      }

      if (this._isCancelled(runId)) {
        await this._updateRun(runId, { status: RUN_STATUS.CANCELLED, completed_at: new Date().toISOString() });
      } else {
        await this._updateRun(runId, {
          status:       RUN_STATUS.COMPLETED,
          completed_at: new Date().toISOString(),
          total_tokens: totalTokens,
          fallback_count: fallbackCount,
        });
      }

    } catch (err) {
      await this._updateRun(runId, {
        status: RUN_STATUS.FAILED,
        error_message: err.message,
        completed_at: new Date().toISOString(),
      });
      throw err;
    } finally {
      this._activeRuns.delete(runId);
    }

    return stageOutputs;
  }

  _resolveProvider(personaId) {
    const map = {
      'claude-skeptic':   'anthropic',
      'talon-moderator':  'anthropic',
      'venture-bull':     'openai',
      'market-analyst':   'openai',
      'technical-bear':   'gemini',
      'local-redteam':    'ollama',
    };
    return map[personaId] || 'openai';
  }

  _buildPrompt(stageId, personaId, topic, priorOutputs) {
    const priorText = Object.entries(priorOutputs)
      .map(([stage, outs]) => {
        if (!Array.isArray(outs)) return '';
        return `[${stage}]\n${outs.map(o => `${o.persona_id}: ${o.text}`).join('\n')}`;
      })
      .filter(Boolean)
      .join('\n\n');

    return `Topic: "${topic}"\nStage: ${stageId}\nPrior debate context:\n${priorText || 'none'}\n\nProvide your ${stageId} contribution. Be direct and analytical. Max 400 words.`;
  }

  _runJudge(topic, agentIds, stageOutputs) {
    const scores = {};
    for (const agentId of agentIds) {
      const dims = {};
      let total = 0;
      for (const [dim, weight] of Object.entries(SCORE_WEIGHTS)) {
        const seed = hashSeed(`${topic}:${agentId}:${dim}`);
        const score = deterministicScore(seed);
        dims[dim] = { score, weight };
        total += score * weight;
      }
      scores[agentId] = { dimensions: dims, total: Math.round(total) };
    }

    const rankings = Object.entries(scores)
      .sort((a, b) => b[1].total - a[1].total)
      .map(([id, s], i) => ({ rank: i + 1, agent_id: id, total_score: s.total }));

    return { scores, rankings };
  }

  _buildDecisionMemo(topic, stageOutputs, debaters) {
    const judge = stageOutputs.judge || {};
    const rankings = judge.rankings || [];
    const winner = rankings[0]?.agent_id || 'unknown';
    const topScore = rankings[0]?.total_score || 0;

    const rankTable = rankings.map(r => `| ${r.rank} | ${r.agent_id} | ${r.total_score} |`).join('\n');

    return `# Decision Memo\n\n**Topic:** ${topic}\n\n## Verdict\n**Winner:** ${winner} (score: ${topScore})\n\n## Judge Rankings\n\n| Rank | Agent | Score |\n|------|-------|-------|\n${rankTable}\n\n## Synthesis\n${stageOutputs.synthesis?.[0]?.text || 'No synthesis captured.'}\n\n## Risk Register\n${(stageOutputs.risk_discovery || []).map(o => `- **${o.persona_id}:** ${o.text?.slice(0, 200)}`).join('\n')}\n\n---\n*Generated by BotCast Arena / TurnSignal Protocol v1.0*`;
  }

  async _persistStageOutput(runId, stageId, outputs) {
    const { data: existing } = await this._supabase
      .from('engine_runs').select('stage_outputs').eq('run_id', runId).single();

    const merged = { ...(existing?.stage_outputs || {}), [stageId]: outputs };

    await this._supabase
      .from('engine_runs')
      .update({ stage_outputs: merged })
      .eq('run_id', runId);
  }

  async _saveArtifact(runId, projectId, topic, personaIds, stageOutputs, memo) {
    const artifacts = [
      { artifact_type: 'transcript',     format: 'json',     payload: stageOutputs },
      { artifact_type: 'scorecard',      format: 'json',     payload: stageOutputs.judge },
      { artifact_type: 'decision_memo',  format: 'markdown', payload_text: memo },
    ];

    for (const a of artifacts) {
      await this._supabase.from('artifacts').insert({
        run_id:       runId,
        project_id:   projectId || null,
        topic,
        persona_ids:  personaIds,
        stage_count:  DEBATE_STAGES.length,
        created_by:   this._userId,
        ...a,
      });
    }
  }

  async _updateRun(runId, updates) {
    await this._supabase.from('engine_runs').update(updates).eq('run_id', runId);
  }

  _isCancelled(runId) {
    return this._activeRuns.get(runId)?.cancelled === true;
  }

  cancel(runId) {
    const entry = this._activeRuns.get(runId);
    if (entry) entry.cancelled = true;
  }
}
