# PlatFormula.One — Rebuild & Finish Instructions for Manus

## What This Is
PlatFormula.One is a B2B AI Startup Accelerator and Founders' ToolKit SDK.
A 6-tab single-page application for founders applying to accelerators.

**No backend. No AI/LLM API calls. Zero external dependencies except Vite.**
All logic is client-side. All persistence is localStorage (prefix `pf1_`).

---

## Final Approved Tech Stack
- Vanilla HTML5 + CSS3 + ES6 JavaScript modules
- Vite 5 (dev port 3000, output /dist)
- No frameworks (no React, Vue, or Angular)
- FontAwesome 6.4 via CDN
- Google Fonts: Space Grotesk + JetBrains Mono
- No Gemini, no OpenAI, no LLM calls anywhere

---

## Design System

```css
--bg-primary:    #0d1117;
--bg-secondary:  #161b22;
--bg-card:       #21262d;
--border:        #30363d;
--accent-green:  #238636;   /* success, progress, CTA */
--accent-blue:   #1f6feb;   /* links, interactive */
--accent-amber:  #d29922;   /* deadlines, warnings */
--accent-red:    #da3633;   /* rejected, danger */
--text-primary:  #e6edf3;
--text-secondary:#7d8590;
--text-muted:    #484f58;
--radius-card:   12px;
--radius-input:  8px;
```

Fonts: Space Grotesk (UI/headings), JetBrains Mono (data/code)
Dark theme throughout. No light mode in v0.

---

## File Structure

```
platformula/
├── index.html
├── main.js
├── style.css
├── animations.css
├── vite.config.js
├── package.json
├── data/
│   └── programs.js       ← all accelerator Q&A data
└── tabs/
    ├── builder.js
    ├── pitchstudio.js
    ├── tracking.js
    ├── community.js
    ├── assistant.js
    └── concept.js
```

---

## Tab 1 — Builder (Application Builder)

### What it does
Helps founders fill out accelerator applications with guided question cards,
word counters, static tips, and draft saving.

### Key decisions
- 7 programs only: YC S26, Techstars, a16z Speedrun, Berkeley SkyDeck,
  500 Global, Alchemist, Pear VC
- "AI Tips" are **static pre-written strings** in programs.js — NO API call
- Drafts saved to localStorage key `pf1_builder_drafts`
  (object keyed by `${programId}_${questionId}`)
- Word count tracked live; warn at 90% of limit, error at 100%

### Sections
**A — Program Selector**
`<select>` dropdown; on change → call `loadProgramQuestions(programId)`

**B — Question Cards** (JS-rendered)
Each card:
- Question text
- Word limit badge (e.g., "120 words")
- `<textarea>` with live word counter below
- "Show Tip" toggle → reveals 2 static tip bullets
- "Save Draft" button → localStorage write

**C — Checklist Sidebar**
Shows which questions have saved drafts (green check) vs empty (grey circle).
Updates on every save.

**D — Export Row**
"Copy All" and "Download .txt" buttons — concatenate all saved answers for
the selected program.

### localStorage schema
```js
// key: "pf1_builder_drafts"
{
  "yc-s26_yc-q1": { answer: "...", savedAt: 1713000000000 },
  "yc-s26_yc-q2": { answer: "...", savedAt: 1713000000000 }
}
```

---

## Tab 2 — Pitch Studio

### Sections
**A — Deck Checklist**
12 slides: Problem, Solution, Market Size, Product Demo, Traction, Team,
Business Model, Competition, Financials, The Ask, Use of Funds, Vision.
Each row: checkbox + slide name + "What to include" tooltip on hover.
Static links to Airbnb deck (docsend), Sequoia template (sequoiacap.com/pitch),
First Round pitch guide.

**B — Elevator Pitch Builder**
3 template tabs: 30s / 60s / 2min
Each tab shows a fill-in-the-blank form. On "Generate" → string concat → result box.
"Copy" button on result.

30s template:
> We help **[target customer]** who struggle with **[problem]** by **[solution]**.
> Unlike **[competitor]**, we **[differentiator]**.

60s template: adds traction line and market context.
2min template: adds team, ask, and vision lines.

**C — Investor Q&A Prep**
15 questions in 4 categories (Team 4, Market 4, Traction 4, Competition 3).
Accordion: click question → expand 3-4 bullet answer framework.
No API. Frameworks are hardcoded strings.

**D — Resources**
Links: Sequoia pitch template, YC application tips, First Round pitch guide.
(No Slidebean, Beautiful.ai, or Gamma.app — those are paid tools.)

---

## Tab 3 — Tracking (Application Tracker)

### Key decisions
- **100% localStorage** — no backend, no auth, no database
- localStorage key: `pf1_tracker_apps` (array of application objects)
- 10 programs pre-loaded as status `"researching"` on first init
- Drag-and-drop NOT required — use "Move →" column action buttons
- Export to JSON button in stats row

### Kanban columns
1. Researching → 2. Applied → 3. In Review → 4. Decision

### Application object schema
```js
{
  id: string,          // crypto.randomUUID()
  programName: string,
  programId: string,
  color: string,       // hex, used for card accent
  status: "researching" | "applied" | "in-review" | "accepted" | "rejected",
  appliedDate: null | "YYYY-MM-DD",
  deadline: "YYYY-MM-DD",
  notes: string,
  archived: false
}
```

### Sections
**A — Kanban Board**
4 columns rendered by JS. Cards show: program name, status badge, deadline
(amber if < 14 days), notes preview, "Edit" and "→ Move" buttons.

**B — Stats Row**
5 stats: Total | Applied | In Review | Accepted | Rejected
(Accepted + Rejected update live from card states)
+ "Export JSON" button → downloads `pf1_tracker_apps` as .json file

**C — Upcoming Deadlines**
List of programs with deadlines in next 60 days, sorted ascending.
Each row: program name, deadline date, days remaining badge.

**D — Pre-loaded Programs** (10, status = "researching")
YC S26, Techstars, a16z Speedrun, Berkeley SkyDeck, 500 Global,
Alchemist, GenAI Fund, Pear VC, Founders Inc, Pioneer.app
Use approximate 2026 deadlines — add "(verify on website)" note in UI.

---

## Tab 4 — Community (Founder Network)

### Key decisions
- ALL content is static HTML — no API, no dynamic loading
- Section C (Live Events) REMOVED — replaced with "Where to Find Events" card
- Founder profiles use initials avatars — no images, no real people

### Sections
**A — Founder Profiles** (6 cards, static HTML)
Each card:
- Initials avatar (colored circle, 2 letters)
- Name (fictional), Startup Name, Stage badge
- Industry tag, 1-line bio
- LinkedIn button (links to linkedin.com/in/[slug] — use plausible slugs)

Industry spread: AI/ML, FinTech, HealthTech, B2B SaaS, CleanTech, EdTech

**B — Discussion Threads** (6 threads, static HTML)
Topics:
1. "How did you nail your YC application?" → link to YC Startup School forum
2. "Best AI tools for early-stage SaaS?" → link to Indie Hackers
3. "Co-founder equity split — what's fair?" → link to Hacker News thread
4. "Cold outreach to VCs — what actually works?" → link to Indie Hackers
5. "When to apply vs. when to wait for more traction?" → link to Startup School forum
6. "What's your MRR target before applying to Techstars?" → link to r/startups

Each shows: reply count (static), upvote count (static), "Join Discussion" link.

**C — Where to Find Events** (static card, replaces live events)
Links: F6S, Luma (lu.ma/startup), Eventbrite Startup filter,
YC Startup School events, On Deck

**D — Community Links**
YC Founder Forum, Indie Hackers, Hacker News (news.ycombinator.com),
Startup School, WIP.co, Product Hunt Ship

---

## Tab 5 — Application Assistant

### Sections
**A — One-Liner Generator** (hero feature)
Form fields:
- Target customer
- Problem they face
- Your solution
- Main competitor
- Your key differentiator
- Traction (optional)

"Generate" button → produces 2-3 variant company descriptions via string templates.
"Shuffle" button → cycles through 3 template structures.
"Copy" button on each result.

**B — YC Question Templates** (5 questions, accordion)
Pre-written answer frameworks for:
1. What are you building?
2. Why now?
3. Why this team?
4. What's your traction?
5. What's your business model?

Each: question text + 3-4 sentence fill-in template + "Copy Template" button.
NO API CALL. Templates are hardcoded strings with [BRACKETS] for fill-ins.

**C — Application Document Checklist**
10-item checklist (checkboxes saved to `pf1_assistant_checklist`):
- [ ] Pitch deck (10-12 slides)
- [ ] 2-minute demo video
- [ ] Financial model (3-year projection)
- [ ] Cap table summary
- [ ] Letters of intent / LOIs (if any)
- [ ] LinkedIn profiles for all founders
- [ ] GitHub / portfolio links
- [ ] Customer references (2-3 contacts)
- [ ] Company one-pager PDF
- [ ] Legal entity formation docs

**D — Resource Links**
YC application portal, Startup School, YC co-founder matching,
Hatcher co-founder match, Clerky (incorporation), Mercury (banking)

---

## Tab 6 — Concept Refinement

### v1 scope: Lean Canvas + ICP Builder only
(Competitor grid and scoring rubric are v2)

### Section A — Lean Canvas
9-box grid layout (classic Lean Canvas):
```
┌──────────────┬─────────────────────┬──────────────┐
│   Problem    │   Unique Value      │  Customer    │
│              │   Proposition       │  Segments    │
├──────────────┤                     ├──────────────┤
│   Solution   ├─────────────────────┤   Channels   │
│              │     Key Metrics     │              │
├──────────────┼─────────────────────┼──────────────┤
│  Cost Structure                    │  Revenue     │
│                                    │  Streams     │
└────────────────────────────────────┴──────────────┘
```
Plus "Unfair Advantage" box (bottom or side).

Each box: label + `<textarea>` (pre-populated with placeholder text).
"Save Canvas" → `pf1_concept_canvas` localStorage.
"Clear All" → wipe localStorage + reset textareas.
Auto-save on blur of each textarea.

### Section B — ICP Builder
Form fields (all text inputs, saved to `pf1_concept_icp`):
- Job title / Role
- Industry
- Company size (dropdown: 1-10, 11-50, 51-200, 201-1000, 1000+)
- Annual revenue range
- Primary pain point
- Current solution / tool they use
- Buying authority (dropdown: Decision Maker, Influencer, End User, Champion)
- How they measure success

"Save ICP" button → localStorage write.
Shows a formatted "ICP Summary Card" below the form after saving.
"Edit" button → repopulate form from saved data.

---

## localStorage Keys Reference

| Key | Tab | Content |
|-----|-----|---------|
| `pf1_builder_drafts` | Builder | Object: questionId → answer |
| `pf1_tracker_apps` | Tracking | Array of application objects |
| `pf1_tracker_initialized` | Tracking | Boolean, prevents re-seeding |
| `pf1_assistant_checklist` | Assistant | Object: itemId → boolean |
| `pf1_concept_canvas` | Concept | Object: boxId → text |
| `pf1_concept_icp` | Concept | Object: fieldId → value |

---

## Build Order

1. **Tracking** — highest daily-use value; self-contained; localStorage only
2. **Application Assistant** — one-liner generator is a shareable feature
3. **Builder** — needs programs.js data complete first
4. **Concept Refinement** — extend with Lean Canvas + ICP
5. **Pitch Studio** — content-heavy but mostly static HTML
6. **Community** — fully static; build last

---

## What NOT to Build (v0 Exclusions)
- No AI/Gemini/OpenAI/LLM calls
- No backend, database, or auth
- No drag-and-drop on Kanban (use buttons)
- No live event feed (use static links)
- No competitor analysis grid (v2)
- No problem/solution scoring rubric (v2)
- No light mode
- No mobile-responsive layout (desktop-first for v0)
- No Accel Atoms or GenAI Fund FastTrack programs (sparse data)
- No Slidebean/Beautiful.ai/Gamma links

---

## Programs Data (programs.js)

Each program object:
```js
{
  id: string,
  name: string,
  shortName: string,
  color: string,
  deadline: string,      // "YYYY-MM-DD" — add note "verify on website"
  applyUrl: string,
  questions: [
    {
      id: string,
      section: string,
      text: string,
      wordLimit: number,
      tips: string[]     // 2 static tips per question
    }
  ]
}
```

Note: Question text is reconstructed from publicly available information.
Always add disclaimer: "Questions shown are approximate. Verify exact wording
on the program's official application portal."

---

## Vite Config
```js
// vite.config.js
export default { server: { port: 3000 }, base: './' }
```

## Package.json
```json
{
  "name": "platformula-one",
  "version": "0.1.0",
  "scripts": { "dev": "vite", "build": "vite build" },
  "devDependencies": { "vite": "^5.0.0" }
}
```

---

## Notes for Manus
- Follow the AIOS-X architecture pattern (aios-x repo) for tab module structure
- Each tab JS file exports an `init[TabName]()` function called from main.js
- Navigation handled in main.js via data-panel attributes
- Use `try/catch` around all localStorage reads
- Add `pf1_tracker_initialized` guard to prevent re-seeding Tracking on reload
- The one-liner generator shuffle cycles through 3 string template structures
- Lean Canvas auto-saves on `blur` event per textarea
- All external links: `target="_blank" rel="noopener noreferrer"`
