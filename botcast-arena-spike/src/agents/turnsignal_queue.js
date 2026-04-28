/**
 * BotCast Arena · TurnSignal Protocol
 * Version: 1.0
 *
 * Out-of-band intent signaling for deterministic multi-agent turn-taking.
 * Agents submit TurnIntent signals via the metadata channel.
 * TALON Moderator dequeues and grants floor — no VAD collisions possible.
 *
 * Core IP: Venture Vision / PlatFormula.ONE
 */

export const SIGNAL_TYPES = {
  SPEAK_REQUEST:     { priority_base: 50, description: 'Standard floor request' },
  EVIDENCE_CITE:     { priority_base: 60, description: 'Request to cite evidence from MemSmart' },
  REBUTTAL_REQUEST:  { priority_base: 70, description: 'Urgent rebuttal of a specific claim' },
  CROSS_EXAM_ANSWER: { priority_base: 80, description: 'Response to cross-examination question' },
  YIELD:             { priority_base: 10, description: 'Voluntarily yield the floor' },
  INTERRUPT_REQUEST: { priority_base: 90, description: 'Critical factual correction only' },
};

let _signalCounter = 0;

/**
 * TurnIntent — a single floor request signal
 */
export class TurnIntent {
  constructor({ agentId, signalType, stage, urgency = 0, payload = null, priority = null }) {
    this.id = `ts_${Date.now()}_${++_signalCounter}`;
    this.agentId = agentId;
    this.signalType = signalType;
    this.stage = stage;
    this.urgency = urgency; // 0-100, boosts base priority
    this.payload = payload; // optional: { targetClaimId, evidenceKey, questionId }
    this.createdAt = Date.now();
    this.ttlMs = 30000;

    const base = SIGNAL_TYPES[signalType]?.priority_base ?? 50;
    this.priority = priority ?? (base + urgency);
  }

  isExpired() {
    return Date.now() - this.createdAt > this.ttlMs;
  }

  toMetadata() {
    return {
      signal_id: this.id,
      agent_id: this.agentId,
      signal_type: this.signalType,
      stage: this.stage,
      priority: this.priority,
      created_at: this.createdAt,
      payload: this.payload,
    };
  }
}

/**
 * TurnSignalQueue — priority queue managed by the TALON Moderator
 *
 * Policy: priority-FIFO. Higher priority signals are dequeued first.
 * Equal-priority signals are served in FIFO order.
 * VAD-bypass: no acoustic silence required for turn transitions.
 */
export class TurnSignalQueue {
  constructor(moderatorId = 'talon-moderator') {
    this.moderatorId = moderatorId;
    this.queue = [];
    this.history = []; // all processed signals
    this.currentFloor = null; // which agentId currently has the floor
    this.floorGrantedAt = null;
    this._listeners = {};
    this._maxQueueDepth = 10;
  }

  // ── SIGNAL SUBMISSION ─────────────────────────────────────────────────
  submit(intent) {
    if (!(intent instanceof TurnIntent)) {
      throw new Error('submit() requires a TurnIntent instance');
    }
    if (this.queue.length >= this._maxQueueDepth) {
      this._emit('queueFull', { dropped: intent });
      return false;
    }

    this.queue.push(intent);
    this.queue.sort((a, b) => b.priority - a.priority); // highest priority first
    this._emit('signalSubmitted', { intent: intent.toMetadata(), queueDepth: this.queue.length });
    return true;
  }

  // ── FLOOR MANAGEMENT (TALON only) ─────────────────────────────────────
  grantNext() {
    // Purge expired signals first
    this.queue = this.queue.filter(s => !s.isExpired());

    if (this.queue.length === 0) return null;

    const intent = this.queue.shift();
    this.currentFloor = intent.agentId;
    this.floorGrantedAt = Date.now();

    const grant = {
      signal_id: intent.id,
      agent_id: intent.agentId,
      signal_type: intent.signalType,
      stage: intent.stage,
      priority: intent.priority,
      granted_by: this.moderatorId,
      granted_at_ms: this.floorGrantedAt,
      payload: intent.payload,
    };

    this.history.push(grant);
    this._emit('floorGranted', grant);
    return grant;
  }

  yieldFloor(agentId) {
    if (this.currentFloor !== agentId) return false;
    const holdMs = Date.now() - (this.floorGrantedAt || 0);
    this._emit('floorYielded', { agentId, holdMs });
    this.currentFloor = null;
    this.floorGrantedAt = null;
    return true;
  }

  // ── BATCH SUBMISSION HELPERS ──────────────────────────────────────────
  submitAll(agentIds, signalType, stage, urgency = 0) {
    agentIds.forEach((id, idx) => {
      this.submit(new TurnIntent({
        agentId: id,
        signalType,
        stage,
        urgency,
        priority: SIGNAL_TYPES[signalType]?.priority_base - idx, // slight FIFO bias within same type
      }));
    });
  }

  // ── STATE ─────────────────────────────────────────────────────────────
  depth() { return this.queue.length; }
  hasFloor() { return this.currentFloor !== null; }
  getQueueSnapshot() { return this.queue.map(s => s.toMetadata()); }

  reset() {
    this.queue = [];
    this.currentFloor = null;
    this.floorGrantedAt = null;
    this._emit('reset', {});
  }

  // ── EVENT BUS ─────────────────────────────────────────────────────────
  on(event, fn) {
    if (!this._listeners[event]) this._listeners[event] = [];
    this._listeners[event].push(fn);
  }

  _emit(event, data) {
    (this._listeners[event] || []).forEach(fn => fn(data));
  }

  toJSON() {
    return {
      moderatorId: this.moderatorId,
      currentFloor: this.currentFloor,
      queueDepth: this.queue.length,
      queue: this.getQueueSnapshot(),
      historyLength: this.history.length,
    };
  }
}
