const LS_APPS = 'pf1_tracker_apps';
const LS_INIT = 'pf1_tracker_initialized';

const SEED_PROGRAMS = [
  { programName: 'Y Combinator S26',    programId: 'yc-s26',      color: '#f97316', deadline: '2026-04-20' },
  { programName: 'Techstars',           programId: 'techstars',   color: '#00b4d8', deadline: '2026-05-15' },
  { programName: 'a16z Speedrun',       programId: 'a16z-speedrun', color: '#7c3aed', deadline: '2026-05-01' },
  { programName: 'Berkeley SkyDeck',    programId: 'skydeck',     color: '#059669', deadline: '2026-05-31' },
  { programName: '500 Global',          programId: '500-global',  color: '#e11d48', deadline: '2026-06-01' },
  { programName: 'Alchemist',           programId: 'alchemist',   color: '#9333ea', deadline: '2026-05-20' },
  { programName: 'Pear VC',             programId: 'pear-vc',     color: '#65a30d', deadline: '2026-06-15' },
  { programName: 'GenAI Fund',          programId: 'genai-fund',  color: '#0891b2', deadline: '2026-06-30' },
  { programName: 'Pear VC Garage',      programId: 'pear-garage', color: '#84cc16', deadline: '2026-07-01' },
  { programName: 'Pioneer.app',         programId: 'pioneer',     color: '#f59e0b', deadline: '2026-05-10' },
];

const STATUS_ORDER = ['researching', 'applied', 'in-review', 'decision'];
const STATUS_LABELS = { researching: 'Researching', applied: 'Applied', 'in-review': 'In Review', decision: 'Decision' };
const STATUS_SUBSTATUS = ['accepted', 'rejected'];

function loadApps() {
  try { return JSON.parse(localStorage.getItem(LS_APPS)) || []; }
  catch { return []; }
}
function saveApps(apps) {
  localStorage.setItem(LS_APPS, JSON.stringify(apps));
}
function uid() {
  return crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2);
}

function daysBetween(dateStr) {
  const today = new Date(); today.setHours(0,0,0,0);
  const target = new Date(dateStr);
  return Math.ceil((target - today) / 86400000);
}

function seedIfNeeded() {
  if (localStorage.getItem(LS_INIT)) return;
  const apps = SEED_PROGRAMS.map(p => ({
    id: uid(),
    programName: p.programName,
    programId: p.programId,
    color: p.color,
    status: 'researching',
    appliedDate: null,
    deadline: p.deadline,
    notes: '',
    archived: false
  }));
  saveApps(apps);
  localStorage.setItem(LS_INIT, '1');
}

function renderStats(apps) {
  const active = apps.filter(a => !a.archived);
  document.getElementById('statTotal').textContent = active.length;
  document.getElementById('statApplied').textContent = active.filter(a => a.status === 'applied').length;
  document.getElementById('statInReview').textContent = active.filter(a => a.status === 'in-review').length;
  document.getElementById('statAccepted').textContent = active.filter(a => a.status === 'accepted').length;
  document.getElementById('statRejected').textContent = active.filter(a => a.status === 'rejected').length;
}

function renderDeadlines(apps) {
  const list = document.getElementById('deadlinesList');
  if (!list) return;
  const today = new Date(); today.setHours(0,0,0,0);
  const cutoff = new Date(today); cutoff.setDate(today.getDate() + 60);

  const upcoming = apps
    .filter(a => !a.archived && a.deadline)
    .map(a => ({ ...a, days: daysBetween(a.deadline) }))
    .filter(a => a.days >= 0 && a.days <= 60)
    .sort((a, b) => a.days - b.days);

  list.innerHTML = upcoming.length
    ? upcoming.map(a => {
        const cls = a.days <= 7 ? 'urgent' : a.days <= 21 ? 'soon' : 'ok';
        return `<span class="deadline-chip">
          ${a.programName}
          <span class="days ${cls}">${a.days === 0 ? 'TODAY' : a.days + 'd'}</span>
        </span>`;
      }).join('')
    : '<span style="font-size:11px;color:var(--text-muted)">No deadlines in next 60 days</span>';
}

function makeCard(app) {
  const days = app.deadline ? daysBetween(app.deadline) : null;
  const dlClass = days !== null ? (days <= 7 ? 'urgent' : days <= 21 ? 'soon' : '') : '';
  const dlText = app.deadline
    ? `Deadline: ${app.deadline}${days !== null ? ` (${days === 0 ? 'today' : days < 0 ? 'passed' : days + 'd'})` : ''}`
    : 'No deadline set';

  // Determine move/action buttons
  const idx = STATUS_ORDER.indexOf(app.status);
  const canMoveForward = idx >= 0 && idx < STATUS_ORDER.length - 1;
  const isDecision = app.status === 'decision';

  let actionBtns = '';
  if (canMoveForward) {
    const nextLabel = STATUS_LABELS[STATUS_ORDER[idx + 1]];
    actionBtns += `<button class="btn-card-action move" data-action="next" data-id="${app.id}">→ ${nextLabel}</button>`;
  }
  if (isDecision) {
    actionBtns += `<button class="btn-card-action accept" data-action="accept" data-id="${app.id}">✓ Accepted</button>`;
    actionBtns += `<button class="btn-card-action reject" data-action="reject" data-id="${app.id}">✗ Rejected</button>`;
  }

  const div = document.createElement('div');
  div.className = 'app-card';
  div.dataset.id = app.id;
  div.innerHTML = `
    <div class="app-card-accent" style="background:${app.color}"></div>
    <div class="app-card-header">
      <span class="app-name">${app.programName}</span>
      <button class="btn-card-action" data-action="edit" data-id="${app.id}" title="Edit"><i class="fas fa-pen" style="font-size:9px;"></i></button>
    </div>
    <div class="app-deadline ${dlClass}">${dlText}</div>
    ${app.notes ? `<div class="app-notes">${app.notes}</div>` : ''}
    <div class="app-card-actions">
      ${actionBtns}
      <button class="btn-card-action" data-action="archive" data-id="${app.id}" style="margin-left:auto;">Archive</button>
    </div>`;
  return div;
}

function renderBoard() {
  const apps = loadApps().filter(a => !a.archived);

  // Clear columns (keep header)
  ['researching', 'applied', 'in-review', 'decision'].forEach(col => {
    const el = document.getElementById(`cards-${col}`);
    if (el) el.innerHTML = '';
  });

  apps.forEach(app => {
    const status = STATUS_SUBSTATUS.includes(app.status) ? 'decision' : app.status;
    const col = document.getElementById(`cards-${status}`);
    if (col) col.appendChild(makeCard(app));
  });

  renderStats(apps);
  renderDeadlines(apps);
  attachBoardListeners();
}

function attachBoardListeners() {
  document.querySelectorAll('[data-action]').forEach(btn => {
    // Prevent duplicate listeners
    const newBtn = btn.cloneNode(true);
    btn.parentNode.replaceChild(newBtn, btn);
  });

  document.querySelectorAll('[data-action]').forEach(btn => {
    btn.addEventListener('click', () => {
      const { action, id } = btn.dataset;
      const apps = loadApps();
      const app = apps.find(a => a.id === id);
      if (!app) return;

      if (action === 'next') {
        const idx = STATUS_ORDER.indexOf(app.status);
        if (idx < STATUS_ORDER.length - 1) {
          app.status = STATUS_ORDER[idx + 1];
          if (app.status === 'applied') app.appliedDate = new Date().toISOString().slice(0, 10);
        }
        saveApps(apps); renderBoard();
      } else if (action === 'accept') {
        app.status = 'accepted'; saveApps(apps); renderBoard();
      } else if (action === 'reject') {
        app.status = 'rejected'; saveApps(apps); renderBoard();
      } else if (action === 'archive') {
        app.archived = true; saveApps(apps); renderBoard();
      } else if (action === 'edit') {
        openEditModal(app, apps);
      }
    });
  });
}

function openEditModal(app, apps) {
  const overlay = document.getElementById('modalOverlay');
  const title = document.getElementById('modalTitle');
  const body = document.getElementById('modalBody');
  const confirm = document.getElementById('modalConfirm');
  const cancel = document.getElementById('modalCancel');
  const close = document.getElementById('modalClose');

  title.textContent = `Edit: ${app.programName}`;
  body.innerHTML = `
    <div class="modal-form">
      <div class="field-group">
        <label class="field-label">Notes</label>
        <textarea class="field-input" id="editNotes" style="min-height:80px;">${app.notes || ''}</textarea>
      </div>
      <div class="field-group">
        <label class="field-label">Deadline</label>
        <input type="date" class="field-input" id="editDeadline" value="${app.deadline || ''}"/>
      </div>
      <div class="field-group">
        <label class="field-label">Applied Date</label>
        <input type="date" class="field-input" id="editApplied" value="${app.appliedDate || ''}"/>
      </div>
    </div>`;

  overlay.style.display = 'flex';

  const doSave = () => {
    app.notes = document.getElementById('editNotes')?.value || '';
    app.deadline = document.getElementById('editDeadline')?.value || app.deadline;
    app.appliedDate = document.getElementById('editApplied')?.value || app.appliedDate;
    const idx = apps.findIndex(a => a.id === app.id);
    if (idx >= 0) apps[idx] = app;
    saveApps(apps);
    overlay.style.display = 'none';
    renderBoard();
  };
  const doClose = () => { overlay.style.display = 'none'; };

  confirm.onclick = doSave;
  cancel.onclick = doClose;
  close.onclick = doClose;
  overlay.onclick = e => { if (e.target === overlay) doClose(); };
}

function openAddModal() {
  const overlay = document.getElementById('modalOverlay');
  const title = document.getElementById('modalTitle');
  const body = document.getElementById('modalBody');
  const confirm = document.getElementById('modalConfirm');
  const cancel = document.getElementById('modalCancel');
  const close = document.getElementById('modalClose');

  title.textContent = 'Add Program';
  body.innerHTML = `
    <div class="modal-form">
      <div class="field-group">
        <label class="field-label">Program Name</label>
        <input type="text" class="field-input" id="newProgName" placeholder="e.g. First Round Pre-Seed"/>
      </div>
      <div class="field-group">
        <label class="field-label">Deadline</label>
        <input type="date" class="field-input" id="newProgDeadline"/>
      </div>
      <div class="field-group">
        <label class="field-label">Notes</label>
        <textarea class="field-input" id="newProgNotes" style="min-height:60px;" placeholder="Any initial notes..."></textarea>
      </div>
    </div>`;

  overlay.style.display = 'flex';

  const doSave = () => {
    const name = document.getElementById('newProgName')?.value.trim();
    if (!name) return;
    const apps = loadApps();
    apps.push({
      id: uid(),
      programName: name,
      programId: name.toLowerCase().replace(/\s+/g, '-'),
      color: '#7d8590',
      status: 'researching',
      appliedDate: null,
      deadline: document.getElementById('newProgDeadline')?.value || null,
      notes: document.getElementById('newProgNotes')?.value || '',
      archived: false
    });
    saveApps(apps);
    overlay.style.display = 'none';
    renderBoard();
  };
  const doClose = () => { overlay.style.display = 'none'; };

  confirm.onclick = doSave;
  cancel.onclick = doClose;
  close.onclick = doClose;
  overlay.onclick = e => { if (e.target === overlay) doClose(); };
}

export function initTracking() {
  seedIfNeeded();
  renderBoard();

  document.getElementById('exportTrackerBtn')?.addEventListener('click', () => {
    const apps = loadApps();
    const blob = new Blob([JSON.stringify(apps, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'pf1_tracker_export.json';
    a.click();
    URL.revokeObjectURL(a.href);
  });

  document.getElementById('addApplicationBtn')?.addEventListener('click', openAddModal);
}
