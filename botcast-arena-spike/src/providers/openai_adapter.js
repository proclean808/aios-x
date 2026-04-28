/**
 * BotCast Arena · OpenAI Direct Adapter
 * No LiteLLM. Direct fetch to OpenAI API.
 * Supports: gpt-4o, gpt-4o-mini, gpt-4-turbo, o1-preview
 */

const OPENAI_ENDPOINT = 'https://api.openai.com/v1/chat/completions';

export class OpenAIAdapter {
  constructor(apiKey) {
    if (!apiKey) throw new Error('OpenAI API key required');
    this.apiKey = apiKey;
    this.provider = 'openai';
  }

  async call({ model = 'gpt-4o', messages, maxTokens = 400, temperature = 0.7 }) {
    const startMs = Date.now();

    const body = {
      model,
      messages,
      max_tokens: maxTokens,
      temperature,
    };

    const res = await fetch(OPENAI_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: { message: res.statusText } }));
      throw new Error(`OpenAI ${res.status}: ${err.error?.message || res.statusText}`);
    }

    const data = await res.json();
    const latencyMs = Date.now() - startMs;
    const content = data.choices?.[0]?.message?.content || '';
    const tokensUsed = data.usage?.total_tokens || 0;

    return {
      text: content,
      tokens_used: tokensUsed,
      latency_ms: latencyMs,
      provider: this.provider,
      model,
      cost_usd: estimateCostOpenAI(model, tokensUsed),
    };
  }
}

function estimateCostOpenAI(model, tokens) {
  const rates = {
    'gpt-4o':           0.000005,
    'gpt-4o-mini':      0.0000006,
    'gpt-4-turbo':      0.00001,
    'o1-preview':       0.000015,
  };
  return (rates[model] || 0.000005) * tokens;
}
