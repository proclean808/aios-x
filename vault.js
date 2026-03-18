/* ═════════════════════════════════════
   AIOS-X · API Vault (BYOK)
   Secure localStorage-based API key management
═════════════════════════════════════ */

const VAULT_STORAGE_KEY = 'aiosx_vault';
const DEMO_MODE_LIMIT = 3; // Free tier: 3 requests per session
let demoRequestCount = 0;

// ── MODEL PROVIDERS CONFIGURATION ──
const MODEL_PROVIDERS = {
  openai: {
    id: 'openai',
    name: 'OpenAI',
    models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'o1-preview'],
    icon: 'GO',
    color: '#10a37f',
    endpoint: 'https://api.openai.com/v1/chat/completions',
    keyPlaceholder: 'sk-...',
    keyPattern: /^sk-[a-zA-Z0-9]{32,}$/
  },
  anthropic: {
    id: 'anthropic',
    name: 'Anthropic Claude',
    models: ['claude-3-5-sonnet-20241022', 'claude-3-opus-20240229', 'claude-3-haiku-20240307'],
    icon: 'CL',
    color: '#cc785c',
    endpoint: 'https://api.anthropic.com/v1/messages',
    keyPlaceholder: 'sk-ant-...',
    keyPattern: /^sk-ant-[a-zA-Z0-9-]{32,}$/
  },
  gemini: {
    id: 'gemini',
    name: 'Google Gemini',
    models: ['gemini-2.0-flash', 'gemini-1.5-pro', 'gemini-1.5-flash'],
    icon: 'GE',
    color: '#4285f4',
    endpoint: 'https://generativelanguage.googleapis.com/v1beta/models',
    keyPlaceholder: 'AIza...',
    keyPattern: /^AIza[a-zA-Z0-9_-]{35}$/
  },
  grok: {
    id: 'grok',
    name: 'xAI Grok',
    models: ['grok-2', 'grok-2-mini'],
    icon: 'GK',
    color: '#1da1f2',
    endpoint: 'https://api.x.ai/v1/chat/completions',
    keyPlaceholder: 'xai-...',
    keyPattern: /^xai-[a-zA-Z0-9]{32,}$/
  },
  ollama: {
    id: 'ollama',
    name: 'Ollama (Local)',
    models: ['llama3.2', 'mistral', 'codellama', 'phi3', 'gemma2'],
    icon: 'OL',
    color: '#ffffff',
    endpoint: 'http://localhost:11434/api/chat',
    keyPlaceholder: 'No API key required',
    keyPattern: null,
    customEndpoint: true
  },
  llama: {
    id: 'llama',
    name: 'Llama 4 (Groq)',
    models: ['llama-4-scout-17b-16e-instruct', 'llama-4-maverick-17b-128e-instruct'],
    icon: 'L4',
    color: '#f55036',
    endpoint: 'https://api.groq.com/openai/v1/chat/completions',
    keyPlaceholder: 'gsk_...',
    keyPattern: /^gsk_[a-zA-Z0-9]{32,}$/
  }
};

// ── VAULT CLASS ──
class APIVault {
  constructor() {
    this.keys = this.load();
    this.ollamaEndpoint = localStorage.getItem('aiosx_ollama_endpoint') || 'http://localhost:11434';
  }

  load() {
    try {
      const stored = localStorage.getItem(VAULT_STORAGE_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch (e) {
      console.error('Vault load error:', e);
      return {};
    }
  }

  save() {
    try {
      localStorage.setItem(VAULT_STORAGE_KEY, JSON.stringify(this.keys));
    } catch (e) {
      console.error('Vault save error:', e);
    }
  }

  setKey(providerId, apiKey) {
    const provider = MODEL_PROVIDERS[providerId];
    if (!provider) {
      throw new Error(`Unknown provider: ${providerId}`);
    }
    
    // Ollama doesn't require a key
    if (providerId === 'ollama') {
      this.keys[providerId] = 'local';
      this.save();
      return true;
    }

    // Validate key format (basic check)
    if (provider.keyPattern && !provider.keyPattern.test(apiKey)) {
      throw new Error(`Invalid API key format for ${provider.name}`);
    }

    this.keys[providerId] = apiKey;
    this.save();
    return true;
  }

  getKey(providerId) {
    return this.keys[providerId] || null;
  }

  hasKey(providerId) {
    if (providerId === 'ollama') return true; // Ollama always "has" a key
    return !!this.keys[providerId];
  }

  removeKey(providerId) {
    delete this.keys[providerId];
    this.save();
  }

  setOllamaEndpoint(url) {
    this.ollamaEndpoint = url;
    localStorage.setItem('aiosx_ollama_endpoint', url);
  }

  getOllamaEndpoint() {
    return this.ollamaEndpoint;
  }

  getConfiguredProviders() {
    return Object.keys(MODEL_PROVIDERS).filter(id => this.hasKey(id));
  }

  isInDemoMode() {
    return this.getConfiguredProviders().length === 0;
  }

  canMakeDemoRequest() {
    return demoRequestCount < DEMO_MODE_LIMIT;
  }

  incrementDemoCount() {
    demoRequestCount++;
  }

  getDemoRemaining() {
    return Math.max(0, DEMO_MODE_LIMIT - demoRequestCount);
  }

  exportConfig() {
    return {
      keys: Object.keys(this.keys).reduce((acc, k) => {
        acc[k] = this.keys[k] ? '***configured***' : null;
        return acc;
      }, {}),
      ollamaEndpoint: this.ollamaEndpoint
    };
  }
}

// ── SINGLETON INSTANCE ──
const vault = new APIVault();

// ── API CALL HANDLERS ──
async function callOpenAI(messages, model = 'gpt-4o-mini') {
  const key = vault.getKey('openai');
  if (!key) throw new Error('OpenAI API key not configured');

  const response = await fetch(MODEL_PROVIDERS.openai.endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${key}`
    },
    body: JSON.stringify({
      model,
      messages,
      max_tokens: 2048,
      temperature: 0.7
    })
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error?.message || `OpenAI API error: ${response.status}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

async function callAnthropic(messages, model = 'claude-3-5-sonnet-20241022') {
  const key = vault.getKey('anthropic');
  if (!key) throw new Error('Anthropic API key not configured');

  // Convert messages format for Anthropic
  const systemMessage = messages.find(m => m.role === 'system')?.content || '';
  const userMessages = messages.filter(m => m.role !== 'system');

  const response = await fetch(MODEL_PROVIDERS.anthropic.endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': key,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model,
      max_tokens: 2048,
      system: systemMessage,
      messages: userMessages
    })
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error?.message || `Anthropic API error: ${response.status}`);
  }

  const data = await response.json();
  return data.content[0].text;
}

async function callGemini(messages, model = 'gemini-2.0-flash') {
  const key = vault.getKey('gemini');
  if (!key) throw new Error('Gemini API key not configured');

  // Convert messages to Gemini format
  const contents = messages.filter(m => m.role !== 'system').map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }]
  }));

  const systemInstruction = messages.find(m => m.role === 'system')?.content;

  const response = await fetch(`${MODEL_PROVIDERS.gemini.endpoint}/${model}:generateContent?key=${key}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      contents,
      systemInstruction: systemInstruction ? { parts: [{ text: systemInstruction }] } : undefined,
      generationConfig: {
        maxOutputTokens: 2048,
        temperature: 0.7
      }
    })
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error?.message || `Gemini API error: ${response.status}`);
  }

  const data = await response.json();
  return data.candidates[0].content.parts[0].text;
}

async function callGrok(messages, model = 'grok-2') {
  const key = vault.getKey('grok');
  if (!key) throw new Error('Grok API key not configured');

  const response = await fetch(MODEL_PROVIDERS.grok.endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${key}`
    },
    body: JSON.stringify({
      model,
      messages,
      max_tokens: 2048,
      temperature: 0.7
    })
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error?.message || `Grok API error: ${response.status}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

async function callOllama(messages, model = 'llama3.2') {
  const endpoint = vault.getOllamaEndpoint();
  
  const response = await fetch(`${endpoint}/api/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model,
      messages,
      stream: false
    })
  });

  if (!response.ok) {
    throw new Error(`Ollama error: ${response.status}. Make sure Ollama is running at ${endpoint}`);
  }

  const data = await response.json();
  return data.message.content;
}

async function callLlama(messages, model = 'llama-4-scout-17b-16e-instruct') {
  const key = vault.getKey('llama');
  if (!key) throw new Error('Groq API key not configured for Llama 4');

  const response = await fetch(MODEL_PROVIDERS.llama.endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${key}`
    },
    body: JSON.stringify({
      model,
      messages,
      max_tokens: 2048,
      temperature: 0.7
    })
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error?.message || `Groq API error: ${response.status}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

// ── UNIFIED CALL FUNCTION ──
async function callModel(providerId, messages, model) {
  const handlers = {
    openai: callOpenAI,
    anthropic: callAnthropic,
    gemini: callGemini,
    grok: callGrok,
    ollama: callOllama,
    llama: callLlama
  };

  const handler = handlers[providerId];
  if (!handler) {
    throw new Error(`Unknown provider: ${providerId}`);
  }

  return handler(messages, model);
}

// ── PARALLEL MULTI-MODEL EXECUTION ──
async function callMultipleModels(messages, selectedModels) {
  // selectedModels format: [{ provider: 'openai', model: 'gpt-4o' }, ...]
  const maxModels = 6;
  const modelsToCall = selectedModels.slice(0, maxModels);

  const results = await Promise.allSettled(
    modelsToCall.map(async ({ provider, model }) => {
      const startTime = Date.now();
      try {
        const response = await callModel(provider, messages, model);
        return {
          provider,
          model,
          response,
          latency: Date.now() - startTime,
          status: 'success'
        };
      } catch (error) {
        return {
          provider,
          model,
          error: error.message,
          latency: Date.now() - startTime,
          status: 'error'
        };
      }
    })
  );

  return results.map(r => r.status === 'fulfilled' ? r.value : r.reason);
}

// ── DEMO MODE RESPONSES ──
const DEMO_RESPONSES = {
  openai: "This is a demo response from OpenAI GPT-4o. Configure your API key in the Vault to get real responses. The model would analyze your query with advanced reasoning capabilities and provide comprehensive insights.",
  anthropic: "This is a demo response from Claude. To unlock full capabilities, add your Anthropic API key in the Vault. Claude excels at nuanced analysis, coding assistance, and maintaining context across long conversations.",
  gemini: "This is a demo response from Google Gemini. Add your API key in the Vault for actual AI-powered responses. Gemini offers multimodal understanding and fast inference.",
  grok: "This is a demo response from xAI Grok. Configure your xAI API key to access Grok's real-time knowledge and witty responses.",
  ollama: "Ollama demo mode. Ensure Ollama is running locally at the configured endpoint. Ollama provides privacy-first local inference.",
  llama: "This is a demo response from Llama 4. Add your Groq API key in the Vault for lightning-fast Llama 4 inference. The model offers state-of-the-art open-weights performance."
};

async function getDemoResponse(providerId) {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));
  return DEMO_RESPONSES[providerId] || "Demo response. Configure API keys in the Vault for real model responses.";
}

// ── UI FUNCTIONS ──
function openVaultModal() {
  const providers = Object.values(MODEL_PROVIDERS);
  
  const html = `
    <div class="vault-container">
      <div class="vault-header-info">
        <p class="vault-desc">Configure your API keys to enable real model inference. Keys are stored securely in your browser's localStorage.</p>
        ${vault.isInDemoMode() ? `<div class="demo-mode-badge"><i class="fas fa-flask"></i> Demo Mode Active (${vault.getDemoRemaining()} requests remaining)</div>` : ''}
      </div>
      
      <div class="vault-providers">
        ${providers.map(p => `
          <div class="vault-provider-card ${vault.hasKey(p.id) ? 'configured' : ''}" data-provider="${p.id}">
            <div class="vpc-header" style="--provider-color: ${p.color}">
              <div class="vpc-badge" style="background: ${p.color}20; color: ${p.color}">${p.icon}</div>
              <div class="vpc-info">
                <div class="vpc-name">${p.name}</div>
                <div class="vpc-models">${p.models.slice(0, 2).join(', ')}${p.models.length > 2 ? '...' : ''}</div>
              </div>
              <div class="vpc-status">
                ${vault.hasKey(p.id) ? '<i class="fas fa-check-circle" style="color: var(--accent-green)"></i>' : '<i class="fas fa-key" style="color: var(--text-muted)"></i>'}
              </div>
            </div>
            <div class="vpc-body">
              ${p.id === 'ollama' ? `
                <div class="vpc-input-group">
                  <label>Ollama Endpoint URL</label>
                  <input type="text" class="vault-input" id="vault-endpoint-${p.id}" value="${vault.getOllamaEndpoint()}" placeholder="http://localhost:11434" />
                </div>
              ` : `
                <div class="vpc-input-group">
                  <label>API Key</label>
                  <input type="password" class="vault-input" id="vault-key-${p.id}" placeholder="${p.keyPlaceholder}" value="${vault.hasKey(p.id) ? '••••••••••••••••' : ''}" />
                </div>
              `}
              <div class="vpc-actions">
                <button class="btn-sm btn-save" onclick="saveVaultKey('${p.id}')">
                  <i class="fas fa-save"></i> Save
                </button>
                ${vault.hasKey(p.id) && p.id !== 'ollama' ? `
                  <button class="btn-sm btn-remove" onclick="removeVaultKey('${p.id}')">
                    <i class="fas fa-trash"></i> Remove
                  </button>
                ` : ''}
                <button class="btn-sm btn-test" onclick="testVaultConnection('${p.id}')">
                  <i class="fas fa-plug"></i> Test
                </button>
              </div>
              <div class="vpc-feedback" id="vault-feedback-${p.id}"></div>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;

  openModal('API Vault', html);
}

function saveVaultKey(providerId) {
  const feedback = document.getElementById(`vault-feedback-${providerId}`);
  
  try {
    if (providerId === 'ollama') {
      const endpoint = document.getElementById(`vault-endpoint-${providerId}`).value.trim();
      vault.setOllamaEndpoint(endpoint || 'http://localhost:11434');
      vault.setKey('ollama', 'local');
      feedback.innerHTML = '<span class="feedback-success"><i class="fas fa-check"></i> Endpoint saved</span>';
    } else {
      const keyInput = document.getElementById(`vault-key-${providerId}`);
      const key = keyInput.value.trim();
      
      if (!key || key.startsWith('••••')) {
        feedback.innerHTML = '<span class="feedback-error"><i class="fas fa-exclamation"></i> Enter a valid API key</span>';
        return;
      }
      
      vault.setKey(providerId, key);
      keyInput.value = '••••••••••••••••';
      feedback.innerHTML = '<span class="feedback-success"><i class="fas fa-check"></i> Key saved securely</span>';
    }

    // Update card status
    const card = document.querySelector(`.vault-provider-card[data-provider="${providerId}"]`);
    if (card) {
      card.classList.add('configured');
      card.querySelector('.vpc-status').innerHTML = '<i class="fas fa-check-circle" style="color: var(--accent-green)"></i>';
    }

    updateModelToggles();
    showToast(`${MODEL_PROVIDERS[providerId].name} configured`, 'success');
  } catch (e) {
    feedback.innerHTML = `<span class="feedback-error"><i class="fas fa-exclamation"></i> ${e.message}</span>`;
  }
}

function removeVaultKey(providerId) {
  vault.removeKey(providerId);
  
  const card = document.querySelector(`.vault-provider-card[data-provider="${providerId}"]`);
  if (card) {
    card.classList.remove('configured');
    card.querySelector('.vpc-status').innerHTML = '<i class="fas fa-key" style="color: var(--text-muted)"></i>';
    const keyInput = document.getElementById(`vault-key-${providerId}`);
    if (keyInput) keyInput.value = '';
  }

  const feedback = document.getElementById(`vault-feedback-${providerId}`);
  feedback.innerHTML = '<span class="feedback-info"><i class="fas fa-info"></i> Key removed</span>';

  updateModelToggles();
  showToast(`${MODEL_PROVIDERS[providerId].name} key removed`, 'warning');
}

async function testVaultConnection(providerId) {
  const feedback = document.getElementById(`vault-feedback-${providerId}`);
  feedback.innerHTML = '<span class="feedback-info"><i class="fas fa-spinner fa-spin"></i> Testing connection...</span>';

  try {
    const testMessages = [{ role: 'user', content: 'Say "Connection successful" in exactly those words.' }];
    const provider = MODEL_PROVIDERS[providerId];
    
    await callModel(providerId, testMessages, provider.models[0]);
    feedback.innerHTML = '<span class="feedback-success"><i class="fas fa-check"></i> Connection successful!</span>';
    showToast(`${provider.name} connection verified`, 'success');
  } catch (e) {
    feedback.innerHTML = `<span class="feedback-error"><i class="fas fa-times"></i> ${e.message}</span>`;
    showToast(`${MODEL_PROVIDERS[providerId].name} connection failed`, 'error');
  }
}

function updateModelToggles() {
  const container = document.getElementById('modelTogglesContainer');
  if (!container) return;

  const togglesHTML = Object.values(MODEL_PROVIDERS).map(p => {
    const hasKey = vault.hasKey(p.id);
    const defaultModel = p.models[0];
    return `
      <button class="model-toggle ${hasKey ? 'available' : 'unavailable'}" 
              data-provider="${p.id}" 
              data-model="${defaultModel}"
              style="--toggle-color: ${p.color}"
              title="${hasKey ? 'Click to toggle' : 'Configure API key in Vault'}">
        <span class="mt-badge">${p.icon}</span>
        <span class="mt-name">${p.name}</span>
        ${!hasKey ? '<i class="fas fa-lock mt-lock"></i>' : ''}
      </button>
    `;
  }).join('');

  container.innerHTML = togglesHTML;
  initNewModelToggles();
}

function initNewModelToggles() {
  const maxSelected = 6;
  const toggles = document.querySelectorAll('#modelTogglesContainer .model-toggle');
  
  toggles.forEach(btn => {
    btn.addEventListener('click', () => {
      if (btn.classList.contains('unavailable')) {
        showToast('Configure API key in Vault first', 'warning');
        openVaultModal();
        return;
      }

      const activeCount = document.querySelectorAll('#modelTogglesContainer .model-toggle.active').length;
      
      if (!btn.classList.contains('active') && activeCount >= maxSelected) {
        showToast(`Maximum ${maxSelected} models can be active simultaneously`, 'warning');
        return;
      }

      btn.classList.toggle('active');
      const provider = btn.dataset.provider;
      const on = btn.classList.contains('active');
      showToast(`${MODEL_PROVIDERS[provider].name} ${on ? 'enabled' : 'disabled'}`, on ? 'success' : 'warning', 1500);
      
      updateActiveModelCount();
    });
  });
}

function updateActiveModelCount() {
  const count = document.querySelectorAll('#modelTogglesContainer .model-toggle.active').length;
  const el = document.getElementById('hModels');
  if (el) el.textContent = `${count} Models`;
}

function getSelectedModels() {
  const selected = [];
  document.querySelectorAll('#modelTogglesContainer .model-toggle.active').forEach(btn => {
    selected.push({
      provider: btn.dataset.provider,
      model: btn.dataset.model
    });
  });
  return selected;
}

// ── EXPORTS ──
window.vault = vault;
window.MODEL_PROVIDERS = MODEL_PROVIDERS;
window.openVaultModal = openVaultModal;
window.saveVaultKey = saveVaultKey;
window.removeVaultKey = removeVaultKey;
window.testVaultConnection = testVaultConnection;
window.callModel = callModel;
window.callMultipleModels = callMultipleModels;
window.getDemoResponse = getDemoResponse;
window.getSelectedModels = getSelectedModels;
window.updateModelToggles = updateModelToggles;
