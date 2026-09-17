# One-time cutover: systemd backend -> Docker replicas behind Nginx

Frontend, PostgreSQL, Certbot, Cloudflare: **unchanged**.
The old `sewa-backend.service` stays installed as the rollback path.

## 0. Check the VM (on the VM)

```bash
nproc                # replicas ≈ nproc - 1 (leave a core for Postgres + frontend), min 2
free -h              # each replica ~150–250 MB
id -u sewa; id -g sewa
sudo -u postgres psql -c "show max_connections;"
```

6 cores → 4 replicas. Prisma's default pool is `2 × nproc + 1` = 13 per replica.
Append `&connection_limit=10` to `DATABASE_URL` in `backend/.env`
(40 connections normally, 50 during a rolling deploy; Postgres default max is 100).

## 1. Code (on your dev machine)

Copy `backend/` files from this kit over the repo, then:

```bash
cd backend
npm i redis rate-limit-redis
npx prisma generate && npx tsc --noEmit
git add -A && git commit -m "Docker + multi-replica backend" && git push
```

Copy `deploy/` into the repo root too and commit it.

## 2. Install Docker (on the VM)

```bash
sudo apt-get update
sudo apt-get install -y docker.io docker-compose-v2
sudo usermod -aG docker sewa     # log out and back in
docker compose version
```

If Docker Hub pulls are blocked on the DTU network, check with the DTU network team.

## 3. Build and start (on the VM) — Nginx still points at :4000

```bash
cd /home/sewa/sewa
git stash push -m "server-local changes" && git pull --ff-only origin master && git stash pop
cd deploy
export SEWA_UID=$(id -u) SEWA_GID=$(id -g)
docker compose config >/dev/null          # validates backend/.env parsing too
docker compose build api-1 migrate
docker compose run --rm migrate           # should say "No pending migrations"
docker compose up -d redis api-1 api-2 api-3 api-4
docker compose ps                         # all "healthy"
for p in 4001 4002 4003 4004; do curl -s 127.0.0.1:$p/api/health; echo; done
ss -lntp | grep -E ':(4001|4002|4003|4004|6379)\b'   # must be 127.0.0.1 only
```

## 4. Real client IPs through Cloudflare

```bash
sudo tail -5 /var/log/nginx/access.log    # first column: Cloudflare IPs?
sudo ./nginx/update-cloudflare-realip.sh
# if first column was a DTU address instead:
# sudo EXTRA_TRUSTED="that.address" ./nginx/update-cloudflare-realip.sh
```

## 5. Switch Nginx (upstream + rate limits + announcements cache)

```bash
SITE=/etc/nginx/sites-available/<your-site>
sudo cp $SITE ~/nginx-site.backup.$(date +%F)

sudo cp nginx/sewa-upstream.conf /etc/nginx/conf.d/
sudo cp nginx/sewa-limits.conf   /etc/nginx/conf.d/
sudo cp nginx/sewa-proxy.conf    /etc/nginx/snippets/
sudo nano $SITE      # in the 443 server block, replace `location /api/` and
                     # `location /` with nginx/sewa-site-locations.snippet
sudo nginx -t && sudo systemctl reload nginx
```

Verify:

```bash
curl -i https://sewafirstryic.dtu.ac.in/api/health
# cache: second call within 30s should say X-Cache: HIT
curl -sI https://sewafirstryic.dtu.ac.in/api/announcements | grep -i x-cache
curl -sI https://sewafirstryic.dtu.ac.in/api/announcements | grep -i x-cache
# rate limit: expect a run of 200s then 429s
for i in $(seq 1 80); do curl -s -o /dev/null -w "%{http_code} " https://sewafirstryic.dtu.ac.in/api/health; done; echo
sudo tail -f /var/log/nginx/error.log | grep "limiting requests"
```

Then do a real signup + team registration with an ID card upload.

## 6. Retire the systemd backend

```bash
sudo systemctl stop sewa-backend
sudo systemctl disable sewa-backend
```

Docker's `restart: unless-stopped` brings the replicas back after a reboot.

## Rollback (≈30 seconds)

```bash
sudo systemctl start sewa-backend
# in /etc/nginx/conf.d/sewa-upstream.conf: comment 4001–4004, uncomment 4000
# (or restore ~/nginx-site.backup.* to also drop the limits and cache)
sudo nginx -t && sudo systemctl reload nginx
```

## Day-to-day

| Task | Command |
|---|---|
| Deploy backend | `./deploy/deploy-backend.sh` |
| Logs (all replicas) | `docker compose -f deploy/docker-compose.yml logs -f --tail 100` |
| One replica | `docker compose -f deploy/docker-compose.yml logs -f api-2` |
| Status | `docker compose -f deploy/docker-compose.yml ps` |
| Restart one | `docker compose -f deploy/docker-compose.yml restart api-2` |

Uploads remain at `/home/sewa/sewa/backend/uploads/id-cards` (bind-mounted),
so existing `id_card_path` values in the database stay valid.



