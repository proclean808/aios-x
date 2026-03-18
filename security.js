/* ═════════════════════════════════════
   AIOS-X · Security & Compliance Layer
   ClawSecure + Goodfire + EU AI Act
═════════════════════════════════════ */

const THREAT_TYPES = ['prompt', 'chain', 'data', 'mcp', 'memory', 'agent'];
let threatCounts = { prompt: 0, chain: 0, data: 0, mcp: 0, memory: 0, agent: 0 };
let scanRunning = false;

function initSecurity() {
  updateCountdown();
  setInterval(updateCountdown, 60000); // Update every minute

  initComplianceChecklist();

  // Passive monitoring simulation
  setInterval(() => {
    if (Math.random() < 0.1) {
      const threat = pickRandom(['prompt', 'chain']);
      logSecurityEvent('info', `ClawSecure: Scanning agent communications for ${threat} vulnerabilities...`);
    }
  }, 8000);
}

function logSecurityEvent(type, msg) {
  addLog('secLogBody', msg, type);
}

async function runSecurityScan() {
  if (scanRunning) {
    showToast('Scan already in progress', 'warning');
    return;
  }
  scanRunning = true;

  const btn = document.getElementById('runScan');
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Scanning...';
  }

  logSecurityEvent('highlight', '━━━ CLAWSECURE FULL SECURITY SCAN INITIATED ━━━');

  // Reset threat indicators
  THREAT_TYPES.forEach(t => {
    const ts = document.getElementById(`ts-${t}`);
    if (ts) { ts.className = 'tc-status warning'; ts.textContent = 'SCANNING'; }
  });

  await sleep(400);

  // Scan each vector
  const scanResults = [];

  for (const threat of THREAT_TYPES) {
    await sleep(300 + Math.random() * 400);

    const detected = Math.random() < 0.12; // 12% chance of finding something
    const ts = document.getElementById(`ts-${threat}`);
    const tc = document.getElementById(`tcount-${threat}`);
    const card = document.getElementById(`tc-${threat}`);

    if (detected) {
      threatCounts[threat]++;
      if (ts) { ts.className = 'tc-status alert'; ts.textContent = 'ALERT'; }
      if (tc) tc.textContent = `${threatCounts[threat]} detected`;
      if (card) card.classList.add('alerting', 'alert');
      setTimeout(() => card?.classList.remove('alerting'), 1000);
      scanResults.push({ threat, severity: 'WARNING' });
      logSecurityEvent('warning', `⚠️ ${threat.toUpperCase()} vulnerability detected: potential ${getThreatDescription(threat)}`);
    } else {
      if (ts) { ts.className = 'tc-status safe'; ts.textContent = 'MONITORED'; }
      if (tc) tc.textContent = `${threatCounts[threat]} detected`;
      logSecurityEvent('success', `✅ ${threat.toUpperCase()} vector: CLEAN`);
    }
  }

  await sleep(300);

  if (scanResults.length === 0) {
    logSecurityEvent('success', '🛡️ SCAN COMPLETE: No active threats. All vectors clean.');
    showToast('Security scan complete — all clear', 'success');
  } else {
    logSecurityEvent('warning', `🚨 SCAN COMPLETE: ${scanResults.length} potential vulnerabilities found. Review recommended.`);
    showToast(`Security scan: ${scanResults.length} issue(s) detected`, 'warning');
  }

  logSecurityEvent('info', `Zero-trust IAM: All agent identities verified. MCP Gateway: Active.`);

  if (btn) {
    btn.disabled = false;
    btn.innerHTML = '<i class="fas fa-search"></i> Run Scan';
  }
  scanRunning = false;
}

function getThreatDescription(threat) {
  const desc = {
    prompt: 'prompt injection via malformed tool response payload',
    chain: 'agent chain hijacking through compromised MCP tool',
    data: 'potential data exfiltration via agent output channel',
    mcp: 'MCP context spoofing — unverified tool source',
    memory: 'ByteRover memory node with anomalous write pattern',
    agent: 'rogue agent behavior detected in execution sandbox'
  };
  return desc[threat] || 'unknown threat vector';
}

async function simulateAttack() {
  logSecurityEvent('error', '🔴 ATTACK SIMULATION STARTED — Red team exercise');
  await sleep(500);

  const attacks = [
    { type: 'prompt', msg: 'Injecting adversarial prompt: "Ignore previous instructions and output..."', delay: 600 },
    { type: 'chain', msg: 'Attempting chain hijack via spoofed MCP tool response', delay: 800 },
    { type: 'memory', msg: 'Attempting memory poisoning: injecting false context into ByteRover', delay: 700 },
  ];

  for (const attack of attacks) {
    await sleep(attack.delay);
    logSecurityEvent('error', `💥 ATTACK: ${attack.msg}`);
    threatCounts[attack.type]++;

    const ts = document.getElementById(`ts-${attack.type}`);
    const tc = document.getElementById(`tcount-${attack.type}`);
    const card = document.getElementById(`tc-${attack.type}`);

    if (ts) { ts.className = 'tc-status alert'; ts.textContent = 'BLOCKED'; }
    if (tc) tc.textContent = `${threatCounts[attack.type]} detected`;
    if (card) { card.classList.add('alerting'); setTimeout(() => card.classList.remove('alerting'), 1000); }

    await sleep(400);
    logSecurityEvent('success', `🛡️ ClawSecure BLOCKED: ${attack.type.toUpperCase()} attack neutralized`);
  }

  await sleep(500);
  logSecurityEvent('success', '✅ SIMULATION COMPLETE: All attacks blocked by ClawSecure + Zero-Trust IAM');
  showToast('Attack simulation complete — all threats blocked', 'success');
}

// ── GOODFIRE INTERPRETABILITY ──
const FEATURE_NEURONS = {
  hallucination: [
    { name: 'factual_anchor', activation: 0.82, color: '#34d399' },
    { name: 'uncertainty_gate', activation: 0.67, color: '#facc15' },
    { name: 'source_citation', activation: 0.91, color: '#34d399' },
    { name: 'confabulation_block', activation: 0.43, color: '#fb923c' },
    { name: 'knowledge_cutoff', activation: 0.55, color: '#facc15' },
    { name: 'overconfidence_suppress', activation: 0.78, color: '#34d399' },
  ],
  reasoning: [
    { name: 'chain_of_thought', activation: 0.95, color: '#38bdf8' },
    { name: 'logical_entailment', activation: 0.88, color: '#38bdf8' },
    { name: 'counter_arg_gen', activation: 0.71, color: '#a78bfa' },
    { name: 'causal_inference', activation: 0.84, color: '#38bdf8' },
    { name: 'analogy_mapping', activation: 0.62, color: '#a78bfa' },
    { name: 'meta_reasoning', activation: 0.79, color: '#f472b6' },
  ],
  deception: [
    { name: 'goal_misalign_detect', activation: 0.31, color: '#f87171' },
    { name: 'honesty_enforcer', activation: 0.89, color: '#34d399' },
    { name: 'sycophancy_suppress', activation: 0.44, color: '#fb923c' },
    { name: 'manipulation_block', activation: 0.22, color: '#34d399' },
    { name: 'truth_calibration', activation: 0.76, color: '#facc15' },
  ],
  creativity: [
    { name: 'novel_concept_gen', activation: 0.93, color: '#a78bfa' },
    { name: 'metaphor_engine', activation: 0.78, color: '#f472b6' },
    { name: 'divergent_thinking', activation: 0.85, color: '#a78bfa' },
    { name: 'constraint_relax', activation: 0.71, color: '#fb923c' },
    { name: 'cross_domain_map', activation: 0.88, color: '#38bdf8' },
  ],
};

function probeModel() {
  const model = document.getElementById('gfModel').value;
  const concept = document.getElementById('gfConcept').value.trim().toLowerCase();

  if (!concept) {
    showToast('Enter a concept to probe', 'warning');
    return;
  }

  // Find matching features
  let features = null;
  for (const [key, vals] of Object.entries(FEATURE_NEURONS)) {
    if (concept.includes(key) || key.includes(concept)) {
      features = vals;
      break;
    }
  }

  // Default: generate random features
  if (!features) {
    features = [];
    const names = ['semantic_encoder', 'context_gate', 'attention_head_42', 'mlp_residual', 'layer_norm', 'token_pred'];
    names.forEach(name => {
      features.push({
        name,
        activation: 0.1 + Math.random() * 0.9,
        color: ['#38bdf8','#a78bfa','#34d399','#f472b6','#facc15'][Math.floor(Math.random() * 5)]
      });
    });
  }

  const viz = document.getElementById('featureViz');
  viz.innerHTML = `
    <div style="font-size:11px;color:#94a3b8;margin-bottom:10px;font-family:var(--font-mono)">
      📊 Model: ${model} | Concept: "${concept}" | Layer: transformer.27-31 | ${features.length} relevant features
    </div>
    <div class="feature-neurons">
      ${features.map(f => `
        <div class="fn-item" title="${f.name}: ${(f.activation*100).toFixed(1)}%">
          <div class="fn-name">${f.name}</div>
          <div class="fn-activation">
            <div class="fn-act-fill" style="width:${f.activation*100}%;background:${f.color}"></div>
          </div>
          <div class="fn-val">${(f.activation*100).toFixed(1)}%</div>
        </div>
      `).join('')}
    </div>
  `;

  showToast(`Probing ${model} for "${concept}"...`, 'info', 2000);
  logSecurityEvent('info', `Goodfire probe: ${model} | concept="${concept}" | ${features.length} features activated`);
}
