-- Migration: 005_audit_events
-- Audit log — immutable append-only record of security and operational events

CREATE TABLE IF NOT EXISTS public.audit_events (
  id           BIGSERIAL PRIMARY KEY,
  event_type   TEXT NOT NULL,           -- e.g. "auth.login", "engine.start", "key.rotate"
  severity     TEXT NOT NULL DEFAULT 'info' CHECK (severity IN ('debug', 'info', 'warning', 'error', 'critical')),
  actor_id     UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  org_id       UUID REFERENCES public.orgs(id) ON DELETE SET NULL,
  resource_type TEXT,                   -- e.g. "project", "artifact", "engine_run"
  resource_id  TEXT,
  payload      JSONB NOT NULL DEFAULT '{}',
  ip_address   INET,
  user_agent   TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Audit log is never updated or deleted via RLS — append-only
ALTER TABLE public.audit_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "audit_org_admin_select" ON public.audit_events
  FOR SELECT USING (
    org_id IN (
      SELECT org_id FROM public.org_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- Only server-side service role may insert
-- (No INSERT policy = anon/authenticated cannot insert directly)

CREATE INDEX idx_audit_events_created_at ON public.audit_events(created_at DESC);
CREATE INDEX idx_audit_events_actor ON public.audit_events(actor_id);
CREATE INDEX idx_audit_events_org ON public.audit_events(org_id);
CREATE INDEX idx_audit_events_type ON public.audit_events(event_type);
CREATE INDEX idx_audit_events_severity ON public.audit_events(severity) WHERE severity IN ('warning', 'error', 'critical');
