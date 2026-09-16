# SEWA 2026 Production k6 Load Testing Suite

Comprehensive, production-grade load testing suite for the **SEWA 2026** platform (DTU Youth Innovation Challenge).

Built specifically for the SEWA architecture:
- **Frontend**: TanStack Start (React 19, Nitro SSR, Vite)
- **Backend**: Express, TypeScript, Prisma ORM, PostgreSQL (`citext`)
- **Target Deployment**: `http://10.50.0.80/` (configurable via `BASE_URL`)

---

## Table of Contents

1. [Overview & What is k6?](#1-overview--what-is-k6)
2. [Installation & Verification](#2-installation--verification)
3. [Architecture & Safety Guardrails](#3-architecture--safety-guardrails)
4. [Target Configuration](#4-target-configuration)
5. [Authentication & Test Accounts](#5-authentication--test-accounts)
6. [Test Scenarios & Execution](#6-test-scenarios--execution)
   - [Smoke Test](#smoke-test)
   - [Baseline Test](#baseline-test)
   - [Load Test](#load-test)
   - [Stress Test](#stress-test)
   - [Spike Test](#spike-test)
   - [Soak Test](#soak-test)
7. [Configuration Parameters](#7-configuration-parameters)
8. [Exporting Results](#8-exporting-results)
9. [Metrics Reference & Latency Percentiles](#9-metrics-reference--latency-percentiles)
10. [Concurrency Concepts: VUs vs RPS vs Real Users](#10-concurrency-concepts-vus-vs-rps-vs-real-users)
11. [Server-Side Monitoring Runbook](#11-server-side-monitoring-runbook)
12. [Writing a Formal Performance Report](#12-writing-a-formal-performance-report)

---

## 1. Overview & What is k6?

[k6](https://k6.io/) is an open-source, developer-centric performance testing tool built in Go. It executes test logic written in modern ES6 JavaScript within an embedded runtime (Sobek/Goja) and generates high-concurrency network traffic using goroutines.

Unlike legacy browser simulators or thread-based tools:
- **Ultra-lightweight footprint**: Generates thousands of requests per second on minimal CPU and RAM.
- **Developer-first scripting**: Test journeys are maintainable, modular JavaScript.
- **First-class thresholds & circuit breakers**: Automatically aborts tests if error rates spike or latency SLA breaks.

---

## 2. Installation & Verification

### Installation on Ubuntu / Debian

```bash
# 1. Ensure required tools are installed
sudo apt-get update
sudo apt-get install -y ca-certificates gnupg curl

# 2. Add k6 GPG key
sudo gpg -k
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg \
  --keyserver hkp://keyserver.ubuntu.com:80 \
  --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69

# 3. Add k6 repository
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | \
  sudo tee /etc/apt/sources.list.d/k6.list

# 4. Update and install k6
sudo apt-get update
sudo apt-get install -y k6
```

### Verifying Installation

Verify that k6 is installed and executable:

```bash
k6 version
```

Expected output:
```text
k6 v2.2.0 (or v0.5x.x) (..., go..., linux/amd64)
```

---

## 3. Architecture & Safety Guardrails

### Deliberately Excluded Endpoints

To ensure zero risk to data integrity on the live server, the test suite **never** touches:

| Endpoint | Method | Reason for Exclusion |
| :--- | :--- | :--- |
| `/api/register/:teamId/members/:memberId` | `DELETE` | **Destructive deletion**: Permanently deletes team members. |
| `/api/register/:teamId/submit` | `POST` | **Irreversible lock**: Permanently freezes team status (`submitted`). |
| `/api/register` & `/api/register/:id` | `POST` / `PATCH` | **Multipart disk writes**: Uploads physical ID files to server disk. |
| `/api/profile` | `PUT` | **Persistent mutations**: Bulk updates candidate KYC records. |
| `/api/contact` | `POST` | **Mail & DB flooding**: Sends SMTP emails and creates grievance rows; rate limited to 5/hr. |
| `/api/auth/signup` | `POST` | **Account pollution**: Triggers OTP emails; rate limited to 10/hr. |
| `/api/auth/otp/*` | `POST` | **SMTP abuse**: Generates OTP tokens and dispatches emails. |
| `/api/auth/password/*` | `POST` | **Password resets**: Generates reset links via email; rate limited. |

### Safe Tested Endpoints

The test suite exercises real-world read paths:
1. **Frontend SSR & Static**:
   - `/` (Home page)
   - `/about`, `/problem-statements`, `/guidelines`, `/events`, `/faq`, `/contact`, `/resources`
   - `/dtu_logo.png`, `/favicon.ico`, `/robots.txt`
2. **Backend Public APIs**:
   - `GET /api/health` (Tests database pool and PostgreSQL query response: `SELECT 1`)
   - `GET /api/announcements` (Tests Prisma ORM query and indexing on `announcements`)
3. **Backend Authenticated APIs (Optional)**:
   - `GET /api/auth/me` (Validates session and queries current user)
   - `GET /api/profile` (Queries applicant personal details)
   - `GET /api/register/me` (Queries team registration and roster)

---

## 4. Target Configuration

The target URL defaults to `http://10.50.0.80` and is completely configurable via the `BASE_URL` environment variable:

```bash
# Using the test runner script
BASE_URL=http://10.50.0.80 ./run.sh smoke

# Or running k6 directly
BASE_URL=http://10.50.0.80 k6 run scenarios/smoke.js
```

> **Warning**: Never run load tests against third-party public domains or unapproved hosts.

---

## 5. Authentication & Test Accounts

The SEWA 2026 backend protects candidate routes with an httpOnly session cookie (`sewa_session`).

### Rate Limit Consideration
`backend/src/middleware/rateLimiter.ts` limits `/api/auth/signin` to **10 requests per 15 minutes** per IP and email.
**VUs must never log in inside the test loop.**

### Supplying Authentication

The test suite supports two safe auth modes:

#### Option A: Direct Session Cookie (Recommended)
Log in via your browser, copy the `sewa_session` cookie value from the developer tools, and pass it via `K6_TOKEN`:

```bash
K6_TOKEN="s%3AeyJhbGciOi..." ./run.sh load
```

#### Option B: Automated Single Login in `setup()`
Provide a dedicated test account via `K6_USERNAME` and `K6_PASSWORD`. The suite will log in **exactly once** during the `setup()` phase and share the acquired cookie among all VUs:

```bash
K6_USERNAME="loadtest@dtu.ac.in" K6_PASSWORD="TestPassword123!" ./run.sh load
```

#### Option C: Anonymous Public Visitor Mode (Default)
If neither token nor credentials are provided, the suite executes the **Public Visitor Journey** (exercising SSR pages, static assets, problem statements, and public APIs).

---

## 6. Test Scenarios & Execution

All tests can be executed via `./run.sh <scenario>` or via direct `k6 run`.

### Smoke Test
- **Purpose**: Verify that connectivity, SSR rendering, and database health endpoints function under minimal load.
- **Traffic**: 1–2 VUs for 1 minute.
- **Command**:
  ```bash
  BASE_URL=http://10.50.0.80 ./run.sh smoke
  ```
- **Direct k6**:
  ```bash
  k6 run -e BASE_URL=http://10.50.0.80 scenarios/smoke.js
  ```

---

### Baseline Test
- **Purpose**: Measure steady-state performance under low traffic to establish baseline percentiles (p50, p90, p95, p99) and request throughput.
- **Traffic**: 10 VUs for 5 minutes.
- **Command**:
  ```bash
  BASE_URL=http://10.50.0.80 ./run.sh baseline
  ```
- **Direct k6**:
  ```bash
  k6 run -e BASE_URL=http://10.50.0.80 scenarios/baseline.js
  ```

---

### Load Test
- **Purpose**: Evaluate performance under realistic day-to-day traffic with a gradual stepped ramp:
  `10 VUs -> 50 VUs -> 100 VUs -> 250 VUs -> 500 VUs -> Cool-down`
- **Command**:
  ```bash
  BASE_URL=http://10.50.0.80 ./run.sh load
  ```
- **Configuring Max VUs**:
  ```bash
  LOAD_MAX_VUS=250 BASE_URL=http://10.50.0.80 ./run.sh load
  ```

---

### Stress Test
- **Purpose**: Identify the server's breaking point, concurrency ceiling, and degradation behavior.
- **Safety Circuit Breaker**:
  Automatically **aborts** if:
  - Total failure rate exceeds 10%
  - 5xx server errors exceed 5%
  - p95 latency exceeds 4000ms
- **Traffic**: Stepped progression up to `MAX_VUS` (Default conservative: 500 VUs).
- **Command**:
  ```bash
  BASE_URL=http://10.50.0.80 MAX_VUS=1000 ./run.sh stress
  ```

---

### Spike Test
- **Purpose**: Simulate sudden, dramatic bursts in visitor traffic (e.g., social media announcements or deadline surges) and verify how quickly the application recovers.
- **Traffic**: 10 VUs -> Sudden spike to 500 VUs in 30s -> Hold 1m -> Rapid recovery to 10 VUs.
- **Command**:
  ```bash
  BASE_URL=http://10.50.0.80 ./run.sh spike
  ```
- **Configuring Peak**:
  ```bash
  SPIKE_PEAK_VUS=1000 BASE_URL=http://10.50.0.80 ./run.sh spike
  ```

---

### Soak Test
- **Purpose**: Detect memory leaks, slow database connection pool exhaustion, file descriptor leaks, and latency drift over an extended period.
- **Traffic**: 30 VUs steady for 30 minutes (configurable via `SOAK_DURATION`).
- **Command**:
  ```bash
  BASE_URL=http://10.50.0.80 SOAK_DURATION=30m ./run.sh soak
  ```

---

### Scale 10K Test (10,000 Direct Virtual Users)
- **Purpose**: Massive capacity stress test scaling to 10,000 concurrent parallel threads.
- **Progression**:
  `1,000 VUs -> 2,500 VUs -> 5,000 VUs -> 7,500 VUs -> 10,000 VUs -> Cool-down`
- **Memory Protection**: Utilizes `discardResponseBodies: true` to prevent allocating gigabytes of response payloads in client RAM.
- **Safety Circuit Breaker**: Automatically aborts if failure rate > 10% or p95 latency > 5000ms.
- **Command**:
  ```bash
  BASE_URL=http://10.50.0.80 ./run.sh scale10k
  ```
- **Direct k6**:
  ```bash
  BASE_URL=http://10.50.0.80 k6 run scenarios/scale-10k.js
  ```

---

### Arrival Rate 10K Test (10,000 Real-World Concurrent Visitors)
- **Purpose**: Open-model arrival rate scenario (`ramping-arrival-rate`) simulating 10,000 simultaneous active website visitors.
- **Concept**: Real human visitors do not click simultaneously every millisecond; with an average 5-second think time, 10,000 active visitors generate **2,000 completed user journeys / second**.
- **Efficiency**: Instead of locking 10,000 idle threads in memory, this dynamically utilizes an optimized pool of 500–3,000 active VUs. It delivers the exact traffic volume of 10,000 users while consuming under 3 GB of RAM on the generator laptop.
- **Progression**:
  `250/s -> 500/s -> 1,000/s -> 2,000/s (Hold) -> Ramp-down`
- **Command**:
  ```bash
  BASE_URL=http://10.50.0.80 ./run.sh arrival10k
  ```
- **Direct k6**:
  ```bash
  BASE_URL=http://10.50.0.80 k6 run scenarios/arrival-10k.js
  ```

---

### Tuning Ubuntu for 10,000 Concurrency

Before generating 10,000 concurrent user traffic from Linux, ensure OS socket and file limits are tuned:

```bash
# 1. Raise open file descriptors (mandatory for 10k connections)
ulimit -n 65535

# 2. Expand ephemeral port range to prevent socket exhaustion
sudo sysctl -w net.ipv4.ip_local_port_range="1024 65535"

# 3. Enable fast TCP connection reuse
sudo sysctl -w net.ipv4.tcp_tw_reuse=1

# 4. Increase socket backlog queue
sudo sysctl -w net.core.somaxconn=65535
```

---

## 7. Configuration Parameters

The following environment variables can be set to customize test parameters:

| Variable | Default | Description |
| :--- | :--- | :--- |
| `BASE_URL` | `http://10.50.0.80` | Target host |
| `K6_TOKEN` | `""` | Existing `sewa_session` cookie value |
| `K6_USERNAME` | `""` | Account email for single login in `setup()` |
| `K6_PASSWORD` | `""` | Account password for single login in `setup()` |
| `MAX_VUS` | `500` | Maximum VUs for stress test |
| `LOAD_MAX_VUS` | `500` | Maximum VUs for load test |
| `SPIKE_PEAK_VUS`| `500` | Peak VUs during spike test |
| `SOAK_VUS` | `30` | Steady VUs during soak test |
| `SOAK_DURATION`| `30m` | Duration of soak test |
| `THINK_TIME_MIN`| `1.0` | Minimum think-time in seconds between user steps |
| `THINK_TIME_MAX`| `3.0` | Maximum think-time in seconds between user steps |

---

## 8. Exporting Results

Each run automatically writes execution summaries to `load-testing/results/`:
- `<scenario>_<timestamp>.txt` (Clean text summary report)
- `<scenario>_<timestamp>.json` (Detailed machine-readable JSON data)

To export raw metric streams directly from k6:

```bash
# Export complete raw metric samples to JSON
BASE_URL=http://10.50.0.80 k6 run --out json=results/raw_metrics.json scenarios/load.js

# Export complete raw metric samples to CSV
BASE_URL=http://10.50.0.80 k6 run --out csv=results/raw_metrics.csv scenarios/load.js
```

---

## 9. Metrics Reference & Latency Percentiles

### Standard k6 Metrics

- `http_reqs`: Total count of HTTP requests generated.
- `http_req_duration`: End-to-end request duration from sending to receiving the response body.
  - `avg`: Arithmetic mean latency.
  - `min` / `med` / `max`: Minimum, median (p50), and maximum response times.
- `http_req_failed`: Fraction of requests that returned 4xx or 5xx HTTP statuses.
- `vus`: Current count of active virtual users.

### Custom Suite Metrics

- `sewa_page_duration_ms`: Latency of frontend SSR pages.
- `sewa_api_health_duration_ms`: Latency of database connectivity ping (`/api/health`).
- `sewa_api_announcements_duration_ms`: Latency of public announcements fetch.
- `sewa_api_auth_duration_ms`: Latency of authenticated API calls.
- `sewa_5xx_rate`: Rate of catastrophic HTTP 500/502/503/504 errors.
- `sewa_429_rate`: Rate of rate-limited requests.
- `sewa_successful_journeys`: Count of end-to-end user journeys that passed all checks.

### How to Interpret Latency Percentiles

- **Average (Mean)**: Often misleading because a small number of severe outliers skew the average upward.
- **p50 (Median)**: The response time that 50% of your users experience. Represents typical performance.
- **p90**: 90% of requests responded faster than this value. Useful for tracking upper-tier latency.
- **p95**: Standard industry SLA metric. 95% of users experience response times at or below this threshold.
- **p99**: The "tail latency". 1 in every 100 requests takes longer than this value. Critical for identifying database query queueing, garbage collection pauses, or thread starvation.

---

## 10. Concurrency Concepts: VUs vs RPS vs Real Users

- **Virtual Users (VUs)**: Parallel execution threads running the user journey script in a loop.
- **Think Time**: Real human users do not click buttons every millisecond; they read the page for 1–3 seconds before clicking the next link. The suite includes realistic think time (`randomThinkTime(1.0, 3.0)`).
- **Concurrent Users in Google Analytics vs k6 VUs**:
  - In analytics, "1,000 concurrent users" typically means 1,000 people with a browser tab open over a 5-minute window, generating perhaps 10–20 requests per minute each.
  - In k6, **1,000 VUs without think time** would generate **10,000–50,000 requests per second**, which could instantly crash a medium server.
  - With realistic think time (2 seconds average), **100 VUs ≈ 50 requests/sec**, equivalent to thousands of active simultaneous site visitors.

---

## 11. Server-Side Monitoring Runbook

While running tests against `http://10.50.0.80`, open a separate terminal to the server and monitor the following vital signs:

### 1. CPU & Memory Utilization
```bash
# View live CPU, memory, and load average
htop
```
- **Red Flag**: CPU load exceeding the number of CPU cores, or memory steadily climbing toward swap exhaustion.

### 2. Node.js Express Process Status
```bash
# If using pm2
pm2 monit
pm2 status

# If running directly under systemd
systemctl status sewa-backend
journalctl -u sewa-backend -f
```
- **Red Flag**: Node process restarting repeatedly due to Out-of-Memory (OOM).

### 3. PostgreSQL Database Connections
```bash
sudo -u postgres psql -d sewa2026 -c "
  SELECT count(*), state FROM pg_stat_activity GROUP BY state;
"
```
- **Red Flag**: Connection count reaching `max_connections` (PostgreSQL default 100), leading to `FATAL: remaining connection slots are reserved for non-replication superuser connections`.

### 4. Reverse Proxy / Nginx Logs
```bash
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```
- **Red Flag**: Presence of `502 Bad Gateway` or `504 Gateway Timeout` indicates the Node.js backend is dropping socket connections.

---

## 12. Writing a Formal Performance Report

After running the baseline and load tests, compile the results from `load-testing/results/` into a formal report:

### Report Template

```markdown
# SEWA 2026 Performance Test Report

**Date:** YYYY-MM-DD
**Target Environment:** http://10.50.0.80
**Test Type:** [Baseline / Load / Stress / Spike / Soak]

## Executive Summary
- **Result:** [PASSED / FAILED / WARNING]
- **Target Concurrency:** [X VUs]
- **Sustained Throughput:** [X reqs/sec]
- **Error Rate:** [0.X %]

## Key Latency Percentiles
| Endpoint / Operation | p50 (ms) | p90 (ms) | p95 (ms) | p99 (ms) | Success Rate |
| :--- | :--- | :--- | :--- | :--- | :--- |
| Homepage SSR (`/`) | ... | ... | ... | ... | ... |
| Health Check (`/api/health`) | ... | ... | ... | ... | ... |
| Announcements (`/api/announcements`) | ... | ... | ... | ... | ... |
| Problem Statements (`/problem-statements`) | ... | ... | ... | ... | ... |

## Infrastructure Observations
- **Peak Server CPU:** [e.g. 45%]
- **Peak Memory:** [e.g. 1.2 GB]
- **Database Connection Pool:** [Peak X / 100 connections]
- **Bottlenecks Identified:** [e.g. None / Slow SSR compilation / DB locking]

## Recommendations
1. [e.g., Enable Redis caching for announcements]
2. [e.g., Increase PostgreSQL pool size]
```

