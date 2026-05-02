/**
 * Gate 1 — Foundation layer validation.
 * Verifies core scaffolding is in place before feature development.
 */

import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'fs';
import path from 'path';

const ROOT = path.resolve(import.meta.dirname, '../..');

function exists(rel) { return existsSync(path.join(ROOT, rel)); }
function read(rel) { return readFileSync(path.join(ROOT, rel), 'utf8'); }

// ── Gate 1.1: Spike build artifacts ──────────────────────────────────────
describe('Gate 1.1 — Spike build artifacts present', () => {
  const spikeFiles = [
    'botcast-arena-spike/debate_graph.yaml',
    'botcast-arena-spike/agents.yaml',
    'botcast-arena-spike/evidence_packet.md',
    'botcast-arena-spike/src/graph/debate_graph.js',
    'botcast-arena-spike/src/agents/turnsignal_queue.js',
    'botcast-arena-spike/src/agents/persona_registry.js',
    'botcast-arena-spike/src/providers/openai_adapter.js',
    'botcast-arena-spike/src/providers/anthropic_adapter.js',
    'botcast-arena-spike/src/providers/gemini_adapter.js',
    'botcast-arena-spike/src/providers/ollama_adapter.js',
    'botcast-arena-spike/src/providers/local_cluster_adapter.js',
    'botcast-arena-spike/src/judge/judge_engine.js',
    'botcast-arena-spike/src/exports/artifact_exporter.js',
  ];

  for (const f of spikeFiles) {
    it(`${f} exists`, () => expect(exists(f)).toBe(true));
  }
});

// ── Gate 1.2: Frontend BotCast integration ────────────────────────────────
describe('Gate 1.2 — Frontend BotCast files present', () => {
  const frontendFiles = ['personas.js', 'botcast.js', 'index.html', 'main.js'];
  for (const f of frontendFiles) {
    it(`${f} exists`, () => expect(exists(f)).toBe(true));
  }

  it('index.html includes botcast panel', () => {
    const html = read('index.html');
    expect(html).toContain('panel-botcast');
  });

  it('index.html includes personas.js script', () => {
    const html = read('index.html');
    expect(html).toContain('personas.js');
  });

  it('index.html includes botcast.js script', () => {
    const html = read('index.html');
    expect(html).toContain('botcast.js');
  });

  it('main.js initializes BotCast', () => {
    const js = read('main.js');
    expect(js).toContain('initBotcast');
  });
});

// ── Gate 1.3: Database migrations complete ────────────────────────────────
describe('Gate 1.3 — All database migrations present', () => {
  const migrations = [
    'db/migrations/001_orgs.sql',
    'db/migrations/002_workspaces.sql',
    'db/migrations/003_projects.sql',
    'db/migrations/004_artifacts.sql',
    'db/migrations/005_audit_events.sql',
    'db/migrations/006_engine_runs.sql',
    'db/migrations/007_billing.sql',
    'db/seed.sql',
  ];

  for (const m of migrations) {
    it(`${m} exists`, () => expect(exists(m)).toBe(true));
  }

  it('all user-facing tables have RLS enabled', () => {
    const tables = ['orgs', 'workspaces', 'projects', 'artifacts', 'engine_runs', 'billing_subscriptions'];
    for (const table of tables) {
      const migFile = migrations.find(m => read(m).includes(`TABLE IF NOT EXISTS public.${table}`));
      if (!migFile) continue;
      const content = read(migFile);
      const tableIdx = content.indexOf(`public.${table}`);
      const afterTable = content.slice(tableIdx);
      expect(afterTable, `${table} missing ENABLE ROW LEVEL SECURITY`).toContain('ENABLE ROW LEVEL SECURITY');
    }
  });
});

// ── Gate 1.4: API server layer ────────────────────────────────────────────
describe('Gate 1.4 — API server layer present', () => {
  const apiFiles = [
    'src/api/server.js',
    'src/api/middleware/auth.js',
    'src/api/middleware/ratelimit.js',
    'src/api/middleware/audit.js',
    'src/api/routes/health.js',
    'src/api/routes/orgs.js',
    'src/api/routes/workspaces.js',
    'src/api/routes/projects.js',
    'src/api/routes/artifacts.js',
    'src/api/routes/engines.js',
    'src/api/routes/audit.js',
  ];

  for (const f of apiFiles) {
    it(`${f} exists`, () => expect(exists(f)).toBe(true));
  }

  it('server.js applies auth middleware to all /api routes', () => {
    const content = read('src/api/server.js');
    expect(content).toContain('authMiddleware');
  });

  it('server.js applies rate limiting', () => {
    const content = read('src/api/server.js');
    expect(content).toContain('rateLimitMiddleware');
  });

  it('server.js applies helmet security headers', () => {
    const content = read('src/api/server.js');
    expect(content).toContain('helmet');
  });
});

// ── Gate 1.5: Engine integration layer ───────────────────────────────────
describe('Gate 1.5 — Engine integration layer present', () => {
  const engineFiles = [
    'src/engines/contract.js',
    'src/engines/router.js',
    'src/engines/botcast_integration.js',
    'src/engines/openmythos_integration.js',
  ];

  for (const f of engineFiles) {
    it(`${f} exists`, () => expect(exists(f)).toBe(true));
  }

  it('router.js has circuit breaker logic', () => {
    const content = read('src/engines/router.js');
    expect(content).toContain('circuitBreaker');
    expect(content).toContain('_THRESHOLD');
  });

  it('router.js does not import LiteLLM', () => {
    const content = read('src/engines/router.js');
    expect(content).not.toContain('litellm');
    expect(content).not.toContain('LiteLLM');
  });

  it('botcast_integration.js implements 7 debate stages', () => {
    const content = read('src/engines/botcast_integration.js');
    const stages = ['opening', 'rebuttal', 'cross_exam', 'risk_discovery', 'synthesis', 'judge', 'decision_memo'];
    for (const stage of stages) {
      expect(content, `Missing stage: ${stage}`).toContain(`'${stage}'`);
    }
  });
});
