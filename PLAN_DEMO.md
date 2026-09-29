# EduTribe: Demo-First Plan

> Goal: a live demo where **every feature you show actually works**, and everything else is either skipped or clearly faked. Save as `docs/PLAN_DEMO.md`. Agents should read it before each task and work on one step at a time.

## 1. The demo story (this is the spec)

One 5-minute walkthrough. If a feature isn't in this story, don't build it.

| # | Who | What happens on screen | Must be real? |
|---|---|---|---|
| 1 | Applicant | Fills the eligibility form and sees all 5 schemes **ranked**, with Eligible / Partial / Not eligible, failed conditions and an AI explanation | Yes |
| 2 | Applicant | Clicks **Start Application** (pre-filled), uploads an **income certificate** | Yes |
| 3 | System | Document shows "Processing → Verified / Needs review" after OCR; extracted income vs declared income is shown | Yes (one document type) |
| 4 | Institute Officer | Logs in, sees only their institute's queue, opens the application, sees extracted vs declared values, **approves or requests resubmission** with a remark | Yes |
| 5 | Applicant | Sees the status change and an **alert** (email or in-app notification) | Yes (email or in-app; SMS can be logged) |
| 6 | Ministry Admin | Logs in, sees charts update, filters, **approves**, opens the **audit log** showing every step | Yes |

## 2. Scope decisions

### Build for real
- Login for 3 roles (JWT) with role-based routes and permissions
- Rules engine on the backend (port of `eligibilityEngine.js`) with the missing conditions and ranking
- Application workflow: `DRAFT → SUBMITTED → OFFICER_VERIFIED / RESUBMIT_REQUESTED → MINISTRY_APPROVED / REJECTED`
- Institute Officer dashboard (new)
- Income certificate upload + OpenCV + OCR + cross-check
- AI explanation from the backend (server-side key, template fallback)
- Audit log (append-only) shown in the Admin UI
- One alert channel that actually fires (email via SMTP sandbox like Mailtrap, or in-app notification feed)

### Simplify (works, but cheaper than the diagram)
| Diagram part | Demo version |
|---|---|
| PostgreSQL | Postgres in Docker if it's quick, otherwise **SQLite** (nobody sees the difference) |
| Celery + Redis | Run OCR **synchronously in a background thread**, or Celery only if it's already working. Frontend polls the document status |
| File storage | Local `media/` folder |
| Application statuses | Shorten to the 6 states above (drop `DISBURSED`, `DOC_VERIFICATION`) |

### Fake or skip (be upfront in the pitch)
| Item | What to do |
|---|---|
| External systems box | Show one **"Government verification (mock)"** adapter returning fixed JSON, called during officer review. Say "plug-and-play, mocked for demo" |
| SMS | Log to console and show it in the in-app notification feed. Say "MSG91 integration ready" only if it's true |
| Multilingual | Skip, or add a single Hindi toggle on the AI explanation if time remains |
| OCR for other documents | Skip. Income certificate only |
| Rate limiting, extensive tests | Skip. Keep tests only for the rules engine |

## 3. Build order (4 days)

### Day 1: Backend skeleton, auth, audit
- [ ] Move Vite app to `/frontend`; create `/backend` (Django, DRF, simplejwt, cors-headers)
- [ ] Custom User with `role` (`APPLICANT | INSTITUTE_OFFICER | MINISTRY_ADMIN`) and `institute` FK for officers
- [ ] Endpoints: `POST /auth/login`, `GET /auth/me`
- [ ] Permission classes; officers only see their institute's applications
- [ ] `AuditLog` model (append-only) + helper `log(actor, action, entity, before, after)`
- [ ] **Seed command:** 1 admin, 2 officers (different institutes), 5 applicants, ~15 sample applications across statuses
- [ ] Frontend: `AuthContext`, axios instance, login page, route guards from `/auth/me`

**Done when:** three seeded logins land on the right dashboards, and a wrong role gets blocked.

### Day 2: Rules engine and eligibility flow
- [ ] Load `scheme_rules.json` and the 252 institutes into the DB (`load_schemes` command)
- [ ] Port the evaluator to `rules_engine/evaluator.py`, tests first using golden cases from the JS engine
- [ ] Add the missing conditions: ST certificate, recognized institute, QS Top 1000 exception, management quota, domicile
- [ ] Ranking: fraction of conditions met, then benefit value
- [ ] `POST /eligibility/evaluate`, `GET /schemes`, `GET /institutes?q=`
- [ ] Extend the eligibility form with the new fields; results sorted by rank with failing conditions
- [ ] `POST /ai/explain` on the backend with template fallback; remove the browser-side Gemini key

**Done when:** the eligibility page runs entirely off the backend and matches the old verdicts on your test profiles.

### Day 3: Application workflow, documents, officer dashboard
- [ ] Applications API: create from eligibility result, `mine`, `submit`
- [ ] Officer API: list queue (filtered by institute), `verify` with `approve | request_resubmission | reject` and a mandatory remark
- [ ] Admin API: list with filters, `PATCH status`, `GET /analytics/summary`, `GET /audit`
- [ ] Every transition writes an `AuditLog` row and an `ApplicationStatusHistory` row
- [ ] Document upload (`POST /applications/{id}/documents`), MIME and size checks
- [ ] `process_document`: OpenCV (grayscale, denoise, deskew, threshold) → Tesseract → regex for income amount and name → compare with declared values → `PASSED | NEEDS_REVIEW | FAILED`
- [ ] **Prepare 2 sample certificates** (one matching, one mismatching) so the demo is reliable
- [ ] Frontend: `InstituteOfficerDashboard.jsx` (queue, detail, side-by-side extracted vs declared, approve/reject), wire the Applicant dashboard with live doc status, "Start Application" button

**Done when:** applicant → upload → OCR → officer approves works end to end with both sample certificates.

### Day 4: Alerts, admin, polish, rehearsal
- [ ] Notification model + trigger on submitted, resubmission requested, approved, rejected
- [ ] Email via SMTP sandbox **or** in-app notification bell (pick one; do the other only if time remains)
- [ ] Admin dashboard wired to `/analytics/summary`; keep existing Recharts; add an **Audit Log** page
- [ ] Mock "Government verification" adapter shown in the officer review panel
- [ ] Reset script: `python manage.py seed --reset` so you can restore clean demo data before every run
- [ ] Fix rough UI edges only on screens in the demo story
- [ ] Rehearse the full story 3 times, including a recovery plan for OCR failure
- [ ] README: setup, credentials, demo script

**Done when:** a clean reset followed by the full demo story runs without touching code.

## 4. Demo reliability checklist

- [ ] One-command start (`docker compose up` or a `make demo` script) tested on a **fresh clone**
- [ ] Demo credentials listed in the README and on a sticky note
- [ ] Sample certificates saved on the desktop, pre-tested
- [ ] All API keys in `.env`; app still works with the **template fallback** if the LLM or internet fails
- [ ] Backup: a 2-minute screen recording of the full flow in case the live demo breaks
- [ ] Seed data reset before every run

## 5. If you run out of time, cut in this order

1. Second alert channel (keep only one)
2. Mock government adapter (just mention it in the pitch)
3. Hindi toggle
4. Ranking weights (fall back to fraction of conditions met)
5. Celery (use a thread or synchronous OCR)
6. **Never cut:** roles and auth, backend rules engine, officer approval, OCR on one certificate, audit log page

## 6. Agent rules (`.agents/rules/project.md`)

```
- Read docs/PLAN_DEMO.md first. Work only on the day/step I name.
- Only build features in the demo story (section 1). Do not add extras.
- Stack: React 18 + Vite + Tailwind (frontend/), Django + DRF (backend/). SQLite is fine for local dev.
- scheme_rules.json is the source of truth for eligibility rules.
- Every status change and verification writes an AuditLog row.
- Officers may only access applications from their own institute.
- Never hardcode secrets; use .env and update .env.example.
- Do not rewrite existing UI pages; only change their data source.
- Run tests and the app before saying a step is done.
```

## 7. Prompts to paste

**Day 1**
```
Read docs/PLAN_DEMO.md. Do Day 1 only.
Move the Vite app to /frontend, create the Django backend, custom User with roles, JWT login and /auth/me, permission classes, AuditLog, and a seed command with 1 admin, 2 officers, 5 applicants and ~15 applications. Replace localStorage roles with AuthContext. Show the plan first.
```

**Day 2**
```
Read docs/PLAN_DEMO.md. Do Day 2 only.
Load schemes and institutes into the DB. Port eligibilityEngine.js to Python with tests first from golden cases, add the missing conditions and ranking, expose the evaluate/schemes/institutes endpoints, extend the eligibility form, and move AI explanations to the backend with a template fallback.
```

**Day 3**
```
Read docs/PLAN_DEMO.md. Do Day 3 only.
Build the application workflow APIs for all three roles with audit logging, the income-certificate upload with OpenCV + Tesseract processing and cross-checks, and the frontend: InstituteOfficerDashboard, live document status for the applicant, and a Start Application button. Use the two sample certificates in docs/samples to test.
```

**Day 4**
```
Read docs/PLAN_DEMO.md. Do Day 4 only.
Add notifications (email via SMTP sandbox plus an in-app feed), wire the Admin dashboard to /analytics/summary, add the Audit Log page and the mock government verification adapter, add a seed --reset command, and update the README with setup, credentials and a demo script. Then use the browser to walk the full demo story and report any failures.
```
