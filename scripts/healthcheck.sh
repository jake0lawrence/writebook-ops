#!/usr/bin/env bash
#
# Poll /healthz endpoint; push alert to Slack on first failure.
#
URL="https://books.jakelawrence.io/healthz"
SLACK_WEBHOOK_URL="${SLACK_WEBHOOK_URL:-}"

STATUS=$(curl -sf -o /dev/null -w '%{http_code}' "$URL" || true)

if [[ "$STATUS" != "200" ]]; then
  echo "Healthcheck failed ($STATUS)"
  if [[ -n "$SLACK_WEBHOOK_URL" ]]; then
    curl -X POST -H 'Content-type: application/json' \
         --data "{\"text\":\"🚨 Writebook healthcheck failed — status $STATUS\"}" \
         "$SLACK_WEBHOOK_URL"
  fi
  exit 1
else
  echo "Healthcheck OK"
fi
