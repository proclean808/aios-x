-- Migration: 007_billing
-- Billing — Stripe subscription and usage tracking
-- Feature flag FEATURE_BILLING=false until activated

CREATE TABLE IF NOT EXISTS public.billing_subscriptions (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id                UUID NOT NULL UNIQUE REFERENCES public.orgs(id) ON DELETE CASCADE,
  stripe_customer_id    TEXT UNIQUE,
  stripe_subscription_id TEXT UNIQUE,
  stripe_price_id       TEXT,
  plan                  TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'founder', 'studio', 'enterprise')),
  status                TEXT NOT NULL DEFAULT 'active'
                          CHECK (status IN ('active', 'past_due', 'cancelled', 'trialing', 'incomplete')),
  current_period_start  TIMESTAMPTZ,
  current_period_end    TIMESTAMPTZ,
  cancel_at_period_end  BOOLEAN NOT NULL DEFAULT false,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.billing_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "billing_org_owner_select" ON public.billing_subscriptions
  FOR SELECT USING (
    org_id IN (
      SELECT org_id FROM public.org_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

CREATE TRIGGER billing_subscriptions_updated_at
  BEFORE UPDATE ON public.billing_subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Usage metering — track token / API call consumption per org per month
CREATE TABLE IF NOT EXISTS public.usage_events (
  id            BIGSERIAL PRIMARY KEY,
  org_id        UUID NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  run_id        TEXT,
  engine_type   TEXT,
  provider      TEXT,                -- openai / anthropic / gemini / ollama
  model         TEXT,
  tokens_input  INTEGER DEFAULT 0,
  tokens_output INTEGER DEFAULT 0,
  cost_usd      NUMERIC(10, 6) DEFAULT 0,
  period_month  TEXT NOT NULL,       -- "2026-04" format for easy bucketing
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.usage_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "usage_org_admin_select" ON public.usage_events
  FOR SELECT USING (
    org_id IN (
      SELECT org_id FROM public.org_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

CREATE INDEX idx_usage_org_period ON public.usage_events(org_id, period_month);
CREATE INDEX idx_usage_created_at ON public.usage_events(created_at DESC);
