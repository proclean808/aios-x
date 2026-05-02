-- Seed data for local development
-- Run after all migrations. Requires a user to exist in auth.users.
-- Usage: psql $DATABASE_URL -f db/seed.sql

DO $$
DECLARE
  v_user_id  UUID;
  v_org_id   UUID;
  v_ws_id    UUID;
  v_proj_id  UUID;
BEGIN
  -- Use first user from auth.users (local dev only)
  SELECT id INTO v_user_id FROM auth.users LIMIT 1;

  IF v_user_id IS NULL THEN
    RAISE NOTICE 'No user found in auth.users — sign up first, then re-run seed';
    RETURN;
  END IF;

  -- Org
  INSERT INTO public.orgs (slug, name, plan, owner_id)
  VALUES ('demo-org', 'Demo Organization', 'founder', v_user_id)
  ON CONFLICT (slug) DO NOTHING
  RETURNING id INTO v_org_id;

  IF v_org_id IS NULL THEN
    SELECT id INTO v_org_id FROM public.orgs WHERE slug = 'demo-org';
  END IF;

  -- Membership
  INSERT INTO public.org_members (org_id, user_id, role)
  VALUES (v_org_id, v_user_id, 'owner')
  ON CONFLICT (org_id, user_id) DO NOTHING;

  -- Workspace
  INSERT INTO public.workspaces (org_id, name, slug, description, created_by)
  VALUES (v_org_id, 'BotCast Dev', 'botcast-dev', 'Local BotCast Arena development workspace', v_user_id)
  ON CONFLICT (org_id, slug) DO NOTHING
  RETURNING id INTO v_ws_id;

  IF v_ws_id IS NULL THEN
    SELECT id INTO v_ws_id FROM public.workspaces WHERE slug = 'botcast-dev';
  END IF;

  -- Project: BotCast AI Infrastructure Debate
  INSERT INTO public.projects (workspace_id, name, engine_type, config, status, created_by)
  VALUES (
    v_ws_id,
    'AI Infrastructure Debate — Seed',
    'botcast',
    '{
      "topic": "Is sovereign AI infrastructure a strategic necessity for enterprises in 2026?",
      "persona_ids": ["claude-skeptic", "venture-bull", "technical-bear", "market-analyst", "local-redteam", "talon-moderator"],
      "max_tokens_per_turn": 600,
      "checkpoint_stages": ["opening", "rebuttal", "cross_exam"]
    }',
    'draft',
    v_user_id
  )
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_proj_id;

  -- Billing subscription placeholder (free)
  INSERT INTO public.billing_subscriptions (org_id, plan, status)
  VALUES (v_org_id, 'founder', 'active')
  ON CONFLICT (org_id) DO NOTHING;

  RAISE NOTICE 'Seed complete — org: %, workspace: %, project: %', v_org_id, v_ws_id, v_proj_id;
END $$;
