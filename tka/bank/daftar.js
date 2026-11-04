/* Daftar paket Simulasi TKA. 'baru' = tanggal terakhir label BARU ditampilkan (rilis + 7 hari). Tambahkan baris baru setiap ada paket baru (berkas bank/<id>.js). */
const PAKET_TKA = [
  { id: 'sd-mat-1', jenjang: 'SD', mapel: 'Matematika', paket: 'Paket 1', soal: 30, durasi: 75, warna: '#1f6fb2', ikon: '➗' },
  { id: 'sd-bi-1', jenjang: 'SD', mapel: 'Bahasa Indonesia', paket: 'Paket 1', soal: 30, durasi: 75, warna: '#c0392b', ikon: '📖' },
  { id: 'sd-mat-2', jenjang: 'SD', mapel: 'Matematika', paket: 'Paket 2', soal: 30, durasi: 75, warna: '#1f6fb2', ikon: '📐', baru: '2026-11-10' },
  { id: 'sd-bi-2', jenjang: 'SD', mapel: 'Bahasa Indonesia', paket: 'Paket 2', soal: 30, durasi: 75, warna: '#c0392b', ikon: '📚', baru: '2026-11-11' }
];
