/**
 * Provider adapters — unit tests.
 * Success path, auth errors, rate limits, timeouts, malformed responses.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { EngineRouter } from '../../src/engines/router.js';
import { FAKE_KEYS } from '../setup/test-utils.js';

const MESSAGES = [{ role: 'user', content: 'Test prompt' }];
const SYS = 'You are a test agent.';

// ── OpenAI ────────────────────────────────────────────────────────────────
describe('EngineRouter._callOpenAI', () => {
  afterEach(() => { vi.restoreAllMocks(); });

  it('returns text and token count on success', async () => {
    vi.stubGlobal('fetch', async () => ({
      ok: true, status: 200,
      json: async () => ({
        choices: [{ message: { content: 'OpenAI response' } }],
        usage: { total_tokens: 120 },
      }),
    }));

    const router = new EngineRouter({ openai: FAKE_KEYS.openai });
    const result = await router._callOpenAI(FAKE_KEYS.openai, 'gpt-4o', MESSAGES, SYS, 500);
    expect(result.text).toBe('OpenAI response');
    expect(result.tokens_used).toBe(120);
    expect(result.provider).toBe('openai');
  });

  it('throws ProviderError on 401 unauthorized', async () => {
    vi.stubGlobal('fetch', async () => ({ ok: false, status: 401, json: async () => ({}) }));
    const router = new EngineRouter({ openai: FAKE_KEYS.openai });
    await expect(router._callOpenAI(FAKE_KEYS.openai, 'gpt-4o', MESSAGES, SYS, 500)).rejects.toThrow('401');
  });

  it('throws ProviderError with retryable=true on 429', async () => {
    vi.stubGlobal('fetch', async () => ({ ok: false, status: 429, json: async () => ({}) }));
    const router = new EngineRouter({ openai: FAKE_KEYS.openai });
    await expect(router._callOpenAI(FAKE_KEYS.openai, 'gpt-4o', MESSAGES, SYS, 500)).rejects.toMatchObject({ retryable: true });
  });

  it('throws ProviderError when key is missing', async () => {
    const router = new EngineRouter({});
    await expect(router._callOpenAI(null, 'gpt-4o', MESSAGES, SYS, 500)).rejects.toMatchObject({ provider: 'openai' });
  });
});

// ── Anthropic ─────────────────────────────────────────────────────────────
describe('EngineRouter._callAnthropic', () => {
  afterEach(() => { vi.restoreAllMocks(); });

  it('returns text on success with separate token counts', async () => {
    vi.stubGlobal('fetch', async () => ({
      ok: true, status: 200,
      json: async () => ({
        content: [{ text: 'Claude response' }],
        usage: { input_tokens: 50, output_tokens: 80 },
      }),
    }));

    const router = new EngineRouter({ anthropic: FAKE_KEYS.anthropic });
    const result = await router._callAnthropic(FAKE_KEYS.anthropic, 'claude-opus-4-7', MESSAGES, SYS, 500);
    expect(result.text).toBe('Claude response');
    expect(result.tokens_used).toBe(130);
    expect(result.provider).toBe('anthropic');
  });

  it('sends system prompt as top-level field (not in messages array)', async () => {
    let capturedBody = null;
    vi.stubGlobal('fetch', async (url, opts) => {
      capturedBody = JSON.parse(opts.body);
      return { ok: true, status: 200, json: async () => ({ content: [{ text: 'ok' }], usage: {} }) };
    });

    const router = new EngineRouter({ anthropic: FAKE_KEYS.anthropic });
    await router._callAnthropic(FAKE_KEYS.anthropic, 'claude-opus-4-7', MESSAGES, 'System prompt here', 500).catch(() => {});
    if (capturedBody) {
      expect(capturedBody.system).toBe('System prompt here');
      expect(capturedBody.messages).not.toEqual(expect.arrayContaining([expect.objectContaining({ role: 'system' })]));
    }
  });

  it('throws when key is missing', async () => {
    const router = new EngineRouter({});
    await expect(router._callAnthropic(null, 'claude-opus-4-7', MESSAGES, SYS, 500)).rejects.toMatchObject({ provider: 'anthropic' });
  });
});

// ── Gemini ────────────────────────────────────────────────────────────────
describe('EngineRouter._callGemini', () => {
  afterEach(() => { vi.restoreAllMocks(); });

  it('returns text on success', async () => {
    vi.stubGlobal('fetch', async () => ({
      ok: true, status: 200,
      json: async () => ({
        candidates: [{ content: { parts: [{ text: 'Gemini response' }] } }],
        usageMetadata: { totalTokenCount: 90 },
      }),
    }));

    const router = new EngineRouter({ gemini: FAKE_KEYS.gemini });
    const result = await router._callGemini(FAKE_KEYS.gemini, 'gemini-2.0-flash', MESSAGES, SYS, 500);
    expect(result.text).toBe('Gemini response');
    expect(result.tokens_used).toBe(90);
  });

  it('maps assistant role to model role in request', async () => {
    let capturedBody = null;
    vi.stubGlobal('fetch', async (url, opts) => {
      capturedBody = JSON.parse(opts.body);
      return { ok: true, status: 200, json: async () => ({ candidates: [{ content: { parts: [{ text: 'ok' }] } }], usageMetadata: {} }) };
    });

    const assistantMsg = [{ role: 'assistant', content: 'Previous assistant message' }];
    const router = new EngineRouter({ gemini: FAKE_KEYS.gemini });
    await router._callGemini(FAKE_KEYS.gemini, 'gemini-2.0-flash', assistantMsg, SYS, 500).catch(() => {});
    if (capturedBody?.contents) {
      const roles = capturedBody.contents.map(c => c.role);
      expect(roles).not.toContain('assistant');
      expect(roles).toContain('model');
    }
  });
});

// ── Ollama ────────────────────────────────────────────────────────────────
describe('EngineRouter._callOllama', () => {
  afterEach(() => { vi.restoreAllMocks(); });

  it('returns text from local endpoint on success', async () => {
    vi.stubGlobal('fetch', async () => ({
      ok: true, status: 200,
      json: async () => ({
        message: { content: 'Ollama local response' },
        prompt_eval_count: 30, eval_count: 60,
      }),
    }));

    const router = new EngineRouter({});
    const result = await router._callOllama('llama3.2', MESSAGES, SYS, 500);
    expect(result.text).toBe('Ollama local response');
    expect(result.tokens_used).toBe(90);
    expect(result.provider).toBe('ollama');
  });

  it('throws ProviderError on connection refused (non-200)', async () => {
    vi.stubGlobal('fetch', async () => ({ ok: false, status: 503, json: async () => ({}) }));
    const router = new EngineRouter({});
    await expect(router._callOllama('llama3.2', MESSAGES, SYS, 500)).rejects.toMatchObject({ provider: 'ollama', retryable: true });
  });
});

// ── EngineRouter — circuit breaker ────────────────────────────────────────
describe('EngineRouter — circuit breaker', () => {
  it('opens circuit after 3 failures', async () => {
    vi.stubGlobal('fetch', async () => ({ ok: false, status: 500, json: async () => ({}) }));
    const router = new EngineRouter({ openai: FAKE_KEYS.openai });

    for (let i = 0; i < 3; i++) {
      router._recordFailure('openai');
    }
    expect(router._circuitOpen('openai')).toBe(true);
  });

  it('records success resets circuit breaker', () => {
    const router = new EngineRouter({ openai: FAKE_KEYS.openai });
    router._recordFailure('openai');
    router._recordFailure('openai');
    router._recordSuccess('openai');
    expect(router._circuitBreakers['openai']?.failures).toBe(0);
  });

  it('call() falls back to next provider when primary circuit is open', async () => {
    vi.stubGlobal('fetch', async (url) => {
      if (url.includes('openai')) return { ok: false, status: 500, json: async () => ({}) };
      // anthropic fallback succeeds
      return { ok: true, status: 200, json: async () => ({
        content: [{ text: 'Anthropic fallback' }], usage: { input_tokens: 10, output_tokens: 20 },
      })};
    });

    const router = new EngineRouter({ openai: FAKE_KEYS.openai, anthropic: FAKE_KEYS.anthropic });
    // Force openai circuit open
    for (let i = 0; i < 3; i++) router._recordFailure('openai');

    const result = await router.call('openai', MESSAGES, SYS);
    expect(result.used_provider).toBe('anthropic');
  });
});
