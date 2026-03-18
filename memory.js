/* ═════════════════════════════════════
   AIOS-X · Agent Memory Layer
   ByteRover + compresr simulation
═════════════════════════════════════ */

// ── MEMORY STORE ──
let memoryStore = {};
let memoryAge = 0;
let memAgeInterval = null;

// ── SEED DATA ──
const SEED_MEMORY = {
  'market/funding/feb-2026': { val: '$189B global VC funding — 90% to AI. Record month.', type: 'knowledge' },
  'market/unicorns/q1-2026': { val: '40+ new AI unicorns minted. Fastest pace in history.', type: 'knowledge' },
  'protocols/mcp': { val: 'Model Context Protocol: 82.7K stars, Linux Foundation, adopted by OpenAI/Microsoft/Google', type: 'knowledge' },
  'models/deepseek-v4': { val: '1T params, open weights, rivals GPT-5.4. Open-source parity achieved.', type: 'knowledge' },
  'models/llama-4-scout': { val: '10M token context window. Meta AI. Cross-domain synthesis.', type: 'knowledge' },
  'models/mistral-3': { val: '675B MoE, 41B active, 50% compute cost. Sparse mixture-of-experts.', type: 'knowledge' },
  'models/gpt-oss-120b': { val: 'First OpenAI open weights since GPT-2. 120B parameters.', type: 'knowledge' },
  'agents/byterover': { val: 'File-based memory (.brv context-tree). 92.2% retrieval accuracy.', type: 'state' },
  'agents/compresr': { val: 'Context compression agent. Average 68% token reduction.', type: 'state' },
  'security/eu-ai-act': { val: 'Full applicability: August 2, 2026. Risk classification + transparency required.', type: 'knowledge' },
  'whitespace/orchestration-middleware': { val: 'Agent Orchestration Middleware: most underfunded critical component. HIGH PRIORITY.', type: 'task' },
  'startups/ami-labs': { val: '$1.03B seed round. JEPA world models. Post-LLM architecture.', type: 'knowledge' },
};

function initMemory() {
  // Start age counter
  memAgeInterval = setInterval(() => {
    memoryAge++;
    const el = document.getElementById('memAge');
    if (el) {
      if (memoryAge < 60) el.textContent = memoryAge + 's';
      else if (memoryAge < 3600) el.textContent = Math.floor(memoryAge/60) + 'm';
      else el.textContent = Math.floor(memoryAge/3600) + 'h';
    }
  }, 1000);

  updateMemoryStats();
}

function seedMemory() {
  let count = 0;
  for (const [key, data] of Object.entries(SEED_MEMORY)) {
    if (!memoryStore[key]) {
      memoryStore[key] = { ...data, ts: Date.now() };
      count++;
    }
  }
  renderContextTree();
  updateMemoryStats();
  showToast(`Seeded ${count} memory nodes from AI Landscape Report`, 'success');
  addLog('orchestrationLogBody', `ByteRover seeded with ${count} knowledge nodes from March 2026 report`, 'success');
}

function writeMemory() {
  const key = document.getElementById('memKey').value.trim();
  const val = document.getElementById('memValue').value.trim();
  const type = document.getElementById('memType').value;

  if (!key || !val) {
    showToast('Key and value are required', 'warning');
    return;
  }

  memoryStore[key] = { val, type, ts: Date.now() };
  document.getElementById('memKey').value = '';
  document.getElementById('memValue').value = '';

  renderContextTree();
  updateMemoryStats();
  showToast(`Written to ByteRover: ${key}`, 'success');
}

function clearMemory() {
  if (Object.keys(memoryStore).length === 0) {
    showToast('Memory already empty', 'info');
    return;
  }
  memoryStore = {};
  renderContextTree();
  updateMemoryStats();
  showToast('ByteRover memory cleared', 'warning');
}

function compressMemory() {
  const count = Object.keys(memoryStore).length;
  if (count === 0) {
    showToast('No memory to compress', 'warning');
    return;
  }
  // Simulate compression stats
  const before = count * 450;
  const after = Math.floor(before * 0.32);
  const ratio = Math.round((1 - after/before) * 100);

  document.getElementById('compRatio').textContent = ratio + '%';
  showToast(`compresr: ${before} → ${after} tokens (${ratio}% reduction)`, 'success');
}

function incrementMemoryNodes(n) {
  // Add some nodes after orchestration
  const prefixes = ['task', 'result', 'state', 'debate'];
  for (let i = 0; i < n; i++) {
    const key = `${pickRandom(prefixes)}/auto-${Date.now()}-${i}`;
    memoryStore[key] = {
      val: 'Auto-captured from orchestration run',
      type: pickRandom(['task','result','state']),
      ts: Date.now()
    };
  }
  renderContextTree();
  updateMemoryStats();
}

function updateMemoryStats() {
  const count = Object.keys(memoryStore).length;
  const el = document.getElementById('memNodes');
  if (el) animateNumber(el, 0, count, 600);

  // BRV files estimate
  const brv = document.getElementById('brv-files');
  if (brv) brv.textContent = Math.ceil(count / 4);

  // Context tokens
  let totalChars = 0;
  Object.values(memoryStore).forEach(m => totalChars += (m.val || '').length);
  const tokens = Math.floor(totalChars / 4);
  const ctxEl = document.getElementById('ctxTokens');
  if (ctxEl) ctxEl.textContent = fmtNum(tokens);

  // Compression ratio
  if (count > 0) {
    const ratio = 68; // fixed for simulation
    const cr = document.getElementById('compRatio');
    if (cr) cr.textContent = ratio + '%';
  }
}

function renderContextTree() {
  const tree = document.getElementById('contextTree');
  if (!tree) return;

  const keys = Object.keys(memoryStore);
  if (keys.length === 0) {
    tree.innerHTML = '<div class="tree-empty">Memory tree is empty. Seed or run orchestration to populate.</div>';
    return;
  }

  // Build hierarchy
  const hierarchy = {};
  keys.sort().forEach(key => {
    const parts = key.split('/');
    let current = hierarchy;
    for (let i = 0; i < parts.length - 1; i++) {
      if (!current[parts[i]]) current[parts[i]] = { _children: {} };
      current = current[parts[i]]._children;
    }
    current[parts[parts.length - 1]] = memoryStore[key];
  });

  tree.innerHTML = renderTreeNode(hierarchy, 0);
}

function renderTreeNode(node, depth) {
  let html = '';
  const indent = depth > 0 ? 'tree-node-indent' : '';

  for (const [key, val] of Object.entries(node)) {
    if (key === '_children') continue;

    if (val._children) {
      // Folder node
      html += `<div class="tree-node ${indent}" title="${key}">
        <span class="tree-connector">${depth > 0 ? '├─' : ''}</span>
        <span class="tree-icon" style="color:#38bdf8">📁</span>
        <span class="tree-key">${key}/</span>
      </div>`;
      html += renderTreeNode(val._children, depth + 1);
    } else {
      // Leaf node
      const preview = (val.val || '').substring(0, 50) + ((val.val || '').length > 50 ? '…' : '');
      html += `<div class="tree-node ${indent}" onclick="previewMemoryNode('${key}')" title="${val.val}">
        <span class="tree-connector">${depth > 0 ? '└─' : '├─'}</span>
        <span class="tree-icon">📄</span>
        <span class="tree-key">${key}</span>
        <span class="tree-val">${preview}</span>
        <span class="tree-type ${val.type || 'knowledge'}">${val.type || 'knowledge'}</span>
      </div>`;
    }
  }
  return html;
}

function previewMemoryNode(key) {
  const node = memoryStore[key];
  if (!node) return;
  openModal(`Memory Node: ${key}`, `
    <div class="modal-kv">
      <div class="mkv-row"><span class="mkv-key">Key:</span><span class="mkv-val" style="font-family:var(--font-mono);color:#38bdf8">${key}</span></div>
      <div class="mkv-row"><span class="mkv-key">Value:</span><span class="mkv-val">${node.val}</span></div>
      <div class="mkv-row"><span class="mkv-key">Type:</span><span class="mkv-val">${node.type}</span></div>
      <div class="mkv-row"><span class="mkv-key">Written:</span><span class="mkv-val">${new Date(node.ts).toLocaleString()}</span></div>
    </div>
  `);
}

function runCompresr() {
  const input = document.getElementById('comprInput').value.trim();
  if (!input) {
    showToast('Paste context to compress', 'warning');
    return;
  }

  const origTokens = Math.floor(input.length / 4);
  // Simulate compression at 32-72% retention
  const ratio = 0.28 + Math.random() * 0.12;
  const newTokens = Math.floor(origTokens * ratio);
  const saved = Math.round((1 - ratio) * 100);

  // Generate "compressed" version (extract key sentences)
  const sentences = input.split(/[.!?]+/).filter(s => s.trim().length > 20);
  const keep = Math.max(1, Math.floor(sentences.length * ratio));
  const compressed = sentences.slice(0, keep).join('. ') + '.';

  document.getElementById('comprOrig').textContent = origTokens;
  document.getElementById('comprNew').textContent = newTokens;
  document.getElementById('comprSaved').textContent = saved;
  document.getElementById('comprResult').textContent = compressed;

  showToast(`compresr: ${origTokens} → ${newTokens} tokens (${saved}% saved)`, 'success');
}

function queryMemory() {
  const query = document.getElementById('ragQuery').value.trim();
  if (!query) {
    showToast('Enter a query', 'warning');
    return;
  }

  const keys = Object.keys(memoryStore);
  if (keys.length === 0) {
    showToast('Memory is empty — seed first', 'warning');
    return;
  }

  // Simple keyword matching with score
  const terms = query.toLowerCase().split(' ').filter(t => t.length > 2);
  const scored = keys.map(key => {
    const combined = (key + ' ' + memoryStore[key].val).toLowerCase();
    let score = 0;
    terms.forEach(term => {
      const count = (combined.match(new RegExp(term, 'g')) || []).length;
      score += count * (term.length > 5 ? 2 : 1);
    });
    return { key, score };
  }).filter(r => r.score > 0).sort((a,b) => b.score - a.score).slice(0, 5);

  const container = document.getElementById('retrievalResults');
  if (scored.length === 0) {
    container.innerHTML = '<div class="rr-empty">No matching memory nodes found.</div>';
    return;
  }

  const maxScore = Math.max(...scored.map(s => s.score));
  container.innerHTML = scored.map(r => {
    const similarity = Math.min(99, Math.round((r.score / maxScore) * 92.2));
    const node = memoryStore[r.key];
    return `<div class="rr-result">
      <span class="rr-key">📍 ${r.key}</span>
      <span class="rr-score">Similarity: ${similarity}%</span>
      <div class="rr-val">${node.val}</div>
    </div>`;
  }).join('');

  showToast(`Found ${scored.length} relevant memory nodes`, 'success');
}
