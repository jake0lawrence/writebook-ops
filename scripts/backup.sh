#!/usr/bin/env bash
#
# Nightly Writebook backup → S3 / DigitalOcean Spaces.
# Called by cron (see cron/backup.cron) *or* the `backup.yml` workflow.
#
# Env vars required:
#   S3_BUCKET               e.g. writebook-backups
#   AWS_ACCESS_KEY_ID
#   AWS_SECRET_ACCESS_KEY
#   AWS_DEFAULT_REGION      e.g. us-east-1  (or nyc3 for DO Spaces)
set -euo pipefail

TIMESTAMP=$(date +%F_%H-%M)
ARCHIVE="/var/backups/writebook_${TIMESTAMP}.tgz"

echo "$(date '+%F %T')  ⇢  Starting ONCE snapshot…"
once data backup "$ARCHIVE"

echo "$(date '+%F %T')  ⇢  Uploading to s3://${S3_BUCKET}/nightly/"
aws s3 cp "$ARCHIVE" "s3://${S3_BUCKET}/nightly/${TIMESTAMP}.tgz" \
  --storage-class STANDARD_IA

# keep seven local copies to aid fast restores
find /var/backups -name 'writebook_*.tgz' -mtime +7 -delete

echo "$(date '+%F %T')  ⇢  Backup complete (${ARCHIVE##*/})"
