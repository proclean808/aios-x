/**
 * DebateGraphStateMachine — unit tests.
 * Happy path, failure modes, checkpoint recovery, edge traversal.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { DebateGraphStateMachine, GRAPH_NODES } from '../../botcast-arena-spike/src/graph/debate_graph.js';
import { SAMPLE_TOPIC, SAMPLE_DEBATER_IDS } from '../setup/test-utils.js';

const RUN_ID = 'test-run-001';

describe('DebateGraphStateMachine — structure', () => {
  it('has 7 nodes', () => {
    expect(GRAPH_NODES).toHaveLength(7);
  });

  it('first node is opening', () => {
    expect(GRAPH_NODES[0].id).toBe('opening');
  });

  it('last node is decision_memo', () => {
    expect(GRAPH_NODES.at(-1).id).toBe('decision_memo');
  });

  it('all nodes have required fields', () => {
    for (const node of GRAPH_NODES) {
      expect(node).toHaveProperty('id');
      expect(node).toHaveProperty('label');
      expect(node).toHaveProperty('score_contribution');
    }
  });

  it('score contributions sum to 1.0', () => {
    const total = GRAPH_NODES.reduce((s, n) => s + n.score_contribution, 0);
    expect(total).toBeCloseTo(1.0, 5);
  });
});

describe('DebateGraphStateMachine — lifecycle', () => {
  let graph;
  beforeEach(() => {
    graph = new DebateGraphStateMachine(RUN_ID, SAMPLE_TOPIC, SAMPLE_DEBATER_IDS);
  });

  it('initializes with status pending', () => {
    expect(graph.status).toBe('pending');
  });

  it('start() sets status to running and currentNode to opening', () => {
    graph.start();
    expect(graph.status).toBe('running');
    expect(graph.currentNode).toBe('opening');
  });

  it('throws if advance() called before start()', () => {
    expect(() => graph.advance()).toThrow();
  });

  it('advance() moves to rebuttal after opening is complete', () => {
    graph.start();
    for (const id of SAMPLE_DEBATER_IDS) {
      graph.recordOutput('opening', id, { text: `${id} opening` });
    }
    graph.advance();
    expect(graph.currentNode).toBe('rebuttal');
  });

  it('advance() throws if not all agents have submitted', () => {
    graph.start();
    graph.recordOutput('opening', SAMPLE_DEBATER_IDS[0], { text: 'partial' });
    expect(() => graph.advance()).toThrow();
  });

  it('traverses all 7 stages sequentially', () => {
    graph.start();
    const visitedOrder = ['opening'];

    for (const node of GRAPH_NODES) {
      for (const id of SAMPLE_DEBATER_IDS) {
        graph.recordOutput(node.id, id, { text: `${id} at ${node.id}` });
      }
      const nextNodeId = graph.getNextNodeId(node.id);
      if (nextNodeId) {
        graph.advance();
        visitedOrder.push(nextNodeId);
      }
    }

    expect(visitedOrder).toEqual([
      'opening', 'rebuttal', 'cross_exam', 'risk_discovery', 'synthesis', 'judge', 'decision_memo',
    ]);
  });

  it('emits stage_complete event when advancing', () => {
    graph.start();
    let emitted = null;
    graph.on('stage_complete', (data) => { emitted = data; });

    for (const id of SAMPLE_DEBATER_IDS) {
      graph.recordOutput('opening', id, { text: 'arg' });
    }
    graph.advance();
    expect(emitted).toBeTruthy();
    expect(emitted.from).toBe('opening');
  });
});

describe('DebateGraphStateMachine — checkpoint & recovery', () => {
  it('saves checkpoint after opening stage advance', () => {
    const graph = new DebateGraphStateMachine(RUN_ID, SAMPLE_TOPIC, SAMPLE_DEBATER_IDS);
    graph.start();

    let checkpointSaved = false;
    graph.on('checkpoint_saved', () => { checkpointSaved = true; });

    for (const id of SAMPLE_DEBATER_IDS) {
      graph.recordOutput('opening', id, { text: 'opening arg' });
    }
    graph.advance();
    expect(checkpointSaved).toBe(true);
  });

  it('restoreFromCheckpoint restores currentNode', () => {
    const graph = new DebateGraphStateMachine(RUN_ID, SAMPLE_TOPIC, SAMPLE_DEBATER_IDS);
    graph.start();
    for (const id of SAMPLE_DEBATER_IDS) {
      graph.recordOutput('opening', id, { text: 'arg' });
    }
    graph.advance();  // saves checkpoint at opening

    const graph2 = new DebateGraphStateMachine(RUN_ID, SAMPLE_TOPIC, SAMPLE_DEBATER_IDS);
    graph2.restoreFromCheckpoint('opening');
    expect(graph2.currentNode).toBe('opening');
  });
});

describe('DebateGraphStateMachine — fallback tracking', () => {
  it('recordFallback marks agent as fallback at stage', () => {
    const graph = new DebateGraphStateMachine(RUN_ID, SAMPLE_TOPIC, SAMPLE_DEBATER_IDS);
    graph.start();
    graph.recordFallback('opening', SAMPLE_DEBATER_IDS[0], 'Provider timeout');

    const output = graph.outputs['opening'] || [];
    const fb = output.find(o => o.agentId === SAMPLE_DEBATER_IDS[0] && o.isFallback);
    expect(fb).toBeTruthy();
  });

  it('fallback counts toward canAdvance threshold', () => {
    const graph = new DebateGraphStateMachine(RUN_ID, SAMPLE_TOPIC, SAMPLE_DEBATER_IDS);
    graph.start();
    // Mix of real + fallback should still allow advance
    graph.recordOutput('opening', SAMPLE_DEBATER_IDS[0], { text: 'real' });
    for (let i = 1; i < SAMPLE_DEBATER_IDS.length; i++) {
      graph.recordFallback('opening', SAMPLE_DEBATER_IDS[i], 'timeout');
    }
    expect(() => graph.advance()).not.toThrow();
  });
});

describe('DebateGraphStateMachine — progress reporting', () => {
  it('getProgress returns 0% at start', () => {
    const graph = new DebateGraphStateMachine(RUN_ID, SAMPLE_TOPIC, SAMPLE_DEBATER_IDS);
    graph.start();
    const p = graph.getProgress();
    expect(p.percent).toBe(0);
    expect(p.total).toBe(7);
  });

  it('getProgress returns ~14% after first stage', () => {
    const graph = new DebateGraphStateMachine(RUN_ID, SAMPLE_TOPIC, SAMPLE_DEBATER_IDS);
    graph.start();
    for (const id of SAMPLE_DEBATER_IDS) {
      graph.recordOutput('opening', id, { text: 'x' });
    }
    graph.advance();
    const p = graph.getProgress();
    expect(p.step).toBe(2);
  });
});
