# The edge: several sites on one server

Only one process can own ports 80 and 443, so a small nginx, **the edge**,
does, and hands each connection to the right site. Every site runs its own
Compose stack with its own nginx, certificate, database and deploys.

```text
visitor ──443──▶ edge ──SNI──▶ 127.0.0.1:21443  mysite.com's nginx (TLS, its own cert)
                      └─────▶ 127.0.0.1:23977  othersite.com's nginx
        ──80───▶ edge ─Host──▶ 127.0.0.1:21442 / 23976 (certbot challenges, redirects)
```

- HTTPS passes through still encrypted. TLS ends at each site's nginx, so
  certificates and renewal stay per site.
- PROXY protocol carries the visitor's address, so each site's rate limits and
  Django see the real client.
- Each site publishes its nginx on **127.0.0.1 only**.
- A name no site registered is refused, never handed to an arbitrary site.

## How sites register

The edge's config ([infra/edge/nginx.conf](../infra/edge/nginx.conf)) names no
site. It includes `/srv/edge/sites/*.https.map` and `*.http.map`, and each
site's `deploy.sh` runs `python3 scripts/edge.py ensure`, which:

1. installs the edge in `/srv/edge` if it is missing, upgrades it when the
   starter ships a newer version (the `# sg-edge vN` marker), or migrates a
   hand-written one;
2. writes `/srv/edge/sites/<APP_SLUG>.https.map` and `.http.map` from
   `deploy/site.env`, after checking no other site has these hostnames or
   ports;
3. validates the configuration and reloads the edge, or starts it.

So adding a site never touches another site's repository or files.

```sh
python3 scripts/edge.py status       # every registered site, and whether the edge runs
python3 scripts/edge.py unregister   # in a site's checkout, before removing it
```

## An existing server

A server whose edge config was written by hand before this tool (no
`# sg-edge` marker; for example the Contabo server hosting suwasghale.com and
sajjanghale.com) is migrated automatically by the first release of a site
built from this version:

- each site in the old maps becomes `sites/legacy-<domain>.*.map`, with the
  same hostnames and ports, so the existing sites keep working;
- the old config is kept as `/srv/edge/nginx.conf.legacy-<time>`;
- the edge container is recreated with the new configuration, a gap of about
  a second.

After that, **do not copy an old `infra/edge/nginx.conf` over
`/srv/edge/nginx.conf`** from an older site's repository: it would drop every
site registered since. The older sites' own deploys only check that the edge
exists and start it, which keeps working unchanged. When an older site moves
to this starter's deployment files, its first release replaces its
`legacy-*` files with its own (`edge.py` refuses a name collision, so remove
the legacy files of that site first).

To see the result before any release, run `python3 scripts/edge.py ensure` in
the new site's checkout; it does the migration and registration and reloads.

## When something is wrong

```sh
python3 scripts/edge.py status
docker compose -f /srv/edge/compose.yml ps
docker compose -f /srv/edge/compose.yml logs --tail 50
ls /srv/edge/sites
ss -ltnp | grep -E ':(80|443) '
```

- **Site unreachable, edge up**: is that site's nginx running?
  `docker compose … ps nginx` in its checkout, and is its port pair the one in
  its `.https.map`?
- **`bind() to 0.0.0.0:443 failed`**: something else still holds the port,
  usually a site's nginx from before the edge. Its next release (or
  `docker compose … up -d nginx` in its checkout) moves it to loopback.
- **Every visitor has the same address in the logs**: the site's 443 listener
  lost `proxy_protocol` (it comes from `LISTEN_PROXY_PROTOCOL`, which
  production leaves at its default).
- **A name or port "already belongs to" another site**: pick another
  `EDGE_HTTP_PORT`/`EDGE_HTTPS_PORT` pair in `deploy/site.env`, or remove the
  other site's routes if it is gone.
