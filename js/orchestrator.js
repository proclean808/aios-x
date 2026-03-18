/* ═════════════════════════════════════
   AIOS-X · Orchestration Engine
   Multi-strategy, live API + simulation
═════════════════════════════════════ */
'use strict';

let orchState = {
  running: false,
  taskCount: 0,
  totalTokens: 0,
  latencies: [],
  currentModel: null,
};

const ARCH_LAYER_COUNT = 7;

// ── AGENTS ──
const AGENTS = [
  { id: 'notte',    name: 'Notte',    role: 'Browser Agent',   icon: '🌐', status: 'idle' },
  { id: 'zatanna',  name: 'Zatanna',  role: 'Code Agent',      icon: '💻', status: 'idle' },
  { id: 'sapiom',   name: 'Sapiom',   role: 'Search Agent',    icon: '🔍', status: 'idle' },
  { id: 'orthogonal',name:'Orthogonal',role:'Reasoning Agent', icon: '🧮', status: 'idle' },
  { id: 'byteover', name: 'ByteRover',role: 'Memory Agent',    icon: '🧠', status: 'idle' },
  { id: 'rubric',   name: 'Rubric',   role: 'Scoring Agent',   icon: '📊', status: 'idle' },
];

// ── STRATEGY CONFIGS ──
const STRATEGIES = {
  debate: {
    label: 'Debate',
    description: 'Multiple models debate the task; best answer wins',
    agentFlow: [0,1,2,5],
    layerSequence: [0,1,2,3,4,5,6],
  },
  parallel: {
    label: 'Parallel',
    description: 'All agents work simultaneously, results merged',
    agentFlow: [0,1,2,3,4,5],
    layerSequence: [0,2,4,5,6],
  },
  waterfall: {
    label: 'Waterfall',
    description: 'Sequential pipeline; each stage feeds the next',
    agentFlow: [0,1,2,3],
    layerSequence: [0,1,2,3,4,5,6],
  },
  adversarial: {
    label: 'Adversarial',
    description: 'Red-team / Blue-team model competition',
    agentFlow: [3,5],
    layerSequence: [1,6,5],
  },
  swarm: {
    label: 'Swarm',
    description: 'Emergent behavior from multiple lightweight agents',
    agentFlow: [0,1,2,3,4,5],
    layerSequence: [0,1,2,3,4],
  },
};

// ── RENDER AGENT ROSTER ──
function renderAgentRoster() {
  const roster = document.getElementById('agentRoster');
  if (!roster) return;
  roster.innerHTML = AGENTS.map(a => `
    <div class="agent-card" id="agent_${a.id}">
      <div class="agent-avatar">${a.icon}</div>
      <div class="agent-info">
        <div class="agent-name">${a.name}</div>
        <div class="agent-role">${a.role}</div>
      </div>
      <div class="agent-status" id="agentStatus_${a.id}">Idle</div>
    </div>
  `).join('');
}

// ── LAUNCH ORCHESTRATION ──
async function launchOrchestration() {
  if (orchState.running) { showToast('Orchestration already running', 'warning'); return; }

  const task = document.getElementById('taskInput')?.value?.trim();
  if (!task) { showToast('Enter a task to orchestrate', 'warning'); return; }

  const strategyId = document.getElementById('strategySelect')?.value || 'debate';
  const modelId = document.getElementById('orchestratorModelSelect')?.value || 'claude-sonnet-4-6';
  const maxRounds = parseInt(document.getElementById('maxRoundsInput')?.value || 3);

  const model = typeof MODEL_REGISTRY !== 'undefined' ? MODEL_REGISTRY.find(m => m.id === modelId) : null;
  const provider = model?.provider || 'anthropic';
  const strategy = STRATEGIES[strategyId] || STRATEGIES.debate;

  orchState.running = true;
  orchState.taskCount++;
  orchState.currentModel = modelId;

  // Update KPIs
  updateKpi('kpiTasks', orchState.taskCount);
  updateKpi('kpiModelChip', (model?.name || modelId));

  setLoading('launchBtn', true, 'Orchestrating…');
  clearLog('orchestrationLogBody');

  addLog('orchestrationLogBody', `Task #${orchState.taskCount}: "${task}"`, 'info');
  addLog('orchestrationLogBody', `Strategy: ${strategy.label} | Model: ${modelId} | Rounds: ${maxRounds}`, 'info');

  // Animate arch layers
  await animateArchLayers(strategy.layerSequence, 300);

  // Animate agents
  const agentFlow = strategy.agentFlow;
  animateAgents(agentFlow, 600);

  // Check if live API available
  const hasApiKey = typeof hasKey === 'function' && hasKey(provider);

  if (hasApiKey) {
    await runLiveOrchestration(task, modelId, provider, strategy, maxRounds);
  } else {
    await runSimulatedOrchestration(task, modelId, strategy, maxRounds);
  }

  orchState.running = false;
  setLoading('launchBtn', false, '▶ Launch');
  showToast('Orchestration complete', 'success');
}

// ── LIVE API ORCHESTRATION ──
async function runLiveOrchestration(task, modelId, provider, strategy, maxRounds) {
  const systemPrompt = buildSystemPrompt(strategy);
  const messages = [{ role: 'user', content: task }];
  const start = Date.now();

  addLog('orchestrationLogBody', `[LIVE] Calling ${modelId} via ${provider} API…`, 'info');

  try {
    for (let round = 1; round <= maxRounds; round++) {
      addLog('orchestrationLogBody', `Round ${round}/${maxRounds}: Processing…`, 'info');

      const roundStart = Date.now();
      const response = await callModel(provider, modelId, messages, {
        system: systemPrompt,
        maxTokens: 800,
        temperature: 0.7,
      });
      const latency = Date.now() - roundStart;

      orchState.latencies.push(latency);
      const avgLatency = Math.round(orchState.latencies.reduce((a,b) => a+b, 0) / orchState.latencies.length);
      updateKpi('kpiLatency', avgLatency);

      // Estimate tokens (rough: 4 chars = 1 token)
      const tokens = Math.round(response.length / 4);
      orchState.totalTokens += tokens;
      updateKpi('kpiTokens', orchState.totalTokens);

      addLog('orchestrationLogBody', `[Round ${round}] ${response.slice(0, 200)}${response.length > 200 ? '…' : ''}`, 'success');

      messages.push({ role: 'assistant', content: response });

      if (round < maxRounds) {
        messages.push({ role: 'user', content: `Continue: refine your analysis with more depth on the key insights.` });
      }

      await sleep(200);
    }

    addLog('orchestrationLogBody', `✓ Orchestration complete. Latency avg: ${Math.round(orchState.latencies.slice(-maxRounds).reduce((a,b) => a+b,0)/Math.min(maxRounds, orchState.latencies.length))}ms`, 'success');

    // Show full output in live call modal
    const lastResponse = messages.filter(m => m.role === 'assistant').pop()?.content || '';
    showLiveCallModal(`Live Output — ${modelId}`, `Strategy: ${strategy.label} | Task: "${task.slice(0,60)}"`, lastResponse);

  } catch (err) {
    addLog('orchestrationLogBody', `Error: ${err.message}`, 'error');
    showToast(err.message, 'error', 5000);
  }
}

// ── SIMULATED ORCHESTRATION ──
async function runSimulatedOrchestration(task, modelId, strategy, maxRounds) {
  addLog('orchestrationLogBody', `[SIM] No API key — running simulation for ${modelId}`, 'warning');
  addLog('orchestrationLogBody', `Add your API key in the Vault (🔐) for live responses`, 'warning');

  const simResponses = generateSimResponses(task, strategy, maxRounds);

  for (let i = 0; i < simResponses.length; i++) {
    await sleep(600 + Math.random() * 400);
    const sim = simResponses[i];
    addLog('orchestrationLogBody', sim.msg, sim.type);
    const tokens = Math.round(sim.msg.length / 4);
    orchState.totalTokens += tokens;
    orchState.latencies.push(400 + Math.random() * 300);
    updateKpi('kpiTokens', orchState.totalTokens);
    updateKpi('kpiLatency', Math.round(orchState.latencies.reduce((a,b) => a+b, 0) / orchState.latencies.length));
  }

  addLog('orchestrationLogBody', '✓ Simulation complete. Add API key for live model execution.', 'success');
}

function generateSimResponses(task, strategy, rounds) {
  const entries = [];
  entries.push({ msg: `[Perception] Analyzing task: "${task.slice(0, 80)}"`, type: 'info' });
  entries.push({ msg: `[MCP Router] Routing to ${strategy.label} strategy with tool registry`, type: 'info' });
  entries.push({ msg: `[Context] Loaded 3 relevant memory nodes from ByteRover`, type: 'success' });

  for (let r = 1; r <= rounds; r++) {
    entries.push({ msg: `[Round ${r}] Reasoning: Task decomposed into ${2+r} sub-problems`, type: 'info' });
    entries.push({ msg: `[Round ${r}] Planning: DAG constructed with ${3+r} nodes`, type: 'success' });
    entries.push({ msg: `[Round ${r}] Execution: Agent dispatched to process sub-problem #1`, type: 'info' });
    entries.push({ msg: `[Round ${r}] Result: Analysis complete — confidence 87%`, type: 'success' });
  }

  entries.push({ msg: `[Output] Artifact generated: comprehensive response ready`, type: 'success' });
  entries.push({ msg: `[Security] ClawSecure: No threats detected in output`, type: 'success' });
  return entries;
}

// ── ARCH LAYER ANIMATION ──
async function animateArchLayers(sequence, delay) {
  // Reset
  document.querySelectorAll('.arch-layer').forEach(l => l.classList.remove('processing', 'active-layer'));
  document.querySelectorAll('.arch-node').forEach(n => n.classList.remove('active'));

  for (const layerIdx of sequence) {
    const layer = document.querySelector(`.arch-layer[data-layer="${layerIdx}"]`);
    if (!layer) continue;

    layer.classList.add('processing', 'active-layer');

    // Activate nodes sequentially
    const nodes = layer.querySelectorAll('.arch-node');
    nodes.forEach((n, i) => setTimeout(() => n.classList.add('active'), i * 100));

    await sleep(delay);
    layer.classList.remove('processing');
    setTimeout(() => nodes.forEach(n => n.classList.remove('active')), 200);
  }
}

// ── AGENT ANIMATION ──
function animateAgents(agentFlow, totalDuration) {
  agentFlow.forEach((agentIdx, i) => {
    const agent = AGENTS[agentIdx];
    if (!agent) return;
    const delay = (i / agentFlow.length) * totalDuration * 0.6;

    setTimeout(() => setAgentStatus(agent.id, 'running'), delay);
    setTimeout(() => setAgentStatus(agent.id, 'done'), delay + totalDuration * 0.4);
  });
}

function setAgentStatus(id, status) {
  const card = document.getElementById('agent_' + id);
  const statusEl = document.getElementById('agentStatus_' + id);
  if (!card || !statusEl) return;

  card.className = 'agent-card ' + status;
  const labels = { idle: 'Idle', running: '⚡ Active', done: '✓ Done' };
  statusEl.textContent = labels[status] || status;
}

// ── LIVE CALL MODAL ──
function showLiveCallModal(title, meta, content) {
  document.getElementById('liveCallTitle').textContent = title;
  document.getElementById('liveCallMeta').textContent = meta;
  const output = document.getElementById('liveCallOutput');
  output.innerHTML = '';
  const pre = document.createElement('div');
  pre.className = 'typing-cursor';
  pre.textContent = content;
  output.appendChild(pre);
  setTimeout(() => pre.classList.remove('typing-cursor'), 2000);
  openModal('liveCallModal');
}

// ── KPI UPDATE ──
function updateKpi(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

// ── BUILD SYSTEM PROMPT ──
function buildSystemPrompt(strategy) {
  return `You are an expert AI orchestration engine operating within AIOS-X (Agentic Intelligence Orchestration System).

Strategy: ${strategy.label}
${strategy.description}

Your role is to analyze the given task systematically:
1. Break it into sub-problems
2. Apply your reasoning capabilities
3. Provide a structured, actionable response
4. Be concise but comprehensive

March 2026 context: You are aware of the latest AI landscape including MCP protocols, multi-agent systems, and agentic AI frameworks.`;
}

// ── SLEEP HELPER ──
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// Expose
window.launchOrchestration = launchOrchestration;
window.renderAgentRoster = renderAgentRoster;
window.showLiveCallModal = showLiveCallModal;
window.AGENTS = AGENTS;
window.sleep = sleep;
