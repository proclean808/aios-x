/* ═════════════════════════════════════
   AIOS-X · UI Utilities & Navigation
═════════════════════════════════════ */

// ── TOAST SYSTEM ──
function showToast(msg, type = 'info', duration = 3500) {
  const icons = { info: 'ℹ️', success: '✅', warning: '⚠️', error: '❌' };
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `<span class="toast-icon">${icons[type]}</span><span class="toast-msg">${msg}</span>`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.classList.add('fade-out');
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

// ── MODAL SYSTEM ──
function openModal(title, bodyHTML) {
  const overlay = document.getElementById('modalOverlay');
  const content = document.getElementById('modalContent');
  content.innerHTML = `<div class="modal-title">${title}</div><div class="modal-body">${bodyHTML}</div>`;
  overlay.classList.add('open');
}
function closeModal() {
  document.getElementById('modalOverlay').classList.remove('open');
}

// ── LOG SYSTEM ──
function addLog(panelId, msg, type = 'info') {
  const body = document.getElementById(panelId);
  if (!body) return;
  const ts = new Date().toLocaleTimeString('en-US', { hour12: false });
  const entry = document.createElement('div');
  entry.className = `log-entry ${type}`;
  entry.innerHTML = `<span class="log-ts">[${ts}]</span><span class="log-msg">${msg}</span>`;
  body.appendChild(entry);
  body.scrollTop = body.scrollHeight;
}

function clearLog(panelId) {
  // Try direct body ID first (e.g. 'orchestrationLogBody', 'execLogBody', 'secLogBody')
  const directBody = document.getElementById(panelId + 'Body') || document.getElementById(panelId);
  if (directBody) { directBody.innerHTML = ''; return; }
  // Try panel with .log-body child
  const panel = document.getElementById(panelId);
  if (panel) {
    const body = panel.querySelector('.log-body');
    if (body) body.innerHTML = '';
  }
}

// ── PANEL NAVIGATION ──
function initNavigation() {
  const buttons = document.querySelectorAll('.nav-btn');
  console.log('[v0] initNavigation called, found buttons:', buttons.length);
  buttons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const target = btn.dataset.panel;
      console.log('[v0] Tab clicked:', target);
      // Update buttons
      buttons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      // Update panels
      const panels = document.querySelectorAll('.panel');
      console.log('[v0] Found panels:', panels.length);
      panels.forEach(p => p.classList.remove('active'));
      const panel = document.getElementById('panel-' + target);
      console.log('[v0] Target panel:', panel ? panel.id : 'NOT FOUND');
      if (panel) {
        panel.classList.add('active');
        onPanelActivate(target);
      }
    });
  });
}

function onPanelActivate(panel) {
  switch(panel) {
    case 'market':
      initMarketCharts();
      break;
    case 'memory':
      updateMemoryStats();
      break;
    case 'execution':
      initPipelineCanvas();
      initExecCanvas();
      break;
    case 'security':
      updateCountdown();
      break;
  }
}

// ── TIMESTAMP UTILITY ──
function now() {
  return new Date().toLocaleTimeString('en-US', { hour12: false });
}

// ── NUMBER ANIMATION ──
function animateNumber(el, from, to, duration = 1000, suffix = '') {
  if (!el) return;
  const start = performance.now();
  function update(time) {
    const elapsed = time - start;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    const current = Math.round(from + (to - from) * eased);
    el.textContent = current + suffix;
    if (progress < 1) requestAnimationFrame(update);
  }
  requestAnimationFrame(update);
}

// ── TYPEWRITER EFFECT ──
function typewrite(el, text, speed = 18) {
  el.textContent = '';
  el.classList.add('typing-cursor');
  let i = 0;
  const interval = setInterval(() => {
    el.textContent += text[i];
    i++;
    if (i >= text.length) {
      clearInterval(interval);
      el.classList.remove('typing-cursor');
    }
  }, speed);
  return interval;
}

// ── TICKER DUPLICATION (infinite scroll) ──
function initTicker() {
  // Logo ticker (scrolls right) - clone within ticker-row-top
  const logoTicker = document.getElementById('tickerLogos');
  if (logoTicker) {
    const row = logoTicker.closest('.ticker-row');
    const logoClone = logoTicker.cloneNode(true);
    logoClone.removeAttribute('id');
    row.appendChild(logoClone);
  }
  // Text ticker (scrolls left) - clone within ticker-row-bottom
  const textTicker = document.getElementById('tickerText');
  if (textTicker) {
    const row = textTicker.closest('.ticker-row');
    const textClone = textTicker.cloneNode(true);
    textClone.removeAttribute('id');
    row.appendChild(textClone);
  }
}

// ── HEADER STATS UPDATE ──
let agentCount = 0, taskCount = 0;
function updateHeaderStats(agents, tasks) {
  agentCount = agents || agentCount;
  taskCount = tasks || taskCount;
  const hA = document.getElementById('hAgents');
  const hT = document.getElementById('hTasks');
  if (hA) hA.textContent = agentCount + ' Agents';
  if (hT) hT.textContent = taskCount + ' Tasks';
}

// ── EU COUNTDOWN ──
function updateCountdown() {
  const deadline = new Date('2026-08-02T00:00:00');
  const now2 = new Date();
  const diff = deadline - now2;
  if (diff <= 0) {
    const el = document.getElementById('euCountdown');
    if (el) el.textContent = 'DEADLINE PASSED';
    return;
  }
  const days = Math.floor(diff / (1000*60*60*24));
  const hours = Math.floor((diff % (1000*60*60*24)) / (1000*60*60));
  const mins = Math.floor((diff % (1000*60*60)) / (1000*60));
  const el = document.getElementById('euCountdown');
  if (el) el.textContent = `${days}d ${hours}h ${mins}m remaining`;
}

// ── DEBOUNCE ──
function debounce(fn, delay) {
  let timer;
  return function(...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

// ── SLEEP ──
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ── RANDOM FROM ARRAY ──
function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ── SHUFFLE ARRAY ──
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ── FORMAT LARGE NUMBERS ──
function fmtNum(n) {
  if (n >= 1e9) return (n/1e9).toFixed(1) + 'B';
  if (n >= 1e6) return (n/1e6).toFixed(1) + 'M';
  if (n >= 1e3) return (n/1e3).toFixed(1) + 'K';
  return n.toString();
}

// ── KEYBOARD SHORTCUTS ──
function initShortcuts() {
  document.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    const map = { '1':'orchestrator','2':'debate','3':'memory','4':'execution','5':'market','6':'security','7':'founder-matching' };
    if (map[e.key]) {
      const btn = document.querySelector(`.nav-btn[data-panel="${map[e.key]}"]`);
      if (btn) btn.click();
    }
    if (e.key === 'Escape') closeModal();
  });
}

// ── COMPLIANCE CHECKLIST ──
const complianceItems = [
  { icon: '📊', text: 'Risk Classification System', status: 'done' },
  { icon: '📝', text: 'Transparency Obligations', status: 'pending' },
  { icon: '🔍', text: 'Human Oversight Mechanisms', status: 'pending' },
  { icon: '📋', text: 'Technical Documentation', status: 'todo' },
  { icon: '🛡️', text: 'Data Governance Framework', status: 'done' },
  { icon: '⚖️', text: 'Bias & Fairness Audits', status: 'todo' },
  { icon: '📣', text: 'Conformity Assessment', status: 'todo' },
  { icon: '🔐', text: 'Cybersecurity Measures', status: 'done' },
  { icon: '📦', text: 'Model Registry', status: 'pending' },
  { icon: '🌐', text: 'GPAI Model Obligations', status: 'todo' }
];

function initComplianceChecklist() {
  const el = document.getElementById('complianceChecklist');
  if (!el) return;
  el.innerHTML = complianceItems.map(item => `
    <div class="cc-item">
      <span class="cc-icon">${item.icon}</span>
      <span class="cc-text">${item.text}</span>
      <span class="cc-status ${item.status}">${item.status.toUpperCase()}</span>
    </div>
  `).join('');
}

// ── MODEL TOGGLE HANDLER ──
function initModelToggles() {
  document.querySelectorAll('.model-toggle').forEach(btn => {
    btn.addEventListener('click', () => {
      btn.classList.toggle('active');
      const model = btn.dataset.model;
      const on = btn.classList.contains('active');
      showToast(`${model} ${on ? 'enabled' : 'disabled'}`, on ? 'success' : 'warning', 1500);
    });
  });
}

function getActiveModels() {
  const active = [];
  document.querySelectorAll('.model-toggle.active').forEach(btn => {
    active.push(btn.dataset.model);
  });
  return active;
}
