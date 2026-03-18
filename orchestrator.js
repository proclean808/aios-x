/* ═════════════════════════════════════
   AIOS-X · Orchestration Engine
═════════════════════════════════════ */

const ORCHESTRATION_STEPS = [
  { layer: 'layer-security', node: 0, msg: '🔐 Security layer: Identity verification + ClawSecure scan', delay: 200 },
  { layer: 'layer-memory', node: 0, msg: '🧠 Memory layer: Loading ByteRover context-tree (.brv)', delay: 400 },
  { layer: 'layer-memory', node: 1, msg: '🗜️ compresr: Compressing context (avg 68% reduction)', delay: 600 },
  { layer: 'layer-exec', node: 0, msg: '🌐 Notte browser agent: Activated for web research', delay: 800 },
  { layer: 'layer-exec', node: 1, msg: '🔌 Zatanna API bridge: Legacy system connectivity established', delay: 1000 },
  { layer: 'layer-verify', node: 0, msg: '🔬 Rubric AI: Reasoning verification engine armed', delay: 1200 },
  { layer: 'layer-models', node: 0, msg: '⚡ DeepSeek V4 (1T params): Task assigned', delay: 1400 },
  { layer: 'layer-models', node: 1, msg: '⚡ Llama 4 Scout (10M ctx): Task assigned', delay: 1600 },
  { layer: 'layer-models', node: 2, msg: '⚡ Mistral 3 (675B MoE): Task assigned', delay: 1800 },
  { layer: 'layer-models', node: 3, msg: '⚡ GPT-OSS 120B: Task assigned', delay: 2000 },
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
  const activeModels = getActiveModels();
  if (activeModels.length === 0) {
    showToast('Enable at least one model', 'warning');
    return;
  }

  orchestrationRunning = true;
  taskCounter++;
  updateHeaderStats(null, taskCounter);

  const btn = document.getElementById('launchOrchestration');
  btn.disabled = true;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Orchestrating...';

  addLog('orchestrationLogBody', `━━━ TASK #${taskCounter}: "${input.substring(0,60)}..." ━━━`, 'highlight');
  addLog('orchestrationLogBody', `Strategy: ${ORCHESTRATION_STRATEGIES[strategy]?.name || strategy}`, 'info');
  addLog('orchestrationLogBody', `Active models: ${activeModels.join(', ')}`, 'info');

  // Animate each layer
  for (const step of ORCHESTRATION_STEPS) {
    await sleep(step.delay);
    activateLayerNode(step.layer, step.node);
    addLog('orchestrationLogBody', step.msg, 'success');
  }

  // Final response
  await sleep(4000);
  const responses = TASK_RESPONSES.default;
  for (const r of responses) {
    addLog('orchestrationLogBody', r, 'info');
    await sleep(300);
  }

  addLog('orchestrationLogBody', `✅ Task #${taskCounter} complete. Consensus reached. Memory updated.`, 'success');

  // Update memory stats
  incrementMemoryNodes(3);
  updateMemoryStats();

  btn.disabled = false;
  btn.innerHTML = '<i class="fas fa-play"></i> Launch Orchestration';
  orchestrationRunning = false;

  showToast(`Task #${taskCounter} completed successfully`, 'success');
}

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
