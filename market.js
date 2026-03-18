/* ═════════════════════════════════════
   AIOS-X · Market Intelligence
   Feb 2026 AI Landscape Data
═════════════════════════════════════ */

let chartsInitialized = false;

function initMarketCharts() {
  if (chartsInitialized) return;
  chartsInitialized = true;

  initFundingChart();
  initThemeChart();
  initModelBenchChart();
  initVerticalMatrix();
  initHybridGrid();
}

// ── FUNDING CHART ──
function initFundingChart() {
  const ctx = document.getElementById('fundingChart');
  if (!ctx) return;

  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['OpenAI', 'Anthropic', 'Waymo', 'AMI Labs', 'Cursor/Any.', 'DeepMind', 'Others'],
      datasets: [{
        label: 'Funding ($B)',
        data: [110, 30, 16, 1.03, 0.5, 0.4, 31.07],
        backgroundColor: [
          'rgba(56,189,248,0.7)',
          'rgba(167,139,250,0.7)',
          'rgba(52,211,153,0.7)',
          'rgba(244,114,182,0.7)',
          'rgba(250,204,21,0.7)',
          'rgba(251,146,60,0.7)',
          'rgba(71,85,105,0.5)',
        ],
        borderColor: [
          '#38bdf8','#a78bfa','#34d399','#f472b6','#facc15','#fb923c','#475569'
        ],
        borderWidth: 1,
        borderRadius: 4,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (c) => ` $${c.raw}B`
          }
        }
      },
      scales: {
        x: {
          ticks: { color: '#94a3b8', font: { size: 10 } },
          grid: { color: 'rgba(255,255,255,0.04)' }
        },
        y: {
          ticks: { color: '#94a3b8', font: { size: 10 }, callback: v => '$' + v + 'B' },
          grid: { color: 'rgba(255,255,255,0.04)' }
        }
      }
    }
  });
}

// ── THEME DISTRIBUTION CHART ──
function initThemeChart() {
  const ctx = document.getElementById('themeChart');
  if (!ctx) return;

  new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: [
        'Agentic Infra',
        'Vertical AI',
        'Agent Memory',
        'MCP Protocol',
        'Open-Source',
        'Post-LLM Arch'
      ],
      datasets: [{
        data: [32, 24, 15, 12, 10, 7],
        backgroundColor: [
          'rgba(56,189,248,0.8)',
          'rgba(167,139,250,0.8)',
          'rgba(52,211,153,0.8)',
          'rgba(244,114,182,0.8)',
          'rgba(250,204,21,0.8)',
          'rgba(251,146,60,0.8)',
        ],
        borderColor: '#080e1a',
        borderWidth: 2,
        hoverOffset: 6,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '65%',
      plugins: {
        legend: {
          position: 'right',
          labels: {
            color: '#94a3b8',
            font: { size: 10 },
            boxWidth: 10,
            padding: 8,
          }
        },
        tooltip: {
          callbacks: {
            label: (c) => ` ${c.label}: ${c.raw}%`
          }
        }
      }
    }
  });
}

// ── MODEL BENCHMARK CHART ──
function initModelBenchChart() {
  const ctx = document.getElementById('modelBenchChart');
  if (!ctx) return;

  new Chart(ctx, {
    type: 'radar',
    data: {
      labels: ['Reasoning', 'Context', 'Speed', 'Cost Eff.', 'Open', 'Safety'],
      datasets: [
        {
          label: 'DeepSeek V4',
          data: [97, 88, 78, 85, 100, 82],
          borderColor: '#38bdf8',
          backgroundColor: 'rgba(56,189,248,0.1)',
          borderWidth: 2,
          pointBackgroundColor: '#38bdf8',
        },
        {
          label: 'Llama 4 Scout',
          data: [88, 100, 82, 80, 100, 79],
          borderColor: '#34d399',
          backgroundColor: 'rgba(52,211,153,0.1)',
          borderWidth: 2,
          pointBackgroundColor: '#34d399',
        },
        {
          label: 'Mistral 3',
          data: [84, 75, 94, 100, 100, 81],
          borderColor: '#a78bfa',
          backgroundColor: 'rgba(167,139,250,0.1)',
          borderWidth: 2,
          pointBackgroundColor: '#a78bfa',
        },
        {
          label: 'GPT-OSS 120B',
          data: [91, 82, 80, 78, 100, 88],
          borderColor: '#f472b6',
          backgroundColor: 'rgba(244,114,182,0.1)',
          borderWidth: 2,
          pointBackgroundColor: '#f472b6',
        },
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: { color: '#94a3b8', font: { size: 9 }, boxWidth: 10, padding: 6 }
        }
      },
      scales: {
        r: {
          angleLines: { color: 'rgba(255,255,255,0.05)' },
          grid: { color: 'rgba(255,255,255,0.05)' },
          pointLabels: { color: '#94a3b8', font: { size: 9 } },
          ticks: { color: '#475569', font: { size: 8 }, backdropColor: 'transparent' },
          min: 0, max: 100,
        }
      }
    }
  });
}

// ── VERTICAL AI MATRIX ──
const VERTICAL_DATA = [
  { sector: 'LEGAL', company: 'Harvey', desc: 'Legal AI platform. $1B+ ARR. The original "Harvey for X" pattern.', status: 'funded' },
  { sector: 'ARCHITECTURE', company: 'Avoice', desc: 'Architecture & design compliance automation.', status: 'funded' },
  { sector: 'BANKING', company: 'Fenrock AI', desc: 'Back-office: loan processing, fraud investigation.', status: 'funded' },
  { sector: 'GOVERNMENT', company: 'Fed10', desc: 'Government affairs and regulatory intelligence.', status: 'funded' },
  { sector: 'MEDICAL', company: 'Mango Medical', desc: 'AI-assisted surgery planning and pre-op analysis.', status: 'funded' },
  { sector: 'PHARMA', company: 'Ritivet', desc: 'FDA submission automation and regulatory compliance.', status: 'funded' },
  { sector: 'SCIENCE', company: 'Synthetic Sciences', desc: 'AI for scientific research and hypothesis generation.', status: 'funded' },
  { sector: 'SALES', company: 'Cardinal', desc: 'Precision sales intelligence and pipeline automation.', status: 'funded' },
  { sector: 'INSURANCE', company: 'Open Spot', desc: 'Insurance underwriting AI.', status: 'emerging' },
  { sector: 'EDUCATION', company: 'Harvey for EDU', desc: 'Academic tutoring and curriculum generation.', status: 'whitespace' },
  { sector: 'LOGISTICS', company: 'Harvey for SCM', desc: 'Supply chain optimization and route planning.', status: 'whitespace' },
  { sector: 'REAL ESTATE', company: 'Harvey for RE', desc: 'Property analysis, contract review, valuation.', status: 'whitespace' },
  { sector: 'ENERGY', company: 'Harvey for Energy', desc: 'Grid optimization, regulatory compliance, trading.', status: 'whitespace' },
  { sector: 'HR/TALENT', company: 'Harvey for HR', desc: 'Talent acquisition, compliance, workforce analytics.', status: 'emerging' },
  { sector: 'MEDIA', company: 'Harvey for Media', desc: 'Content rights, licensing, IP management.', status: 'whitespace' },
];

function initVerticalMatrix() {
  const grid = document.getElementById('vmGrid');
  if (!grid) return;

  grid.innerHTML = VERTICAL_DATA.map(v => `
    <div class="vm-cell" onclick="showVerticalDetail('${v.company}')">
      <div class="vm-sector">${v.sector}</div>
      <div class="vm-company">${v.company}</div>
      <div class="vm-desc">${v.desc}</div>
      <span class="vm-status ${v.status}">${v.status.toUpperCase()}</span>
    </div>
  `).join('');
}

function showVerticalDetail(company) {
  const data = VERTICAL_DATA.find(v => v.company === company);
  if (!data) return;
  openModal(`Vertical AI: ${data.company}`, `
    <div class="modal-kv">
      <div class="mkv-row"><span class="mkv-key">Sector:</span><span class="mkv-val">${data.sector}</span></div>
      <div class="mkv-row"><span class="mkv-key">Company:</span><span class="mkv-val">${data.company}</span></div>
      <div class="mkv-row"><span class="mkv-key">Description:</span><span class="mkv-val">${data.desc}</span></div>
      <div class="mkv-row"><span class="mkv-key">Status:</span><span class="mkv-val">${data.status}</span></div>
      <div class="mkv-row"><span class="mkv-key">Pattern:</span><span class="mkv-val">"Harvey for ${data.sector}" — Domain expert AI replacing specialized human workflows</span></div>
    </div>
  `);
}

// ── HYBRIDIZATION CANDIDATES ──
const HYBRID_DATA = [
  {
    a: 'ByteRover Memory',
    b: 'compresr',
    desc: 'Persistent agent state with minimal token consumption. 92.2% retrieval at 68% compression = optimal cost-performance.',
    value: 'WHITE SPACE: Persistent context infrastructure'
  },
  {
    a: 'Notte Browser Agent',
    b: 'Zatanna API Bridge',
    desc: 'Universal enterprise connectivity — any system via browser UI or API layer. Zero legacy integration failures.',
    value: 'WHITE SPACE: Universal enterprise integration'
  },
  {
    a: 'Sapiom Payments',
    b: 'Orthogonal Marketplace',
    desc: 'Autonomous agent-to-agent commerce. Agents discover services and pay for them without human intervention.',
    value: 'WHITE SPACE: Autonomous AI economy layer'
  },
  {
    a: 'Rubric AI Verify',
    b: 'Goodfire Interpret',
    desc: 'Anti-hallucination + mechanistic interpretability. Full-stack AI governance from output verification to feature attribution.',
    value: 'WHITE SPACE: Enterprise AI trust layer'
  },
  {
    a: 'Voice Agents (Retell)',
    b: 'Fenrock Vertical AI',
    desc: 'Domain-expert phone agents: banking calls with full back-office integration. Fenrock knowledge + voice UX.',
    value: 'WHITE SPACE: Voice-first vertical AI'
  },
  {
    a: 'Synthetic Sciences',
    b: 'Traverse/Shofo Data',
    desc: 'Self-improving research loops: AI agents generate scientific hypotheses, create training data, improve themselves.',
    value: 'WHITE SPACE: Self-improving research AI'
  },
  {
    a: 'AMI Labs JEPA',
    b: 'MCP Protocol',
    desc: 'World models as MCP tools: agents with physical reasoning capabilities accessible via standard protocol interface.',
    value: 'WHITE SPACE: Physical-world agent reasoning'
  },
];

function initHybridGrid() {
  const grid = document.getElementById('hybridGrid');
  if (!grid) return;

  grid.innerHTML = HYBRID_DATA.map(h => `
    <div class="hybrid-card" onclick="showHybridDetail('${h.a}')">
      <div class="hc-combo">${h.a} <i class="fas fa-plus"></i> ${h.b}</div>
      <div class="hc-desc">${h.desc}</div>
      <div class="hc-value">⭐ ${h.value}</div>
    </div>
  `).join('');
}

function showHybridDetail(name) {
  const h = HYBRID_DATA.find(x => x.a === name);
  if (!h) return;
  openModal(`Hybridization: ${h.a} + ${h.b}`, `
    <div class="modal-kv">
      <div class="mkv-row"><span class="mkv-key">Component A:</span><span class="mkv-val" style="color:#f472b6">${h.a}</span></div>
      <div class="mkv-row"><span class="mkv-key">Component B:</span><span class="mkv-val" style="color:#a78bfa">${h.b}</span></div>
      <div class="mkv-row"><span class="mkv-key">Synergy:</span><span class="mkv-val">${h.desc}</span></div>
      <div class="mkv-row"><span class="mkv-key">Opportunity:</span><span class="mkv-val" style="color:#facc15">${h.value}</span></div>
      <div class="mkv-row"><span class="mkv-key">Source:</span><span class="mkv-val">March 2026 AI Landscape Report — Hybridization Analysis</span></div>
    </div>
  `);
}
