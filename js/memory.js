/* ═════════════════════════════════════
   AIOS-X · Agent Memory Layer
   ByteRover .brv + compresr + RAG
═════════════════════════════════════ */
'use strict';

let memoryNodes = [
  {
    id: 'root', label: 'Session Context', icon: '📁', type: 'root', expanded: true,
    tokens: 0, children: [
      {
        id: 'n1', label: 'March 2026 AI Landscape', icon: '📊', type: 'doc', tokens: 4821,
        content: 'Comprehensive analysis of AI market: $189B VC funding, agentic AI dominance, MCP protocol adoption, EU AI Act compliance requirements.',
        children: [
          { id: 'n1a', label: 'Funding Analysis', icon: '💰', type: 'note', tokens: 892, content: '$189B global VC funding in Feb 2026, 90% directed to AI. Big Tech CapEx $650-700B projected.', children: [] },
          { id: 'n1b', label: 'Model Landscape', icon: '🤖', type: 'note', tokens: 1205, content: 'Claude Opus 4.6, GPT-4.5, Gemini 2.5 Pro, Grok-3 as flagship models. DeepSeek V3 as efficiency leader.', children: [] },
          { id: 'n1c', label: 'Regulatory Context', icon: '⚖️', type: 'note', tokens: 643, content: 'EU AI Act full applicability August 2, 2026. High-risk AI systems require human oversight.', children: [] },
        ]
      },
      {
        id: 'n2', label: 'Agent Architecture', icon: '⬡', type: 'doc', tokens: 2341,
        content: 'Multi-layer agent architecture: perception, reasoning, planning, memory, execution, output, security.',
        children: [
          { id: 'n2a', label: 'MCP Protocol', icon: '🔗', type: 'note', tokens: 445, content: 'Model Context Protocol: 82.7K stars, Linux Foundation, standardizes tool interfaces for agentic AI.', children: [] },
          { id: 'n2b', label: 'Tool Registry', icon: '🔧', type: 'note', tokens: 312, content: '47 registered tools: browser, code, search, file, API, database, communication adapters.', children: [] },
        ]
      },
      {
        id: 'n3', label: 'Debate History', icon: '💬', type: 'collection', tokens: 1876,
        content: 'Previous debate transcripts and synthesis results.',
        children: [
          { id: 'n3a', label: 'Agentic Dominance Debate', icon: '📝', type: 'note', tokens: 1876, content: 'Round 3 debate. Winner: Claude Opus 4.6. Key consensus: agentic AI is dominant but reliability remains a challenge.', children: [] },
        ]
      },
    ]
  }
];

let selectedNodeId = null;

// ── COUNT TOKENS ──
function countTotalTokens(nodes) {
  let total = 0;
  nodes.forEach(n => {
    total += n.tokens || 0;
    if (n.children) total += countTotalTokens(n.children);
  });
  return total;
}

function countNodes(nodes) {
  let count = 0;
  nodes.forEach(n => {
    count++;
    if (n.children) count += countNodes(n.children);
  });
  return count;
}

// ── RENDER BRV TREE ──
function renderBrvTree() {
  const container = document.getElementById('brvTree');
  if (!container) return;
  container.innerHTML = '';
  memoryNodes.forEach(node => container.appendChild(renderNode(node, 0)));
  updateMemoryKpis();
}

function renderNode(node, depth) {
  const wrapper = document.createElement('div');
  wrapper.style.paddingLeft = (depth * 12) + 'px';

  const item = document.createElement('div');
  item.className = 'brv-node' + (selectedNodeId === node.id ? ' selected' : '');
  item.id = 'brvNode_' + node.id;

  const hasChildren = node.children && node.children.length > 0;
  item.innerHTML = `
    <span class="brv-expand">${hasChildren ? (node.expanded ? '▼' : '▶') : '·'}</span>
    <span class="brv-icon">${node.icon}</span>
    <span class="brv-label">${escapeHtml(node.label)}</span>
    <span class="brv-size">${node.tokens ? node.tokens.toLocaleString() + 't' : ''}</span>
  `;

  item.addEventListener('click', () => {
    selectedNodeId = node.id;
    node.expanded = !node.expanded;
    renderBrvTree();
    previewMemoryNode(node);
  });

  wrapper.appendChild(item);

  if (hasChildren && node.expanded) {
    node.children.forEach(child => wrapper.appendChild(renderNode(child, depth + 1)));
  }

  return wrapper;
}

function previewMemoryNode(node) {
  document.getElementById('detailTitle').textContent = `${node.icon} ${node.label}`;
  document.getElementById('detailBody').innerHTML = `
    <div style="font-size:10px;color:var(--text-muted);margin-bottom:8px;font-family:var(--font-mono)">
      ID: ${node.id} | Type: ${node.type} | Tokens: ${(node.tokens || 0).toLocaleString()}
    </div>
    <div style="font-size:13px;color:var(--text-secondary);line-height:1.6">${escapeHtml(node.content || 'No content')}</div>
    ${node.children?.length ? `<div style="margin-top:12px;font-size:10px;color:var(--text-muted)">${node.children.length} child nodes</div>` : ''}
    <div class="btn-row" style="margin-top:16px">
      <button class="btn-secondary" onclick="compressNode('${node.id}')">compresr</button>
      <button class="btn-secondary" onclick="closeModal('detailModal')">Close</button>
    </div>
  `;
  openModal('detailModal');
}

// ── ADD NODE ──
function addMemoryNode() {
  const label = prompt('Node label:');
  if (!label) return;
  const content = prompt('Node content:') || '';

  const newNode = {
    id: 'n' + Date.now(),
    label,
    icon: '📝',
    type: 'note',
    tokens: Math.round(content.length / 4),
    content,
    children: [],
  };

  // Add to root's children
  if (memoryNodes[0] && memoryNodes[0].children) {
    memoryNodes[0].children.push(newNode);
  } else {
    memoryNodes.push(newNode);
  }

  renderBrvTree();
  drawMemoryGraph();
  showToast(`Node "${label}" added (${newNode.tokens} tokens)`, 'success');
}

// ── COMPRESS ──
async function compressMemory() {
  showToast('compresr: Compressing memory graph…', 'info');
  await sleep(800);

  let totalBefore = 0;
  let totalAfter = 0;

  const compressNode_fn = (nodes) => {
    nodes.forEach(n => {
      if (n.tokens > 200) {
        totalBefore += n.tokens;
        n.tokens = Math.round(n.tokens * 0.62);
        totalAfter += n.tokens;
        n.label = n.label + ' [cmpr]';
      }
      if (n.children) compressNode_fn(n.children);
    });
  };

  compressNode_fn(memoryNodes);

  renderBrvTree();
  updateComprStats(totalBefore, totalAfter);
  showToast(`Compressed: ${totalBefore.toLocaleString()} → ${totalAfter.toLocaleString()} tokens (${Math.round((1 - totalAfter/totalBefore)*100)}% reduction)`, 'success');
}

function compressNode(nodeId) {
  const findAndCompress = (nodes) => {
    for (const n of nodes) {
      if (n.id === nodeId) {
        const before = n.tokens;
        n.tokens = Math.round(n.tokens * 0.6);
        closeModal('detailModal');
        renderBrvTree();
        showToast(`Compressed ${n.label}: ${before} → ${n.tokens} tokens`, 'success');
        return true;
      }
      if (n.children && findAndCompress(n.children)) return true;
    }
    return false;
  };
  findAndCompress(memoryNodes);
}

// ── RAG QUERY ──
async function runRagQuery() {
  const query = document.getElementById('ragQuery')?.value?.trim();
  if (!query) { showToast('Enter a query', 'warning'); return; }

  const results = document.getElementById('ragResults');
  if (results) results.innerHTML = '<div class="spinner"></div> Searching…';

  await sleep(400 + Math.random() * 300);

  // Collect all nodes with content
  const allNodes = [];
  const collectNodes = (nodes) => {
    nodes.forEach(n => {
      if (n.content) allNodes.push(n);
      if (n.children) collectNodes(n.children);
    });
  };
  collectNodes(memoryNodes);

  // Simple keyword similarity
  const queryWords = query.toLowerCase().split(/\s+/);
  const scored = allNodes.map(n => {
    const text = (n.label + ' ' + n.content).toLowerCase();
    const hits = queryWords.filter(w => text.includes(w)).length;
    const similarity = Math.min(0.99, hits / queryWords.length + Math.random() * 0.15);
    return { ...n, similarity };
  }).filter(n => n.similarity > 0.1).sort((a, b) => b.similarity - a.similarity).slice(0, 5);

  if (!results) return;
  results.innerHTML = '';

  if (!scored.length) {
    results.innerHTML = '<div class="placeholder-text">No matching nodes found</div>';
    return;
  }

  scored.forEach(n => {
    const item = document.createElement('div');
    item.className = 'rag-result';
    item.innerHTML = `
      <div class="rag-score">${n.icon} ${n.label} — Similarity: ${(n.similarity * 100).toFixed(1)}%</div>
      <div class="rag-text">${escapeHtml((n.content || '').slice(0, 150))}…</div>
    `;
    item.addEventListener('click', () => previewMemoryNode(n));
    results.appendChild(item);
  });

  showToast(`Found ${scored.length} relevant nodes`, 'success');
}

// ── MEMORY GRAPH CANVAS ──
function drawMemoryGraph() {
  const canvas = document.getElementById('memoryCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  ctx.clearRect(0, 0, W, H);

  const allNodes = [];
  const collectNodes = (nodes, parentPos) => {
    nodes.forEach((n, i) => {
      const angle = (i / Math.max(nodes.length, 1)) * Math.PI * 2;
      const radius = parentPos ? 80 : 0;
      const x = (parentPos?.x || W/2) + Math.cos(angle) * radius;
      const y = (parentPos?.y || H/2) + Math.sin(angle) * radius;
      const pos = { x: Math.max(20, Math.min(W-20, x)), y: Math.max(20, Math.min(H-20, y)) };
      n._pos = pos;
      allNodes.push({ node: n, pos, parent: parentPos });
      if (n.children && n.expanded) collectNodes(n.children, pos);
    });
  };
  collectNodes(memoryNodes, null);

  // Draw connections
  allNodes.forEach(({ pos, parent }) => {
    if (!parent) return;
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(56,189,248,0.2)';
    ctx.lineWidth = 1;
    ctx.moveTo(parent.x, parent.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  });

  // Draw nodes
  allNodes.forEach(({ node, pos }) => {
    const r = Math.min(20, Math.max(8, Math.sqrt(node.tokens || 10) / 5));
    const isSelected = node.id === selectedNodeId;

    // Glow
    if (isSelected) {
      const grd = ctx.createRadialGradient(pos.x, pos.y, r, pos.x, pos.y, r * 2.5);
      grd.addColorStop(0, 'rgba(56,189,248,0.3)');
      grd.addColorStop(1, 'rgba(56,189,248,0)');
      ctx.fillStyle = grd;
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, r * 2.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Node circle
    ctx.beginPath();
    const colors = { root: '#38bdf8', doc: '#818cf8', note: '#34d399', collection: '#fb923c' };
    ctx.fillStyle = colors[node.type] || '#38bdf8';
    ctx.arc(pos.x, pos.y, r, 0, Math.PI * 2);
    ctx.fill();

    // Label
    ctx.fillStyle = 'rgba(241,245,249,0.7)';
    ctx.font = '9px Inter, sans-serif';
    ctx.textAlign = 'center';
    const shortLabel = node.label.slice(0, 12) + (node.label.length > 12 ? '…' : '');
    ctx.fillText(shortLabel, pos.x, pos.y + r + 10);
  });
}

// ── COMPRESR STATS ──
function updateComprStats(before, after) {
  const container = document.getElementById('comprStats');
  if (!container) return;

  const total = countTotalTokens(memoryNodes);
  const ratio = before > 0 ? (before / (after || 1)).toFixed(1) : '1.0';

  const stats = [
    { label: 'Total Tokens', value: total.toLocaleString(), pct: Math.min(100, total / 100) },
    { label: 'Compression', value: ratio + '×', pct: Math.min(100, (parseFloat(ratio)-1) * 25) },
    { label: 'Nodes', value: countNodes(memoryNodes), pct: Math.min(100, countNodes(memoryNodes) * 5) },
    { label: 'Memory Util', value: Math.round(total / 200000 * 100) + '%', pct: total / 2000 },
  ];

  container.innerHTML = stats.map(s => `
    <div class="compr-stat">
      <div class="compr-label">${s.label}</div>
      <div class="compr-bar-wrap"><div class="compr-bar" style="width:${Math.min(100, s.pct)}%"></div></div>
      <div class="compr-val">${s.value}</div>
    </div>
  `).join('');
}

// ── UPDATE KPIs ──
function updateMemoryKpis() {
  const total = countTotalTokens(memoryNodes);
  const nodeCount = countNodes(memoryNodes);
  const el1 = document.getElementById('memNodeCount');
  const el2 = document.getElementById('memTokenCount');
  if (el1) el1.textContent = nodeCount;
  if (el2) el2.textContent = total.toLocaleString();
}

function getMemoryNodes() { return memoryNodes; }

window.renderBrvTree = renderBrvTree;
window.addMemoryNode = addMemoryNode;
window.compressMemory = compressMemory;
window.compressNode = compressNode;
window.runRagQuery = runRagQuery;
window.drawMemoryGraph = drawMemoryGraph;
window.previewMemoryNode = previewMemoryNode;
window.getMemoryNodes = getMemoryNodes;
window.updateComprStats = updateComprStats;
