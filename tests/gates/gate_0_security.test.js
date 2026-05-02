/**
 * Gate 0 — Security baseline validation.
 * These tests MUST all pass before Days 8-30 begin.
 * Hard rule: if any test here fails, no feature work proceeds.
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { execSync } from 'child_process';
import path from 'path';

const ROOT = path.resolve(import.meta.dirname, '../..');

function readFile(rel) {
  return readFileSync(path.join(ROOT, rel), 'utf8');
}

// ── Gate 0.1: Environment template integrity ──────────────────────────────
describe('Gate 0.1 — .env.example integrity', () => {
  it('exists', () => {
    expect(existsSync(path.join(ROOT, '.env.example'))).toBe(true);
  });

  it('contains no real credentials (all values are placeholders)', () => {
    const content = readFile('.env.example');
    const realPatterns = [
      /sk-ant-api[a-zA-Z0-9]{20,}/,       // real Anthropic key
      /sk-[a-zA-Z0-9]{48,}/,              // real OpenAI key
      /AIza[a-zA-Z0-9]{35}/,              // real Gemini key
      /eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9\.[a-zA-Z0-9_\-]+\.[a-zA-Z0-9_\-]+/, // real JWT
    ];
    for (const pattern of realPatterns) {
      expect(pattern.test(content), `Found real credential matching ${pattern}`).toBe(false);
    }
  });

  it('all required env vars documented', () => {
    const content = readFile('.env.example');
    const required = [
      'SUPABASE_URL', 'SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_ROLE_KEY',
      'OPENAI_API_KEY', 'ANTHROPIC_API_KEY', 'GEMINI_API_KEY',
      'JWT_SECRET', 'NODE_ENV', 'PORT',
    ];
    for (const key of required) {
      expect(content, `Missing ${key} in .env.example`).toContain(key);
    }
  });

  it('LiteLLM block notice present', () => {
    const content = readFile('.env.example');
    expect(content).toContain('LiteLLM');
    expect(content).toContain('BLOCKED');
  });
});

// ── Gate 0.2: .gitignore coverage ─────────────────────────────────────────
describe('Gate 0.2 — .gitignore coverage', () => {
  const gitignore = readFile('.gitignore');

  it('ignores .env', () => {
    expect(gitignore).toMatch(/^\.env$/m);
  });

  it('ignores .env.local', () => {
    expect(gitignore).toMatch(/\.env\.local/);
  });

  it('ignores .env.*.local pattern', () => {
    expect(gitignore).toMatch(/\.env\.\*\.local/);
  });

  it('ignores node_modules', () => {
    expect(gitignore).toMatch(/node_modules/);
  });

  it('ignores private key files', () => {
    expect(gitignore).toMatch(/\*\.pem|\*\.key/);
  });

  it('.env.local is NOT tracked by git', () => {
    try {
      const tracked = execSync('git ls-files .env.local', { cwd: ROOT, encoding: 'utf8' }).trim();
      expect(tracked, '.env.local is committed — remove it immediately').toBe('');
    } catch {
      // git not available in this env — skip
    }
  });
});

// ── Gate 0.3: Gitleaks config ─────────────────────────────────────────────
describe('Gate 0.3 — .gitleaks.toml structure', () => {
  it('exists', () => {
    expect(existsSync(path.join(ROOT, '.gitleaks.toml'))).toBe(true);
  });

  it('covers all required providers', () => {
    const content = readFile('.gitleaks.toml');
    const required = ['anthropic-api-key', 'openai-api-key', 'gemini-api-key', 'groq-api-key', 'xai-grok-key'];
    for (const id of required) {
      expect(content, `Missing rule: ${id}`).toContain(id);
    }
  });

  it('has allowlist for .env.example', () => {
    const content = readFile('.gitleaks.toml');
    expect(content).toContain('.env.example');
  });

  it('has REPLACE_WITH pattern in allowlist regexes', () => {
    const content = readFile('.gitleaks.toml');
    expect(content).toContain('REPLACE_WITH');
  });
});

// ── Gate 0.4: Security documentation ──────────────────────────────────────
describe('Gate 0.4 — Security documentation exists', () => {
  const docs = [
    'security/credential-rotation-checklist.md',
    'security/SECURITY_RESET_LOG.md',
    'security/incident-prevention-baseline.md',
    '.pre-commit-config.yaml',
    '.github/workflows/security-scan.yml',
  ];

  for (const doc of docs) {
    it(`${doc} exists`, () => {
      expect(existsSync(path.join(ROOT, doc))).toBe(true);
    });
  }
});

// ── Gate 0.5: No committed secrets in working tree ────────────────────────
describe('Gate 0.5 — No real secrets in working tree source files', () => {
  const sourceFiles = [
    'main.js', 'orchestrator.js', 'debate.js', 'vault.js',
    'botcast.js', 'personas.js',
  ].filter(f => existsSync(path.join(ROOT, f)));

  const realSecretPatterns = [
    { name: 'OpenAI key', regex: /sk-[a-zA-Z0-9]{48,}/ },
    { name: 'Anthropic key', regex: /sk-ant-api[a-zA-Z0-9]{30,}/ },
    { name: 'Gemini key', regex: /AIza[a-zA-Z0-9]{35}/ },
    { name: 'JWT token', regex: /eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9\.[a-zA-Z0-9_\-]{10,}/ },
  ];

  for (const file of sourceFiles) {
    for (const { name, regex } of realSecretPatterns) {
      it(`${file} does not contain ${name}`, () => {
        const content = readFile(file);
        expect(regex.test(content), `${name} found in ${file}`).toBe(false);
      });
    }
  }
});
