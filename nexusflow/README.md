# NexusFlow

**Cross-Channel AI Thread Export & Intelligence Orchestration Layer**

NexusFlow is a real-time cross-channel AI thread export, sanitization, classification, and intelligence-routing system that connects disconnected multi-model chat environments into a unified processing backbone.

It captures AI conversations from multiple tools, normalizes them into a shared schema, removes sensitive or unsafe data, extracts structured intelligence, and routes verified outputs into the systems that run the business.

---

## What it does

1. **Ingests** chat threads from ChatGPT, Claude, Gemini, Copilot, Perplexity, Slack bots, Discord bots, local models, and custom apps
2. **Normalizes** provider-specific payloads into canonical `Thread` and `Message` records
3. **Sanitizes** sensitive content via the TALON policy gate (PII, secrets, credentials, hallucination risk)
4. **Extracts** decisions, action items, risks, feature requests, and findings as structured `Insight` records
5. **Routes** verified intelligence to memory stores, knowledge bases, CRMs, project management tools, and audit logs
6. **Displays** a unified real-time operational view across all processed interactions

---

## Repository structure

```
nexusflow/
├── architecture/          # System architecture metadata JSON
├── schemas/               # JSON Schema files for all core entities
├── libs/
│   ├── core-models/python # Canonical Pydantic models (shared across services)
│   ├── clients/           # NATS subject definitions and shared clients
│   └── policies/          # TALON policy config (extend here)
├── services/
│   ├── gateway/           # FastAPI ingestion edge — webhooks, batch upload, auth
│   ├── normalizer/        # Provider-to-canonical normalization
│   ├── sanitizer/         # TALON policy gate, PII/secret redaction
│   ├── intelligence/      # Insight extraction, entity recognition, embeddings
│   ├── router/            # Policy-based routing to downstream systems
│   └── api/               # BFF for dashboard
├── dashboard/             # Next.js + React + Tailwind operational dashboard
├── infra/
│   ├── docker-compose.yml # Local dev stack
│   ├── .env.example       # Environment variable template
│   └── migrations/        # PostgreSQL migration files
├── tests/
│   └── contract/          # Schema round-trip and contract tests
├── workflows/temporal/    # Temporal workflow definitions (routing)
└── Makefile               # Development task runner
```

---

## Quickstart (local dev)

**Prerequisites:** Docker, Python 3.11+, `psql`

```bash
# 1. Clone and enter the nexusflow directory
cd nexusflow

# 2. Copy env template and fill in values
cp infra/.env.example infra/.env

# 3. Start infrastructure (Postgres, NATS, MinIO, Qdrant, gateway)
make dev-up

# 4. Install Python packages in editable mode
make install-all

# 5. Run migrations
make migrate

# 6. Run tests
make test
```

---

## Services

| Service | Purpose | Port |
|---|---|---|
| `gateway` | Ingestion API (webhooks, batch) | 8000 |
| `normalizer` | NATS consumer — normalizes IngestEvents | — |
| `sanitizer` | NATS consumer — TALON policy gate | — |
| `intelligence` | NATS consumer — insight extraction | — |
| `router` | NATS consumer — downstream routing | — |
| `dashboard` | Next.js operational UI | 3000 |

---

## Infrastructure

| Component | Technology | Port |
|---|---|---|
| Metadata DB | PostgreSQL 16 | 5432 |
| Event bus | NATS JetStream | 4222 |
| Vector store | Qdrant | 6333 |
| Object storage | MinIO | 9000 |
| Workflow engine | Temporal | 7233 |

---

## Event subjects (NATS JetStream)

| Subject | Emitted by | Consumed by |
|---|---|---|
| `nexusflow.ingest.event_received` | gateway | normalizer |
| `nexusflow.thread.created` | normalizer | intelligence, audit |
| `nexusflow.message.created` | normalizer | sanitizer |
| `nexusflow.message.normalized` | normalizer | sanitizer |
| `nexusflow.message.sanitized` | sanitizer | intelligence |
| `nexusflow.message.quarantined` | sanitizer | audit, review queue |
| `nexusflow.insight.created` | intelligence | router, audit |
| `nexusflow.routing.completed` | router | audit |
| `nexusflow.routing.failed` | router | dead-letter handler |

---

## Security

- **At rest:** AES-256-GCM
- **In transit:** TLS 1.3
- **Secrets:** Vault-backed; never committed to source
- **PII:** Detected and redacted before any downstream routing
- **Credentials:** Quarantined or blocked by TALON policy gate
- **Access:** RBAC + ABAC via OIDC / SAML 2.0

---

## MVP v1 scope

- [x] Schema definitions (all core entities)
- [x] Pydantic models
- [x] FastAPI gateway with NATS publish
- [x] Provider normalizers (OpenAI, generic fallback)
- [x] TALON policy gate (PII, secrets, credentials)
- [x] Heuristic insight extractor
- [x] Routing rules YAML + rule evaluator
- [x] Postgres migration (all entities)
- [x] Docker Compose local stack
- [x] Contract and unit tests
- [ ] Temporal routing workflows
- [ ] Qdrant embedding pipeline
- [ ] Real LLM extraction (Claude API)
- [ ] Next.js dashboard
- [ ] Destination adapters (Linear, Notion, HubSpot)
- [ ] Multi-tenant auth (OIDC)

---

## Stack

| Layer | Technology |
|---|---|
| API gateway | FastAPI |
| Event bus | NATS JetStream |
| Workflow engine | Temporal |
| Metadata DB | PostgreSQL |
| Vector store | Qdrant |
| Object storage | MinIO / S3 |
| Policy gate | TALON |
| Memory layer | MemBRAIN |
| Frontend | Next.js + Tailwind |
| Observability | OpenTelemetry + Grafana |

---

*NexusFlow is the intelligence orchestration layer for fragmented AI-native work.*
