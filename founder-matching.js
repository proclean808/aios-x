/* ═════════════════════════════════════
   AIOS-X · FoneClaw Swarm Orchestrator
   Founder–Accelerator Matching Engine
   PlatFormula.ONE — Deterministic Routing
═════════════════════════════════════ */

// ── SUB-AGENTS ──

const YC_AlignmentAgent = {
  name: 'YC_AlignmentAgent',
  label: 'YC Alignment',
  icon: 'fas fa-rocket',
  color: '#f97316',
  analyze(profile) {
    const tam_fit = profile.tam_size >= 1e9;
    const tech_fit = profile.technical_density_score >= 0.85;
    return {
      yc_signal: (tam_fit && tech_fit) ? 'HIGH' : 'LOW',
      confidence_weight: 0.92,
      tam_fit,
      tech_fit
    };
  }
};

const TractionVelocityAgent = {
  name: 'TractionVelocityAgent',
  label: 'Traction Velocity',
  icon: 'fas fa-chart-line',
  color: '#34d399',
  analyze(profile) {
    const velocity_score = profile.mrr > 10000 ? 'SCALING' : 'PRE-SEED';
    return {
      velocity_tier: velocity_score,
      mrr_baseline: profile.mrr
    };
  }
};

const SWARM = [YC_AlignmentAgent, TractionVelocityAgent];

// ── ORCHESTRATOR ──

const FoneClawOrchestrator = {
  executeMatch(profile) {
    const telemetry = {};
    for (const agent of SWARM) {
      telemetry[agent.name] = agent.analyze(profile);
    }

    const yc_signal = telemetry['YC_AlignmentAgent'].yc_signal;
    const velocity  = telemetry['TractionVelocityAgent'].velocity_tier;

    let target;
    if (yc_signal === 'HIGH' && velocity === 'SCALING') {
      target = 'Y Combinator (Core)';
    } else if (velocity === 'PRE-SEED') {
      target = 'Local Bay Area Pre-Seed Incubator';
    } else {
      target = 'Vertical-Specific Accelerator';
    }

    return {
      status: 'ORCHESTRATED',
      founder_id: profile.founder_id,
      target_accelerator: target,
      swarm_telemetry: telemetry
    };
  }
};

// ── TARGET METADATA ──

const TARGET_META = {
  'Y Combinator (Core)': {
    icon: 'fas fa-trophy',
    color: '#facc15',
    tier: 'TIER 1',
    desc: 'Top-tier global accelerator. $500K check, 7% equity. Batch cohort of ~200 startups.',
    tags: ['$500K', 'San Francisco', 'Global Network', 'Demo Day']
  },
  'Local Bay Area Pre-Seed Incubator': {
    icon: 'fas fa-seedling',
    color: '#34d399',
    tier: 'PRE-SEED',
    desc: 'Bay Area-localized early-stage support. Focus on MVPs, initial traction, and first hires.',
    tags: ['$50K–$150K', 'Bay Area', 'MVP Stage', 'Mentorship']
  },
  'Vertical-Specific Accelerator': {
    icon: 'fas fa-layer-group',
    color: '#a78bfa',
    tier: 'VERTICAL',
    desc: 'Deep-domain specialization aligned with your vertical. Industry network and go-to-market support.',
    tags: ['Vertical Focus', 'Domain Experts', 'GTM Support', 'Partners']
  }
};

// ── PRESET PROFILES ──

const PRESET_PROFILES = [
  {
    label: 'AI/DevTools Unicorn Track',
    founder_id: 'USR_992_ALPHA',
    tam_size: 5_000_000_000,
    mrr: 15000,
    vertical: 'AI/DevTools',
    technical_density_score: 0.91
  },
  {
    label: 'Early-Stage HealthTech',
    founder_id: 'USR_441_BETA',
    tam_size: 800_000_000,
    mrr: 4200,
    vertical: 'HealthTech',
    technical_density_score: 0.72
  },
  {
    label: 'FinTech Scale-Up',
    founder_id: 'USR_775_GAMMA',
    tam_size: 12_000_000_000,
    mrr: 28000,
    vertical: 'FinTech',
    technical_density_score: 0.79
  }
];

// ── STATE ──

let matchRunning = false;
let matchCount = 0;

// ── UI FUNCTIONS ──

function initFounderMatcher() {
  const btn = document.getElementById('runFounderMatch');
  if (btn) btn.addEventListener('click', runFounderMatch);

  const resetBtn = document.getElementById('resetFounderMatch');
  if (resetBtn) resetBtn.addEventListener('click', resetFounderMatch);

  const presets = document.querySelectorAll('.preset-pill');
  presets.forEach(p => p.addEventListener('click', () => loadPreset(p)));

  // Load first preset by default
  if (PRESET_PROFILES.length) loadPresetByIndex(0);

  addLog('fmLogBody', 'FoneClaw Swarm Orchestrator v1.0 initialized', 'success');
  addLog('fmLogBody', 'Sub-agents: YC_AlignmentAgent · TractionVelocityAgent', 'info');
  addLog('fmLogBody', 'Protocol: FinishLine deterministic routing · Bay Area-localized', 'info');
}

function loadPreset(el) {
  document.querySelectorAll('.preset-pill').forEach(p => p.classList.remove('active'));
  el.classList.add('active');
  const idx = parseInt(el.dataset.preset, 10);
  loadPresetByIndex(idx);
}

function loadPresetByIndex(idx) {
  const p = PRESET_PROFILES[idx];
  if (!p) return;
  const set = (id, val) => { const el = document.getElementById(id); if (el) el.value = val; };
  set('fm-founder-id', p.founder_id);
  set('fm-tam', p.tam_size);
  set('fm-mrr', p.mrr);
  set('fm-vertical', p.vertical);
  set('fm-tds', p.technical_density_score);
}

async function runFounderMatch() {
  if (matchRunning) {
    showToast('Match already running', 'warning');
    return;
  }

  // Read inputs
  const founder_id = document.getElementById('fm-founder-id')?.value.trim();
  const tam_size   = parseFloat(document.getElementById('fm-tam')?.value);
  const mrr        = parseFloat(document.getElementById('fm-mrr')?.value);
  const vertical   = document.getElementById('fm-vertical')?.value.trim();
  const tds        = parseFloat(document.getElementById('fm-tds')?.value);

  if (!founder_id || isNaN(tam_size) || isNaN(mrr) || !vertical || isNaN(tds)) {
    showToast('Fill in all founder profile fields', 'warning');
    return;
  }
  if (tds < 0 || tds > 1) {
    showToast('Technical density score must be 0.0–1.0', 'warning');
    return;
  }

  const profile = { founder_id, tam_size, mrr, vertical, technical_density_score: tds };

  matchRunning = true;
  matchCount++;

  const btn = document.getElementById('runFounderMatch');
  if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Orchestrating...'; }

  // Clear previous result
  const resultEl = document.getElementById('fmResult');
  if (resultEl) resultEl.classList.remove('show');
  resetSwarmCards();

  addLog('fmLogBody', `━━━ MATCH #${matchCount}: ${founder_id} ━━━`, 'highlight');
  addLog('fmLogBody', `Profile: TAM $${fmtNum(tam_size)} · MRR $${fmtNum(mrr)} · ${vertical} · TDS ${tds}`, 'info');

  // Animate swarm execution
  for (let i = 0; i < SWARM.length; i++) {
    const agent = SWARM[i];
    await sleep(400 + i * 350);
    setSwarmCardState(agent.name, 'running');
    addLog('fmLogBody', `Dispatching ${agent.name}...`, 'info');
    await sleep(500);
    const result = agent.analyze(profile);
    setSwarmCardResult(agent, result);
    addLog('fmLogBody', `${agent.name} complete: ${JSON.stringify(result).replace(/"/g,'')}`, 'success');
  }

  await sleep(400);

  // Run orchestrator
  const outcome = FoneClawOrchestrator.executeMatch(profile);
  addLog('fmLogBody', `FinishLine routing: yc_signal=${outcome.swarm_telemetry.YC_AlignmentAgent.yc_signal} velocity=${outcome.swarm_telemetry.TractionVelocityAgent.velocity_tier}`, 'info');
  addLog('fmLogBody', `TARGET: ${outcome.target_accelerator}`, 'highlight');
  addLog('fmLogBody', `Match #${matchCount} complete — status: ${outcome.status}`, 'success');

  // Render result
  renderMatchResult(outcome);
  if (typeof updateHeaderStats === 'function') updateHeaderStats(null, matchCount);

  if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fas fa-play"></i> Run FoneClaw Match'; }
  matchRunning = false;
  showToast(`Match #${matchCount}: ${outcome.target_accelerator}`, 'success');
}

function resetFounderMatch() {
  resetSwarmCards();
  const resultEl = document.getElementById('fmResult');
  if (resultEl) resultEl.classList.remove('show');
  addLog('fmLogBody', 'State reset.', 'info');
}

function resetSwarmCards() {
  SWARM.forEach(agent => setSwarmCardState(agent.name, 'idle'));
}

function setSwarmCardState(agentName, state) {
  const card = document.getElementById(`swarm-${agentName}`);
  if (!card) return;
  card.className = `swarm-agent-card state-${state}`;
  const statusEl = card.querySelector('.sac-status');
  if (statusEl) statusEl.textContent = state.toUpperCase();
  const telEl = card.querySelector('.sac-telemetry');
  if (telEl && state === 'idle') telEl.innerHTML = '<span class="sac-tel-empty">Awaiting dispatch...</span>';
}

function setSwarmCardResult(agent, result) {
  const card = document.getElementById(`swarm-${agent.name}`);
  if (!card) return;
  card.className = 'swarm-agent-card state-done';
  const statusEl = card.querySelector('.sac-status');
  if (statusEl) statusEl.textContent = 'DONE';

  const telEl = card.querySelector('.sac-telemetry');
  if (!telEl) return;

  if (agent.name === 'YC_AlignmentAgent') {
    const signalClass = result.yc_signal === 'HIGH' ? 'tel-high' : 'tel-low';
    telEl.innerHTML = `
      <div class="sac-tel-row"><span class="sac-tel-key">yc_signal</span><span class="sac-tel-val ${signalClass}">${result.yc_signal}</span></div>
      <div class="sac-tel-row"><span class="sac-tel-key">tam_fit</span><span class="sac-tel-val ${result.tam_fit ? 'tel-ok' : 'tel-no'}">${result.tam_fit}</span></div>
      <div class="sac-tel-row"><span class="sac-tel-key">tech_fit</span><span class="sac-tel-val ${result.tech_fit ? 'tel-ok' : 'tel-no'}">${result.tech_fit}</span></div>
      <div class="sac-tel-row"><span class="sac-tel-key">confidence</span><span class="sac-tel-val">${result.confidence_weight}</span></div>
    `;
  } else if (agent.name === 'TractionVelocityAgent') {
    const tierClass = result.velocity_tier === 'SCALING' ? 'tel-high' : 'tel-low';
    telEl.innerHTML = `
      <div class="sac-tel-row"><span class="sac-tel-key">velocity_tier</span><span class="sac-tel-val ${tierClass}">${result.velocity_tier}</span></div>
      <div class="sac-tel-row"><span class="sac-tel-key">mrr_baseline</span><span class="sac-tel-val">$${fmtNum(result.mrr_baseline)}</span></div>
    `;
  }
}

function renderMatchResult(outcome) {
  const meta = TARGET_META[outcome.target_accelerator] || {
    icon: 'fas fa-building', color: '#38bdf8', tier: 'MATCHED',
    desc: outcome.target_accelerator, tags: []
  };

  const resultEl = document.getElementById('fmResult');
  if (!resultEl) return;

  resultEl.style.setProperty('--result-color', meta.color);
  resultEl.querySelector('.fm-result-icon').innerHTML = `<i class="${meta.icon}"></i>`;
  resultEl.querySelector('.fm-result-tier').textContent = meta.tier;
  resultEl.querySelector('.fm-result-name').textContent = outcome.target_accelerator;
  resultEl.querySelector('.fm-result-desc').textContent = meta.desc;
  resultEl.querySelector('.fm-result-tags').innerHTML = meta.tags.map(t =>
    `<span class="fm-tag">${t}</span>`
  ).join('');
  resultEl.querySelector('.fm-result-id').textContent = `Founder: ${outcome.founder_id}`;
  resultEl.querySelector('.fm-result-status').textContent = outcome.status;

  resultEl.classList.add('show');
}

window.runFounderMatch    = runFounderMatch;
window.resetFounderMatch  = resetFounderMatch;
window.loadPreset         = loadPreset;
