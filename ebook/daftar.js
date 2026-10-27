/* Daftar e-book. Untuk menambah e-book: taruh PDF dan gambar sampulnya di folder ebook/, lalu tambahkan satu entri di sini
   (entri paling atas tampil paling depan). Sampul bisa dibuat dari halaman pertama PDF. */
const EBOOK = [
  {
    id: 'kokurikuler-siap-jalan',
    judul: 'Kokurikuler Siap Jalan',
    subjudul: 'Panduan Teknis Menyusun Program, Melaksanakan, Menilai, hingga Melaporkan Kokurikuler di SD',
    kategori: 'Seri Panduan Guru SD',
    edisi: 'Edisi 2026',
    penulis: 'Tim Penyusun',
    halaman: 39,
    ringkas: 'Dari tim kerja dan analisis sekolah, program tahunan kelas I–VI, perencanaan kegiatan format A–H, pelaksanaan di kelas, asesmen Berkembang–Cakap–Mahir, sampai deskripsi rapor dan evaluasi. Mengacu pada Panduan Kokurikuler 2025 dan Kepka BSKAP 058/H/KR/2025.',
    poin: ['Menentukan dimensi prioritas dari data Rapor Pendidikan, lengkap dengan tabel jembatan indikator → 8 dimensi', '12 format F1–F12 siap cetak dan versi Word (.docx) siap diisi', '3 contoh perencanaan lengkap: lintas disiplin, Gerakan 7 KAIH, dan kearifan lokal', 'Rumusan resmi 8 dimensi jenjang SD dan bank kalimat deskripsi rapor'],
    berkas: 'kokurikuler-siap-jalan-2026.pdf?v=3',
    sampul: 'kokurikuler-siap-jalan.png',
    format: {
      zip: 'format/Format-F1-F12-Kokurikuler-Siap-Jalan.zip',
      daftar: [
      { kode: 'F1', nama: 'SK Tim Kerja', berkas: 'format/F1-SK-Tim-Kerja-Kokurikuler.docx' },
      { kode: 'F2', nama: 'Analisis Satuan Pendidikan', berkas: 'format/F2-Lembar-Analisis-Satuan-Pendidikan.docx' },
      { kode: 'F3', nama: 'Dimensi, Tema, Bentuk', berkas: 'format/F3-Penentuan-Dimensi-Tema-Bentuk.docx' },
      { kode: 'F4', nama: 'Program Tahunan', berkas: 'format/F4-Program-Kokurikuler-Tahunan.docx' },
      { kode: 'F5', nama: 'Perencanaan Kegiatan A–H', berkas: 'format/F5-Perencanaan-Kegiatan-Kokurikuler.docx' },
      { kode: 'F6', nama: 'Jadwal Pelaksanaan', berkas: 'format/F6-Jadwal-Pelaksanaan-Kegiatan.docx' },
      { kode: 'F7', nama: 'Surat Orang Tua', berkas: 'format/F7-Surat-Pemberitahuan-Orang-Tua.docx' },
      { kode: 'F8', nama: 'Catatan Anekdot', berkas: 'format/F8-Catatan-Anekdot.docx' },
      { kode: 'F9', nama: 'Jurnal 7 KAIH', berkas: 'format/F9-Jurnal-Kebiasaan-7-KAIH.docx' },
      { kode: 'F10', nama: 'Penilaian Diri Murid', berkas: 'format/F10-Penilaian-Diri-Murid.docx' },
      { kode: 'F11', nama: 'Rubrik & Rekap Asesmen', berkas: 'format/F11-Rubrik-dan-Rekap-Asesmen.docx' },
      { kode: 'F12', nama: 'Evaluasi Kegiatan', berkas: 'format/F12-Instrumen-Evaluasi-Kegiatan.docx' }
      ]
    },
    hargaNormal: 100000,
    gratis: true
  },
  {
    id: 'racik-kelas-hidup',
    judul: 'Racik Kelas Hidup',
    subjudul: 'Panduan Praktis 13 Model dan 12 Metode Pembelajaran untuk Guru SD',
    kategori: 'Pendamping RPP Flash',
    edisi: 'Edisi 2026',
    penulis: 'Tim Penyusun',
    halaman: 43,
    ringkas: 'Memahami beda model, metode, dan teknik; memilih model dengan tiga pertanyaan; sintaks lengkap 13 model; 12 metode; cara memadukannya; dan daftar periksa sebelum masuk kelas.',
    poin: ['13 model: PBL, PjBL, TPS, Jigsaw, STAD, NHT, Discovery, dan lainnya', '12 metode pembelajaran dan cara memadukannya', 'Selaras dengan Panduan Pembelajaran dan Asesmen 2025'],
    berkas: 'racik-kelas-hidup-2026.pdf?v=2',
    sampul: 'racik-kelas-hidup.png',
    hargaNormal: 100000,
    gratis: true // masa promo: ubah ke false bila promo berakhir
  }
];

const rupiah = n => 'Rp' + Number(n).toLocaleString('id-ID');

/** Lampiran format Word yang bisa diisi (bila ada): satu ZIP berisi semua, atau per format. */
function formatWord(e, akar, esc) {
  if (!e.format) return '';
  return '<div class="eb-format"><b>📝 Format Word siap diisi</b>' +
    '<a class="btn small eb-zip" href="' + akar + esc(e.format.zip) + '" download>⬇️ Unduh semua F1–F' + e.format.daftar.length + ' (ZIP)</a>' +
    '<details><summary>atau unduh satu per satu</summary><ul>' +
    e.format.daftar.map(f => '<li><a href="' + akar + esc(f.berkas) + '" download><b>' + esc(f.kode) + '</b> ' + esc(f.nama) + '</a></li>').join('') +
    '</ul></details></div>';
}

/** Kartu e-book. akar = jalur ke folder ebook/ dari halaman pemanggil ('' atau 'ebook/'). */
function kartuEbook(e, akar) {
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const harga = e.gratis
    ? '<div class="eb-harga"><b>Gratis</b><span>selama masa promo · harga normal ' + rupiah(e.hargaNormal) + '</span></div>'
    : '<div class="eb-harga"><b>' + rupiah(e.hargaNormal) + '</b></div>';
  const unduh = e.gratis
    ? '<a class="btn eb-unduh" href="' + akar + esc(e.berkas) + '" download>⬇️ Unduh gratis (PDF)</a><a class="btn ghost" href="' + akar + esc(e.berkas) + '" target="_blank" rel="noopener">Baca dulu</a>'
    : '<a class="btn eb-unduh" href="https://wa.me/628196939694?text=' + encodeURIComponent('Halo Admin, saya ingin membeli e-book "' + e.judul + '".') + '" target="_blank" rel="noopener">Beli lewat WhatsApp</a>';
  return '<article class="eb">' +
    '<img class="eb-sampul" src="' + akar + esc(e.sampul) + '" alt="Sampul ' + esc(e.judul) + '" loading="lazy">' +
    '<div class="eb-isi"><div class="eb-kat">' + esc(e.kategori) + ' · ' + esc(e.edisi) + ' · ' + e.halaman + ' halaman</div>' +
    (e.penulis ? '<div class="eb-penulis">oleh ' + esc(e.penulis) + '</div>' : '') +
    '<h3>' + esc(e.judul) + '</h3><p class="eb-sub">' + esc(e.subjudul) + '</p>' +
    '<p>' + esc(e.ringkas) + '</p><ul>' + e.poin.map(p => '<li>' + esc(p) + '</li>').join('') + '</ul>' +
    harga + '<div class="eb-aksi">' + unduh + '</div>' + formatWord(e, akar, esc) + '</div></article>';
}
