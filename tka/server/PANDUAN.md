# Memasang server Simulasi TKA

Kunci jawaban **tidak** disimpan di situs (GitHub bersifat publik). Kunci dan pembahasan disimpan di
Google Apps Script milik Admin. Situs hanya mengirim jawaban siswa dan menerima nilai, atau, bagi pemegang
kode akses, menerima kunci dan pembahasan.

## Sekali pasang (± 10 menit)

1. Buat Google Spreadsheet baru, misalnya **"Server Simulasi TKA"**.
2. Menu **Ekstensi → Apps Script**.
3. Ganti isi `Code.gs` dengan isi berkas [`Code.gs`](Code.gs) ini.
4. Klik **+ → Skrip**, beri nama `Kunci`, lalu tempel isi berkas **`Kunci.gs`** (dikirim terpisah, rahasia).
5. Simpan. Pilih fungsi `menuSiapkan`, lalu **Jalankan** dan beri izin.
6. **Terapkan → Deployment baru → Jenis: Aplikasi web**
   - Jalankan sebagai: **Saya**
   - Yang memiliki akses: **Siapa saja**
7. Salin URL yang berakhiran `/exec`, lalu tempel ke `tka/konfigurasi.js`:
   ```js
   const TKA_API = 'https://script.google.com/macros/s/XXXX/exec';
   ```
8. Commit & push. Selesai.

Bila Code.gs atau Kunci.gs diubah: **Terapkan → Kelola deployment → ✏️ → Versi: Baru → Terapkan**
(URL tetap sama).

## Melayani siswa yang memberi dukungan

1. Siswa/orang tua menghubungi lewat WhatsApp (tombol di situs sudah menyusun pesannya).
2. Setelah dukungan Rp50.000 diterima, buka spreadsheet → menu **Simulasi TKA → Buat kode akses baru…**
3. Isi nama dan nomor WA. Kode (mis. `TKA-7KQ4-M2XP`) dan pesan siap kirim akan muncul. Kirim ke siswa.

Lembar **Akses**:
- Kolom **Aktif**: ubah ke `TIDAK` untuk menonaktifkan kode.
- Kolom **Perangkat**: kosongkan bila siswa ganti HP (satu kode maksimal 50 perangkat, diatur di
  `PENGATURAN.MAKS_PERANGKAT`).

Lembar **Nilai** mencatat setiap pengerjaan: nama, sekolah, kelas, paket, nilai, dan kode yang dipakai.

## Menambah paket soal

1. Buat `tka/bank/<id>.js` (format sama dengan `sd-mat-1.js`, tanpa kunci).
2. Tambahkan kunci & pembahasannya ke `Kunci.gs` dengan id yang sama, lalu terapkan versi baru.
3. Tambahkan baris di `tka/bank/daftar.js`.

## Pemasangan otomatis dari GitHub (tanpa copy-paste)

Setelah disiapkan sekali, setiap perubahan `Code.gs` atau kunci jawaban yang masuk ke branch `main`
otomatis dipasang ke Apps Script dan deployment aplikasi web diperbarui (URL tetap sama). Lihat
`.github/workflows/apps-script.yml`.

**Kunci jawaban** disimpan terenkripsi sebagai `Kunci.gs.enc` + `Kunci.gs.key.enc` (RSA-4096 + AES-256).
Isinya tidak dapat dibaca tanpa kunci privat yang hanya tersimpan di secret `KUNCI_PRIVATE_KEY`.
Untuk memperbarui kunci jawaban: `bash tka/server/enkripsi-kunci.sh path/ke/Kunci.gs`, lalu commit kedua berkas `.enc`.

Pengaturan sekali saja:
1. Aktifkan Google Apps Script API: https://script.google.com/home/usersettings → **Aktif**.
2. Buat kredensial clasp di Google Cloud Shell (https://shell.cloud.google.com, akun Google pemilik spreadsheet):
   ```
   npx @google/clasp@2.4.2 login --no-localhost
   cat ~/.clasprc.json
   ```
   Buka tautan yang muncul, izinkan, lalu salin seluruh alamat halaman tujuan (yang gagal dimuat, berawalan
   `http://localhost:8888/?code=`) dan tempel kembali ke Cloud Shell.
3. GitHub → repositori → **Settings → Secrets and variables → Actions**:
   - tab **Secrets**: `CLASPRC_JSON` = isi `~/.clasprc.json`; `KUNCI_PRIVATE_KEY` = isi berkas kunci privat.
   - tab **Variables**: `TKA_SCRIPT_ID` = ID skrip (Apps Script → ⚙️ Setelan proyek → ID Skrip).
4. Tab **Actions → Pasang server Simulasi TKA → Run workflow** untuk uji pertama.

Keamanan: siapa pun yang dapat mengubah workflow di repositori ini (pemilik/admin/kolaborator dengan akses tulis)
secara tidak langsung dapat memakai kredensial Apps Script tersebut. Bila kredensial bocor atau tidak dipakai lagi,
cabut akses "clasp" di https://myaccount.google.com/permissions lalu hapus secret-nya.
