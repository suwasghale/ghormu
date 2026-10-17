# Production operating contract

This template provides a tested application and a single-VPS deployment path. Reliability and enterprise controls also require an accountable operating team, provider configuration and workload-specific validation. Use this document when adopting the starter, alongside [DEPLOYMENT.md](DEPLOYMENT.md).

## Release and maintenance ownership

Assign owners for application releases, PostgreSQL recovery, SMTP/storage credentials, security reports and certificate renewal. Protect `main`, require PR checks, restrict workflow changes and configure the `production` environment. Choose actual CODEOWNERS in each adopting repository. A template cannot grant these controls or select your reviewers.

External Actions are pinned to full commit SHAs, and checkout does not retain Git credentials. Build publication requests SBOM and maximum-detail provenance attestations; those are emitted when CI pushes images to GHCR. They record dependencies/build context, not a certification of safety. Public build arguments must contain no secrets. Runtime deployment resolves image tags to immutable digests. See [GitHub's action-pinning guidance](https://docs.github.com/en/actions/reference/security/secure-use) and [Docker's attestation documentation](https://docs.docker.com/build/ci/github-actions/attestations/).

Dependabot configuration covers Actions, uv, Dockerfiles and Compose images. Weekly maintenance reruns backend/frontend checks and dependency audits without publishing or deploying. GitHub's documented Dependabot support currently lists pnpm through version 10, while this repository uses pnpm 11; maintain frontend lock updates with the pinned pnpm version or a compatible update bot. Do not downgrade the package manager just to satisfy a bot. Check [supported ecosystems](https://docs.github.com/en/code-security/reference/supply-chain-security/supported-ecosystems-and-repositories) when enabling additional automation.

## Production configuration

`python scripts/tasks.py check-env --require-backup` validates the production env file before deployment. It rejects duplicate keys, interpolation, ambiguous quoting, weak passwords, matching signing keys, unsafe origins/host wildcards, debug mode, unencrypted SMTP, invalid backup retention and mismatched cloud-media settings. Errors name the field without printing secret values.

Use simple literal `KEY=value` lines with comments on separate lines and URL-safe generated secrets. PostgreSQL/Redis passwords need at least 24 characters; independent signing keys need at least 50. CORS and CSRF lists must contain the public HTTPS origin. The bundled release assumes SMTP with exactly one of STARTTLS or implicit TLS enabled; custom mail backends need a corresponding validator and delivery test. Remote backup/storage endpoints require HTTPS. Put cloud bucket credentials only in the server's ignored env file or adapt the services for your secret manager.

The copier excludes recognized credential files, certificates, runtime data, dependencies and symlinks/junctions. Source directories called `media` or `generated` are retained outside known runtime locations. If a project needs a symlinked source component, vendor or copy that component deliberately. Review copied files for project-specific secrets before committing.

## Monitoring and recovery

| Signal | What to monitor | Response |
| --- | --- | --- |
| Public readiness | HTTPS `/health/ready/`, latency and error rate | Inspect Nginx, web, PostgreSQL and Redis health; compare the current release marker with running images |
| Background jobs | Celery health, task failures/backlog and Beat logs | Verify broker connectivity and one Beat instance; confirm scheduled tasks are progressing |
| Backups | Scheduler health, restart count, off-host object age and restore logs | Investigate every failed cycle; take and verify a replacement backup |
| Capacity | Disk free space, PostgreSQL connections, memory and CPU | Add capacity before exhaustion; retain enough disk for a scratch restore and prior images |
| Certificates | Expiry and renewal-hook success | Renew and reload Nginx; verify the public certificate afterward |
| Security | Auth/security events, dependency audit failures and provider access | Follow the private reporting and incident process in SECURITY.md |

Define application-specific availability and latency objectives after representative load tests; none have been measured for an arbitrary future workload. Configure an external uptime check and an alert destination owned by your team. Optional Sentry captures backend errors when configured; it does not replace monitoring backups, queues or database health. Scrub secrets and personal data from logs and use project-appropriate retention/access controls.

The default backup interval is 24 hours with a scratch-restore freshness threshold of 25 hours. Recovery-point exposure can approach a full day between successful backups; no recovery-time objective has been measured. Use shorter intervals or managed PostgreSQL point-in-time recovery when the business requires it. Test recovery away from the primary host, including media, SMTP, DNS and credentials. Local MinIO recovery tests prove the application path, not a cloud provider's retention or disaster recovery policy.

Failed deployment retries preserve the last verified image references rather than replacing them with partially swapped containers. The success marker advances only after HTTPS smoke and verified backup health. Follow the documented compatibility check before image rollback. For destructive recovery, stop writers, restore to a separate database, verify it and plan the cutover; never infer that reversing migrations is safe.

## Boundaries for larger deployments

The supplied Compose topology is one host, one frontend instance, one PostgreSQL instance and one Redis instance. It has no automatic failover or multi-region replication. PostgreSQL's bundled application role also owns its schema; before using a managed enterprise database, provision separate migration, runtime and backup roles with the grants required by their responsibilities.

The starter includes account security, staff/role permissions and security events. Organization tenancy, tenant-scoped authorization, SAML/OIDC enterprise SSO, SCIM provisioning, enforced organization MFA, immutable audit retention and jurisdiction-specific data policies are additional product requirements. Do not infer those guarantees from staff/admin permissions. Distributing the frontend also requires shared refresh coordination.

Choose infrastructure and these extensions from the next project's requirements rather than adding unused services to every generated copy. Record the chosen controls, load-test results and recovery exercises before that project serves real users.
