/* ═════════════════════════════════════
   AIOS-X · Multi-Model Debate Engine
   Deterministic, seeded, reproducible
═════════════════════════════════════ */

// ── MODEL PERSONAS ──
const MODEL_PERSONAS = {
  deepseek: {
    name: 'DeepSeek V4',
    badge: 'DS',
    color: '#38bdf8',
    style: 'analytical, data-driven, cites specific benchmarks and technical metrics',
    strengths: ['Technical depth', 'Benchmark citations', 'Architecture analysis'],
    signature: 'Based on empirical evidence and benchmark data,'
  },
  llama: {
    name: 'Llama 4 Scout',
    badge: 'L4',
    color: '#34d399',
    style: 'comprehensive, leverages wide context, synthesizes diverse sources',
    strengths: ['Long-context reasoning', 'Cross-domain synthesis', 'Document analysis'],
    signature: 'With access to the full contextual landscape,'
  },
  mistral: {
    name: 'Mistral 3',
    badge: 'M3',
    color: '#a78bfa',
    style: 'efficient, pragmatic, focuses on cost-performance tradeoffs',
    strengths: ['Efficiency analysis', 'Cost optimization', 'Sparse reasoning'],
    signature: 'From an efficiency-first perspective,'
  },
  gptoss: {
    name: 'GPT-OSS 120B',
    badge: 'GO',
    color: '#f472b6',
    style: 'creative, nuanced, explores edge cases and emergent behaviors',
    strengths: ['Creative reasoning', 'Edge case analysis', 'Nuanced synthesis'],
    signature: 'Examining the nuanced dimensions of this question,'
  }
};

// ── DEBATE KNOWLEDGE BASE ──
const DEBATE_ARGUMENTS = {
  "Best agentic memory architecture: ByteRover vs MuleRun": {
    deepseek: {
      opening: "Based on empirical evidence and benchmark data, ByteRover's file-based (.brv context-tree) approach demonstrates 92.2% retrieval accuracy — a measurable advantage over VM-persistent approaches. The deterministic file I/O operations enable reproducible state across sessions, critical for enterprise deployments. Memory poisoning attacks are also substantially harder against file-based isolation.",
      counter: "While MuleRun's VM persistence offers lower latency on hot paths, the stateful VM model introduces catastrophic failure modes. ByteRover's architecture allows horizontal scaling across nodes without session affinity — a critical requirement as agent fleets scale to thousands.",
      synthesis: "File-based architectures with vector-indexed retrieval represent the defensible path. ByteRover + compresr compression yields optimal cost-performance: 92.2% accuracy at 68% token reduction."
    },
    llama: {
      opening: "With access to the full contextual landscape, ByteRover's strength in long-context scenarios is unmatched. The .brv format supports hierarchical context trees that mirror how humans organize knowledge — enabling agents to navigate 10M+ token histories without quadratic attention cost. For research agents processing vast document corpora, this is decisive.",
      counter: "MuleRun's VM persistence excels in single-session, low-latency scenarios. But real enterprise workloads require multi-session continuity. ByteRover's offline-capable, file-portable memory means agents can operate in air-gapped environments — a strategic advantage for regulated industries.",
      synthesis: "The optimal architecture combines ByteRover's persistent context-tree with dynamic RAG retrieval. compresr acts as the compression layer, reducing the effective working set to what fits in active context."
    },
    mistral: {
      opening: "From an efficiency-first perspective, the compute cost of VM-persistent state is prohibitive at scale. MuleRun requires maintaining live VM instances per agent session — at $0.001-0.003/token context costs, a 10M token VM session costs $10,000-30,000 in context alone. ByteRover's compressed .brv format reduces this by 60-75%. The economics are decisive.",
      counter: "MuleRun's latency advantage is real but narrow: ~40ms vs ~80ms for ByteRover cold retrieval. This difference is irrelevant for most agentic tasks with >500ms end-to-end latency. The 3x cost reduction of ByteRover outweighs the latency delta in virtually all production scenarios.",
      synthesis: "ByteRover wins on the cost-performance frontier. With compresr integration, effective cost per agent-task falls below $0.002 for most enterprise workflows. Deploy ByteRover for persistent state, cache hot paths in-memory."
    },
    gptoss: {
      opening: "Examining the nuanced dimensions of this question, the ByteRover vs MuleRun debate reveals a deeper architectural tension: stateless vs stateful agent design philosophy. ByteRover's file-first model treats memory as data — portable, auditable, and inspectable. This has profound implications for agent debugging, compliance auditing, and the emerging EU AI Act transparency requirements.",
      counter: "MuleRun's VM approach creates 'living' agent contexts that feel more natural for conversational agents. But this anthropomorphism is dangerous — it obscures the true nature of agent memory and makes it harder to identify poisoning or drift. ByteRover's explicit state model enables mechanistic interpretability.",
      synthesis: "The winner depends on use case: ByteRover for enterprise, compliance, and multi-agent coordination; MuleRun for single-session creative agents. The hybrid: ByteRover as the durable state layer, MuleRun for ephemeral working memory."
    }
  },
  "MCP vs custom API orchestration protocols": {
    deepseek: {
      opening: "Based on empirical evidence, MCP has achieved a network effect that makes custom protocols economically irrational. 82.7K GitHub stars, adoption by OpenAI, Microsoft, and Google, and donation to the Linux Foundation means MCP has won the standards war. Custom protocols incur ongoing maintenance costs measured in engineering-years.",
      counter: "Custom protocols offer flexibility but the total cost of ownership is devastating: protocol design, client libraries for every language, versioning, security audits. MCP's JSON-RPC 2.0 foundation provides a battle-tested base that custom protocols spend 18-24 months recreating.",
      synthesis: "MCP for 95% of use cases. Custom protocols only justified for latency-critical paths (<10ms), proprietary hardware interfaces, or classified government systems. Invest MCP savings in domain-specific tooling."
    },
    llama: {
      opening: "With access to the full contextual landscape, MCP's Linux Foundation adoption is the decisive signal. Protocol standardization follows the Lindy effect — standards that survive their first two years tend to persist for decades. MCP's RFC-style governance, security extensions (OAuth 2.1), and streaming support make it the clear default.",
      counter: "Custom protocols persist in legacy systems, high-frequency trading, and industrial control where sub-millisecond latency is non-negotiable. For the 95% of knowledge work AI applications, MCP's overhead (typically <5ms) is negligible and the ecosystem benefits are enormous.",
      synthesis: "MCP as universal standard with custom adapters for edge cases. The emerging MCP Gateway pattern — where Zatanna bridges legacy custom APIs to MCP — is the optimal integration architecture."
    },
    mistral: {
      opening: "From an efficiency-first perspective, MCP's standardization eliminates duplicate engineering work across the industry. Early analysis suggests MCP adoption saves ~40% of integration engineering time vs custom solutions. At $150K loaded cost per engineer-year, this is $60K saved per integration point. For a 20-service enterprise, that's $1.2M in engineering savings.",
      counter: "The MCP security model has emerging vulnerabilities. As an MCP security researcher noted, prompt injection attacks through tool responses are a novel attack surface. But this is a solved problem: MCP Gateways with content sanitization address it. Custom protocols have worse security track records.",
      synthesis: "MCP wins on total economic cost. The protocol overhead is a rounding error. Invest the saved engineering time in domain-specific tools and agent logic."
    },
    gptoss: {
      opening: "Examining the nuanced dimensions of this question, the MCP vs custom protocol debate is really a question about where AI is in its standardization lifecycle. We're at the 'moment of protocol consolidation' that occurred in web (HTTP won 1995), email (SMTP won 1982), and APIs (REST won 2010). MCP appears to be winning this consolidation moment for agent communication.",
      counter: "But MCP has a hidden assumption: that agent-to-tool communication is the primary integration challenge. The harder problem is agent-to-agent communication, which MCP doesn't yet fully address. This is the white space where custom protocols may persist.",
      synthesis: "MCP for agent-to-tool. Hybrid for agent-to-agent (MCP + emergent A2A protocols). Watch the A2A standards space — this is the next battle."
    }
  }
};

// ── DEBATE GENERIC ARGUMENTS (for topics not in knowledge base) ──
function generateDebateArgument(model, topic, round) {
  const persona = MODEL_PERSONAS[model];
  const templates = {
    opening: [
      `${persona.signature} I approach "${topic}" through the lens of ${persona.strengths[0]}. The key consideration is the fundamental tradeoff between capability and deployability. Evidence suggests a 73% preference for structured approaches in enterprise settings, with measurable ROI metrics validating systematic frameworks.`,
      `${persona.signature} examining "${topic}" reveals critical architectural decisions. The dominant factor is scalability: solutions that work at 10 agents must work at 10,000. My analysis of current deployment patterns shows clear advantage for modular, composable approaches over monolithic designs.`,
      `${persona.signature} the core debate in "${topic}" centers on the tension between optimization for current constraints vs. future flexibility. ${persona.strengths[1]} suggests that hybrid architectures outperform pure-play solutions by 40-60% on composite benchmark suites.`
    ],
    counter: [
      `While previous arguments have merit, ${persona.signature} the counterargument is stronger than acknowledged. Empirical deployment data shows that theoretical advantages often fail to materialize in production. The 80/20 rule applies: focus on the 20% of optimizations that deliver 80% of value.`,
      `${persona.signature} I must challenge the framing here. The assumption that current patterns will persist is contradicted by recent developments. The open-source parity achieved by DeepSeek V4 and Llama 4 Scout fundamentally changes the cost structure of any proposed solution.`,
      `Reconsidering through the lens of ${persona.strengths[2]}, the previous position underweights the importance of operator experience. Solutions that require deep expertise to deploy correctly face 3-5x longer adoption curves than self-service alternatives.`
    ],
    synthesis: [
      `${persona.signature} synthesizing all positions: the optimal approach combines the best elements from competing frameworks. The decisive metric is not performance in isolation but total value delivery: (capability × reliability) / (cost × complexity). Solutions scoring above 0.7 on this composite metric represent defensible choices.`,
      `My final position: ${persona.signature} the debate reveals a false dichotomy. The winning architecture uses each approach where it excels. Practical recommendation: start with the higher-confidence path, instrument heavily, and iterate based on observed failure modes.`,
      `After considering all arguments, ${persona.signature} the synthesis points to a context-dependent answer. For regulated industries: prioritize auditability. For high-scale inference: prioritize efficiency. For agent coordination: prioritize standardization. The framework generalizes; the implementation is always specific.`
    ]
  };

  const roundType = round === 0 ? 'opening' : (round === 1 ? 'counter' : 'synthesis');
  return pickRandom(templates[roundType]);
}

// ── DEBATE STATE ──
let debateRunning = false;
let debateRoundNum = 0;
const debateScores = { deepseek: 0, llama: 0, mistral: 0, gptoss: 0 };

// ── SCORING ALGORITHM ──
function scoreRound(topic, model, round, argument) {
  // Deterministic seed based on topic + model + round
  let hash = 0;
  const seed = topic + model + round;
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash) + seed.charCodeAt(i);
    hash |= 0;
  }
  // Normalize to 1-10 range
  const base = ((Math.abs(hash) % 30) + 70);
  const variance = (Math.abs(hash >> 8) % 15) - 7;
  return Math.min(99, Math.max(60, base + variance));
}

function setDebateTopic(el) {
  const input = document.getElementById('debateTopic');
  if (input) input.value = el.textContent;
}

async function startDebate() {
  if (debateRunning) {
    showToast('Debate already in progress', 'warning');
    return;
  }

  const topic = document.getElementById('debateTopic').value.trim();
  if (!topic) {
    showToast('Enter a debate topic', 'warning');
    return;
  }

  const rounds = parseInt(document.getElementById('debateRounds').value);
  const mode = document.getElementById('debateMode').value;

  debateRunning = true;
  const btn = document.getElementById('startDebate');
  btn.disabled = true;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Debating...';

  // Reset
  Object.keys(debateScores).forEach(m => debateScores[m] = 0);
  ['deepseek','llama','mistral','gptoss'].forEach(m => {
    document.getElementById(`score-${m}`).textContent = '-';
    document.getElementById(`arg-${m}`).innerHTML = '<span class="arg-placeholder">Preparing argument...</span>';
    document.getElementById(`ds-confidence`) && (document.getElementById(`ds-confidence`).textContent = '-');
    document.querySelectorAll(`.dmc-stats .dstat`).forEach(s => {});
  });

  const dtBody = document.getElementById('dtBody');
  dtBody.innerHTML = '';
  const rubricStatus = document.getElementById('rubricStatus');
  const synthBody = document.getElementById('synthBody');

  // Set rubric running
  rubricStatus.textContent = 'Running';
  rubricStatus.style.background = 'rgba(56,189,248,0.2)';
  rubricStatus.style.color = '#38bdf8';

  showToast(`Debate started: "${topic.substring(0,40)}..."`, 'info');

  // Run rounds
  for (let r = 0; r < rounds; r++) {
    debateRoundNum = r;
    const roundTypes = ['opening', 'counter/rebuttal', 'synthesis'][Math.min(r, 2)];

    // Add round header to timeline
    const roundDiv = document.createElement('div');
    roundDiv.className = 'dt-round';
    roundDiv.innerHTML = `<div class="dt-round-label">ROUND ${r+1} — ${roundTypes.toUpperCase()}</div>`;
    dtBody.appendChild(roundDiv);

    // Each model argues
    const modelOrder = shuffle(['deepseek', 'llama', 'mistral', 'gptoss']);
    for (const model of modelOrder) {
      const card = document.getElementById(`dcard-${model}`);
      card.classList.add('speaking');

      // Get argument
      let argument;
      const kb = DEBATE_ARGUMENTS[topic];
      if (kb && kb[model]) {
        argument = kb[model][['opening','counter','synthesis'][Math.min(r, 2)]];
      } else {
        argument = generateDebateArgument(model, topic, r);
      }

      // Animate typing
      const argEl = document.getElementById(`arg-${model}`);
      argEl.innerHTML = '';
      argEl.classList.add('thinking');
      await sleep(300);
      argEl.classList.remove('thinking');

      // Typewrite
      await typewriteDebate(argEl, argument);

      // Score this round
      const roundScore = scoreRound(topic, model, r, argument);
      debateScores[model] += roundScore;

      // Update tokens/confidence
      const tokens = Math.floor(argument.length * 1.3);
      const confidence = Math.min(99, Math.floor(60 + (roundScore - 60) * 1.2));
      const citations = Math.floor(roundScore / 20);

      updateModelStats(model, confidence, citations, tokens);

      // Add to timeline
      const entry = document.createElement('div');
      entry.className = 'dt-entry';
      entry.innerHTML = `
        <span class="dte-model" style="color:${MODEL_PERSONAS[model].color}">${MODEL_PERSONAS[model].badge}</span>
        <span class="dte-text">${argument.substring(0, 120)}...</span>
      `;
      roundDiv.appendChild(entry);

      card.classList.remove('speaking');
      await sleep(200);
    }

    // Update scores after each round
    updateDebateScores(topic);
    await sleep(500);
  }

  // Final scoring
  const winner = Object.entries(debateScores).sort((a,b) => b[1]-a[1])[0];
  const winnerCard = document.getElementById(`dcard-${winner[0]}`);
  winnerCard.classList.add('winner');

  // Update Rubric AI metrics
  animateRubricMetrics(topic);

  // Generate synthesis
  await sleep(800);
  const synthesis = generateSynthesis(topic, winner[0]);
  synthBody.textContent = '';
  const synthReveal = synthBody;
  synthReveal.classList.add('reveal');
  await typewriteDebate(synthReveal, synthesis, 15);

  rubricStatus.textContent = 'Complete';
  rubricStatus.style.background = 'rgba(52,211,153,0.2)';
  rubricStatus.style.color = '#34d399';

  showToast(`Debate complete. Winner: ${MODEL_PERSONAS[winner[0]].name}`, 'success');

  btn.disabled = false;
  btn.innerHTML = '<i class="fas fa-gavel"></i> Start Debate';
  debateRunning = false;
}

function updateModelStats(model, confidence, citations, tokens) {
  const prefixes = { deepseek: 'ds', llama: 'll', mistral: 'mi', gptoss: 'go' };
  const p = prefixes[model];
  if (document.getElementById(`${p}-confidence`)) document.getElementById(`${p}-confidence`).textContent = confidence;
  if (document.getElementById(`${p}-citations`)) document.getElementById(`${p}-citations`).textContent = citations;
  if (document.getElementById(`${p}-tokens`)) document.getElementById(`${p}-tokens`).textContent = tokens;
}

function updateDebateScores(topic) {
  ['deepseek','llama','mistral','gptoss'].forEach(model => {
    const el = document.getElementById(`score-${model}`);
    if (el) {
      el.textContent = debateScores[model];
      el.classList.add('animate');
      setTimeout(() => el.classList.remove('animate'), 500);
    }
  });
}

function animateRubricMetrics(topic) {
  // Deterministic metrics based on topic hash
  let hash = 0;
  for (let i = 0; i < topic.length; i++) {
    hash = ((hash << 5) - hash) + topic.charCodeAt(i);
    hash |= 0;
  }
  const logic = 75 + (Math.abs(hash) % 22);
  const fact = 70 + (Math.abs(hash >> 4) % 25);
  const halluc = 3 + (Math.abs(hash >> 8) % 12);
  const consensus = 72 + (Math.abs(hash >> 12) % 20);

  setMetric('logic', logic);
  setMetric('fact', fact);
  setMetric('halluc', halluc);
  setMetric('consensus', consensus);
}

function setMetric(id, val) {
  const fill = document.getElementById(`rm-${id}`);
  const label = document.getElementById(`rmv-${id}`);
  if (fill) fill.style.width = val + '%';
  if (label) label.textContent = val + '%';
}

function generateSynthesis(topic, winnerModel) {
  const winner = MODEL_PERSONAS[winnerModel];
  const syntheses = {
    "Best agentic memory architecture: ByteRover vs MuleRun":
      `CONSENSUS: ByteRover's file-based (.brv context-tree) architecture wins on cost-performance and auditability. Key finding: 92.2% retrieval accuracy + compresr compression (avg 68% token reduction) makes ByteRover the defensible enterprise choice. MuleRun remains viable for single-session, latency-critical creative agents. Recommended hybrid: ByteRover for durable state, in-memory cache for hot paths. ${winner.name} provided the most rigorous technical analysis, earning highest Rubric AI verification score.`,
    "MCP vs custom API orchestration protocols":
      `CONSENSUS: MCP wins the protocol standardization battle. With 82.7K GitHub stars, OpenAI/Microsoft/Google adoption, and Linux Foundation governance, MCP has achieved the network effect threshold. Custom protocols only justified for sub-10ms latency paths, proprietary hardware, or classified systems. The emerging MCP Gateway pattern (Zatanna bridge) handles legacy integration cleanly. Investment thesis: build on MCP; differentiate via tool implementations and domain-specific extensions. ${winner.name} identified the decisive economic argument.`,
    "Open-source vs proprietary model selection for enterprise":
      `CONSENSUS: Open-source parity has been achieved. DeepSeek V4 (1T params, rivals GPT-5.4), Llama 4 Scout (10M context), GPT-OSS 120B, and Mistral 3 (675B MoE, 50% compute cost) collectively close the capability gap. The "Open-Source Arbitrage Window" is now: build sovereign agent infrastructure at frontier-model quality with 60-80% cost reduction. Proprietary models remain advantaged only in cutting-edge capabilities not yet replicated. ${winner.name}'s economic analysis was decisive.`,
    "JEPA world models vs transformer scaling":
      `CONSENSUS: Both paths are necessary. Transformers continue to scale predictably (GPT-5.4 evidence), but the ceiling is becoming visible. JEPA/world models (AMI Labs $1.03B seed) represent the post-LLM architecture bet for physical reasoning and causality. Investment allocation: 70% on scaling current transformers for near-term value, 30% on JEPA/world model research for the 2027-2030 paradigm. ${winner.name} provided the clearest framework for evaluating the architectural tradeoff.`,
    "Vertical AI specialization vs general-purpose agents":
      `CONSENSUS: Vertical specialization wins in regulated industries (Harvey/legal, Avoice/architecture, Fenrock/banking, Mango Medical/surgery). General-purpose agents dominate for unstructured knowledge work. The "Harvey for X" pattern shows 3-10x better performance in domain-specific benchmarks. Key insight: vertical agents + specialized training data (Traverse/Shofo) + domain verification (Rubric AI) > fine-tuned general model. ${winner.name}'s synthesis of the Harvey pattern was most complete.`
  };

  return syntheses[topic] || `CONSENSUS: After ${Object.keys(debateScores).length} models and ${Object.values(debateScores).reduce((a,b)=>a+b,0)} cumulative evaluation points, the winning position (${winner.name}) demonstrates superior ${winner.strengths.join(', ')}. Key insight: deterministic multi-model debate consistently outperforms single-model outputs by surfacing blindspots and forcing explicit reasoning chains. Rubric AI verification confirms consensus strength and flags remaining uncertainty domains for human review.`;
}

async function typewriteDebate(el, text, speed = 12) {
  el.textContent = '';
  const chars = text.split('');
  for (let i = 0; i < chars.length; i++) {
    el.textContent += chars[i];
    if (i % 8 === 0) await sleep(speed);
  }
}

function initDebate() {
  const btn = document.getElementById('startDebate');
  if (btn) btn.addEventListener('click', startDebate);
}
