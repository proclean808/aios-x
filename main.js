/* ═════════════════════════════════════
   AIOS-X · Main Entry Point
   Initialize all systems
═════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {
  console.log('AIOS-X · Booting...');

  // ── INIT CORE UI ──
  initNavigation();
  initTicker();
  initShortcuts();
  initModelToggles();

  // ── INIT MODULES ──
  initOrchestrator();
  initDebate();
  initMemory();
  initSecurity();

  // ── INIT EXECUTION CANVAS (when panel is first opened) ──
  // Done via onPanelActivate

  // ── HEADER STATS ──
  animateNumber(document.getElementById('hAgents'), 0, 6, 1500);

  // ── BOOT SEQUENCE LOG ──
  setTimeout(() => {
    addLog('orchestrationLogBody', '🚀 AIOS-X v1.0 · March 2026 AI Landscape Integration', 'highlight');
    addLog('orchestrationLogBody', 'Source: March 2026 AI Landscape Intelligence Brief', 'info');
    addLog('orchestrationLogBody', '═══════════════════════════════════════════════════', 'info');
  }, 100);

  setTimeout(() => {
    addLog('orchestrationLogBody', '💰 Market Context: $189B VC funding · 90% to AI · Record month', 'success');
    addLog('orchestrationLogBody', '🤖 Paradigm: Agentic AI is the dominant architecture in 2026', 'success');
    addLog('orchestrationLogBody', '🔗 Protocol: MCP at 82.7K stars · Linux Foundation · Universal standard', 'success');
  }, 400);

  setTimeout(() => {
    addLog('orchestrationLogBody', '🧠 Models online: DeepSeek V4 (1T) · Llama 4 Scout (10M ctx) · Mistral 3 (675B MoE) · GPT-OSS 120B', 'success');
    addLog('orchestrationLogBody', '💾 ByteRover: 92.2% retrieval accuracy · compresr: 68% avg compression', 'success');
    addLog('orchestrationLogBody', '🔒 ClawSecure: Active · Zero-trust IAM: Active · EU AI Act deadline: Aug 2, 2026', 'warning');
  }, 800);

  setTimeout(() => {
    addLog('orchestrationLogBody', '⭐ White Space: Agent Orchestration Middleware — underfunded, critical opportunity', 'warning');
    addLog('orchestrationLogBody', '✅ AIOS-X fully initialized. All layers operational. Enter a task to begin.', 'success');
  }, 1200);

  // ── SECURITY LOG INIT ──
  setTimeout(() => {
    addLog('secLogBody', '🔒 ClawSecure v3.2 initialized · 6 threat vectors monitored', 'success');
    addLog('secLogBody', '🛡️ Zero-trust IAM: Agent identity verification active', 'success');
    addLog('secLogBody', '👁️ Goodfire interpretability engine: Ready', 'success');
    addLog('secLogBody', `⏳ EU AI Act countdown: ${getDaysToDeadline()} days to August 2, 2026`, 'warning');
  }, 600);

  // ── EXEC LOG INIT ──
  setTimeout(() => {
    addLog('execLogBody', '⚡ Execution layer initialized', 'success');
    addLog('execLogBody', '🌐 Notte browser agent: Standby', 'info');
    addLog('execLogBody', '🔌 Zatanna API bridge: Connected', 'success');
    addLog('execLogBody', '💾 ByteRover: RUNNING (persistent state active)', 'success');
    addLog('execLogBody', '💸 Sapiom: Commerce layer ready', 'info');
    addLog('execLogBody', '🔍 Orthogonal: Marketplace indexed', 'success');
  }, 600);

  // ── ANIMATE KPIs ON MARKET PANEL LOAD ──
  // Done via onPanelActivate('market')

  // ── KEYBOARD HINT ──
  setTimeout(() => {
    showToast('Press 1-6 to switch panels · Ctrl+Enter to launch orchestration', 'info', 4000);
  }, 2000);

  // ── PULSE SYSTEM STATUS ──
  setInterval(() => {
    const status = document.getElementById('systemStatus');
    if (status) {
      status.classList.toggle('blink');
    }
  }, 5000);

  console.log('AIOS-X · All systems nominal');
});

function getDaysToDeadline() {
  const deadline = new Date('2026-08-02T00:00:00');
  const now = new Date();
  return Math.max(0, Math.floor((deadline - now) / (1000*60*60*24)));
}

// ── GLOBAL ERROR HANDLER ──
window.onerror = (msg, src, line) => {
  console.error(`AIOS-X Error: ${msg} @ ${src}:${line}`);
};

// ── EXPOSE GLOBALS FOR HTML ONCLICK HANDLERS ──
window.launchOrchestration = typeof launchOrchestration !== 'undefined' ? launchOrchestration : () => {};
window.startDebate = typeof startDebate !== 'undefined' ? startDebate : () => {};
window.setDebateTopic = typeof setDebateTopic !== 'undefined' ? setDebateTopic : () => {};
window.seedMemory = typeof seedMemory !== 'undefined' ? seedMemory : () => {};
window.compressMemory = typeof compressMemory !== 'undefined' ? compressMemory : () => {};
window.clearMemory = typeof clearMemory !== 'undefined' ? clearMemory : () => {};
window.writeMemory = typeof writeMemory !== 'undefined' ? writeMemory : () => {};
window.runCompresr = typeof runCompresr !== 'undefined' ? runCompresr : () => {};
window.queryMemory = typeof queryMemory !== 'undefined' ? queryMemory : () => {};
window.addPipelineStep = typeof addPipelineStep !== 'undefined' ? addPipelineStep : () => {};
window.executePipeline = typeof executePipeline !== 'undefined' ? executePipeline : () => {};
window.removePipelineStep = typeof removePipelineStep !== 'undefined' ? removePipelineStep : () => {};
window.activateAgent = typeof activateAgent !== 'undefined' ? activateAgent : () => {};
window.configAgent = typeof configAgent !== 'undefined' ? configAgent : () => {};
window.runSecurityScan = typeof runSecurityScan !== 'undefined' ? runSecurityScan : () => {};
window.simulateAttack = typeof simulateAttack !== 'undefined' ? simulateAttack : () => {};
window.probeModel = typeof probeModel !== 'undefined' ? probeModel : () => {};
window.clearLog = typeof clearLog !== 'undefined' ? clearLog : () => {};
window.closeModal = typeof closeModal !== 'undefined' ? closeModal : () => {};
window.previewMemoryNode = typeof previewMemoryNode !== 'undefined' ? previewMemoryNode : () => {};
window.showVerticalDetail = typeof showVerticalDetail !== 'undefined' ? showVerticalDetail : () => {};
window.showHybridDetail = typeof showHybridDetail !== 'undefined' ? showHybridDetail : () => {};
window.switchToPanel = typeof switchToPanel !== 'undefined' ? switchToPanel : () => {};
