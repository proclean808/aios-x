-- Migration: 001_orgs
-- Organizations — top-level billing and access boundary

CREATE TABLE IF NOT EXISTS public.orgs (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug         TEXT NOT NULL UNIQUE,
  name         TEXT NOT NULL,
  plan         TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'founder', 'studio', 'enterprise')),
  owner_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.orgs ENABLE ROW LEVEL SECURITY;

-- Members see their own orgs; owners manage them
CREATE POLICY "org_select" ON public.orgs
  FOR SELECT USING (
    id IN (
      SELECT org_id FROM public.org_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "org_owner_all" ON public.orgs
  FOR ALL USING (owner_id = auth.uid());

-- Membership join table
CREATE TABLE IF NOT EXISTS public.org_members (
  org_id    UUID NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  user_id   UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role      TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (org_id, user_id)
);

ALTER TABLE public.org_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "member_select" ON public.org_members
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "member_owner_manage" ON public.org_members
  FOR ALL USING (
    org_id IN (
      SELECT id FROM public.orgs WHERE owner_id = auth.uid()
    )
  );

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER orgs_updated_at
  BEFORE UPDATE ON public.orgs
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
