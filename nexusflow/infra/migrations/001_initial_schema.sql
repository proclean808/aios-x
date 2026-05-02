-- NexusFlow initial database schema
-- Migration: 001_initial_schema
-- Run order: 1

-- Extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ---------------------------------------------------------------------------
-- Tenants
-- ---------------------------------------------------------------------------
CREATE TABLE tenants (
    tenant_id   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        TEXT NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- Users
-- ---------------------------------------------------------------------------
CREATE TYPE user_role AS ENUM ('admin', 'analyst', 'user', 'viewer');

CREATE TABLE users (
    user_id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    email_hash      TEXT,
    role            user_role NOT NULL DEFAULT 'user',
    preferences     JSONB NOT NULL DEFAULT '{}',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_login_at   TIMESTAMPTZ
);

CREATE INDEX idx_users_tenant ON users(tenant_id);

-- ---------------------------------------------------------------------------
-- Threads
-- ---------------------------------------------------------------------------
CREATE TYPE thread_status AS ENUM ('active', 'archived', 'quarantined', 'deleted');
CREATE TYPE classification_level AS ENUM ('Public', 'Internal', 'Confidential', 'Restricted', 'Critical');

CREATE TABLE threads (
    thread_id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id           UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    platform_source     TEXT NOT NULL,
    model_id            TEXT,
    user_id             UUID REFERENCES users(user_id),
    project_id          UUID,
    topic_tags          TEXT[] NOT NULL DEFAULT '{}',
    classification      classification_level NOT NULL DEFAULT 'Internal',
    status              thread_status NOT NULL DEFAULT 'active',
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_activity       TIMESTAMPTZ,
    message_count       INTEGER NOT NULL DEFAULT 0,
    token_count         INTEGER NOT NULL DEFAULT 0,
    extracted_entities  JSONB NOT NULL DEFAULT '{}',
    confidence_score    FLOAT NOT NULL DEFAULT 0.0,
    risk_tags           TEXT[] NOT NULL DEFAULT '{}'
);

CREATE INDEX idx_threads_tenant ON threads(tenant_id);
CREATE INDEX idx_threads_platform_source ON threads(platform_source);
CREATE INDEX idx_threads_status ON threads(status);
CREATE INDEX idx_threads_classification ON threads(classification);
CREATE INDEX idx_threads_topic_tags ON threads USING GIN(topic_tags);
CREATE INDEX idx_threads_created_at ON threads(created_at DESC);

-- ---------------------------------------------------------------------------
-- Messages
-- ---------------------------------------------------------------------------
CREATE TYPE message_role AS ENUM ('user', 'assistant', 'system', 'tool');
CREATE TYPE sanitization_status AS ENUM (
    'pending', 'clean', 'redacted', 'tokenized',
    'quarantined', 'blocked', 'review_required'
);
CREATE TYPE policy_decision AS ENUM (
    'ALLOW', 'ALLOW_WITH_REDACTION', 'HASH_FIELDS',
    'TOKENIZE_FIELDS', 'QUARANTINE', 'BLOCK', 'REVIEW_REQUIRED'
);

CREATE TABLE messages (
    message_id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    thread_id           UUID NOT NULL REFERENCES threads(thread_id) ON DELETE CASCADE,
    parent_id           UUID REFERENCES messages(message_id),
    platform_message_id TEXT,
    role                message_role NOT NULL,
    content_raw         TEXT NOT NULL,
    content_sanitized   TEXT,
    content_structured  JSONB NOT NULL DEFAULT '{}',
    sanitization_status sanitization_status NOT NULL DEFAULT 'pending',
    policy_decision     policy_decision,
    model_metadata      JSONB NOT NULL DEFAULT '{}',
    sentiment           JSONB,
    intent              TEXT,
    attachments         JSONB NOT NULL DEFAULT '[]',
    tool_calls          JSONB NOT NULL DEFAULT '[]',
    citations           JSONB NOT NULL DEFAULT '[]',
    redaction_log       JSONB NOT NULL DEFAULT '[]',
    risk_tags           TEXT[] NOT NULL DEFAULT '{}',
    timestamp           TIMESTAMPTZ NOT NULL DEFAULT now(),
    edit_history        JSONB NOT NULL DEFAULT '[]'
);

CREATE INDEX idx_messages_thread_id ON messages(thread_id);
CREATE INDEX idx_messages_role ON messages(role);
CREATE INDEX idx_messages_sanitization_status ON messages(sanitization_status);
CREATE INDEX idx_messages_timestamp ON messages(timestamp DESC);
CREATE INDEX idx_messages_risk_tags ON messages USING GIN(risk_tags);

-- Full-text search on sanitized content
CREATE INDEX idx_messages_content_fts ON messages USING GIN(to_tsvector('english', COALESCE(content_sanitized, content_raw)));

-- ---------------------------------------------------------------------------
-- Insights
-- ---------------------------------------------------------------------------
CREATE TYPE insight_type AS ENUM (
    'decision', 'feature_request', 'risk', 'finding',
    'action_item', 'knowledge_gap', 'requirement', 'blocker',
    'customer_signal', 'architecture_note'
);
CREATE TYPE insight_status AS ENUM ('new', 'in_review', 'verified', 'rejected', 'implemented');

CREATE TABLE insights (
    insight_id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id           UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    source_thread_ids   UUID[] NOT NULL DEFAULT '{}',
    source_message_ids  UUID[] NOT NULL DEFAULT '{}',
    insight_type        insight_type NOT NULL,
    content             TEXT NOT NULL,
    summary             TEXT,
    confidence          FLOAT NOT NULL DEFAULT 0.0,
    evidence_links      JSONB NOT NULL DEFAULT '[]',
    assigned_to         UUID REFERENCES users(user_id),
    due_date            TIMESTAMPTZ,
    status              insight_status NOT NULL DEFAULT 'new',
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    external_references JSONB NOT NULL DEFAULT '[]'
);

CREATE INDEX idx_insights_tenant ON insights(tenant_id);
CREATE INDEX idx_insights_type ON insights(insight_type);
CREATE INDEX idx_insights_status ON insights(status);
CREATE INDEX idx_insights_confidence ON insights(confidence DESC);
CREATE INDEX idx_insights_assigned_to ON insights(assigned_to);
CREATE INDEX idx_insights_created_at ON insights(created_at DESC);
CREATE INDEX idx_insights_source_threads ON insights USING GIN(source_thread_ids);

-- ---------------------------------------------------------------------------
-- Routing events (audit ledger)
-- ---------------------------------------------------------------------------
CREATE TYPE routing_status AS ENUM ('pending', 'in_progress', 'completed', 'failed', 'dead_lettered');

CREATE TABLE routing_events (
    routing_event_id    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id           UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    source_id           UUID NOT NULL,
    source_type         TEXT NOT NULL,
    destination_system  TEXT NOT NULL,
    destination_type    TEXT NOT NULL,
    payload_summary     JSONB NOT NULL DEFAULT '{}',
    status              routing_status NOT NULL DEFAULT 'pending',
    attempt_count       INTEGER NOT NULL DEFAULT 0,
    error               TEXT,
    workflow_id         TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    completed_at        TIMESTAMPTZ
);

CREATE INDEX idx_routing_events_tenant ON routing_events(tenant_id);
CREATE INDEX idx_routing_events_source ON routing_events(source_id, source_type);
CREATE INDEX idx_routing_events_status ON routing_events(status);
CREATE INDEX idx_routing_events_created_at ON routing_events(created_at DESC);

-- ---------------------------------------------------------------------------
-- Platform connectors (per-tenant source configuration)
-- ---------------------------------------------------------------------------
CREATE TABLE platform_connectors (
    connector_id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id           UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    platform_source     TEXT NOT NULL,
    display_name        TEXT NOT NULL,
    auth_type           TEXT NOT NULL,
    auth_config         JSONB NOT NULL DEFAULT '{}',
    is_active           BOOLEAN NOT NULL DEFAULT true,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_connectors_tenant ON platform_connectors(tenant_id);
CREATE UNIQUE INDEX idx_connectors_tenant_platform ON platform_connectors(tenant_id, platform_source, display_name);
