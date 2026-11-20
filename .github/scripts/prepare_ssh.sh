#!/usr/bin/env bash
# Normalisasi + validasi SSH key, lalu uji konektivitas raw-ssh.
# Cetak penyebab kegagalan sebagai annotation (dibaca tanpa akses log admin).
set -e

SSH_HOST="${SSH_HOST:-}"
SSH_USER="${SSH_USER:-}"
SSH_PORT="${SSH_PORT:-22}"
SSH_KEY="${SSH_KEY:-}"
DEPLOY_PATH="${DEPLOY_PATH:-}"

PORT="${SSH_PORT:-22}"

# --- 1) Laporkan kelengkapan secret (nilai di-mask, hanya panjang & awalan) ---
KEY_LEN=${#SSH_KEY}
KEY_HEAD=$(printf '%s' "$SSH_KEY" | head -c 30 | tr -d '\r\n')
echo "::warning title=PRECHECK::HOST=[${SSH_HOST:-KOSONG}] USER=[${SSH_USER:-KOSONG}] PORT=[${PORT}] PATH=[${DEPLOY_PATH:-KOSONG}] | key_len=${KEY_LEN} key_awal=[${KEY_HEAD:-KOSONG}]"

if [ -z "$SSH_HOST" ] || [ -z "$SSH_USER" ] || [ -z "$SSH_KEY" ]; then
  echo "::error title=PRECHECK GAGAL::Secret SSH_HOST/SSH_USER/SSH_KEY belum terisi (lihat docs/DEPLOY-CPANEL.md Bagian C)."
  exit 1
fi

# --- 2) Normalisasi key (3 bentuk) + validasi ---
mkdir -p ~/.ssh
chmod 700 ~/.ssh
# ssh-keygen MENOLAK membaca key yang permission-nya terlalu terbuka (0644).
umask 077
RAW=$(printf '%s' "$SSH_KEY" | tr -d '\r')
OK=0
FMT=""

if printf '%s' "$RAW" | head -c 30 | grep -q -- '-----BEGIN'; then
  printf '%s\n' "$RAW" > /tmp/k1
  chmod 600 /tmp/k1
  if ssh-keygen -y -f /tmp/k1 >/dev/null 2>&1; then cp /tmp/k1 ~/.ssh/deploy_key; OK=1; FMT="PEM-utuh"; fi
fi

if [ "$OK" = 0 ]; then
  if printf '%s' "$RAW" | base64 -d > /tmp/k2 2>/dev/null; then
    chmod 600 /tmp/k2
    if ssh-keygen -y -f /tmp/k2 >/dev/null 2>&1; then cp /tmp/k2 ~/.ssh/deploy_key; OK=1; FMT="base64(file)"; fi
  fi
fi

if [ "$OK" = 0 ]; then
  { echo "-----BEGIN OPENSSH PRIVATE KEY-----"
    printf '%s' "$RAW" | tr -d '\n' | fold -w 70
    echo "-----END OPENSSH PRIVATE KEY-----"; } > /tmp/k3
  printf '\n' >> /tmp/k3
  chmod 600 /tmp/k3
  if ssh-keygen -y -f /tmp/k3 >/dev/null 2>&1; then cp /tmp/k3 ~/.ssh/deploy_key; OK=1; FMT="body->dibungkus"; fi
fi

if [ "$OK" = 0 ]; then
  ERR1=$(ssh-keygen -y -f /tmp/k1 2>&1 | head -c 300 | tr '\n' ' ')
  echo "::error title=DIAG key1::${ERR1:-<kosong>}"
  if [ -f /tmp/k2 ]; then
    ERR2=$(ssh-keygen -y -f /tmp/k2 2>&1 | head -c 300 | tr '\n' ' ')
    echo "::error title=DIAG key2::${ERR2:-<kosong>}"
  fi
  if [ -f /tmp/k3 ]; then
    ERR3=$(ssh-keygen -y -f /tmp/k3 2>&1 | head -c 300 | tr '\n' ' ')
    echo "::error title=DIAG key3::${ERR3:-<kosong>}"
  fi

  # Kasus paling umum: key valid tapi BER-PASSPHRASE (SSH non-interaktif tak bisa buka).
  if printf '%s' "$ERR1" | grep -qiE 'passphrase|decrypt private key'; then
    echo "::error title=SSH_KEY BER-PASSPHRASE::Key valid tetapi dikunci passphrase. Non-interaktif tak bisa membukanya."
    echo "::warning title=PERBAIKAN::Di laptop: ssh-keygen -p -f ~/.ssh/bumi_deploy -N \"\"  (kosongkan passphrase), lalu cat ~/.ssh/bumi_deploy | base64 -w0 dan ganti SSH_KEY."
    exit 1
  fi

  if printf '%s' "$ERR1" | grep -qiE 'invalid format|error in libcrypto|bad base64'; then
    echo "::error title=SSH_KEY RUSAK::Isi key tidak utuh (terpotong/malformed)."
    echo "::warning title=PERBAIKAN::ssh-keygen -t ed25519 -f ~/.ssh/bumi_deploy -N \"\" lalu cat ~/.ssh/bumi_deploy | base64 -w0."
    exit 1
  fi

  echo "::error title=SSH_KEY DITOLAK::Tidak bisa membaca key (lihat DIAG di atas)."
  echo "::warning title=PETUNJUK::ssh-keygen -t ed25519 -f ~/.ssh/bumi_deploy -N \"\" (tanpa passphrase), lalu cat ~/.ssh/bumi_deploy | base64 -w0, paste UTUH."
  exit 1
fi

chmod 600 ~/.ssh/deploy_key
FINGERPRINT=$(ssh-keygen -y -f ~/.ssh/deploy_key | md5sum | cut -c1-12)
echo "::notice title=SSH_KEY OK::format=${FMT} | md5_pubkey=${FINGERPRINT}"

# --- 3) Uji konektivitas raw-ssh (tampilkan error asli) ---
if OUT=$(ssh -i ~/.ssh/deploy_key -p "$PORT" -o StrictHostKeyChecking=no -o BatchMode=yes -o ConnectTimeout=20 "$SSH_USER@$SSH_HOST" 'whoami; pwd' 2>&1); then
  echo "::notice title=SSH OK::$(printf '%s' "$OUT" | tr '\n' ' ')"
else
  echo "::error title=SSH GAGAL::$(printf '%s' "$OUT" | tr '\n' '|')"
  exit 1
fi
