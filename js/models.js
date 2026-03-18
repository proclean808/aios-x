/* ═════════════════════════════════════
   AIOS-X · Multi-Model Registry
   SOTA Flagship + One Below, March 2026
   Grok · Claude · Gemini · GPT · Ollama
═════════════════════════════════════ */
'use strict';

// ── MODEL REGISTRY ──
// tier: 'flagship' | 'standard' | 'efficient' | 'local'
const MODEL_REGISTRY = [
  // ── ANTHROPIC (Claude) ──
  {
    id: 'claude-opus-4-6',
    name: 'Claude Opus 4.6',
    provider: 'anthropic',
    tier: 'flagship',
    icon: '🟣',
    color: '#c084fc',
    context: '200K',
    inputCost: 15,
    outputCost: 75,
    mmlu: 91.8,
    humanEval: 84.9,
    math: 78.3,
    features: ['voice', 'vision', 'tools', 'streaming'],
    description: 'Anthropic\'s most capable model. Best for complex reasoning, synthesis, and long-context tasks.',
    releaseDate: '2025-10',
    parameters: '~500B (est.)',
  },
  {
    id: 'claude-sonnet-4-6',
    name: 'Claude Sonnet 4.6',
    provider: 'anthropic',
    tier: 'standard',
    icon: '🟣',
    color: '#a855f7',
    context: '200K',
    inputCost: 3,
    outputCost: 15,
    mmlu: 88.7,
    humanEval: 81.2,
    math: 73.1,
    features: ['voice', 'vision', 'tools', 'streaming'],
    description: 'Balanced power and speed. Ideal for most agentic workflows and production deployments.',
    releaseDate: '2025-10',
    parameters: '~70B (est.)',
  },
  {
    id: 'claude-haiku-4-5',
    name: 'Claude Haiku 4.5',
    provider: 'anthropic',
    tier: 'efficient',
    icon: '🟣',
    color: '#7c3aed',
    context: '200K',
    inputCost: 0.25,
    outputCost: 1.25,
    mmlu: 81.9,
    humanEval: 72.4,
    math: 62.5,
    features: ['tools', 'streaming'],
    description: 'Ultra-fast and cost-efficient. Perfect for high-throughput agentic tasks.',
    releaseDate: '2025-07',
    parameters: '~8B (est.)',
  },

  // ── OPENAI (GPT) ──
  {
    id: 'gpt-4.5-turbo',
    name: 'GPT-4.5 Turbo',
    provider: 'openai',
    tier: 'flagship',
    icon: '🟢',
    color: '#34d399',
    context: '128K',
    inputCost: 12,
    outputCost: 40,
    mmlu: 90.4,
    humanEval: 87.5,
    math: 76.8,
    features: ['voice', 'vision', 'tools', 'streaming', 'realtime'],
    description: 'OpenAI\'s most capable GPT model with native multimodal support and real-time voice.',
    releaseDate: '2025-11',
    parameters: '~1.8T MoE (est.)',
    badge: 'New',
  },
  {
    id: 'gpt-4o',
    name: 'GPT-4o',
    provider: 'openai',
    tier: 'standard',
    icon: '🟢',
    color: '#10b981',
    context: '128K',
    inputCost: 5,
    outputCost: 15,
    mmlu: 88.7,
    humanEval: 90.2,
    math: 76.6,
    features: ['voice', 'vision', 'tools', 'streaming'],
    description: 'Omni model with native audio, image, and text. Previous flagship, still excellent.',
    releaseDate: '2024-05',
    parameters: '~200B (est.)',
  },
  {
    id: 'gpt-4o-mini',
    name: 'GPT-4o-mini',
    provider: 'openai',
    tier: 'efficient',
    icon: '🟢',
    color: '#059669',
    context: '128K',
    inputCost: 0.15,
    outputCost: 0.6,
    mmlu: 82.0,
    humanEval: 87.2,
    math: 70.2,
    features: ['vision', 'tools', 'streaming'],
    description: 'Smallest GPT-4 class model. Best balance of cost and quality for lightweight tasks.',
    releaseDate: '2024-07',
    parameters: '~8B (est.)',
  },
  {
    id: 'o3',
    name: 'OpenAI o3',
    provider: 'openai',
    tier: 'flagship',
    icon: '🟢',
    color: '#6ee7b7',
    context: '200K',
    inputCost: 10,
    outputCost: 40,
    mmlu: 96.7,
    humanEval: 96.7,
    math: 97.4,
    features: ['tools', 'streaming', 'reasoning'],
    description: 'Extended reasoning model. Best for math, coding, and complex logical reasoning chains.',
    releaseDate: '2025-04',
    parameters: 'Unknown',
  },

  // ── GOOGLE (Gemini) ──
  {
    id: 'gemini-2.5-pro',
    name: 'Gemini 2.5 Pro',
    provider: 'google',
    tier: 'flagship',
    icon: '🔵',
    color: '#38bdf8',
    context: '1M',
    inputCost: 7,
    outputCost: 21,
    mmlu: 92.0,
    humanEval: 90.0,
    math: 91.0,
    features: ['voice', 'vision', 'tools', 'streaming', 'multimodal'],
    description: 'Google\'s most advanced model with 1M token context, native multimodal, and real-time voice.',
    releaseDate: '2025-12',
    parameters: 'Unknown (MoE)',
    badge: 'New',
  },
  {
    id: 'gemini-2.0-flash',
    name: 'Gemini 2.0 Flash',
    provider: 'google',
    tier: 'standard',
    icon: '🔵',
    color: '#0ea5e9',
    context: '1M',
    inputCost: 0.1,
    outputCost: 0.4,
    mmlu: 85.0,
    humanEval: 82.0,
    math: 80.0,
    features: ['voice', 'vision', 'tools', 'streaming', 'realtime'],
    description: 'Fast, affordable, natively multimodal. Live API supports real-time bidirectional voice.',
    releaseDate: '2025-02',
    parameters: 'Unknown',
  },
  {
    id: 'gemini-1.5-pro',
    name: 'Gemini 1.5 Pro',
    provider: 'google',
    tier: 'efficient',
    icon: '🔵',
    color: '#0369a1',
    context: '2M',
    inputCost: 3.5,
    outputCost: 10.5,
    mmlu: 85.9,
    humanEval: 71.9,
    math: 67.7,
    features: ['vision', 'tools', 'streaming'],
    description: 'Longest context window at 2M tokens. Excellent for large document analysis.',
    releaseDate: '2024-05',
    parameters: 'Unknown (MoE)',
  },

  // ── xAI (Grok) ──
  {
    id: 'grok-3',
    name: 'Grok 3',
    provider: 'xai',
    tier: 'flagship',
    icon: '⚫',
    color: '#94a3b8',
    context: '131K',
    inputCost: 3,
    outputCost: 15,
    mmlu: 93.3,
    humanEval: 88.9,
    math: 93.3,
    features: ['vision', 'tools', 'streaming', 'realtime', 'web-search'],
    description: 'xAI\'s frontier model with real-time web search, vision, and DeepSearch capabilities.',
    releaseDate: '2025-02',
    parameters: '~314B (est.)',
    badge: 'New',
  },
  {
    id: 'grok-2',
    name: 'Grok-2',
    provider: 'xai',
    tier: 'standard',
    icon: '⚫',
    color: '#64748b',
    context: '131K',
    inputCost: 2,
    outputCost: 10,
    mmlu: 87.5,
    humanEval: 74.1,
    math: 76.4,
    features: ['vision', 'tools', 'streaming', 'web-search'],
    description: 'Previous xAI flagship with FLUX image generation. Live Twitter/X data access.',
    releaseDate: '2024-08',
    parameters: '~314B (est.)',
  },
  {
    id: 'grok-2-mini',
    name: 'Grok-2 Mini',
    provider: 'xai',
    tier: 'efficient',
    icon: '⚫',
    color: '#475569',
    context: '131K',
    inputCost: 0.2,
    outputCost: 0.4,
    mmlu: 76.1,
    humanEval: 65.0,
    math: 60.0,
    features: ['tools', 'streaming'],
    description: 'Lightweight Grok for fast inference and high-throughput workloads.',
    releaseDate: '2024-08',
    parameters: '~8B (est.)',
  },

  // ── OLLAMA / LOCAL ──
  {
    id: 'llama3:70b',
    name: 'Llama 3 70B',
    provider: 'ollama',
    tier: 'flagship',
    icon: '🦙',
    color: '#fb923c',
    context: '128K',
    inputCost: 0,
    outputCost: 0,
    mmlu: 82.0,
    humanEval: 81.7,
    math: 50.4,
    features: ['tools', 'local'],
    description: 'Meta\'s Llama 3 70B via Ollama. Run completely locally. No data leaves your machine.',
    releaseDate: '2024-04',
    parameters: '70B',
  },
  {
    id: 'llama3:8b',
    name: 'Llama 3 8B',
    provider: 'ollama',
    tier: 'efficient',
    icon: '🦙',
    color: '#ea580c',
    context: '128K',
    inputCost: 0,
    outputCost: 0,
    mmlu: 68.4,
    humanEval: 62.2,
    math: 30.0,
    features: ['tools', 'local'],
    description: 'Fast local Llama 3 8B. Runs on consumer hardware. Great for development and testing.',
    releaseDate: '2024-04',
    parameters: '8B',
  },
  {
    id: 'deepseek-v3',
    name: 'DeepSeek V3',
    provider: 'deepseek',
    tier: 'flagship',
    icon: '🐋',
    color: '#818cf8',
    context: '128K',
    inputCost: 0.27,
    outputCost: 1.1,
    mmlu: 88.5,
    humanEval: 89.1,
    math: 90.2,
    features: ['tools', 'streaming'],
    description: '685B MoE model trained for just $5.5M. Exceptional coding and math capabilities.',
    releaseDate: '2024-12',
    parameters: '685B MoE',
  },
  {
    id: 'mistral-large',
    name: 'Mistral Large 2',
    provider: 'mistral',
    tier: 'flagship',
    icon: '🔴',
    color: '#f87171',
    context: '128K',
    inputCost: 2,
    outputCost: 6,
    mmlu: 84.0,
    humanEval: 92.0,
    math: 69.0,
    features: ['tools', 'streaming'],
    description: 'Mistral\'s flagship with top-tier coding performance and strong European data sovereignty.',
    releaseDate: '2024-07',
    parameters: '123B',
  },
];

// Provider color map for model card styling
const PROVIDER_COLORS = {
  anthropic: '#c084fc',
  openai: '#34d399',
  google: '#38bdf8',
  xai: '#94a3b8',
  ollama: '#fb923c',
  mistral: '#f87171',
  deepseek: '#818cf8',
};

// ── RENDER MODELS GRID ──
function renderModelsGrid() {
  const grid = document.getElementById('modelsGrid');
  if (!grid) return;
  grid.innerHTML = '';

  MODEL_REGISTRY.forEach(model => {
    const configured = hasKey(model.provider);
    const card = document.createElement('div');
    card.className = `model-card ${model.tier === 'flagship' ? 'flagship' : ''} ${configured ? 'configured' : ''}`;
    card.style.setProperty('--model-color', model.color);

    const featureBadges = (model.features || []).map(f => {
      const map = { voice: '🎤 Voice', vision: '👁 Vision', tools: '🔧 Tools', streaming: '⚡ Stream',
                    local: '💻 Local', realtime: '🔴 Live', 'web-search': '🌐 Web', reasoning: '🧠 Reason', multimodal: '🎭 Multi' };
      return map[f] ? `<span class="model-badge badge-${f === 'local' ? 'local' : f === 'voice' ? 'voice' : f === 'vision' ? 'vision' : 'open'}">${map[f]}</span>` : '';
    }).join('');

    const tierBadge = model.tier === 'flagship'
      ? '<span class="model-badge badge-flagship">⭐ Flagship</span>'
      : model.tier === 'efficient' ? '<span class="model-badge badge-open">⚡ Efficient</span>' : '';

    const configBadge = configured
      ? '<span class="model-badge badge-configured">✓ Configured</span>'
      : '<span class="model-badge" style="background:rgba(248,113,113,0.08);color:#f87171;border:1px solid rgba(248,113,113,0.2)">⚿ No Key</span>';

    card.innerHTML = `
      <div class="model-card-header">
        <div class="model-provider-icon">${model.icon}</div>
        <div>
          <div class="model-card-title">${model.name}</div>
          <div class="model-card-provider" style="color:${model.color}">${(PROVIDERS[model.provider]||{name:model.provider}).name}</div>
        </div>
      </div>
      <div class="model-badges">
        ${tierBadge}
        ${configBadge}
        ${featureBadges}
        ${model.badge ? `<span class="model-badge badge-flagship">${model.badge}</span>` : ''}
      </div>
      <div class="model-specs">
        <div class="model-spec">Context: <span>${model.context}</span></div>
        <div class="model-spec">Params: <span>${model.parameters || 'N/A'}</span></div>
        <div class="model-spec">MMLU: <span style="color:var(--accent-emerald)">${model.mmlu}%</span></div>
        <div class="model-spec">HumanEval: <span style="color:var(--accent-blue)">${model.humanEval}%</span></div>
        <div class="model-spec">Cost In: <span>$${model.inputCost}/M</span></div>
        <div class="model-spec">Cost Out: <span>$${model.outputCost}/M</span></div>
      </div>
      <div style="font-size:10px;color:var(--text-muted);margin-bottom:10px;line-height:1.5">${model.description}</div>
      <div class="model-card-actions">
        <button class="btn-primary" style="font-size:10px;padding:5px 10px" onclick="testModelDirect('${model.id}','${model.provider}')">Test Live</button>
        ${!configured ? `<button class="btn-secondary" style="font-size:10px;padding:5px 10px" onclick="openVaultForProvider('${model.provider}')">Add Key</button>` : ''}
      </div>
    `;
    grid.appendChild(card);
  });

  updateModelConfiguredStatus();
  renderBenchmarkTable();
  populateModelSelects();
}

// ── RENDER BENCHMARK TABLE ──
function renderBenchmarkTable() {
  const tbody = document.getElementById('benchmarkTableBody');
  if (!tbody) return;

  const sorted = [...MODEL_REGISTRY].sort((a, b) => b.mmlu - a.mmlu);

  tbody.innerHTML = sorted.map(m => {
    const configured = hasKey(m.provider);
    const prov = PROVIDERS[m.provider] || { name: m.provider };
    const isTop = m.mmlu === Math.max(...MODEL_REGISTRY.map(x => x.mmlu));
    return `
      <tr>
        <td class="model-name" style="color:${m.color}">${m.icon} ${m.name}</td>
        <td style="color:var(--text-muted)">${prov.name || m.provider}</td>
        <td><div class="score-bar"><div class="score-fill" style="width:${m.mmlu * 0.6}px;background:${m.color}"></div>${m.mmlu}%</div></td>
        <td><div class="score-bar"><div class="score-fill" style="width:${m.humanEval * 0.6}px;background:${m.color}"></div>${m.humanEval}%</div></td>
        <td><div class="score-bar"><div class="score-fill" style="width:${m.math * 0.6}px;background:${m.color}"></div>${m.math}%</div></td>
        <td style="color:var(--accent-blue)">${m.context}</td>
        <td style="color:var(--text-muted)">${m.inputCost === 0 ? 'Free' : '$' + m.inputCost}</td>
        <td>${configured ? '<span style="color:var(--accent-emerald);font-weight:700">✓ Active</span>' : '<span style="color:var(--text-muted)">—</span>'}</td>
        <td><button class="btn-secondary" style="font-size:9px;padding:3px 8px" onclick="testModelDirect('${m.id}','${m.provider}')">Test</button></td>
      </tr>
    `;
  }).join('');
}

// ── POPULATE ALL MODEL SELECTS ──
function populateModelSelects() {
  const selects = [
    document.getElementById('testModelSelect'),
    document.getElementById('orchestratorModelSelect'),
  ];

  selects.forEach(sel => {
    if (!sel) return;
    const current = sel.value;
    sel.innerHTML = MODEL_REGISTRY.map(m => {
      const prov = PROVIDERS[m.provider] || { name: m.provider };
      const configured = hasKey(m.provider) ? '✓ ' : '';
      return `<option value="${m.id}" data-provider="${m.provider}">${configured}${m.icon} ${m.name} (${prov.name || m.provider})</option>`;
    }).join('');
    if (current) sel.value = current;
  });
}

// ── UPDATE CONFIGURED STATUS ──
function updateModelConfiguredStatus() {
  const vault = loadVault ? loadVault() : {};
  const count = Object.keys(vault).length;
  const el = document.getElementById('kpiModelsConfigured');
  if (el) el.textContent = count;

  // Refresh model grid borders
  document.querySelectorAll('.model-card').forEach(card => {
    // Re-render is simpler; skip live update for now
  });
}

// ── TEST MODEL DIRECT ──
function testModelDirect(modelId, provider) {
  const model = MODEL_REGISTRY.find(m => m.id === modelId);
  if (!model) return;

  if (!hasKey(provider)) {
    showToast(`No API key for ${PROVIDERS[provider]?.name || provider}. Add it in the Vault.`, 'warning', 4000);
    openVaultForProvider(provider);
    return;
  }

  // Switch to models tab and pre-fill test
  switchTab('models');
  const sel = document.getElementById('testModelSelect');
  const inp = document.getElementById('testPromptInput');
  if (sel) sel.value = modelId;
  if (inp) inp.value = `Hello! Please introduce yourself and describe your key capabilities in 2-3 sentences.`;
  setTimeout(() => runModelTest(), 100);
}

async function runModelTest() {
  const sel = document.getElementById('testModelSelect');
  const inp = document.getElementById('testPromptInput');
  const output = document.getElementById('modelTestOutput');
  if (!sel || !inp || !output) return;

  const modelId = sel.value;
  const prompt = inp.value.trim();
  if (!modelId || !prompt) { showToast('Select a model and enter a prompt', 'warning'); return; }

  const model = MODEL_REGISTRY.find(m => m.id === modelId);
  if (!model) return;

  if (!hasKey(model.provider)) {
    showToast(`Add ${PROVIDERS[model.provider]?.name || model.provider} API key in Vault first`, 'warning', 4000);
    openVault();
    return;
  }

  output.innerHTML = '<div class="spinner"></div> Calling ' + model.name + '…';

  try {
    const start = Date.now();
    const response = await callModel(model.provider, modelId, [{ role: 'user', content: prompt }], {
      system: 'You are a helpful assistant in AIOS-X. Be concise.',
      maxTokens: 512,
    });
    const elapsed = Date.now() - start;

    output.innerHTML = '';
    const meta = document.createElement('div');
    meta.style.cssText = 'font-size:10px;color:var(--text-muted);margin-bottom:8px;font-family:var(--font-mono)';
    meta.textContent = `Model: ${model.name} | Provider: ${PROVIDERS[model.provider]?.name} | Latency: ${elapsed}ms`;
    output.appendChild(meta);

    const content = document.createElement('div');
    content.className = 'typing-cursor';
    content.textContent = response;
    output.appendChild(content);
    setTimeout(() => content.classList.remove('typing-cursor'), 2000);

    showToast(`Response from ${model.name} (${elapsed}ms)`, 'success');
  } catch (err) {
    output.innerHTML = `<span style="color:var(--accent-red)">Error: ${escapeHtml(err.message)}</span>`;
    showToast(err.message, 'error', 5000);
  }
}

function openVaultForProvider(provider) {
  const sel = document.getElementById('vaultProviderSelect');
  if (sel) sel.value = provider;
  addVaultKey();
  openVault();
}

window.MODEL_REGISTRY = MODEL_REGISTRY;
window.PROVIDER_COLORS = PROVIDER_COLORS;
window.renderModelsGrid = renderModelsGrid;
window.updateModelConfiguredStatus = updateModelConfiguredStatus;
window.testModelDirect = testModelDirect;
window.runModelTest = runModelTest;
window.openVaultForProvider = openVaultForProvider;
window.populateModelSelects = populateModelSelects;
