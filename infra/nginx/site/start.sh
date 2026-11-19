#!/bin/sh
# ==============================================================================
# Start the site's nginx from templates
# ==============================================================================
#
# The server blocks are rendered from deploy/site.env values at start-up, so
# a new project never edits an nginx file. Run with `sh`, so the file needs no
# executable bit on the server.
#
#   http.conf     always: the ACME challenge, and the redirect to HTTPS.
#   https.conf    once a certificate exists for SITE_DOMAIN.
#   aliases.conf  with https.conf, when SITE_ALIASES lists other names.
#
# Before the first certificate there is no HTTPS listener at all, which is
# what lets certbot issue one over plain HTTP. A watcher then enables HTTPS
# when the certificate appears and reloads nginx whenever it is renewed, so
# no renewal hook or manual reload is ever needed.

set -eu

: "${SITE_DOMAIN:?Set SITE_DOMAIN (deploy/site.env)}"

SITE_SERVER_ALIASES="$(printf '%s' "${SITE_ALIASES:-}" | tr ',' ' ')"
LISTEN_PROXY_PROTOCOL="${LISTEN_PROXY_PROTOCOL-proxy_protocol}"
REAL_IP_HEADER="${REAL_IP_HEADER:-proxy_protocol}"
export SITE_DOMAIN SITE_SERVER_ALIASES LISTEN_PROXY_PROTOCOL REAL_IP_HEADER

TEMPLATES=/etc/nginx/site
OUT=/etc/nginx/conf.d
CERT="${CERT_DIR:-/etc/letsencrypt/live/$SITE_DOMAIN}/fullchain.pem"
CERT_DIR="$(dirname "$CERT")"
export CERT_DIR

# Only these names are substituted; nginx's own $host, $request_uri and the
# like pass through untouched.
# shellcheck disable=SC2016  # literal names, for envsubst to replace
VARIABLES='${SITE_DOMAIN} ${SITE_SERVER_ALIASES} ${LISTEN_PROXY_PROTOCOL} ${REAL_IP_HEADER} ${CERT_DIR}'

render() {
    envsubst "$VARIABLES" < "$TEMPLATES/$1.template" > "$OUT/$1"
}

enable_https() {
    render https.conf
    if [ -n "$SITE_SERVER_ALIASES" ]; then
        render aliases.conf
    else
        rm -f "$OUT/aliases.conf"
    fi
}

cert_stamp() {
    stat -L -c %Y "$CERT" 2>/dev/null || echo none
}

# The image's sample server would answer for any unknown name.
rm -f "$OUT/default.conf" "$OUT/https.conf" "$OUT/aliases.conf"
render http.conf

if [ -f "$CERT" ]; then
    enable_https
else
    echo "No certificate at $CERT yet: serving HTTP only until certbot issues one." >&2
fi

nginx -t

if [ "${1:-}" = "--check" ]; then
    exit 0
fi

(
    stamp="$(cert_stamp)"
    while sleep "${CERT_CHECK_SECONDS:-60}"; do
        current="$(cert_stamp)"
        if [ "$current" != "$stamp" ] && [ "$current" != none ]; then
            enable_https
            if nginx -t 2>/dev/null; then
                nginx -s reload
                echo "Certificate changed: HTTPS configuration reloaded." >&2
                stamp="$current"
            fi
        fi
    done
) &

exec nginx -g 'daemon off;'
