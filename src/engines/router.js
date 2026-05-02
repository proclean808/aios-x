import { ProviderError } from './contract.js';

const PROVIDER_MODELS = {
  openai:    { model: 'gpt-4o',            maxTokens: 1024 },
  anthropic: { model: 'claude-opus-4-7',   maxTokens: 1024 },
  gemini:    { model: 'gemini-2.0-flash',  maxTokens: 1024 },
  ollama:    { model: 'llama3.2',          maxTokens: 1024 },
};

export class EngineRouter {
  constructor(providerKeys = {}) {
    this._keys = providerKeys;
    this._circuitBreakers = {};   // provider → { failures, openUntil }
    this._THRESHOLD = 3;
    this._OPEN_MS   = 30_000;
  }

  // Call a provider; handles circuit-breaker open/close and fallback chain
  async call(provider, messages, systemPrompt, overrides = {}) {
    const chain = this._buildFallbackChain(provider);

    for (const p of chain) {
      if (this._circuitOpen(p)) continue;

      try {
        const result = await this._dispatch(p, messages, systemPrompt, overrides);
        this._recordSuccess(p);
        return { ...result, used_provider: p };
      } catch (err) {
        this._recordFailure(p);
        console.warn(`[router] ${p} failed: ${err.message} — trying next in chain`);
      }
    }

    throw new ProviderError('All providers in fallback chain failed', {
      provider, retryable: false,
    });
  }

  _buildFallbackChain(primary) {
    const all = Object.keys(PROVIDER_MODELS).filter(p => this._keys[p] || p === 'ollama');
    return [primary, ...all.filter(p => p !== primary)];
  }

  async _dispatch(provider, messages, systemPrompt, overrides) {
    const key = this._keys[provider];
    const { model, maxTokens } = { ...PROVIDER_MODELS[provider], ...overrides };

    switch (provider) {
      case 'openai':    return this._callOpenAI(key, model, messages, systemPrompt, maxTokens);
      case 'anthropic': return this._callAnthropic(key, model, messages, systemPrompt, maxTokens);
      case 'gemini':    return this._callGemini(key, model, messages, systemPrompt, maxTokens);
      case 'ollama':    return this._callOllama(model, messages, systemPrompt, maxTokens);
      default: throw new ProviderError(`Unknown provider: ${provider}`, { provider });
    }
  }

  async _callOpenAI(apiKey, model, messages, systemPrompt, maxTokens) {
    if (!apiKey) throw new ProviderError('OpenAI key missing', { provider: 'openai', retryable: false });
    const body = { model, max_tokens: maxTokens, messages: [{ role: 'system', content: systemPrompt }, ...messages] };
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(30_000),
    });
    if (!res.ok) throw new ProviderError(`OpenAI ${res.status}`, { provider: 'openai', statusCode: res.status, retryable: res.status === 429 });
    const d = await res.json();
    return { text: d.choices[0].message.content, tokens_used: d.usage?.total_tokens || 0, provider: 'openai', model };
  }

  async _callAnthropic(apiKey, model, messages, systemPrompt, maxTokens) {
    if (!apiKey) throw new ProviderError('Anthropic key missing', { provider: 'anthropic', retryable: false });
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({ model, max_tokens: maxTokens, system: systemPrompt, messages }),
      signal: AbortSignal.timeout(30_000),
    });
    if (!res.ok) throw new ProviderError(`Anthropic ${res.status}`, { provider: 'anthropic', statusCode: res.status, retryable: res.status === 429 });
    const d = await res.json();
    const tokens = (d.usage?.input_tokens || 0) + (d.usage?.output_tokens || 0);
    return { text: d.content[0].text, tokens_used: tokens, provider: 'anthropic', model };
  }

  async _callGemini(apiKey, model, messages, systemPrompt, maxTokens) {
    if (!apiKey) throw new ProviderError('Gemini key missing', { provider: 'gemini', retryable: false });
    const geminiMessages = messages.map(m => ({ role: m.role === 'assistant' ? 'model' : m.role, parts: [{ text: m.content }] }));
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ systemInstruction: { parts: [{ text: systemPrompt }] }, contents: geminiMessages, generationConfig: { maxOutputTokens: maxTokens } }),
        signal: AbortSignal.timeout(30_000),
      }
    );
    if (!res.ok) throw new ProviderError(`Gemini ${res.status}`, { provider: 'gemini', statusCode: res.status, retryable: res.status === 429 });
    const d = await res.json();
    return { text: d.candidates[0].content.parts[0].text, tokens_used: d.usageMetadata?.totalTokenCount || 0, provider: 'gemini', model };
  }

  async _callOllama(model, messages, systemPrompt, maxTokens) {
    const base = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
    const res = await fetch(`${base}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, messages: [{ role: 'system', content: systemPrompt }, ...messages], stream: false, options: { num_predict: maxTokens } }),
      signal: AbortSignal.timeout(60_000),
    });
    if (!res.ok) throw new ProviderError(`Ollama ${res.status}`, { provider: 'ollama', statusCode: res.status, retryable: true });
    const d = await res.json();
    return { text: d.message.content, tokens_used: (d.prompt_eval_count || 0) + (d.eval_count || 0), provider: 'ollama', model };
  }

  _circuitOpen(provider) {
    const cb = this._circuitBreakers[provider];
    if (!cb) return false;
    if (cb.openUntil && Date.now() < cb.openUntil) return true;
    return false;
  }

  _recordFailure(provider) {
    const cb = this._circuitBreakers[provider] || { failures: 0 };
    cb.failures++;
    if (cb.failures >= this._THRESHOLD) {
      cb.openUntil = Date.now() + this._OPEN_MS;
      console.warn(`[router] circuit breaker OPEN for ${provider} — cooldown ${this._OPEN_MS}ms`);
    }
    this._circuitBreakers[provider] = cb;
  }

  _recordSuccess(provider) {
    this._circuitBreakers[provider] = { failures: 0, openUntil: null };
  }

  getCircuitState() {
    return { ...this._circuitBreakers };
  }
}
