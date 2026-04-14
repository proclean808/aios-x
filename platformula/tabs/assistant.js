const LS_CHECKLIST = 'pf1_assistant_checklist';

const TEMPLATE_STRUCTURES = [
  (v) => `We help ${v.customer} who struggle with ${v.problem} by ${v.solution}. Unlike ${v.competitor}, we ${v.differentiator}.${v.traction ? ` We already have ${v.traction}.` : ''}`,
  (v) => `${v.customer} waste time on ${v.problem}. We built ${v.solution} — the only tool that ${v.differentiator}. ${v.competitor} can't match us because our approach is fundamentally different.${v.traction ? ` Proof: ${v.traction}.` : ''}`,
  (v) => `The problem: ${v.customer} can't ${v.problem.replace(/^(manual|automate|fix|solve)\s*/i, '')} efficiently. Our product: ${v.solution}. Why us: ${v.differentiator}. Why not ${v.competitor}: they ${v.problem}.${v.traction ? ` Traction: ${v.traction}.` : ''}`
];

const YC_TEMPLATES = [
  {
    q: 'What are you building?',
    template: `[Company Name] is [a/an] [product category] that helps [target customer] [achieve outcome] by [mechanism].

We do this by [brief technical description]. The result: [customer outcome in measurable terms].

Unlike [competitor], we [key differentiator].`
  },
  {
    q: 'Why now?',
    template: `Three things converged to make this possible today:

1. [Technology unlock]: [e.g., LLM costs dropped 100x, making real-time AI inference affordable at scale]
2. [Behavior change]: [e.g., enterprise buyers now expect [X], which was unthinkable in 2020]
3. [Regulatory/market shift]: [e.g., new compliance requirement forces [target customer] to modernize]

We started building [X months ago] and have [traction signal] — the window is now.`
  },
  {
    q: 'Why this team?',
    template: `[Founder 1] spent [X years] at [relevant company/role] where they [specific relevant experience]. They personally experienced [problem] when [specific story].

[Founder 2] is [technical/product/GTM] and built [relevant prior project/company/system] that [outcome].

Together, we have [combined relevant advantage]: [specific expertise, access, or insight that competitors lack].`
  },
  {
    q: 'What is your traction?',
    template: `Current metrics:
- [ARR/MRR]: $[X]K
- [Growth]: [X]% month-over-month for [X] months
- [Customers]: [X] paying customers, [X] in pilot
- [Retention]: [X]% monthly, [X]% annual

Most significant signal: [best customer story — specific outcome, specific metric, specific quote if available].

Pipeline: $[X]K in qualified opportunities, [X] deals in final stage.`
  },
  {
    q: 'What is your business model?',
    template: `Revenue model: [SaaS/usage-based/per-seat/transaction fee].

Pricing:
- [Tier 1]: $[X]/mo — [who it's for]
- [Tier 2]: $[X]/mo — [who it's for]
- [Enterprise]: custom, $[X]K-[X]K ACV

Unit economics:
- ACV: $[X]K
- CAC: $[X]K (payback in [X] months)
- Gross margin: [X]%
- LTV: $[X]K (LTV:CAC = [X]x)`
  }
];

let templateShuffleIdx = 0;

function loadChecklist() {
  try { return JSON.parse(localStorage.getItem(LS_CHECKLIST)) || {}; }
  catch { return {}; }
}
function saveChecklist(state) {
  localStorage.setItem(LS_CHECKLIST, JSON.stringify(state));
}

function generateVariants(values) {
  const filled = Object.fromEntries(
    Object.entries(values).map(([k, v]) => [k, v || `[${k}]`])
  );
  return TEMPLATE_STRUCTURES.map((fn, i) => {
    let text;
    try { text = fn(filled); } catch { text = ''; }
    return { label: `Variant ${i + 1}`, text };
  });
}

function renderVariants(variants) {
  const container = document.getElementById('onelinerResults');
  if (!container) return;
  container.innerHTML = variants.map(v => `
    <div class="variant-card">
      <div class="variant-label">${v.label}</div>
      <div class="variant-text">${v.text}</div>
      <button class="copy-result-btn" data-text="${encodeURIComponent(v.text)}">
        <i class="fas fa-copy"></i> Copy
      </button>
    </div>`).join('');
  container.style.display = 'flex';

  container.querySelectorAll('.copy-result-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      navigator.clipboard.writeText(decodeURIComponent(btn.dataset.text));
      btn.innerHTML = '<i class="fas fa-check"></i> Copied!';
      setTimeout(() => { btn.innerHTML = '<i class="fas fa-copy"></i> Copy'; }, 1500);
    });
  });
}

function getFormValues() {
  return {
    customer: document.getElementById('ol-customer')?.value.trim() || '',
    problem: document.getElementById('ol-problem')?.value.trim() || '',
    solution: document.getElementById('ol-solution')?.value.trim() || '',
    competitor: document.getElementById('ol-competitor')?.value.trim() || '',
    differentiator: document.getElementById('ol-differentiator')?.value.trim() || '',
    traction: document.getElementById('ol-traction')?.value.trim() || ''
  };
}

function renderYCTemplates() {
  const container = document.getElementById('ycTemplates');
  if (!container) return;
  container.innerHTML = YC_TEMPLATES.map((item, i) => `
    <div class="qa-item">
      <div class="qa-question" data-yc="${i}">
        <span>${item.q}</span>
        <i class="fas fa-chevron-down qa-toggle"></i>
      </div>
      <div class="qa-answer">
        <pre style="white-space:pre-wrap;font-size:12px;color:var(--text-secondary);font-family:var(--font-ui);line-height:1.7;">${item.template}</pre>
        <button class="copy-result-btn" data-text="${encodeURIComponent(item.template)}" style="margin-top:8px;">
          <i class="fas fa-copy"></i> Copy Template
        </button>
      </div>
    </div>`).join('');

  container.querySelectorAll('.qa-question').forEach(q => {
    q.addEventListener('click', () => {
      const answer = q.nextElementSibling;
      const isOpen = answer.classList.contains('open');
      container.querySelectorAll('.qa-answer').forEach(a => a.classList.remove('open'));
      container.querySelectorAll('.qa-question').forEach(q2 => q2.classList.remove('open'));
      if (!isOpen) { answer.classList.add('open'); q.classList.add('open'); }
    });
  });

  container.querySelectorAll('.copy-result-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      navigator.clipboard.writeText(decodeURIComponent(btn.dataset.text));
      btn.innerHTML = '<i class="fas fa-check"></i> Copied!';
      setTimeout(() => { btn.innerHTML = '<i class="fas fa-copy"></i> Copy Template'; }, 1500);
    });
  });
}

function initDocChecklist() {
  const state = loadChecklist();
  document.querySelectorAll('.doc-check').forEach(cb => {
    const id = cb.dataset.id;
    cb.checked = !!state[id];
    cb.addEventListener('change', () => {
      state[id] = cb.checked;
      saveChecklist(state);
    });
  });
}

export function initAssistant() {
  renderYCTemplates();
  initDocChecklist();

  document.getElementById('generateOneliner')?.addEventListener('click', () => {
    const values = getFormValues();
    const variants = generateVariants(values);
    renderVariants(variants);
    templateShuffleIdx = 0;
    const shuffleBtn = document.getElementById('shuffleOneliner');
    if (shuffleBtn) shuffleBtn.style.display = 'inline-flex';
  });

  document.getElementById('shuffleOneliner')?.addEventListener('click', () => {
    templateShuffleIdx = (templateShuffleIdx + 1) % 3;
    const container = document.getElementById('onelinerResults');
    if (!container) return;
    const cards = container.querySelectorAll('.variant-card');
    // Cycle which variant is shown first by reordering DOM
    if (cards.length >= 3) {
      const arr = [...cards];
      const rotated = [...arr.slice(templateShuffleIdx), ...arr.slice(0, templateShuffleIdx)];
      rotated.forEach(c => container.appendChild(c));
    }
  });
}
