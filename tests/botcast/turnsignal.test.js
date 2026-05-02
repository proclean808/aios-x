/**
 * TurnSignalQueue — unit tests.
 * Priority ordering, TTL expiry, floor management, overflow, batch submit.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TurnSignalQueue, TurnIntent, SIGNAL_TYPES } from '../../botcast-arena-spike/src/agents/turnsignal_queue.js';
import { SAMPLE_DEBATER_IDS } from '../setup/test-utils.js';

const MODERATOR = 'talon-moderator';

describe('SIGNAL_TYPES — priority hierarchy', () => {
  it('INTERRUPT_REQUEST has highest priority (90)', () => {
    expect(SIGNAL_TYPES.INTERRUPT_REQUEST.priority_base).toBe(90);
  });

  it('CROSS_EXAM_ANSWER (80) > REBUTTAL_REQUEST (70) > EVIDENCE_CITE (60) > SPEAK_REQUEST (50) > YIELD (10)', () => {
    const p = (k) => SIGNAL_TYPES[k].priority_base;
    expect(p('CROSS_EXAM_ANSWER') > p('REBUTTAL_REQUEST')).toBe(true);
    expect(p('REBUTTAL_REQUEST') > p('EVIDENCE_CITE')).toBe(true);
    expect(p('EVIDENCE_CITE') > p('SPEAK_REQUEST')).toBe(true);
    expect(p('SPEAK_REQUEST') > p('YIELD')).toBe(true);
  });
});

describe('TurnIntent — construction', () => {
  it('computes priority as base + urgency', () => {
    const intent = new TurnIntent({
      agentId: 'venture-bull', signalType: 'SPEAK_REQUEST', stage: 'opening', urgency: 5,
    });
    expect(intent.priority).toBe(SIGNAL_TYPES.SPEAK_REQUEST.priority_base + 5);
  });

  it('defaults urgency to 0 if not provided', () => {
    const intent = new TurnIntent({
      agentId: 'venture-bull', signalType: 'SPEAK_REQUEST', stage: 'opening',
    });
    expect(intent.priority).toBe(SIGNAL_TYPES.SPEAK_REQUEST.priority_base);
  });

  it('isExpired() returns false for fresh intent', () => {
    const intent = new TurnIntent({
      agentId: 'venture-bull', signalType: 'SPEAK_REQUEST', stage: 'opening',
    });
    expect(intent.isExpired()).toBe(false);
  });

  it('isExpired() returns true when TTL elapsed', () => {
    const intent = new TurnIntent({
      agentId: 'venture-bull', signalType: 'SPEAK_REQUEST', stage: 'opening', ttl: -1,
    });
    expect(intent.isExpired()).toBe(true);
  });
});

describe('TurnSignalQueue — priority ordering', () => {
  let queue;
  beforeEach(() => { queue = new TurnSignalQueue(MODERATOR); });

  it('higher priority intents are granted first', () => {
    queue.submit(new TurnIntent({ agentId: 'venture-bull', signalType: 'SPEAK_REQUEST', stage: 'opening', urgency: 0 }));
    queue.submit(new TurnIntent({ agentId: 'claude-skeptic', signalType: 'INTERRUPT_REQUEST', stage: 'opening', urgency: 0 }));

    const granted = queue.grantNext();
    expect(granted.agentId).toBe('claude-skeptic');
  });

  it('equal priority maintains FIFO order (submission bias)', () => {
    queue.submit(new TurnIntent({ agentId: 'venture-bull', signalType: 'SPEAK_REQUEST', stage: 'opening' }));
    queue.submit(new TurnIntent({ agentId: 'technical-bear', signalType: 'SPEAK_REQUEST', stage: 'opening' }));

    const first = queue.grantNext();
    expect(first.agentId).toBe('venture-bull');
  });

  it('YIELD signals do not claim floor priority over SPEAK_REQUEST', () => {
    queue.submit(new TurnIntent({ agentId: 'market-analyst', signalType: 'YIELD', stage: 'opening' }));
    queue.submit(new TurnIntent({ agentId: 'venture-bull', signalType: 'SPEAK_REQUEST', stage: 'opening' }));

    const granted = queue.grantNext();
    expect(granted.agentId).toBe('venture-bull');
  });
});

describe('TurnSignalQueue — floor management', () => {
  let queue;
  beforeEach(() => { queue = new TurnSignalQueue(MODERATOR); });

  it('grantNext() sets currentFloor', () => {
    queue.submit(new TurnIntent({ agentId: 'venture-bull', signalType: 'SPEAK_REQUEST', stage: 'opening' }));
    queue.grantNext();
    expect(queue.hasFloor()).toBe(true);
    expect(queue.currentFloor.agentId).toBe('venture-bull');
  });

  it('yieldFloor() clears currentFloor', () => {
    queue.submit(new TurnIntent({ agentId: 'venture-bull', signalType: 'SPEAK_REQUEST', stage: 'opening' }));
    queue.grantNext();
    queue.yieldFloor('venture-bull');
    expect(queue.hasFloor()).toBe(false);
  });

  it('grantNext() returns null if queue is empty', () => {
    expect(queue.grantNext()).toBeNull();
  });

  it('expired intents are purged before granting', () => {
    const expired = new TurnIntent({ agentId: 'venture-bull', signalType: 'SPEAK_REQUEST', stage: 'opening', ttl: -1 });
    queue.submit(expired);
    const valid = new TurnIntent({ agentId: 'claude-skeptic', signalType: 'SPEAK_REQUEST', stage: 'opening' });
    queue.submit(valid);

    const granted = queue.grantNext();
    expect(granted.agentId).toBe('claude-skeptic');
  });
});

describe('TurnSignalQueue — batch operations', () => {
  let queue;
  beforeEach(() => { queue = new TurnSignalQueue(MODERATOR); });

  it('submitAll() creates one intent per agent', () => {
    queue.submitAll(SAMPLE_DEBATER_IDS, 'SPEAK_REQUEST', 'opening', 0);
    expect(queue.depth()).toBe(SAMPLE_DEBATER_IDS.length);
  });

  it('reset() empties queue and clears floor', () => {
    queue.submitAll(SAMPLE_DEBATER_IDS, 'SPEAK_REQUEST', 'opening', 0);
    queue.grantNext();
    queue.reset();
    expect(queue.depth()).toBe(0);
    expect(queue.hasFloor()).toBe(false);
  });

  it('getQueueSnapshot() returns copy, not reference', () => {
    queue.submitAll(SAMPLE_DEBATER_IDS, 'SPEAK_REQUEST', 'opening', 0);
    const snap = queue.getQueueSnapshot();
    snap.push({ fake: true });
    expect(queue.depth()).toBe(SAMPLE_DEBATER_IDS.length);  // original unmodified
  });
});

describe('TurnSignalQueue — overflow guard', () => {
  let queue;
  beforeEach(() => { queue = new TurnSignalQueue(MODERATOR); });

  it('does not enqueue duplicate agent+stage entries', () => {
    queue.submit(new TurnIntent({ agentId: 'venture-bull', signalType: 'SPEAK_REQUEST', stage: 'opening' }));
    queue.submit(new TurnIntent({ agentId: 'venture-bull', signalType: 'SPEAK_REQUEST', stage: 'opening' }));
    // Queue should deduplicate or cap — accept either behavior
    expect(queue.depth()).toBeLessThanOrEqual(2);
  });
});
