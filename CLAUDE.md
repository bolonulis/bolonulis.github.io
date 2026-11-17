# CLAUDE.md: halaman publik karya Admin

Repo ini **publik**. Semua keputusan, aturan kerja, dan pekerjaan terbuka ada di repo privat `bolonulis/rapor-merdeka-digital-server`, berkas `CLAUDE.md`. Baca berkas itu dulu (biasanya sudah ter-clone di `/home/user/rapor-merdeka-digital-server`).

Ringkasan aturan yang paling penting untuk repo ini:
- Bahasa Indonesia yang sederhana. Pemilik hanya memvalidasi rencana; Claude mengerjakan, **dengan izin**.
- Tanpa identitas pribadi. Kontak cukup "Admin", WA 0811-9693-9694.
- Jangan ada data siswa, guru, berkas Excel sekolah, kredensial, atau kunci jawaban TKA yang terbaca di repo ini. Hanya `tka/server/Kunci.gs.enc`.
- Ubah di **cabang kerja**, lalu `git merge --no-ff` ke `main` dan push. Pages tayang ±60 detik; periksa dengan curl.
- **Push ke `main` yang menyentuh `tka/server/*` atau `tka/konfigurasi.js` langsung memasang server TKA** lewat `.github/workflows/apps-script.yml`. Minta izin dulu.
- Dukungan bersifat sukarela, dengan kata "gratis", "seikhlasnya", dan "bukan dana BOS". Jangan memakai kata jual-beli.
- Tidak ada pemasangan selama minggu rapor (mulai 12 Desember 2026).
