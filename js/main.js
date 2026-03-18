/* ═════════════════════════════════════
   AIOS-X · Main Entry Point v2.0
   Initialize all systems
═════════════════════════════════════ */
'use strict';

document.addEventListener('DOMContentLoaded', () => {

  // ── TICKER ──
  initTicker();

  // ── API VAULT ──
  renderVaultGrid();
  updateKpiConfigured();

  // ── MODELS GRID ──
  renderModelsGrid();

  // ── ORCHESTRATOR ──
  renderAgentRoster();
  addLog('orchestrationLogBody', '[AIOS-X v2.0] System initialized — All modules online', 'success');
  addLog('orchestrationLogBody', '[Models] 15 SOTA models registered: Claude · GPT · Gemini · Grok · Ollama · DeepSeek · Mistral', 'info');
  addLog('orchestrationLogBody', '[BYOK] API Vault ready — Open 🔐 to add your API keys for live calls', 'info');
  addLog('orchestrationLogBody', '[Voice] Speech recognition ready — Click 🎤 or use voice commands', 'info');
  addLog('orchestrationLogBody', '[Shortcuts] Keys 1-7 switch tabs · Ctrl+Enter launches orchestration', 'info');

  // ── MEMORY ──
  renderBrvTree();
  drawMemoryGraph();
  updateComprStats(0, 0);

  // ── EXECUTION ──
  renderPipelineSteps();
  renderExecAgents();

  // ── MARKET ──
  initMarket();

  // ── SECURITY ──
  initSecurity();

  // ── VOICE SUPPORT CHECK ──
  if (!VoiceSystem.isSupported()) {
    const btn = document.getElementById('voiceBtn');
    if (btn) {
      btn.title = 'Voice not supported in this browser (try Chrome)';
      btn.style.opacity = '0.4';
    }
    addLog('orchestrationLogBody', '[Voice] Not supported in this browser — Chrome recommended', 'warning');
  } else {
    addLog('orchestrationLogBody', '[Voice] Ready — commands: "open orchestrator", "start debate", "show market"…', 'success');
  }

  // ── TAB SWITCH LISTENER ──
  document.addEventListener('tabSwitch', e => {
    const tab = e.detail?.tab;
    if (tab === 'memory') { drawMemoryGraph(); }
    if (tab === 'execution') { drawPipelineCanvas(); }
    if (tab === 'models') { renderBenchmarkTable(); }
  });

  // ── KEYBOARD SHORTCUT LABEL UPDATE ──
  const launchBtn = document.getElementById('launchBtn');
  if (launchBtn) {
    launchBtn.title = 'Launch orchestration (Ctrl+Enter)';
  }

  // ── PERIODIC UPDATES ──
  setInterval(() => {
    // Refresh configured model count
    updateModelConfiguredStatus();
    // Refresh vault grid if open
    if (document.getElementById('vaultModal')?.style.display === 'flex') {
      renderVaultGrid();
    }
  }, 5000);

  // ── RESIZE CANVASES ──
  window.addEventListener('resize', () => {
    const activeTab = document.querySelector('.tab-panel.active');
    if (!activeTab) return;
    const tabId = activeTab.id?.replace('tab-', '');
    if (tabId === 'memory') drawMemoryGraph();
    if (tabId === 'execution') drawPipelineCanvas();
    if (tabId === 'market') { drawFundingChart(); drawRadarChart(); drawCapexChart(); }
  });

  // ── PRINT TRIGGER ──
  window.addEventListener('beforeprint', () => {
    injectPrintHeader?.();
    // Show all panels for print
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.add('active'));
  });

  window.addEventListener('afterprint', () => {
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
    const activeTab = document.querySelector('.tab-btn.active')?.dataset.tab || 'orchestrator';
    document.getElementById('tab-' + activeTab)?.classList.add('active');
  });

  console.log('%cAIOS-X v2.0 — Agentic Intelligence Orchestration System', 'color:#38bdf8;font-size:14px;font-weight:bold');
  console.log('%c15 SOTA Models · BYOK Vault · Voice · Export · Live API', 'color:#818cf8;font-size:11px');
  console.log('%cMarch 2026 AI Landscape Integration', 'color:#34d399;font-size:10px');
});

// ── SAFE GLOBALS (fallbacks for cross-module calls) ──
window.closeModal = window.closeModal || function(id) {
  const el = document.getElementById(id);
  if (el) el.style.display = 'none';
};
window.previewMemoryNode = window.previewMemoryNode || function() {};
window.showVerticalDetail = window.showVerticalDetail || function() {};
window.showHybridDetail = window.showHybridDetail || function() {};
window.injectPrintHeader = window.injectPrintHeader || function() {};
window.exportDebate = window.exportDebate || function() { showToast('Export module not loaded', 'warning'); };
window.exportPipeline = window.exportPipeline || function() { showToast('Export module not loaded', 'warning'); };
window.exportMemory = window.exportMemory || function() { showToast('Export module not loaded', 'warning'); };
window.exportSecReport = window.exportSecReport || function() { showToast('Export module not loaded', 'warning'); };
window.loadVault = window.loadVault || function() { try { return JSON.parse(localStorage.getItem('aiosx_vault_v1') || '{}'); } catch { return {}; } };
