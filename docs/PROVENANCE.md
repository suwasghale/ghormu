# Source provenance

The initial assembly copied 552 files directly from the local `lwnf-dev` and `aucoeurdunepal` directories. `source-manifest.json` records their original paths and SHA-256 checksums. Some entries were subsequently removed or adapted, so the initial manifest is provenance, not a promise of byte identity in the final tree.

- LWNF: users/profiles and migrations, settings components, API primitives, storage validation, email templates/tasks, auth/profile pages, UI components, admin CRUD/table/form system, dashboard account aggregation, dependency locks, Docker definitions and baseline CI.
- Au Coeur du Népal: BFF login/logout/refresh/proxy handling, safe redirects and refresh tests, backup/restore image and scripts, error pages, and optional Sentry configuration.
- Integration changes: strip business modules, join the donor API contracts, keep tokens server-side, enforce request origins, use server guards, change branding/routing, add local email capture, and provide cross-platform bootstrap/project-copy/deployment commands.

Source repositories were read and copied; their working trees were not edited. Their Git histories, runtime environments, database/media contents and actual environment files were not copied.

The deployment completion pass copied 16 more complete files from Au Coeur: publish/deploy/production-validation workflows, the deployment script, atomic image-environment persistence, HTTPS smoke checks, release tests, the production test runner/fixtures/Compose overlay, and Playwright configuration/tests. `deployment-source-manifest.json` records the original checksums plus the copied daily backup service and production dependency-audit sections. Starter adaptations remove business routes/data, use the account schema and one frontend, add publication/SSH configuration gates, and connect the existing integration workflow. Generated test credentials, certificates, reports and release state are excluded from new project copies.

Preserve applicable third-party notices. The copied backend LICENSE is retained at `backend/LICENSE`; this assembly does not relicense either source project's proprietary assets or code.
