# ==============================================================================
# Database backup
# ==============================================================================
#
# Built on the same Postgres image as the server, and that is the point rather
# than convenience: pg_dump refuses to dump a server newer than itself. A
# backup job built on the application image (Debian slim, whose `postgresql-
# client` is older) works until the day Postgres is upgraded and then fails
# every night into a log nobody reads.
#
# Keep this tag in step with the `postgres` service in docker-compose.prod.yml.
# `infra/backup/backup.sh` refuses to upload an implausibly small dump, so a
# mismatch fails loudly instead of filling the bucket with 20-byte files --
# which is exactly what a version mismatch produces.

FROM postgres:17-alpine

# aws-cli speaks S3, and R2 is S3-compatible, so the same client covers both
# the upload and the restore drill.
RUN apk add --no-cache aws-cli

COPY infra/backup/environment.sh /usr/local/bin/backup-environment
COPY infra/backup/backup.sh  /usr/local/bin/backup
COPY infra/backup/restore.sh /usr/local/bin/restore

RUN chmod +x /usr/local/bin/backup /usr/local/bin/restore

# Runs as the unprivileged postgres user that the base image already creates.
USER postgres

ENTRYPOINT ["/usr/local/bin/backup"]
