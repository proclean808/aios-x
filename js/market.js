/* ═════════════════════════════════════
   AIOS-X · Market Intelligence
   March 2026 AI Landscape Data
═════════════════════════════════════ */
'use strict';

const MARKET_DATA = {
  kpis: [
    { label: 'Global VC Funding', value: '$189B', sub: 'Feb 2026', trend: '+↑ 340% YoY', trendDir: 'up' },
    { label: 'AI Share of VC', value: '90%', sub: 'All VC in AI', trend: '↑ from 62%', trendDir: 'up' },
    { label: 'Big Tech CapEx', value: '$675B', sub: '2026 projected', trend: '↑ from $246B', trendDir: 'up' },
    { label: 'MCP GitHub Stars', value: '82.7K', sub: 'Linux Foundation', trend: '↑ 400% in 90d', trendDir: 'up' },
    { label: 'OpenAI Valuation', value: '$300B', sub: '$110B round', trend: '↑ series F', trendDir: 'up' },
    { label: 'Cursor / Anysphere', value: '$1B', sub: 'ARR milestone', trend: '↑ $500M in 6mo', trendDir: 'up' },
    { label: 'DeepSeek V3 Cost', value: '$5.5M', sub: 'Training budget', trend: '↓ vs $100M+', trendDir: 'up' },
    { label: 'AMI Labs Seed', value: '$1.03B', sub: 'JEPA world models', trend: 'Largest AI seed', trendDir: 'up' },
  ],

  funding: [
    { label: 'Foundation Models', value: 52, color: '#38bdf8' },
    { label: 'Agentic Platforms', value: 41, color: '#818cf8' },
    { label: 'AI Infrastructure', value: 28, color: '#34d399' },
    { label: 'Vertical AI Apps', value: 34, color: '#fb923c' },
    { label: 'AI Security', value: 18, color: '#f87171' },
    { label: 'World Models', value: 16, color: '#f472b6' },
  ],

  benchmarks: {
    models: ['Claude\nOpus 4.6', 'GPT-4.5\nTurbo', 'Gemini\n2.5 Pro', 'Grok-3', 'DeepSeek\nV3', 'Llama 3\n70B'],
    metrics: ['MMLU', 'HumanEval', 'MATH', 'Context', 'Speed', 'Cost Eff.'],
    data: [
      [91.8, 84.9, 78.3, 85, 60, 45],   // Claude Opus 4.6
      [90.4, 87.5, 76.8, 70, 65, 50],   // GPT-4.5 Turbo
      [92.0, 90.0, 91.0, 100, 75, 80],  // Gemini 2.5 Pro
      [93.3, 88.9, 93.3, 70, 70, 65],   // Grok-3
      [88.5, 89.1, 90.2, 70, 80, 98],   // DeepSeek V3
      [82.0, 81.7, 50.4, 60, 90, 100],  // Llama 3 70B
    ],
    colors: ['#c084fc', '#34d399', '#38bdf8', '#94a3b8', '#818cf8', '#fb923c'],
  },

  capex: [
    { year: '2022', value: 45 },
    { year: '2023', value: 92 },
    { year: '2024', value: 246 },
    { year: '2025', value: 420 },
    { year: '2026E', value: 675 },
  ],

  verticals: [
    { icon: '⚖️', name: 'Legal AI', market: '$38B TAM', example: 'Harvey', status: 'Proven', color: '#38bdf8' },
    { icon: '🏥', name: 'Medical Diagnostics', market: '$92B TAM', example: 'Abridge', status: 'Growing', color: '#34d399' },
    { icon: '🏦', name: 'Financial Analysis', market: '$67B TAM', example: 'Kensho', status: 'Proven', color: '#818cf8' },
    { icon: '🏗️', name: 'Construction AI', market: '$28B TAM', example: 'Buildots', status: 'Emerging', color: '#fb923c' },
    { icon: '🎓', name: 'EdTech AI', market: '$44B TAM', example: 'Khanmigo', status: 'Growing', color: '#f472b6' },
    { icon: '🔬', name: 'Drug Discovery', market: '$120B TAM', example: 'Insilico', status: 'Proven', color: '#facc15' },
    { icon: '📦', name: 'Supply Chain AI', market: '$31B TAM', example: 'FourKites', status: 'Growing', color: '#f87171' },
    { icon: '🌾', name: 'AgriTech AI', market: '$18B TAM', example: 'Granular', status: 'Early', color: '#34d399' },
  ],

  whitespace: [
    { title: 'Agent Orchestration Middleware', desc: 'Cross-provider, strategy-aware orchestration layer. No clear winner yet.', opportunity: '$15B+', urgency: 'High' },
    { title: 'Agentic Compliance Platform', desc: 'EU AI Act automated compliance for multi-agent systems.', opportunity: '$8B+', urgency: 'Critical' },
    { title: 'Multi-Model Memory Networks', desc: 'Shared persistent memory across model providers and agent sessions.', opportunity: '$12B+', urgency: 'High' },
    { title: 'AI Output Insurance', desc: 'Liability coverage for autonomous agent decisions in enterprise.', opportunity: '$22B+', urgency: 'Medium' },
  ],
};

// ── RENDER MARKET KPIs ──
function renderMarketKpis() {
  const row = document.getElementById('marketKpiRow');
  if (!row) return;
  row.innerHTML = MARKET_DATA.kpis.map(kpi => `
    <div class="market-kpi" onclick="showKpiDetail('${escapeHtml(kpi.label)}')">
      <div class="mkpi-label">${kpi.label}</div>
      <div class="mkpi-value">${kpi.value}</div>
      <div class="mkpi-sub">${kpi.sub}</div>
      <div class="mkpi-trend ${kpi.trendDir}">${kpi.trend}</div>
    </div>
  `).join('');
}

function showKpiDetail(label) {
  const kpi = MARKET_DATA.kpis.find(k => k.label === label);
  if (!kpi) return;
  document.getElementById('detailTitle').textContent = kpi.label;
  document.getElementById('detailBody').innerHTML = `
    <div style="text-align:center;padding:20px 0">
      <div style="font-size:48px;font-weight:800;color:var(--accent-blue)">${kpi.value}</div>
      <div style="color:var(--text-muted);margin-top:4px">${kpi.sub}</div>
      <div class="mkpi-trend up" style="font-size:14px;margin-top:8px">${kpi.trend}</div>
    </div>
    <div style="color:var(--text-secondary);font-size:13px;line-height:1.6">
      Source: March 2026 AI Landscape Report · Synthesized from PitchBook, Crunchbase, SEC filings, and analyst reports.
    </div>
  `;
  openModal('detailModal');
}

// ── DRAW FUNDING BAR CHART ──
function drawFundingChart() {
  const canvas = document.getElementById('fundingChart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  ctx.clearRect(0, 0, W, H);

  const data = MARKET_DATA.funding;
  const maxVal = Math.max(...data.map(d => d.value));
  const barW = (W - 60) / data.length - 8;
  const chartH = H - 50;
  const startX = 40;

  // Y-axis
  ctx.strokeStyle = 'rgba(255,255,255,0.05)';
  ctx.lineWidth = 1;
  [0, 25, 50].forEach(pct => {
    const y = 10 + (1 - pct / 100) * chartH;
    ctx.beginPath();
    ctx.moveTo(startX - 5, y);
    ctx.lineTo(W - 10, y);
    ctx.stroke();
    ctx.fillStyle = '#475569';
    ctx.font = '9px Inter, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText('$' + Math.round(maxVal * pct / 100) + 'B', startX - 8, y + 3);
  });

  data.forEach((d, i) => {
    const x = startX + i * (barW + 8);
    const barH = (d.value / maxVal) * chartH;
    const y = 10 + chartH - barH;

    // Gradient bar
    const grad = ctx.createLinearGradient(x, y, x, y + barH);
    grad.addColorStop(0, d.color);
    grad.addColorStop(1, d.color + '44');

    ctx.beginPath();
    ctx.fillStyle = grad;
    roundRect(ctx, x, y, barW, barH, 4);
    ctx.fill();

    // Value label
    ctx.fillStyle = d.color;
    ctx.font = 'bold 10px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('$' + d.value + 'B', x + barW / 2, y - 4);

    // X label
    ctx.fillStyle = '#475569';
    ctx.font = '8px Inter, sans-serif';
    const words = d.label.split(' ');
    words.forEach((w, wi) => ctx.fillText(w, x + barW / 2, H - 14 + wi * 9));
  });
}

// ── DRAW RADAR CHART ──
function drawRadarChart() {
  const canvas = document.getElementById('radarChart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  ctx.clearRect(0, 0, W, H);

  const bm = MARKET_DATA.benchmarks;
  const metrics = bm.metrics;
  const N = metrics.length;
  const cx = W / 2, cy = H / 2;
  const maxR = Math.min(W, H) / 2 - 30;

  // Grid circles
  [0.25, 0.5, 0.75, 1.0].forEach(pct => {
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    ctx.lineWidth = 1;
    for (let j = 0; j <= N; j++) {
      const angle = (j / N) * Math.PI * 2 - Math.PI / 2;
      const x = cx + Math.cos(angle) * maxR * pct;
      const y = cy + Math.sin(angle) * maxR * pct;
      j === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.stroke();
  });

  // Axes
  metrics.forEach((_, i) => {
    const angle = (i / N) * Math.PI * 2 - Math.PI / 2;
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(angle) * maxR, cy + Math.sin(angle) * maxR);
    ctx.stroke();

    // Labels
    ctx.fillStyle = '#64748b';
    ctx.font = '9px Inter, sans-serif';
    ctx.textAlign = 'center';
    const lx = cx + Math.cos(angle) * (maxR + 16);
    const ly = cy + Math.sin(angle) * (maxR + 16);
    ctx.fillText(bm.metrics[i], lx, ly + 4);
  });

  // Data polygons — top 3 models only for clarity
  bm.data.slice(0, 3).forEach((modelData, mi) => {
    ctx.beginPath();
    ctx.fillStyle = bm.colors[mi] + '22';
    ctx.strokeStyle = bm.colors[mi];
    ctx.lineWidth = 1.5;

    modelData.forEach((val, i) => {
      const angle = (i / N) * Math.PI * 2 - Math.PI / 2;
      const r = (val / 100) * maxR;
      const x = cx + Math.cos(angle) * r;
      const y = cy + Math.sin(angle) * r;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  });

  // Legend
  bm.models.slice(0, 3).forEach((name, i) => {
    ctx.fillStyle = bm.colors[i];
    ctx.fillRect(5, 5 + i * 16, 8, 8);
    ctx.fillStyle = '#64748b';
    ctx.font = '8px Inter, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(name.replace('\n', ' '), 17, 13 + i * 16);
  });
}

// ── DRAW CAPEX CHART ──
function drawCapexChart() {
  const canvas = document.getElementById('capexChart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  ctx.clearRect(0, 0, W, H);

  const data = MARKET_DATA.capex;
  const maxVal = Math.max(...data.map(d => d.value));
  const chartH = H - 50;
  const startX = 45;
  const pointW = (W - startX - 20) / (data.length - 1);
  const points = data.map((d, i) => ({
    x: startX + i * pointW,
    y: 10 + (1 - d.value / maxVal) * chartH,
    value: d.value, label: d.year,
  }));

  // Grid
  [0, 250, 500].forEach(v => {
    const y = 10 + (1 - v / maxVal) * chartH;
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(255,255,255,0.04)';
    ctx.moveTo(startX, y);
    ctx.lineTo(W - 10, y);
    ctx.stroke();
    ctx.fillStyle = '#475569';
    ctx.font = '9px Inter, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText('$' + v + 'B', startX - 5, y + 3);
  });

  // Area fill
  ctx.beginPath();
  const grad = ctx.createLinearGradient(0, 10, 0, 10 + chartH);
  grad.addColorStop(0, 'rgba(56,189,248,0.25)');
  grad.addColorStop(1, 'rgba(56,189,248,0)');
  ctx.fillStyle = grad;
  ctx.moveTo(points[0].x, points[0].y);
  points.forEach(p => ctx.lineTo(p.x, p.y));
  ctx.lineTo(points[points.length - 1].x, 10 + chartH);
  ctx.lineTo(points[0].x, 10 + chartH);
  ctx.closePath();
  ctx.fill();

  // Line
  ctx.beginPath();
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 2;
  points.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
  ctx.stroke();

  // Points & labels
  points.forEach((p, i) => {
    // Dot
    ctx.beginPath();
    ctx.fillStyle = i === data.length - 1 ? '#facc15' : '#38bdf8';
    ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
    ctx.fill();

    // Value
    ctx.fillStyle = i === data.length - 1 ? '#facc15' : '#38bdf8';
    ctx.font = 'bold 9px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('$' + p.value + 'B', p.x, p.y - 8);

    // Year
    ctx.fillStyle = '#475569';
    ctx.font = '9px Inter, sans-serif';
    ctx.fillText(p.label, p.x, H - 8);
  });
}

// ── RENDER VERTICALS ──
function renderVerticals() {
  const grid = document.getElementById('verticalGrid');
  if (!grid) return;
  grid.innerHTML = MARKET_DATA.verticals.map(v => `
    <div class="vertical-item" onclick="showVerticalDetail('${escapeHtml(v.name)}')">
      <div class="vi-icon">${v.icon}</div>
      <div class="vi-info">
        <div class="vi-name" style="color:${v.color}">${v.name}</div>
        <div class="vi-market">${v.market} · ${v.example}</div>
      </div>
      <div class="vi-badge">${v.status}</div>
    </div>
  `).join('');
}

function showVerticalDetail(name) {
  const v = MARKET_DATA.verticals.find(x => x.name === name);
  if (!v) return;
  document.getElementById('detailTitle').textContent = `${v.icon} ${v.name}`;
  document.getElementById('detailBody').innerHTML = `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px">
      <div><div style="font-size:10px;color:var(--text-muted)">TAM</div><div style="font-size:24px;font-weight:800;color:${v.color}">${v.market}</div></div>
      <div><div style="font-size:10px;color:var(--text-muted)">Status</div><div style="font-size:14px;font-weight:700">${v.status}</div></div>
    </div>
    <div style="font-size:12px;color:var(--text-secondary)">Example leader: <strong style="color:${v.color}">${v.example}</strong></div>
    <div style="margin-top:12px;font-size:12px;color:var(--text-secondary);line-height:1.6">
      The "${v.name}" vertical represents a "Harvey for X" opportunity — applying specialized AI to replace or augment expensive domain expertise at scale. This category shows consistent 10-100× ROI over generic AI solutions.
    </div>
  `;
  openModal('detailModal');
}

// ── RENDER WHITESPACE ──
function renderWhitespace() {
  const grid = document.getElementById('whitespaceGrid');
  if (!grid) return;
  grid.innerHTML = MARKET_DATA.whitespace.map(w => `
    <div class="whitespace-item">
      <div class="vi-info">
        <div class="vi-name">${w.title}</div>
        <div class="vi-market">${w.desc}</div>
      </div>
      <div style="display:flex;flex-direction:column;align-items:flex-end;gap:4px">
        <div class="vi-badge" style="background:rgba(250,204,21,0.1);color:var(--accent-yellow);border-color:rgba(250,204,21,0.25)">${w.opportunity}</div>
        <div class="vi-badge" style="
          background:${w.urgency === 'Critical' ? 'rgba(248,113,113,0.1)' : 'rgba(56,189,248,0.1)'};
          color:${w.urgency === 'Critical' ? 'var(--accent-red)' : 'var(--accent-blue)'}">
          ${w.urgency}
        </div>
      </div>
    </div>
  `).join('');
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function initMarket() {
  renderMarketKpis();
  setTimeout(() => {
    drawFundingChart();
    drawRadarChart();
    drawCapexChart();
  }, 100);
  renderVerticals();
  renderWhitespace();
}

// Re-draw charts when tab is activated
document.addEventListener('tabSwitch', e => {
  if (e.detail?.tab === 'market') {
    setTimeout(() => { drawFundingChart(); drawRadarChart(); drawCapexChart(); }, 50);
  }
});

window.initMarket = initMarket;
window.drawFundingChart = drawFundingChart;
window.drawRadarChart = drawRadarChart;
window.drawCapexChart = drawCapexChart;
window.showVerticalDetail = showVerticalDetail;
window.showKpiDetail = showKpiDetail;
window.showHybridDetail = function() {};
