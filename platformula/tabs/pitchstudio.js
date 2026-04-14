const TEMPLATES = {
  '30s': {
    fields: ['customer', 'problem', 'solution', 'competitor', 'differentiator'],
    labels: ['Target Customer', 'Problem', 'Solution', 'Main Competitor', 'Key Differentiator'],
    placeholders: ['Series A SaaS companies', 'manual audit prep', 'AI that automates evidence collection', 'Vanta', '10x faster, zero consultants'],
    generate: (v) =>
      `We help ${v.customer || '[target customer]'} who struggle with ${v.problem || '[problem]'} `
      + `by ${v.solution || '[solution]'}. `
      + `Unlike ${v.competitor || '[competitor]'}, we ${v.differentiator || '[differentiator]'}.`
  },
  '60s': {
    fields: ['customer', 'problem', 'competitor', 'limitation', 'solution', 'benefit', 'traction'],
    labels: ['Target Customer', 'Problem', 'Main Competitor', 'Why They Fall Short', 'Your Solution', 'Key Benefit', 'Traction Signal'],
    placeholders: ['mid-market finance teams', 'month-end close takes 2 weeks', 'Excel + accountants', "they don't scale past 50 entities", 'AI-native close automation', 'close in 3 days at 60% lower cost', '$80K MRR, 15 customers'],
    generate: (v) =>
      `We help ${v.customer || '[target customer]'} who struggle with ${v.problem || '[problem]'}. `
      + `Current solutions like ${v.competitor || '[competitor]'} fall short because ${v.limitation || '[limitation]'}. `
      + `We built ${v.solution || '[solution]'} that ${v.benefit || '[benefit]'}. `
      + (v.traction ? `We already have ${v.traction}.` : '')
  },
  '2min': {
    fields: ['customer', 'problem', 'market', 'solution', 'differentiator', 'traction', 'team', 'ask'],
    labels: ['Target Customer', 'Problem', 'Market Size', 'Solution', 'Unfair Advantage', 'Traction', 'Team', 'Funding Ask'],
    placeholders: ['enterprise ops teams', 'vendor onboarding takes 3 months', '$12B TAM in supply chain automation', 'AI that cuts onboarding to 3 days', 'proprietary vendor graph with 200K nodes', '$120K MRR, 3x MoM for 4 months', '3 founders, ex-SAP and Coupa, Stanford MBA', '$2M pre-seed SAFE'],
    generate: (v) =>
      `${v.customer ? `We serve ${v.customer}` : 'Our customers'} facing ${v.problem || '[problem]'}. `
      + `The market is ${v.market || '[market size]'}. `
      + `Our product: ${v.solution || '[solution]'}. `
      + `Our unfair advantage is ${v.differentiator || '[differentiator]'}. `
      + (v.traction ? `Traction: ${v.traction}. ` : '')
      + (v.team ? `Team: ${v.team}. ` : '')
      + (v.ask ? `We're raising ${v.ask}.` : '')
  }
};

const QA_DATA = {
  Team: [
    {
      q: 'Why are you uniquely positioned to solve this problem?',
      a: ['Connect your background directly to the specific pain — past role at a company that had this problem, or domain expertise others lack.',
          'Name the specific insight you have that competitors don\'t.',
          'Mention proprietary access: data, relationships, regulatory experience, or technology you\'ve already built.']
    },
    {
      q: 'What will you do if your co-founder leaves?',
      a: ['Don\'t be defensive. Acknowledge it\'s a real risk.',
          'Explain the vesting schedule and cliff already in place.',
          'Describe the division of skills — and that you\'ve stress-tested it already.']
    },
    {
      q: 'Have you worked together before? How do you handle disagreements?',
      a: ['Give a concrete example of a past conflict and how you resolved it.',
          'Describe your decision-making process: who owns which domains.',
          'Investors want to see psychological safety, not just agreement.']
    },
    {
      q: 'What are you missing on your team right now?',
      a: ['Be honest. Missing a CTO? A sales lead? Name it.',
          'Describe how you\'re compensating now and your plan to fill the gap.',
          'Show you\'ve thought about it — vague "we\'re open to advisors" is a red flag.']
    }
  ],
  Market: [
    {
      q: 'How did you calculate your TAM?',
      a: ['Lead with bottoms-up, not top-down. Show the math: # potential customers × ACV.',
          'Name your ICP precisely — job title, company size, industry.',
          'Acknowledge what percentage is actually serviceable (SAM) and why.']
    },
    {
      q: 'Why is this market large enough to build a billion-dollar company?',
      a: ['Connect TAM to your expansion roadmap: what\'s the wedge, and where do you expand?',
          'Reference macro trends creating urgency: regulation, AI cost drops, new buyer behavior.',
          'Name a comparable company that scaled in a similar-sized market.']
    },
    {
      q: 'Who is your exact customer and why do they need this now?',
      a: ['Give the exact job title, industry, and company size range.',
          '"Why now" must be externally driven — new regulation, new technology, new behavior.',
          'Quote a real customer who said they need this if you have one.']
    },
    {
      q: 'What\'s your go-to-market strategy?',
      a: ['Name your first channel: outbound, PLG, events, partnerships.',
          'Explain why this channel works for this buyer — how they currently discover solutions.',
          'Show early evidence it\'s working: response rate, CAC, time to first sale.']
    }
  ],
  Traction: [
    {
      q: 'What\'s your MRR and growth rate?',
      a: ['Lead with the most impressive number. MoM rate is often better than absolute ARR.',
          'Show the chart in your head: "We went from $0 to $80K MRR in 6 months."',
          'If declining, address it proactively and explain why.']
    },
    {
      q: 'How do you know customers love your product?',
      a: ['NPS score and churn rate are the two clearest signals.',
          'Quote a specific customer statement about a measurable outcome.',
          'Expansion revenue (net dollar retention > 100%) is the strongest signal of all.']
    },
    {
      q: 'What does retention look like?',
      a: ['Share your 30/60/90-day retention cohort if you have it.',
          'Explain your churn — is it contractual or behavioral? What\'s driving it?',
          'Negative churn (expansion > churn) is the gold standard.']
    },
    {
      q: 'Walk me through your pipeline.',
      a: ['Describe stages, conversion rates, and average deal size.',
          'Note your top 3 deals and where they are.',
          'Be honest about where deals stall — investors respect self-awareness.']
    }
  ],
  Competition: [
    {
      q: 'Who are your real competitors and why will you win?',
      a: ['Name 3 real competitors including incumbents. "No competition" is disqualifying.',
          'For each: name their main strength and the specific gap you fill.',
          'Your moat must be specific: data network effect, proprietary tech, compliance cert, or distribution.']
    },
    {
      q: 'What happens when Google/Salesforce/[Big Co] builds this?',
      a: ['Name the specific reason big companies are slow here: org complexity, conflict of interest, or technical debt.',
          'Explain your speed advantage and the moat you\'ll have by the time they move.',
          'Point to examples where incumbents tried and failed in this exact space.']
    },
    {
      q: 'Why haven\'t well-funded competitors already won?',
      a: ['Explain the non-obvious reason: wrong architecture, wrong GTM, wrong buyer assumption.',
          'Show why your approach is structurally different, not just cheaper or faster.',
          'Cite specific customer feedback about why they chose you over funded competitors.']
    }
  ]
};

function renderPitchTemplate(templateKey) {
  const tmpl = TEMPLATES[templateKey];
  const area = document.getElementById('pitchTemplateArea');
  if (!area) return;

  const values = {};
  area.innerHTML = `
    <div class="pitch-template">
      <div class="template-fields">
        ${tmpl.fields.map((f, i) => `
          <div class="field-group">
            <label class="field-label">${tmpl.labels[i]}</label>
            <input type="text" class="field-input pitch-field" data-field="${f}"
              placeholder="${tmpl.placeholders[i] || ''}"/>
          </div>`).join('')}
      </div>
      <button class="btn-primary" id="generatePitch"><i class="fas fa-wand-sparkles"></i> Generate Pitch</button>
      <div class="template-result" id="pitchResult"></div>
    </div>`;

  area.querySelectorAll('.pitch-field').forEach(input => {
    input.addEventListener('input', () => { values[input.dataset.field] = input.value.trim(); });
  });

  document.getElementById('generatePitch')?.addEventListener('click', () => {
    area.querySelectorAll('.pitch-field').forEach(input => {
      values[input.dataset.field] = input.value.trim();
    });
    const result = tmpl.generate(values);
    const el = document.getElementById('pitchResult');
    if (!el) return;
    el.textContent = result;
    el.classList.add('visible');

    // Copy button
    if (!el.nextElementSibling?.classList.contains('copy-result-btn')) {
      const btn = document.createElement('button');
      btn.className = 'copy-result-btn';
      btn.innerHTML = '<i class="fas fa-copy"></i> Copy';
      btn.addEventListener('click', () => {
        navigator.clipboard.writeText(result);
        btn.innerHTML = '<i class="fas fa-check"></i> Copied!';
        setTimeout(() => { btn.innerHTML = '<i class="fas fa-copy"></i> Copy'; }, 1500);
      });
      el.insertAdjacentElement('afterend', btn);
    }
  });
}

function renderQA() {
  const container = document.getElementById('qaCategories');
  if (!container) return;

  container.innerHTML = Object.entries(QA_DATA).map(([cat, items]) => `
    <div>
      <div class="qa-category-label">${cat}</div>
      <div class="qa-accordion">
        ${items.map((item, i) => `
          <div class="qa-item">
            <div class="qa-question" data-cat="${cat}" data-idx="${i}">
              <span>${item.q}</span>
              <i class="fas fa-chevron-down qa-toggle"></i>
            </div>
            <div class="qa-answer">
              <ul>${item.a.map(pt => `<li>${pt}</li>`).join('')}</ul>
            </div>
          </div>`).join('')}
      </div>
    </div>`).join('');

  container.querySelectorAll('.qa-question').forEach(q => {
    q.addEventListener('click', () => {
      const answer = q.nextElementSibling;
      const isOpen = answer.classList.contains('open');
      // Close all
      container.querySelectorAll('.qa-answer').forEach(a => a.classList.remove('open'));
      container.querySelectorAll('.qa-question').forEach(q2 => q2.classList.remove('open'));
      if (!isOpen) {
        answer.classList.add('open');
        q.classList.add('open');
      }
    });
  });
}

function updateDeckProgress() {
  const checks = document.querySelectorAll('.deck-check');
  const done = [...checks].filter(c => c.checked).length;
  const el = document.getElementById('deckProgress');
  if (el) el.textContent = `${done} / ${checks.length}`;
}

export function initPitchStudio() {
  // Deck checklist
  document.querySelectorAll('.deck-check').forEach(c => {
    c.addEventListener('change', updateDeckProgress);
  });

  // Pitch template tabs
  document.querySelectorAll('.pitch-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.pitch-tab').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderPitchTemplate(btn.dataset.template);
    });
  });

  // Init first template
  renderPitchTemplate('30s');
  renderQA();
}
