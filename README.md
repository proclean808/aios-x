# AIOS-X · Agentic Intelligence Orchestration System — Extended

> Multi-model deterministic debate-driven orchestration and execution layered workflow system
> **March 2026 AI Landscape Integration · v2.0**

---

## Deploy to Vercel (v0 Build)

### One-Click Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/proclean808/aios-x)

### Manual Deploy via Vercel Dashboard

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import **proclean808/aios-x** from GitHub
3. Configure project settings:

| Setting | Value |
|---|---|
| Framework Preset | **Other** |
| Root Directory | `.` |
| Build Command | *(leave blank)* |
| Output Directory | `.` |
| Install Command | *(leave blank)* |

4. Click **Deploy** — live in ~20 seconds

> No build step, no dependencies, no bundler. Pure HTML/CSS/JS served directly.

---

### Deploy via Vercel CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Clone repo
git clone https://github.com/proclean808/aios-x.git
cd aios-x

# Deploy to production
vercel --prod

# Or deploy preview
vercel
```

When prompted:
- **Set up and deploy?** → `Y`
- **Which scope?** → your team/account
- **Link to existing project?** → `N`
- **Project name?** → `aios-x`
- **Directory?** → `.`
- **Override settings?** → `N`

---

### Environment — No Variables Required

AIOS-X stores all API keys client-side in the browser via the **BYOK Vault** (🔐 button).
No server-side environment variables needed. Keys never leave the user's browser.

---

## v0 Build Summary

```
aios-x/
├── index.html          # Main app — all 7 tabs
├── vercel.json         # Vercel config (headers + CSP)
├── css/
│   ├── style.css       # Dark futuristic theme (2,800 lines)
│   └── animations.css  # Keyframe animations
└── js/
    ├── particles.js    # Canvas particle background
    ├── ui.js           # Tab navigation, toasts, modals
    ├── apiVault.js     # BYOK key storage + all API clients
    ├── models.js       # 15-model registry + benchmarks
    ├── voice.js        # Web Speech API recognition + TTS
    ├── export.js       # Print · MD · JSON · CSV · HTML
    ├── orchestrator.js # Multi-strategy orchestration engine
    ├── debate.js       # Multi-model debate + Rubric scoring
    ├── memory.js       # ByteRover .brv + compresr + RAG
    ├── execution.js    # Pipeline builder + agent roster
    ├── market.js       # Market data + canvas charts
    ├── security.js     # ClawSecure + Goodfire + EU AI Act
    └── main.js         # Entry point — initializes all systems
```

**Total:** 16 files · ~6,200 lines · 0 dependencies · 0 build steps

---

## Features

### 🤖 15 SOTA Models (BYOK — Bring Your Own Key)

| Provider | Flagship | Standard | Efficient |
|---|---|---|---|
| **Anthropic** | Claude Opus 4.6 | Claude Sonnet 4.6 | Claude Haiku 4.5 |
| **OpenAI** | GPT-4.5 Turbo · o3 | GPT-4o | GPT-4o-mini |
| **Google** | Gemini 2.5 Pro | Gemini 2.0 Flash | Gemini 1.5 Pro |
| **xAI** | Grok-3 | Grok-2 | Grok-2 Mini |
| **Ollama** | Llama 3 70B (local) | — | Llama 3 8B |
| **DeepSeek** | DeepSeek V3 | — | — |
| **Mistral** | Mistral Large 2 | — | — |

### 🔐 BYOK API Vault
- Keys stored encrypted in `localStorage` — client-side only
- One vault entry unlocks all models for that provider
- Export/import encrypted vault backup

### 🎤 Native Voice
- Voice commands: `"open debate"` · `"start debate"` · `"export report"` · `"add key"`
- Voice input for any text field (🎤 button)
- TTS output for key events

### 📄 Export Center
Print/PDF · Markdown Report · JSON Artifact · CSV Benchmarks · HTML Snapshot · Clipboard

### 7 Interactive Tabs
| Tab | Capability |
|---|---|
| ⬡ Orchestrator | 5 strategies · 7 arch layers · live API |
| 🤖 Models | Registry · benchmarks · live test |
| 💬 Debate Arena | Multi-model debate · Rubric AI scoring |
| 🧠 Memory | ByteRover .brv · compresr · RAG |
| ⚡ Execution | Pipeline builder · 6 agents · canvas viz |
| 📊 Market Intel | $189B data · charts · verticals |
| 🛡️ Security | ClawSecure · Goodfire · EU AI Act countdown |

---

## Keyboard Shortcuts

| Key | Action |
|---|---|
| `1` – `7` | Switch tabs |
| `Ctrl+Enter` | Launch orchestration |
| `🎤` button | Voice input |
| `🔐` button | Open API Vault |
| `📄` button | Export panel |

---

## Local Development

No build tools needed — open directly in a browser:

```bash
# Clone
git clone https://github.com/proclean808/aios-x.git
cd aios-x

# Serve locally (any static server works)
npx serve .
# or
python3 -m http.server 3000
# or
npx live-server
```

Then open `http://localhost:3000`

> **Note:** Voice recognition requires HTTPS in production (Vercel provides this automatically).
> For local dev, `localhost` is whitelisted by browsers.

---

## API Key Setup (Post-Deploy)

After deploying, open the app and click **🔐** in the top-right:

1. Click **+ Add Key**
2. Select provider (e.g. Anthropic)
3. Paste your API key (`sk-ant-…`)
4. Click **Save**

Keys are stored in `localStorage` — they persist across sessions and are never sent to any server.

**Get API keys:**
- Anthropic: [console.anthropic.com](https://console.anthropic.com)
- OpenAI: [platform.openai.com](https://platform.openai.com)
- Google: [aistudio.google.com](https://aistudio.google.com)
- xAI: [console.x.ai](https://console.x.ai)
- Ollama: Use `http://localhost:11434` as the endpoint (no key)

---

## Content Security Policy

`vercel.json` includes a CSP that allows connections to all supported provider APIs.
If you add a custom domain, no changes are needed — the CSP uses `connect-src` wildcards for all provider endpoints.

---

*AIOS-X v2.0 — Built from the March 2026 AI Landscape Intelligence Brief*
*"Agentic AI has emerged as the dominant paradigm"*
