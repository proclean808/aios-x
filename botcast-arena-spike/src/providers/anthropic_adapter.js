/**
 * BotCast Arena · Anthropic Direct Adapter
 * No LiteLLM. Direct fetch to Anthropic Messages API.
 * Supports: claude-sonnet-4-6, claude-opus-4-7, claude-haiku-4-5
 */

const ANTHROPIC_ENDPOINT = 'https://api.anthropic.com/v1/messages';
const ANTHROPIC_VERSION = '2023-06-01';

export class AnthropicAdapter {
  constructor(apiKey) {
    if (!apiKey) throw new Error('Anthropic API key required');
    this.apiKey = apiKey;
    this.provider = 'anthropic';
  }

  async call({ model = 'claude-sonnet-4-6', messages, maxTokens = 400, temperature = 0.7 }) {
    const startMs = Date.now();

    // Separate system prompt from conversation messages
    let systemPrompt = '';
    const chatMessages = [];
    for (const msg of messages) {
      if (msg.role === 'system') {
        systemPrompt = msg.content;
      } else {
        chatMessages.push({ role: msg.role, content: msg.content });
      }
    }

    const body = {
      model,
      max_tokens: maxTokens,
      temperature,
      messages: chatMessages,
    };
    if (systemPrompt) body.system = systemPrompt;

    const res = await fetch(ANTHROPIC_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': ANTHROPIC_VERSION,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: { message: res.statusText } }));
      throw new Error(`Anthropic ${res.status}: ${err.error?.message || res.statusText}`);
    }

    const data = await res.json();
    const latencyMs = Date.now() - startMs;
    const content = data.content?.[0]?.text || '';
    const inputTokens = data.usage?.input_tokens || 0;
    const outputTokens = data.usage?.output_tokens || 0;
    const tokensUsed = inputTokens + outputTokens;

    return {
      text: content,
      tokens_used: tokensUsed,
      input_tokens: inputTokens,
      output_tokens: outputTokens,
      latency_ms: latencyMs,
      provider: this.provider,
      model,
      cost_usd: estimateCostAnthropic(model, inputTokens, outputTokens),
    };
  }
}

function estimateCostAnthropic(model, inputTokens, outputTokens) {
  const rates = {
    'claude-sonnet-4-6':          { in: 0.000003,  out: 0.000015 },
    'claude-opus-4-7':            { in: 0.000015,  out: 0.000075 },
    'claude-haiku-4-5-20251001':  { in: 0.0000008, out: 0.000004 },
  };
  const r = rates[model] || rates['claude-sonnet-4-6'];
  return r.in * inputTokens + r.out * outputTokens;
}
