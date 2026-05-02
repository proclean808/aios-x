# Security Reset Log

Track all security events, rotations, and incidents in chronological order.  
New entries go at the TOP. Never delete entries — append only.

---

<!-- TEMPLATE — copy for each event:

## [DATE] [SEVERITY: P0/P1/P2] — [Short title]

**Trigger:** What caused this entry (routine rotation / incident / audit finding)  
**Scope:** What was affected  
**Action taken:**  
- [ ] Step 1  
- [ ] Step 2  
**Verified by:** Name / handle  
**Status:** OPEN / RESOLVED

---
-->

## [PENDING] Gate 0 — Initial Security Reset

**Trigger:** Project bootstrap — pre-existing credential exposure risk  
**Scope:** All AI provider keys, Supabase credentials, JWT secrets, Stripe keys  
**Action taken:** See `credential-rotation-checklist.md`  
**Verified by:** _(pending)_  
**Status:** OPEN

---

## Legend

| Severity | Meaning |
|----------|---------|
| P0 | Active exposure or suspected compromise — act within hours |
| P1 | High-risk finding — act within 24 hours |
| P2 | Routine rotation or low-risk finding — act within sprint |
