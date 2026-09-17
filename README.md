# SEWA 2026

DTU Youth Innovation Challenge registration portal. Node/Express/Prisma
backend, TanStack Start (React 19) frontend.

## Stack

Backend: Express, TypeScript, Prisma + PostgreSQL, Zod, JWT (httpOnly
session cookie), bcrypt, nodemailer (email OTP), pino logging,
express-rate-limit.

Frontend: TanStack Start, TanStack Router, React 19, Tailwind CSS v4,
shadcn/Radix UI, Vite, TanStack Query.

## Prerequisites

- Node.js and npm
- PostgreSQL, running locally or reachable via connection string
- An SMTP provider that will actually deliver mail (see the SMTP section
  below - most marketing/newsletter tools will not work for this)

## Repository layout

```
backend/     Express API, Prisma schema, migrations
frontend/    TanStack Start app
```

## 1. Database setup

Create a database and a role that can create databases (Prisma's
`migrate dev` needs `CREATEDB` for its shadow database):

```bash
sudo -u postgres psql
```

```sql
CREATE DATABASE sewa2026;
CREATE USER sewa_app WITH PASSWORD '<generate-a-strong-password>';
ALTER USER sewa_app CREATEDB;
GRANT ALL PRIVILEGES ON DATABASE sewa2026 TO sewa_app;
\c sewa2026
GRANT ALL ON SCHEMA public TO sewa_app;
\q
```

Do not manually run `CREATE EXTENSION citext` - the Prisma schema
declares it and will create it during migration. Creating it by hand
first causes a "drift detected" error on the next `migrate dev` because
Prisma's migration history won't account for it.

Use real credentials of your own choosing; the above is just an example
matching the values used during initial setup of this project.

## 2. Backend environment

```bash
cd backend
cp .env.example .env
```

Fill in `.env`:

```
NODE_ENV=development
PORT=4000
CLIENT_ORIGIN=http://localhost:8080

DATABASE_URL=postgresql://sewa_app:<strong-password>@localhost:5432/sewa2026?schema=public

JWT_SECRET=<32+ random characters - generate with `openssl rand -base64 48`>
JWT_EXPIRES_IN=7d
COOKIE_NAME=sewa_session

OTP_LENGTH=6
OTP_EXPIRY_MINUTES=10
OTP_MAX_ATTEMPTS=5
OTP_RESEND_COOLDOWN_SECONDS=60
OTP_CLEANUP_RETENTION_MINUTES=20

SMTP_HOST=...
SMTP_PORT=587
SMTP_USER=...
SMTP_PASS=...
SMTP_FROM="SEWA 2026 <no-reply@sewa2026.dtu.ac.in>"
```

`CLIENT_ORIGIN` must exactly match the origin the frontend runs on. CORS
is locked to this single origin with credentials enabled.

### SMTP

OTP emails are sent through nodemailer over SMTP. This needs a real
transactional email provider - most email marketing/newsletter tools
(built for bulk campaigns) either block or flag OTP-style auth email as
abuse.

Brevo's transactional email product works and has a usable free tier:

1. Sign up at brevo.com
2. Settings → SMTP & API → SMTP, to get the SMTP login
3. Generate an SMTP key (this is the password - separate from your
   account login password)
4. Settings → Senders & IP → Senders - verify the address you put in
   `SMTP_FROM`, or Brevo will reject sends with "sender not valid"
5. Settings → Security → Authorized IPs - Brevo blocks sending from
   IPs it doesn't recognize by default; authorize your current IP
   (`curl ifconfig.me` to find it) or you'll see `525 Unauthorized IP
   address` on send

For pure local testing without touching real domains, Mailtrap's sandbox
SMTP is a faster alternative - it captures mail in a fake inbox instead
of sending it anywhere.

## 3. Run the migration

```bash
cd backend
npx prisma migrate dev --name init
npx prisma generate
```

If this reports "Drift detected" on a database you've touched manually
(e.g. created the `citext` extension by hand), run `npx prisma migrate
reset` first, then `migrate dev --name init` again.

## 4. Frontend environment

```bash
cd frontend
cp .env.example .env
```

```
VITE_API_URL=http://localhost:4000
```

Must point at wherever the backend is actually running.

## 5. Run both servers

```bash
# terminal 1
cd backend
npm run dev        # http://localhost:4000

# terminal 2
cd frontend
npm run dev        # http://localhost:8080
```

If `npm run dev` in the backend fails with `unable to determine transport
target for "pino-pretty"`, install it:

```bash
npm install --save-dev pino-pretty
```

It's a dev-only dependency for readable console logs; production
(`NODE_ENV=production`) doesn't use it.

## Verifying the setup

1. Open `http://localhost:8080/signup`, submit the form
2. Check the inbox you signed up with for the OTP email
3. Enter the code - this signs you in and sets the session cookie
4. Go to `/team-register` and submit a full team, with a different
   email per member (the leader is auto-added as the first member
   server-side, so reusing the leader's email for another member will
   silently fail to register that member - the form validates against
   this before submit)

## API surface

```
POST /api/auth/signup
POST /api/auth/otp/send
POST /api/auth/otp/verify
POST /api/auth/signin
POST /api/auth/signout
GET  /api/auth/me
POST /api/auth/password/forgot
POST /api/auth/password/reset

GET  /api/profile                              current user + candidate profile
PUT  /api/profile                              upsert the "Personal Details" step

POST /api/contact                              submit Contact Us / Grievance form (no auth)

POST   /api/register                           create team (leader = current user)
GET    /api/register/me                        current user's team + members
PATCH  /api/register/:teamId                   edit a draft team (409 once submitted)
POST   /api/register/:teamId/members           add a member
DELETE /api/register/:teamId/members/:memberId remove a member
POST   /api/register/:teamId/submit            lock and submit

GET  /api/health                               liveness + database connectivity
```

All `/api/register/*` and `/api/profile` routes require a signed-in,
email-verified user.

## Known gaps

- **Team registration is three sequential API calls** (create team, add
  each member, submit) rather than one transaction. A network failure
  partway through leaves a real draft team on the server. The frontend
  handles this by re-reading the team on retry and skipping members
  already added, so retrying is safe, but it isn't atomic. For a fully
  atomic version, add a single `POST /api/register/full` wrapping all
  three steps in one Prisma transaction.
- **Team size limits** (`TEAM_MIN_MEMBERS` / `TEAM_MAX_MEMBERS` in
  `backend/src/schemas/team.schema.ts`) are placeholders (2–6). Set
  these to the actual competition rule and update the frontend's size
  selector to match.
- **Theme and problem statement are free text**, not validated against
  a fixed list server-side. A crafted request can submit a value that
  isn't in the frontend's dropdown.
- **Rate limiter store is in-memory** (`express-rate-limit` default).
  Behind more than one backend instance, limits won't be shared across
  processes. Swap in `rate-limit-redis` before scaling horizontally.
- **Auth state resolves client-side only.** The session cookie lives on
  the API's origin and isn't forwarded during SSR, so protected pages
  briefly show a loading state before redirecting unauthenticated users.
- **Admin/jury review endpoints, member identity linking, and tests are
  not implemented.** `team.status` already has the states
  (`under_review`, `shortlisted`, `rejected`) to build review endpoints
  on top of.

## Production notes

- **Cookies**: `SameSite=Lax` works locally because both servers run on
  `localhost`. If the deployed frontend and API sit on different
  registrable domains, the browser will drop the session cookie on
  every request. Either host both under one domain (e.g. an `/api` path
  or an `api.` subdomain) or switch to `SameSite=None; Secure`.
- Set `NODE_ENV=production` and run `npx prisma migrate deploy` (not
  `migrate dev`) for production database changes.
