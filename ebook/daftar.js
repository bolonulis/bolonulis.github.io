/* Daftar e-book. Untuk menambah e-book: taruh PDF dan gambar sampulnya di folder ebook/, lalu tambahkan satu entri di sini
   (entri paling atas tampil paling depan). Sampul bisa dibuat dari halaman pertama PDF. */
const EBOOK = [
  {
    id: 'racik-kelas-hidup',
    judul: 'Racik Kelas Hidup',
    subjudul: 'Panduan Praktis 13 Model dan 12 Metode Pembelajaran untuk Guru SD',
    kategori: 'Pendamping RPP Flash',
    edisi: 'Edisi 2026',
    penulis: 'Admin',
    halaman: 43,
    ringkas: 'Memahami beda model, metode, dan teknik; memilih model dengan tiga pertanyaan; sintaks lengkap 13 model; 12 metode; cara memadukannya; dan daftar periksa sebelum masuk kelas.',
    poin: ['13 model: PBL, PjBL, TPS, Jigsaw, STAD, NHT, Discovery, dan lainnya', '12 metode pembelajaran dan cara memadukannya', 'Selaras dengan Panduan Pembelajaran dan Asesmen 2025'],
    berkas: 'racik-kelas-hidup-2026.pdf',
    sampul: 'racik-kelas-hidup.png',
    hargaNormal: 100000,
    gratis: true // masa promo: ubah ke false bila promo berakhir
  }
];

const rupiah = n => 'Rp' + Number(n).toLocaleString('id-ID');

/** Kartu e-book. akar = jalur ke folder ebook/ dari halaman pemanggil ('' atau 'ebook/'). */
function kartuEbook(e, akar) {
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const harga = e.gratis
    ? '<div class="eb-harga"><b>Gratis</b><span>selama masa promo · harga normal ' + rupiah(e.hargaNormal) + '</span></div>'
    : '<div class="eb-harga"><b>' + rupiah(e.hargaNormal) + '</b></div>';
  const unduh = e.gratis
    ? '<a class="btn eb-unduh" href="' + akar + esc(e.berkas) + '" download>⬇️ Unduh gratis (PDF)</a><a class="btn ghost" href="' + akar + esc(e.berkas) + '" target="_blank" rel="noopener">Baca dulu</a>'
    : '<a class="btn eb-unduh" href="https://wa.me/6281196939694?text=' + encodeURIComponent('Halo Admin, saya ingin membeli e-book "' + e.judul + '".') + '" target="_blank" rel="noopener">Beli lewat WhatsApp</a>';
  return '<article class="eb">' +
    '<img class="eb-sampul" src="' + akar + esc(e.sampul) + '" alt="Sampul ' + esc(e.judul) + '" loading="lazy">' +
    '<div class="eb-isi"><div class="eb-kat">' + esc(e.kategori) + ' · ' + esc(e.edisi) + ' · ' + e.halaman + ' halaman</div>' +
    (e.penulis ? '<div class="eb-penulis">oleh ' + esc(e.penulis) + '</div>' : '') +
    '<h3>' + esc(e.judul) + '</h3><p class="eb-sub">' + esc(e.subjudul) + '</p>' +
    '<p>' + esc(e.ringkas) + '</p><ul>' + e.poin.map(p => '<li>' + esc(p) + '</li>').join('') + '</ul>' +
    harga + '<div class="eb-aksi">' + unduh + '</div></div></article>';
}
