#!/usr/bin/env bash
# Mengenkripsi Kunci.gs (rahasia) menjadi Kunci.gs.enc + Kunci.gs.key.enc yang aman disimpan di repositori publik.
# Hanya pemegang kunci privat (secret KUNCI_PRIVATE_KEY di GitHub) yang dapat membukanya.
# Pakai: bash tka/server/enkripsi-kunci.sh path/ke/Kunci.gs
set -euo pipefail
cd "$(dirname "$0")"
SUMBER="${1:?Sebutkan lokasi berkas Kunci.gs}"
SANDI=$(mktemp); trap 'rm -f "$SANDI"' EXIT
openssl rand -hex 32 > "$SANDI"
openssl enc -aes-256-cbc -pbkdf2 -iter 200000 -salt -in "$SUMBER" -out Kunci.gs.enc -pass file:"$SANDI"
openssl pkeyutl -encrypt -pubin -inkey kunci-publik.pem -pkeyopt rsa_padding_mode:oaep -pkeyopt rsa_oaep_md:sha256 -in "$SANDI" -out Kunci.gs.key.enc
echo "Selesai: Kunci.gs.enc dan Kunci.gs.key.enc diperbarui."
