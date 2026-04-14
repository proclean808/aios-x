import { PROGRAMS, getProgramById } from '../data/programs.js';

const LS_KEY = 'pf1_builder_drafts';

function loadDrafts() {
  try { return JSON.parse(localStorage.getItem(LS_KEY)) || {}; }
  catch { return {}; }
}
function saveDraft(programId, questionId, answer) {
  const drafts = loadDrafts();
  drafts[`${programId}_${questionId}`] = { answer, savedAt: Date.now() };
  localStorage.setItem(LS_KEY, JSON.stringify(drafts));
}
function getDraft(programId, questionId) {
  const drafts = loadDrafts();
  return drafts[`${programId}_${questionId}`]?.answer || '';
}

function countWords(text) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function buildChecklist(program, drafts) {
  const list = document.getElementById('builderChecklist');
  const progress = document.getElementById('builderProgress');
  if (!list || !progress) return;

  const total = program.questions.length;
  let done = 0;
  list.innerHTML = '';

  program.questions.forEach(q => {
    const draft = drafts[`${program.id}_${q.id}`]?.answer || '';
    const hasDraft = draft.trim().length > 0;
    if (hasDraft) done++;

    const li = document.createElement('li');
    li.className = hasDraft ? 'done-item' : '';
    li.innerHTML = `<i class="fas ${hasDraft ? 'fa-circle-check check-icon done' : 'fa-circle check-icon empty'}"></i>
      <span>${q.section}: ${q.text.substring(0, 40)}${q.text.length > 40 ? '…' : ''}</span>`;
    list.appendChild(li);
  });

  progress.textContent = `${done} / ${total}`;
}

function renderQuestion(program, q, drafts) {
  const draft = getDraft(program.id, q.id);
  const wordCount = countWords(draft);
  const pct = wordCount / q.wordLimit;
  let counterClass = pct >= 1 ? 'over' : pct >= 0.9 ? 'warning' : '';

  const card = document.createElement('div');
  card.className = `question-card${draft.trim() ? ' is-saved' : ''}`;
  card.dataset.qid = q.id;
  card.innerHTML = `
    <div class="qcard-header">
      <span class="qcard-section">${q.section}</span>
      <span class="qcard-wordlimit">${q.wordLimit} words</span>
    </div>
    <div class="qcard-question">${q.text}</div>
    <div class="qcard-body">
      <textarea class="qcard-textarea" data-progid="${program.id}" data-qid="${q.id}"
        placeholder="Write your answer here...">${draft}</textarea>
      <div class="qcard-footer">
        <span class="word-counter ${counterClass}" id="wc-${q.id}">${wordCount} / ${q.wordLimit} words</span>
        <div class="qcard-actions">
          <button class="btn-tip" data-qid="${q.id}">
            <i class="fas fa-lightbulb"></i> Show Tip
          </button>
          <button class="btn-secondary btn-sm save-btn" data-progid="${program.id}" data-qid="${q.id}">
            <i class="fas fa-floppy-disk"></i> Save
          </button>
          <span class="save-indicator" id="si-${q.id}">Saved</span>
        </div>
      </div>
      <div class="qcard-tips" id="tips-${q.id}" style="display:none;">
        <ul>${q.tips.map(t => `<li>${t}</li>`).join('')}</ul>
      </div>
    </div>`;
  return card;
}

function loadProgramQuestions(programId) {
  const program = getProgramById(programId);
  const container = document.getElementById('builderQuestions');
  const emptyState = document.getElementById('builderEmptyState');
  const sidebar = document.getElementById('builderSidebar');
  const exportRow = document.getElementById('builderExportRow');

  if (!program) {
    if (emptyState) emptyState.style.display = 'flex';
    if (sidebar) sidebar.style.display = 'none';
    if (exportRow) exportRow.style.display = 'none';
    return;
  }

  if (emptyState) emptyState.style.display = 'none';
  if (sidebar) sidebar.style.display = 'block';
  if (exportRow) exportRow.style.display = 'flex';

  const drafts = loadDrafts();
  container.innerHTML = '';
  program.questions.forEach(q => {
    container.appendChild(renderQuestion(program, q, drafts));
  });

  buildChecklist(program, drafts);
  attachCardListeners(program);
}

function attachCardListeners(program) {
  const container = document.getElementById('builderQuestions');

  // Word counter (live)
  container.querySelectorAll('.qcard-textarea').forEach(ta => {
    ta.addEventListener('input', () => {
      const qid = ta.dataset.qid;
      const q = program.questions.find(q => q.id === qid);
      if (!q) return;
      const wc = countWords(ta.value);
      const pct = wc / q.wordLimit;
      const el = document.getElementById(`wc-${qid}`);
      if (el) {
        el.textContent = `${wc} / ${q.wordLimit} words`;
        el.className = `word-counter ${pct >= 1 ? 'over' : pct >= 0.9 ? 'warning' : ''}`;
      }
    });
  });

  // Save buttons
  container.querySelectorAll('.save-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const { progid, qid } = btn.dataset;
      const ta = container.querySelector(`.qcard-textarea[data-qid="${qid}"]`);
      if (!ta) return;
      saveDraft(progid, qid, ta.value);
      const card = ta.closest('.question-card');
      if (card) card.classList.toggle('is-saved', ta.value.trim().length > 0);
      const si = document.getElementById(`si-${qid}`);
      if (si) { si.classList.add('visible'); setTimeout(() => si.classList.remove('visible'), 1800); }
      buildChecklist(getProgramById(progid), loadDrafts());
    });
  });

  // Tip toggles
  container.querySelectorAll('.btn-tip').forEach(btn => {
    btn.addEventListener('click', () => {
      const qid = btn.dataset.qid;
      const tips = document.getElementById(`tips-${qid}`);
      if (!tips) return;
      const visible = tips.style.display !== 'none';
      tips.style.display = visible ? 'none' : 'block';
      btn.innerHTML = visible
        ? '<i class="fas fa-lightbulb"></i> Show Tip'
        : '<i class="fas fa-lightbulb"></i> Hide Tip';
    });
  });
}

function getAllAnswers(programId) {
  const program = getProgramById(programId);
  if (!program) return '';
  const drafts = loadDrafts();
  return program.questions.map(q => {
    const answer = drafts[`${programId}_${q.id}`]?.answer || '';
    return `=== ${q.section}: ${q.text} ===\n${answer}\n`;
  }).join('\n');
}

export function initBuilder() {
  const select = document.getElementById('programSelect');
  if (!select) return;

  // Populate dropdown
  if (select.options.length <= 1) {
    PROGRAMS.forEach(p => {
      const opt = document.createElement('option');
      opt.value = p.id;
      opt.textContent = p.name;
      select.appendChild(opt);
    });
  }

  select.addEventListener('change', () => loadProgramQuestions(select.value));

  // Export buttons
  document.getElementById('builderCopyAll')?.addEventListener('click', () => {
    const text = getAllAnswers(select.value);
    navigator.clipboard.writeText(text).then(() => showToast('Copied to clipboard'));
  });

  document.getElementById('builderDownload')?.addEventListener('click', () => {
    const program = getProgramById(select.value);
    if (!program) return;
    const text = getAllAnswers(select.value);
    const blob = new Blob([text], { type: 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${program.shortName.replace(/\s+/g, '_')}_application.txt`;
    a.click();
    URL.revokeObjectURL(a.href);
  });
}

function showToast(msg) {
  const t = document.createElement('div');
  t.style.cssText = 'position:fixed;bottom:24px;right:24px;background:#238636;color:#fff;padding:10px 18px;border-radius:8px;font-size:13px;z-index:9999;font-family:var(--font-ui)';
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 2000);
}
