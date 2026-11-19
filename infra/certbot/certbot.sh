#!/bin/sh
# ==============================================================================
# Let's Encrypt certificates for the site, issued and renewed in a container
# ==============================================================================
#
#   ensure      Issue the certificate for SITE_DOMAIN and SITE_ALIASES, or add
#               names to it; does nothing while the current one is valid.
#               deploy.sh runs it before the smoke test.
#   renew-loop  The `certbot` service: tries renewal twice a day.
#
# Both use the webroot method: the site's nginx serves the challenge files
# from the shared certbot_webroot volume over plain HTTP, through the edge.
# The certificate lands in the letsencrypt volume, which nginx mounts; its
# watcher (infra/nginx/site/start.sh) enables HTTPS and reloads on renewal.
#
# Run with `sh`, so the file needs no executable bit on the server.

set -eu

: "${SITE_DOMAIN:?Set SITE_DOMAIN (deploy/site.env)}"

WEBROOT=/var/www/certbot
mkdir -p "$WEBROOT"

issue() {
    : "${LETSENCRYPT_EMAIL:?Set LETSENCRYPT_EMAIL in deploy/site.env}"

    set -- -d "$SITE_DOMAIN"
    for alias in $(printf '%s' "${SITE_ALIASES:-}" | tr ',' ' '); do
        set -- "$@" -d "$alias"
    done

    # Practise against the staging CA first if unsure: its limits are far
    # higher, and its certificates are not trusted by browsers.
    if [ "${LETSENCRYPT_STAGING:-0}" = 1 ]; then
        set -- "$@" --staging
    fi

    certbot certonly \
        --webroot --webroot-path "$WEBROOT" \
        --cert-name "$SITE_DOMAIN" \
        --email "$LETSENCRYPT_EMAIL" \
        --agree-tos --no-eff-email --non-interactive \
        --keep-until-expiring --expand \
        "$@"
}

case "${1:-renew-loop}" in
    ensure)
        if ! issue; then
            cat >&2 <<EOF

Certificate issuance failed. The usual causes:
  - DNS for $SITE_DOMAIN ${SITE_ALIASES:+(and $SITE_ALIASES) }does not point at this server yet
    (python3 scripts/server.py doctor checks it);
  - the shared edge is not running or does not know this site
    (python3 scripts/edge.py status);
  - a proxy in front (Cloudflare's orange cloud) redirects the HTTP challenge;
    use DNS only until the certificate exists.
EOF
            exit 1
        fi
        ;;
    renew-loop)
        while :; do
            certbot renew --quiet || echo "Certificate renewal failed; retrying in 12 hours." >&2
            sleep 43200
        done
        ;;
    *)
        echo "Usage: certbot.sh ensure|renew-loop" >&2
        exit 2
        ;;
esac
