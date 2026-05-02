-- Migration: 003_projects
-- Projects — named debate/analysis configurations within a workspace

CREATE TABLE IF NOT EXISTS public.projects (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id   UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name           TEXT NOT NULL,
  engine_type    TEXT NOT NULL DEFAULT 'botcast' CHECK (engine_type IN ('botcast', 'openmythos', 'debate', 'pipeline')),
  config         JSONB NOT NULL DEFAULT '{}',
  status         TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'archived')),
  created_by     UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- Workspace members can read; admins/owners can write
CREATE POLICY "project_workspace_member_select" ON public.projects
  FOR SELECT USING (
    workspace_id IN (
      SELECT w.id FROM public.workspaces w
      JOIN public.org_members om ON om.org_id = w.org_id
      WHERE om.user_id = auth.uid()
    )
  );

CREATE POLICY "project_workspace_admin_write" ON public.projects
  FOR ALL USING (
    workspace_id IN (
      SELECT w.id FROM public.workspaces w
      JOIN public.org_members om ON om.org_id = w.org_id
      WHERE om.user_id = auth.uid() AND om.role IN ('owner', 'admin')
    )
  );

CREATE TRIGGER projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX idx_projects_workspace ON public.projects(workspace_id);
CREATE INDEX idx_projects_engine_type ON public.projects(engine_type);
