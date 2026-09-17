#!/usr/bin/env bash
# Zero-downtime backend deploy on the SEWA VM.
# Usage (as sewa):  cd /home/sewa/sewa && ./deploy/deploy-backend.sh
set -euo pipefail
cd "$(dirname "$0")"
export SEWA_UID=$(id -u) SEWA_GID=$(id -g)
REPLICAS=(api-1:4001 api-2:4002 api-3:4003 api-4:4004)

wait_healthy() {  # $1 = port
  for _ in $(seq 1 30); do
    curl -fsS "http://127.0.0.1:$1/api/health" >/dev/null 2>&1 && return 0
    sleep 2
  done
  return 1
}

echo "==> pull"
git -C .. pull --ff-only origin master

echo "==> build images"
docker compose build api-1 migrate

echo "==> migrations"
docker compose run --rm migrate

echo "==> redis"
docker compose up -d redis

echo "==> rolling restart"
for r in "${REPLICAS[@]}"; do
  name=${r%%:*}; port=${r##*:}
  echo "   -> $name"
  docker compose up -d --no-deps --force-recreate "$name"
  if ! wait_healthy "$port"; then
    echo "!! $name did not become healthy; stopping rollout (other replicas still serve old code)"
    docker compose logs --tail 80 "$name"
    exit 1
  fi
done

docker image prune -f >/dev/null
echo "==> public check"
curl -fsS https://sewafirstryic.dtu.ac.in/api/health && echo
