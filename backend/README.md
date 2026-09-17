# SEWA 2026 Backend

Node + Express + TypeScript + PostgreSQL (via Prisma) backend for the SEWA 2026
registration portal.

## Flow

```
POST /api/auth/signup           -> create account (unverified)
POST /api/auth/otp/send         -> (re)send email OTP
POST /api/auth/otp/verify       -> verify OTP, activates account, sets session cookie
POST /api/auth/signin           -> sign in, sets session cookie
POST /api/auth/signout          -> clear session
GET  /api/auth/me               -> current user
POST /api/auth/password/forgot  -> send a password-reset OTP
POST /api/auth/password/reset   -> consume the OTP, set a new password

GET  /api/profile               -> current user + candidate profile (null until saved)
PUT  /api/profile               -> full-replace upsert of the "Personal Details" step

POST /api/contact                -> submit the public Contact Us / Grievance form (no auth)

POST   /api/register                           -> create team (leader = current user)
GET    /api/register/me                        -> current user's team + members
PATCH  /api/register/:teamId                   -> edit a draft team's name/institute/theme/PS
POST   /api/register/:teamId/members           -> add a member (no account required)
DELETE /api/register/:teamId/members/:memberId -> remove a member
POST   /api/register/:teamId/submit            -> lock and submit the team

GET  /api/health                -> liveness + database connectivity
```

All `/api/register/*` and `/api/profile` routes require a signed-in,
**email-verified** user.

## Setup

```bash
npm install
cp .env.example .env   # fill in real values - see below
npx prisma migrate dev
npm run dev
```

### Required env vars (see `.env.example`)

- `DATABASE_URL` - Postgres connection string. Needs the `citext` extension
  (`CREATE EXTENSION IF NOT EXISTS citext;` - Prisma's `postgresqlExtensions`
  preview feature declares this in `prisma/schema.prisma`, but you may need
  DB-level permission to create extensions depending on your host).
- `JWT_SECRET` - 32+ random characters. Generate with
  `openssl rand -base64 48`.
- `SMTP_*` - real SMTP credentials for sending OTP emails. For a govt
  deployment, use an institutional or verified transactional-email provider
  (not a personal Gmail account) so deliverability and SPF/DKIM are sane.
- `CLIENT_ORIGIN` - exact origin of the frontend (e.g.
  `https://sewa2026.dtu.ac.in`). CORS is locked to this one origin with
  credentials enabled.

## Security and deployment notes

- Rate limiting is backed by Redis in the deployed architecture. Authentication
  limiters fail closed when Redis is unavailable; do not replace them with
  per-process in-memory state when running multiple backend replicas.
- Privileged accounts are not auto-created by application startup and no
  default administrator password exists in source. Provision an administrator
  explicitly with the supported promotion/invite flow.
- Team ID cards are private files. They are not served from the public
  `/uploads` root. Access is restricted to the team leader and privileged
  administrative roles through the authenticated API.
- Public resource endpoints return only active/published content. The
  `?all=true` view requires `SUPER_ADMIN` or `RESOURCE`.
- Resource images are restricted to JPEG/PNG/WebP/GIF and validated against
  their file signatures. SVG is intentionally not accepted.
- Team ID-card uploads are restricted to PDF/JPEG/PNG, with size, multipart,
  filename, extension, MIME, and content-signature validation.

## What's deliberately NOT here yet

- **Admin/review endpoints** - nothing here handles jury review,
  shortlisting, or exporting registrations. `team.status` already has the
  states (`under_review`, `shortlisted`, `rejected`) for this to build on.
- **Member identity linking** - if a team member (added as plain data) later
  signs up with a matching email, nothing auto-links their `TeamMember.userId`.
  Intentional per the design discussion - auto-linking on email match isn't
  safe identity verification for a govt system. Build an explicit
  invite/claim-token flow if you want members to later access their own
  team's data.
- **Contact form attachments** - the frontend still shows a file picker, but
  `POST /api/contact` only accepts a small JSON body (`express.json({ limit:
  "20kb" })`, no multipart middleware). A selected file is never uploaded;
  the UI now says so instead of silently dropping it. Add `multer` (or
  equivalent) plus S3/disk storage if attachments need to actually work.
- **Tests** - the source snapshot does not include a generated dependency
  lockfile or `node_modules`. Run the verification commands below after
  installing dependencies.

## Verifying before you deploy

`prisma generate` couldn't fully complete in the sandbox this was built in
(no network access to Prisma's engine binaries), so the Prisma-generated
enum/model types (`OtpPurpose`, `TeamMember`, etc.) weren't present during
typecheck here. Run `npx prisma generate` locally - you should get a clean
`npx tsc --noEmit`.
