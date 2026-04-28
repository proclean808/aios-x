# BotCast Arena · Evidence Packet
**Version:** 1.0.0  
**Entity:** Venture Vision / PlatFormula.ONE  
**Purpose:** Vetted market data injected by TALON Moderator into debate context via MemSmart Evidence Layer

---

## E1 · AI Funding Landscape (March 2026)

- **Global VC:** $189B in March 2026 — all-time record month
- **AI share:** 90% ($170B) of all global VC went to AI-related companies
- **New unicorns:** 40+ minted in Q1 2026 — fastest pace in venture history
- **Hyperscaler CapEx:** $650B committed by Big Tech for 2026 AI infrastructure
- **Source confidence:** HIGH (multiple independent fund reports confirm)

---

## E2 · Open-Source Model Parity (Q1 2026)

- **DeepSeek V4:** 1 trillion parameters, open weights, rivals GPT-5.4 on MMLU/HumanEval
- **Llama 4 Scout:** 10M token context window, Meta AI, cross-domain synthesis capability
- **GPT-OSS 120B:** First OpenAI open weights release since GPT-2, 120B parameters
- **Mistral 3:** 675B MoE, 41B active parameters, 50% compute cost vs dense equivalent
- **Cost delta:** Open-source deployment delivers 60-80% cost reduction vs proprietary API pricing
- **Source confidence:** HIGH (community benchmarks, LMSYS arena, direct API cost comparison)

---

## E3 · MCP Protocol Status (April 2026)

- **GitHub stars:** 82,700+ and growing
- **Adoptions:** OpenAI, Microsoft, Google, Anthropic — all confirmed MCP support
- **Governance:** Donated to Linux Foundation (long-term support commitment)
- **Security note:** Prompt injection via MCP tool responses is an emerging attack vector; MCP Gateways required
- **Source confidence:** HIGH (Linux Foundation announcement, GitHub metrics)

---

## E4 · Microsoft Agent Framework 1.0 (April 2026)

- **GA date:** April 3, 2026 (.NET and Python)
- **Key capabilities:** GraphFlow/graph workflow kernel, checkpointed sessions, explicit debate states, human moderator injection
- **Interoperability:** MCP and A2A compatible
- **Architecture:** Unification of Semantic Kernel enterprise foundation with AutoGen-style orchestration
- **Source confidence:** HIGH (Microsoft official announcement)

---

## E5 · Vertical AI "Harvey for X" Pattern

- **Harvey (legal):** 10x better than generalist legal AI on specialized tasks; $100M+ ARR
- **Validated verticals:** Legal (Harvey), Architecture (Avoice), Banking (Fenrock), Surgery (Mango Medical)
- **Performance premium:** 3-10x benchmark improvement in specialized vs generalist models for regulated industries
- **Pattern:** Domain-specific training data + specialized verification layer = defensible moat
- **Source confidence:** HIGH (published case studies, public funding announcements)

---

## E6 · LiteLLM Security Advisory (March 2026)

- **Affected versions:** 1.82.7 and 1.82.8 — MALICIOUS PyPI releases (March 24, 2026)
- **Payload:** Credential-stealing payloads tied to TeamPCP / Trivy compromise chain
- **Impact:** Full credential exposure event for any install of affected versions
- **Sources:** Datadog, Kaspersky security advisories
- **Policy:** Use direct provider adapters (OpenAI, Anthropic, Gemini, Ollama) — avoid LiteLLM unless hard requirement
- **If LiteLLM required:** Pin `litellm==1.82.6` exactly. Block ≥1.82.7 in lockfile.
- **Source confidence:** HIGH (Datadog + Kaspersky dual confirmation)

---

## E7 · Agent Orchestration White Space

- **Category:** Agent Orchestration Middleware — most underfunded critical component in AI stack
- **Gap:** Coordination of multiple agents, state management, conflict resolution, observability
- **Market signal:** No clear category winner as of Q1 2026; BotCast Arena TurnSignal Protocol addresses the turn-taking gap
- **Source confidence:** MEDIUM (qualitative analysis of funding data vs infrastructure needs)

---

## E8 · EU AI Act Compliance (2026)

- **Full applicability:** August 2, 2026
- **Requirements:** Risk classification, transparency requirements, audit trails, interpretability documentation
- **Opportunity:** Compliance moat forming for early movers; compliance tooling is a greenfield market
- **Source confidence:** HIGH (official EU regulatory text)

---

## E9 · AMI Labs / Post-LLM Architecture

- **Funding:** $1.03B seed round on JEPA world models
- **Thesis:** JEPA (Joint Embedding Predictive Architecture) as post-transformer foundation for physical reasoning
- **Signal:** Largest seed round in AI history signals frontier researcher consensus on post-LLM timeline
- **Timeline:** 2027-2030 paradigm shift window according to AMI Labs roadmap
- **Source confidence:** MEDIUM (single data point; large signal but early)

---

## E10 · ByteRover Memory Architecture

- **Retrieval accuracy:** 92.2% on standard agentic retrieval benchmarks
- **Compression:** compresr delivers average 68% token reduction via context tree compression
- **Format:** .brv context-tree — file-portable, auditable, offline-capable
- **Cost delta:** 60-75% cost reduction vs VM-persistent state (MuleRun pattern)
- **Source confidence:** MEDIUM (internal benchmarks, requires independent verification)

---

*Evidence packet last updated: 2026-04-28. All figures subject to revision as new data becomes available.*
