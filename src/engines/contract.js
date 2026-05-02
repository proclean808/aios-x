/**
 * Engine contract — interface all engine integrations must satisfy.
 * Not enforced at runtime; serves as documentation and type anchor.
 *
 * engine.createRun({ topic, persona_ids, project_id }) → { run_id, ... }
 * engine.executeFull(runId) → { transcript, scorecard, decision_memo }
 * engine.getStatus(runId) → { status, current_stage, progress_pct }
 * engine.cancel(runId) → void
 */

export const ENGINE_TYPES = Object.freeze({
  BOTCAST:     'botcast',
  OPENMYTHOS:  'openmythos',
  DEBATE:      'debate',
  PIPELINE:    'pipeline',
});

export const RUN_STATUS = Object.freeze({
  PENDING:     'pending',
  RUNNING:     'running',
  COMPLETED:   'completed',
  FAILED:      'failed',
  CANCELLED:   'cancelled',
  CHECKPOINT:  'checkpoint',
});

export class EngineError extends Error {
  constructor(message, { code, runId, stage, recoverable = false } = {}) {
    super(message);
    this.name = 'EngineError';
    this.code = code;
    this.runId = runId;
    this.stage = stage;
    this.recoverable = recoverable;
  }
}

export class ProviderError extends Error {
  constructor(message, { provider, statusCode, retryable = false } = {}) {
    super(message);
    this.name = 'ProviderError';
    this.provider = provider;
    this.statusCode = statusCode;
    this.retryable = retryable;
  }
}
