/* ═════════════════════════════════════
   BotCast Arena · Frontend Engine
   TALON Orchestration Mesh
   TurnSignal Protocol v1.0
   Debate Graph: Opening→Rebuttal→Cross-Exam→Risk Discovery→Synthesis→Judge→Decision Memo
═════════════════════════════════════ */

// ── DEBATE GRAPH DEFINITION ───────────────────────────────────────────────
const DEBATE_STAGES = [
  { id: 'opening',        label: 'OPENING',        icon: 'fas fa-door-open',            sequence: 1 },
  { id: 'rebuttal',       label: 'REBUTTAL',        icon: 'fas fa-reply-all',            sequence: 2 },
  { id: 'cross_exam',     label: 'CROSS-EXAM',      icon: 'fas fa-question-circle',      sequence: 3 },
  { id: 'risk_discovery', label: 'RISK DISCOVERY',  icon: 'fas fa-exclamation-triangle', sequence: 4 },
  { id: 'synthesis',      label: 'SYNTHESIS',        icon: 'fas fa-compress-arrows-alt',  sequence: 5 },
  { id: 'judge',          label: 'JUDGE SCORE',      icon: 'fas fa-gavel',               sequence: 6 },
  { id: 'decision_memo',  label: 'DECISION MEMO',    icon: 'fas fa-file-contract',        sequence: 7 },
];

// ── TURNSIGNAL QUEUE (frontend simulation) ────────────────────────────────
const SIGNAL_TYPES = {
  SPEAK_REQUEST:     { priority: 50, label: 'SPEAK_REQ' },
  REBUTTAL_REQUEST:  { priority: 70, label: 'REBUTTAL_REQ' },
  EVIDENCE_CITE:     { priority: 60, label: 'EVIDENCE_CITE' },
  CROSS_EXAM_ANSWER: { priority: 80, label: 'CROSS_EXAM_ANS' },
  YIELD:             { priority: 10, label: 'YIELD' },
};

class TurnSignalQueue {
  constructor() {
    this.queue = [];
    this.history = [];
    this.currentFloor = null;
  }

  submit(agentId, signalType, urgency = 0) {
    const base = SIGNAL_TYPES[signalType]?.priority ?? 50;
    const signal = {
      id: `ts_${Date.now()}_${Math.random().toString(36).slice(2,7)}`,
      agentId,
      signalType,
      priority: base + urgency,
      label: SIGNAL_TYPES[signalType]?.label ?? signalType,
      createdAt: Date.now(),
    };
    this.queue.push(signal);
    this.queue.sort((a, b) => b.priority - a.priority);
    return signal;
  }

  grantNext() {
    if (this.queue.length === 0) return null;
    const signal = this.queue.shift();
    this.currentFloor = signal.agentId;
    const grant = { ...signal, grantedAt: Date.now(), grantedBy: 'talon-moderator' };
    this.history.push(grant);
    return grant;
  }

  yield(agentId) {
    if (this.currentFloor === agentId) this.currentFloor = null;
  }

  reset() { this.queue = []; this.history = []; this.currentFloor = null; }
  depth() { return this.queue.length; }
}

// ── JUDGE ENGINE (frontend) ───────────────────────────────────────────────
function hashScore(seed, min = 62, max = 96) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (Math.imul(31, h) + seed.charCodeAt(i)) | 0;
  return min + (Math.abs(h) % (max - min + 1));
}

function judgeAgent(topic, agentId) {
  const seed = topic + agentId;
  const dims = {
    claim_strength:         hashScore(seed + 'claim'),
    rebuttal_effectiveness: hashScore(seed + 'rebuttal'),
    evidence_quality:       hashScore(seed + 'evidence'),
    reasoning_rigor:        hashScore(seed + 'reasoning'),
    novel_insight:          hashScore(seed + 'novel', 50, 90),
  };
  const total = Math.round(
    dims.claim_strength * 0.25 +
    dims.rebuttal_effectiveness * 0.25 +
    dims.evidence_quality * 0.20 +
    dims.reasoning_rigor * 0.20 +
    dims.novel_insight * 0.10
  );
  return { ...dims, total };
}

// ── GLOBAL STATE ──────────────────────────────────────────────────────────
let botcastRunning = false;
let botcastPaused  = false;
let botcastRunId   = null;
let currentStageIdx = -1;
let turnQueue = new TurnSignalQueue();

const transcript   = []; // all turn outputs
let   judgeResults = null;
let   synthesisText = '';
let   activePersonaIds = [];

// ── MAIN ORCHESTRATOR ─────────────────────────────────────────────────────
async function startBotcast() {
  if (botcastRunning) { showToast('BotCast already running', 'warning'); return; }

  const topic = document.getElementById('botcastTopic')?.value.trim();
  if (!topic) { showToast('Enter a debate topic', 'warning'); return; }

  // Collect selected personas
  activePersonaIds = BOTCAST_DEBATING_IDS.filter(id => {
    const cb = document.getElementById(`persona-cb-${id}`);
    return cb && cb.checked;
  });
  if (activePersonaIds.length < 2) {
    showToast('Select at least 2 personas', 'warning');
    return;
  }

  botcastRunning  = true;
  botcastPaused   = false;
  currentStageIdx = -1;
  botcastRunId    = `debate_run_${new Date().toISOString().replace(/[:.]/g,'').replace('T','_').slice(0,-1)}`;
  transcript.length = 0;
  judgeResults   = null;
  synthesisText  = '';
  turnQueue.reset();

  const btn = document.getElementById('startBotcast');
  if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Running...'; }

  // Reset UI
  resetBotcastUI(topic);
  setBroadcastStatus('ON AIR', true);
  addBotcastLog(`━━━ RUN: ${botcastRunId} ━━━`, 'highlight');
  addBotcastLog(`Topic: "${topic}"`, 'info');
  addBotcastLog(`Personas: ${activePersonaIds.map(id => BOTCAST_PERSONAS[id].callsign).join(' · ')}`, 'info');
  addBotcastLog(`TurnSignal Protocol: ACTIVE — VAD bypass engaged`, 'success');

  showToast('BotCast Arena live', 'success');

  // ── STAGE 1: OPENING ──────────────────────────────────────────────────
  await runStage('opening', async () => {
    // Queue all debating personas for opening
    for (const id of activePersonaIds) {
      turnQueue.submit(id, 'SPEAK_REQUEST');
    }
    renderTurnQueue();

    for (const id of activePersonaIds) {
      const grant = turnQueue.grantNext();
      renderTurnQueue();
      const persona = BOTCAST_PERSONAS[id];
      await runPersonaTurn(persona, 'opening', topic,
        persona.static_arguments.opening);
      turnQueue.yield(id);
    }
  });

  // ── STAGE 2: REBUTTAL ────────────────────────────────────────────────
  await runStage('rebuttal', async () => {
    for (const id of activePersonaIds) {
      turnQueue.submit(id, 'REBUTTAL_REQUEST', 10);
    }
    renderTurnQueue();

    for (const id of activePersonaIds) {
      const grant = turnQueue.grantNext();
      renderTurnQueue();
      const persona = BOTCAST_PERSONAS[id];
      await runPersonaTurn(persona, 'rebuttal', topic,
        persona.static_arguments.rebuttal);
      turnQueue.yield(id);
    }
  });

  // ── STAGE 3: CROSS-EXAM ───────────────────────────────────────────────
  await runStage('cross_exam', async () => {
    const moderator = BOTCAST_PERSONAS['talon-moderator'];
    for (const id of activePersonaIds) {
      const question = moderator.cross_exam_questions[id] || 'What is the weakest assumption in your argument?';
      addBotcastLog(`TALON → ${BOTCAST_PERSONAS[id].callsign}: "${question.substring(0,80)}..."`, 'highlight');
      await sleep(800);

      turnQueue.submit(id, 'CROSS_EXAM_ANSWER', 20);
      renderTurnQueue();
      const grant = turnQueue.grantNext();
      renderTurnQueue();

      const persona = BOTCAST_PERSONAS[id];
      await runPersonaTurn(persona, 'cross_exam', topic,
        persona.static_arguments.cross_exam_answer,
        question);
      turnQueue.yield(id);
    }
  });

  // ── STAGE 4: RISK DISCOVERY ───────────────────────────────────────────
  await runStage('risk_discovery', async () => {
    for (const id of activePersonaIds) {
      turnQueue.submit(id, 'SPEAK_REQUEST', 5);
    }
    renderTurnQueue();

    for (const id of activePersonaIds) {
      turnQueue.grantNext();
      renderTurnQueue();
      const persona = BOTCAST_PERSONAS[id];
      await runPersonaTurn(persona, 'risk_discovery', topic,
        persona.static_arguments.risk_discovery);
      turnQueue.yield(id);
    }
  });

  // ── STAGE 5: SYNTHESIS (TALON) ────────────────────────────────────────
  await runStage('synthesis', async () => {
    const mod = BOTCAST_PERSONAS['talon-moderator'];
    setCurrentSpeaker(mod);
    addBotcastLog('TALON Moderator: synthesizing full debate graph...', 'highlight');
    await sleep(1200);
    synthesisText = mod.static_synthesis;
    await typewriteToEl('botcastSynthesisText', synthesisText, 10);
    transcript.push({ stage: 'synthesis', agentId: 'talon-moderator', text: synthesisText });
    addBotcastLog('Synthesis complete', 'success');
  });

  // ── STAGE 6: JUDGE ────────────────────────────────────────────────────
  await runStage('judge', async () => {
    addBotcastLog('Judge Engine: scoring all agents...', 'info');
    await sleep(600);
    judgeResults = {};
    for (const id of activePersonaIds) {
      judgeResults[id] = judgeAgent(topic, id);
    }
    renderJudgeScorecard(topic);
    addBotcastLog('Scoring complete', 'success');
  });

  // ── STAGE 7: DECISION MEMO ────────────────────────────────────────────
  await runStage('decision_memo', async () => {
    addBotcastLog('Export Engine: generating decision memo...', 'info');
    await sleep(600);
    const memo = buildDecisionMemoFrontend(topic, transcript, judgeResults, synthesisText, botcastRunId);
    renderDecisionMemo(memo);
    addBotcastLog('Decision memo ready — export available', 'success');
    showToast('BotCast complete — Decision Memo generated', 'success');
  });

  // ── COMPLETE ─────────────────────────────────────────────────────────
  setBroadcastStatus('COMPLETE', false);
  addBotcastLog(`━━━ RUN COMPLETE: ${botcastRunId} ━━━`, 'success');

  document.getElementById('botcastArtifacts')?.classList.remove('bc-hidden');
  if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fas fa-broadcast-tower"></i> Start BotCast'; }
  botcastRunning = false;
}

// ── STAGE RUNNER ──────────────────────────────────────────────────────────
async function runStage(stageId, fn) {
  currentStageIdx = DEBATE_STAGES.findIndex(s => s.id === stageId);
  updateDebateGraphProgress(stageId);
  const stage = DEBATE_STAGES[currentStageIdx];
  addBotcastLog(`▶ Stage ${stage.sequence}/7: ${stage.label}`, 'highlight');
  await sleep(400);
  await fn();
  markStageComplete(stageId);
  await sleep(300);
}

// ── PERSONA TURN ──────────────────────────────────────────────────────────
async function runPersonaTurn(persona, stage, topic, text, questionContext) {
  setCurrentSpeaker(persona);

  const stageLabel = DEBATE_STAGES.find(s => s.id === stage)?.label || stage;
  addBotcastLog(`[${persona.callsign}] Floor granted — ${stageLabel}`, 'success');

  // Typewrite to transcript area
  appendTranscriptEntry(persona, stage, text, questionContext);
  await sleep(300);
  addBotcastLog(`[${persona.callsign}] Turn complete — YIELD signal sent`, 'info');

  transcript.push({ stage, agentId: persona.id, text, questionContext: questionContext || null });

  await sleep(400);
  setCurrentSpeaker(null);
}

// ── UI HELPERS ─────────────────────────────────────────────────────────────
function resetBotcastUI(topic) {
  const transcriptEl = document.getElementById('botcastTranscript');
  if (transcriptEl) transcriptEl.innerHTML = '';

  const queueEl = document.getElementById('botcastQueue');
  if (queueEl) queueEl.innerHTML = '<div class="tsq-empty">Queue empty — broadcast not started</div>';

  const synthEl = document.getElementById('botcastSynthesisText');
  if (synthEl) synthEl.textContent = 'Awaiting synthesis...';

  const scorecardEl = document.getElementById('botcastScorecard');
  if (scorecardEl) scorecardEl.innerHTML = '';

  const memoEl = document.getElementById('botcastMemo');
  if (memoEl) memoEl.textContent = '';

  const logEl = document.getElementById('botcastLogBody');
  if (logEl) logEl.innerHTML = '';

  document.getElementById('botcastArtifacts')?.classList.add('bc-hidden');

  DEBATE_STAGES.forEach(s => {
    const el = document.getElementById(`stage-node-${s.id}`);
    if (el) { el.className = 'stage-node pending'; }
  });
}

function setBroadcastStatus(label, isLive) {
  const badge = document.getElementById('broadcastBadge');
  const dot   = document.getElementById('broadcastDot');
  if (badge) badge.textContent = label;
  if (dot)   dot.className = isLive ? 'bc-dot live' : 'bc-dot';
}

function setCurrentSpeaker(persona) {
  const nameEl  = document.getElementById('currentSpeakerName');
  const roleEl  = document.getElementById('currentSpeakerRole');
  const csEl    = document.getElementById('currentSpeakerCallsign');
  const cardEl  = document.getElementById('currentSpeakerCard');

  if (!persona) {
    if (nameEl) nameEl.textContent = '—';
    if (roleEl) roleEl.textContent = '';
    if (csEl)   csEl.textContent   = '?';
    if (cardEl) cardEl.style.removeProperty('--speaker-color');
    return;
  }

  if (nameEl) nameEl.textContent  = persona.name;
  if (roleEl) roleEl.textContent  = persona.role;
  if (csEl)   csEl.textContent    = persona.callsign;
  if (cardEl) cardEl.style.setProperty('--speaker-color', persona.color);
}

function updateDebateGraphProgress(activeStageId) {
  DEBATE_STAGES.forEach(s => {
    const el = document.getElementById(`stage-node-${s.id}`);
    if (!el) return;
    if (s.id === activeStageId) {
      el.className = 'stage-node active';
    } else if (s.sequence < DEBATE_STAGES.find(x => x.id === activeStageId)?.sequence) {
      el.className = 'stage-node completed';
    } else {
      el.className = 'stage-node pending';
    }
  });
}

function markStageComplete(stageId) {
  const el = document.getElementById(`stage-node-${stageId}`);
  if (el) el.className = 'stage-node completed';
}

function renderTurnQueue() {
  const el = document.getElementById('botcastQueue');
  if (!el) return;

  const snapshot = turnQueue.queue;
  if (snapshot.length === 0) {
    el.innerHTML = '<div class="tsq-empty">Queue empty</div>';
    return;
  }

  el.innerHTML = snapshot.map((s, i) => {
    const persona = BOTCAST_PERSONAS[s.agentId];
    return `<div class="tsq-item" style="--tsq-color:${persona?.color || '#38bdf8'}">
      <span class="tsq-pos">${i + 1}</span>
      <span class="tsq-callsign">${persona?.callsign || s.agentId}</span>
      <span class="tsq-signal">${s.label}</span>
      <span class="tsq-pri">P${s.priority}</span>
    </div>`;
  }).join('');
}

function appendTranscriptEntry(persona, stage, text, questionContext) {
  const el = document.getElementById('botcastTranscript');
  if (!el) return;

  const stageLabel = DEBATE_STAGES.find(s => s.id === stage)?.label || stage;
  const entry = document.createElement('div');
  entry.className = 'bc-transcript-entry';
  entry.style.setProperty('--entry-color', persona.color);

  entry.innerHTML = `
    <div class="bcte-header">
      <span class="bcte-callsign" style="color:${persona.color}">[${persona.callsign}]</span>
      <span class="bcte-name">${persona.name}</span>
      <span class="bcte-stage">${stageLabel}</span>
    </div>
    ${questionContext ? `<div class="bcte-question">Q: ${questionContext}</div>` : ''}
    <div class="bcte-text">${escapeHtml(text)}</div>
  `;
  el.appendChild(entry);
  el.scrollTop = el.scrollHeight;
}

function renderJudgeScorecard(topic) {
  const el = document.getElementById('botcastScorecard');
  if (!el || !judgeResults) return;

  const sorted = Object.entries(judgeResults)
    .sort((a, b) => b[1].total - a[1].total);

  el.innerHTML = sorted.map(([id, s], i) => {
    const persona = BOTCAST_PERSONAS[id];
    const dims = [
      { label: 'Claim Strength',          val: s.claim_strength },
      { label: 'Rebuttal Effectiveness',  val: s.rebuttal_effectiveness },
      { label: 'Evidence Quality',         val: s.evidence_quality },
      { label: 'Reasoning Rigor',          val: s.reasoning_rigor },
      { label: 'Novel Insight',            val: s.novel_insight },
    ];
    return `<div class="bc-score-card ${i === 0 ? 'winner' : ''}" style="--sc-color:${persona.color}">
      <div class="bsc-header">
        <span class="bsc-rank">#${i + 1}</span>
        <span class="bsc-callsign">${persona.callsign}</span>
        <span class="bsc-name">${persona.name}</span>
        <span class="bsc-total">${s.total}</span>
      </div>
      <div class="bsc-dims">
        ${dims.map(d => `
          <div class="bsc-dim">
            <span class="bsc-dlabel">${d.label}</span>
            <div class="bsc-bar"><div class="bsc-fill" style="width:${d.val}%;background:${persona.color}20;border-right:2px solid ${persona.color}"></div></div>
            <span class="bsc-dval">${d.val}</span>
          </div>`).join('')}
      </div>
    </div>`;
  }).join('');
}

function buildDecisionMemoFrontend(topic, transcriptArr, judgeRes, synthesis, runId) {
  const date = new Date().toISOString().split('T')[0];
  const sorted = judgeRes
    ? Object.entries(judgeRes).sort((a, b) => b[1].total - a[1].total)
    : [];

  const lines = [
    `# BotCast Arena · Decision Memo`,
    `**Run ID:** \`${runId}\` | **Date:** ${date} | **Entity:** Venture Vision / PlatFormula.ONE`,
    ``,
    `## Topic`,
    `> ${topic}`,
    ``,
    `## Executive Summary`,
    synthesis || '*Synthesis not generated.*',
    ``,
    `## Judge Rankings`,
    `| Rank | Agent | Score |`,
    `|------|-------|-------|`,
    ...sorted.map(([id, s], i) => `| #${i+1} | ${BOTCAST_PERSONAS[id]?.name || id} | ${s.total} |`),
    ``,
    `## Debate Transcript Summary`,
    `${transcriptArr.length} turns across ${DEBATE_STAGES.length} stages`,
    ``,
    `## Debate Graph`,
    DEBATE_STAGES.map(s => `- ${s.sequence}. **${s.label}**`).join('\n'),
    ``,
    `## TurnSignal Protocol`,
    `- Protocol: TurnSignal v1.0`,
    `- Channel: out-of-band metadata`,
    `- VAD bypass: active`,
    `- Total signals processed: ${turnQueue.history.length}`,
    ``,
    `---`,
    `*Generated by BotCast Arena · TALON Orchestration Mesh · PlatFormula.ONE*`,
  ];
  return lines.join('\n');
}

function renderDecisionMemo(memoText) {
  const el = document.getElementById('botcastMemo');
  if (!el) return;
  el.textContent = memoText;
}

function addBotcastLog(msg, type = 'info') {
  const el = document.getElementById('botcastLogBody');
  if (!el) return;
  const ts = new Date().toLocaleTimeString('en-US', { hour12: false });
  const div = document.createElement('div');
  div.className = `log-entry ${type}`;
  div.innerHTML = `<span class="log-ts">${ts}</span><span class="log-msg">${escapeHtml(msg)}</span>`;
  el.appendChild(div);
  el.scrollTop = el.scrollHeight;
}

async function typewriteToEl(elId, text, speed = 12) {
  const el = document.getElementById(elId);
  if (!el) return;
  el.textContent = '';
  const chars = text.split('');
  for (let i = 0; i < chars.length; i++) {
    el.textContent += chars[i];
    if (i % 10 === 0) await sleep(speed);
  }
}

// ── TOPIC PILL SELECTION ──────────────────────────────────────────────────
function setBotcastTopic(el) {
  const input = document.getElementById('botcastTopic');
  if (input) input.value = el.textContent;
}

// ── EXPORT HELPERS ────────────────────────────────────────────────────────
function exportTranscriptJSON() {
  const data = JSON.stringify({
    run_id: botcastRunId,
    topic: document.getElementById('botcastTopic')?.value || '',
    entries: transcript,
    generated_at: new Date().toISOString(),
  }, null, 2);
  downloadFile(`transcript_${botcastRunId}.json`, data, 'application/json');
}

function exportScorecardJSON() {
  if (!judgeResults) { showToast('Run a debate first', 'warning'); return; }
  const data = JSON.stringify({
    run_id: botcastRunId,
    scores: judgeResults,
    generated_at: new Date().toISOString(),
  }, null, 2);
  downloadFile(`scorecard_${botcastRunId}.json`, data, 'application/json');
}

function exportDecisionMemoMD() {
  const el = document.getElementById('botcastMemo');
  if (!el?.textContent) { showToast('Run a debate first', 'warning'); return; }
  downloadFile(`decision_memo_${botcastRunId}.md`, el.textContent, 'text/markdown');
}

function downloadFile(filename, content, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
  showToast(`${filename} downloaded`, 'success');
}

// ── ACTIVE PERSONA COUNT ──────────────────────────────────────────────────
function updateActivePersonaCount() {
  const checked = BOTCAST_DEBATING_IDS.filter(id => {
    const cb = document.getElementById(`persona-cb-${id}`);
    return cb?.checked;
  }).length;
  const el = document.getElementById('activePersonaCount');
  if (el) el.textContent = `${checked} active`;
}

// ── INIT ──────────────────────────────────────────────────────────────────
function initBotcast() {
  const btn = document.getElementById('startBotcast');
  if (btn) btn.addEventListener('click', startBotcast);

  // Render persona selector checkboxes
  const selectorEl = document.getElementById('personaSelector');
  if (selectorEl) {
    selectorEl.innerHTML = BOTCAST_DEBATING_IDS.map(id => {
      const p = BOTCAST_PERSONAS[id];
      return `<label class="persona-toggle" style="--pt-color:${p.color}">
        <input type="checkbox" id="persona-cb-${id}" checked onchange="updateActivePersonaCount()"/>
        <span class="pt-callsign">${p.callsign}</span>
        <span class="pt-name">${p.name}</span>
        <span class="pt-role">${p.role}</span>
      </label>`;
    }).join('');
  }

  updateActivePersonaCount();

  // Topic input Enter key
  const topicInput = document.getElementById('botcastTopic');
  if (topicInput) {
    topicInput.addEventListener('keydown', e => {
      if (e.ctrlKey && e.key === 'Enter') startBotcast();
    });
  }

  addBotcastLog('BotCast Arena initialized', 'success');
  addBotcastLog('TurnSignal Protocol v1.0 ready — VAD bypass active', 'info');
  addBotcastLog('Debate Graph: Opening→Rebuttal→Cross-Exam→Risk Discovery→Synthesis→Judge→Memo', 'info');
  addBotcastLog('Phase 1: cloud API providers active (no hardware required)', 'info');
}

window.startBotcast     = startBotcast;
window.setBotcastTopic  = setBotcastTopic;
window.exportTranscriptJSON = exportTranscriptJSON;
window.exportScorecardJSON  = exportScorecardJSON;
window.exportDecisionMemoMD = exportDecisionMemoMD;
window.updateActivePersonaCount = updateActivePersonaCount;
