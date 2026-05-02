-- Migration: 004_artifacts
-- Artifacts — exported outputs from debate/BotCast engine runs
-- Stores transcript.json, scorecard.json, decision_memo.md references

CREATE TABLE IF NOT EXISTS public.artifacts (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id       TEXT NOT NULL,           -- engine run ID (e.g. "bc-1234abcd")
  project_id   UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  artifact_type TEXT NOT NULL CHECK (artifact_type IN ('transcript', 'scorecard', 'decision_memo', 'debug_log')),
  format       TEXT NOT NULL CHECK (format IN ('json', 'markdown', 'text')),
  storage_path TEXT,                    -- future: Supabase Storage path
  payload      JSONB,                   -- inline for small artifacts
  payload_text TEXT,                    -- inline text for markdown artifacts
  byte_size    INTEGER,
  stage_count  INTEGER,
  topic        TEXT,
  persona_ids  TEXT[],
  created_by   UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.artifacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "artifact_project_member_select" ON public.artifacts
  FOR SELECT USING (
    project_id IN (
      SELECT p.id FROM public.projects p
      JOIN public.workspaces w ON w.id = p.workspace_id
      JOIN public.org_members om ON om.org_id = w.org_id
      WHERE om.user_id = auth.uid()
    )
    OR created_by = auth.uid()
  );

CREATE POLICY "artifact_creator_insert" ON public.artifacts
  FOR INSERT WITH CHECK (created_by = auth.uid());

CREATE INDEX idx_artifacts_run_id ON public.artifacts(run_id);
CREATE INDEX idx_artifacts_project ON public.artifacts(project_id);
CREATE INDEX idx_artifacts_type ON public.artifacts(artifact_type);
CREATE INDEX idx_artifacts_created_at ON public.artifacts(created_at DESC);
