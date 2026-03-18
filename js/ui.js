/* ═════════════════════════════════════
   AIOS-X · UI Utilities & Navigation
═════════════════════════════════════ */
'use strict';

// ── TOAST SYSTEM ──
function showToast(msg, type = 'info', duration = 3000) {
  const container = document.getElementById('toastContainer');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  const icons = { info: 'ℹ️', success: '✅', warning: '⚠️', error: '❌' };
  toast.innerHTML = `<span>${icons[type] || 'ℹ️'}</span><span>${msg}</span>`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.animation = 'toastOut 0.3s ease forwards';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

// ── LOG SYSTEM ──
function addLog(bodyId, msg, type = 'info') {
  const body = document.getElementById(bodyId);
  if (!body) return;
  const now = new Date();
  const ts = now.toTimeString().slice(0, 8);
  const entry = document.createElement('div');
  entry.className = `log-entry ${type}`;
  entry.innerHTML = `<span class="log-ts">[${ts}]</span><span class="log-msg">${escapeHtml(msg)}</span>`;
  body.appendChild(entry);
  body.scrollTop = body.scrollHeight;
}

function clearLog(bodyId) {
  const direct = document.getElementById(bodyId) ||
                 document.getElementById(bodyId + 'Body');
  if (direct) { direct.innerHTML = ''; return; }
}

// ── MODAL SYSTEM ──
function openModal(id) {
  const el = document.getElementById(id);
  if (el) el.style.display = 'flex';
}

function closeModal(id) {
  const el = document.getElementById(id);
  if (el) el.style.display = 'none';
}

// Click-outside to close
document.addEventListener('click', e => {
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    if (e.target === overlay) {
      overlay.style.display = 'none';
    }
  });
});

// ── TAB NAVIGATION ──
function switchTab(tabId) {
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));

  const panel = document.getElementById('tab-' + tabId);
  if (panel) panel.classList.add('active');

  const btn = document.querySelector(`.tab-btn[data-tab="${tabId}"]`);
  if (btn) btn.classList.add('active');

  // Trigger tab-specific init
  const evt = new CustomEvent('tabSwitch', { detail: { tab: tabId } });
  document.dispatchEvent(evt);
}

// Keyboard shortcuts: 1-7 for tabs
document.addEventListener('keydown', e => {
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') {
    // Ctrl+Enter in textarea = launch
    if (e.ctrlKey && e.key === 'Enter') {
      if (typeof launchOrchestration === 'function') launchOrchestration();
    }
    return;
  }
  const tabKeys = ['1','2','3','4','5','6','7'];
  const tabs = ['orchestrator','models','debate','memory','execution','market','security'];
  const idx = tabKeys.indexOf(e.key);
  if (idx !== -1 && !e.ctrlKey && !e.altKey) switchTab(tabs[idx]);
});

// ── TICKER INIT ──
function initTicker() {
  const track = document.getElementById('tickerTrack');
  if (!track) return;
  // Clone for seamless loop
  const clone = track.innerHTML;
  track.innerHTML += clone;
}

// ── ESCAPE HTML ──
function escapeHtml(str) {
  return String(str)
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;');
}

// ── OPEN EXPORT PANEL ──
function openExportPanel() { openModal('exportModal'); }

// ── OPEN VAULT ──
function openVault() {
  if (typeof renderVaultGrid === 'function') renderVaultGrid();
  openModal('vaultModal');
}

// ── DEBATE TOPIC SELECT ──
(function initDebateTopicToggle() {
  document.addEventListener('DOMContentLoaded', () => {
    const sel = document.getElementById('debateTopic');
    const wrap = document.getElementById('customTopicWrap');
    if (!sel || !wrap) return;
    sel.addEventListener('change', () => {
      wrap.style.display = sel.value === 'custom' ? 'flex' : 'none';
    });
  });
})();

// ── COPY LIVE OUTPUT ──
function copyLiveOutput() {
  const el = document.getElementById('liveCallOutput');
  if (!el) return;
  navigator.clipboard.writeText(el.innerText).then(() => showToast('Copied to clipboard', 'success'));
}

function exportLiveOutput() {
  const el = document.getElementById('liveCallOutput');
  if (!el) return;
  downloadText(el.innerText, 'aiosx-live-response.txt');
}

// ── DOWNLOAD HELPERS ──
function downloadText(content, filename) {
  const blob = new Blob([content], { type: 'text/plain' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

function downloadJSON(obj, filename) {
  const blob = new Blob([JSON.stringify(obj, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

// ── LOADING STATE ──
function setLoading(btnId, loading, label = '') {
  const btn = document.getElementById(btnId);
  if (!btn) return;
  if (loading) {
    btn._origLabel = btn.innerHTML;
    btn.innerHTML = `<span class="spinner"></span> ${label || 'Working…'}`;
    btn.disabled = true;
  } else {
    btn.innerHTML = btn._origLabel || label;
    btn.disabled = false;
  }
}

// ── ACTIVE DEBATE MODEL BUTTONS ──
function getActiveDebateModels() {
  const active = [];
  document.querySelectorAll('.dmb.active').forEach(btn => {
    active.push({ id: btn.dataset.model, provider: btn.dataset.provider });
  });
  return active;
}

// Debate model toggle
document.addEventListener('click', e => {
  if (e.target.classList.contains('dmb')) {
    e.target.classList.toggle('active');
  }
});

// Expose globals needed by inline HTML onclick
window.switchTab = switchTab;
window.openModal = openModal;
window.closeModal = closeModal;
window.showToast = showToast;
window.addLog = addLog;
window.clearLog = clearLog;
window.downloadText = downloadText;
window.downloadJSON = downloadJSON;
window.setLoading = setLoading;
window.getActiveDebateModels = getActiveDebateModels;
window.copyLiveOutput = copyLiveOutput;
window.exportLiveOutput = exportLiveOutput;
window.openExportPanel = openExportPanel;
window.openVault = openVault;
window.escapeHtml = escapeHtml;
