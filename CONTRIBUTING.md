# Contributing

Use Python 3.14, Node 22.12–24 and the `packageManager` version in `frontend/package.json`. Bootstrap with `python scripts/tasks.py bootstrap` and start Docker development with `python scripts/tasks.py dev`. Run dependency operations from their own directory: `uv sync --frozen` in `backend`, `pnpm install --frozen-lockfile` in `frontend`.

Keep backend business rules in services, reads in selectors and API contracts in serializers/views. Keep browser authentication in the same-origin BFF; never introduce browser-readable refresh tokens or bypass mutation-origin checks. Reuse existing UI and infrastructure components. Add focused regression tests for behavior with security, data or release consequences.

Before submitting, run `python scripts/tasks.py test`, `python scripts/tasks.py lint`, and the relevant checks in [TESTING.md](docs/TESTING.md). Release/template changes also need `backend/.venv/Scripts/python.exe -m unittest discover -s infra/tests` on Windows or `backend/.venv/bin/python -m unittest discover -s infra/tests` on Linux. Linux executes the deployment failure simulations. Run production validation for authentication, storage, proxy or deployment changes.

Commit model migrations and regenerate `contracts/openapi/schema.yaml` when the API changes. Review schema diffs rather than accepting a generated file blindly. Preserve compatibility between old application processes and new migrations during deployment. Separate destructive schema changes into a later release after all readers have migrated.

Keep lockfiles synchronized with dependency manifests. Do not hand-edit resolved package checksums. CI actions use verified full commit SHAs with version comments; update the SHA and comment together, preferably through a reviewed Dependabot PR. No automated dependency update may bypass the release checks.

PRs should explain the concrete behavior change, relevant test evidence, and any new settings, migration or recovery requirement. Use the included template. Changes to authentication, `.github`, `deploy.sh`, `infra` and production settings should receive review from the adopting project's designated owners. Configure actual CODEOWNERS and branch rules in that project; this template cannot choose your organization’s reviewers.
