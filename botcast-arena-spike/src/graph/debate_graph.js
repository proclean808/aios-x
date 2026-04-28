/**
 * BotCast Arena · Debate Graph State Machine
 * Microsoft Agent Framework 1.0 — GraphFlow Pattern
 * TurnSignal Protocol for deterministic multi-agent turn-taking
 */

export const GRAPH_NODES = [
  {
    id: 'opening',
    label: 'OPENING ARGUMENTS',
    sequence: 1,
    turn_order: 'sequential',
    evidence_access: true,
    token_ceiling: 400,
    cost_ceiling_usd: 0.02,
    score_contribution: 0.15,
    failure_fallback: 'skip_with_log',
    allowed_roles: ['challenger', 'advocate', 'skeptic', 'analyst'],
  },
  {
    id: 'rebuttal',
    label: 'REBUTTAL',
    sequence: 2,
    turn_order: 'sequential',
    evidence_access: true,
    token_ceiling: 400,
    cost_ceiling_usd: 0.02,
    score_contribution: 0.20,
    failure_fallback: 'skip_with_log',
    allowed_roles: ['challenger', 'advocate', 'skeptic', 'analyst'],
  },
  {
    id: 'cross_exam',
    label: 'CROSS-EXAMINATION',
    sequence: 3,
    turn_order: 'moderator_then_respondents',
    evidence_access: true,
    token_ceiling: 300,
    cost_ceiling_usd: 0.015,
    score_contribution: 0.20,
    failure_fallback: 'skip_with_log',
    allowed_roles: ['moderator', 'challenger', 'advocate', 'skeptic', 'analyst'],
  },
  {
    id: 'risk_discovery',
    label: 'RISK DISCOVERY',
    sequence: 4,
    turn_order: 'sequential',
    evidence_access: true,
    token_ceiling: 300,
    cost_ceiling_usd: 0.015,
    score_contribution: 0.15,
    failure_fallback: 'skip_with_log',
    allowed_roles: ['challenger', 'advocate', 'skeptic', 'analyst'],
  },
  {
    id: 'synthesis',
    label: 'SYNTHESIS',
    sequence: 5,
    turn_order: 'moderator_only',
    evidence_access: true,
    token_ceiling: 600,
    cost_ceiling_usd: 0.03,
    score_contribution: 0.10,
    failure_fallback: 'generate_static',
    allowed_roles: ['moderator'],
  },
  {
    id: 'judge',
    label: 'JUDGE SCORING',
    sequence: 6,
    turn_order: 'automated',
    evidence_access: false,
    token_ceiling: 0,
    cost_ceiling_usd: 0.0,
    score_contribution: 0.20,
    failure_fallback: 'use_deterministic_fallback',
    allowed_roles: ['judge'],
  },
  {
    id: 'decision_memo',
    label: 'DECISION MEMO',
    sequence: 7,
    turn_order: 'automated',
    evidence_access: true,
    token_ceiling: 0,
    cost_ceiling_usd: 0.0,
    score_contribution: 0.0,
    failure_fallback: 'generate_partial',
    allowed_roles: ['export'],
  },
];

const GRAPH_EDGES = [
  { from: 'opening',        to: 'rebuttal',       condition: 'all_completed_or_fallback' },
  { from: 'rebuttal',       to: 'cross_exam',      condition: 'all_completed_or_fallback' },
  { from: 'cross_exam',     to: 'risk_discovery',  condition: 'all_completed_or_fallback' },
  { from: 'risk_discovery', to: 'synthesis',       condition: 'all_completed_or_fallback' },
  { from: 'synthesis',      to: 'judge',           condition: 'synthesis_completed' },
  { from: 'judge',          to: 'decision_memo',   condition: 'scoring_completed' },
];

const CHECKPOINT_STAGES = new Set(['opening', 'rebuttal', 'cross_exam']);

/**
 * DebateGraphStateMachine
 * Implements the Microsoft Agent Framework 1.0 GraphFlow pattern.
 * Controls the debate state, validates transitions, and manages checkpoints.
 */
export class DebateGraphStateMachine {
  constructor(runId, topic, agentIds) {
    this.runId = runId;
    this.topic = topic;
    this.agentIds = agentIds; // participating non-moderator agent IDs

    this.currentNodeId = null;
    this.status = 'idle'; // idle | running | paused | completed | error

    // Outputs indexed by nodeId → array of agent output objects
    this.outputs = {};
    GRAPH_NODES.forEach(n => { this.outputs[n.id] = []; });

    this.startedAt = null;
    this.completedAt = null;
    this.totalCostUsd = 0;
    this.totalTokens = 0;
    this.checkpoints = {};

    this._listeners = {};
  }

  // ── EVENT BUS ─────────────────────────────────────────────────────────
  on(event, fn) {
    if (!this._listeners[event]) this._listeners[event] = [];
    this._listeners[event].push(fn);
  }

  _emit(event, data) {
    (this._listeners[event] || []).forEach(fn => fn(data));
  }

  // ── GRAPH NAVIGATION ──────────────────────────────────────────────────
  getNode(nodeId) {
    return GRAPH_NODES.find(n => n.id === nodeId) || null;
  }

  getCurrentNode() {
    return this.currentNodeId ? this.getNode(this.currentNodeId) : null;
  }

  getNextNodeId(currentId) {
    const edge = GRAPH_EDGES.find(e => e.from === currentId);
    return edge ? edge.to : null;
  }

  canAdvance(nodeId) {
    const outputs = this.outputs[nodeId] || [];
    const node = this.getNode(nodeId);
    if (!node) return false;
    if (node.turn_order === 'automated') return true;
    if (node.turn_order === 'moderator_only') return outputs.length >= 1;
    // For sequential/moderator_then_respondents: all agents must have submitted or been marked as fallback
    const expected = node.allowed_roles.includes('moderator')
      ? this.agentIds.length + 1
      : this.agentIds.length;
    return outputs.length >= expected;
  }

  // ── STATE TRANSITIONS ─────────────────────────────────────────────────
  start() {
    if (this.status !== 'idle') throw new Error(`Cannot start: status is ${this.status}`);
    this.status = 'running';
    this.startedAt = Date.now();
    this.currentNodeId = 'opening';
    this._emit('stateChange', { status: 'running', node: 'opening' });
    this._emit('nodeEnter', { nodeId: 'opening', node: this.getNode('opening') });
  }

  advance() {
    if (this.status !== 'running') throw new Error(`Cannot advance: status is ${this.status}`);
    if (!this.canAdvance(this.currentNodeId)) {
      throw new Error(`Node ${this.currentNodeId} not ready to advance`);
    }

    if (CHECKPOINT_STAGES.has(this.currentNodeId)) {
      this._saveCheckpoint(this.currentNodeId);
    }

    const nextId = this.getNextNodeId(this.currentNodeId);
    if (!nextId) {
      this.status = 'completed';
      this.completedAt = Date.now();
      this._emit('stateChange', { status: 'completed' });
      this._emit('complete', { runId: this.runId, durationMs: this.completedAt - this.startedAt });
      return null;
    }

    const prevId = this.currentNodeId;
    this.currentNodeId = nextId;
    this._emit('nodeExit', { nodeId: prevId });
    this._emit('nodeEnter', { nodeId: nextId, node: this.getNode(nextId) });
    this._emit('stateChange', { status: 'running', node: nextId });
    return nextId;
  }

  // ── OUTPUT RECORDING ──────────────────────────────────────────────────
  recordOutput(nodeId, agentId, output) {
    const node = this.getNode(nodeId);
    if (!node) throw new Error(`Unknown node: ${nodeId}`);
    if (nodeId !== this.currentNodeId) {
      throw new Error(`Recording output for ${nodeId} but current node is ${this.currentNodeId}`);
    }

    // Track costs
    if (output.tokens_used) this.totalTokens += output.tokens_used;
    if (output.cost_usd) this.totalCostUsd += output.cost_usd;

    const entry = { agentId, ...output, recordedAt: Date.now() };
    this.outputs[nodeId].push(entry);
    this._emit('outputRecorded', { nodeId, agentId, output: entry });

    // Auto-advance automated nodes
    if (node.turn_order === 'automated') {
      this.advance();
    }
  }

  recordFallback(nodeId, agentId, reason) {
    this.recordOutput(nodeId, agentId, {
      fallback: true,
      reason,
      text: `[FALLBACK: ${reason}]`,
      tokens_used: 0,
      latency_ms: 0,
    });
  }

  // ── CHECKPOINTING ─────────────────────────────────────────────────────
  _saveCheckpoint(nodeId) {
    const checkpoint = {
      runId: this.runId,
      topic: this.topic,
      nodeId,
      savedAt: Date.now(),
      outputs: JSON.parse(JSON.stringify(this.outputs)),
      totalTokens: this.totalTokens,
      totalCostUsd: this.totalCostUsd,
    };
    this.checkpoints[nodeId] = checkpoint;

    const key = `botcast_checkpoint_${this.runId}_${nodeId}`;
    try {
      localStorage.setItem(key, JSON.stringify(checkpoint));
    } catch (_) {
      // Node.js environment — caller must handle file persistence
    }
    this._emit('checkpoint', { nodeId, checkpoint });
  }

  restoreFromCheckpoint(nodeId) {
    const key = `botcast_checkpoint_${this.runId}_${nodeId}`;
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return false;
      const cp = JSON.parse(raw);
      this.outputs = cp.outputs;
      this.totalTokens = cp.totalTokens;
      this.totalCostUsd = cp.totalCostUsd;
      this.currentNodeId = this.getNextNodeId(nodeId);
      this.status = 'running';
      this._emit('restored', { fromCheckpoint: nodeId });
      return true;
    } catch (_) {
      return false;
    }
  }

  // ── SERIALIZATION ─────────────────────────────────────────────────────
  toJSON() {
    return {
      runId: this.runId,
      topic: this.topic,
      agentIds: this.agentIds,
      status: this.status,
      currentNodeId: this.currentNodeId,
      startedAt: this.startedAt,
      completedAt: this.completedAt,
      totalTokens: this.totalTokens,
      totalCostUsd: this.totalCostUsd,
      outputs: this.outputs,
    };
  }

  // ── PROGRESS ──────────────────────────────────────────────────────────
  getProgress() {
    const currentIdx = GRAPH_NODES.findIndex(n => n.id === this.currentNodeId);
    return {
      current: this.currentNodeId,
      currentLabel: this.getCurrentNode()?.label || '',
      step: currentIdx + 1,
      total: GRAPH_NODES.length,
      percent: this.status === 'completed' ? 100 : Math.round(((currentIdx) / GRAPH_NODES.length) * 100),
      nodes: GRAPH_NODES.map(n => ({
        id: n.id,
        label: n.label,
        status: this._getNodeStatus(n.id),
      })),
    };
  }

  _getNodeStatus(nodeId) {
    if (this.status === 'completed') return 'completed';
    if (nodeId === this.currentNodeId) return 'active';
    const nodeIdx = GRAPH_NODES.findIndex(n => n.id === nodeId);
    const currentIdx = GRAPH_NODES.findIndex(n => n.id === this.currentNodeId);
    if (nodeIdx < currentIdx) return 'completed';
    return 'pending';
  }
}
