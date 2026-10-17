# Security policy

Report vulnerabilities privately to the maintainers of the repository you are using. Use GitHub private vulnerability reporting when it is enabled; otherwise contact a maintainer through an established private channel. Do not post credentials, session tokens, customer data or exploit details in public issues.

Include the affected revision, reproduction steps using synthetic data, expected and observed behavior, and impact. Maintainers should acknowledge, reproduce, assess affected deployments, patch and add a regression test before coordinating disclosure. This template does not promise a response SLA; each adopting organization must assign an owner and response process.

Maintain the latest reviewed template revision and locked dependencies. Downstream copies have their own update responsibility; copying this repository does not subscribe them to future patches. Dependency audits run in CI and weekly. Review automated update PRs and rerun production validation before release; do not automatically merge security-sensitive changes.

Never commit production env files, keys, database dumps or provider credentials. The generator/build exclusions are safeguards, not a substitute for reviewing files and enabling repository secret scanning where available. Rotate exposed credentials at the provider, invalidate affected sessions, and investigate access before cleaning Git history.

Security assumptions and operational requirements are described in [OPERATIONS.md](docs/OPERATIONS.md). In particular, the bundled setup uses one host and one frontend process; distributed session refresh, tenant isolation and enterprise identity-provider integration require additional design. No compliance certification is implied by this repository.
