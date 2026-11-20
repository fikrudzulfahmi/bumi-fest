#!/usr/bin/env bash
# Normalisasi + validasi SSH key, lalu uji konektivitas raw-ssh.
# Cetak penyebab kegagalan sebagai annotation (dibaca tanpa akses log admin).
set -u

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

# --- 2) Tulis key ke berkas 0600 (ssh-keygen menolak permission terbuka) ---
mkdir -p ~/.ssh
chmod 700 ~/.ssh
umask 077
RAW=$(printf '%s' "$SSH_KEY" | tr -d '\r')

if printf '%s' "$RAW" | head -c 30 | grep -q -- '-----BEGIN'; then
  # PEM utuh (bentuk yang benar). Isi presisi, hanya buang spasi/CR di tepi baris.
  printf '%s\n' "$RAW" | sed 's/[[:space:]]*$//' > ~/.ssh/deploy_key
elif printf '%s' "$RAW" | base64 -d >/dev/null 2>&1; then
  # base64 satu baris hasil `cat key | base64 -w0`.
  printf '%s' "$RAW" | base64 -d > ~/.ssh/deploy_key
else
  # Body base64 mentah (armor BEGIN/END hilang) → bungkus ulang 70 kolom.
  { echo "-----BEGIN OPENSSH PRIVATE KEY-----"
    printf '%s' "$RAW" | tr -d '\n' | fold -w 70
    echo "-----END OPENSSH PRIVATE KEY-----"; } > ~/.ssh/deploy_key
fi
chmod 600 ~/.ssh/deploy_key

# --- 3) Deteksi key ber-PASSPHRASE tanpa prompt (baca cipher di header format) ---
# Format OpenSSH: "openssh-key-v1\0" <len><ciphername>. cipher "none" = tanpa passphrase.
if sed -e '1d' -e '$d' ~/.ssh/deploy_key 2>/dev/null | tr -d '\n ' | base64 -d 2>/dev/null \
     | head -c 32 | grep -qaE 'aes|chacha'; then
  echo "::error title=SSH_KEY BER-PASSPHRASE::Key valid tetapi dikunci passphrase — SSH non-interaktif tak bisa membukanya."
  echo "::warning title=PERBAIKAN::ssh-keygen -p -f ~/.ssh/bumi_deploy -N \"\"  (kosongkan passphrase), atau buat baru: ssh-keygen -t ed25519 -f ~/.ssh/bumi_deploy -N \"\" — lalu cat ~/.ssh/bumi_deploy | base64 -w0 dan ganti secret SSH_KEY."
  exit 1
fi

# --- 4) Validasi key bisa dibaca (tanpa prompt; TTY diputus) ---
if ! PUB=$(ssh-keygen -y -f ~/.ssh/deploy_key </dev/null 2>&1); then
  echo "::error title=SSH_KEY RUSAK::ssh-keygen tidak bisa membaca key: $(printf '%s' "$PUB" | head -c 300 | tr '\n' ' ')"
  echo "::warning title=PERBAIKAN::Buat baru tanpa passphrase: ssh-keygen -t ed25519 -f ~/.ssh/bumi_deploy -N \"\" lalu cat ~/.ssh/bumi_deploy | base64 -w0, paste UTUH."
  exit 1
fi
echo "::notice title=SSH_KEY OK::md5_pubkey=$(printf '%s' "$PUB" | md5sum | cut -c1-12)"

# --- 5) Uji konektivitas raw-ssh (tampilkan error asli) ---
if OUT=$(ssh -i ~/.ssh/deploy_key -p "$PORT" -o StrictHostKeyChecking=no -o BatchMode=yes -o ConnectTimeout=20 "$SSH_USER@$SSH_HOST" 'whoami; pwd' 2>&1); then
  echo "::notice title=SSH OK::$(printf '%s' "$OUT" | tr '\n' ' ')"
else
  echo "::error title=SSH GAGAL::$(printf '%s' "$OUT" | tr '\n' '|')"
  exit 1
fi
