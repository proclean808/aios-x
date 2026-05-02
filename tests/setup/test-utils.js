/**
 * Shared test utilities for BotCast Arena / PlatFormula.ONE test suite.
 * gitleaks allowlisted — all keys are clearly fake test values.
 */

// Fake API keys for mock tests (never real credentials)
export const FAKE_KEYS = {
  openai:    'sk-test-fakeopenaikey000000000000000000',
  anthropic: 'sk-ant-test-fakeanthropickey00000000000000',
  gemini:    'AIzaFakeGeminiKey000000000000000000000',
  groq:      'gsk_fakegroqkey00000000000000000000',
};

export const SAMPLE_TOPIC = 'Is sovereign AI infrastructure a strategic necessity for enterprises in 2026?';

export const SAMPLE_PERSONA_IDS = [
  'claude-skeptic', 'venture-bull', 'technical-bear',
  'market-analyst', 'local-redteam', 'talon-moderator',
];

export const SAMPLE_DEBATER_IDS = SAMPLE_PERSONA_IDS.filter(id => id !== 'talon-moderator');

// Build a minimal stage outputs fixture
export function buildStageOutputs(stageIds = ['opening', 'rebuttal']) {
  const outputs = {};
  for (const stage of stageIds) {
    outputs[stage] = SAMPLE_DEBATER_IDS.map(id => ({
      persona_id: id,
      text: `[test] ${id} ${stage} argument about ${SAMPLE_TOPIC.slice(0, 40)}`,
      tokens_used: 100,
      used_provider: 'openai',
    }));
  }
  return outputs;
}

// Minimal mock Supabase client
export function mockSupabase(overrides = {}) {
  const rows = [];
  return {
    from: (table) => ({
      insert: (data) => ({
        select: () => ({ single: async () => ({ data: { id: 'uuid-test', ...data }, error: null }) }),
      }),
      select: (cols) => ({
        eq: () => ({
          single: async () => ({ data: rows[0] || null, error: null }),
          limit: () => ({ data: rows, error: null }),
        }),
        order: () => ({ limit: () => ({ data: rows, error: null }) }),
        limit: () => ({ data: rows, error: null }),
      }),
      update: (data) => ({
        eq: () => ({ data: { ...data }, error: null }),
      }),
    }),
    auth: {
      getUser: async (token) => ({
        data: { user: token === 'valid-token' ? { id: 'user-123' } : null },
        error: token === 'valid-token' ? null : { message: 'Invalid token' },
      }),
    },
    ...overrides,
  };
}

// Mock fetch that returns a canned response
export function mockFetch(statusCode, body) {
  return async () => ({
    ok: statusCode >= 200 && statusCode < 300,
    status: statusCode,
    json: async () => body,
    text: async () => JSON.stringify(body),
  });
}

// Create a mock EngineRouter that resolves with static text
export function mockEngineRouter(responseText = '[mock response]', shouldFail = false) {
  return {
    call: async (provider, messages, systemPrompt) => {
      if (shouldFail) throw new Error('Mock provider failure');
      return {
        text: responseText,
        tokens_used: 50,
        used_provider: provider,
        provider,
        model: 'mock-model',
      };
    },
    getCircuitState: () => ({}),
    _circuitBreakers: {},
    _recordFailure: () => {},
    _recordSuccess: () => {},
  };
}

// Wait helper for async tests
export function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
