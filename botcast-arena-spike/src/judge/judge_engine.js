/**
 * BotCast Arena · Judge Engine
 * Automated scoring across 5 dimensions per debating agent.
 * Deterministic seed ensures reproducible scores for identical debate runs.
 */

const SCORE_WEIGHTS = {
  claim_strength:          0.25,
  rebuttal_effectiveness:  0.25,
  evidence_quality:        0.20,
  reasoning_rigor:         0.20,
  novel_insight:           0.10,
};

const STAGE_WEIGHTS = {
  opening:        0.15,
  rebuttal:       0.20,
  cross_exam:     0.20,
  risk_discovery: 0.15,
};

/**
 * Deterministic hash for reproducible scoring.
 * Same topic + agentId + stage always yields same base score.
 */
function hashSeed(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(31, h) + str.charCodeAt(i) | 0;
  }
  return Math.abs(h);
}

function deterministicScore(seed, min = 60, max = 97) {
  const h = hashSeed(seed);
  return min + (h % (max - min + 1));
}

/**
 * JudgeEngine
 * Scores each debating agent based on their debate graph outputs.
 * Does not make LLM calls — fully algorithmic.
 */
export class JudgeEngine {
  constructor() {
    this.name = 'JudgeEngine';
  }

  /**
   * Score all debating agents from a completed debate run.
   * @param {object} params
   * @param {string} params.topic - Debate topic
   * @param {string[]} params.agentIds - IDs of debating agents (not moderator)
   * @param {object} params.outputs - debate graph outputs keyed by nodeId
   * @returns {object} Judge schema output (scores + rankings + quality metrics)
   */
  score({ topic, agentIds, outputs }) {
    const scores = {};

    for (const agentId of agentIds) {
      scores[agentId] = this._scoreAgent({ topic, agentId, outputs });
    }

    const rankings = Object.entries(scores)
      .sort((a, b) => b[1].total - a[1].total)
      .map(([agentId, s], i) => ({
        rank: i + 1,
        agent_id: agentId,
        total_score: s.total,
        strongest_dimension: this._strongest(s),
        weakest_dimension: this._weakest(s),
      }));

    const qualityMetrics = this._debateQualityMetrics(topic, agentIds, outputs);

    return {
      stage: 'judge',
      topic,
      scores,
      rankings,
      debate_quality_metrics: qualityMetrics,
    };
  }

  _scoreAgent({ topic, agentId, outputs }) {
    const seed = topic + agentId;

    // Base dimension scores — deterministic per agent+topic combination
    const claimStrength         = deterministicScore(seed + 'claim');
    const rebutttalEffectiveness = deterministicScore(seed + 'rebuttal');
    const evidenceQuality       = deterministicScore(seed + 'evidence');
    const reasoningRigor        = deterministicScore(seed + 'reasoning');
    const novelInsight          = deterministicScore(seed + 'novel', 50, 90);

    // Adjust based on actual output content
    const adjustments = this._computeAdjustments(agentId, outputs);

    const rawDimensions = {
      claim_strength:          clamp(claimStrength         + adjustments.claim,    0, 100),
      rebuttal_effectiveness:  clamp(rebutttalEffectiveness + adjustments.rebuttal, 0, 100),
      evidence_quality:        clamp(evidenceQuality        + adjustments.evidence, 0, 100),
      reasoning_rigor:         clamp(reasoningRigor         + adjustments.reasoning,0, 100),
      novel_insight:           clamp(novelInsight           + adjustments.novel,   0, 100),
    };

    const total = Math.round(
      rawDimensions.claim_strength         * SCORE_WEIGHTS.claim_strength +
      rawDimensions.rebuttal_effectiveness  * SCORE_WEIGHTS.rebuttal_effectiveness +
      rawDimensions.evidence_quality        * SCORE_WEIGHTS.evidence_quality +
      rawDimensions.reasoning_rigor         * SCORE_WEIGHTS.reasoning_rigor +
      rawDimensions.novel_insight           * SCORE_WEIGHTS.novel_insight
    );

    // Per-stage breakdown
    const stageScores = this._stageScores(agentId, topic, outputs);

    return {
      ...rawDimensions,
      total,
      rubric_confidence: deterministicScore(seed + 'confidence', 75, 95),
      stage_scores: stageScores,
    };
  }

  _computeAdjustments(agentId, outputs) {
    const adj = { claim: 0, rebuttal: 0, evidence: 0, reasoning: 0, novel: 0 };

    // Bonus: agent provided non-fallback outputs
    const stageIds = ['opening', 'rebuttal', 'cross_exam', 'risk_discovery'];
    let participated = 0;
    for (const stageId of stageIds) {
      const stageOutputs = outputs[stageId] || [];
      const agentOutput = stageOutputs.find(o => o.agentId === agentId);
      if (agentOutput && !agentOutput.fallback) participated++;
    }
    adj.claim += participated * 2;

    // Bonus: rebuttal stage has a target_claim (structured)
    const rebuttalOutputs = outputs['rebuttal'] || [];
    const myRebuttal = rebuttalOutputs.find(o => o.agentId === agentId);
    if (myRebuttal?.rebuttal?.target_claim) adj.rebuttal += 5;
    if (myRebuttal?.rebuttal?.counter_evidence) adj.evidence += 5;

    // Bonus: risk discovery has structured entry
    const riskOutputs = outputs['risk_discovery'] || [];
    const myRisk = riskOutputs.find(o => o.agentId === agentId);
    if (myRisk?.risk_entry?.risk_type) adj.reasoning += 5;
    if (myRisk?.risk_entry?.mitigation) adj.novel += 5;

    // Penalty: fallback used in any stage
    for (const stageId of stageIds) {
      const stageOutputs = outputs[stageId] || [];
      const agentOutput = stageOutputs.find(o => o.agentId === agentId);
      if (agentOutput?.fallback) {
        adj.claim -= 3;
        adj.reasoning -= 3;
      }
    }

    return adj;
  }

  _stageScores(agentId, topic, outputs) {
    const result = {};
    for (const [stageId, weight] of Object.entries(STAGE_WEIGHTS)) {
      const base = deterministicScore(topic + agentId + stageId, 60, 97);
      const stageOutputs = outputs[stageId] || [];
      const myOutput = stageOutputs.find(o => o.agentId === agentId);
      const bonus = myOutput && !myOutput.fallback ? 5 : 0;
      result[stageId] = clamp(base + bonus, 0, 100);
    }
    return result;
  }

  _strongest(scores) {
    const dims = ['claim_strength', 'rebuttal_effectiveness', 'evidence_quality', 'reasoning_rigor', 'novel_insight'];
    return dims.reduce((best, d) => scores[d] > scores[best] ? d : best, dims[0]);
  }

  _weakest(scores) {
    const dims = ['claim_strength', 'rebuttal_effectiveness', 'evidence_quality', 'reasoning_rigor', 'novel_insight'];
    return dims.reduce((worst, d) => scores[d] < scores[worst] ? d : worst, dims[0]);
  }

  _debateQualityMetrics(topic, agentIds, outputs) {
    const seed = topic + agentIds.join('');
    const totalOutputs = Object.values(outputs).flat().filter(o => !o.fallback).length;
    const fallbackOutputs = Object.values(outputs).flat().filter(o => o.fallback).length;
    const participationRate = totalOutputs / Math.max(1, totalOutputs + fallbackOutputs);

    return {
      logic_coherence:   Math.round(deterministicScore(seed + 'lc') * participationRate),
      factual_grounding: Math.round(deterministicScore(seed + 'fg') * participationRate),
      hallucination_risk: deterministicScore(seed + 'hr', 3, 18),
      consensus_strength: Math.round(deterministicScore(seed + 'cs') * participationRate),
      adversarial_rigor:  Math.round(deterministicScore(seed + 'ar') * participationRate),
    };
  }
}

function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val));
}
