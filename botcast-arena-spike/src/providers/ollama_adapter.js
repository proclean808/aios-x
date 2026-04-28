/**
 * BotCast Arena · Ollama Local Adapter
 * No LiteLLM. Direct fetch to local Ollama chat endpoint.
 * Supports: llama3.2, mistral, codellama, phi3, gemma2, and any pulled model.
 */

export class OllamaAdapter {
  constructor(baseUrl = 'http://localhost:11434') {
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.provider = 'ollama';
  }

  async call({ model = 'llama3.2', messages, maxTokens = 400, temperature = 0.7 }) {
    const startMs = Date.now();
    const endpoint = `${this.baseUrl}/api/chat`;

    const body = {
      model,
      messages,
      stream: false,
      options: {
        num_predict: maxTokens,
        temperature,
      },
    };

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      throw new Error(`Ollama ${res.status}: ${res.statusText}`);
    }

    const data = await res.json();
    const latencyMs = Date.now() - startMs;
    const content = data.message?.content || '';
    const tokensUsed = (data.prompt_eval_count || 0) + (data.eval_count || 0);

    return {
      text: content,
      tokens_used: tokensUsed,
      latency_ms: latencyMs,
      provider: this.provider,
      model,
      cost_usd: 0, // local inference, no API cost
    };
  }

  async listModels() {
    try {
      const res = await fetch(`${this.baseUrl}/api/tags`);
      if (!res.ok) return [];
      const data = await res.json();
      return (data.models || []).map(m => m.name);
    } catch (_) {
      return [];
    }
  }

  async isAvailable() {
    try {
      const res = await fetch(`${this.baseUrl}/api/tags`, { signal: AbortSignal.timeout(2000) });
      return res.ok;
    } catch (_) {
      return false;
    }
  }
}
