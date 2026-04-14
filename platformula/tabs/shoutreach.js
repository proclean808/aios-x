/**
 * Shout Reach — Decentralized Outreach Stack
 * Autonomous capital-routing pipeline: Capture → Enrich → Route → Outreach
 * All state in localStorage. No external APIs.
 */

const LS_QUEUE  = 'pf1_sr_queue';
const LS_LOGS   = 'pf1_sr_logs';
const LS_NODES  = 'pf1_sr_nodes';
const LS_DAC    = 'pf1_sr_dac';

const DEFAULT_DAC = `// PlatFormula.ONE Capital-Routing Config
// Edit and click Deploy to update your pipeline.

ingest("sales_nav_search") {
  target_role: ["GP", "Partner", "Operator"],
  keywords: ["AI", "Infra", "Enterprise"],
  frequency: "6h",
  limit_per_run: 25
}

enrich("crunchbase") {
  fields: ["fund_size", "check_size", "last_raise", "ai_focus"],
  priority_weight: 0.8
}

score("fund_momentum_index") {
  last_raise_within_6m:  +30,
  new_gp:                +20,
  ai_focus:              +15,
  recent_deal_vertical:  +10
}

route("warm_path") {
  operators: ["Johannes Rott", "Ed Dua"],
  max_hops: 2,
  min_strength: 0.6
}

outreach("inmail_queue") {
  daily_limit: 50,
  follow_up_sla: "48h",
  max_attempts: 3
}`;

const SCORE_MAP = {
  DIRECT_INTRO:   20, INMAIL_REPLY:   15, MEETING:        10,
  ENGAGEMENT:      5, NO_RESPONSE:   -10, REFERRAL_MADE:  18,
  UNSUBSCRIBE:   -15, EVENT_ATTEND:   12, CONTENT_SHARE:   8
};

const DEMO_NODES = [
  { id: 'n1', name: 'Sarah Tavel', org: 'Benchmark',        role: 'GP',      priority: 88, pathStrength: 0.84, status: 'QUEUED',   relScore: 45 },
  { id: 'n2', name: 'Keith Rabois', org: 'Founders Fund',   role: 'GP',      priority: 82, pathStrength: 0.77, status: 'OUTREACH', relScore: 30 },
  { id: 'n3', name: 'Elad Gil',    org: 'Color Genomics',   role: 'Operator',priority: 74, pathStrength: 0.71, status: 'NEW',      relScore: 15 },
  { id: 'n4', name: 'Laila Ahmadi', org: 'General Catalyst', role: 'Partner', priority: 91, pathStrength: 0.89, status: 'REPLIED',  relScore: 60 },
  { id: 'n5', name: 'Josh Buckley', org: 'Buckley Ventures', role: 'GP',     priority: 66, pathStrength: 0.63, status: 'NEW',      relScore: 20 },
];

function loadNodes() {
  try { return JSON.parse(localStorage.getItem(LS_NODES)) || [...DEMO_NODES]; }
  catch { return [...DEMO_NODES]; }
}
function saveNodes(nodes) { localStorage.setItem(LS_NODES, JSON.stringify(nodes)); }

function loadQueue() {
  try { return JSON.parse(localStorage.getItem(LS_QUEUE)) || []; }
  catch { return []; }
}
function saveQueue(q) { localStorage.setItem(LS_QUEUE, JSON.stringify(q)); }

function loadLogs() {
  try { return JSON.parse(localStorage.getItem(LS_LOGS)) || []; }
  catch { return []; }
}
function addLog(msg, type = 'info') {
  const logs = loadLogs();
  logs.unshift({ msg, type, ts: new Date().toLocaleTimeString() });
  if (logs.length > 50) logs.length = 50;
  localStorage.setItem(LS_LOGS, JSON.stringify(logs));
  renderLogs();
}

function loadDac() {
  return localStorage.getItem(LS_DAC) || DEFAULT_DAC;
}
function saveDac(code) { localStorage.setItem(LS_DAC, code); }

function uid() {
  return crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2);
}

// ── Scoring ──────────────────────────────────────
function updateScore(current, event) {
  const delta = SCORE_MAP[event] ?? 0;
  return Math.max(0, Math.min(100, current + delta));
}

// ── Stats ─────────────────────────────────────────
function renderStats() {
  const nodes = loadNodes();
  const queue = loadQueue();
  document.getElementById('sr-stat-nodes')?.let?.(el => el.textContent = nodes.length);
  document.getElementById('sr-stat-warm')?.let?.(el => el.textContent = nodes.filter(n => n.pathStrength >= 0.6).length);
  document.getElementById('sr-stat-queue')?.let?.(el => el.textContent = queue.length);
  document.getElementById('sr-stat-replied')?.let?.(el => el.textContent = nodes.filter(n => n.status === 'REPLIED').length);

  // Use direct assignment as let doesn't exist on Element
  const se = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
  se('sr-stat-nodes', nodes.length);
  se('sr-stat-warm', nodes.filter(n => n.pathStrength >= 0.6).length);
  se('sr-stat-queue', queue.length);
  se('sr-stat-replied', nodes.filter(n => n.status === 'REPLIED').length);
}

// ── Node Table ─────────────────────────────────────
function renderNodeTable() {
  const tbody = document.getElementById('srNodeTable');
  if (!tbody) return;
  const nodes = loadNodes();

  tbody.innerHTML = nodes.map(n => {
    const statusColor = {
      NEW: 'var(--text-muted)', QUEUED: 'var(--accent-blue-l)',
      OUTREACH: 'var(--accent-amber-l)', REPLIED: 'var(--accent-green-l)',
      CLOSED: 'var(--text-muted)'
    }[n.status] || 'var(--text-muted)';

    const pct = Math.round(n.pathStrength * 100);
    const pctColor = pct >= 80 ? 'var(--accent-green-l)' : pct >= 60 ? 'var(--accent-amber-l)' : 'var(--text-muted)';

    return `<tr class="sr-node-row" data-id="${n.id}">
      <td class="sr-td">
        <div class="sr-name">${n.name}</div>
        <div class="sr-org">${n.org}</div>
      </td>
      <td class="sr-td sr-mono">${n.role}</td>
      <td class="sr-td">
        <div class="sr-bar-wrap">
          <div class="sr-bar" style="width:${n.priority}%;background:var(--accent-blue)"></div>
        </div>
        <span class="sr-mono" style="color:var(--accent-blue-l)">${n.priority}</span>
      </td>
      <td class="sr-td sr-mono" style="color:${pctColor}">${pct}%</td>
      <td class="sr-td">
        <select class="sr-event-select sr-mono" data-id="${n.id}" title="Log event">
          <option value="">— Event —</option>
          ${Object.keys(SCORE_MAP).map(e => `<option value="${e}">${e}</option>`).join('')}
        </select>
      </td>
      <td class="sr-td sr-mono" style="color:${statusColor};font-size:10px;">${n.status}</td>
      <td class="sr-td">
        ${n.status === 'QUEUED' || n.status === 'NEW'
          ? `<button class="btn-card-action move sr-send-btn" data-id="${n.id}">Send InMail</button>`
          : ''}
      </td>
    </tr>`;
  }).join('');

  // Event logger
  tbody.querySelectorAll('.sr-event-select').forEach(sel => {
    sel.addEventListener('change', () => {
      const event = sel.value;
      if (!event) return;
      const nodes = loadNodes();
      const node = nodes.find(n => n.id === sel.dataset.id);
      if (!node) return;
      const prev = node.relScore;
      node.relScore = updateScore(node.relScore, event);
      saveNodes(nodes);
      addLog(`[SCORE] ${node.name}: ${event} → ${prev} → ${node.relScore}`, 'success');
      sel.value = '';
      renderNodeTable();
      renderStats();
    });
  });

  // Send InMail
  tbody.querySelectorAll('.sr-send-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const nodes = loadNodes();
      const node = nodes.find(n => n.id === btn.dataset.id);
      if (!node) return;
      node.status = 'OUTREACH';
      const queue = loadQueue();
      queue.push({ nodeId: node.id, name: node.name, sentAt: Date.now(), attempts: 1 });
      saveNodes(nodes);
      saveQueue(queue);
      addLog(`[OUTREACH] InMail queued for ${node.name} @ ${node.org}`, 'info');
      renderNodeTable();
      renderStats();
      renderQueue();
    });
  });
}

// ── Queue ──────────────────────────────────────────
function renderQueue() {
  const container = document.getElementById('srQueueList');
  if (!container) return;
  const queue = loadQueue();
  const nodes = loadNodes();

  if (!queue.length) {
    container.innerHTML = '<div class="empty-state" style="padding:24px;"><i class="fas fa-inbox"></i><p>Queue is empty.</p></div>';
    return;
  }

  container.innerHTML = queue.map(item => {
    const node = nodes.find(n => n.id === item.nodeId);
    const hoursAgo = Math.floor((Date.now() - item.sentAt) / 3600000);
    const slaOk = hoursAgo < 48;
    return `<div class="sr-queue-item">
      <div>
        <div class="sr-name">${item.name}</div>
        <div class="sr-org sr-mono">${node?.org || '—'}</div>
      </div>
      <div class="sr-queue-meta">
        <span class="sr-mono" style="color:${slaOk ? 'var(--accent-green-l)' : 'var(--accent-red-l)'}">
          ${hoursAgo < 1 ? 'just sent' : hoursAgo + 'h ago'}
        </span>
        <span class="sr-mono" style="color:var(--text-muted)">Attempt ${item.attempts}/3</span>
      </div>
      <button class="btn-card-action" data-qid="${item.nodeId}" id="dq-${item.nodeId}">Dismiss</button>
    </div>`;
  }).join('');

  container.querySelectorAll('[id^="dq-"]').forEach(btn => {
    btn.addEventListener('click', () => {
      const qid = btn.dataset.qid;
      const q = loadQueue().filter(i => i.nodeId !== qid);
      saveQueue(q);
      const nodes = loadNodes();
      const node = nodes.find(n => n.id === qid);
      if (node) { node.status = 'CLOSED'; saveNodes(nodes); }
      addLog(`[QUEUE] Dismissed: ${node?.name}`, 'warning');
      renderQueue();
      renderStats();
    });
  });
}

// ── Logs ───────────────────────────────────────────
function renderLogs() {
  const el = document.getElementById('srLogs');
  if (!el) return;
  const logs = loadLogs();
  el.innerHTML = logs.map(l => {
    const color = l.type === 'success' ? 'var(--accent-green-l)' : l.type === 'warning' ? 'var(--accent-amber-l)' : l.type === 'error' ? 'var(--accent-red-l)' : 'var(--text-secondary)';
    return `<div class="sr-log-line" style="color:${color}"><span class="sr-log-ts">${l.ts}</span>${l.msg}</div>`;
  }).join('');
  el.scrollTop = 0;
}

// ── Assemble (mock pipeline run) ──────────────────
async function runAssembly() {
  const btn = document.getElementById('srAssembleBtn');
  if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Assembling…'; }

  addLog('[PIPELINE] Initiating autonomous ingestion…', 'info');
  await delay(700);
  addLog('[CAPTURE] Sales Navigator search triggered via PhantomBuster…', 'info');
  await delay(900);
  addLog('[ENRICHMENT] Crunchbase/FactSet datasets fetched…', 'info');
  await delay(800);
  addLog('[SCORING] Fund Momentum Index computed…', 'info');
  await delay(600);

  // Add a new demo node
  const names = [
    { name: 'Aigerim Bekova', org: 'Sequoia Capital', role: 'Partner' },
    { name: 'David Velez', org: 'Nubank Ventures', role: 'Founder' },
    { name: 'Yishan Wong', org: 'Anthology VC', role: 'GP' },
    { name: 'Phoebe Xu', org: 'NEA', role: 'Partner' },
    { name: 'Rahim Lakhani', org: 'CRV', role: 'GP' }
  ];
  const pick = names[Math.floor(Math.random() * names.length)];
  const nodes = loadNodes();
  if (!nodes.find(n => n.name === pick.name)) {
    nodes.push({
      id: uid(), name: pick.name, org: pick.org, role: pick.role,
      priority: Math.floor(Math.random() * 35) + 60,
      pathStrength: parseFloat((Math.random() * 0.35 + 0.55).toFixed(2)),
      status: 'NEW', relScore: 0
    });
    saveNodes(nodes);
    addLog(`[SYSTEM] Node assembled: ${pick.name} @ ${pick.org}`, 'success');
  }

  await delay(500);
  addLog('[ROUTING] Warm-path graph recomputed. Queue updated.', 'success');

  renderNodeTable();
  renderStats();

  if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fas fa-play"></i> Assemble Stack'; }
}

function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

// ── Tab Switcher (internal) ───────────────────────
function activateSrTab(tabId) {
  document.querySelectorAll('.sr-panel').forEach(p => p.style.display = 'none');
  document.querySelectorAll('.sr-tab').forEach(b => b.classList.remove('active'));
  const panel = document.getElementById(`sr-panel-${tabId}`);
  if (panel) panel.style.display = 'block';
  document.querySelector(`.sr-tab[data-sr="${tabId}"]`)?.classList.add('active');
}

// ── Init ──────────────────────────────────────────
export function initShoutReach() {
  const container = document.getElementById('sr-root');
  if (!container || container.dataset.init) return;
  container.dataset.init = '1';

  container.innerHTML = `
  <!-- Header Stats -->
  <div class="sr-stats-row">
    <div class="stat-card"><span class="stat-num" id="sr-stat-nodes">0</span><span class="stat-label">Nodes</span></div>
    <div class="stat-card accent-green"><span class="stat-num" id="sr-stat-warm">0</span><span class="stat-label">Warm Paths</span></div>
    <div class="stat-card"><span class="stat-num" id="sr-stat-queue">0</span><span class="stat-label">In Queue</span></div>
    <div class="stat-card accent-green"><span class="stat-num" id="sr-stat-replied">0</span><span class="stat-label">Replied</span></div>
    <div class="sr-assemble">
      <button class="btn-primary" id="srAssembleBtn">
        <i class="fas fa-play"></i> Assemble Stack
      </button>
      <button class="btn-secondary" id="srClearLogsBtn">
        <i class="fas fa-trash"></i> Clear Logs
      </button>
    </div>
  </div>

  <!-- Internal Tab Bar -->
  <div class="sr-tabs">
    <button class="sr-tab active" data-sr="pipeline"><i class="fas fa-code-branch"></i> Pipeline</button>
    <button class="sr-tab" data-sr="membrain"><i class="fas fa-network-wired"></i> MemBrain Graph</button>
    <button class="sr-tab" data-sr="queue"><i class="fas fa-paper-plane"></i> Outreach Queue</button>
    <button class="sr-tab" data-sr="logs"><i class="fas fa-terminal"></i> Kernel Logs</button>
  </div>

  <!-- Panel: Pipeline (DAC Editor) -->
  <div class="sr-panel" id="sr-panel-pipeline">
    <div class="sr-dac-wrap">
      <div class="sr-dac-header">
        <span class="sr-mono" style="font-size:11px;color:var(--text-muted)">capital_routing.dac</span>
        <div class="sr-dac-badges">
          <span class="sr-badge badge-ok"><i class="fas fa-circle-check"></i> Validated</span>
          <span class="sr-badge badge-blue"><i class="fas fa-lock"></i> Encrypted</span>
        </div>
      </div>
      <textarea class="sr-dac-editor" id="srDacEditor" spellcheck="false"></textarea>
      <div class="sr-dac-footer sr-mono">
        COMPILER: v1.2.1 · SYNC: ENCRYPTED · MODE: AUTONOMOUS
      </div>
    </div>

    <div class="sr-pipeline-steps">
      <div class="sr-step"><i class="fas fa-magnifying-glass"></i><span>Capture</span><small>SalesNav → PB</small></div>
      <i class="fas fa-arrow-right sr-step-arrow"></i>
      <div class="sr-step"><i class="fas fa-chart-bar"></i><span>Enrich</span><small>Crunchbase + FS</small></div>
      <i class="fas fa-arrow-right sr-step-arrow"></i>
      <div class="sr-step"><i class="fas fa-route"></i><span>Route</span><small>Warm-Path Graph</small></div>
      <i class="fas fa-arrow-right sr-step-arrow"></i>
      <div class="sr-step"><i class="fas fa-envelope"></i><span>Outreach</span><small>InMail Queue</small></div>
    </div>
  </div>

  <!-- Panel: MemBrain Graph (Node Explorer) -->
  <div class="sr-panel" id="sr-panel-membrain" style="display:none;">
    <div class="sr-table-wrap">
      <table class="sr-table">
        <thead>
          <tr>
            <th>Lead / Org</th><th>Role</th><th>Priority</th>
            <th>Warm-Path</th><th>Log Event</th><th>Status</th><th></th>
          </tr>
        </thead>
        <tbody id="srNodeTable"></tbody>
      </table>
    </div>
  </div>

  <!-- Panel: Outreach Queue -->
  <div class="sr-panel" id="sr-panel-queue" style="display:none;">
    <div class="sr-queue-wrap">
      <div class="sr-queue-label">Active outreach — 48h SLA follow-up</div>
      <div id="srQueueList"></div>
    </div>
  </div>

  <!-- Panel: Kernel Logs -->
  <div class="sr-panel" id="sr-panel-logs" style="display:none;">
    <div class="sr-logs-wrap" id="srLogs"></div>
  </div>
  `;

  // Load DAC
  const dacEl = document.getElementById('srDacEditor');
  if (dacEl) {
    dacEl.value = loadDac();
    dacEl.addEventListener('blur', () => saveDac(dacEl.value));
  }

  // Assemble
  document.getElementById('srAssembleBtn')?.addEventListener('click', runAssembly);
  document.getElementById('srClearLogsBtn')?.addEventListener('click', () => {
    localStorage.removeItem(LS_LOGS);
    renderLogs();
  });

  // SR tab switcher
  document.querySelectorAll('.sr-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      activateSrTab(btn.dataset.sr);
      if (btn.dataset.sr === 'membrain') renderNodeTable();
      if (btn.dataset.sr === 'queue') renderQueue();
      if (btn.dataset.sr === 'logs') renderLogs();
    });
  });

  // Initial render
  if (!loadNodes().length) saveNodes([...DEMO_NODES]);
  renderStats();
  addLog('[SYSTEM] Shout Reach stack initialized.', 'info');
}
