# Incident Prevention Baseline

Minimum controls that must remain active at all times.  
Verify quarterly or after any infrastructure change.

---

## 1. Secret Management

| Control | Implementation | Verified |
|---------|---------------|---------|
| No secrets in git history | gitleaks full-history scan passing | ☐ |
| No secrets in code | gitleaks pre-commit hook active | ☐ |
| No secrets in CI logs | GitHub Actions secrets masked | ☐ |
| Credentials in secret manager only | `.env.local` + GitHub Secrets | ☐ |
| `.env.example` contains only placeholders | Reviewed manually | ☐ |

## 2. Database Security

| Control | Implementation | Verified |
|---------|---------------|---------|
| RLS enabled on all public tables | SQL: `SELECT rowsecurity FROM pg_tables` | ☐ |
| Service role key used only in server-side code | Code review | ☐ |
| Anon key exposed only to frontend | Code review | ☐ |
| Database password not in any committed file | gitleaks scan | ☐ |
| Audit logging active | `db/migrations/005_audit_events.sql` | ☐ |

## 3. Authentication

| Control | Implementation | Verified |
|---------|---------------|---------|
| JWT_SECRET ≥ 64 chars random | `openssl rand -hex 64` | ☐ |
| JWT expiry ≤ 7 days | `JWT_EXPIRY=7d` in env | ☐ |
| Session secrets rotated post-breach | `credential-rotation-checklist.md` | ☐ |
| Supabase Auth email verification enabled | Supabase Dashboard | ☐ |

## 4. API Security

| Control | Implementation | Verified |
|---------|---------------|---------|
| Rate limiting on all routes | `src/api/middleware/ratelimit.js` | ☐ |
| Auth middleware on protected routes | `src/api/middleware/auth.js` | ☐ |
| Input validation at boundaries | Zod schemas on all route handlers | ☐ |
| CORS restricted to known origins | `server.js` CORS config | ☐ |
| Health endpoint exposes no sensitive data | `src/api/routes/health.js` | ☐ |

## 5. Provider Adapter Safety

| Control | Implementation | Verified |
|---------|---------------|---------|
| LiteLLM 1.82.7 / 1.82.8 NOT installed | `npm audit` + `package.json` check | ☐ |
| API keys passed via env vars only | No hardcoded keys in adapters | ☐ |
| Provider errors do not expose keys in logs | Adapter error handlers tested | ☐ |
| Ollama endpoint validated before use | `OllamaAdapter.isAvailable()` probe | ☐ |

## 6. Dependency Security

| Control | Implementation | Verified |
|---------|---------------|---------|
| `npm audit` runs in CI | `.github/workflows/security-scan.yml` | ☐ |
| No high/critical vulnerabilities unfixed | CI security scan passing | ☐ |
| License compatibility verified | `license-checker` in CI | ☐ |
| Dependabot or equivalent enabled | GitHub repo settings | ☐ |

---

## Quarterly Review Cadence

- Run `gitleaks detect --source . --log-opts='--all' -v`
- Run `npm audit`
- Review all GitHub Secrets — remove stale entries
- Rotate any credential older than 90 days
- Log review completion in `SECURITY_RESET_LOG.md`
