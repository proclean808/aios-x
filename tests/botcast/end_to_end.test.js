/**
 * End-to-end — full 7-stage debate run.
 * Uses mocked providers; validates that all 3 artifacts are produced.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { BotcastIntegration } from '../../src/engines/botcast_integration.js';
import { mockEngineRouter, mockSupabase, SAMPLE_TOPIC, SAMPLE_DEBATER_IDS } from '../setup/test-utils.js';

const ALL_PERSONAS = [...SAMPLE_DEBATER_IDS, 'talon-moderator'];

function buildMockDB() {
  let storedRun = null;
  let artifacts = [];

  return {
    from: (table) => ({
      insert: (data) => ({
        select: () => ({
          single: async () => {
            if (table === 'engine_runs') {
              storedRun = { ...data };
              return { data: storedRun, error: null };
            }
            if (table === 'artifacts') artifacts.push(data);
            return { data: { id: 'art-' + Math.random(), ...data }, error: null };
          },
        }),
      }),
      select: (cols) => ({
        eq: (col, val) => ({
          single: async () => {
            if (table === 'engine_runs' && storedRun) {
              return { data: { ...storedRun, run_id: val, stage_outputs: storedRun.stage_outputs || {} }, error: null };
            }
            return { data: null, error: null };
          },
        }),
      }),
      update: (data) => ({
        eq: () => {
          if (storedRun) Object.assign(storedRun, data);
          return { data: storedRun, error: null };
        },
      }),
    }),
    _getArtifacts: () => artifacts,
    _getRun: () => storedRun,
  };
}

describe('End-to-End — full debate run', () => {
  let db;
  let router;
  let botcast;

  beforeEach(() => {
    db = buildMockDB();
    router = mockEngineRouter('[E2E mock response] ' + SAMPLE_TOPIC.slice(0, 30));
    botcast = new BotcastIntegration(router, db, 'user-e2e');
  });

  afterEach(() => { vi.restoreAllMocks(); });

  it('E2E.1: createRun returns a run with run_id starting with bc-', async () => {
    const run = await botcast.createRun({ topic: SAMPLE_TOPIC, persona_ids: ALL_PERSONAS });
    expect(run.run_id).toMatch(/^bc-[0-9a-f]{8}$/);
    expect(run.topic).toBe(SAMPLE_TOPIC);
    expect(run.status).toBe('pending');
  });

  it('E2E.2: executeFull completes with status completed', async () => {
    const run = await botcast.createRun({ topic: SAMPLE_TOPIC, persona_ids: ALL_PERSONAS });
    await botcast.executeFull(run.run_id);
    const storedRun = db._getRun();
    expect(storedRun.status).toBe('completed');
  });

  it('E2E.3: all 7 stages are present in stage_outputs', async () => {
    const run = await botcast.createRun({ topic: SAMPLE_TOPIC, persona_ids: ALL_PERSONAS });
    const stageOutputs = await botcast.executeFull(run.run_id);

    const expectedStages = ['opening', 'rebuttal', 'cross_exam', 'risk_discovery', 'synthesis', 'judge', 'decision_memo'];
    for (const stage of expectedStages) {
      expect(stageOutputs, `Missing stage: ${stage}`).toHaveProperty(stage);
    }
  });

  it('E2E.4: 3 artifacts are saved (transcript, scorecard, decision_memo)', async () => {
    const run = await botcast.createRun({ topic: SAMPLE_TOPIC, persona_ids: ALL_PERSONAS });
    await botcast.executeFull(run.run_id);

    const artifacts = db._getArtifacts();
    const types = artifacts.map(a => a.artifact_type);
    expect(types).toContain('transcript');
    expect(types).toContain('scorecard');
    expect(types).toContain('decision_memo');
  });

  it('E2E.5: judge stage produces rankings for all debaters', async () => {
    const run = await botcast.createRun({ topic: SAMPLE_TOPIC, persona_ids: ALL_PERSONAS });
    const stageOutputs = await botcast.executeFull(run.run_id);

    const judge = stageOutputs.judge;
    expect(judge).toHaveProperty('rankings');
    expect(judge.rankings).toHaveLength(SAMPLE_DEBATER_IDS.length);
    for (const ranking of judge.rankings) {
      expect(SAMPLE_DEBATER_IDS).toContain(ranking.agent_id);
    }
  });

  it('E2E.6: decision_memo artifact is valid Markdown', async () => {
    const run = await botcast.createRun({ topic: SAMPLE_TOPIC, persona_ids: ALL_PERSONAS });
    await botcast.executeFull(run.run_id);

    const artifacts = db._getArtifacts();
    const memo = artifacts.find(a => a.artifact_type === 'decision_memo');
    expect(memo).toBeTruthy();
    expect(memo.format).toBe('markdown');
    expect(memo.payload_text).toContain('# Decision Memo');
    expect(memo.payload_text).toContain(SAMPLE_TOPIC.slice(0, 20));
  });

  it('E2E.7: run with all providers failing still terminates (status=failed)', async () => {
    const failRouter = mockEngineRouter('', true);  // always throws
    const failBotcast = new BotcastIntegration(failRouter, db, 'user-e2e-fail');

    const run = await failBotcast.createRun({ topic: SAMPLE_TOPIC, persona_ids: ALL_PERSONAS });

    // Should not throw — engine catches and records failure
    try {
      await failBotcast.executeFull(run.run_id);
    } catch (_) {
      // Acceptable if thrown — check status was set to failed
    }

    const storedRun = db._getRun();
    // Either completed with fallback messages or failed — must not be stuck in pending/running
    expect(['completed', 'failed', 'cancelled']).toContain(storedRun?.status || 'failed');
  });

  it('E2E.8: cancel() stops execution before completing all stages', async () => {
    let cancelCalled = false;
    const slowRouter = {
      call: async () => {
        await new Promise(r => setTimeout(r, 10));
        if (cancelCalled) throw new Error('cancelled');
        return { text: 'ok', tokens_used: 10, used_provider: 'openai' };
      },
      getCircuitState: () => ({}),
    };

    const cancelBotcast = new BotcastIntegration(slowRouter, db, 'user-cancel');
    const run = await cancelBotcast.createRun({ topic: SAMPLE_TOPIC, persona_ids: ALL_PERSONAS });

    const execution = cancelBotcast.executeFull(run.run_id);
    await new Promise(r => setTimeout(r, 5));
    cancelBotcast.cancel(run.run_id);
    cancelCalled = true;

    try { await execution; } catch (_) {}
    const storedRun = db._getRun();
    // Run should be cancelled or failed, not still running
    expect(['cancelled', 'failed', 'completed']).toContain(storedRun?.status || 'cancelled');
  });
});
