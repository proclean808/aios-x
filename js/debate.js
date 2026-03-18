/* ═════════════════════════════════════
   AIOS-X · Multi-Model Debate Engine
   Live API + deterministic simulation
   All flagship models supported
═════════════════════════════════════ */
'use strict';

let debateState = {
  running: false,
  round: 0,
  maxRounds: 3,
  topic: '',
  participants: [],
  messages: [],
  scores: {},
  winner: null,
};

// ── DEBATE KNOWLEDGE BASE ──
const DEBATE_KB = {
  agentic_dominance: {
    title: 'Agentic AI as Dominant Paradigm in 2026',
    positions: {
      'claude-opus-4-6':    { stance: 'Strongly For', color: '#c084fc' },
      'claude-sonnet-4-6':  { stance: 'For', color: '#a855f7' },
      'gpt-4.5-turbo':      { stance: 'For with caveats', color: '#34d399' },
      'gpt-4o':             { stance: 'For with caveats', color: '#10b981' },
      'o3':                 { stance: 'Strongly For', color: '#6ee7b7' },
      'gemini-2.5-pro':     { stance: 'Strongly For', color: '#38bdf8' },
      'gemini-2.0-flash':   { stance: 'For', color: '#0ea5e9' },
      'grok-3':             { stance: 'Strongly For', color: '#94a3b8' },
      'grok-2':             { stance: 'For', color: '#64748b' },
      'llama3:70b':         { stance: 'Skeptical', color: '#fb923c' },
      'deepseek-v3':        { stance: 'For', color: '#818cf8' },
      'mistral-large':      { stance: 'For with caveats', color: '#f87171' },
    },
    arguments: {
      for: [
        'Agentic AI has emerged as the dominant paradigm — 73% of enterprise AI deployments now involve autonomous agents per Gartner 2026',
        '$189B VC funding in Feb 2026 with 90% directed toward agentic AI systems proves market conviction at unprecedented scale',
        'MCP Protocol with 82.7K GitHub stars and Linux Foundation backing shows the ecosystem is maturing rapidly for agent orchestration',
        'Specialized vertical agents (Harvey for law, medical diagnostic agents) generate 10-100× ROI vs generic AI applications',
        'OpenAI\'s $110B valuation and Cursor\'s $1B ARR demonstrate that agentic AI tools create winner-take-most market dynamics',
      ],
      against: [
        'Reliability and hallucination rates remain critical blockers — 23% failure rate in production agentic workflows per internal data',
        'Regulatory uncertainty with EU AI Act full applicability August 2026 creates significant compliance risk for autonomous systems',
        'Single-model "Agent-as-a-Service" threatens to commoditize middleware orchestration before it reaches maturity',
        'Infrastructure cost explosion: $650-700B CapEx requirement in 2026 is unsustainable without clear monetization pathways',
        'Context window limitations and memory coherence remain unsolved for truly long-horizon agentic tasks',
      ],
    }
  },
  mcp_protocol: {
    title: 'MCP Protocol vs Custom APIs',
    positions: { 'claude-opus-4-6': { stance: 'Pro-MCP', color: '#c084fc' }, 'gpt-4o': { stance: 'Against-MCP', color: '#34d399' }, 'gemini-2.0-flash': { stance: 'Neutral', color: '#38bdf8' }, 'grok-2': { stance: 'Skeptical', color: '#94a3b8' } },
    arguments: {
      for: ['MCP standardizes tool interfaces, reducing integration time by 70%', 'Linux Foundation governance ensures long-term stability', '82.7K GitHub stars signals strong developer adoption velocity'],
      against: ['Custom APIs allow finer control and optimization not possible with generic MCP', 'Protocol overhead adds latency in high-frequency agentic loops', 'Vendor lock-in risk as major providers shape the standard'],
    }
  },
  open_vs_closed: {
    title: 'Open vs Closed Source AI Models',
    positions: { 'claude-opus-4-6': { stance: 'Pro-Closed', color: '#c084fc' }, 'llama3:70b': { stance: 'Pro-Open', color: '#fb923c' }, 'gpt-4o': { stance: 'Pro-Closed', color: '#34d399' }, 'deepseek-v3': { stance: 'Pro-Open', color: '#818cf8' } },
    arguments: {
      for: ['Closed: RLHF and safety alignment requires full model control', 'Open: DeepSeek V3 at $5.5M training shows efficiency democratizes frontier AI', 'Closed: Enterprise liability requires certified, auditable models'],
      against: ['Open: Llama 3 70B matches or beats earlier GPT-4 on most benchmarks at zero API cost', 'Closed: Opacity creates systemic risk when models fail in high-stakes domains', 'Open: Community-driven safety research outpaces closed red-teaming'],
    }
  },
  ai_regulation: {
    title: 'EU AI Act: Enabler or Inhibitor?',
    positions: { 'claude-opus-4-6': { stance: 'Cautiously For', color: '#c084fc' }, 'gpt-4o': { stance: 'Against', color: '#34d399' }, 'grok-2': { stance: 'Strongly Against', color: '#94a3b8' }, 'mistral-large': { stance: 'For', color: '#f87171' } },
    arguments: {
      for: ['Regulatory clarity enables enterprise adoption of AI at scale with reduced legal risk', 'Mandatory transparency requirements improve public trust in AI systems', 'EU harmonization creates global baseline standards benefiting all markets'],
      against: ['Compliance burden favors large incumbents, crushing European AI startups', 'August 2026 deadline is technically impossible for most organizations', 'Over-regulation drives AI talent and investment to less-regulated jurisdictions'],
    }
  },
  world_models: {
    title: 'World Models vs LLM Scaling',
    positions: { 'claude-opus-4-6': { stance: 'LLM Scaling', color: '#c084fc' }, 'gpt-4o': { stance: 'LLM Scaling', color: '#34d399' }, 'gemini-2.5-pro': { stance: 'Both', color: '#38bdf8' }, 'grok-3': { stance: 'World Models', color: '#94a3b8' } },
    arguments: {
      for: ['AMI Labs $1.03B seed round proves market believes JEPA-style world models unlock true reasoning', 'Physical world understanding requires embodied learning, not token prediction at scale', 'World models generalize to novel domains; LLMs memorize training distribution'],
      against: ['GPT/Claude scaling continues to show emergent reasoning capabilities at each order of magnitude', 'World models require data and compute orders of magnitude beyond current capabilities', 'Practical AI needs, particularly text and code, are served excellently by LLM scaling'],
    }
  },
};

// ── START DEBATE ──
async function startDebate() {
  if (debateState.running) { showToast('Debate already in progress', 'warning'); return; }

  const topicKey = document.getElementById('debateTopic')?.value;
  const customTopic = document.getElementById('customTopicInput')?.value?.trim();
  const rounds = parseInt(document.getElementById('debateRounds')?.value || 3);
  const activeModels = getActiveDebateModels();

  if (activeModels.length < 2) { showToast('Select at least 2 models to debate', 'warning'); return; }

  const kb = topicKey !== 'custom' ? DEBATE_KB[topicKey] : null;
  const topic = kb?.title || customTopic || 'General AI Discussion';

  debateState = {
    running: true, round: 0, maxRounds: rounds,
    topic, participants: activeModels,
    messages: [], scores: {}, winner: null,
  };

  activeModels.forEach(m => { debateState.scores[m.id] = 0; });

  updateDebateKpis();
  clearDebateUI();
  renderDebateModelCards(activeModels);

  document.getElementById('debateSynthesis').style.display = 'none';
  document.getElementById('startDebate').disabled = true;

  addRoundHeader(0, 'Debate initialized');

  // Determine if live or simulated
  const liveModels = activeModels.filter(m => hasKey(m.provider));
  const isLive = liveModels.length > 0;

  if (isLive) {
    await runLiveDebate(topic, activeModels, kb, rounds);
  } else {
    await runSimulatedDebate(topic, activeModels, kb, rounds);
  }

  declareWinner();
  debateState.running = false;
  document.getElementById('startDebate').disabled = false;
  showToast('Debate complete!', 'success');
  speak(`Debate complete. ${debateState.winner?.id || 'Unknown'} is the winner.`);
}

// ── LIVE DEBATE ──
async function runLiveDebate(topic, models, kb, rounds) {
  const debateHistory = [];
  const systemBase = `You are participating in a structured AI debate about: "${topic}".
Provide a compelling, well-reasoned argument. Be analytical and cite relevant evidence.
Keep your response to 3-4 concise paragraphs. March 2026 context applies.`;

  for (let r = 1; r <= rounds; r++) {
    debateState.round = r;
    updateDebateKpis();
    addRoundHeader(r, `Round ${r} of ${rounds}`);

    for (const participant of models) {
      if (!hasKey(participant.provider)) {
        // Fall back to simulation for this model
        const simArg = generateSimArgument(topic, participant.id, kb, r);
        addDebateMessage(participant.id, participant.provider, simArg, r, '[SIM]');
        scoreRound(participant.id, simArg);
        await sleep(300);
        continue;
      }

      try {
        const historyContext = debateHistory.slice(-4).map(h =>
          `${h.model}: "${h.text.slice(0, 200)}"`
        ).join('\n');

        const prompt = r === 1
          ? `State your position on: "${topic}". Be direct and evidence-based.`
          : `Respond to previous arguments:\n${historyContext}\n\nReinforce your position or acknowledge strong counterpoints.`;

        const response = await callModel(participant.provider, participant.id,
          [{ role: 'user', content: prompt }],
          { system: systemBase, maxTokens: 400, temperature: 0.8 }
        );

        debateHistory.push({ model: participant.id, text: response });
        addDebateMessage(participant.id, participant.provider, response, r, '[LIVE]');
        scoreRound(participant.id, response);

      } catch (err) {
        addDebateMessage(participant.id, participant.provider,
          `[Error: ${err.message}] — Falling back to simulation.`, r, '[ERR]');
        const simArg = generateSimArgument(topic, participant.id, kb, r);
        addDebateMessage(participant.id, participant.provider, simArg, r, '[SIM]');
        scoreRound(participant.id, simArg);
      }

      await sleep(400);
    }

    await sleep(300);
  }

  await synthesizeDebate(topic, debateHistory, models);
}

// ── SIMULATED DEBATE ──
async function runSimulatedDebate(topic, models, kb, rounds) {
  addRoundHeader(0, '⚠ No API keys — running simulation. Add keys in Vault for live debate.');

  for (let r = 1; r <= rounds; r++) {
    debateState.round = r;
    updateDebateKpis();
    addRoundHeader(r, `Round ${r} of ${rounds}`);

    for (const participant of models) {
      await sleep(500 + Math.random() * 300);
      const arg = generateSimArgument(topic, participant.id, kb, r);
      addDebateMessage(participant.id, participant.provider, arg, r, '[SIM]');
      scoreRound(participant.id, arg);
    }
  }

  // Synthesis
  await sleep(600);
  showSynthesis(topic, models);
}

// ── GENERATE SIMULATED ARGUMENT ──
function generateSimArgument(topic, modelId, kb, round) {
  if (!kb) {
    const generic = [
      `This debate touches on fundamental questions about ${topic}. From my analysis, the data suggests a nuanced position that balances innovation with responsibility.`,
      `Building on previous arguments, I would emphasize that ${topic} requires careful consideration of both technical feasibility and societal impact.`,
      `My final position on ${topic}: the evidence overwhelmingly supports a structured approach that prioritizes measurable outcomes over theoretical frameworks.`,
    ];
    return generic[Math.min(round - 1, generic.length - 1)];
  }

  const position = kb.positions[modelId];
  const isFor = position?.stance?.toLowerCase().includes('for') ||
                position?.stance?.toLowerCase().includes('pro') ||
                position?.stance?.toLowerCase().includes('strongly');

  const pool = isFor ? kb.arguments.for : kb.arguments.against;
  const idx = (MODEL_REGISTRY?.findIndex(m => m.id === modelId) || 0 + round) % pool.length;
  const base = pool[idx] || pool[0];

  const roundPrefixes = [
    'Opening position: ',
    `Responding to counterarguments — `,
    'Final synthesis: ',
  ];

  return (roundPrefixes[round - 1] || '') + base +
    ` [Stance: ${position?.stance || 'Neutral'} | Confidence: ${75 + round * 3}%]`;
}

// ── SCORE ROUND ──
function scoreRound(modelId, text) {
  // Rubric AI scoring (heuristic): length, specificity, data references
  const score = Math.min(100, Math.round(
    (text.length / 8) +
    (text.match(/\d+/g)?.length || 0) * 3 +
    (text.match(/because|therefore|evidence|data|study|research/gi)?.length || 0) * 4 +
    Math.random() * 10
  ));

  debateState.scores[modelId] = (debateState.scores[modelId] || 0) + score;
  updateModelCardScore(modelId);
}

// ── ADD DEBATE MESSAGE ──
function addDebateMessage(modelId, provider, text, round, tag) {
  const flow = document.getElementById('debateFlow');
  if (!flow) return;

  const model = typeof MODEL_REGISTRY !== 'undefined' ? MODEL_REGISTRY.find(m => m.id === modelId) : null;
  const color = model?.color || PROVIDER_COLORS?.[provider] || '#38bdf8';
  const icon = model?.icon || '🤖';

  const msg = document.createElement('div');
  msg.className = 'debate-message model-response';
  msg.style.setProperty('--model-color', color);

  msg.innerHTML = `
    <div class="dm-header">
      <span class="dm-model">${icon} ${modelId}</span>
      <span class="dm-stance">${tag}</span>
      <span class="dm-time">R${round} · ${new Date().toLocaleTimeString()}</span>
    </div>
    <div class="dm-text">${escapeHtml(text)}</div>
  `;

  flow.appendChild(msg);
  flow.scrollTop = flow.scrollHeight;

  // Record for export
  debateState.messages.push({ model: modelId, text, round, tag, ts: new Date().toISOString() });
}

// ── ADD ROUND HEADER ──
function addRoundHeader(round, label) {
  const flow = document.getElementById('debateFlow');
  if (!flow) return;
  const h = document.createElement('div');
  h.className = 'debate-round-header';
  const roundColors = ['#475569','#38bdf8','#818cf8','#34d399','#fb923c','#f472b6','#facc15'];
  h.innerHTML = `<span style="color:${roundColors[round % roundColors.length]}">●</span> ${label}`;
  flow.appendChild(h);
}

// ── RENDER MODEL CARDS ──
function renderDebateModelCards(models) {
  const row = document.getElementById('debateModelsRow');
  if (!row) return;
  row.innerHTML = '';

  models.forEach(participant => {
    const model = typeof MODEL_REGISTRY !== 'undefined' ? MODEL_REGISTRY.find(m => m.id === participant.id) : null;
    const color = model?.color || '#38bdf8';
    const icon = model?.icon || '🤖';
    const name = model?.name || participant.id;

    const card = document.createElement('div');
    card.className = 'debate-model-card';
    card.id = 'dmc_' + participant.id.replace(/[:.]/g, '_');
    card.innerHTML = `
      <div class="dmc-header">
        <div class="dmc-icon">${icon}</div>
        <div>
          <div class="dmc-name" style="color:${color}">${name}</div>
          <div class="dmc-provider">${participant.provider} ${hasKey(participant.provider) ? '● Live' : '○ Sim'}</div>
        </div>
      </div>
      <div class="dmc-score-label">Rubric Score</div>
      <div class="dmc-score-bar-wrap"><div class="dmc-score-bar" id="dmcBar_${participant.id.replace(/[:.]/g,'_')}" style="width:0%;background:${color}"></div></div>
      <div class="dmc-score-value" id="dmcScore_${participant.id.replace(/[:.]/g,'_')}">0</div>
    `;
    row.appendChild(card);
  });
}

function updateModelCardScore(modelId) {
  const safeId = modelId.replace(/[:.]/g, '_');
  const score = debateState.scores[modelId] || 0;
  const maxScore = Math.max(...Object.values(debateState.scores)) || 1;
  const pct = Math.round((score / maxScore) * 100);

  const bar = document.getElementById('dmcBar_' + safeId);
  const scoreEl = document.getElementById('dmcScore_' + safeId);
  if (bar) bar.style.width = pct + '%';
  if (scoreEl) scoreEl.textContent = score;
}

// ── DECLARE WINNER ──
function declareWinner() {
  const entries = Object.entries(debateState.scores);
  if (!entries.length) return;

  entries.sort((a, b) => b[1] - a[1]);
  const [winnerId, winnerScore] = entries[0];
  debateState.winner = { id: winnerId, score: winnerScore };

  const safeId = winnerId.replace(/[:.]/g, '_');
  const card = document.getElementById('dmc_' + safeId);
  if (card) card.classList.add('winner');

  showSynthesis(debateState.topic, debateState.participants);
}

// ── SHOW SYNTHESIS ──
async function showSynthesis(topic, models) {
  const synthSection = document.getElementById('debateSynthesis');
  const synthContent = document.getElementById('synthesisContent');
  if (!synthSection || !synthContent) return;

  const sortedScores = Object.entries(debateState.scores).sort((a, b) => b[1] - a[1]);
  const winner = sortedScores[0];
  const loser = sortedScores[sortedScores.length - 1];

  // Try live synthesis with best available model
  let synthesisText = '';
  const bestLive = models.find(m => hasKey(m.provider));

  if (bestLive) {
    try {
      const messages = debateState.messages.slice(-8).map(m =>
        `${m.model}: ${m.text.slice(0, 150)}`
      ).join('\n\n');

      synthesisText = await callModel(bestLive.provider, bestLive.id, [
        { role: 'user', content: `Synthesize this debate about "${topic}" and identify key consensus points and unresolved tensions:\n\n${messages}` }
      ], { system: 'You are Rubric AI, a debate synthesis and scoring system. Provide concise, balanced analysis.', maxTokens: 400, temperature: 0.5 });
    } catch (e) {
      synthesisText = generateSimSynthesis(topic, sortedScores);
    }
  } else {
    synthesisText = generateSimSynthesis(topic, sortedScores);
  }

  synthContent.innerHTML = `
    <div style="margin-bottom:12px">
      <div style="font-size:11px;color:var(--text-muted);margin-bottom:6px">RUBRIC AI VERDICT</div>
      <div style="font-size:14px;line-height:1.7;color:var(--text-secondary)">${escapeHtml(synthesisText)}</div>
    </div>
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:8px;margin-top:16px">
      ${sortedScores.map(([id, score], i) => {
        const model = typeof MODEL_REGISTRY !== 'undefined' ? MODEL_REGISTRY.find(m => m.id === id) : null;
        return `<div style="background:var(--bg-surface);border:1px solid var(--border);border-radius:6px;padding:8px;text-align:center">
          <div style="font-size:16px">${i === 0 ? '🏆' : i === 1 ? '🥈' : '🥉'}</div>
          <div style="font-size:11px;font-weight:700;color:${model?.color||'#38bdf8'}">${model?.name || id}</div>
          <div style="font-size:20px;font-weight:800;color:var(--text-primary)">${score}</div>
          <div style="font-size:9px;color:var(--text-muted)">Rubric Score</div>
        </div>`;
      }).join('')}
    </div>
  `;

  synthSection.style.display = 'block';
  synthSection.scrollIntoView({ behavior: 'smooth' });
}

function generateSimSynthesis(topic, sortedScores) {
  const winner = sortedScores[0];
  return `After ${debateState.maxRounds} rounds of structured debate on "${topic}", Rubric AI determines that ${winner[0]} presented the most compelling and evidence-backed arguments with a score of ${winner[1]}. Key consensus areas emerged around the need for balanced deployment strategies, while significant tension remains regarding regulatory timelines and cost sustainability. The debate reveals that while the theoretical framework is sound, practical implementation challenges require further research and iterative deployment.`;
}

// ── RESET ──
function resetDebate() {
  debateState = { running: false, round: 0, maxRounds: 3, topic: '', participants: [], messages: [], scores: {}, winner: null };
  clearDebateUI();
  document.getElementById('debateSynthesis').style.display = 'none';
  updateDebateKpis();
}

function clearDebateUI() {
  const flow = document.getElementById('debateFlow');
  const row = document.getElementById('debateModelsRow');
  if (flow) flow.innerHTML = '';
  if (row) row.innerHTML = '';
}

function updateDebateKpis() {
  const roundChip = document.getElementById('debateRoundChip');
  const statusChip = document.getElementById('debateStatusChip');
  if (roundChip) roundChip.textContent = `Round ${debateState.round}/${debateState.maxRounds}`;
  if (statusChip) statusChip.textContent = debateState.running ? '⚡ Running' : debateState.winner ? '✓ Complete' : 'Idle';
}

window.startDebate = startDebate;
window.resetDebate = resetDebate;
window.exportDebate = exportDebate || function() { showToast('Export module not loaded', 'warning'); };
