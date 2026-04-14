/**
 * PlatFormula.One — Accelerator Program Data
 *
 * NOTE: Questions shown are approximate reconstructions from publicly available
 * information. Always verify exact wording on the program's official portal
 * before submitting. Deadlines are estimates — verify on the program website.
 */

export const PROGRAMS = [
  {
    id: 'yc-s26',
    name: 'Y Combinator S26',
    shortName: 'YC S26',
    color: '#f97316',
    deadline: '2026-04-20',
    applyUrl: 'https://www.ycombinator.com/apply',
    questions: [
      {
        id: 'yc-q1',
        section: 'Company',
        text: 'Describe what your company does in 50 characters or less.',
        wordLimit: 10,
        tips: [
          'Be ruthlessly specific. "AI for restaurant inventory" beats "AI platform for businesses".',
          'Avoid jargon. A 10-year-old should understand it in one read.'
        ]
      },
      {
        id: 'yc-q2',
        section: 'Company',
        text: 'What is your company going to make? Please describe your product and what it does or will do.',
        wordLimit: 120,
        tips: [
          'Lead with what the product does, not the problem it solves. YC wants to picture the thing.',
          'Include who uses it and one concrete example of it working.'
        ]
      },
      {
        id: 'yc-q3',
        section: 'Traction',
        text: 'Where are you in terms of product and revenue? Please share any relevant traction data.',
        wordLimit: 120,
        tips: [
          'Lead with your best number. MRR, DAU, paying customers, pilots — whatever is most impressive.',
          'If pre-revenue, describe how far the product is and what validation you have (LOIs, waitlist, pilots).'
        ]
      },
      {
        id: 'yc-q4',
        section: 'Idea',
        text: 'Why did you pick this idea to work on? Do you have domain expertise in this area? How do you know people need what you\'re making?',
        wordLimit: 120,
        tips: [
          'Personal origin stories score well — "we had this problem ourselves" is credible.',
          'Cite specific conversations with users. Numbers of interviews, specific quotes if possible.'
        ]
      },
      {
        id: 'yc-q5',
        section: 'Idea',
        text: 'What do you understand about your users that other companies making similar products don\'t understand?',
        wordLimit: 120,
        tips: [
          'This is the insight question. Don\'t repeat what the product does — share a non-obvious truth.',
          'Think: what did you learn from user interviews that surprised you?'
        ]
      },
      {
        id: 'yc-q6',
        section: 'Business',
        text: 'How do or will you make money? How much could you make?',
        wordLimit: 120,
        tips: [
          'State your pricing model clearly: subscription, usage-based, per-seat, transaction fee, etc.',
          'Include a rough bottoms-up market size calc. # customers × ACV = TAM.'
        ]
      },
      {
        id: 'yc-q7',
        section: 'Business',
        text: 'Who are your competitors, and what do you understand about your business that they don\'t?',
        wordLimit: 120,
        tips: [
          'Name real competitors, including incumbents. "No competitors" is a red flag to investors.',
          'Your differentiation should be specific and defensible — not just "better UX".'
        ]
      },
      {
        id: 'yc-q8',
        section: 'Team',
        text: 'Please tell us about something impressive that one of your founders has built or achieved.',
        wordLimit: 120,
        tips: [
          'Pick one story per founder and make it concrete — numbers, outcomes, scale.',
          'Building something real (product, company, research) beats credentials alone.'
        ]
      },
      {
        id: 'yc-q9',
        section: 'Team',
        text: 'Why is your company uniquely positioned to win? What makes this team the right team to solve this problem?',
        wordLimit: 120,
        tips: [
          'Connect founder backgrounds directly to the specific problem. Avoid generic "passionate team" language.',
          'Unfair advantages: deep industry access, proprietary data, prior startup exits, domain IP.'
        ]
      },
      {
        id: 'yc-q10',
        section: 'Team',
        text: 'What is the equity split among founders and how did you decide on it?',
        wordLimit: 60,
        tips: [
          'Equal or near-equal splits with clear reasoning are fine. Avoid defensiveness.',
          'Be honest if it\'s not finalized — say so rather than making something up.'
        ]
      }
    ]
  },
  {
    id: 'techstars',
    name: 'Techstars',
    shortName: 'Techstars',
    color: '#00b4d8',
    deadline: '2026-05-15',
    applyUrl: 'https://www.techstars.com/apply',
    questions: [
      {
        id: 'ts-q1',
        section: 'Company',
        text: 'Describe your company in one sentence (140 characters max).',
        wordLimit: 25,
        tips: [
          'Use the "[Product] for [customer]" or "[Verb]-ing [problem] for [customer]" structure.',
          'Don\'t mention funding, team size, or stage — save those for other questions.'
        ]
      },
      {
        id: 'ts-q2',
        section: 'Problem',
        text: 'What problem are you solving? Why is it painful and why does it exist now?',
        wordLimit: 200,
        tips: [
          'Quantify the pain — wasted hours, lost revenue, compliance fines, churn rate.',
          'Explain why existing solutions fail. Specific failures beat vague "there\'s a gap."'
        ]
      },
      {
        id: 'ts-q3',
        section: 'Solution',
        text: 'What is your solution and how does it uniquely solve the problem?',
        wordLimit: 200,
        tips: [
          'Describe what the user actually does in your product, step by step if needed.',
          'Highlight the part that\'s new or non-obvious — that\'s your defensibility story.'
        ]
      },
      {
        id: 'ts-q4',
        section: 'Market',
        text: 'Who is your target customer and how do you reach them?',
        wordLimit: 150,
        tips: [
          'Be specific: "Series A SaaS companies with 10-100 employees" not "businesses".',
          'Name your go-to-market channel: outbound, PLG, partnerships, events, content.'
        ]
      },
      {
        id: 'ts-q5',
        section: 'Business',
        text: 'What is your business model and current pricing?',
        wordLimit: 150,
        tips: [
          'State your current or intended price point. Vague models are a red flag.',
          'Include LTV:CAC if you have data, or explain your expectation and how you\'ll get there.'
        ]
      },
      {
        id: 'ts-q6',
        section: 'Traction',
        text: 'What traction do you have? Include metrics and key milestones.',
        wordLimit: 150,
        tips: [
          'MRR growth rate matters more than absolute numbers at early stage.',
          'Include non-revenue signals too: user retention, NPS, pilots, LOIs.'
        ]
      },
      {
        id: 'ts-q7',
        section: 'Team',
        text: 'Who is on your team? Why are you the right people to build this?',
        wordLimit: 150,
        tips: [
          'Lead with domain expertise and relevant builds. Don\'t just list titles.',
          'If you have relevant exits, prior roles at companies in the space, or deep user empathy — say it.'
        ]
      },
      {
        id: 'ts-q8',
        section: 'Program',
        text: 'Why Techstars, and which program are you applying to?',
        wordLimit: 100,
        tips: [
          'Name specific MDs, portfolio companies, or program focus areas — show you did the research.',
          'Tie their network or thesis to a specific gap in your go-to-market or fundraising plan.'
        ]
      }
    ]
  },
  {
    id: 'a16z-speedrun',
    name: 'a16z Speedrun',
    shortName: 'Speedrun',
    color: '#7c3aed',
    deadline: '2026-05-01',
    applyUrl: 'https://speedrun.a16z.com',
    questions: [
      {
        id: 'a16z-q1',
        section: 'Overview',
        text: 'Give us a one-paragraph overview of your company.',
        wordLimit: 100,
        tips: [
          'Cover: what you build, who it\'s for, what problem it solves, and one proof point.',
          'Write this last — it\'s a summary of everything else. Don\'t start here.'
        ]
      },
      {
        id: 'a16z-q2',
        section: 'Problem',
        text: 'What specific problem are you solving, and why is the timing right now?',
        wordLimit: 150,
        tips: [
          'The "why now" is critical for a16z — tie it to a technology unlock, regulatory change, or behavior shift.',
          'Cite specific data points: market size change, API cost drop, regulatory event, etc.'
        ]
      },
      {
        id: 'a16z-q3',
        section: 'Solution',
        text: 'What is your product and what makes it defensible?',
        wordLimit: 150,
        tips: [
          'Defensibility options: proprietary data, network effects, switching costs, brand, regulatory moat.',
          'Be specific — "AI-powered" alone is not defensible. What does your AI do that\'s hard to replicate?'
        ]
      },
      {
        id: 'a16z-q4',
        section: 'Team',
        text: 'What is your unfair advantage — as founders and as a team?',
        wordLimit: 150,
        tips: [
          'Unfair advantages: insider access, domain IP, key hiring, prior relationships, proprietary data.',
          'Connect each founder\'s background to a specific part of the problem or solution.'
        ]
      },
      {
        id: 'a16z-q5',
        section: 'Traction',
        text: 'What are your current metrics? Include revenue, users, growth rate, and any enterprise pilots.',
        wordLimit: 100,
        tips: [
          'Use exact numbers. "Growing fast" means nothing. "3x MoM for 4 months" is compelling.',
          'If pre-revenue, quantify the validation: LOIs, waitlist size, pilot scope and timeline.'
        ]
      },
      {
        id: 'a16z-q6',
        section: 'Market',
        text: 'How big is the market you\'re going after, and how do you plan to capture it?',
        wordLimit: 100,
        tips: [
          'Bottoms-up TAM beats top-down. Show the math: # customers × ACV × addressable %.',
          'Describe your wedge — the specific segment you own first, and how it expands.'
        ]
      }
    ]
  },
  {
    id: 'skydeck',
    name: 'Berkeley SkyDeck',
    shortName: 'SkyDeck',
    color: '#059669',
    deadline: '2026-05-31',
    applyUrl: 'https://skydeck.berkeley.edu/apply',
    questions: [
      {
        id: 'sd-q1',
        section: 'Company',
        text: 'Describe your company in 200 characters or less.',
        wordLimit: 30,
        tips: [
          'Focus on what you do and for whom. Skip the vision statement for this field.',
          'Read it aloud. If it sounds like a press release, simplify it.'
        ]
      },
      {
        id: 'sd-q2',
        section: 'Problem',
        text: 'What is the problem you are solving? Why is it important?',
        wordLimit: 300,
        tips: [
          'Use a specific customer story to illustrate the pain. Abstract problems don\'t resonate.',
          'Quantify the impact: time lost, money wasted, risk incurred.'
        ]
      },
      {
        id: 'sd-q3',
        section: 'Solution',
        text: 'What is your solution and how does it work?',
        wordLimit: 300,
        tips: [
          'Walk through what a user actually does — screen by screen if helpful.',
          'Explain the core technical insight, especially if it\'s AI-driven.'
        ]
      },
      {
        id: 'sd-q4',
        section: 'Market',
        text: 'What is the size and nature of your target market?',
        wordLimit: 200,
        tips: [
          'SkyDeck likes technically-driven markets. Reference research or industry reports.',
          'TAM, SAM, SOM breakdown is a good structure here.'
        ]
      },
      {
        id: 'sd-q5',
        section: 'Business',
        text: 'Who are your competitors and what is your competitive advantage?',
        wordLimit: 200,
        tips: [
          'A 2x2 matrix (speed vs. accuracy, cost vs. quality) works well here even in text form.',
          'Be honest about competitor strengths — it builds credibility to acknowledge them.'
        ]
      },
      {
        id: 'sd-q6',
        section: 'Team',
        text: 'Who is on your team and what are their qualifications?',
        wordLimit: 200,
        tips: [
          'Berkeley connections help here — SkyDeck has a network-first model.',
          'List relevant past companies, research, or domain expertise per founder.'
        ]
      },
      {
        id: 'sd-q7',
        section: 'Traction',
        text: 'What milestones have you achieved? Include any revenue, customers, or partnerships.',
        wordLimit: 150,
        tips: [
          'Highlight academic validation (papers, patents) as well as commercial traction — both count at SkyDeck.',
          'Be specific with dates and numbers.'
        ]
      },
      {
        id: 'sd-q8',
        section: 'Program',
        text: 'What do you hope to get from SkyDeck? What specific resources or connections do you need?',
        wordLimit: 150,
        tips: [
          'Name specific Berkeley labs, professors, or alumni networks that are relevant to your work.',
          'Show you\'ve researched their portfolio — reference a relevant portfolio company.'
        ]
      }
    ]
  },
  {
    id: '500-global',
    name: '500 Global',
    shortName: '500 Global',
    color: '#e11d48',
    deadline: '2026-06-01',
    applyUrl: 'https://500.co/accelerators',
    questions: [
      {
        id: '500-q1',
        section: 'Pitch',
        text: 'Give us your 200-word company pitch.',
        wordLimit: 200,
        tips: [
          'Structure: problem → solution → traction → ask. In that order.',
          'Write like you\'re pitching to a smart non-technical investor. Skip the acronyms.'
        ]
      },
      {
        id: '500-q2',
        section: 'Problem',
        text: 'Describe the problem and your solution in detail.',
        wordLimit: 200,
        tips: [
          'State the problem in one sentence, then prove it exists with data or user quotes.',
          'Then pivot to: here\'s what we built and why it works where others failed.'
        ]
      },
      {
        id: '500-q3',
        section: 'Market',
        text: 'What is the size of your target market?',
        wordLimit: 150,
        tips: [
          '500 Global invests globally — if your market is larger outside the US, say so.',
          'Bottoms-up is more credible: # of potential customers × price point.'
        ]
      },
      {
        id: '500-q4',
        section: 'Business',
        text: 'What is your business model?',
        wordLimit: 150,
        tips: [
          'Be precise: SaaS, marketplace (take rate %), transaction fee, usage-based, professional services.',
          'Include current pricing or intended pricing tier structure.'
        ]
      },
      {
        id: '500-q5',
        section: 'Traction',
        text: 'What traction have you achieved so far?',
        wordLimit: 150,
        tips: [
          '500 appreciates hustle metrics: customer count, MoM growth, revenue, pilots, press.',
          'If pre-revenue, show user engagement: MAU, retention rate, NPS score.'
        ]
      },
      {
        id: '500-q6',
        section: 'Team',
        text: 'Tell us about your founding team.',
        wordLimit: 150,
        tips: [
          'Emphasize execution ability and past wins — 500 backs founders who can move fast.',
          'If non-US team, mention any prior US market experience or connections.'
        ]
      },
      {
        id: '500-q7',
        section: 'Program',
        text: 'Why are you applying to 500 Global and what do you want from the program?',
        wordLimit: 100,
        tips: [
          'Name their portfolio companies in your space and why that network matters to you.',
          'Be specific: do you need US market entry, fundraising intros, or enterprise partnerships?'
        ]
      }
    ]
  },
  {
    id: 'alchemist',
    name: 'Alchemist Accelerator',
    shortName: 'Alchemist',
    color: '#9333ea',
    deadline: '2026-05-20',
    applyUrl: 'https://www.alchemistaccelerator.com/apply',
    questions: [
      {
        id: 'alc-q1',
        section: 'Company',
        text: 'What does your startup do? (2-3 sentences)',
        wordLimit: 60,
        tips: [
          'Alchemist is enterprise-focused. Lead with the enterprise buyer and their pain.',
          'Mention if you have paying enterprise customers or pilots upfront — it matters here.'
        ]
      },
      {
        id: 'alc-q2',
        section: 'Problem',
        text: 'What specific enterprise problem do you solve? Who feels this pain the most?',
        wordLimit: 200,
        tips: [
          'Name the specific buyer persona: "VP of Operations at logistics companies with 200+ drivers".',
          'Quantify the cost of the problem in dollars or hours wasted annually per customer.'
        ]
      },
      {
        id: 'alc-q3',
        section: 'Customers',
        text: 'Describe your customer discovery process. How many enterprise prospects have you spoken with?',
        wordLimit: 150,
        tips: [
          'Alchemist wants to see disciplined discovery. Name specific companies you\'ve spoken with (without revealing confidential info).',
          'Quote direct feedback from enterprise decision-makers if you have it.'
        ]
      },
      {
        id: 'alc-q4',
        section: 'Business',
        text: 'What is your revenue model? What is your ACV target?',
        wordLimit: 150,
        tips: [
          'Alchemist portfolio companies typically target $50K-$500K ACV enterprise deals.',
          'Describe your sales motion: direct, channel, PLG into enterprise, or partner-led.'
        ]
      },
      {
        id: 'alc-q5',
        section: 'Competition',
        text: 'What is your competitive advantage in the enterprise market?',
        wordLimit: 150,
        tips: [
          'Enterprise moats: compliance certifications, existing integrations, white-glove support, SLAs.',
          'Explain why an enterprise would choose you over a Fortune 500 incumbent\'s internal tool.'
        ]
      },
      {
        id: 'alc-q6',
        section: 'Team',
        text: 'Describe your team\'s enterprise or deep tech background.',
        wordLimit: 150,
        tips: [
          'Prior enterprise sales experience is gold here. Name companies and deal sizes.',
          'Technical depth matters too — patents, research, or expertise that creates a moat.'
        ]
      }
    ]
  },
  {
    id: 'pear-vc',
    name: 'Pear VC',
    shortName: 'Pear VC',
    color: '#65a30d',
    deadline: '2026-06-15',
    applyUrl: 'https://pear.vc/garage',
    questions: [
      {
        id: 'pear-q1',
        section: 'Company',
        text: 'What is your company building? (3-4 sentences)',
        wordLimit: 80,
        tips: [
          'Pear invests pre-product and pre-revenue — be honest about where you are.',
          'Lead with the vision, then ground it in the specific MVP you\'re building first.'
        ]
      },
      {
        id: 'pear-q2',
        section: 'Problem',
        text: 'What is the problem you\'re solving and why does it matter?',
        wordLimit: 200,
        tips: [
          'Pear backs category-defining companies — think big. The problem should be worth billions.',
          'But also stay specific: describe the exact friction a real user experiences today.'
        ]
      },
      {
        id: 'pear-q3',
        section: 'Traction',
        text: 'What have you built and what is your traction to date?',
        wordLimit: 200,
        tips: [
          'Pear is pre-seed friendly — early prototype + strong user signal beats nothing.',
          'Quantify user engagement even if pre-revenue: sessions per week, retention after 30 days, NPS.'
        ]
      },
      {
        id: 'pear-q4',
        section: 'Team',
        text: 'Who is the team and why are you uniquely positioned to win?',
        wordLimit: 150,
        tips: [
          'Pear values founder-market fit highly. Explain your personal connection to the problem.',
          'Stanford/MIT connections are common in their network — mention academic ties if relevant.'
        ]
      },
      {
        id: 'pear-q5',
        section: 'Funding',
        text: 'How much are you raising, what will you use it for, and what milestones will it help you hit?',
        wordLimit: 150,
        tips: [
          'Structure: "We\'re raising $X. We\'ll use it to [hire X, build Y, reach Z milestone]."',
          'The milestone should be a fundable event: product launch, first revenue, Series A raise.'
        ]
      }
    ]
  }
];

export function getProgramById(id) {
  return PROGRAMS.find(p => p.id === id) || null;
}

export function getProgramNames() {
  return PROGRAMS.map(p => ({ id: p.id, name: p.name, shortName: p.shortName }));
}
