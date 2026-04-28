/**
 * BotCast Arena · Google Gemini Direct Adapter
 * No LiteLLM. Direct fetch to Gemini generateContent API.
 * Supports: gemini-2.0-flash, gemini-1.5-pro, gemini-1.5-flash
 */

const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';

export class GeminiAdapter {
  constructor(apiKey) {
    if (!apiKey) throw new Error('Gemini API key required');
    this.apiKey = apiKey;
    this.provider = 'gemini';
  }

  async call({ model = 'gemini-2.0-flash', messages, maxTokens = 400, temperature = 0.7 }) {
    const startMs = Date.now();
    const endpoint = `${GEMINI_BASE}/${model}:generateContent?key=${this.apiKey}`;

    // Convert chat messages to Gemini format
    let systemInstruction = null;
    const contents = [];
    for (const msg of messages) {
      if (msg.role === 'system') {
        systemInstruction = { parts: [{ text: msg.content }] };
      } else {
        contents.push({
          role: msg.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: msg.content }],
        });
      }
    }

    const body = {
      contents,
      generationConfig: {
        maxOutputTokens: maxTokens,
        temperature,
      },
    };
    if (systemInstruction) body.systemInstruction = systemInstruction;

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: { message: res.statusText } }));
      throw new Error(`Gemini ${res.status}: ${err.error?.message || res.statusText}`);
    }

    const data = await res.json();
    const latencyMs = Date.now() - startMs;
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const tokensUsed = (data.usageMetadata?.promptTokenCount || 0) +
                       (data.usageMetadata?.candidatesTokenCount || 0);

    return {
      text: content,
      tokens_used: tokensUsed,
      latency_ms: latencyMs,
      provider: this.provider,
      model,
      cost_usd: estimateCostGemini(model, tokensUsed),
    };
  }
}

function estimateCostGemini(model, tokens) {
  const rates = {
    'gemini-2.0-flash': 0.000000075,
    'gemini-1.5-flash': 0.000000075,
    'gemini-1.5-pro':   0.00000125,
  };
  return (rates[model] || 0.000000075) * tokens;
}
