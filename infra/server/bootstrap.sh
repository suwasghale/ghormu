#!/bin/bash
# ==============================================================================
# Prepare a fresh Ubuntu/Debian server to host sites built from this starter
# ==============================================================================
#
# Once per server, as root. Safe to run again: every step checks first.
#
#   scp infra/server/bootstrap.sh root@SERVER:/root/
#   ssh root@SERVER bash /root/bootstrap.sh --timezone Asia/Kathmandu
#
# It installs Docker (with Compose) and the tools deploy.sh needs, creates the
# `deploy` user that owns every site and signs in by key only, opens only
# SSH/HTTP/HTTPS, adds swap, turns on security updates and fail2ban, and
# prepares /srv for the shared edge. It also installs `sg-deploy-key`, which
# gives each site's repository its own read-only deploy key.
#
# Root and password sign-in are switched off only with --harden-ssh, after
# you have checked in a second window that the deploy user can sign in.
# docs/DEPLOYMENT.md has the whole order of work.

set -euo pipefail

DEPLOY_USER=deploy
TIMEZONE=""
SWAP_SIZE=4G
HARDEN_SSH=0

while [[ $# -gt 0 ]]; do
    case "$1" in
        --user) DEPLOY_USER="$2"; shift 2 ;;
        --timezone) TIMEZONE="$2"; shift 2 ;;
        --swap) SWAP_SIZE="$2"; shift 2 ;;
        --harden-ssh) HARDEN_SSH=1; shift ;;
        -h|--help) sed -n '2,21p' "$0"; exit 0 ;;
        *) echo "Unknown option: $1" >&2; exit 2 ;;
    esac
done

if [[ $EUID -ne 0 ]]; then
    echo "Run as root: sudo bash $0" >&2
    exit 1
fi

step() { printf '\n== %s\n' "$*"; }
export DEBIAN_FRONTEND=noninteractive

# ------------------------------------------------------------------------------
step "Packages and automatic security updates"
# ------------------------------------------------------------------------------
apt-get update -q
apt-get -y -q upgrade
apt-get -y -q install ca-certificates curl git python3 ufw fail2ban unattended-upgrades util-linux openssl iproute2
dpkg-reconfigure -f noninteractive unattended-upgrades
systemctl enable --now fail2ban >/dev/null

if [[ -n "$TIMEZONE" ]]; then
    timedatectl set-timezone "$TIMEZONE"
fi

# ------------------------------------------------------------------------------
step "Docker Engine and Compose"
# ------------------------------------------------------------------------------
if ! command -v docker >/dev/null || ! docker compose version >/dev/null 2>&1; then
    # Docker's own install script, from Docker's own repository.
    curl -fsSL https://get.docker.com -o /tmp/get-docker.sh
    sh /tmp/get-docker.sh
    rm -f /tmp/get-docker.sh
fi
systemctl enable --now docker >/dev/null
docker compose version

# Bounded logs for every container, including ones a site forgets to limit.
if [[ ! -f /etc/docker/daemon.json ]]; then
    cat > /etc/docker/daemon.json <<'EOF'
{
  "log-driver": "json-file",
  "log-opts": { "max-size": "10m", "max-file": "5" }
}
EOF
    systemctl restart docker
fi

# ------------------------------------------------------------------------------
step "The $DEPLOY_USER user"
# ------------------------------------------------------------------------------
if ! id "$DEPLOY_USER" >/dev/null 2>&1; then
    adduser --disabled-password --gecos "" "$DEPLOY_USER"
fi
usermod -aG docker,sudo "$DEPLOY_USER"

home="$(getent passwd "$DEPLOY_USER" | cut -d: -f6)"
install -d -m 700 -o "$DEPLOY_USER" -g "$DEPLOY_USER" "$home/.ssh"
if [[ ! -s "$home/.ssh/authorized_keys" && -s /root/.ssh/authorized_keys ]]; then
    install -m 600 -o "$DEPLOY_USER" -g "$DEPLOY_USER" /root/.ssh/authorized_keys "$home/.ssh/authorized_keys"
    echo "Copied root's authorized SSH keys to $DEPLOY_USER."
fi

# Sites live under /srv, the shared edge in /srv/edge; the deploy user owns both.
install -d -m 755 -o "$DEPLOY_USER" -g "$DEPLOY_USER" /srv /srv/edge

# ------------------------------------------------------------------------------
step "Firewall: SSH, HTTP and HTTPS only"
# ------------------------------------------------------------------------------
# Databases and app ports stay private: every site publishes only on
# 127.0.0.1, and the edge alone owns 80 and 443.
ufw allow OpenSSH >/dev/null
ufw allow 80/tcp >/dev/null
ufw allow 443/tcp >/dev/null
ufw --force enable >/dev/null
ufw status | sed -n '1,8p'

# ------------------------------------------------------------------------------
step "Swap"
# ------------------------------------------------------------------------------
# A memory spike then slows containers down instead of killing them.
if [[ "$(swapon --noheadings | wc -l)" -eq 0 ]]; then
    fallocate -l "$SWAP_SIZE" /swapfile
    chmod 600 /swapfile
    mkswap /swapfile >/dev/null
    swapon /swapfile
    grep -q '^/swapfile ' /etc/fstab || echo '/swapfile none swap sw 0 0' >> /etc/fstab
    echo "Added $SWAP_SIZE of swap."
else
    echo "Swap already configured."
fi

# ------------------------------------------------------------------------------
step "sg-deploy-key: a read-only GitHub deploy key per site"
# ------------------------------------------------------------------------------
# GitHub accepts a deploy key on one repository only, so each site gets its
# own key and its own host alias: git@github-<slug>:owner/repository.git
cat > /usr/local/bin/sg-deploy-key <<'EOF'
#!/bin/bash
# Usage (as the deploy user): sg-deploy-key <site-slug>
set -euo pipefail
slug="${1:?Usage: sg-deploy-key <site-slug>}"
[[ "$slug" =~ ^[a-z0-9][a-z0-9-]*$ ]] || { echo "Use the site's slug, e.g. my-site" >&2; exit 2; }
key="$HOME/.ssh/github_${slug}"
mkdir -p "$HOME/.ssh" && chmod 700 "$HOME/.ssh"
[[ -f "$key" ]] || ssh-keygen -q -t ed25519 -N "" -C "${slug}-server-deploy" -f "$key"
if ! grep -q "^Host github-${slug}\$" "$HOME/.ssh/config" 2>/dev/null; then
    printf '\nHost github-%s\n  HostName github.com\n  User git\n  IdentityFile %s\n  IdentitiesOnly yes\n' "$slug" "$key" >> "$HOME/.ssh/config"
    chmod 600 "$HOME/.ssh/config"
fi
ssh-keyscan -t ed25519 github.com 2>/dev/null >> "$HOME/.ssh/known_hosts"
sort -u -o "$HOME/.ssh/known_hosts" "$HOME/.ssh/known_hosts"
echo "Add this key to the repository: Settings > Deploy keys > Add (leave write access off):"
echo
cat "${key}.pub"
echo
echo "Then clone with: git clone git@github-${slug}:OWNER/REPOSITORY.git /srv/${slug}"
EOF
chmod 755 /usr/local/bin/sg-deploy-key

# ------------------------------------------------------------------------------
step "SSH sign-in"
# ------------------------------------------------------------------------------
if [[ $HARDEN_SSH -eq 1 ]]; then
    if [[ ! -s "$home/.ssh/authorized_keys" ]]; then
        echo "Refusing --harden-ssh: $DEPLOY_USER has no authorized key and you would be locked out." >&2
        exit 1
    fi
    # 00-: sshd keeps the FIRST value it reads, and cloud images ship
    # 50-cloud-init.conf with "PasswordAuthentication yes".
    cat > /etc/ssh/sshd_config.d/00-hardening.conf <<'EOF'
PasswordAuthentication no
KbdInteractiveAuthentication no
PermitRootLogin no
EOF
    sshd -t
    systemctl restart ssh 2>/dev/null || systemctl restart sshd
    sshd -T | grep -Ei '^(passwordauthentication|kbdinteractiveauthentication|permitrootlogin) '
else
    cat <<EOF
Not changed yet. In a SECOND window, check that this works:

    ssh $DEPLOY_USER@$(hostname -I | awk '{print $1}')
    sudo -v        # needs a password: set one with  passwd $DEPLOY_USER

Then run this script again with --harden-ssh to switch off root and
password sign-in.
EOF
fi

# ------------------------------------------------------------------------------
step "Done"
# ------------------------------------------------------------------------------
echo "Host key fingerprints (compare with your provider's console on first connect):"
for type in ecdsa ed25519; do
    [[ -f /etc/ssh/ssh_host_${type}_key.pub ]] && ssh-keygen -lf "/etc/ssh/ssh_host_${type}_key.pub" -E sha256
done
cat <<EOF

Next, as $DEPLOY_USER, for each site (docs/DEPLOYMENT.md):
    sg-deploy-key <site-slug>          # then add the key on GitHub and clone into /srv/<site-slug>
    docker login ghcr.io               # for private images: a token with read:packages only
    cd /srv/<site-slug>
    python3 scripts/server.py init-env
    python3 scripts/server.py doctor
EOF
