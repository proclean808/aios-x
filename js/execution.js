/* ═════════════════════════════════════
   AIOS-X · Execution Pipeline Engine
   Notte · Zatanna · Sapiom · Orthogonal
═════════════════════════════════════ */
'use strict';

let pipelineSteps = [
  { id: 'step1', name: 'Web Research', agent: 'Sapiom', type: 'search', status: 'pending', config: { query: '' } },
  { id: 'step2', name: 'Code Generation', agent: 'Zatanna', type: 'code', status: 'pending', config: { language: 'python' } },
  { id: 'step3', name: 'Browser Automation', agent: 'Notte', type: 'browser', status: 'pending', config: { url: '' } },
  { id: 'step4', name: 'Result Synthesis', agent: 'Orthogonal', type: 'reasoning', status: 'pending', config: {} },
];

const EXEC_AGENTS = [
  { id: 'notte', name: 'Notte', role: 'Browser Automation', icon: '🌐', color: '#38bdf8',
    description: 'Puppeteer-based browser agent. Navigates, clicks, extracts, fills forms.' },
  { id: 'zatanna', name: 'Zatanna', role: 'Code Execution', icon: '💻', color: '#818cf8',
    description: 'Code generation, execution, and debugging. Supports 20+ languages.' },
  { id: 'sapiom', name: 'Sapiom', role: 'Semantic Search', icon: '🔍', color: '#34d399',
    description: 'Web search, academic papers, news, real-time data retrieval.' },
  { id: 'orthogonal', name: 'Orthogonal', role: 'Reasoning & Planning', icon: '🧮', color: '#fb923c',
    description: 'CoT reasoning, plan decomposition, DAG construction.' },
  { id: 'byteover', name: 'ByteRover', role: 'Memory & Context', icon: '🧠', color: '#f472b6',
    description: 'Manages .brv context trees, RAG retrieval, context compression.' },
  { id: 'rubric', name: 'Rubric AI', role: 'Scoring & Eval', icon: '📊', color: '#facc15',
    description: 'Judges quality, consistency, and task completion. Assigns rubric scores.' },
];

let execRunning = false;
let execAnimFrame = null;

// ── RENDER PIPELINE STEPS ──
function renderPipelineSteps() {
  const container = document.getElementById('pipelineSteps');
  if (!container) return;
  container.innerHTML = '';

  pipelineSteps.forEach((step, i) => {
    const el = document.createElement('div');
    el.className = 'pipeline-step ' + step.status;
    el.id = 'step_' + step.id;
    el.innerHTML = `
      <div class="step-num">${i + 1}</div>
      <div class="step-info">
        <div class="step-name">${escapeHtml(step.name)}</div>
        <div class="step-agent">${step.agent} · ${step.type}</div>
      </div>
      <div class="step-status ${step.status}" id="stepStatus_${step.id}">${getStatusLabel(step.status)}</div>
      <span class="step-del" onclick="deletePipelineStep('${step.id}')" title="Remove step">×</span>
    `;
    container.appendChild(el);
  });

  updateExecKpis();
  drawPipelineCanvas();
}

// ── RENDER EXEC AGENTS ──
function renderExecAgents() {
  const container = document.getElementById('execAgents');
  if (!container) return;
  container.innerHTML = EXEC_AGENTS.map(a => `
    <div class="agent-card" id="execAgent_${a.id}">
      <div class="agent-avatar" style="background:linear-gradient(135deg,${a.color}22,${a.color}44);border:1px solid ${a.color}33">${a.icon}</div>
      <div class="agent-info">
        <div class="agent-name" style="color:${a.color}">${a.name}</div>
        <div class="agent-role">${a.role}</div>
      </div>
      <div class="agent-status" id="execAgentStatus_${a.id}">Idle</div>
    </div>
  `).join('');
}

// ── ADD STEP ──
function addExecStep() {
  const name = prompt('Step name:');
  if (!name) return;
  const agentNames = EXEC_AGENTS.map(a => a.name).join(' / ');
  const agent = prompt(`Agent (${agentNames}):`, 'Sapiom') || 'Sapiom';
  const types = ['search', 'code', 'browser', 'reasoning', 'memory', 'scoring'];
  const type = types.find(t => agent.toLowerCase().includes(t.slice(0, 3))) || 'reasoning';

  pipelineSteps.push({
    id: 'step' + Date.now(),
    name, agent, type,
    status: 'pending',
    config: {},
  });

  renderPipelineSteps();
  showToast(`Step "${name}" added`, 'success');
}

// ── DELETE STEP ──
function deletePipelineStep(id) {
  pipelineSteps = pipelineSteps.filter(s => s.id !== id);
  renderPipelineSteps();
}

// ── RUN PIPELINE ──
async function runPipeline() {
  if (execRunning) { showToast('Pipeline already running', 'warning'); return; }
  if (!pipelineSteps.length) { showToast('Add steps to the pipeline first', 'warning'); return; }

  execRunning = true;
  clearLog('execLogBody');
  addLog('execLogBody', 'Pipeline started', 'info');
  updateExecStatusChip('⚡ Running');

  // Reset all steps
  pipelineSteps.forEach(s => { s.status = 'pending'; updateStepStatus(s.id, 'pending'); });

  for (const step of pipelineSteps) {
    addLog('execLogBody', `[${step.agent}] Starting: ${step.name}`, 'info');
    updateStepStatus(step.id, 'running');

    // Activate agent card
    setExecAgentStatus(step.agent.toLowerCase().replace(/\s/g, ''), 'running');

    // Check for live API
    const agentModel = getAgentModel(step.agent);
    const hasApi = agentModel && hasKey(agentModel.provider);

    if (hasApi) {
      await runLiveStep(step, agentModel);
    } else {
      await simulateStep(step);
    }

    setExecAgentStatus(step.agent.toLowerCase().replace(/\s/g, ''), 'done');
    updateStepStatus(step.id, 'done');
    addLog('execLogBody', `[${step.agent}] ✓ ${step.name} complete`, 'success');
    drawPipelineCanvas();
    await sleep(300);
  }

  execRunning = false;
  updateExecStatusChip('✓ Complete');
  addLog('execLogBody', 'Pipeline execution complete', 'success');
  showToast('Pipeline complete!', 'success');
}

async function runLiveStep(step, agentModel) {
  try {
    const prompt = buildStepPrompt(step);
    const result = await callModel(agentModel.provider, agentModel.id, [{ role: 'user', content: prompt }], {
      system: `You are ${step.agent}, an agentic AI specialized in ${step.type} tasks. Execute efficiently and concisely.`,
      maxTokens: 300,
      temperature: 0.5,
    });
    addLog('execLogBody', `[LIVE] ${step.agent}: ${result.slice(0, 120)}…`, 'success');
  } catch (err) {
    addLog('execLogBody', `[ERR] ${step.agent}: ${err.message}`, 'error');
    await simulateStep(step);
  }
}

async function simulateStep(step) {
  const durations = { search: 800, code: 1200, browser: 1000, reasoning: 900, memory: 600, scoring: 700 };
  const duration = (durations[step.type] || 800) * (0.8 + Math.random() * 0.4);
  await sleep(duration);

  const messages = {
    search: `Retrieved 8 results, top similarity 0.94 — extracted key insights`,
    code: `Generated 47 lines of Python — all tests passing, complexity O(n log n)`,
    browser: `Navigated to target URL, extracted 3 elements, screenshot captured`,
    reasoning: `Decomposed task into 4 sub-problems, DAG built, priority assigned`,
    memory: `Loaded 5 relevant nodes from .brv store, compresr: 2,400 → 890 tokens`,
    scoring: `Rubric evaluation: 84/100 — Strong structure, minor depth gaps noted`,
  };

  addLog('execLogBody', `[SIM] ${step.agent}: ${messages[step.type] || 'Step completed'}`, 'success');
}

function buildStepPrompt(step) {
  const prompts = {
    search: `Search for and summarize: "${step.name}". Return 3-5 key findings.`,
    code: `Generate efficient code for: "${step.name}". Include brief explanation.`,
    browser: `Describe how you would automate: "${step.name}" in a browser.`,
    reasoning: `Analyze and plan: "${step.name}". Break into concrete steps.`,
    memory: `Retrieve and summarize relevant context for: "${step.name}".`,
    scoring: `Evaluate the quality and completeness of: "${step.name}".`,
  };
  return prompts[step.type] || `Execute: ${step.name}`;
}

function getAgentModel(agentName) {
  const agentModelMap = {
    'Notte': 'gpt-4o',
    'Zatanna': 'claude-sonnet-4-6',
    'Sapiom': 'gemini-2.0-flash',
    'Orthogonal': 'claude-opus-4-6',
    'ByteRover': 'claude-haiku-4-5',
    'Rubric': 'gpt-4o-mini',
  };
  const modelId = agentModelMap[agentName];
  if (!modelId || !MODEL_REGISTRY) return null;
  return MODEL_REGISTRY.find(m => m.id === modelId);
}

function setExecAgentStatus(id, status) {
  const card = document.getElementById('execAgent_' + id);
  const statusEl = document.getElementById('execAgentStatus_' + id);
  if (!card || !statusEl) return;
  card.className = 'agent-card ' + status;
  statusEl.textContent = status === 'running' ? '⚡ Active' : status === 'done' ? '✓ Done' : 'Idle';
}

function updateStepStatus(id, status) {
  const el = document.getElementById('step_' + id);
  const statusEl = document.getElementById('stepStatus_' + id);
  if (el) {
    el.className = 'pipeline-step ' + status;
  }
  if (statusEl) {
    statusEl.className = 'step-status ' + status;
    statusEl.textContent = getStatusLabel(status);
  }
  const step = pipelineSteps.find(s => s.id === id);
  if (step) step.status = status;
}

function getStatusLabel(status) {
  return { pending: '○ Pending', running: '⚡ Running', done: '✓ Done', error: '✕ Error' }[status] || status;
}

function updateExecStatusChip(text) {
  const el = document.getElementById('execStatusChip');
  if (el) el.textContent = text;
}

function updateExecKpis() {
  const el = document.getElementById('execStepCount');
  if (el) el.textContent = pipelineSteps.length;
}

// ── PIPELINE CANVAS ──
function drawPipelineCanvas() {
  const canvas = document.getElementById('pipelineCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  ctx.clearRect(0, 0, W, H);

  if (!pipelineSteps.length) return;

  const nodeW = Math.min(80, (W - 40) / pipelineSteps.length - 10);
  const nodeH = 40;
  const startX = 20;
  const spacing = (W - 40) / Math.max(pipelineSteps.length, 1);
  const y = H / 2;

  // Connection lines
  pipelineSteps.forEach((step, i) => {
    if (i === pipelineSteps.length - 1) return;
    const x1 = startX + i * spacing + nodeW / 2;
    const x2 = startX + (i + 1) * spacing + nodeW / 2;

    const statusColors = { done: '#34d399', running: '#38bdf8', pending: '#334155', error: '#f87171' };
    ctx.beginPath();
    ctx.strokeStyle = statusColors[step.status];
    ctx.lineWidth = 2;
    ctx.setLineDash(step.status === 'pending' ? [4, 4] : []);
    ctx.moveTo(x1, y);
    ctx.lineTo(x2, y);
    ctx.stroke();
    ctx.setLineDash([]);

    // Arrow
    const arrowX = (x1 + x2) / 2;
    ctx.beginPath();
    ctx.fillStyle = statusColors[step.status];
    ctx.moveTo(arrowX + 6, y);
    ctx.lineTo(arrowX - 2, y - 5);
    ctx.lineTo(arrowX - 2, y + 5);
    ctx.closePath();
    ctx.fill();
  });

  // Nodes
  pipelineSteps.forEach((step, i) => {
    const x = startX + i * spacing;
    const statusColors = { done: '#34d399', running: '#38bdf8', pending: '#334155', error: '#f87171' };
    const color = statusColors[step.status];

    // Node rect
    ctx.beginPath();
    ctx.fillStyle = step.status === 'running' ? 'rgba(56,189,248,0.1)' : 'rgba(17,24,39,0.8)';
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    roundRect(ctx, x, y - nodeH / 2, nodeW, nodeH, 6);
    ctx.fill();
    ctx.stroke();

    // Number
    ctx.fillStyle = color;
    ctx.font = `bold 10px Inter, sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText(i + 1, x + nodeW / 2, y - 8);

    // Label
    ctx.fillStyle = '#94a3b8';
    ctx.font = '8px Inter, sans-serif';
    const shortName = step.name.slice(0, 8) + (step.name.length > 8 ? '…' : '');
    ctx.fillText(shortName, x + nodeW / 2, y + 6);

    // Status icon
    const icons = { done: '✓', running: '⚡', pending: '○', error: '✕' };
    ctx.fillStyle = color;
    ctx.font = '10px Inter, sans-serif';
    ctx.fillText(icons[step.status] || '○', x + nodeW / 2, y + 18);
  });
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

window.renderPipelineSteps = renderPipelineSteps;
window.renderExecAgents = renderExecAgents;
window.addExecStep = addExecStep;
window.deletePipelineStep = deletePipelineStep;
window.runPipeline = runPipeline;
window.drawPipelineCanvas = drawPipelineCanvas;
