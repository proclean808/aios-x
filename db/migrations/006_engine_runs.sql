-- Migration: 006_engine_runs
-- Engine runs — records of BotCast / OpenMythos debate executions

CREATE TABLE IF NOT EXISTS public.engine_runs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id          TEXT NOT NULL UNIQUE,  -- "bc-<8hex>" or "om-<8hex>"
  project_id      UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  engine_type     TEXT NOT NULL CHECK (engine_type IN ('botcast', 'openmythos', 'debate', 'pipeline')),
  status          TEXT NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'running', 'completed', 'failed', 'cancelled', 'checkpoint')),
  topic           TEXT NOT NULL,
  persona_ids     TEXT[] NOT NULL DEFAULT '{}',
  current_stage   TEXT,
  stage_outputs   JSONB NOT NULL DEFAULT '{}',  -- keyed by stage id
  judge_results   JSONB,
  synthesis_text  TEXT,
  total_tokens    INTEGER DEFAULT 0,
  total_cost_usd  NUMERIC(10, 6) DEFAULT 0,
  fallback_count  INTEGER DEFAULT 0,
  error_message   TEXT,
  checkpoint_data JSONB,               -- for restore-from-checkpoint
  started_by      UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  started_at      TIMESTAMPTZ,
  completed_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.engine_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "run_project_member_select" ON public.engine_runs
  FOR SELECT USING (
    project_id IN (
      SELECT p.id FROM public.projects p
      JOIN public.workspaces w ON w.id = p.workspace_id
      JOIN public.org_members om ON om.org_id = w.org_id
      WHERE om.user_id = auth.uid()
    )
    OR started_by = auth.uid()
  );

CREATE POLICY "run_project_member_insert" ON public.engine_runs
  FOR INSERT WITH CHECK (started_by = auth.uid());

CREATE POLICY "run_project_member_update" ON public.engine_runs
  FOR UPDATE USING (started_by = auth.uid());

CREATE TRIGGER engine_runs_updated_at
  BEFORE UPDATE ON public.engine_runs
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX idx_engine_runs_project ON public.engine_runs(project_id);
CREATE INDEX idx_engine_runs_status ON public.engine_runs(status);
CREATE INDEX idx_engine_runs_engine_type ON public.engine_runs(engine_type);
CREATE INDEX idx_engine_runs_created_at ON public.engine_runs(created_at DESC);
