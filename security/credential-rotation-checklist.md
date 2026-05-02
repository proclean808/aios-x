# Credential Rotation Checklist — Gate 0

**Status:** MUST complete before Days 8–30 begin  
**Owner:** Project lead  
**Last reviewed:** <!-- fill in date -->

---

## P0 — Rotate All Credentials

Work through every row. Check the box only after the new key is active in production and the old key is revoked.

### AI Provider Keys

| Provider | Action | New Key In Vault | Old Key Revoked | Date |
|----------|--------|-----------------|-----------------|------|
| Anthropic | Rotate at console.anthropic.com → API Keys | ☐ | ☐ | |
| OpenAI | Rotate at platform.openai.com → API Keys | ☐ | ☐ | |
| Google Gemini | Rotate at aistudio.google.com → API Keys | ☐ | ☐ | |
| Groq | Rotate at console.groq.com → API Keys | ☐ | ☐ | |
| xAI Grok | Rotate at console.x.ai → API Keys | ☐ | ☐ | |

### Database & Auth

| Credential | Action | Done | Date |
|------------|--------|------|------|
| Supabase ANON_KEY | Supabase Dashboard → Settings → API → regenerate | ☐ | |
| Supabase SERVICE_ROLE_KEY | Same as above | ☐ | |
| JWT_SECRET | Generate: `openssl rand -hex 64` | ☐ | |
| SESSION_SECRET | Generate: `openssl rand -hex 64` | ☐ | |
| DATABASE_URL password | Supabase → Database → Reset password | ☐ | |

### Payment & Infrastructure

| Credential | Action | Done | Date |
|------------|--------|------|------|
| Stripe SECRET_KEY | dashboard.stripe.com → Developers → API Keys | ☐ | |
| Stripe WEBHOOK_SECRET | Re-register webhook endpoint after key rotation | ☐ | |
| SMTP password | Rotate at your email provider | ☐ | |
| Ngrok authtoken | dashboard.ngrok.com → Your Authtoken | ☐ | |

---

## P0 — Git History Audit

Run before adding any new credentials:

```bash
# 1. Install gitleaks if not present
bash scripts/install-hooks.sh

# 2. Scan full history
gitleaks detect --source . --log-opts='--all' -v

# 3. If leaks found in history — BFG Repo Cleaner:
#    java -jar bfg.jar --replace-text patterns.txt .git
#    git reflog expire --expire=now --all && git gc --prune=now --aggressive
#    git push --force-with-lease --all  ← coordinate with all contributors first

# 4. Re-scan after cleanup
gitleaks detect --source . --log-opts='--all' -v
```

**Key found in history = rotate it immediately, regardless of age.**

---

## P0 — Database RLS Verification

Run against Supabase SQL editor:

```sql
-- Verify RLS is enabled on all user-facing tables
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- Every row must show rowsecurity = true
-- If any show false: ALTER TABLE <name> ENABLE ROW LEVEL SECURITY;
```

---

## P0 — Environment Separation

- [ ] `.env.local` exists on every developer machine (never committed)
- [ ] CI/CD env vars set in GitHub Secrets (not hardcoded in workflows)
- [ ] Staging project uses separate Supabase project from production
- [ ] Production keys are never used in local development
- [ ] `.env.example` contains only placeholder values (gitleaks allowlisted)

---

## Gate 0 Sign-off

**All boxes above checked?**

- [ ] Yes — Gate 0 complete. Days 8–30 may begin.

**Signed:** ___________________  **Date:** ___________
