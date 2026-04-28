/**
 * BotCast Arena · Artifact Exporter
 * Produces: transcript.json, scorecard.json, decision_memo.md
 * All artifacts are deterministically generated from the debate graph outputs.
 */

/**
 * Generate the run ID for a new debate session
 */
export function generateRunId() {
  const ts = new Date().toISOString().replace(/[:.]/g, '-').replace('T', '_').split('Z')[0];
  return `debate_run_${ts}`;
}

/**
 * Build the transcript.json artifact
 */
export function buildTranscript({ runId, topic, agentIds, outputs, graphState }) {
  const entries = [];

  const stageOrder = ['opening', 'rebuttal', 'cross_exam', 'risk_discovery', 'synthesis'];
  for (const stageId of stageOrder) {
    const stageOutputs = outputs[stageId] || [];
    for (const output of stageOutputs) {
      entries.push({
        stage: stageId,
        agent_id: output.agentId,
        text: output.text || output.argument?.text || output.rebuttal?.text ||
              output.answer?.text || output.risk_entry?.text || output.synthesis?.text || '',
        fallback: output.fallback || false,
        tokens_used: output.tokens_used || 0,
        latency_ms: output.latency_ms || 0,
        provider: output.provider || null,
        recorded_at: output.recordedAt || 0,
        turn_signal: output.turn_signal || null,
      });
    }
  }

  return {
    run_id: runId,
    topic,
    agent_ids: agentIds,
    started_at: graphState?.startedAt || null,
    completed_at: graphState?.completedAt || null,
    total_tokens: graphState?.totalTokens || 0,
    total_cost_usd: +(graphState?.totalCostUsd || 0).toFixed(6),
    entries,
    entry_count: entries.length,
  };
}

/**
 * Build the scorecard.json artifact
 */
export function buildScorecard({ runId, topic, judgeOutput }) {
  return {
    run_id: runId,
    topic,
    generated_at: Date.now(),
    rankings: judgeOutput.rankings,
    scores: judgeOutput.scores,
    debate_quality_metrics: judgeOutput.debate_quality_metrics,
    scoring_method: 'JudgeEngine v1.0 — deterministic + output-adjusted',
    weights: {
      claim_strength: 0.25,
      rebuttal_effectiveness: 0.25,
      evidence_quality: 0.20,
      reasoning_rigor: 0.20,
      novel_insight: 0.10,
    },
  };
}

/**
 * Build the decision_memo.md artifact
 */
export function buildDecisionMemo({ runId, topic, transcript, scorecard, synthesisOutput, evidencePacket }) {
  const now = new Date().toISOString().split('T')[0];
  const synthesis = synthesisOutput?.synthesis || {};
  const rankings = scorecard?.rankings || [];
  const qualityMetrics = scorecard?.debate_quality_metrics || {};

  const winner = rankings[0];
  const topConclusions = (synthesis.high_conviction_conclusions || []).slice(0, 3);
  const contestedClaims = (synthesis.contested_claims || []).slice(0, 3);
  const riskSummary = (synthesis.risk_summary || []).slice(0, 5);

  // Build claim table from transcript
  const claimTable = buildClaimTable(transcript);

  const lines = [
    `# BotCast Arena · Decision Memo`,
    `**Run ID:** \`${runId}\`  `,
    `**Date:** ${now}  `,
    `**Entity:** Venture Vision / PlatFormula.ONE  `,
    `**Classification:** INTERNAL / STRATEGIC`,
    ``,
    `---`,
    ``,
    `## Topic`,
    `> ${topic}`,
    ``,
    `---`,
    ``,
    `## Executive Summary`,
    ``,
    synthesis.recommended_position
      ? synthesis.recommended_position
      : `After a ${transcript.entry_count}-turn structured debate, the TALON Moderator synthesized a consensus position with ${synthesis.confidence_level || 'MEDIUM'} confidence.`,
    ``,
    `**Confidence:** ${synthesis.confidence_level || 'MEDIUM'} (${synthesis.confidence_percentage || 'N/A'}%)`,
    ``,
    `---`,
    ``,
    `## High-Conviction Conclusions`,
    ``,
  ];

  if (topConclusions.length > 0) {
    topConclusions.forEach((c, i) => {
      lines.push(`**${i + 1}. ${c.claim}**`);
      lines.push(`- Evidence strength: ${c.evidence_strength || 'MODERATE'}`);
      lines.push(`- Supporting agents: ${(c.supporting_agents || []).join(', ')}`);
      lines.push('');
    });
  } else {
    lines.push('*Synthesis not completed — run debate to generate conclusions.*');
    lines.push('');
  }

  lines.push(`---`, ``, `## Contested Claims`, ``);
  if (contestedClaims.length > 0) {
    contestedClaims.forEach((c, i) => {
      lines.push(`**${i + 1}. ${c.claim}**`);
      lines.push(`- Pro: ${(c.pro_agents || []).join(', ')}`);
      lines.push(`- Con: ${(c.con_agents || []).join(', ')}`);
      if (c.resolution) lines.push(`- Resolution: ${c.resolution}`);
      lines.push('');
    });
  } else {
    lines.push('*No contested claims recorded.*', '');
  }

  lines.push(`---`, ``, `## Risk Registry`, ``);
  if (riskSummary.length > 0) {
    lines.push(`| Risk | Likelihood | Impact | Surfaced By |`);
    lines.push(`|------|-----------|--------|------------|`);
    riskSummary.forEach(r => {
      lines.push(`| ${r.risk_title || 'Unknown'} | ${r.likelihood || '?'} | ${r.impact || '?'} | ${r.surfaced_by || '?'} |`);
    });
    lines.push('');
  } else {
    lines.push('*No risks recorded.*', '');
  }

  lines.push(`---`, ``, `## Claim Table`, ``);
  if (claimTable.length > 0) {
    lines.push(`| Stage | Agent | Primary Claim | Confidence |`);
    lines.push(`|-------|-------|--------------|------------|`);
    claimTable.forEach(row => {
      lines.push(`| ${row.stage} | ${row.agent_id} | ${row.claim.substring(0, 80)}... | ${row.confidence} |`);
    });
    lines.push('');
  }

  lines.push(`---`, ``, `## Judge Rankings`, ``);
  if (rankings.length > 0) {
    lines.push(`| Rank | Agent | Score | Strongest | Weakest |`);
    lines.push(`|------|-------|-------|-----------|---------|`);
    rankings.forEach(r => {
      lines.push(`| #${r.rank} | ${r.agent_id} | ${r.total_score} | ${r.strongest_dimension} | ${r.weakest_dimension} |`);
    });
    lines.push('');
    lines.push(`**Winner:** ${winner?.agent_id || 'N/A'} (Score: ${winner?.total_score || 'N/A'})`);
    lines.push('');
  }

  lines.push(`---`, ``, `## Debate Quality Metrics`, ``);
  lines.push(`| Metric | Score |`);
  lines.push(`|--------|-------|`);
  lines.push(`| Logic Coherence | ${qualityMetrics.logic_coherence || '-'}% |`);
  lines.push(`| Factual Grounding | ${qualityMetrics.factual_grounding || '-'}% |`);
  lines.push(`| Hallucination Risk | ${qualityMetrics.hallucination_risk || '-'}% |`);
  lines.push(`| Consensus Strength | ${qualityMetrics.consensus_strength || '-'}% |`);
  lines.push(`| Adversarial Rigor | ${qualityMetrics.adversarial_rigor || '-'}% |`);
  lines.push('');

  lines.push(`---`, ``, `## Run Metadata`, ``);
  lines.push(`- **Run ID:** \`${runId}\``);
  lines.push(`- **Total tokens:** ${transcript.total_tokens || 0}`);
  lines.push(`- **Total cost:** $${(transcript.total_cost_usd || 0).toFixed(4)}`);
  lines.push(`- **Transcript entries:** ${transcript.entry_count || 0}`);
  lines.push(`- **Framework:** Microsoft Agent Framework 1.0 (GraphFlow)`);
  lines.push(`- **Protocol:** TurnSignal v1.0`);
  lines.push('');
  lines.push(`---`);
  lines.push(`*Generated by BotCast Arena · TALON Orchestration Mesh · PlatFormula.ONE*`);

  return lines.join('\n');
}

function buildClaimTable(transcript) {
  const table = [];
  for (const entry of (transcript.entries || [])) {
    if (entry.fallback) continue;
    if (['opening', 'rebuttal'].includes(entry.stage) && entry.text) {
      table.push({
        stage: entry.stage,
        agent_id: entry.agent_id,
        claim: entry.text.substring(0, 200),
        confidence: 'MEDIUM',
      });
    }
  }
  return table;
}

/**
 * Package all three artifacts together
 */
export function packageArtifacts({ runId, topic, agentIds, outputs, graphState, judgeOutput, synthesisOutput }) {
  const transcript = buildTranscript({ runId, topic, agentIds, outputs, graphState });
  const scorecard = buildScorecard({ runId, topic, judgeOutput });
  const decisionMemo = buildDecisionMemo({
    runId, topic, transcript, scorecard, synthesisOutput,
  });

  return { transcript, scorecard, decisionMemo };
}
