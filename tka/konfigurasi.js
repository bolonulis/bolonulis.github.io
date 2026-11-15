/* Alamat server penilaian Simulasi TKA (Google Apps Script → Terapkan → Aplikasi web → URL yang berakhiran /exec).
   Lihat tka/server/PANDUAN.md. Selama masih kosong, halaman menampilkan pemberitahuan "server belum dipasang". */
const TKA_API = 'https://script.google.com/macros/s/AKfycbyLEra5MKyC4hqt1MBNjFoSOkBaf4X223lt7Ty53PMXdzxS3Ia80w1gQlDD-FB7nldv/exec';

/* Loket cadangan (opsional): URL /exec dari proyek Apps Script yang SAMA, dipasang oleh akun Google lain
   (akun itu diberi akses Editor ke spreadsheet server). Satu URL per baris. Lihat tka/server/PANDUAN.md bagian "Loket cadangan".
   Loket hanya dipakai siswa bila versinya sama persis dengan loket utama, jadi aman walau belum diperbarui. */
const TKA_LOKET_CADANGAN = [
];
