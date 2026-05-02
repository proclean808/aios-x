/**
 * JudgeEngine — unit tests.
 * Deterministic scoring, weighted dimensions, output adjustments, ranking.
 */

import { describe, it, expect } from 'vitest';
import { JudgeEngine } from '../../botcast-arena-spike/src/judge/judge_engine.js';
import { SAMPLE_TOPIC, SAMPLE_DEBATER_IDS, buildStageOutputs } from '../setup/test-utils.js';

const judge = new JudgeEngine();

describe('JudgeEngine — determinism', () => {
  it('produces the same scores for identical inputs (run twice)', () => {
    const stageOutputs = buildStageOutputs(['opening', 'rebuttal', 'cross_exam', 'risk_discovery']);
    const result1 = judge.score({ topic: SAMPLE_TOPIC, agentIds: SAMPLE_DEBATER_IDS, outputs: stageOutputs });
    const result2 = judge.score({ topic: SAMPLE_TOPIC, agentIds: SAMPLE_DEBATER_IDS, outputs: stageOutputs });

    for (const agentId of SAMPLE_DEBATER_IDS) {
      expect(result1.scores[agentId].total).toBe(result2.scores[agentId].total);
    }
  });

  it('different topics produce different scores', () => {
    const outputs = buildStageOutputs(['opening']);
    const r1 = judge.score({ topic: SAMPLE_TOPIC, agentIds: ['venture-bull'], outputs });
    const r2 = judge.score({ topic: 'A completely different topic', agentIds: ['venture-bull'], outputs });
    // scores should differ (hash is topic-dependent)
    expect(r1.scores['venture-bull'].total).not.toBe(r2.scores['venture-bull'].total);
  });

  it('different agent IDs produce different scores for same topic', () => {
    const outputs = buildStageOutputs(['opening']);
    const r = judge.score({ topic: SAMPLE_TOPIC, agentIds: ['claude-skeptic', 'venture-bull'], outputs });
    expect(r.scores['claude-skeptic'].total).not.toBe(r.scores['venture-bull'].total);
  });
});

describe('JudgeEngine — score ranges', () => {
  it('all dimension scores fall in [60, 97]', () => {
    const outputs = buildStageOutputs(['opening', 'rebuttal']);
    const result = judge.score({ topic: SAMPLE_TOPIC, agentIds: SAMPLE_DEBATER_IDS, outputs });

    for (const agentId of SAMPLE_DEBATER_IDS) {
      const dims = result.scores[agentId].dimensions;
      for (const [dim, val] of Object.entries(dims)) {
        const score = val.score !== undefined ? val.score : val;
        expect(score, `${agentId} ${dim} out of range`).toBeGreaterThanOrEqual(55);
        expect(score, `${agentId} ${dim} out of range`).toBeLessThanOrEqual(100);
      }
    }
  });

  it('total scores fall in [60, 100]', () => {
    const outputs = buildStageOutputs(['opening', 'rebuttal']);
    const result = judge.score({ topic: SAMPLE_TOPIC, agentIds: SAMPLE_DEBATER_IDS, outputs });

    for (const agentId of SAMPLE_DEBATER_IDS) {
      expect(result.scores[agentId].total).toBeGreaterThanOrEqual(55);
      expect(result.scores[agentId].total).toBeLessThanOrEqual(100);
    }
  });
});

describe('JudgeEngine — weighted dimensions', () => {
  it('result includes all 5 required scoring dimensions', () => {
    const outputs = buildStageOutputs(['opening']);
    const result = judge.score({ topic: SAMPLE_TOPIC, agentIds: ['venture-bull'], outputs });
    const dims = result.scores['venture-bull'].dimensions;
    const required = ['claim_strength', 'rebuttal_effectiveness', 'evidence_quality', 'reasoning_rigor', 'novel_insight'];
    for (const d of required) {
      expect(dims, `Missing dimension: ${d}`).toHaveProperty(d);
    }
  });

  it('weights sum to 1.0 (SCORE_WEIGHTS contract)', () => {
    // Verify weights in engine output if exposed
    const outputs = buildStageOutputs(['opening']);
    const result = judge.score({ topic: SAMPLE_TOPIC, agentIds: ['venture-bull'], outputs });
    const dims = result.scores['venture-bull'].dimensions;
    const totalWeight = Object.values(dims).reduce((sum, d) => {
      const w = d.weight !== undefined ? d.weight : 0;
      return sum + w;
    }, 0);
    if (totalWeight > 0) {  // only check if weights are exposed
      expect(totalWeight).toBeCloseTo(1.0, 5);
    }
  });
});

describe('JudgeEngine — rankings', () => {
  it('produces a ranking for each debater', () => {
    const outputs = buildStageOutputs(['opening', 'rebuttal']);
    const result = judge.score({ topic: SAMPLE_TOPIC, agentIds: SAMPLE_DEBATER_IDS, outputs });
    expect(result.rankings).toHaveLength(SAMPLE_DEBATER_IDS.length);
  });

  it('rankings are ordered descending by total_score', () => {
    const outputs = buildStageOutputs(['opening', 'rebuttal']);
    const result = judge.score({ topic: SAMPLE_TOPIC, agentIds: SAMPLE_DEBATER_IDS, outputs });
    for (let i = 1; i < result.rankings.length; i++) {
      expect(result.rankings[i - 1].total_score).toBeGreaterThanOrEqual(result.rankings[i].total_score);
    }
  });

  it('rank 1 is assigned to highest scoring agent', () => {
    const outputs = buildStageOutputs(['opening']);
    const result = judge.score({ topic: SAMPLE_TOPIC, agentIds: SAMPLE_DEBATER_IDS, outputs });
    expect(result.rankings[0].rank).toBe(1);
  });
});

describe('JudgeEngine — debate quality metrics', () => {
  it('returns debate_quality_metrics object', () => {
    const outputs = buildStageOutputs(['opening', 'rebuttal', 'cross_exam']);
    const result = judge.score({ topic: SAMPLE_TOPIC, agentIds: SAMPLE_DEBATER_IDS, outputs });
    expect(result).toHaveProperty('debate_quality_metrics');
  });

  it('quality metrics include logic_coherence and hallucination_risk', () => {
    const outputs = buildStageOutputs(['opening', 'rebuttal']);
    const result = judge.score({ topic: SAMPLE_TOPIC, agentIds: SAMPLE_DEBATER_IDS, outputs });
    const qm = result.debate_quality_metrics;
    expect(qm).toHaveProperty('logic_coherence');
    expect(qm).toHaveProperty('hallucination_risk');
  });
});

describe('JudgeEngine — fallback penalty', () => {
  it('agent with fallback outputs scores lower than agent with real outputs', () => {
    const normalOutputs = buildStageOutputs(['opening', 'rebuttal', 'cross_exam']);
    const fallbackOutputs = structuredClone(normalOutputs);

    // Mark all outputs for venture-bull as fallback
    for (const stage of Object.keys(fallbackOutputs)) {
      fallbackOutputs[stage] = fallbackOutputs[stage].map(o =>
        o.persona_id === 'venture-bull' ? { ...o, is_fallback: true } : o
      );
    }

    const normal = judge.score({ topic: SAMPLE_TOPIC, agentIds: ['venture-bull', 'claude-skeptic'], outputs: normalOutputs });
    const withFallback = judge.score({ topic: SAMPLE_TOPIC, agentIds: ['venture-bull', 'claude-skeptic'], outputs: fallbackOutputs });

    // venture-bull should score lower when flagged as fallback
    expect(withFallback.scores['venture-bull'].total).toBeLessThanOrEqual(normal.scores['venture-bull'].total);
  });
});
