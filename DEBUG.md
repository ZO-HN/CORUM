# CORUM — Architecture & Debug Audit

Generated from a full read-through of `desktop/`, `web/`, `shared/`, and `supabase/migrations/2026052900_init.sql`. No prior architecture/debug documentation existed in the repo (only `README.md`, which is vision/status level).

## System Overview

Two React/Vite frontends (`desktop/` — Tauri-wrapped admin app, `web/` — public registration portal) share a `shared/` package (offline sync queue, AES-GCM local cache, hooks, types) and a single Supabase Postgres backend defined in one migration file. Both apps can run against Supabase directly, or fall back to a local-only mode (localStorage + seed data) when Supabase env vars are absent, with an offline mutation queue reconciling changes when connectivity returns.

## 1. Desktop App (`desktop/src`)

- `App.tsx` is a **2704-line monolith** — all state (~30+ `useState` hooks), all handlers (login, CRUD, CSV export, settings, user mgmt), and view switching via an `activeTab` string, not a router. No deep-linking, no code-splitting.
- Views live in `components/views/` (`YouthListView`, `YouthProfileDetail`, `SettingsView`, `AddYouthView`, `DocumentsView`, `AttendanceLoggerView`, `ProgramsEventsView`, `AnalyticsInsightView`) and receive large prop bags from `App.tsx` — prop-drilling instead of context.
- Supabase client in `lib/db.ts:1-32`; `isSupabaseConfigured` gates everything — if env vars are missing, `supabase` is `null` and the app silently drops into local-only/demo mode.
- Auth (`App.tsx:233-282`): checks `supabase.auth.getSession()` + `onAuthStateChange`; if no session, falls back to `localStorage['kk_desktop_auth']` with zero re-verification.
- ~~**Offline "login"** (`App.tsx:858-896`): when Supabase isn't configured, any cached user with role `'Admin'` is let in with **no password check at all**.~~ **Fixed** — offline login now requires a password verified against a locally stored SHA-256 hash (`desktop/src/lib/localAuth.ts`).
- Realtime subscriptions only cover `programs` and `registration_submissions` (`App.tsx:284-310`) — `youth_profiles`, `attendance`, `documents`, `system_config` are not live-synced across sessions.
- Config (barangay name, logo, puroks, kagawads) is duplicated into both `localStorage` and Supabase `system_config` — two sources of truth that can diverge.
- `db.ts` write paths (`saveProfile`, `saveProgram`, etc.) always mirror into local secureCache regardless of whether the Supabase write succeeded, and don't consistently reconcile server-generated IDs.
- Document management (`getDocuments`/`saveDocument`/`deleteDocument`, `db.ts:959-1050`) has **no offline queue fallback** — failures just log and the write is lost.
- Admin RPCs (`getSystemUsers`, `createSystemUser`, `deleteSystemUser`, `updateSystemUserRole`) have no offline path at all — Settings → user management is silently non-functional offline.
- ~~`createSystemUser` (`db.ts:889-908`) always sends the **hardcoded password `'Password123'`**~~ **Fixed** — a random per-account temp password is now generated client-side and shown once to the creating admin.

## 2. Web App (`web/src`)

- Same anti-pattern: `App.tsx` is a ~2000-line monolith, view switching via local state, no router, modals inlined instead of extracted.
- `lib/db.ts` is a near-duplicate of desktop's `db.ts` (see §6).
- Two-step registration form has real zod schemas (`page1Schema`, `page2Schema`, `App.tsx:23-83`) with `.refine()` for conditional fields — this is the real submit gate (`isPage1Valid`/`isPage2Valid` just call `schema.safeParse(...).success`).
- But per-field red-border UX (`getInputClass`) is a **separately hand-rolled** set of checks that only partially mirrors the zod rules (e.g. manual `email.includes('@')` duplicate of zod's `.email()`) — two sources of truth that can disagree and confuse users.
- Age input is `Number(e.target.value)` with no clamping (`App.tsx:1014`) — non-numeric input silently becomes `NaN` before zod catches it.
- `handleRegisterSubmit` (`App.tsx:333-401`) sends dead/legacy fields (`isPWD`, `bloodType: 'N/A'`, `isRegisteredSKVoter`, `isRegisteredNationalVoter`, `votedLastSKElection`) that don't exist in `shared/src/types.ts`'s `RegistrationSubmission['formData']` — the payload is cast `as any` to paper over the mismatch.
- Resident portal login (`verifyResidentAccess`, `web/src/lib/db.ts:463-608`) calls the server-side `verify_resident_access` RPC, but also has a **full local-storage fallback** that re-implements DOB-passcode matching client-side with no backend check at all when offline.
- ~~Passcode = date of birth in `MMDDYYYY` format — low entropy, guessable, and unthrottled at the DB layer.~~ **Partially fixed** — the RPC now locks out an email after 5 failed attempts in 15 minutes (`resident_access_attempts` table). The passcode itself is still low-entropy by design; consider a stronger second factor later.

## 3. Shared Package (`shared/src`)

- **`secureCache.ts`**: AES-GCM wrapper over localStorage. Key = `SHA-256(secret + sessionSalt)`, secret defaults to the **hardcoded fallback `'kk-default-dev-secret-change-me'`** (line 16) if `VITE_CACHE_SECRET` isn't set — and even when set, it's a Vite client env var baked into the shipped JS bundle, so it's obfuscation, not real confidentiality against anyone with app access.
- Code comment self-admits a weak KDF: single SHA-256 round instead of PBKDF2/iterated hashing (lines 29-30).
- Session salt lives in `sessionStorage`, so encrypted values become undecryptable after a browser/app restart — `decryptPayload` swallows the failure and silently falls back to seed/empty data, with no user-visible warning that cached data "disappeared."
- Legacy plaintext-JSON fallback path in `getSecureCache` — old unencrypted PII can persist indefinitely if never rewritten through `setSecureCache`.
- **`offlineSync.ts`**: ~~instantiates its **own** Supabase client independent of `desktop/lib/db.ts` and `web/lib/db.ts`~~ **Fixed** — all three now import a single shared client from `shared/src/supabaseClient.ts`.
- `enqueueMutation` IDs are `Math.random()`-based 6-digit numbers, not UUIDs — low entropy, theoretically collidable.
- LWW conflict resolution (`processQueueItem:159-267`) **silently discards** local changes when the remote is newer — only a `console.warn`, no UI surfacing, no audit trail of the discard.
- Sync-failure audit logs are written to local secureCache only, never pushed to the server `audit_logs` table — server-side admins never see sync failures from a given desktop instance.
- Mock-ID detection (`isMockId`, lines 202/229) checks for `PROG-`/`SUB-` string prefixes, but `saveProgram`/`saveSubmission` in `db.ts` now use `crypto.randomUUID()` — this looks like **dead code from an earlier ID scheme** that no longer matches current behavior.
- Sync engine auto-initializes on module import (lines 424-426) regardless of auth state — runs for unauthenticated users too.
- **`ErrorBoundary.tsx`**: logs to `console.error` only, no telemetry; reset just clears the error flag without addressing root cause.
- **`types.ts`**: `YouthProfile.otpCode` exists client-side even though `verify_resident_access` explicitly strips `otp_code` before returning — yet direct desktop `youth_profiles` selects **do** expose `otp_code` in plaintext to any authenticated staff/admin query.
- **`seeds.ts`**: demo data (with PII-shaped fake fields and external `googleusercontent.com` avatar URLs) is the **actual fallback dataset** served when Supabase is unreachable — a misconfigured production build would silently show fake profiles as if real, with no "demo mode" banner.

## 4. Supabase Schema (`supabase/migrations/2026052900_init.sql`)

Tables: `user_roles`, `youth_profiles`, `system_config`, `programs`, `attendance`, `announcements`, `documents`, `audit_logs`, `registration_submissions`, `resident_access_attempts`. RLS is enabled everywhere; policies are mostly sane (admin full access, staff select/insert/update, resident own-row select) but with real gaps:

- `registration_submissions` allows **fully open anonymous INSERT** (`rs_anon_insert`, `TO anon WITH CHECK (true)`) with only a partial CHECK constraint (email/firstName/lastName/age presence) and no uniqueness or rate limiting — trivially spammable/DoSable.
- ~~`verify_resident_access` RPC is `SECURITY DEFINER`, callable via the public anon key, with **no throttling or lockout**~~ **Fixed** — now enforces a 5-attempts/15-minute lockout per email via `resident_access_attempts`.
- ~~`create_system_user` RPC accepts a plaintext password param, and the desktop client always passes the literal `'Password123'`~~ **Fixed** — the client now generates a random temp password per account.
- `delete_system_user` does a raw `DELETE FROM auth.users` instead of going through Supabase's Admin API — risk of orphaned sessions/tokens.
- `announcements`/`programs`/`documents` SELECT policies grant all authenticated users (including `resident`) row access with no column-level restriction — residents can read internal fields like `programs.budget`.
- ~~Audit trigger `process_audit_logging()` captures full `row_to_json(NEW/OLD)`, including `otp_code`, into `audit_logs` in plaintext~~ **Fixed** — `otp_code` is now stripped from both `old_values`/`new_values` before insert. Other PII (name, contact info, etc.) is still captured verbatim, which is expected for an audit trail, but worth a follow-up review if any other single-purpose credential-like fields are added later.
- `attendance.program_id`/`youth_id` are `ON DELETE CASCADE` — hard-deleting a youth profile (permitted to admins) silently destroys their entire attendance history, even though the schema already supports soft-delete via `youth_profiles.status`.
- Missing indexes: `announcements` has none at all despite likely being sorted/filtered by `is_pinned`/`created_at`; `documents.file_type` is unindexed despite being filterable in the UI.
- The migration opens with `DROP TABLE ... CASCADE` — a destructive, non-idempotent "fresh install" script. There is only **one** migration file; any future schema change means editing this file directly, risking data loss on redeploy. No forward-migration history exists.

## 5. Tauri Config

- `tauri.conf.json` CSP: `connect-src` correctly scoped to `'self' https://*.supabase.co`. `img-src 'self' data: https://*` is **overly broad** — any HTTPS image origin is allowed, and `avatarUrl`/`barangayLogo` are arbitrary admin-supplied URLs, so this is effectively an open image-loading allowlist (tracking-pixel risk).
- `capabilities/default.json` grants only `core:default` — appropriately minimal, no filesystem/shell permissions.
- The "Documents" feature (`newDocUrl` state, `saveDocument(fileUrl: string, ...)`) appears to be **URL entry, not real file upload** — no Supabase Storage integration exists despite the feature name implying local file handling.

## 6. Cross-Cutting Issues

- ~~**Three independent Supabase client instances**~~ **Fixed** — consolidated into one singleton in `shared/src/supabaseClient.ts`, imported by `shared/src/offlineSync.ts`, `desktop/src/lib/db.ts`, and `web/src/lib/db.ts`.
- No `.env.example` in either `desktop/` or `web/` — a new dev has to reverse-engineer required var names from source, and a misconfigured deploy silently falls back to demo data or a known default cache secret rather than failing loudly.
- Error handling is almost entirely `console.error` + occasional `alert()` — most Supabase failures are invisible to end users (barangay staff who won't check devtools); success toasts sometimes fire unconditionally even when a write actually queued offline or failed.
- **`desktop/lib/db.ts` and `web/lib/db.ts` are hundreds of lines of copy-pasted mapping logic** (snake_case ↔ camelCase) instead of being lifted into `shared/` — and they've already drifted: desktop's `saveProfile`/`getProfiles` don't read/write `additional_email`, while web's `saveProfile` omits `facebook_link` — concrete, silent field-level data loss depending on which app writes a record.
- Form-validation helpers (`requiresWorkSpecify`, `getYouthAgeGroup`, skill-suggestion lists) are duplicated verbatim between the two `App.tsx` files rather than shared.

---

## Improvement / Action Plan

Ordered roughly by severity and blast radius. Items already addressed are struck through in the sections above.

### Security (do first)
1. ~~**Kill the offline admin-bypass login**~~ — **Done.**
2. ~~**Stop hardcoding `'Password123'`**~~ — **Done.**
3. ~~**Throttle `verify_resident_access`**~~ — **Done** (5 attempts / 15 min lockout). Still consider a stronger second factor than DOB long-term.
4. **Rate-limit / de-duplicate `registration_submissions` anonymous inserts** — add a uniqueness constraint on `form_data->>'email'` and basic per-IP/time throttling (Edge Function or CAPTCHA on the web form).
5. ~~**Redact sensitive fields from `audit_logs`**~~ — **Done** (`otp_code` stripped in `process_audit_logging()`).
6. **Stop shipping a hardcoded fallback cache secret** (`shared/src/secureCache.ts:16`) — fail loudly (refuse to start / show a config error) if `VITE_CACHE_SECRET` is unset, rather than silently using a publicly-known default. Document clearly that this is bundle-visible obfuscation, not real encryption-at-rest against a determined attacker.
7. **Use Supabase's Admin API for user deletion** instead of raw `DELETE FROM auth.users` to avoid orphaned sessions/tokens.
8. Tighten `tauri.conf.json`'s `img-src` to a real allowlist (or proxy/validate uploaded logo/avatar URLs) instead of `https://*`.

### Data integrity
9. Reconcile the desktop/web `db.ts` field-mapping drift (`facebook_link`, `additional_email`) by extracting one shared set of mapper functions into `shared/`.
10. Remove or fix the stale `PROG-`/`SUB-` mock-ID detection in `shared/src/offlineSync.ts` now that IDs are UUIDs — confirm whether this logic is dead and delete it, or update it to a real "is this a locally-generated record" check.
11. Surface LWW conflict discards to the UI/audit trail instead of a silent `console.warn` — at minimum log discarded conflicts to the server `audit_logs` table, not just local cache.
12. Add offline-queue fallback for document save/delete (`desktop/src/lib/db.ts:959-1050`) so failures aren't silently dropped.
13. Move the `attendance` FK cascade to a soft-delete-respecting pattern, or block hard-deleting a `youth_profiles` row that has attendance history (require archiving instead).
14. Add missing indexes (`announcements.is_pinned`/`created_at`, `documents.file_type`).

### Architecture / maintainability
15. Split both 2000+/2700-line `App.tsx` files into route-based modules with real state management (React Router + Context or a lightweight store like Zustand) — this is the change that makes most of the other fixes tractable to implement and test.
16. ~~Consolidate the three separate Supabase client instantiations into a single exported singleton in `shared/`~~ — **Done.**
17. Move duplicated business logic (`requiresWorkSpecify`, `getYouthAgeGroup`, skill lists, validation helpers) into `shared/`.
18. Reconcile the zod schema vs. hand-rolled `getInputClass` validation in the web app so there's one source of truth for field validity.
19. Clean up dead/legacy submission fields (`isPWD`, `bloodType`, `isRegisteredSKVoter`, etc.) that aren't in `shared/src/types.ts` — either add them to the schema properly or remove them from the payload.
20. Split the single destructive `2026052900_init.sql` migration into an initial migration plus incremental forward migrations, so schema changes don't require editing/re-running a `DROP TABLE CASCADE` script against a live database.

### Operational hygiene
21. Add `.env.example` files for both `desktop/` and `web/` listing required vars.
22. Replace silent `console.error`-only error handling with actual user-facing feedback (toast/banner) distinguishing "saved," "queued offline," and "failed" states — don't fire success toasts unconditionally.
23. Add a visible "Demo/Offline Mode" banner when Supabase isn't configured, so seed data is never mistaken for real records.
24. Wire `ErrorBoundary` to at least log to a remote/service endpoint (or Supabase table) in production, not just `console.error`.
