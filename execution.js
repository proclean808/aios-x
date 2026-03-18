/* ═════════════════════════════════════
   AIOS-X · Execution Pipeline Engine
   Notte + Zatanna + Sapiom + Orthogonal
═════════════════════════════════════ */

let pipelineSteps = [];
let pipelineRunning = false;
let execAnimFrame = null;
let execWaves = [];

// ── STEP TEMPLATES ──
const STEP_TEMPLATES = [
  { type: 'RESEARCH', name: 'Web Research', agent: 'Notte Browser Agent', icon: '🌐' },
  { type: 'API CALL', name: 'API Integration', agent: 'Zatanna API Bridge', icon: '🔌' },
  { type: 'INFERENCE', name: 'Model Inference', agent: 'DeepSeek V4', icon: '🧠' },
  { type: 'VERIFY', name: 'Reasoning Check', agent: 'Rubric AI', icon: '✅' },
  { type: 'MEMORY', name: 'State Persist', agent: 'ByteRover Memory', icon: '💾' },
  { type: 'PAYMENT', name: 'Agent Commerce', agent: 'Sapiom Payments', icon: '💸' },
  { type: 'DISCOVER', name: 'Service Discovery', agent: 'Orthogonal Market', icon: '🔍' },
  { type: 'OUTPUT', name: 'Generate Output', agent: 'Generative UI', icon: '📊' },
];

const DEFAULT_PIPELINE = [
  { type: 'RESEARCH', name: 'Web Research', agent: 'Notte Browser Agent', status: 'pending' },
  { type: 'INFERENCE', name: 'Multi-Model Debate', agent: 'DeepSeek + Llama', status: 'pending' },
  { type: 'VERIFY', name: 'Rubric Verify', agent: 'Rubric AI', status: 'pending' },
  { type: 'MEMORY', name: 'Persist State', agent: 'ByteRover', status: 'pending' },
  { type: 'OUTPUT', name: 'Render Output', agent: 'Generative UI', status: 'pending' },
];

function initPipelineCanvas() {
  if (pipelineSteps.length === 0) {
    pipelineSteps = DEFAULT_PIPELINE.map((s,i) => ({ ...s, id: i }));
  }
  renderPipeline();
}

function renderPipeline() {
  const canvas = document.getElementById('pipelineCanvas');
  if (!canvas) return;

  canvas.innerHTML = '';

  pipelineSteps.forEach((step, i) => {
    const stepEl = document.createElement('div');
    stepEl.className = 'pipeline-step';

    // Arrow connector
    if (i > 0) {
      const arrow = document.createElement('div');
      arrow.className = 'step-arrow' + (step.status === 'running' || step.status === 'done' ? ' active' : '');
      stepEl.appendChild(arrow);
    }

    // Step box
    const box = document.createElement('div');
    box.className = `step-box ${step.status}`;
    box.innerHTML = `
      <div class="step-type">${step.type}</div>
      <div class="step-name">${step.name}</div>
      <div class="step-agent">${step.agent}</div>
      <button class="step-del" onclick="removePipelineStep(${i})" title="Remove step">✕</button>
    `;
    box.addEventListener('click', (e) => {
      if (e.target.classList.contains('step-del')) return;
      showStepDetail(step);
    });
    stepEl.appendChild(box);
    canvas.appendChild(stepEl);
  });

  // Add placeholder
  const placeholder = document.createElement('div');
  placeholder.className = 'step-add-placeholder';
  placeholder.innerHTML = '<i class="fas fa-plus"></i> Add Step';
  placeholder.addEventListener('click', addPipelineStep);
  canvas.appendChild(placeholder);
}

function addPipelineStep() {
  const template = STEP_TEMPLATES[pipelineSteps.length % STEP_TEMPLATES.length];
  pipelineSteps.push({
    ...template,
    id: Date.now(),
    status: 'pending'
  });
  renderPipeline();
  showToast(`Added: ${template.name}`, 'info', 1500);
}

function removePipelineStep(index) {
  pipelineSteps.splice(index, 1);
  renderPipeline();
}

function showStepDetail(step) {
  openModal(`Pipeline Step: ${step.name}`, `
    <div class="modal-kv">
      <div class="mkv-row"><span class="mkv-key">Type:</span><span class="mkv-val">${step.type}</span></div>
      <div class="mkv-row"><span class="mkv-key">Agent:</span><span class="mkv-val">${step.agent}</span></div>
      <div class="mkv-row"><span class="mkv-key">Status:</span><span class="mkv-val">${step.status}</span></div>
      <div class="mkv-row"><span class="mkv-key">Description:</span><span class="mkv-val">This step uses ${step.agent} to perform ${step.name.toLowerCase()} operations within the MCP-coordinated pipeline.</span></div>
    </div>
  `);
}

async function executePipeline() {
  if (pipelineRunning) {
    showToast('Pipeline already executing', 'warning');
    return;
  }
  if (pipelineSteps.length === 0) {
    showToast('Add at least one step', 'warning');
    return;
  }

  pipelineRunning = true;
  const btn = document.getElementById('runPipeline');
  btn.disabled = true;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Running...';

  const execLogBody = document.getElementById('execLogBody');
  addLog('execLogBody', '━━━ PIPELINE EXECUTION STARTED ━━━', 'highlight');
  addLog('execLogBody', `Steps: ${pipelineSteps.length} | Strategy: MCP-coordinated`, 'info');

  // Reset all steps
  pipelineSteps.forEach(s => s.status = 'pending');
  renderPipeline();
  updateAgentStatuses([]);
  await sleep(300);

  // Execute each step
  for (let i = 0; i < pipelineSteps.length; i++) {
    pipelineSteps[i].status = 'running';
    renderPipeline();

    // Activate corresponding agent
    activateAgentForStep(pipelineSteps[i]);

    // Simulate step execution
    const execTime = 800 + Math.random() * 1200;
    addLog('execLogBody', `⚡ [${i+1}/${pipelineSteps.length}] ${pipelineSteps[i].name} via ${pipelineSteps[i].agent}...`, 'info');

    addExecWave(i);
    await sleep(execTime);

    // Occasionally simulate an event
    if (Math.random() < 0.3) {
      const events = [
        'Cache hit: ByteRover retrieved context in 42ms',
        'MCP tool call resolved in 89ms',
        'compresr compressed 4,200 tokens → 1,190 tokens',
        'Zatanna bridged legacy REST endpoint successfully',
        'Rubric AI confidence: 94.2%',
      ];
      addLog('execLogBody', `  ↳ ${pickRandom(events)}`, 'success');
    }

    pipelineSteps[i].status = 'done';
    renderPipeline();
    addLog('execLogBody', `  ✅ ${pipelineSteps[i].name} completed`, 'success');

    updateHeaderStats(Object.keys(window.activeAgents || {}).length, null);
    await sleep(200);
  }

  addLog('execLogBody', '━━━ PIPELINE EXECUTION COMPLETE ━━━', 'highlight');
  addLog('execLogBody', `All ${pipelineSteps.length} steps executed. State persisted to ByteRover.`, 'success');

  incrementMemoryNodes(2);
  updateMemoryStats();

  pipelineRunning = false;
  btn.disabled = false;
  btn.innerHTML = '<i class="fas fa-play"></i> Execute Pipeline';
  showToast('Pipeline executed successfully!', 'success');
}

// Agent → Step mapping
const AGENT_STEP_MAP = {
  RESEARCH: 'notte',
  'API CALL': 'zatanna',
  INFERENCE: 'rubric',
  VERIFY: 'rubric',
  MEMORY: 'byterover',
  PAYMENT: 'sapiom',
  DISCOVER: 'orthogonal',
  OUTPUT: 'notte',
};

window.activeAgents = {};

function activateAgentForStep(step) {
  const agentId = AGENT_STEP_MAP[step.type];
  if (!agentId) return;
  const statusEl = document.querySelector(`.agent-card[data-agent="${agentId}"] .ac-status`);
  const card = document.querySelector(`.agent-card[data-agent="${agentId}"]`);
  if (statusEl) {
    statusEl.className = 'ac-status busy';
    statusEl.textContent = 'BUSY';
  }
  if (card) {
    card.classList.add('active-flash');
    setTimeout(() => card.classList.remove('active-flash'), 1000);
    window.activeAgents[agentId] = true;
  }
  updateHeaderStats(Object.keys(window.activeAgents).length, null);
}

function updateAgentStatuses(activeList) {
  document.querySelectorAll('.agent-card').forEach(card => {
    const agent = card.dataset.agent;
    const status = card.querySelector('.ac-status');
    if (!status) return;
    if (agent === 'byterover') {
      status.className = 'ac-status running';
      status.textContent = 'RUNNING';
    } else {
      status.className = 'ac-status idle';
      status.textContent = 'IDLE';
    }
  });
  window.activeAgents = {};
}

function activateAgent(agentId) {
  const card = document.querySelector(`.agent-card[data-agent="${agentId}"]`);
  const status = card?.querySelector('.ac-status');
  if (!status) return;
  if (status.textContent === 'IDLE') {
    status.className = 'ac-status running';
    status.textContent = 'RUNNING';
    window.activeAgents[agentId] = true;
    showToast(`${agentId} activated`, 'success', 1500);
  } else {
    status.className = 'ac-status idle';
    status.textContent = 'IDLE';
    delete window.activeAgents[agentId];
    showToast(`${agentId} deactivated`, 'info', 1500);
  }
  updateHeaderStats(Object.keys(window.activeAgents).length, null);
}

function configAgent(agentId) {
  const configs = {
    notte: { 'Browser': 'Chromium headless', 'Timeout': '30s', 'JS Enabled': 'Yes', 'Proxy': 'None' },
    zatanna: { 'Protocols': 'REST, SOAP, GraphQL', 'Auth': 'OAuth 2.1', 'Retry': '3x', 'Timeout': '10s' },
    sapiom: { 'Network': 'Mainnet + Testnet', 'Currency': 'USDC, ETH', 'Gas limit': 'Auto', 'Max Tx': '$10,000' },
    orthogonal: { 'Registry': 'Orthogonal Marketplace', 'API Version': 'v2', 'Cache TTL': '5m', 'Auth': 'Bearer' },
    byterover: { 'Format': '.brv context-tree', 'Accuracy': '92.2%', 'Compression': 'compresr', 'Max nodes': '100,000' },
    rubric: { 'Logic Check': 'Enabled', 'Hallucination Guard': 'Enabled', 'Chain-of-Thought': 'Enabled', 'Threshold': '0.85' },
  };
  const config = configs[agentId] || {};
  const rows = Object.entries(config).map(([k,v]) =>
    `<div class="mkv-row"><span class="mkv-key">${k}:</span><span class="mkv-val">${v}</span></div>`
  ).join('');
  openModal(`Agent Config: ${agentId}`, `<div class="modal-kv">${rows}</div>`);
}

// ── EXEC WAVE CANVAS ──
function initExecCanvas() {
  const canvas = document.getElementById('execCanvas');
  if (!canvas || canvas._initialized) return;
  canvas._initialized = true;
  const ctx = canvas.getContext('2d');
  let t = 0;

  const waves = [
    { freq: 0.02, amp: 20, phase: 0, color: '#38bdf8', alpha: 0.7 },
    { freq: 0.035, amp: 14, phase: 1.5, color: '#a78bfa', alpha: 0.5 },
    { freq: 0.015, amp: 28, phase: 0.8, color: '#34d399', alpha: 0.4 },
  ];

  function draw() {
    const W = canvas.offsetWidth;
    const H = canvas.height;
    canvas.width = W;
    ctx.clearRect(0, 0, W, H);

    waves.forEach(wave => {
      ctx.beginPath();
      ctx.moveTo(0, H/2);
      for (let x = 0; x <= W; x += 2) {
        const y = H/2 + Math.sin(x * wave.freq + t * 0.05 + wave.phase) * wave.amp
                      * (pipelineRunning ? 1 + Math.sin(t * 0.03) * 0.5 : 0.5);
        ctx.lineTo(x, y);
      }
      ctx.strokeStyle = wave.color;
      ctx.globalAlpha = wave.alpha;
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.globalAlpha = 1;
    });

    // Activity indicators when running
    if (pipelineRunning) {
      const dotCount = 8;
      for (let i = 0; i < dotCount; i++) {
        const x = ((t * 3 + i * (W/dotCount)) % W);
        const y = H/2 + Math.sin(i * 0.8) * 30;
        ctx.beginPath();
        ctx.arc(x, y, 2, 0, Math.PI * 2);
        ctx.fillStyle = '#facc15';
        ctx.globalAlpha = 0.8;
        ctx.fill();
        ctx.globalAlpha = 1;
      }
    }

    t++;
    execAnimFrame = requestAnimationFrame(draw);
  }

  draw();
}

function addExecWave(stepIndex) {
  // Pulse effect handled by animation frame
}
