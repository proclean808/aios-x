const LS_CANVAS = 'pf1_concept_canvas';
const LS_ICP = 'pf1_concept_icp';

function loadCanvas() {
  try { return JSON.parse(localStorage.getItem(LS_CANVAS)) || {}; }
  catch { return {}; }
}
function saveCanvas(data) {
  localStorage.setItem(LS_CANVAS, JSON.stringify(data));
}

function loadICP() {
  try { return JSON.parse(localStorage.getItem(LS_ICP)) || null; }
  catch { return null; }
}
function saveICP(data) {
  localStorage.setItem(LS_ICP, JSON.stringify(data));
}

function setCanvasStatus(msg, color) {
  const el = document.getElementById('canvasStatus');
  if (!el) return;
  el.textContent = msg;
  el.style.color = color || 'var(--accent-green-l)';
}

function initLeanCanvas() {
  const saved = loadCanvas();
  const boxes = document.querySelectorAll('.canvas-box');

  boxes.forEach(box => {
    const id = box.dataset.id;
    const ta = box.querySelector('.box-textarea');
    if (!ta) return;

    // Load saved value
    if (saved[id]) ta.value = saved[id];

    // Auto-save on blur
    ta.addEventListener('blur', () => {
      const data = loadCanvas();
      data[id] = ta.value;
      saveCanvas(data);
      setCanvasStatus(`Auto-saved at ${new Date().toLocaleTimeString()}`, 'var(--text-muted)');
    });
  });

  // Save button
  document.getElementById('saveCanvasBtn')?.addEventListener('click', () => {
    const data = {};
    boxes.forEach(box => {
      const id = box.dataset.id;
      const ta = box.querySelector('.box-textarea');
      if (ta) data[id] = ta.value;
    });
    saveCanvas(data);
    setCanvasStatus(`Saved at ${new Date().toLocaleTimeString()}`);
  });

  // Clear button
  document.getElementById('clearCanvasBtn')?.addEventListener('click', () => {
    if (!confirm('Clear all canvas content? This cannot be undone.')) return;
    localStorage.removeItem(LS_CANVAS);
    boxes.forEach(box => {
      const ta = box.querySelector('.box-textarea');
      if (ta) ta.value = '';
    });
    setCanvasStatus('Canvas cleared.', 'var(--accent-amber)');
  });
}

function getICPFormValues() {
  return {
    role: document.getElementById('icp-role')?.value.trim() || '',
    industry: document.getElementById('icp-industry')?.value.trim() || '',
    size: document.getElementById('icp-size')?.value || '',
    revenue: document.getElementById('icp-revenue')?.value.trim() || '',
    pain: document.getElementById('icp-pain')?.value.trim() || '',
    currentsolution: document.getElementById('icp-currentsolution')?.value.trim() || '',
    authority: document.getElementById('icp-authority')?.value || '',
    success: document.getElementById('icp-success')?.value.trim() || ''
  };
}

function populateICPForm(data) {
  if (!data) return;
  const fields = ['role','industry','size','revenue','pain','currentsolution','authority','success'];
  fields.forEach(f => {
    const el = document.getElementById(`icp-${f}`);
    if (el && data[f]) el.value = data[f];
  });
}

function renderICPSummary(data) {
  const summary = document.getElementById('icpSummary');
  const form = document.getElementById('icpForm');
  const editBtn = document.getElementById('editIcpBtn');
  const saveBtn = document.getElementById('saveIcpBtn');

  if (!summary) return;

  const rows = [
    { label: 'Job Title / Role', value: data.role },
    { label: 'Industry', value: data.industry },
    { label: 'Company Size', value: data.size },
    { label: 'Annual Revenue', value: data.revenue },
    { label: 'Primary Pain', value: data.pain },
    { label: 'Current Solution', value: data.currentsolution },
    { label: 'Buying Authority', value: data.authority },
    { label: 'Success Metric', value: data.success }
  ].filter(r => r.value);

  summary.innerHTML = `
    <h4><i class="fas fa-person-circle-check"></i> Ideal Customer Profile</h4>
    <div class="icp-summary-grid">
      ${rows.map(r => `
        <div class="icp-field">
          <span class="icp-field-label">${r.label}</span>
          <span class="icp-field-value">${r.value}</span>
        </div>`).join('')}
    </div>`;

  summary.style.display = 'block';
  if (form) form.style.display = 'none';
  if (editBtn) editBtn.style.display = 'inline-flex';
  if (saveBtn) saveBtn.style.display = 'none';
}

function initICPBuilder() {
  const saved = loadICP();
  if (saved) {
    populateICPForm(saved);
    renderICPSummary(saved);
  }

  document.getElementById('saveIcpBtn')?.addEventListener('click', () => {
    const data = getICPFormValues();
    saveICP(data);
    renderICPSummary(data);
  });

  document.getElementById('editIcpBtn')?.addEventListener('click', () => {
    const form = document.getElementById('icpForm');
    const summary = document.getElementById('icpSummary');
    const editBtn = document.getElementById('editIcpBtn');
    const saveBtn = document.getElementById('saveIcpBtn');

    if (form) form.style.display = 'block';
    if (summary) summary.style.display = 'none';
    if (editBtn) editBtn.style.display = 'none';
    if (saveBtn) saveBtn.style.display = 'inline-flex';

    const saved = loadICP();
    if (saved) populateICPForm(saved);
  });
}

export function initConcept() {
  initLeanCanvas();
  initICPBuilder();
}
