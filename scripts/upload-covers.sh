#!/usr/bin/env bash
# Upload cover images from ragkeep/assets/covers to Supabase Storage.
#
# Usage:
#   bash scripts/upload-covers.sh                     # → local (default)
#   bash scripts/upload-covers.sh --destination staging
#   bash scripts/upload-covers.sh --destination production
#   bash scripts/upload-covers.sh --destination local
#
# Requires SUPABASE_SERVICE_ROLE_KEY in the environment or in the
# matching env file (envs/local, envs/staging, envs/local).
set -euo pipefail
cd "$(dirname "$0")/.."

DEST="local"
while [[ $# -gt 0 ]]; do
  case "$1" in
    --destination|-d) DEST="$2"; shift 2 ;;
    *) echo "Unknown arg: $1" >&2; exit 1 ;;
  esac
done

COVERS_DIR="../ragrun/ragkeep/assets/covers"
if [[ ! -d "$COVERS_DIR" ]]; then
  # Try absolute path
  COVERS_DIR="/Users/michael/Reniets/Ai/ragrun/ragkeep/assets/covers"
fi
if [[ ! -d "$COVERS_DIR" ]]; then
  echo "Error: covers directory not found" >&2
  exit 1
fi

# Resolve Supabase URL and service role key from env files
case "$DEST" in
  local)
    ENV_FILE="envs/local"
    ;;
  staging)
    ENV_FILE="envs/staging"
    ;;
  production)
    ENV_FILE="envs/local"  # production credentials from envs/local (has prod Supabase)
    # Actually we need a production env file. Fall back to eas.json values.
    ;;
  *)
    echo "Error: destination must be local, staging, or production" >&2
    exit 1
    ;;
esac

# Read SUPABASE_URL from env file or eas.json
get_supabase_url() {
  case "$DEST" in
    local)
      grep 'EXPO_PUBLIC_SUPABASE_URL' envs/local | head -1 | sed 's/.*=//' | tr -d '"' | tr -d "'"
      ;;
    staging)
      grep 'EXPO_PUBLIC_SUPABASE_URL' envs/staging | head -1 | sed 's/.*=//' | tr -d '"' | tr -d "'"
      ;;
    production)
      python3 -c "import json; d=json.load(open('eas.json')); print(d['build']['production']['env']['EXPO_PUBLIC_SUPABASE_URL'])"
      ;;
  esac
}

get_service_role_key() {
  # 1. Environment variable
  if [[ -n "${SUPABASE_SERVICE_ROLE_KEY:-}" ]]; then
    echo "$SUPABASE_SERVICE_ROLE_KEY"
    return
  fi
  # 2. From env file
  local key=""
  case "$DEST" in
    local)   key=$(grep 'SUPABASE_SERVICE_ROLE_KEY' envs/local 2>/dev/null | head -1 | sed 's/.*=//' | tr -d '"' | tr -d "'") ;;
    staging) key=$(grep 'SUPABASE_SERVICE_ROLE_KEY' envs/staging 2>/dev/null | head -1 | sed 's/.*=//' | tr -d '"' | tr -d "'") ;;
    production) key=$(grep 'SUPABASE_SERVICE_ROLE_KEY' envs/production 2>/dev/null | head -1 | sed 's/.*=//' | tr -d '"' | tr -d "'") ;;
  esac
  if [[ -n "$key" ]]; then
    echo "$key"
    return
  fi
  echo ""
}

SUPABASE_URL=$(get_supabase_url)
SRK=$(get_service_role_key)

if [[ -z "$SUPABASE_URL" ]]; then
  echo "Error: Could not determine Supabase URL for destination '${DEST}'" >&2
  exit 1
fi
if [[ -z "$SRK" ]]; then
  echo "Error: SUPABASE_SERVICE_ROLE_KEY not found." >&2
  echo "Set it via: export SUPABASE_SERVICE_ROLE_KEY=..." >&2
  echo "Or add it to envs/${DEST}" >&2
  exit 1
fi

BUCKET="covers"
echo "Uploading covers to ${DEST} (${SUPABASE_URL})..."

# Ensure bucket exists (ignore error if it already exists)
curl -sf -o /dev/null -X POST \
  "${SUPABASE_URL}/storage/v1/bucket" \
  -H "Authorization: Bearer ${SRK}" \
  -H "Content-Type: application/json" \
  -d "{\"id\":\"${BUCKET}\",\"name\":\"${BUCKET}\",\"public\":true}" 2>/dev/null || true

UPLOADED=0
SKIPPED=0
FAILED=0

for FILE in "${COVERS_DIR}"/*.{jpg,svg}; do
  [[ -f "$FILE" ]] || continue
  BASENAME=$(basename "$FILE")

  # Determine content type
  case "$BASENAME" in
    *.jpg) CTYPE="image/jpeg" ;;
    *.svg) CTYPE="image/svg+xml" ;;
    *)     CTYPE="application/octet-stream" ;;
  esac

  # Delete existing file first (ignore 404), then upload
  curl -sf -o /dev/null -X DELETE \
    "${SUPABASE_URL}/storage/v1/object/${BUCKET}/${BASENAME}" \
    -H "Authorization: Bearer ${SRK}" 2>/dev/null || true

  HTTP_CODE=$(curl -sf -w "%{http_code}" -o /dev/null \
    -X POST \
    "${SUPABASE_URL}/storage/v1/object/${BUCKET}/${BASENAME}" \
    -H "Authorization: Bearer ${SRK}" \
    -H "Content-Type: ${CTYPE}" \
    --data-binary "@${FILE}" 2>/dev/null || echo "000")

  if [[ "$HTTP_CODE" == "200" ]]; then
    UPLOADED=$((UPLOADED + 1))
    echo "  + ${BASENAME}"
  else
    FAILED=$((FAILED + 1))
    echo "  x ${BASENAME} (HTTP ${HTTP_CODE})"
  fi
done

echo ""
echo "Done: ${UPLOADED} uploaded, ${FAILED} failed"
echo "Public URL pattern: ${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/<file>"
