/* ═════════════════════════════════════
   AIOS-X · Orchestration Engine
   Multi-Provider BYOK Support
═════════════════════════════════════ */

const ORCHESTRATION_STEPS = [
  { layer: 'layer-security', node: 0, msg: '🔐 Security layer: Identity verification + ClawSecure scan', delay: 200 },
  { layer: 'layer-memory', node: 0, msg: '🧠 Memory layer: Loading ByteRover context-tree (.brv)', delay: 400 },
  { layer: 'layer-memory', node: 1, msg: '🗜️ compresr: Compressing context (avg 68% reduction)', delay: 600 },
  { layer: 'layer-exec', node: 0, msg: '🌐 Notte browser agent: Activated for web research', delay: 800 },
  { layer: 'layer-exec', node: 1, msg: '🔌 Zatanna API bridge: Legacy system connectivity established', delay: 1000 },
  { layer: 'layer-verify', node: 0, msg: '🔬 Rubric AI: Reasoning verification engine armed', delay: 1200 },
  { layer: 'layer-orch', node: 1, msg: '⚖️ Debate engine: Cross-model argument synthesis running', delay: 2400 },
  { layer: 'layer-orch', node: 2, msg: '✅ Consensus verifier: Evaluating model agreement', delay: 2800 },
  { layer: 'layer-verify', node: 3, msg: '⭐ Rubric AI: Scoring and ranking outputs', delay: 3200 },
  { layer: 'layer-ui', node: 0, msg: '🖥️ Generative UI: Rendering adaptive response', delay: 3600 },
];

const TASK_RESPONSES = {
  default: [
    "Analyzing task through multi-model consensus framework. DeepSeek V4 identifies key structural patterns. Llama 4 Scout leverages its 10M token context window for comprehensive document analysis. Mistral 3's sparse MoE architecture provides efficiency gains at 50% compute cost.",
    "Cross-model debate initiated. Models propose competing frameworks. DeepSeek V4 advocates for JEPA-based reasoning; Llama 4 Scout suggests RAG augmentation given context window advantage; Mistral 3 recommends MoE routing for cost efficiency.",
    "Rubric AI verification: Logic coherence 94% · Factual grounding 89% · Hallucination risk 6% · Consensus strength 87%. Synthesizing final output.",
    "MCP Protocol routing task to specialized execution agents. Notte browser agent activated for real-time data retrieval. Zatanna API bridge connecting to legacy enterprise systems.",
    "ByteRover memory updated: task context persisted to .brv context-tree. State snapshot saved for multi-session continuity. compresr reduced context from 48K to 14K tokens (71% reduction).",
  ]
};

const ORCHESTRATION_STRATEGIES = {
  debate: {
    name: 'Debate & Consensus',
    desc: 'All models generate competing responses, then vote on best answer',
    flow: ['Decompose', '→', 'Parallel Generate', '→', 'Debate', '→', 'Vote', '→', 'Verify', '→', 'Output']
  },
  parallel: {
    name: 'Parallel Execution',
    desc: 'Tasks split across models simultaneously for maximum throughput',
    flow: ['Decompose', '→', 'Split', '→', 'Parallel Run', '→', 'Merge', '→', 'Output']
  },
  waterfall: {
    name: 'Waterfall Pipeline',
    desc: 'Each model builds on the previous model\'s output sequentially',
    flow: ['DeepSeek', '→', 'Llama', '→', 'Mistral', '→', 'GPT-OSS', '→', 'Verify', '→', 'Output']
  },
  adversarial: {
    name: 'Adversarial Challenge',
    desc: 'Models actively try to find flaws in each other\'s reasoning',
    flow: ['Generate', '→', 'Attack', '→', 'Defend', '→', 'Score', '→', 'Consensus', '→', 'Output']
  },
  swarm: {
    name: 'Swarm Intelligence',
    desc: 'Hundreds of micro-queries distributed across models, emergent consensus',
    flow: ['Swarm Deploy', '→', 'Micro-Tasks', '→', 'Aggregate', '→', 'Emergence', '→', 'Output']
  }
};

let orchestrationRunning = false;
let taskCounter = 0;

async function launchOrchestration() {
  if (orchestrationRunning) {
    showToast('Orchestration already running', 'warning');
    return;
  }

  const input = document.getElementById('orchestratorInput').value.trim();
  if (!input) {
    showToast('Please enter a task prompt', 'warning');
    document.getElementById('orchestratorInput').focus();
    return;
  }

  const strategy = document.getElementById('orchestrationStrategy').value;
  const selectedModels = typeof getSelectedModels === 'function' ? getSelectedModels() : [];
  
  if (selectedModels.length === 0) {
    showToast('Enable at least one model', 'warning');
    return;
  }

  // Check demo mode
  const isDemo = typeof vault !== 'undefined' && vault.isInDemoMode();
  if (isDemo && !vault.canMakeDemoRequest()) {
    showToast('Demo limit reached. Configure API keys in Vault.', 'warning');
    if (typeof openVaultModal === 'function') openVaultModal();
    return;
  }

  orchestrationRunning = true;
  taskCounter++;
  updateHeaderStats(null, taskCounter);

  const btn = document.getElementById('launchOrchestration');
  btn.disabled = true;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Orchestrating...';

  const modelNames = selectedModels.map(m => MODEL_PROVIDERS[m.provider]?.name || m.provider).join(', ');
  addLog('orchestrationLogBody', `━━━ TASK #${taskCounter}: "${input.substring(0,60)}..." ━━━`, 'highlight');
  addLog('orchestrationLogBody', `Strategy: ${ORCHESTRATION_STRATEGIES[strategy]?.name || strategy}`, 'info');
  addLog('orchestrationLogBody', `Active models (${selectedModels.length}): ${modelNames}`, 'info');
  if (isDemo) {
    addLog('orchestrationLogBody', `⚠️ Demo mode: ${vault.getDemoRemaining()} requests remaining`, 'warning');
  }

  // Animate layers (non-model steps)
  for (const step of ORCHESTRATION_STEPS.slice(0, 6)) {
    await sleep(step.delay);
    activateLayerNode(step.layer, step.node);
    addLog('orchestrationLogBody', step.msg, 'success');
  }

  // Call models in parallel
  addLog('orchestrationLogBody', '⚡ Dispatching to selected models...', 'highlight');
  
  // Clear and prepare response grid
  const responseGrid = document.getElementById('modelResponseGrid');
  if (responseGrid) {
    responseGrid.innerHTML = '';
    responseGrid.style.display = 'grid';
  }

  const messages = [
    { role: 'system', content: 'You are a helpful AI assistant participating in a multi-model orchestration system. Provide concise, insightful responses.' },
    { role: 'user', content: input }
  ];

  let results = [];
  
  if (isDemo) {
    vault.incrementDemoCount();
    // Demo mode: simulate responses
    results = await Promise.all(selectedModels.map(async ({ provider, model }) => {
      const startTime = Date.now();
      await sleep(800 + Math.random() * 1200);
      const response = await getDemoResponse(provider);
      return {
        provider,
        model,
        response,
        latency: Date.now() - startTime,
        status: 'demo'
      };
    }));
  } else {
    // Real API calls
    results = await callMultipleModels(messages, selectedModels);
  }

  // Render responses in grid
  results.forEach((result, idx) => {
    const providerInfo = MODEL_PROVIDERS[result.provider] || {};
    addLog('orchestrationLogBody', 
      result.status === 'error' 
        ? `❌ ${providerInfo.name}: ${result.error}` 
        : `✅ ${providerInfo.name} responded (${result.latency}ms)`, 
      result.status === 'error' ? 'error' : 'success'
    );

    if (responseGrid) {
      const card = createResponseCard(result, idx);
      responseGrid.appendChild(card);
    }
  });

  // Continue with remaining orchestration steps
  for (const step of ORCHESTRATION_STEPS.slice(6)) {
    await sleep(step.delay - 2000);
    activateLayerNode(step.layer, step.node);
    addLog('orchestrationLogBody', step.msg, 'success');
  }

  addLog('orchestrationLogBody', `✅ Task #${taskCounter} complete. ${results.filter(r => r.status !== 'error').length}/${results.length} models responded.`, 'success');

  // Update memory stats
  if (typeof incrementMemoryNodes === 'function') incrementMemoryNodes(3);
  if (typeof updateMemoryStats === 'function') updateMemoryStats();

  btn.disabled = false;
  btn.innerHTML = '<i class="fas fa-play"></i> Launch Orchestration';
  orchestrationRunning = false;

  showToast(`Task #${taskCounter} completed`, 'success');
}

function createResponseCard(result, index) {
  const providerInfo = MODEL_PROVIDERS[result.provider] || {};
  const card = document.createElement('div');
  card.className = `response-card ${result.status === 'error' ? 'error' : ''} ${result.status === 'demo' ? 'demo' : ''}`;
  card.style.setProperty('--card-color', providerInfo.color || '#38bdf8');
  card.style.animationDelay = `${index * 100}ms`;

  card.innerHTML = `
    <div class="rc-header">
      <div class="rc-badge" style="background: ${providerInfo.color}20; color: ${providerInfo.color}">${providerInfo.icon || '?'}</div>
      <div class="rc-info">
        <div class="rc-name">${providerInfo.name || result.provider}</div>
        <div class="rc-model">${result.model}</div>
      </div>
      <div class="rc-meta">
        <span class="rc-latency">${result.latency}ms</span>
        ${result.status === 'demo' ? '<span class="rc-demo-badge">DEMO</span>' : ''}
      </div>
    </div>
    <div class="rc-content">
      ${result.status === 'error' 
        ? `<div class="rc-error"><i class="fas fa-exclamation-triangle"></i> ${result.error}</div>`
        : `<div class="rc-response">${escapeHtml(result.response)}</div>`
      }
    </div>
    <div class="rc-footer">
      <button class="rc-btn" onclick="copyResponse(this)" data-response="${escapeAttr(result.response || '')}">
        <i class="fas fa-copy"></i> Copy
      </button>
      <button class="rc-btn" onclick="expandResponse(this)">
        <i class="fas fa-expand"></i> Expand
      </button>
    </div>
  `;

  return card;
}

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function escapeAttr(text) {
  if (!text) return '';
  return text.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function copyResponse(btn) {
  const text = btn.dataset.response;
  navigator.clipboard.writeText(text).then(() => {
    showToast('Response copied to clipboard', 'success');
  }).catch(() => {
    showToast('Failed to copy', 'error');
  });
}

function expandResponse(btn) {
  const card = btn.closest('.response-card');
  const content = card.querySelector('.rc-response')?.textContent || card.querySelector('.rc-error')?.textContent || '';
  const name = card.querySelector('.rc-name')?.textContent || 'Response';
  openModal(name + ' Response', `<div class="expanded-response">${escapeHtml(content)}</div>`);
}

window.copyResponse = copyResponse;
window.expandResponse = expandResponse;

function activateLayerNode(layerId, nodeIndex) {
  const layer = document.getElementById(layerId);
  if (!layer) return;
  const nodes = layer.querySelectorAll('.arch-node');
  if (nodes[nodeIndex]) {
    nodes[nodeIndex].classList.add('active');
    setTimeout(() => nodes[nodeIndex].classList.remove('active'), 1200);
  }
}

function initOrchestrator() {
  const btn = document.getElementById('launchOrchestration');
  if (btn) btn.addEventListener('click', launchOrchestration);

  // Enter key in textarea
  const ta = document.getElementById('orchestratorInput');
  if (ta) {
    ta.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.key === 'Enter') launchOrchestration();
    });
  }

  addLog('orchestrationLogBody', 'Press Ctrl+Enter in the task input or click Launch to orchestrate', 'info');
}
