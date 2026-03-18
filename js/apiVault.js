/* ═════════════════════════════════════
   AIOS-X · BYOK API Key Vault
   Secure localStorage storage
═════════════════════════════════════ */
'use strict';

const VAULT_KEY = 'aiosx_vault_v1';

// Simple XOR obfuscation (not cryptography — keys stay client-side)
function obfuscate(str) {
  const seed = 'aiosx2026';
  return btoa(str.split('').map((c, i) =>
    String.fromCharCode(c.charCodeAt(0) ^ seed.charCodeAt(i % seed.length))
  ).join(''));
}

function deobfuscate(str) {
  try {
    const seed = 'aiosx2026';
    const decoded = atob(str);
    return decoded.split('').map((c, i) =>
      String.fromCharCode(c.charCodeAt(0) ^ seed.charCodeAt(i % seed.length))
    ).join('');
  } catch { return ''; }
}

// ── PROVIDER CONFIG ──
const PROVIDERS = {
  anthropic: { name: 'Anthropic (Claude)', icon: '🟣', color: '#c084fc', placeholder: 'sk-ant-…', baseUrl: 'https://api.anthropic.com' },
  openai:    { name: 'OpenAI (GPT)',        icon: '🟢', color: '#34d399', placeholder: 'sk-…',     baseUrl: 'https://api.openai.com' },
  google:    { name: 'Google (Gemini)',     icon: '🔵', color: '#38bdf8', placeholder: 'AIza…',    baseUrl: 'https://generativelanguage.googleapis.com' },
  xai:       { name: 'xAI (Grok)',          icon: '⚫', color: '#94a3b8', placeholder: 'xai-…',    baseUrl: 'https://api.x.ai' },
  ollama:    { name: 'Ollama (Local)',      icon: '🦙', color: '#fb923c', placeholder: 'http://localhost:11434', baseUrl: '' },
  mistral:   { name: 'Mistral AI',          icon: '🔴', color: '#f87171', placeholder: 'sk-…',     baseUrl: 'https://api.mistral.ai' },
  deepseek:  { name: 'DeepSeek',           icon: '🐋', color: '#818cf8', placeholder: 'sk-…',     baseUrl: 'https://api.deepseek.com' },
  vercel:    { name: 'Vercel',             icon: '▲',  color: '#ffffff', placeholder: 'token_…',  baseUrl: 'https://api.vercel.com' },
};

// ── VAULT OPERATIONS ──
function loadVault() {
  try {
    const raw = localStorage.getItem(VAULT_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch { return {}; }
}

function saveVault(vault) {
  localStorage.setItem(VAULT_KEY, JSON.stringify(vault));
}

function setKey(provider, key) {
  const vault = loadVault();
  vault[provider] = { key: obfuscate(key), ts: Date.now() };
  saveVault(vault);
}

function getKey(provider) {
  const vault = loadVault();
  if (!vault[provider]) return null;
  return deobfuscate(vault[provider].key);
}

function removeKey(provider) {
  const vault = loadVault();
  delete vault[provider];
  saveVault(vault);
}

function hasKey(provider) {
  const k = getKey(provider);
  return k && k.length > 4;
}

function clearAllKeys() {
  if (!confirm('Delete all stored API keys?')) return;
  localStorage.removeItem(VAULT_KEY);
  renderVaultGrid();
  showToast('All keys cleared', 'warning');
}

// ── RENDER VAULT UI ──
function renderVaultGrid() {
  const grid = document.getElementById('vaultGrid');
  if (!grid) return;
  const vault = loadVault();

  grid.innerHTML = '';

  if (Object.keys(vault).length === 0) {
    grid.innerHTML = '<div class="placeholder-text">No keys stored yet. Add your first API key below.</div>';
  } else {
    Object.entries(vault).forEach(([provider, data]) => {
      const prov = PROVIDERS[provider] || { name: provider, icon: '🔑', color: '#94a3b8' };
      const keyPreview = maskKey(deobfuscate(data.key));
      const item = document.createElement('div');
      item.className = 'vault-item active';
      item.id = 'vaultItem_' + provider;
      item.innerHTML = `
        <span style="font-size:18px">${prov.icon}</span>
        <div class="vault-provider-name" style="color:${prov.color}">${prov.name}</div>
        <div class="vault-key-preview">${keyPreview}</div>
        <span class="model-badge badge-configured">Active</span>
        <span class="vault-del" onclick="deleteVaultKey('${provider}')" title="Delete key">🗑</span>
      `;
      grid.appendChild(item);
    });
  }

  updateKpiConfigured();
}

function maskKey(key) {
  if (!key || key.length < 8) return '••••••••';
  return key.slice(0, 6) + '••••••••' + key.slice(-4);
}

function addVaultKey() {
  const form = document.getElementById('vaultAddForm');
  if (form) form.style.display = 'flex';
}

function cancelVaultKey() {
  const form = document.getElementById('vaultAddForm');
  if (form) { form.style.display = 'none'; }
  const inp = document.getElementById('vaultKeyInput');
  if (inp) inp.value = '';
}

function saveVaultKey() {
  const provider = document.getElementById('vaultProviderSelect')?.value;
  const keyVal = document.getElementById('vaultKeyInput')?.value?.trim();
  if (!provider || !keyVal) { showToast('Please select a provider and enter a key', 'warning'); return; }
  if (provider === 'ollama') {
    setKey(provider, keyVal);
  } else if (keyVal.length < 6) {
    showToast('Key appears too short', 'warning'); return;
  } else {
    setKey(provider, keyVal);
  }
  cancelVaultKey();
  renderVaultGrid();
  showToast(`${PROVIDERS[provider]?.name || provider} key saved`, 'success');

  // Update model cards configured status
  if (typeof updateModelConfiguredStatus === 'function') updateModelConfiguredStatus();
}

function deleteVaultKey(provider) {
  removeKey(provider);
  renderVaultGrid();
  showToast('Key removed', 'info');
  if (typeof updateModelConfiguredStatus === 'function') updateModelConfiguredStatus();
}

function exportKeys() {
  const vault = loadVault();
  const exported = {
    exported_at: new Date().toISOString(),
    note: 'Keys are obfuscated. Import back via AIOS-X Vault.',
    keys: vault
  };
  downloadJSON(exported, 'aiosx-vault-export.json');
  showToast('Keys exported (obfuscated)', 'info');
}

function updateKpiConfigured() {
  const vault = loadVault();
  const count = Object.keys(vault).length;
  const el = document.getElementById('kpiModelsConfigured');
  if (el) el.textContent = count;
}

// ── MAKE API CALL ──
async function callModel(provider, modelId, messages, options = {}) {
  const key = getKey(provider);
  if (!key) {
    throw new Error(`No API key configured for ${PROVIDERS[provider]?.name || provider}. Open the Vault to add it.`);
  }

  const systemPrompt = options.system || 'You are a helpful AI assistant in the AIOS-X system.';
  const maxTokens = options.maxTokens || 1024;
  const temperature = options.temperature ?? 0.7;
  const stream = options.stream || false;

  switch (provider) {
    case 'anthropic':
      return callAnthropic(key, modelId, messages, systemPrompt, maxTokens, temperature, stream);
    case 'openai':
      return callOpenAI(key, modelId, messages, systemPrompt, maxTokens, temperature, stream);
    case 'google':
      return callGemini(key, modelId, messages, systemPrompt, maxTokens, temperature);
    case 'xai':
      return callXAI(key, modelId, messages, systemPrompt, maxTokens, temperature);
    case 'ollama':
      return callOllama(key, modelId, messages, systemPrompt, maxTokens, temperature);
    case 'mistral':
      return callMistral(key, modelId, messages, systemPrompt, maxTokens, temperature);
    case 'deepseek':
      return callDeepSeek(key, modelId, messages, systemPrompt, maxTokens, temperature);
    case 'vercel':
      throw new Error('Vercel is a deployment provider — use submitVercelDeploy() for deployments, not callModel().');
    default:
      throw new Error(`Unknown provider: ${provider}`);
  }
}

// ── ANTHROPIC ──
async function callAnthropic(key, model, messages, system, maxTokens, temperature) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': key,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({ model, messages, system, max_tokens: maxTokens, temperature }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`Anthropic error ${res.status}: ${err.error?.message || res.statusText}`);
  }
  const data = await res.json();
  return data.content?.[0]?.text || '';
}

// ── OPENAI ──
async function callOpenAI(key, model, messages, system, maxTokens, temperature) {
  const msgs = [{ role: 'system', content: system }, ...messages];
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${key}`, 'content-type': 'application/json' },
    body: JSON.stringify({ model, messages: msgs, max_tokens: maxTokens, temperature }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`OpenAI error ${res.status}: ${err.error?.message || res.statusText}`);
  }
  const data = await res.json();
  return data.choices?.[0]?.message?.content || '';
}

// ── GOOGLE GEMINI ──
async function callGemini(key, model, messages, system, maxTokens, temperature) {
  // Map model IDs
  const geminiModel = model.replace('gemini-', '').replace('-exp', '');
  const apiModel = model.includes('2.0') ? 'gemini-2.0-flash' : model.includes('1.5-pro') ? 'gemini-1.5-pro' : model;

  const contents = messages.map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }]
  }));

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${apiModel}:generateContent?key=${key}`,
    {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents,
        generationConfig: { maxOutputTokens: maxTokens, temperature }
      }),
    }
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`Gemini error ${res.status}: ${JSON.stringify(err)}`);
  }
  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

// ── xAI GROK ──
async function callXAI(key, model, messages, system, maxTokens, temperature) {
  const msgs = [{ role: 'system', content: system }, ...messages];
  const res = await fetch('https://api.x.ai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${key}`, 'content-type': 'application/json' },
    body: JSON.stringify({ model, messages: msgs, max_tokens: maxTokens, temperature }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`xAI error ${res.status}: ${err.error?.message || res.statusText}`);
  }
  const data = await res.json();
  return data.choices?.[0]?.message?.content || '';
}

// ── OLLAMA LOCAL ──
async function callOllama(endpoint, model, messages, system, maxTokens, temperature) {
  const base = (endpoint.startsWith('http') ? endpoint : 'http://localhost:11434').replace(/\/$/, '');
  const msgs = [{ role: 'system', content: system }, ...messages];
  const res = await fetch(`${base}/api/chat`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ model, messages: msgs, stream: false,
      options: { num_predict: maxTokens, temperature } }),
  });
  if (!res.ok) throw new Error(`Ollama error ${res.status}: ${res.statusText}`);
  const data = await res.json();
  return data.message?.content || '';
}

// ── MISTRAL ──
async function callMistral(key, model, messages, system, maxTokens, temperature) {
  const msgs = [{ role: 'system', content: system }, ...messages];
  const res = await fetch('https://api.mistral.ai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${key}`, 'content-type': 'application/json' },
    body: JSON.stringify({ model, messages: msgs, max_tokens: maxTokens, temperature }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`Mistral error ${res.status}: ${err.message || res.statusText}`);
  }
  const data = await res.json();
  return data.choices?.[0]?.message?.content || '';
}

// ── DEEPSEEK ──
async function callDeepSeek(key, model, messages, system, maxTokens, temperature) {
  const msgs = [{ role: 'system', content: system }, ...messages];
  const res = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${key}`, 'content-type': 'application/json' },
    body: JSON.stringify({ model, messages: msgs, max_tokens: maxTokens, temperature }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`DeepSeek error ${res.status}: ${err.error?.message || res.statusText}`);
  }
  const data = await res.json();
  return data.choices?.[0]?.message?.content || '';
}

// ── VERCEL DEPLOY ──
// Triggers a deployment for the given Vercel project.
// opts.teamId  — optional Vercel team ID (slug or cuid)
// opts.ref     — git branch/tag/SHA to deploy (default: main)
async function submitVercelDeploy(opts = {}) {
  const key = getKey('vercel');
  if (!key) throw new Error('No Vercel token stored. Open the Vault, select Vercel, and save your token.');

  const { name, teamId, ref = 'main', env = {}, target = 'production' } = opts;
  if (!name) throw new Error('submitVercelDeploy requires opts.name (project name or id)');

  const url = teamId
    ? `https://api.vercel.com/v13/deployments?teamId=${encodeURIComponent(teamId)}`
    : 'https://api.vercel.com/v13/deployments';

  const body = {
    name,
    target,
    gitSource: { type: 'github', ref },
    projectSettings: {},
  };
  if (Object.keys(env).length) body.env = env;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`Vercel deploy error ${res.status}: ${err.error?.message || res.statusText}`);
  }

  const data = await res.json();
  showToast(`Vercel deployment started: ${data.url || data.id}`, 'success');
  return data;
}

// List recent deployments for a project
async function listVercelDeployments(projectName, { teamId, limit = 10 } = {}) {
  const key = getKey('vercel');
  if (!key) throw new Error('No Vercel token stored.');

  const params = new URLSearchParams({ projectId: projectName, limit });
  if (teamId) params.set('teamId', teamId);

  const res = await fetch(`https://api.vercel.com/v6/deployments?${params}`, {
    headers: { 'Authorization': `Bearer ${key}` },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`Vercel list error ${res.status}: ${err.error?.message || res.statusText}`);
  }
  return (await res.json()).deployments || [];
}

// Expose
window.renderVaultGrid = renderVaultGrid;
window.addVaultKey = addVaultKey;
window.cancelVaultKey = cancelVaultKey;
window.saveVaultKey = saveVaultKey;
window.deleteVaultKey = deleteVaultKey;
window.clearAllKeys = clearAllKeys;
window.exportKeys = exportKeys;
window.getKey = getKey;
window.hasKey = hasKey;
window.callModel = callModel;
window.PROVIDERS = PROVIDERS;
window.submitVercelDeploy = submitVercelDeploy;
window.listVercelDeployments = listVercelDeployments;
