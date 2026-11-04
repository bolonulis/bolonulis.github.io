/* Program Kokurikuler — penyusun bertahap berbantuan Gemini.
   Gemini dipanggil langsung dari browser dengan kunci API milik guru (disimpan hanya di perangkat ini).
   Server aplikasi hanya mencatat kuota per sekolah, menyimpan draf, dan membuat Google Docs.
   Yang pasti (JP, jadwal, porsi tahap, teks Kepka 058, isian e-Rapor) dihitung di sini, bukan oleh AI.
   Acuan: Panduan Kokurikuler 2025 (BSKAP) dan Kepka BSKAP 058/H/KR/2025. */
(() => {
const KUNCI_GEMINI = 'gemini-kunci';
const MODEL_GEMINI = ['gemini-3.5-flash', 'gemini-3.5-flash-lite'];
const URL_GEMINI = 'https://generativelanguage.googleapis.com/v1beta/models/';
const LANGKAH = ['Persiapan', 'Tahap 1 · Rancangan', 'Tahap 2 · Alur & Pertemuan', 'Tahap 3 · Asesmen', 'Dokumen'];
const TAHAP_BELAJAR = ['Memahami', 'Mengaplikasi', 'Merefleksi'];
const ROMAWI = ['', 'I', 'II', 'III', 'IV', 'V', 'VI'];
const BENTUK_7KAIH = 'Gerakan 7 Kebiasaan Anak Indonesia Hebat', BENTUK_LAIN = 'Cara lainnya';

/* Tahapan pengembangan tiap bentuk (Panduan Kokurikuler 2025, Gambar 2 dan 3). */
const TAHAPAN_BENTUK = {
  'Kolaboratif lintas disiplin ilmu': ['Penentuan dimensi profil lulusan', 'Penentuan tema', 'Penyusunan perencanaan kokurikuler', 'Pelaksanaan kokurikuler', 'Evaluasi dan tindak lanjut'],
  'Gerakan 7 Kebiasaan Anak Indonesia Hebat': ['Penentuan dimensi profil lulusan', 'Penentuan tema', 'Penentuan pembiasaan (pelaksanaan G7KAIH)', 'Penyusunan perencanaan kokurikuler', 'Pelaksanaan kokurikuler', 'Evaluasi dan tindak lanjut'],
  'Cara lainnya': ['Penentuan dimensi profil lulusan', 'Penentuan nilai, kekhasan, program unggulan sekolah, atau kebijakan pemerintah setempat', 'Penentuan tema', 'Penyusunan perencanaan kokurikuler', 'Pelaksanaan kokurikuler', 'Evaluasi dan tindak lanjut']
};
const KET_BENTUK = {
  'Kolaboratif lintas disiplin ilmu': 'Beberapa mapel bekerja sama mengangkat satu tema/masalah nyata, misalnya IPAS, Bahasa Indonesia, dan Seni mengangkat sampah di sekitar sekolah.',
  'Gerakan 7 Kebiasaan Anak Indonesia Hebat': 'Pembiasaan kebiasaan baik yang dicatat dalam jurnal harian, lalu diolah dan direfleksikan bersama (tantangan kelas, kampanye, aksi kolaboratif).',
  'Cara lainnya': 'Mengangkat kekhasan sekolah: nilai, program unggulan, budaya lokal, atau kebijakan pemerintah setempat, selama terencana, melibatkan murid aktif, dan berorientasi pada dimensi profil lulusan.'
};
/* Jenis aktivitas (Panduan, Merancang aktivitas a–g) beserta contohnya. */
const CONTOH_AKTIVITAS = {
  'Praktikal': 'berkebun, bertukang, mengolah pangan, membuat model/maket, berniaga',
  'Keagamaan': 'kegiatan ibadah atau hari besar keagamaan yang dibagikan kembali ke kelas',
  'Kunjungan/pemanfaatan fasilitas umum': 'cagar budaya, museum, perpustakaan, pasar, kantor desa, tempat ibadah',
  'Pengumpulan dan penyajian data': 'jurnal, wawancara, observasi, lalu disajikan dalam tabel/infografis/presentasi',
  'Riset dan studi literatur': 'mencari informasi dari buku, video, situs, lalu mendiskusikannya',
  'Advokasi': 'kampanye, sosialisasi, penyuluhan tentang isu nyata (hemat energi, sampah, gizi)',
  'Pelibatan narasumber': 'tokoh adat, pelaku UMKM, tenaga kesehatan, orang tua dengan beragam profesi'
};
/* Isian keadaan sekolah: apa yang ditulis, contohnya, dan dipakai untuk apa. */
const KONTEKS = [
  { k: 'lingkungan', label: 'Lingkungan dan potensi lokal', tulis: 'Apa saja yang ada di sekitar sekolah: alam, mata pencaharian warga, tempat bersejarah, budaya, usaha lokal.',
    contoh: 'Sekolah di tepi sawah dan dekat pasar desa; sebagian besar orang tua petani dan pedagang; ada sanggar tari dan pengrajin anyaman bambu.', pakai: 'tema kegiatan dan tempat kunjungan/observasi' },
  { k: 'masalah', label: 'Masalah nyata yang dekat dengan murid', tulis: 'Persoalan yang benar-benar terlihat di sekolah atau lingkungan murid dan masuk akal ditangani murid SD.',
    contoh: 'Sampah plastik jajanan menumpuk di selokan; banyak murid tidak sarapan; murid jarang membaca di rumah.', pakai: 'produk atau aksi nyata yang dikerjakan murid' },
  { k: 'mitra', label: 'Calon mitra dan narasumber', tulis: 'Orang atau lembaga di sekitar sekolah yang bisa diajak terlibat.',
    contoh: 'Puskesmas, petani, pengelola bank sampah desa, orang tua yang bekerja sebagai perawat, pengurus masjid.', pakai: 'kemitraan pembelajaran dan narasumber (bagian E)' },
  { k: 'sarana', label: 'Sarana yang tersedia', tulis: 'Ruang, alat, dan perangkat yang benar-benar bisa dipakai.',
    contoh: 'Kebun sekolah 5×6 m, proyektor/PID, 4 laptop, halaman luas; belum ada laboratorium.', pakai: 'alat dan bahan, serta pemanfaatan digital (bagian F)' },
  { k: 'murid', label: 'Karakteristik murid', tulis: 'Jumlah, kemampuan umum, minat, dan kebutuhan khusus (tanpa menyebut nama).',
    contoh: '28 murid; 3 belum lancar membaca; senang kegiatan di luar kelas; 2 murid lambat belajar.', pakai: 'pembagian kelompok dan langkah yang berdiferensiasi' },
  { k: 'unggulan', label: 'Program unggulan atau kebiasaan sekolah', tulis: 'Program yang sudah berjalan dan bisa disambungkan.',
    contoh: 'Jumat bersih, literasi 15 menit tiap pagi, sekolah Adiwiyata tingkat kabupaten.', pakai: 'menyambungkan kegiatan dengan program yang sudah berjalan' }
];
/* Tabel jembatan indikator Rapor Pendidikan → dimensi (dari e-book Kokurikuler Siap Jalan; susunan penulis, bukan pemetaan resmi). */
const JEMBATAN_RAPOR = [
  ['A.1 Literasi (terutama mengevaluasi dan merefleksikan teks)', 'Komunikasi; Penalaran Kritis', 'Membaca, Menulis; Penyampaian Argumentasi'],
  ['A.2 Numerasi (terutama kompetensi menalar)', 'Penalaran Kritis', 'Penyelesaian Masalah, Pengambilan Keputusan'],
  ['A.3.1 Beriman, bertakwa, berakhlak mulia', 'Keimanan dan Ketakwaan', 'Hubungan dengan Tuhan, sesama manusia, lingkungan alam'],
  ['A.3.2 Gotong royong', 'Kolaborasi', 'Peduli, Berbagi, Kerja sama'],
  ['A.3.3 Kreativitas', 'Kreativitas', 'Gagasan baru, Fleksibilitas berpikir, Karya'],
  ['A.3.4 Nalar kritis', 'Penalaran Kritis', 'Penyampaian Argumentasi, Pengambilan Keputusan, Penyelesaian Masalah'],
  ['A.3.5 Kebinekaan global', 'Kewargaan', 'Kewargaan Lokal, Nasional, Global'],
  ['A.3.6 Kemandirian', 'Kemandirian', 'Bertanggung Jawab, Kepemimpinan, Pengembangan Diri'],
  ['D.4 Iklim keamanan (perundungan, kesejahteraan psikologis)', 'Kesehatan; Keimanan dan Ketakwaan', 'Kesehatan mental; Hubungan dengan sesama manusia'],
  ['D.8 Iklim kebinekaan', 'Kewargaan', 'Kewargaan Lokal, Kewargaan Nasional'],
  ['D.19 Tujuh Kebiasaan Anak Indonesia Hebat', 'Kesehatan; Kemandirian; Keimanan dan Ketakwaan', 'Hidup bersih dan sehat; Bertanggung Jawab; kebiasaan beribadah']
];

let PG = null;          // info dari server: kuota, referensi, daftar program
let PR = null;          // program yang dibuka: { id, ta, data, ulang }
let LIHAT = 0;          // langkah yang sedang ditampilkan
let PG_UBAH = false;

/* ---------- util ---------- */
const fase = k => (k <= 2 ? 'A' : k <= 4 ? 'B' : 'C');
const dimensiDari = sub => ((PG.referensi.find(d => d.sub.includes(sub)) || {}).dimensi || '');
const tunggu = ms => new Promise(r => setTimeout(r, ms));
const teks = v => String(v == null ? '' : v).trim();
const satuKalimat = v => teks(v).replace(/\s+/g, ' ');
const daftarTeks = v => (Array.isArray(v) ? v : [v]).map(satuKalimat).filter(Boolean);
const mingguBawaan = (kelas, sem) => (Number(kelas) === 6 && Number(sem) === 2 ? 14 : 18);
function nomorWa(t){ const d = String(t || '').replace(/\D/g, ''); const m = d.match(/0?8\d{8,12}/); return m ? '62' + m[0].replace(/^0/, '') : ''; }
function tanggalMinggu(mulai, minggu){
  if (!mulai) return '';
  const d = new Date(mulai + 'T00:00:00'); d.setDate(d.getDate() + 7 * (minggu - 1));
  return d.getDate() + ' ' + BULAN[d.getMonth()].slice(0, 3) + ' ' + d.getFullYear();
}
function tujuanPola(k){
  const fr = k.subdimensi.map(s => PG.frasaTujuan[s]).filter(Boolean);
  if (!fr.length || !k.nama) return '';
  const daftar = fr.length === 1 ? fr[0] : fr.slice(0, -1).join(', ') + (fr.length > 2 ? ', serta ' : ' serta ') + fr[fr.length - 1];
  return 'Melalui kegiatan “' + teks(k.nama) + '”, murid mampu ' + daftar + (k.produk ? ', dengan hasil akhir berupa ' + teks(k.produk).replace(/[.\s]+$/, '') : '') + '.';
}

/* ---------- waktu: pertemuan semester dihitung aplikasi ---------- */
/** JP tiap hari pelaksanaan dalam satu minggu menurut pola. */
function polaMinggu(p){
  if (p.pola === 'Sehari') return [p.jpMinggu];
  if (p.pola === 'Blok') return Array.from({ length: p.hariBlok }, () => p.jpHari);
  return [3, p.jpMinggu - 3];                      // Dua hari: 3 + 4 JP (kelas 3–6) atau 3 + 3 JP (kelas 1–2)
}
function ketPola(p){
  if (p.pola === 'Sehari') return 'Sehari penuh: ' + p.jpMinggu + ' JP dalam satu hari setiap minggu';
  if (p.pola === 'Blok') return 'Blok: ' + p.hariBlok + ' hari berturut-turut per pekan blok, ' + p.jpHari + ' JP per hari';
  return 'Dua hari per minggu: hari pertama 3 JP, hari kedua ' + (p.jpMinggu - 3) + ' JP';
}
/** Seluruh pertemuan semester: [{ minggu, hari, jp }]. Minggu pada pola blok = pekan blok. */
function slotSemester(p){
  const pola = polaMinggu(p), hasil = [];
  let sisa = p.jp, minggu = 1;
  while (sisa > 0 && minggu < 200) {
    pola.forEach((j, h) => { if (sisa <= 0) return; const x = Math.min(j, sisa); hasil.push({ minggu, hari: h + 1, jp: x }); sisa -= x; });
    minggu++;
  }
  return hasil;
}
/** Membagi pertemuan berurutan ke tiap kegiatan sedekat mungkin dengan JP kegiatan (batas pertemuan tidak dipotong). */
function bagiPertemuan(keg, slot){
  const hasil = []; let i = 0, kum = 0, target = 0;
  keg.forEach((k, x) => {
    const mulai = i;
    target += Number(k.jp) || 0;
    if (x === keg.length - 1) i = slot.length;
    else {
      while (i < slot.length - (keg.length - 1 - x) && kum + slot[i].jp <= target) { kum += slot[i].jp; i++; }
      if (i < slot.length - (keg.length - 1 - x) && Math.abs(kum + slot[i].jp - target) < Math.abs(kum - target)) { kum += slot[i].jp; i++; }
      if (i === mulai) { kum += slot[i].jp; i++; }
    }
    hasil.push(slot.slice(mulai, i));
  });
  return hasil;
}
/** Menyelaraskan JP kegiatan dengan batas pertemuan. Mengembalikan true bila ada yang berubah. */
function selaraskanJp(){
  const keg = PR.data.tahap1.kegiatan, bagi = bagiPertemuan(keg, slotSemester(PR.data.persiapan));
  let ubah = false;
  keg.forEach((k, i) => { const j = bagi[i].reduce((a, s) => a + s.jp, 0); if (j !== k.jp) { k.jp = j; ubah = true; } });
  return ubah;
}
/** Tahap belajar tiap pertemuan menurut porsi persiapan (memahami → mengaplikasi → merefleksi). */
function tahapPertemuan(n, porsi){
  if (n === 1) return ['Mengaplikasi'];
  if (n === 2) return ['Memahami', 'Merefleksi'];
  let m = Math.max(1, Math.round(n * porsi.memahami / 100)), r = Math.max(1, Math.round(n * porsi.merefleksi / 100));
  while (m + r > n - 1) { if (m >= r && m > 1) m--; else if (r > 1) r--; else break; }
  return Array.from({ length: n }, (_, i) => (i < m ? 'Memahami' : i >= n - r ? 'Merefleksi' : 'Mengaplikasi'));
}

/* ---------- Gemini (langsung dari browser) ---------- */
function bacaJson(t){
  let s = String(t || '').replace(/```json|```/g, '').trim();
  const a = s.indexOf('{'), b = s.lastIndexOf('}');
  if (a >= 0 && b > a) s = s.slice(a, b + 1);
  return JSON.parse(s);
}
function pesanGalatGemini(status, j){
  const p = String((j && j.error && j.error.message) || '');
  if (status === 400 && /api key/i.test(p)) return 'Kunci API Gemini tidak valid. Periksa kembali kunci yang Anda tempel.';
  if (status === 400) return 'Permintaan ditolak Gemini: ' + p.slice(0, 160);
  if (status === 403) return 'Kunci API ini tidak diizinkan memakai Gemini. Buat kunci baru di aistudio.google.com/apikey.';
  if (status === 429) return 'Batas pemakaian Gemini (paket gratis) sedang tercapai. Tunggu sekitar 1 menit, lalu klik tombolnya lagi.';
  if (status === 404) return 'Model Gemini tidak tersedia untuk kunci ini.';
  if (status >= 500) return 'Server Gemini sedang sibuk. Coba lagi beberapa saat lagi.';
  return 'Gemini gagal (' + status + '): ' + p.slice(0, 160);
}
async function gemini(sistem, perintah, maks){
  const kunci = ls.get(KUNCI_GEMINI);
  if (!kunci) throw new Error('Isi dulu kunci API Gemini Anda di bagian "Kunci API Gemini" (halaman depan menu ini).');
  let galat = 'Gemini tidak dapat dihubungi.';
  for (const model of MODEL_GEMINI) {
    for (let coba = 0; coba < 3; coba++) {
      let r;
      try {
        r = await fetch(URL_GEMINI + encodeURIComponent(model) + ':generateContent', {
          method: 'POST', headers: { 'Content-Type': 'application/json', 'x-goog-api-key': kunci },
          body: JSON.stringify({ systemInstruction: { parts: [{ text: sistem }] }, contents: [{ role: 'user', parts: [{ text: perintah }] }],
            generationConfig: { responseMimeType: 'application/json', temperature: 0.7, maxOutputTokens: maks || 16384 } })
        });
      } catch (e) { throw new Error('Tidak bisa menghubungi Gemini. Periksa koneksi internet lalu coba lagi.'); }
      const j = await r.json().catch(() => ({}));
      if (r.ok) {
        const c = (j.candidates || [])[0] || {};
        const isi = ((c.content || {}).parts || []).map(p => p.text || '').join('');
        if (!isi) { galat = 'Gemini tidak memberi jawaban (' + (c.finishReason || 'kosong') + '). Coba lagi.'; break; }
        try { return bacaJson(isi); } catch (e) {
          galat = c.finishReason === 'MAX_TOKENS' ? 'Jawaban Gemini terpotong karena terlalu panjang. Coba lagi.' : 'Jawaban Gemini tidak terbaca. Coba lagi.';
          break;
        }
      }
      galat = pesanGalatGemini(r.status, j);
      if (r.status === 429 || r.status >= 500) { await tunggu(2500 * (coba + 1)); continue; }
      if (r.status === 404) break;            // model belum tersedia: coba model cadangan
      throw new Error(galat);
    }
  }
  throw new Error(galat);
}

const SISTEM = 'Anda perancang kegiatan kokurikuler Sekolah Dasar di Indonesia. Patuhi Panduan Kokurikuler 2025 (Kemendikdasmen): ' +
  'kokurikuler menguatkan delapan dimensi profil lulusan melalui bentuk kolaboratif lintas disiplin ilmu, Gerakan 7 Kebiasaan Anak Indonesia Hebat ' +
  '(bangun pagi, beribadah, berolahraga, makan sehat dan bergizi, gemar belajar, bermasyarakat, tidur cepat), atau cara lainnya; ' +
  'kegiatan dirancang beralur dengan pengalaman belajar memahami, mengaplikasi, dan merefleksi; berpusat pada murid, kontekstual, aman, dan menggembirakan. ' +
  'Asesmen formatif dan sumatif mengacu pada alur perkembangan dimensi profil lulusan (Kepka BSKAP 058/H/KR/2025). ' +
  'Pakai bahasa Indonesia baku yang sederhana dan jelas untuk guru SD. Jangan menyebut nama murid. Jawab HANYA dengan JSON sesuai format yang diminta.';

function ringkasKonteks(p){
  return KONTEKS.filter(x => p.konteks[x.k]).map(x => '- ' + x.label + ': ' + p.konteks[x.k]).join('\n');
}
function ringkasPersiapan(p){
  return 'Kelas ' + p.kelas + ' (Fase ' + fase(p.kelas) + '), semester ' + p.semester + '. Alokasi semester ini: ' + p.jp + ' JP (1 JP = 35 menit), ' +
    p.jpMinggu + ' JP per minggu, ' + p.minggu + ' minggu efektif. Pola waktu: ' + ketPola(p) + '.\n' +
    'Jumlah kegiatan: ' + p.jumlahKegiatan + ' (bentuk: ' + p.bentuk.join('; ') + ').' +
    (p.kebiasaan.length ? '\nKebiasaan 7 KAIH yang dibiasakan: ' + p.kebiasaan.join(', ') + '.' : '') +
    (p.unggulan ? '\nNilai/kekhasan/program unggulan yang diangkat: ' + p.unggulan : '') +
    '\nJenis aktivitas yang dipilih guru: ' + p.jenisAktivitas.join(', ') + '.\n' +
    'Subdimensi fokus dan target tahap Cakap (Kepka BSKAP 058/H/KR/2025):\n' +
    p.subdimensi.map(s => '- ' + s + ' (dimensi ' + dimensiDari(s) + '): ' + PG.resmi[s].Cakap).join('\n') +
    '\nDasar penentuan dimensi: ' + p.dasarDimensi + (p.sumberData ? '. Temuan: ' + p.sumberData : '') +
    '\nKeadaan sekolah:\n' + ringkasKonteks(p);
}

/* ---------- penyusunan per tahap ---------- */
async function susunTahap1(){
  const p = PR.data.persiapan;
  const contohTema = (PG.temaKok || []).map(t => t.tema).join('; ');
  const perintah = ringkasPersiapan(p) + '\n\nSusun ' + p.jumlahKegiatan + ' kegiatan kokurikuler untuk semester ini dengan bentuk sesuai urutan: ' +
    p.bentuk.map((b, i) => 'kegiatan ' + (i + 1) + ' = ' + b).join(', ') + '. Jumlah JP seluruh kegiatan HARUS tepat ' + p.jp + ' JP. ' +
    'Setiap subdimensi fokus harus dikuatkan oleh minimal satu kegiatan, dan subdimensi tiap kegiatan hanya boleh dipilih dari daftar fokus. ' +
    'Manfaatkan keadaan sekolah: lingkungan untuk tema, masalah nyata untuk produk/aksi nyata, mitra untuk kemitraan, sarana untuk pemanfaatan digital. ' +
    'Gerakan 7 KAIH memadukan pembiasaan kebiasaan terpilih dengan pengolahan jurnal harian. Cara lainnya harus mengangkat nilai/program unggulan yang ditulis guru. ' +
    'Inspirasi tema (boleh tema lain yang kontekstual): ' + contohTema + '.\n' +
    'Format JSON: {"kegiatan":[{"tema":"…","nama":"nama kegiatan yang menarik, maks 8 kata","ringkasan":"2–3 kalimat gambaran kegiatan",' +
    '"pembiasaan":"khusus 7 KAIH: kebiasaan dan cara pencatatannya; selain itu kosong","kaitan_unggulan":"khusus cara lainnya; selain itu kosong",' +
    '"mapel":["mapel yang terlibat"],"tujuan_pembelajaran":["tujuan pembelajaran mapel terkait, diakhiri (mata pelajaran …)"],' +
    '"praktik_pedagogis":"model/praktik, mis. pembelajaran berbasis proyek","lingkungan_belajar":"1–2 kalimat","mitra":["mitra/narasumber yang realistis"],' +
    '"pemanfaatan_digital":"perangkat/aplikasi yang tersedia","lokasi":"…","produk":"hasil akhir atau aksi nyata murid","jp":angka,"subdimensi":["…"],' +
    '"tujuan_akhir":"satu kalimat diawali Melalui kegiatan … murid mampu …, maks 300 karakter"}]}';
  const j = await gemini(SISTEM, perintah, 14000);
  let keg = (Array.isArray(j.kegiatan) ? j.kegiatan : []).slice(0, p.jumlahKegiatan);
  if (!keg.length) throw new Error('Gemini tidak menyusun kegiatan. Coba lagi.');
  while (keg.length < p.jumlahKegiatan) keg.push({ ...keg[0], nama: keg[0].nama + ' (lanjutan)' });
  keg = keg.map((k, i) => {
    const sub = (Array.isArray(k.subdimensi) ? k.subdimensi : []).map(s => p.subdimensi.find(x => x.toLowerCase() === teks(s).toLowerCase())).filter(Boolean);
    return {
      tema: satuKalimat(k.tema).slice(0, 100), nama: satuKalimat(k.nama).slice(0, 150), bentuk: p.bentuk[i],
      ringkasan: teks(k.ringkasan), pembiasaan: p.bentuk[i] === BENTUK_7KAIH ? teks(k.pembiasaan) : '', kaitan: p.bentuk[i] === BENTUK_LAIN ? teks(k.kaitan_unggulan) : '',
      mapel: daftarTeks(k.mapel).join(', '), tp: daftarTeks(k.tujuan_pembelajaran), praktik: satuKalimat(k.praktik_pedagogis), lingkungan: teks(k.lingkungan_belajar),
      mitra: daftarTeks(k.mitra).join(', '), digital: satuKalimat(k.pemanfaatan_digital), lokasi: satuKalimat(k.lokasi),
      produk: satuKalimat(k.produk), jp: Math.max(1, Math.round(Number(k.jp) || 0)), subdimensi: sub.length ? [...new Set(sub)] : [p.subdimensi[0]],
      tujuan: satuKalimat(k.tujuan_akhir).slice(0, 300)
    };
  });
  // JP dan cakupan subdimensi dipastikan di sini, bukan dipercayakan ke AI
  const jumlah = keg.reduce((a, k) => a + k.jp, 0);
  if (jumlah !== p.jp) {
    let sisa = p.jp;
    keg.forEach((k, i) => { k.jp = i === keg.length - 1 ? sisa : Math.max(1, Math.round(p.jp * k.jp / jumlah)); sisa -= k.jp; });
    if (keg[keg.length - 1].jp < 1) { keg.forEach(k => { k.jp = Math.floor(p.jp / keg.length); }); keg[keg.length - 1].jp += p.jp - keg.reduce((a, k) => a + k.jp, 0); }
  }
  p.subdimensi.forEach(s => { if (!keg.some(k => k.subdimensi.includes(s))) keg[0].subdimensi.push(s); });
  keg.forEach(k => { if (!k.tujuan) k.tujuan = tujuanPola(k); });
  PR.data.tahap1 = { kegiatan: keg };
  selaraskanJp();
  delete PR.data.tahap2; delete PR.data.tahap3;
  PR.data.tahap = 1;
}

async function susunTahap2(){
  const p = PR.data.persiapan, keg = PR.data.tahap1.kegiatan, bagi = bagiPertemuan(keg, slotSemester(p)), hasil = [];
  for (const [i, k] of keg.entries()) {
    const slot = bagi[i], tahap = tahapPertemuan(slot.length, p.porsi);
    tampilSibuk('Menyusun alur kegiatan ' + (i + 1) + ' dari ' + keg.length + ' (' + slot.length + ' pertemuan)…');
    const perintah = ringkasPersiapan(p) + '\n\nKegiatan: "' + k.nama + '" (tema ' + k.tema + ', bentuk ' + k.bentuk + ').\n' +
      'Ringkasan: ' + k.ringkasan + (k.pembiasaan ? '\nPembiasaan 7 KAIH: ' + k.pembiasaan : '') + (k.kaitan ? '\nKaitan program unggulan: ' + k.kaitan : '') +
      '\nMapel: ' + k.mapel + '. Mitra: ' + k.mitra + '. Produk/aksi nyata: ' + k.produk + '.\nSubdimensi: ' + k.subdimensi.join(', ') + '.\nTujuan akhir: ' + k.tujuan + '\n\n' +
      'Rancang TEPAT ' + slot.length + ' pertemuan dengan JP dan tahap berikut (jangan diubah): ' +
      slot.map((s, x) => 'P' + (x + 1) + '=' + s.jp + ' JP, ' + tahap[x]).join('; ') + '. ' +
      'Satu pertemuan = satu hari pelaksanaan; langkah harus muat dalam JP-nya (1 JP = 35 menit). ' +
      'Tahap Memahami: menggali pengetahuan awal dan memahami masalah. Mengaplikasi: menyelidiki, mencoba, membuat produk/aksi nyata. ' +
      'Merefleksi: menyajikan hasil, asesmen sumatif, dan refleksi. Gunakan jenis aktivitas yang dipilih guru (' + p.jenisAktivitas.join(', ') + ')' +
      (k.bentuk === BENTUK_7KAIH ? ' dan sisipkan pengisian serta pembahasan jurnal kebiasaan secara berkala' : '') + '. ' +
      'Setiap pertemuan berisi 3–6 langkah konkret yang bisa langsung dilakukan guru, termasuk kapan asesmen formatif dilakukan.\n' +
      'Format JSON: {"pertemuan":[{"no":1,"judul":"…","jenis":"jenis aktivitas utama","langkah":["…"],"tempat":"…","bahan":"alat dan bahan"}]}';
    const j = await gemini(SISTEM, perintah, 28000);
    const dari = Array.isArray(j.pertemuan) ? j.pertemuan : [];
    hasil.push({ pertemuan: slot.map((s, x) => {
      const a = dari.find(d => Number(d.no) === x + 1) || dari[x] || {};
      return { no: x + 1, minggu: s.minggu, hari: s.hari, jp: s.jp, tahap: tahap[x], judul: satuKalimat(a.judul) || 'Pertemuan ' + (x + 1),
        jenis: satuKalimat(a.jenis), langkah: daftarTeks(a.langkah), tempat: satuKalimat(a.tempat), bahan: satuKalimat(a.bahan) };
    }) });
  }
  PR.data.tahap2 = { kegiatan: hasil };
  delete PR.data.tahap3;
  PR.data.tahap = 2;
}

function rumusanResmi(k){
  return k.subdimensi.map(s => '- ' + s + '\n  Berkembang: ' + PG.resmi[s].Berkembang + '\n  Cakap: ' + PG.resmi[s].Cakap + '\n  Mahir: ' + PG.resmi[s].Mahir).join('\n');
}
async function susunTahap3(){
  const p = PR.data.persiapan, hasil = [];
  for (const [i, k] of PR.data.tahap1.kegiatan.entries()) {
    const pt = PR.data.tahap2.kegiatan[i].pertemuan, alur = pt.map(x => 'P' + x.no + ' ' + x.tahap + ': ' + x.judul).join('; ');
    const dasar = 'Kelas ' + p.kelas + ' (Fase ' + fase(p.kelas) + '). Kegiatan "' + k.nama + '" (' + k.bentuk + '), produk/aksi nyata: ' + k.produk + '.\nAlur: ' + alur +
      '\n\nRumusan resmi tahap capaian (Kepka BSKAP 058/H/KR/2025) untuk subdimensi kegiatan ini:\n' + rumusanResmi(k) + '\n\n';
    tampilSibuk('Menyusun asesmen formatif dan sumatif kegiatan ' + (i + 1) + '…');
    const j1 = await gemini(SISTEM, dasar +
      'Susun perangkat asesmen sesuai Panduan Kokurikuler: formatif selama proses dan sumatif di akhir kegiatan, mengacu pada alur perkembangan dimensi.\n' +
      '(1) indikator lembar observasi: 3 perilaku yang dapat diamati guru untuk setiap subdimensi; ' +
      '(2) penilaian diri murid: 4–5 pernyataan sederhana sesuai usia kelas ' + p.kelas + '; ' +
      '(3) umpan balik teman sebaya: 3 pertanyaan pemandu; (4) jurnal refleksi: 3 pertanyaan pemandu; ' +
      (k.bentuk === BENTUK_7KAIH ? '(5) jurnal kebiasaan: untuk tiap kebiasaan (' + p.kebiasaan.join(', ') + ') satu indikator yang dicatat harian; ' : '') +
      '(6) asesmen sumatif berbasis kinerja/produk dengan rubrik per subdimensi. Deskriptor Mahir, Cakap, dan Berkembang harus sejalan dengan rumusan resmi di atas ' +
      'tetapi dikontekstualkan pada kegiatan ini. Cakap adalah standar yang diharapkan.\n' +
      'Format JSON: {"observasi":[{"subdimensi":"…","indikator":["…","…","…"]}],"penilaian_diri":["…"],"umpan_balik_teman":["…"],"jurnal_refleksi":["…"],' +
      '"jurnal_kebiasaan":[{"kebiasaan":"…","indikator":"…"}],"sumatif":{"bentuk":"…","tugas":"petunjuk tugas untuk murid, 2–4 kalimat",' +
      '"kriteria":[{"subdimensi":"…","aspek":"…","mahir":"…","cakap":"…","berkembang":"…"}]}}', 16000);
    tampilSibuk('Menyusun refleksi tertulis' + (p.soalMapel ? ' dan soal pengetahuan mapel' : '') + ' kegiatan ' + (i + 1) + '…');
    const j2 = await gemini(SISTEM, dasar +
      'Susun REFLEKSI TERTULIS (sumatif, bentuk uraian) yang menggali seluruh pengalaman kegiatan ini dan diarahkan pada subdimensi di atas: ' +
      (k.subdimensi.length > 1 ? '1–2 soal untuk setiap subdimensi, total 3–5 soal' : '3 soal') + '. Bahasa sederhana untuk kelas ' + p.kelas + '. ' +
      'Untuk tiap soal tulis jawaban yang diharapkan dan pedoman skor Mahir/Cakap/Berkembang yang sejalan dengan rumusan resmi.' +
      (p.soalMapel ? ' Selain itu susun 10 soal PILIHAN GANDA pengetahuan mata pelajaran terkait (' + k.mapel + ') dari materi yang dipelajari dalam kegiatan ini, ' +
        'dengan konteks pengalaman kegiatan, 4 pilihan a–d, satu kunci, dan indikator soal. Soal ini untuk asesmen intrakurikuler, bukan untuk menilai dimensi.' : '') +
      '\nFormat JSON: {"uraian":[{"subdimensi":"…","soal":"…","harapan":"jawaban yang diharapkan","mahir":"…","cakap":"…","berkembang":"…"}]' +
      (p.soalMapel ? ',"pg":{"mapel":"…","butir":[{"indikator":"…","soal":"…","pilihan":["a. …","b. …","c. …","d. …"],"kunci":"a|b|c|d"}]}' : '') + '}', 16000);
    const obs = Array.isArray(j1.observasi) ? j1.observasi : [], s = j1.sumatif || {}, kr = Array.isArray(s.kriteria) ? s.kriteria : [];
    const cari = (arr, sub) => arr.find(o => teks(o.subdimensi).toLowerCase() === sub.toLowerCase()) || {};
    const pg = j2.pg && Array.isArray(j2.pg.butir) ? j2.pg : null;
    hasil.push({
      observasi: k.subdimensi.map(sub => ({ subdimensi: sub, indikator: daftarTeks(cari(obs, sub).indikator || []) })),
      diri: daftarTeks(j1.penilaian_diri || []), teman: daftarTeks(j1.umpan_balik_teman || []), jurnal: daftarTeks(j1.jurnal_refleksi || []),
      kebiasaan: k.bentuk === BENTUK_7KAIH ? p.kebiasaan.map(kb => ({ kebiasaan: kb, indikator: satuKalimat(((j1.jurnal_kebiasaan || []).find(x => teks(x.kebiasaan).toLowerCase() === kb.toLowerCase()) || {}).indikator) })) : [],
      sumatif: { bentuk: satuKalimat(s.bentuk), tugas: teks(s.tugas), kriteria: k.subdimensi.map(sub => {
        const c = cari(kr, sub);
        return { subdimensi: sub, aspek: satuKalimat(c.aspek), mahir: satuKalimat(c.mahir), cakap: satuKalimat(c.cakap), berkembang: satuKalimat(c.berkembang) };
      }) },
      uraian: (Array.isArray(j2.uraian) ? j2.uraian : []).slice(0, 5).map(u => ({
        subdimensi: k.subdimensi.find(x => x.toLowerCase() === teks(u.subdimensi).toLowerCase()) || k.subdimensi[0],
        soal: satuKalimat(u.soal), harapan: satuKalimat(u.harapan), mahir: satuKalimat(u.mahir), cakap: satuKalimat(u.cakap), berkembang: satuKalimat(u.berkembang) })),
      pg: p.soalMapel && pg ? { mapel: satuKalimat(pg.mapel) || k.mapel, butir: pg.butir.slice(0, 10).map(b => ({
        indikator: satuKalimat(b.indikator), soal: satuKalimat(b.soal), pilihan: daftarTeks(b.pilihan || []).slice(0, 4), kunci: teks(b.kunci).toLowerCase().slice(0, 1) })) } : null
    });
  }
  PR.data.tahap3 = { kegiatan: hasil };
  PR.data.tahap = 3;
}

/* ---------- server ---------- */
async function muatInfoProgram(){
  const res = await api({ aksi: 'programInfo' });
  if (res.sesiHabis) return false;
  if (!res.ok) {
    // halaman sudah baru tetapi server belum diperbarui pengelola
    pesan('#pg-info', res.pesan === 'Aksi tidak dikenal.' ? 'Menu ini sedang disiapkan dan akan aktif setelah server diperbarui pengelola. Silakan coba lagi nanti.' : res.pesan, false);
    return false;
  }
  PG = res; return true;
}
async function simpanProgram(diam){
  const keg = (PR.data.tahap1 || {}).kegiatan || [];
  const judul = 'Kelas ' + PR.data.persiapan.kelas + ' Semester ' + PR.data.persiapan.semester + (keg.length ? ' · ' + keg.map(k => k.nama).join(' + ') : '');
  const res = await api({ aksi: 'programSimpan', id: PR.id, judul, data: PR.data });
  if (res.sesiHabis) return false;
  if (!res.ok) { pesan('#pg-msg', res.pesan, false); return false; }
  PG_UBAH = false;
  if (!diam) pesan('#pg-msg', 'Tersimpan.', true);
  return true;
}

/* ---------- halaman depan ---------- */
async function bukaProgramKok(){
  tampil('prog');
  $('#pg-kerja').classList.add('hidden'); $('#pg-depan').classList.remove('hidden');
  $('#pg-info').textContent = '';
  renderKunci();
  if (await muatInfoProgram()) renderDepan();
}
function renderDepan(){
  const k = PG.kuota;
  $('#pg-sub').textContent = PG.sekolah.nama + ' · NPSN ' + PG.sekolah.npsn + ' · Tahun ajaran ' + PG.tahunAjaran;
  if (k.lisensiSampai) {
    $('#pg-kuota-judul').textContent = '✅ Lisensi Sekolah aktif sampai ' + tglPanjang(k.lisensiSampai);
    $('#pg-kuota-teks').textContent = 'Semua guru di sekolah ini dapat menyusun program tanpa batas jumlah.';
  } else {
    $('#pg-kuota-judul').textContent = 'Program gratis: tersisa ' + k.sisaGratis + ' dari ' + k.gratis;
    $('#pg-kuota-teks').textContent = 'Dihitung untuk seluruh sekolah (NPSN), bukan per guru. Memperbaiki, menyusun ulang, dan mengunduh ulang program tidak mengurangi kuota.';
  }
  const wa = nomorWa(PG.narahubung);
  const ajak = 'Assalamualaikum, kami dari ' + PG.sekolah.nama + ' (NPSN ' + PG.sekolah.npsn + ') ingin mengaktifkan Lisensi Sekolah Program Kokurikuler di Rapor Merdeka Digital. Mohon informasi kontribusinya.';
  $('#pg-kontribusi').innerHTML = '<b>Merasa terbantu?</b> Sekolah dapat melanjutkan dengan <b>Lisensi Sekolah</b> selama <b>' + k.masaHari + ' hari untuk semua guru</b>, ' +
    'melalui kontribusi pengembangan <b>' + esc(k.kontribusi) + '</b>. Kontribusi ini dipakai untuk memelihara dan mengembangkan aplikasi agar tetap bisa dimanfaatkan guru-guru lain. ' +
    (wa ? '<a href="https://wa.me/' + wa + '?text=' + encodeURIComponent(ajak) + '" target="_blank" rel="noopener"><b>Hubungi Admin lewat WhatsApp</b></a>' : 'Hubungi ' + esc(PG.narahubung)) +
    ' untuk mendapatkan kode aktivasi, lalu masukkan kodenya di tombol 🔑 di atas.' + (PG.infoBayar ? '<br><span class="sub">' + esc(PG.infoBayar) + '</span>' : '');
  $('#pg-kontribusi').classList.toggle('hidden', !!k.lisensiSampai || k.sisaGratis > 1);
  $('#pg-promo').textContent = k.promo && !k.lisensiSampai ? '🎁 ' + k.promo : '';
  $('#pg-promo').classList.toggle('hidden', !k.promo || !!k.lisensiSampai);
  // Petunjuk memulai: selama kuota gratis/lisensi masih ada, kode aktivasi TIDAK diperlukan.
  const adaKunci = !!ls.get(KUNCI_GEMINI);
  $('#pg-aktivasi-buka').classList.toggle('hidden', k.bisaBaru);
  if (k.bisaBaru) {
    $('#pg-siap').innerHTML = '<b class="j">✅ ' + (k.lisensiSampai ? 'Lisensi Sekolah aktif.' : 'Tidak perlu kode aktivasi.') + '</b>' +
      (k.lisensiSampai ? 'Semua guru dapat langsung menyusun program.' : 'Sekolah Anda masih punya <b>' + k.sisaGratis + ' program gratis</b>. Kode aktivasi baru diperlukan setelah kuota gratis habis.') +
      '<ol><li>Isi <b>Kunci API Gemini</b> di bawah (cukup sekali per perangkat): ' + (adaKunci ? '<span class="ok">✓ sudah tersimpan</span>' : '<span class="belum">belum diisi</span>') + '</li>' +
      '<li>Klik <b>Mulai program baru</b>, lalu ikuti tahapnya: Persiapan → Tahap 1 → 2 → 3 → Dokumen.</li></ol>' +
      '<div class="toolbar" style="margin:0"><button class="btn small" type="button" id="pg-siap-mulai">' + (adaKunci ? '+ Mulai program baru' : '🔐 Isi kunci API Gemini dulu') + '</button></div>' +
      (k.lisensiSampai ? '' : '<button class="link-kode" type="button" id="pg-siap-kode">Sudah punya kode aktivasi Lisensi Sekolah? Masukkan di sini</button>');
    $('#pg-siap-mulai').addEventListener('click', () => {
      if (!ls.get(KUNCI_GEMINI)) { $('#pg-kunci-box').open = true; $('#pg-kunci-box').scrollIntoView({ behavior: 'smooth', block: 'start' }); setTimeout(() => $('#pg-kunci').focus(), 300); return; }
      $('#pg-baru').click();
    });
    if ($('#pg-siap-kode')) $('#pg-siap-kode').addEventListener('click', () => { $('#pg-aktivasi').classList.remove('hidden'); $('#pg-kode').focus(); });
  }
  $('#pg-siap').classList.toggle('hidden', !k.bisaBaru);
  $('#pg-baru').disabled = !k.bisaBaru;
  $('#pg-baru-ket').textContent = k.bisaBaru ? (k.lisensiSampai ? '' : 'Memulai program baru memakai 1 dari ' + k.sisaGratis + ' kuota gratis sekolah.') : 'Kuota gratis sudah terpakai. Masukkan kode aktivasi untuk melanjutkan.';
  $('#pg-daftar').innerHTML = PG.program.length ? '<table class="pg-tabel"><thead><tr><th>Program</th><th>Tahun ajaran</th><th>Tahap</th><th>Diubah</th><th></th></tr></thead><tbody>' +
    PG.program.map(p => '<tr><td><b>' + esc(p.judul) + '</b></td><td>' + esc(p.ta) + '</td><td>' + esc(LANGKAH[Math.min(4, (p.tahap || 0) + 1)]) + '</td><td>' + esc(p.diubah) + '</td>' +
      '<td style="white-space:nowrap"><button class="btn small" type="button" data-buka="' + esc(p.id) + '">Buka</button> <button class="btn ghost small" type="button" data-hapus="' + esc(p.id) + '">Hapus</button></td></tr>').join('') +
    '</tbody></table>' : '<p class="hint">Belum ada program. Klik <b>+ Program baru</b> untuk memulai.</p>';
}
function renderKunci(){
  const ada = !!ls.get(KUNCI_GEMINI);
  $('#pg-kunci-status').textContent = ada ? '— tersimpan di perangkat ini ✓' : '— belum diisi';
  $('#pg-kunci').value = ada ? ls.get(KUNCI_GEMINI) : '';
  $('#pg-kunci-box').open = !ada;
}
$('#pg-kunci-uji').addEventListener('click', e => sibuk(e.target, async () => {
  const k = $('#pg-kunci').value.trim();
  // Google kini membuat kunci berawalan "AQ." (dulu "AIza"); keabsahan dipastikan oleh Google saat diuji
  if (!/^[\w.-]{20,}$/.test(k)) return pesan('#pg-kunci-msg', 'Kunci API Gemini belum lengkap atau memuat spasi. Salin ulang seluruh kunci dari aistudio.google.com/apikey.', false);
  ls.set(KUNCI_GEMINI, k);
  try {
    await gemini('Balas hanya dengan JSON.', 'Balas persis: {"ok":true}', 1024);
    pesan('#pg-kunci-msg', 'Kunci berfungsi dan tersimpan di perangkat ini. Anda siap menyusun program.', true);
  } catch (err) { pesan('#pg-kunci-msg', err.message, false); }
  renderKunci(); $('#pg-kunci-box').open = true;
  if (PG) renderDepan();    // status kunci di petunjuk memulai ikut diperbarui
}));
$('#pg-kunci-hapus').addEventListener('click', () => { ls.del(KUNCI_GEMINI); renderKunci(); if (PG) renderDepan(); pesan('#pg-kunci-msg', 'Kunci dihapus dari perangkat ini.', true); });
$('#pg-aktivasi-buka').addEventListener('click', () => { $('#pg-aktivasi').classList.toggle('hidden'); $('#pg-kode').focus(); });
$('#pg-aktivasi').addEventListener('submit', e => { e.preventDefault(); kirim(e.target, async () => {
  const res = await api({ aksi: 'aktivasiKok', kode: $('#pg-kode').value });
  if (res.sesiHabis) return;
  pesan('#pg-aktivasi-msg', res.pesan, res.ok);
  if (res.ok && await muatInfoProgram()) renderDepan();
}); });
$('#pg-daftar').addEventListener('click', async e => {
  const b = e.target.closest('button');
  if (!b) return;
  if (b.dataset.hapus) {
    if (!confirm('Hapus program ini? Kuota yang sudah terpakai tidak kembali.')) return;
    const res = await api({ aksi: 'programHapus', id: b.dataset.hapus });
    pesan('#pg-info', res.pesan, res.ok);
    if (res.ok && await muatInfoProgram()) renderDepan();
  }
  if (b.dataset.buka) sibuk(b, async () => {
    const res = await api({ aksi: 'programBuka', id: b.dataset.buka });
    if (res.sesiHabis) return;
    if (!res.ok) return pesan('#pg-info', res.pesan, false);
    PR = { id: res.id, ta: res.ta, data: res.data };
    LIHAT = res.data.versi === 2 ? Math.min(4, (PR.data.tahap || 0) + 1) : 0;
    bukaKerja();
  });
});
$('#pg-baru').addEventListener('click', () => {
  if (!ls.get(KUNCI_GEMINI)) { pesan('#pg-info', 'Isi dulu Kunci API Gemini (bagian 🔐 di bawah), baru mulai program.', false); $('#pg-kunci-box').open = true; $('#pg-kunci-box').scrollIntoView({ behavior: 'smooth' }); return; }
  PR = { id: '', ta: PG.tahunAjaran, data: { tahap: 0, versi: 2 } }; LIHAT = 0; bukaKerja();
});
$('#pg-kembali').addEventListener('click', async () => {
  if (PG_UBAH && !confirm('Ada perubahan yang belum disimpan. Tinggalkan?')) return;
  PG_UBAH = false; bukaProgramKok();
});

/* ---------- kerja bertahap ---------- */
const polaLama = () => PR.id && PR.data.versi !== 2;
function bukaKerja(){
  $('#pg-depan').classList.add('hidden'); $('#pg-kerja').classList.remove('hidden'); $('#pg-msg').textContent = '';
  render();
}
function render(){
  const t = PR.data.tahap || 0, p = PR.data.persiapan;
  $('#pg-judul').textContent = p ? 'Kelas ' + p.kelas + ' · Semester ' + p.semester + ' · ' + PR.ta : 'Program baru';
  $('#pg-langkah').innerHTML = LANGKAH.map((l, i) => {
    const bisa = PR.id && !polaLama() && !PR.ulang && i <= Math.min(4, t + 1);
    return '<span class="' + (i === LIHAT ? 'on' : i <= t && PR.id ? 'ok' : '') + '"' + (bisa ? ' data-langkah="' + i + '" style="cursor:pointer"' : '') + '>' + (i <= t && PR.id && i !== LIHAT ? '✓ ' : '') + l + '</span>';
  }).join('');
  if (polaLama() && !PR.ulang) return renderLama();
  [renderPersiapan, renderT1, renderT2, renderT3, renderDokumen][LIHAT]();
}
$('#pg-langkah').addEventListener('click', e => {
  const s = e.target.closest('[data-langkah]');
  if (!s) return;
  if (PG_UBAH && !confirm('Perubahan di tahap ini belum disimpan. Pindah tahap?')) return;
  PG_UBAH = false; LIHAT = Number(s.dataset.langkah); $('#pg-msg').textContent = ''; render();
});
/** Program yang disusun sebelum pembaruan: disusun ulang dengan pola baru, tidak memotong kuota. */
function renderLama(){
  const p = PR.data.persiapan || {};
  $('#pg-panel').innerHTML = '<h3 style="margin-top:0">Program ini disusun dengan pola lama</h3>' +
    '<div class="panduan">Pembagian waktu program ini masih memakai pola lama (JP per pertemuan dan pertemuan per minggu diisi bebas), sehingga jadwalnya bisa tidak sesuai ' +
    'alokasi <b>6 JP per minggu (kelas 1–2)</b> atau <b>7 JP per minggu (kelas 3–6)</b>. Aplikasi kini juga menuntun penentuan dimensi, keadaan sekolah, alur sesuai Panduan Kokurikuler, ' +
    'dan asesmen yang lebih lengkap.<br><br>Silakan <b>susun ulang dengan pola baru</b>. Ini <b>tidak memotong kuota</b> sekolah.</div>' +
    (p.kelas ? '<p class="hint">Program lama: kelas ' + p.kelas + ', semester ' + p.semester + ', ' + p.jp + ' JP.</p>' : '') +
    '<div class="toolbar"><button class="btn small" type="button" id="pg-ulang">↻ Susun ulang dengan pola baru</button></div>';
  $('#pg-ulang').addEventListener('click', () => { PR.ulang = true; LIHAT = 0; render(); });
}
function tampilSibuk(t){ const el = $('#pg-sibuk'); if (el) el.textContent = '⏳ ' + t; }
/** Menjalankan satu tahap Gemini: tombol dikunci, hasil langsung disimpan agar tidak hilang. */
async function jalankanAi(btn, fn, lanjut){
  if (!ls.get(KUNCI_GEMINI)) return pesan('#pg-msg', 'Isi dulu kunci API Gemini di halaman depan menu ini (bagian 🔐 Kunci API Gemini).', false);
  await sibuk(btn, async () => {
    btn.insertAdjacentHTML('afterend', '<div class="pg-sibuk" id="pg-sibuk">⏳ Gemini sedang menyusun… biasanya 20–90 detik. Jangan tutup halaman ini.</div>');
    try {
      await fn();
      await simpanProgram(true);
      LIHAT = lanjut; render();
      pesan('#pg-msg', 'Selesai disusun dan tersimpan. Periksa dan koreksi isinya, lalu klik Simpan & lanjut.', true);
    } catch (err) {
      pesan('#pg-msg', err.message, false);
    } finally { const el = $('#pg-sibuk'); if (el) el.remove(); }
  });
}

/* nilai isian → PR.data (data-p = jalur, data-j = jenis: angka | baris | daftar) */
function setJalur(obj, jalur, nilai){
  const k = jalur.split('.'); let o = obj;
  for (let i = 0; i < k.length - 1; i++) o = o[k[i]];
  o[k[k.length - 1]] = nilai;
}
function ambilJalur(obj, jalur){ return jalur.split('.').reduce((o, k) => (o == null ? o : o[k]), obj); }
$('#pg-panel').addEventListener('input', e => {
  const el = e.target, j = el.dataset.p;
  if (!j || el.type === 'checkbox' || !PR.data) return;
  const v = el.dataset.j === 'angka' ? Math.round(Number(el.value) || 0) : el.dataset.j === 'baris' ? el.value.split('\n').map(satuKalimat).filter(Boolean) : el.value;
  setJalur(PR.data, j, v); PG_UBAH = true;
  if (el.dataset.j === 'angka') cekJp();
});
$('#pg-panel').addEventListener('change', e => {
  const el = e.target;
  if (el.type !== 'checkbox' || !el.dataset.daftar) return;
  const arr = ambilJalur(PR.data, el.dataset.daftar), v = el.dataset.nilai;
  setJalur(PR.data, el.dataset.daftar, el.checked ? [...new Set(arr.concat(v))] : arr.filter(x => x !== v));
  PG_UBAH = true;
});
const nilaiIsian = (jalur, jenis) => { const v = ambilJalur(PR.data, jalur); return esc(jenis === 'baris' ? (v || []).join('\n') : v == null ? '' : v); };
const isian = (label, jalur, opsi = {}) => '<label>' + label + '</label>' + (opsi.area
  ? '<textarea data-p="' + jalur + '"' + (opsi.j ? ' data-j="' + opsi.j + '"' : '') + ' rows="' + (opsi.baris || 3) + '">' + nilaiIsian(jalur, opsi.j) + '</textarea>'
  : '<input type="' + (opsi.j === 'angka' ? 'number' : 'text') + '" data-p="' + jalur + '"' + (opsi.j ? ' data-j="' + opsi.j + '"' : '') + ' value="' + nilaiIsian(jalur, opsi.j) + '"' + (opsi.maks ? ' maxlength="' + opsi.maks + '"' : '') + '>');

/* ---------- Persiapan: formulir bertuntun, tanpa AI ---------- */
function tabelPersiapan(p){
  return '<table class="pg-tabel"><tbody>' + [
    ['Kelas / semester', 'Kelas ' + p.kelas + ' (Fase ' + fase(p.kelas) + '), semester ' + p.semester],
    ['Alokasi waktu', p.jp + ' JP semester ini (' + p.jpMinggu + ' JP per minggu, ' + p.minggu + ' minggu efektif; setahun ' + PG.jpTahun[p.kelas] + ' JP)'],
    ['Pola waktu', ketPola(p) + (p.mulai ? '; mulai ' + tglPanjang(p.mulai) : '')],
    ['Bentuk kegiatan', p.bentuk.map((b, i) => 'Kegiatan ' + (i + 1) + ': ' + b).join('; ')],
    ['Kebiasaan 7 KAIH', p.kebiasaan.join(', ') || '–'], ['Nilai/program unggulan', p.unggulan || '–'],
    ['Jenis aktivitas', p.jenisAktivitas.join(', ')], ['Porsi alur', 'Memahami ' + p.porsi.memahami + '% · Mengaplikasi ' + p.porsi.mengaplikasi + '% · Merefleksi ' + p.porsi.merefleksi + '%'],
    ['Subdimensi fokus', p.subdimensi.map(s => s + ' (' + dimensiDari(s) + ')').join('; ')], ['Dasar penentuan dimensi', p.dasarDimensi + (p.sumberData ? ': ' + p.sumberData : '')]
  ].concat(KONTEKS.filter(x => p.konteks[x.k]).map(x => [x.label, p.konteks[x.k]]), [['Soal pengetahuan mapel', p.soalMapel ? 'Ya (intrakurikuler)' : 'Tidak'], ['Guru', p.guru || '–']])
    .map(r => '<tr><th style="width:28%">' + esc(r[0]) + '</th><td>' + esc(r[1]) + '</td></tr>').join('') + '</tbody></table>';
}
function renderPersiapan(){
  const p = PR.data.persiapan;
  if (p && !PR.ulang) {
    $('#pg-panel').innerHTML = '<h3 style="margin-top:0">Persiapan</h3>' + tabelPersiapan(p) +
      '<p class="hint">Persiapan tidak bisa diubah setelah program dimulai. Bila perlu persiapan lain, buat program baru.</p>' +
      '<div class="toolbar"><button class="btn small" type="button" data-ke-langkah="1">Ke Tahap 1 →</button></div>';
    return;
  }
  const lama = p || {}, kelas = Number(lama.kelas || ls.get('pg-kelas')) || 1;
  const sem = Number(lama.semester || PG.semester) || 1;
  const bag = (no, judul, isi) => '<fieldset class="pg-bag"><legend><span>' + no + '</span> ' + judul + '</legend>' + isi + '</fieldset>';
  $('#pg-panel').innerHTML = '<h3 style="margin-top:0">' + (PR.ulang ? 'Susun ulang: persiapan dengan pola baru' : 'Persiapan program') + '</h3>' +
    '<p class="hint">Isi sesuai keputusan tim kokurikuler sekolah. Bagian ini tidak memakai Gemini. Semua isian di bawah menjadi dasar rancangan yang disusun Gemini.</p>' +
    '<form id="pg-form" class="pg-form">' +
    bag('1', 'Kelas dan waktu',
      '<div class="pg-tiga"><div><label>Kelas</label><select id="pf-kelas">' + [1, 2, 3, 4, 5, 6].map(k => '<option value="' + k + '"' + (k === kelas ? ' selected' : '') + '>Kelas ' + k + '</option>').join('') + '</select></div>' +
      '<div><label>Semester</label><select id="pf-semester"><option value="1"' + (sem === 1 ? ' selected' : '') + '>Semester 1 (Ganjil)</option><option value="2"' + (sem === 2 ? ' selected' : '') + '>Semester 2 (Genap)</option></select></div>' +
      '<div><label>Minggu efektif semester ini</label><input id="pf-minggu" type="number" min="1" max="20"><div class="hint">Bawaan 18 minggu; kelas 6 semester 2: 14 minggu.</div></div></div>' +
      '<div class="pg-tiga"><div><label>JP kokurikuler per minggu</label><input id="pf-jpminggu" type="text" readonly><div class="hint">Alokasi setahun : 36 minggu (Panduan, Tabel 6).</div></div>' +
      '<div><label>JP kokurikuler semester ini</label><input id="pf-jp" type="number" min="1"><div class="hint" id="pf-jp-tahun"></div></div>' +
      '<div><label>Tanggal mulai (boleh kosong)</label><input id="pf-mulai" type="date"></div></div>' +
      '<label>Pola waktu pelaksanaan</label><div class="pg-pilihan" id="pf-pola">' +
      ['Dua hari', 'Sehari', 'Blok'].map((x, i) => '<label class="pg-opsi"><input type="radio" name="pola" value="' + x + '"' + ((lama.pola || 'Dua hari') === x ? ' checked' : '') + '><b>' +
        ['Dua hari per minggu', 'Sehari penuh per minggu', 'Blok'][i] + '</b><span class="pg-ket-pola" data-pola="' + x + '"></span></label>').join('') + '</div>' +
      '<div class="pg-dua hidden" id="pf-blok"><div><label>JP per hari blok</label><input id="pf-jphari" type="number" min="2" max="8" value="' + (lama.jpHari || 5) + '"></div>' +
      '<div><label>Hari blok per pekan</label><input id="pf-hariblok" type="number" min="1" max="6" value="' + (lama.hariBlok || 5) + '"></div></div>' +
      '<div class="pg-hitung" id="pf-hitung"></div>') +
    bag('2', 'Dimensi profil lulusan yang diprioritaskan',
      '<div class="panduan"><b>Bagaimana menentukannya?</b> Dimensi prioritas setahun ditentukan dari <b>Kurikulum Satuan Pendidikan (KOSP)</b> yang sudah disusun sekolah, ' +
      'dan/atau dari analisis <b>Rapor Pendidikan</b>. Pilih 1–3 subdimensi yang paling perlu dikuatkan tahun ini (e-Rapor membatasi paling banyak 3).' +
      '<ol style="margin:8px 0 0;padding-left:20px"><li><b>Dari KOSP:</b> buka bagian visi-misi, tujuan sekolah, dan program prioritas profil lulusan; ambil dimensi yang ditetapkan untuk kelas ini.</li>' +
      '<li><b>Dari Rapor Pendidikan:</b> masuk ke <a href="https://raporpendidikan.kemendikdasmen.go.id/login" target="_blank" rel="noopener">raporpendidikan.kemendikdasmen.go.id</a> (akun belajar.id kepala sekolah/operator), ' +
      'buka <b>Rapor Satuan Pendidikan</b>, lalu catat indikator berwarna merah/kuning atau yang menurun. Terjemahkan ke dimensi dengan tabel di bawah.</li></ol>' +
      '<details style="margin-top:8px"><summary><b>Tabel jembatan indikator Rapor Pendidikan → dimensi</b></summary><table class="pg-tabel" style="margin-top:6px"><thead><tr><th>Indikator Rapor Pendidikan</th><th>Dimensi</th><th>Subdimensi terdekat</th></tr></thead><tbody>' +
      JEMBATAN_RAPOR.map(r => '<tr><td>' + esc(r[0]) + '</td><td>' + esc(r[1]) + '</td><td>' + esc(r[2]) + '</td></tr>').join('') +
      '</tbody></table><div class="hint">Tabel ini susunan Tim Penyusun e-book Kokurikuler Siap Jalan, bukan pemetaan resmi. Survei karakter Asesmen Nasional masih memakai enam dimensi Profil Pelajar Pancasila.</div></details></div>' +
      '<div class="pg-dua"><div><label>Dasar penentuan dimensi</label><select id="pf-dasar">' + PG.dasarDimensi.map(x => '<option' + (lama.dasarDimensi === x ? ' selected' : '') + '>' + esc(x) + '</option>').join('') + '</select></div><div></div></div>' +
      '<label>Temuan yang mendasari pilihan (disarankan)</label><textarea id="pf-data" maxlength="600" placeholder="Contoh: Rapor Pendidikan 2025 — nalar kritis 42,6 (kurang, turun 14,3); literasi mengevaluasi teks rendah. KOSP menetapkan penalaran kritis dan kolaborasi sebagai prioritas kelas IV.">' + esc(lama.sumberData || '') + '</textarea>' +
      '<label>Subdimensi fokus (pilih 1–3)</label><div id="pf-sub">' +
      PG.referensi.map(d => '<div class="pg-dim"><b>' + esc(d.dimensi) + '</b><div class="pg-sub">' + d.sub.map(s => '<label title="' + esc('Cakap: ' + PG.resmi[s].Cakap) + '"><input type="checkbox" value="' + esc(s) + '"' + ((lama.subdimensi || []).includes(s) ? ' checked' : '') + '>' + esc(s) + '</label>').join('') + '</div></div>').join('') + '</div>') +
    bag('3', 'Bentuk dan alur kegiatan (Panduan Kokurikuler)',
      '<div class="pg-dua"><div><label>Jumlah kegiatan semester ini</label><select id="pf-keg"><option value="1">1 kegiatan</option><option value="2"' + (lama.jumlahKegiatan === 2 ? ' selected' : '') + '>2 kegiatan</option></select></div><div></div></div>' +
      '<div id="pf-bentuk"></div>' +
      '<div id="pf-7kaih" class="pg-blok hidden"><b>Penentuan pembiasaan (Gerakan 7 KAIH)</b><div class="hint">Pilih kebiasaan yang dibiasakan dan dicatat dalam jurnal harian murid.</div><div class="pg-sub">' +
      PG.kebiasaan.map(x => '<label><input type="checkbox" value="' + esc(x) + '"' + ((lama.kebiasaan || []).includes(x) ? ' checked' : '') + '>' + esc(x) + '</label>').join('') + '</div></div>' +
      '<div id="pf-lain" class="pg-blok hidden"><label>Penentuan nilai/kekhasan/program unggulan sekolah atau kebijakan pemerintah setempat (Cara lainnya)</label>' +
      '<textarea id="pf-unggulan" maxlength="300" placeholder="Contoh: Program unggulan sekolah Adiwiyata — sekolah bebas sampah plastik; kebijakan desa: Kampung Iklim.">' + esc(lama.unggulan || '') + '</textarea></div>' +
      '<label>Jenis aktivitas yang akan dipakai (Panduan, Merancang aktivitas)</label><div class="pg-jenis">' +
      PG.jenisAktivitas.map(x => '<label><input type="checkbox" value="' + esc(x) + '"' + ((lama.jenisAktivitas || []).includes(x) ? ' checked' : '') + '><b>' + esc(x) + '</b><span>' + esc(CONTOH_AKTIVITAS[x] || '') + '</span></label>').join('') + '</div>' +
      '<label>Porsi alur aktivitas (Panduan: pengalaman belajar memahami → mengaplikasi → merefleksi)</label>' +
      '<div class="pg-tiga">' + [['memahami', 'Memahami', 30, 'menggali pengetahuan awal dan memahami masalah'], ['mengaplikasi', 'Mengaplikasi', 50, 'menyelidiki, mencoba, membuat produk/aksi nyata'], ['merefleksi', 'Merefleksi', 20, 'menyajikan hasil, asesmen, dan refleksi']]
        .map(x => '<div><label>' + x[1] + ' (%)</label><input type="number" class="pf-porsi" data-porsi="' + x[0] + '" min="10" max="80" value="' + ((lama.porsi || {})[x[0]] || x[2]) + '"><div class="hint">' + x[3] + '</div></div>').join('') + '</div>' +
      '<div class="hint" id="pf-porsi-cek"></div>') +
    bag('4', 'Keadaan sekolah',
      '<div class="panduan">Tulis keadaan nyata, singkat, dan spesifik. Gemini memakai isian ini agar kegiatan <b>kontekstual</b> dan <b>bisa dilaksanakan</b>. ' +
      'Isi minimal lingkungan atau masalah nyata; makin lengkap, makin tepat hasilnya. Jangan menulis nama murid.</div>' +
      KONTEKS.map(x => '<div class="pg-konteks"><label>' + esc(x.label) + '</label><div class="hint">' + esc(x.tulis) + ' <b>Dipakai untuk:</b> ' + esc(x.pakai) + '.</div>' +
        '<textarea data-konteks="' + x.k + '" maxlength="400" rows="2" placeholder="' + esc('Contoh: ' + x.contoh) + '">' + esc(((lama.konteks || {})[x.k]) || '') + '</textarea></div>').join('') +
      '<details class="hint"><summary>Contoh hasilnya</summary>Lingkungan “dekat sawah dan pasar” + masalah “sampah plastik jajanan” + mitra “bank sampah desa” → tema <i>Gaya Hidup Berkelanjutan</i>, ' +
      'kegiatan <i>Pasar Bebas Plastik</i>: murid mendata sampah jajanan (memahami), membuat tas belanja dari kain bekas dan kampanye ke pedagang bersama bank sampah (mengaplikasi), ' +
      'lalu memamerkan hasil dan merefleksikannya (merefleksi).</details>') +
    bag('5', 'Asesmen dan penyusun',
      '<label class="pg-cek"><input type="checkbox" id="pf-pg"' + (lama.soalMapel ? ' checked' : '') + '> Sertakan <b>10 soal pilihan ganda pengetahuan mapel terkait</b> (asesmen intrakurikuler, opsional)</label>' +
      '<div class="hint">Nilai dimensi di rapor kokurikuler didasarkan pada asesmen formatif dan sumatif (observasi, kinerja/produk, refleksi tertulis), sesuai Panduan. ' +
      'Soal pilihan ganda hanya menilai pengetahuan mapel, sehingga dipakai untuk nilai mapel, bukan untuk deskripsi kokurikuler.</div>' +
      '<label>Nama guru penyusun (untuk dokumen)</label><input id="pf-guru" type="text" maxlength="100" value="' + esc(lama.guru || '') + '">') +
    '<div class="toolbar"><button class="btn small" type="submit">' + (PR.ulang ? 'Susun ulang program' : 'Mulai program') + '</button><span class="sub" id="pf-kuota"></span></div></form>';

  const polaDipilih = () => ($('#pf-pola input:checked') || {}).value || 'Dua hari';
  const bacaPorsi = () => { const o = {}; document.querySelectorAll('.pf-porsi').forEach(x => { o[x.dataset.porsi] = Math.round(Number(x.value) || 0); }); return o; };
  const sementara = () => ({ kelas: Number($('#pf-kelas').value), jp: Number($('#pf-jp').value), jpMinggu: PG.jpMinggu[Number($('#pf-kelas').value)], minggu: Number($('#pf-minggu').value),
    pola: polaDipilih(), jpHari: Number($('#pf-jphari').value), hariBlok: Number($('#pf-hariblok').value) });
  const hitung = () => {
    const s = sementara();
    document.querySelectorAll('.pg-ket-pola').forEach(el => { el.textContent = ketPola({ ...s, pola: el.dataset.pola }).replace(/^[^:]+:\s*/, ''); });
    $('#pf-blok').classList.toggle('hidden', s.pola !== 'Blok');
    if (!(s.jp > 0) || (s.pola === 'Blok' && !(s.jpHari > 1 && s.hariBlok > 0))) { $('#pf-hitung').textContent = ''; return; }
    const sl = slotSemester(s), mg = sl.length ? sl[sl.length - 1].minggu : 0;
    $('#pf-hitung').innerHTML = '📅 <b>' + s.jp + ' JP</b> → <b>' + sl.length + ' pertemuan</b> dalam <b>' + mg + (s.pola === 'Blok' ? ' pekan blok' : ' minggu') + '</b>' +
      (s.pola !== 'Blok' && mg > s.minggu ? ' <span style="color:var(--bad)">— melebihi ' + s.minggu + ' minggu efektif; kurangi JP semester.</span>' : '');
  };
  const isiKelas = (awal) => {
    const k = Number($('#pf-kelas').value), sm = Number($('#pf-semester').value), t = PG.jpTahun[k], jm = PG.jpMinggu[k];
    $('#pf-jpminggu').value = jm + ' JP';
    if (!awal || !lama.minggu) $('#pf-minggu').value = mingguBawaan(k, sm);
    $('#pf-jp-tahun').textContent = 'Alokasi kelas ' + k + ' setahun: ' + t + ' JP. Bawaan: JP per minggu × minggu efektif.';
    $('#pf-jp').max = t;
    if (!awal || !lama.jp) $('#pf-jp').value = Math.min(t, jm * Number($('#pf-minggu').value));
    hitung();
  };
  if (lama.minggu) $('#pf-minggu').value = lama.minggu;
  if (lama.jp) $('#pf-jp').value = lama.jp;
  if (lama.mulai) $('#pf-mulai').value = lama.mulai;
  isiKelas(true);
  $('#pf-kelas').addEventListener('change', () => { ls.set('pg-kelas', $('#pf-kelas').value); isiKelas(); });
  $('#pf-semester').addEventListener('change', () => isiKelas());
  $('#pf-minggu').addEventListener('input', () => { const s = sementara(); $('#pf-jp').value = Math.min(PG.jpTahun[s.kelas], s.jpMinggu * s.minggu); hitung(); });
  ['#pf-jp', '#pf-jphari', '#pf-hariblok'].forEach(id => $(id).addEventListener('input', hitung));
  $('#pf-pola').addEventListener('change', hitung);

  const isiBentuk = () => {
    const n = Number($('#pf-keg').value), kini = [...document.querySelectorAll('.pf-bentuk')].map(x => x.value);
    $('#pf-bentuk').innerHTML = Array.from({ length: n }, (_, i) => {
      const pilih = kini[i] || (lama.bentuk || [])[i] || PG.bentuk[0];
      return '<div class="pg-blok"><label>Bentuk kegiatan ' + (i + 1) + '</label><select class="pf-bentuk">' + PG.bentuk.map(b => '<option' + (b === pilih ? ' selected' : '') + '>' + esc(b) + '</option>').join('') + '</select>' +
        '<div class="hint pf-ket-bentuk"></div><div class="pg-alur pf-alur-bentuk"></div></div>';
    }).join('');
    perbaruiBentuk();
  };
  const perbaruiBentuk = () => {
    document.querySelectorAll('#pf-bentuk .pg-blok').forEach(el => {
      const b = el.querySelector('select').value;
      el.querySelector('.pf-ket-bentuk').textContent = KET_BENTUK[b] || '';
      el.querySelector('.pf-alur-bentuk').innerHTML = TAHAPAN_BENTUK[b].map(t => '<span>' + esc(t) + '</span>').join('<i>→</i>');
    });
    const semua = [...document.querySelectorAll('.pf-bentuk')].map(x => x.value);
    $('#pf-7kaih').classList.toggle('hidden', !semua.includes(BENTUK_7KAIH));
    $('#pf-lain').classList.toggle('hidden', !semua.includes(BENTUK_LAIN));
  };
  isiBentuk();
  $('#pf-keg').addEventListener('change', isiBentuk);
  $('#pf-bentuk').addEventListener('change', perbaruiBentuk);
  const cekPorsi = () => { const o = bacaPorsi(), j = o.memahami + o.mengaplikasi + o.merefleksi;
    $('#pf-porsi-cek').textContent = 'Jumlah: ' + j + '%' + (j === 100 ? ' ✓' : ' — harus 100%'); $('#pf-porsi-cek').style.color = j === 100 ? 'var(--ok)' : 'var(--bad)'; };
  document.querySelectorAll('.pf-porsi').forEach(x => x.addEventListener('input', cekPorsi)); cekPorsi();
  const batasSub = () => {
    const n = $('#pf-sub').querySelectorAll('input:checked').length;
    $('#pf-sub').querySelectorAll('input').forEach(x => { x.disabled = !x.checked && n >= 3; });
  };
  $('#pf-sub').addEventListener('change', batasSub); batasSub();
  $('#pf-kuota').textContent = PR.ulang ? 'Menyusun ulang tidak memotong kuota.' : PG.kuota.lisensiSampai ? 'Lisensi Sekolah aktif.' : 'Memakai 1 dari ' + PG.kuota.sisaGratis + ' kuota gratis yang tersisa.';
  $('#pg-form').addEventListener('submit', e => { e.preventDefault(); kirim(e.target, async () => {
    const s = sementara();
    const persiapan = { kelas: s.kelas, semester: Number($('#pf-semester').value), jp: s.jp, minggu: s.minggu, jumlahKegiatan: Number($('#pf-keg').value),
      pola: s.pola, jpHari: s.jpHari, hariBlok: s.hariBlok, mulai: $('#pf-mulai').value,
      bentuk: [...document.querySelectorAll('.pf-bentuk')].map(x => x.value),
      kebiasaan: [...$('#pf-7kaih').querySelectorAll('input:checked')].map(x => x.value), unggulan: $('#pf-unggulan').value,
      jenisAktivitas: [...document.querySelectorAll('.pg-jenis input:checked')].map(x => x.value), porsi: bacaPorsi(),
      subdimensi: [...$('#pf-sub').querySelectorAll('input:checked')].map(x => x.value), dasarDimensi: $('#pf-dasar').value, sumberData: $('#pf-data').value,
      konteks: Object.fromEntries([...document.querySelectorAll('[data-konteks]')].map(x => [x.dataset.konteks, x.value])),
      soalMapel: $('#pf-pg').checked, guru: $('#pf-guru').value };
    if (persiapan.pola !== 'Blok') {
      const sl = slotSemester({ ...persiapan, jpMinggu: s.jpMinggu });
      if (sl.length && sl[sl.length - 1].minggu > persiapan.minggu) return pesan('#pg-msg', 'JP semester ini tidak muat dalam ' + persiapan.minggu + ' minggu efektif. Kurangi JP atau tambah minggu.', false);
    }
    if (PR.ulang) {
      if (!confirm('Susun ulang program ini? Isi tahap 1–3 yang lama akan diganti. Kuota tidak berkurang.')) return;
      const res = await api({ aksi: 'programUlang', id: PR.id, persiapan });
      if (res.sesiHabis) return;
      if (!res.ok) return pesan('#pg-msg', res.pesan, false, res.salah);
      PR = { id: res.id, ta: res.ta, data: res.data }; LIHAT = 1;
      render(); pesan('#pg-msg', res.pesan, true); return;
    }
    if (!PG.kuota.lisensiSampai && !confirm('Memulai program ini memakai 1 kuota gratis sekolah (tersisa ' + PG.kuota.sisaGratis + '). Lanjutkan?')) return;
    const res = await api({ aksi: 'programMulai', persiapan });
    if (res.sesiHabis) return;
    if (!res.ok) return pesan('#pg-msg', res.pesan, false, res.salah);
    PR = { id: res.id, ta: res.ta, data: res.data }; PG.kuota = res.kuota; LIHAT = 1;
    render(); pesan('#pg-msg', res.pesan, true);
  }); });
}

function cekJp(){
  const el = $('#pg-jp-cek');
  if (!el || !PR.data.tahap1) return;
  const jumlah = PR.data.tahap1.kegiatan.reduce((a, k) => a + (Number(k.jp) || 0), 0), harus = PR.data.persiapan.jp;
  el.textContent = 'Jumlah JP kegiatan: ' + jumlah + ' dari ' + harus + ' JP' + (jumlah === harus ? ' ✓' : ' — harus sama');
  el.style.color = jumlah === harus ? 'var(--ok)' : 'var(--bad)';
}

function renderT1(){
  const d = PR.data.tahap1;
  const tombol = '<button class="btn small" type="button" id="pg-ai1">' + (d ? '✨ Susun ulang Tahap 1' : '✨ Susun rancangan kegiatan (Tahap 1)') + '</button>';
  if (!d) {
    $('#pg-panel').innerHTML = '<h3 style="margin-top:0">Tahap 1 · Rancangan kegiatan</h3><p>Gemini menyusun rancangan setiap kegiatan mengikuti format perencanaan Panduan Kokurikuler: ' +
      'tema, tujuan pembelajaran, praktik pedagogis, lingkungan belajar, kemitraan, pemanfaatan digital, produk akhir, pembagian JP, subdimensi, dan tujuan akhir. Semua bisa Anda koreksi sesudahnya.</p>' + tombol;
  } else {
    const p = PR.data.persiapan, bagi = bagiPertemuan(d.kegiatan, slotSemester(p));
    $('#pg-panel').innerHTML = '<h3 style="margin-top:0">Tahap 1 · Rancangan kegiatan</h3><p class="hint">Periksa dan koreksi. Tema, nama kegiatan, tujuan akhir, dan subdimensi inilah yang nanti diisikan ke e-Rapor. ' +
      'JP kegiatan disesuaikan dengan batas pertemuan (' + esc(ketPola(p)) + ').</p>' +
      d.kegiatan.map((k, i) => { const jl = 'tahap1.kegiatan.' + i;
        return '<div class="pg-blok"><h4>Kegiatan ' + (i + 1) + ' · ' + esc(k.bentuk) + '</h4>' +
        '<div class="pg-dua"><div>' + isian('Tema', jl + '.tema', { maks: 100 }) + '</div><div>' + isian('Nama kegiatan', jl + '.nama', { maks: 150 }) + '</div></div>' +
        isian('Ringkasan kegiatan', jl + '.ringkasan', { area: true }) +
        (k.bentuk === BENTUK_7KAIH ? isian('Penentuan pembiasaan (kebiasaan dan cara pencatatan)', jl + '.pembiasaan', { area: true, baris: 2 }) : '') +
        (k.bentuk === BENTUK_LAIN ? isian('Kaitan dengan nilai/program unggulan', jl + '.kaitan', { area: true, baris: 2 }) : '') +
        isian('B. Tujuan pembelajaran mapel terkait (satu per baris)', jl + '.tp', { area: true, j: 'baris', baris: 3 }) +
        '<div class="pg-dua"><div>' + isian('C. Praktik pedagogis', jl + '.praktik') + '</div><div>' + isian('Lokasi kegiatan', jl + '.lokasi') + '</div></div>' +
        isian('D. Lingkungan belajar', jl + '.lingkungan', { area: true, baris: 2 }) +
        '<div class="pg-tiga"><div>' + isian('Mapel terlibat', jl + '.mapel') + '</div><div>' + isian('E. Kemitraan / narasumber', jl + '.mitra') + '</div><div>' + isian('F. Pemanfaatan digital', jl + '.digital') + '</div></div>' +
        '<div class="pg-dua"><div>' + isian('Produk / aksi nyata', jl + '.produk') + '</div><div>' + isian('JP kegiatan', jl + '.jp', { j: 'angka' }) +
          '<div class="hint">' + bagi[i].length + ' pertemuan, ' + bagi[i].reduce((a, s) => a + s.jp, 0) + ' JP</div></div></div>' +
        '<label>A. Subdimensi kegiatan ini</label><div class="pg-sub">' + p.subdimensi.map(s => '<label><input type="checkbox" data-daftar="' + jl + '.subdimensi" data-nilai="' + esc(s) + '"' + (k.subdimensi.includes(s) ? ' checked' : '') + '>' + esc(s) + '</label>').join('') + '</div>' +
        isian('Tujuan akhir kegiatan (untuk e-Rapor)', jl + '.tujuan', { area: true, baris: 2 }) +
        '<button class="btn ghost small" type="button" data-pola="' + i + '">Susun ulang tujuan dengan pola baku</button></div>'; }).join('') +
      '<div class="toolbar"><b id="pg-jp-cek"></b></div><div class="toolbar">' + tombol + '<button class="btn small" type="button" id="pg-lanjut1">Simpan &amp; lanjut ke Tahap 2 →</button></div>';
    cekJp();
    $('#pg-lanjut1').addEventListener('click', e => sibuk(e.target, async () => {
      const salah = [];
      PR.data.tahap1.kegiatan.forEach((k, i) => {
        if (!teks(k.tema) || !teks(k.nama) || !teks(k.tujuan)) salah.push('Kegiatan ' + (i + 1) + ': tema, nama, dan tujuan akhir wajib diisi.');
        if (!k.subdimensi.length) salah.push('Kegiatan ' + (i + 1) + ': pilih minimal satu subdimensi.');
        if (teks(k.tujuan).length > 300) salah.push('Kegiatan ' + (i + 1) + ': tujuan akhir paling banyak 300 karakter.');
      });
      const jumlah = PR.data.tahap1.kegiatan.reduce((a, k) => a + (Number(k.jp) || 0), 0);
      if (jumlah !== PR.data.persiapan.jp) salah.push('Jumlah JP kegiatan harus ' + PR.data.persiapan.jp + ' JP (sekarang ' + jumlah + ').');
      if (salah.length) return pesan('#pg-msg', salah[0], false, salah);
      const diselaraskan = selaraskanJp();
      if (PR.data.tahap2 && PR.data.tahap2.kegiatan.some((x, i) => x.pertemuan.reduce((a, q) => a + q.jp, 0) !== PR.data.tahap1.kegiatan[i].jp)) {
        delete PR.data.tahap2; delete PR.data.tahap3; PR.data.tahap = 1;      // JP berubah: alur perlu disusun ulang
      } else PR.data.tahap = Math.max(PR.data.tahap, 1);
      if (await simpanProgram(true)) {
        LIHAT = 2; render();
        if (diselaraskan) pesan('#pg-msg', 'JP kegiatan disesuaikan dengan batas pertemuan: ' + PR.data.tahap1.kegiatan.map((k, i) => 'kegiatan ' + (i + 1) + ' = ' + k.jp + ' JP').join(', ') + '.', true);
      }
    }));
  }
  $('#pg-ai1').addEventListener('click', e => {
    if (d && !confirm('Susun ulang Tahap 1? Isi tahap 1–3 yang sekarang akan diganti.')) return;
    jalankanAi(e.target, susunTahap1, 1);
  });
}
$('#pg-panel').addEventListener('click', e => {
  const b = e.target.closest('button');
  if (!b) return;
  if (b.dataset.pola !== undefined) {
    const k = PR.data.tahap1.kegiatan[Number(b.dataset.pola)], t = tujuanPola(k);
    if (!t) return pesan('#pg-msg', 'Isi nama kegiatan dan pilih subdimensi dulu.', false);
    k.tujuan = t; PG_UBAH = true; render();
  }
  if (b.dataset.keLangkah) { LIHAT = Number(b.dataset.keLangkah); render(); }
});

/** Jadwal: urutan pertemuan seluruh kegiatan beserta minggu (pekan blok) dan harinya. */
function timeline(){
  const p = PR.data.persiapan, baris = [];
  (PR.data.tahap2 ? PR.data.tahap2.kegiatan : []).forEach((kg, k) => kg.pertemuan.forEach(pt => {
    baris.push({ k, pt, minggu: pt.minggu, hari: pt.hari, tanggal: p.pola === 'Blok' ? '' : tanggalMinggu(p.mulai, pt.minggu) });
  }));
  return baris;
}
const satuanMinggu = p => (p.pola === 'Blok' ? 'Pekan blok' : 'Minggu');

function renderT2(){
  const d = PR.data.tahap2, p = PR.data.persiapan, bagi = bagiPertemuan(PR.data.tahap1.kegiatan, slotSemester(p));
  const tombol = '<button class="btn small" type="button" id="pg-ai2">' + (d ? '✨ Susun ulang Tahap 2' : '✨ Susun alur & pertemuan (Tahap 2)') + '</button>';
  const info = PR.data.tahap1.kegiatan.map((k, i) => {
    const t = tahapPertemuan(bagi[i].length, p.porsi), n = x => t.filter(y => y === x).length;
    return 'Kegiatan ' + (i + 1) + ' “' + k.nama + '”: ' + k.jp + ' JP → ' + bagi[i].length + ' pertemuan (memahami ' + n('Memahami') + ', mengaplikasi ' + n('Mengaplikasi') + ', merefleksi ' + n('Merefleksi') + ')';
  }).join(' · ');
  if (!d) {
    $('#pg-panel').innerHTML = '<h3 style="margin-top:0">Tahap 2 · Alur & pertemuan</h3><p>Gemini menyusun langkah tiap pertemuan. Jumlah pertemuan, JP, minggu, dan tahap ' +
      'memahami–mengaplikasi–merefleksi dihitung aplikasi dari pola waktu dan porsi alur di Persiapan.</p><p class="hint">' + esc(ketPola(p)) + '. ' + esc(info) + '</p>' + tombol;
  } else {
    const tl = timeline(), sm = satuanMinggu(p);
    $('#pg-panel').innerHTML = '<h3 style="margin-top:0">Tahap 2 · Alur & pertemuan</h3><p class="hint">' + esc(info) + '. Koreksi judul, jenis aktivitas, dan langkah. Satu langkah per baris.</p>' +
      '<details><summary><b>Jadwal</b> (' + tl.length + ' pertemuan dalam ' + (tl.length ? tl[tl.length - 1].minggu : 0) + ' ' + sm.toLowerCase() + ')</summary><table class="pg-tabel" style="margin-top:8px"><thead><tr><th>' + sm + '</th><th>Hari ke-</th><th>Kegiatan</th><th>Pert.</th><th>Tahap</th><th>Judul</th><th>JP</th></tr></thead><tbody>' +
      tl.map(r => '<tr><td>' + r.minggu + (r.tanggal ? '<br><span class="sub">' + esc(r.tanggal) + '</span>' : '') + '</td><td>' + r.hari + '</td><td>' + (r.k + 1) + '</td><td>' + r.pt.no + '</td><td>' + esc(r.pt.tahap) + '</td><td>' + esc(r.pt.judul) + '</td><td>' + r.pt.jp + '</td></tr>').join('') + '</tbody></table></details>' +
      d.kegiatan.map((kg, i) => '<div class="pg-blok"><h4>Kegiatan ' + (i + 1) + ': ' + esc(PR.data.tahap1.kegiatan[i].nama) + '</h4>' + kg.pertemuan.map((pt, x) => {
        const jl = 'tahap2.kegiatan.' + i + '.pertemuan.' + x;
        return '<div class="pg-pt"><div class="kepala">Pertemuan ' + pt.no + ' · ' + sm + ' ' + pt.minggu + ', hari ke-' + pt.hari + ' · ' + pt.jp + ' JP · ' + esc(pt.tahap) + '</div>' +
          '<div class="pg-dua"><div>' + isian('Judul', jl + '.judul') + '</div><div>' + isian('Jenis aktivitas', jl + '.jenis') + '</div></div>' +
          isian('Langkah kegiatan (satu per baris)', jl + '.langkah', { area: true, j: 'baris', baris: Math.max(3, pt.langkah.length) }) +
          '<div class="pg-dua"><div>' + isian('Tempat', jl + '.tempat') + '</div><div>' + isian('Alat dan bahan', jl + '.bahan') + '</div></div></div>';
      }).join('') + '</div>').join('') +
      '<div class="toolbar">' + tombol + '<button class="btn small" type="button" id="pg-lanjut2">Simpan &amp; lanjut ke Tahap 3 →</button></div>';
    $('#pg-lanjut2').addEventListener('click', e => sibuk(e.target, async () => {
      const kosong = d.kegiatan.some(kg => kg.pertemuan.some(pt => !teks(pt.judul) || !pt.langkah.length));
      if (kosong) return pesan('#pg-msg', 'Setiap pertemuan wajib punya judul dan minimal satu langkah.', false);
      PR.data.tahap = Math.max(PR.data.tahap, 2);
      if (await simpanProgram(true)) { LIHAT = 3; render(); }
    }));
  }
  $('#pg-ai2').addEventListener('click', e => {
    if (d && !confirm('Susun ulang Tahap 2? Alur, pertemuan, dan Tahap 3 yang sekarang akan diganti.')) return;
    jalankanAi(e.target, susunTahap2, 2);
  });
}

function renderT3(){
  const d = PR.data.tahap3, p = PR.data.persiapan;
  const tombol = '<button class="btn small" type="button" id="pg-ai3">' + (d ? '✨ Susun ulang Tahap 3' : '✨ Susun perangkat asesmen (Tahap 3)') + '</button>';
  if (!d) {
    $('#pg-panel').innerHTML = '<h3 style="margin-top:0">Tahap 3 · Perangkat asesmen</h3><p>Gemini menyusun perangkat asesmen sesuai Panduan Kokurikuler:</p><ul>' +
      '<li><b>Formatif</b>: lembar observasi, penilaian diri, umpan balik teman sebaya, jurnal refleksi' + (p.kebiasaan.length ? ', jurnal kebiasaan 7 KAIH' : '') + '.</li>' +
      '<li><b>Sumatif</b>: penilaian kinerja/produk dengan rubrik, dan refleksi tertulis (uraian) dengan pedoman penskoran.</li>' +
      (p.soalMapel ? '<li><b>Opsional</b>: 10 soal pilihan ganda pengetahuan mapel terkait (intrakurikuler).</li>' : '') +
      '</ul><p class="hint">Tahap Berkembang, Cakap, dan Mahir mengacu pada rumusan resmi Kepka 058.</p>' + tombol;
  } else {
    const jl0 = i => 'tahap3.kegiatan.' + i;
    $('#pg-panel').innerHTML = '<h3 style="margin-top:0">Tahap 3 · Perangkat asesmen</h3><p class="hint">Teks abu-abu adalah rumusan resmi Kepka 058 sebagai acuan; deskriptor boleh dikontekstualkan tetapi jangan bertentangan.</p>' +
      d.kegiatan.map((kg, i) => '<div class="pg-blok"><h4>Kegiatan ' + (i + 1) + ': ' + esc(PR.data.tahap1.kegiatan[i].nama) + '</h4>' +
        '<h5>Asesmen formatif</h5>' +
        kg.observasi.map((o, x) => isian('Observasi — ' + esc(o.subdimensi) + ': perilaku yang diamati (satu per baris)', jl0(i) + '.observasi.' + x + '.indikator', { area: true, j: 'baris' })).join('') +
        '<div class="pg-tiga"><div>' + isian('Penilaian diri (pernyataan)', jl0(i) + '.diri', { area: true, j: 'baris', baris: 5 }) + '</div><div>' +
          isian('Umpan balik teman sebaya', jl0(i) + '.teman', { area: true, j: 'baris', baris: 5 }) + '</div><div>' + isian('Jurnal refleksi (pertanyaan)', jl0(i) + '.jurnal', { area: true, j: 'baris', baris: 5 }) + '</div></div>' +
        (kg.kebiasaan.length ? '<b>Jurnal kebiasaan 7 KAIH</b>' + kg.kebiasaan.map((kb, x) => isian(esc(kb.kebiasaan) + ' — yang dicatat', jl0(i) + '.kebiasaan.' + x + '.indikator')).join('') : '') +
        '<h5>Asesmen sumatif: kinerja/produk</h5><div class="pg-dua"><div>' + isian('Bentuk', jl0(i) + '.sumatif.bentuk') + '</div><div></div></div>' +
        isian('Tugas untuk murid', jl0(i) + '.sumatif.tugas', { area: true }) +
        kg.sumatif.kriteria.map((c, x) => { const jl = jl0(i) + '.sumatif.kriteria.' + x, r = PG.resmi[c.subdimensi] || {};
          return '<div class="pg-pt"><div class="kepala">Rubrik: ' + esc(c.subdimensi) + '</div>' + isian('Aspek yang dinilai', jl + '.aspek') +
            ['mahir', 'cakap', 'berkembang'].map(l => isian(l[0].toUpperCase() + l.slice(1), jl + '.' + l, { area: true, baris: 2 }) + '<div class="pg-resmi">Resmi: ' + esc(r[l[0].toUpperCase() + l.slice(1)] || '') + '</div>').join('') + '</div>';
        }).join('') +
        '<h5>Asesmen sumatif: refleksi tertulis (uraian)</h5>' +
        kg.uraian.map((u, x) => { const jl = jl0(i) + '.uraian.' + x;
          return '<div class="pg-pt"><div class="kepala">Soal ' + (x + 1) + ' · ' + esc(u.subdimensi) + '</div>' + isian('Soal', jl + '.soal', { area: true, baris: 2 }) +
            isian('Jawaban yang diharapkan', jl + '.harapan', { area: true, baris: 2 }) +
            '<div class="pg-tiga">' + ['mahir', 'cakap', 'berkembang'].map(l => '<div>' + isian('Skor ' + l[0].toUpperCase() + l.slice(1), jl + '.' + l, { area: true, baris: 2 }) + '</div>').join('') + '</div></div>'; }).join('') +
        (kg.pg ? '<h5>Opsional: soal pilihan ganda ' + esc(kg.pg.mapel) + ' (intrakurikuler)</h5>' + kg.pg.butir.map((b, x) => { const jl = jl0(i) + '.pg.butir.' + x;
          return '<div class="pg-pt"><div class="kepala">Nomor ' + (x + 1) + '</div>' + isian('Soal', jl + '.soal', { area: true, baris: 2 }) +
            '<div class="pg-dua"><div>' + isian('Pilihan a–d (satu per baris)', jl + '.pilihan', { area: true, j: 'baris', baris: 4 }) + '</div><div>' + isian('Kunci', jl + '.kunci', { maks: 1 }) + isian('Indikator soal', jl + '.indikator') + '</div></div></div>'; }).join('') : '') +
        '</div>').join('') +
      '<div class="toolbar">' + tombol + '<button class="btn small" type="button" id="pg-lanjut3">Simpan &amp; lanjut ke Dokumen →</button></div>';
    $('#pg-lanjut3').addEventListener('click', e => sibuk(e.target, async () => {
      const kosong = d.kegiatan.some(kg => kg.observasi.some(o => !o.indikator.length) || kg.sumatif.kriteria.some(c => !teks(c.mahir) || !teks(c.cakap) || !teks(c.berkembang)) ||
        !teks(kg.sumatif.tugas) || !kg.uraian.length || kg.uraian.some(u => !teks(u.soal)));
      if (kosong) return pesan('#pg-msg', 'Lengkapi indikator observasi, tugas sumatif, deskriptor Mahir/Cakap/Berkembang, dan soal refleksi tertulis.', false);
      PR.data.tahap = Math.max(PR.data.tahap, 3);
      if (await simpanProgram(true)) { LIHAT = 4; render(); }
    }));
  }
  $('#pg-ai3').addEventListener('click', e => {
    if (d && !confirm('Susun ulang Tahap 3? Perangkat asesmen yang sekarang akan diganti.')) return;
    jalankanAi(e.target, susunTahap3, 3);
  });
}

function renderDokumen(){
  const k1 = PR.data.tahap1.kegiatan, p = PR.data.persiapan;
  $('#pg-panel').innerHTML = '<h3 style="margin-top:0">Dokumen program</h3><p>Program sudah tervalidasi. Dokumen (A4, Arial 11, spasi 1,5) berisi: identitas dan dasar penyusunan, alur pengembangan, alokasi waktu dan jadwal, ' +
    'data untuk e-Rapor, perencanaan tiap kegiatan format A–H sesuai Panduan Kokurikuler (termasuk perangkat asesmen), dan lembar pengesahan.</p>' +
    '<div class="toolbar"><button class="btn small" type="button" id="pg-word">⬇️ Unduh Word (.docx)</button><button class="btn ghost small" type="button" id="pg-docs">📄 Buat Google Docs</button></div><div class="msg" id="pg-dok-msg"></div>' +
    '<h4>Isian untuk e-Rapor</h4><table class="pg-tabel"><thead><tr><th>Tema</th><th>Nama kegiatan</th><th>Tujuan akhir kegiatan</th><th>Dimensi (subdimensi)</th><th></th></tr></thead><tbody>' +
    k1.map((k, i) => '<tr><td>' + esc(k.tema) + '</td><td>' + esc(k.nama) + '</td><td>' + esc(k.tujuan) + '</td><td>' + esc(k.subdimensi.map(s => dimensiDari(s) + ' (' + s + ')').join('; ')) + '</td>' +
      '<td><button class="btn ghost small" type="button" data-salin="' + i + '">📋 Salin</button></td></tr>').join('') + '</tbody></table>' +
    '<div class="panduan" style="margin-top:12px">Agar tema, kegiatan, tujuan akhir, dan subdimensi ini langsung terpakai di menu <b>Kokurikuler</b> (untuk semua rombel kelas ' + p.kelas + ', semester ' + p.semester + '), klik tombol berikut.' +
    (PR.ta !== PG.tahunAjaran ? ' <b>Catatan:</b> program ini untuk tahun ajaran ' + esc(PR.ta) + ', sedangkan tahun ajaran aktif ' + esc(PG.tahunAjaran) + '.' : '') +
    '<div class="toolbar" style="margin-bottom:0"><button class="btn small" type="button" id="pg-pakai">↪ Pakai di menu Kokurikuler</button></div></div><div class="msg" id="pg-pakai-msg"></div>';
  $('#pg-word').addEventListener('click', e => sibuk(e.target, async () => {
    try {
      const dok = await dokumenProgram(), blob = await docx.Packer.toBlob(dok);
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = namaBerkas() + '.docx'; document.body.appendChild(a); a.click(); a.remove();
      pesan('#pg-dok-msg', 'Berkas Word diunduh.', true);
    } catch (err) { pesan('#pg-dok-msg', err.message, false); }
  }));
  $('#pg-docs').addEventListener('click', e => sibuk(e.target, async () => {
    try {
      const dok = await dokumenProgram(), b64 = await docx.Packer.toBase64String(dok);
      const res = await api({ aksi: 'programDocs', id: PR.id, berkas: b64 });
      if (res.sesiHabis) return;
      if (!res.ok) return pesan('#pg-dok-msg', res.pesan, false);
      $('#pg-dok-msg').className = 'msg ok';
      $('#pg-dok-msg').innerHTML = esc(res.pesan) + ' <a href="' + esc(res.url) + '" target="_blank" rel="noopener"><b>Buka Google Docs →</b></a>';
      window.open(res.url, '_blank', 'noopener');
    } catch (err) { pesan('#pg-dok-msg', err.message, false); }
  }));
  $('#pg-panel').querySelectorAll('[data-salin]').forEach(b => b.addEventListener('click', async () => {
    const k = k1[Number(b.dataset.salin)];
    const ok = await salinKePapan([k.tema, k.nama, k.tujuan].map(x => teks(x).replace(/[\t\r\n]+/g, ' ')).join('\t'));
    pesan('#pg-pakai-msg', ok ? 'Tersalin 3 kolom: Tema, Nama Kegiatan, Tujuan Akhir. Tempel di template kokurikuler e-Rapor pada sel Tema.' : 'Gagal menyalin.', ok);
  }));
  $('#pg-pakai').addEventListener('click', e => sibuk(e.target, pakaiDiRapor));
}
const namaBerkas = () => ('Program Kokurikuler Kelas ' + PR.data.persiapan.kelas + ' Smt ' + PR.data.persiapan.semester + ' - ' + PG.sekolah.nama).replace(/[\\/:*?"<>|]/g, '-');

/** Mengisi menu Kokurikuler kelas ini: subdimensi (digabung dengan yang sudah ada) dan kegiatan untuk e-Rapor. */
async function pakaiDiRapor(){
  const p = PR.data.persiapan;
  if (!DATA) { const d = await api({ aksi: 'dataSekolah' }); if (!d.ok) return pesan('#pg-pakai-msg', d.pesan, false); DATA = d; }
  const rombel = DATA.rombel.find(r => r.kelas === p.kelas);
  if (!rombel) return pesan('#pg-pakai-msg', 'Belum ada rombel kelas ' + p.kelas + ' di tahun ajaran aktif. Buat dulu di Data Sekolah & Siswa.', false);
  const kini = await api({ aksi: 'kokRombel', rombel: rombel.id, semester: p.semester });
  if (!kini.ok) return pesan('#pg-pakai-msg', kini.pesan, false);
  const k1 = PR.data.tahap1.kegiatan;
  if (kini.kegiatan.length && !confirm('Kelas ' + p.kelas + ' semester ' + p.semester + ' sudah punya ' + kini.kegiatan.length + ' kegiatan kokurikuler. Ganti dengan kegiatan dari program ini?')) return;
  const sub = [...new Set(kini.dimensi.map(d => d.subdimensi).concat(...k1.map(k => k.subdimensi)))];
  const r1 = await api({ aksi: 'simpanDimensiKok', rombel: rombel.id, semester: p.semester, dimensi: sub });
  if (!r1.ok) return pesan('#pg-pakai-msg', r1.pesan, false, r1.salah);
  const r2 = await api({ aksi: 'simpanKegiatanKok', rombel: rombel.id, semester: p.semester,
    kegiatan: k1.map(k => ({ tema: k.tema, nama: k.nama, tujuan: k.tujuan, subdimensi: k.subdimensi })) });
  if (!r2.ok) return pesan('#pg-pakai-msg', r2.pesan, false, r2.salah);
  pesan('#pg-pakai-msg', 'Menu Kokurikuler kelas ' + p.kelas + ' semester ' + p.semester + ' sudah terisi: ' + sub.length + ' subdimensi dan ' + k1.length + ' kegiatan. Capaian murid diisi di menu Kokurikuler.', true);
}

/* ---------- dokumen Word (pustaka docx): A4, margin 3 cm, Arial 11, spasi 1,5 ---------- */
async function dokumenProgram(){
  await muatPustaka('docx');
  const D = docx, p = PR.data.persiapan, k1 = PR.data.tahap1.kegiatan, k2 = PR.data.tahap2.kegiatan, k3 = PR.data.tahap3.kegiatan;
  const MARGIN = 1701, LEBAR = 11906 - 2 * MARGIN, UNGU = '4B2A8C', HURUF = 'Arial', UKURAN = 22, SPASI = 360;
  // teks berisi "\n" menjadi baris terpisah di Word
  const runs = (t, o = {}) => String(t == null ? '' : t).split('\n').map((x, i) => new D.TextRun({ text: x, break: i ? 1 : undefined, font: HURUF, size: o.size || UKURAN, bold: o.bold, italics: o.italic, color: o.color }));
  const run = (t, o = {}) => runs(t, o)[0];
  const par = (t, o = {}) => new D.Paragraph({ children: Array.isArray(t) ? t : runs(t, o), alignment: o.center ? D.AlignmentType.CENTER : o.justify ? D.AlignmentType.JUSTIFIED : undefined,
    spacing: { before: o.before || 0, after: o.after == null ? 60 : o.after, line: o.line || SPASI }, indent: o.indent ? { left: o.indent, hanging: o.hanging || 0 } : undefined, keepNext: o.keepNext });
  const judul = (t, lv) => new D.Paragraph({ children: [run(t, { bold: true, size: lv === 1 ? 24 : UKURAN, color: lv === 1 ? UNGU : undefined })],
    spacing: { before: lv === 1 ? 240 : 160, after: 80, line: SPASI }, keepNext: true });
  // sel tabel: Arial 11, spasi tunggal agar tabel tetap ringkas
  const sel = (isi, o = {}) => new D.TableCell({
    children: (Array.isArray(isi) ? isi : [isi]).map(x => (x instanceof D.Paragraph ? x : par(x, { bold: o.bold, color: o.color, after: 20, line: 240, center: o.center }))),
    width: { size: o.w, type: D.WidthType.DXA }, shading: o.isi ? { fill: o.isi, type: D.ShadingType.CLEAR, color: 'auto' } : undefined,
    columnSpan: o.span, verticalAlign: o.tengah ? D.VerticalAlign.CENTER : undefined, margins: { top: 40, bottom: 40, left: 80, right: 80 } });
  const tabel = (judulKol, baris, persen, o = {}) => {
    const w = persen.map(x => Math.round(LEBAR * x / 100));
    const kepala = judulKol ? [new D.TableRow({ tableHeader: true, children: judulKol.map((t, i) => sel(t, { w: w[i], bold: true, color: 'FFFFFF', isi: UNGU })) })] : [];
    return new D.Table({ width: { size: LEBAR, type: D.WidthType.DXA }, columnWidths: w,
      rows: kepala.concat(baris.map(b => new D.TableRow({ cantSplit: true, height: o.tinggi ? { value: o.tinggi, rule: D.HeightRule.ATLEAST } : undefined,
        children: b.map((t, i) => sel(t, { w: w[i], bold: o.lbl && i === 0, isi: o.lbl && i === 0 ? 'F1ECFB' : undefined, center: o.tengahKol && o.tengahKol.includes(i) })) }))) });
  };
  const jarak = () => par('', { after: 40 });
  const butir = (arr, o = {}) => arr.map((t, n) => par((o.huruf ? String.fromCharCode(97 + n) + '. ' : (n + 1) + '. ') + t, { indent: 400, hanging: 320, after: 20 }));
  const nomorSub = s => dimensiDari(s) + ' — ' + s;
  /** Bagan alur: kotak-kotak tahapan berurutan dengan panah. */
  const bagan = (langkah, warna) => {
    const n = langkah.length, lebarPanah = 240, lebarKotak = Math.floor((LEBAR - lebarPanah * (n - 1)) / n);
    const tanpa = { style: D.BorderStyle.NONE, size: 0, color: 'FFFFFF' }, garis = { style: D.BorderStyle.SINGLE, size: 6, color: warna };
    const kolom = []; langkah.forEach((t, i) => { kolom.push({ t, kotak: true }); if (i < n - 1) kolom.push({ t: '→' }); });
    return new D.Table({ width: { size: LEBAR, type: D.WidthType.DXA }, columnWidths: kolom.map(k => (k.kotak ? lebarKotak : lebarPanah)),
      borders: { top: tanpa, bottom: tanpa, left: tanpa, right: tanpa, insideHorizontal: tanpa, insideVertical: tanpa },
      rows: [new D.TableRow({ children: kolom.map(k => new D.TableCell({ width: { size: k.kotak ? lebarKotak : lebarPanah, type: D.WidthType.DXA }, verticalAlign: D.VerticalAlign.CENTER,
        borders: k.kotak ? { top: garis, bottom: garis, left: garis, right: garis } : { top: tanpa, bottom: tanpa, left: tanpa, right: tanpa },
        shading: k.kotak ? { fill: 'F1ECFB', type: D.ShadingType.CLEAR, color: 'auto' } : undefined, margins: { top: 60, bottom: 60, left: 60, right: 60 },
        children: [par(k.t, { center: true, size: k.kotak ? (n >= 6 ? 16 : 18) : 24, bold: !k.kotak, after: 0, line: 240, color: k.kotak ? undefined : warna })] })) })] });
  };
  const tl = timeline(), sm = satuanMinggu(p);
  const isi = [];

  isi.push(par([run('PROGRAM KOKURIKULER', { bold: true, size: 32, color: UNGU })], { center: true, after: 40 }));
  isi.push(par([run(PG.sekolah.nama + ' · Tahun Ajaran ' + PR.ta, { bold: true, size: 24 })], { center: true, after: 200 }));
  isi.push(tabel(null, [
    ['Satuan pendidikan', PG.sekolah.nama + ' (NPSN ' + PG.sekolah.npsn + ')'], ['Kelas / fase / semester', ROMAWI[p.kelas] + ' / ' + fase(p.kelas) + ' / ' + (p.semester === 1 ? '1 (Ganjil)' : '2 (Genap)')],
    ['Alokasi waktu', p.jp + ' JP semester ini; ' + p.jpMinggu + ' JP per minggu × ' + p.minggu + ' minggu efektif (alokasi setahun ' + PG.jpTahun[p.kelas] + ' JP; 1 JP = 35 menit)'],
    ['Pola waktu', ketPola(p) + (p.mulai ? '; mulai ' + tglPanjang(p.mulai) : '')],
    ['Kegiatan', k1.map((k, i) => (i + 1) + '. ' + k.nama + ' (' + k.bentuk + ')').join('\n')], ['Fokus profil lulusan', p.subdimensi.map(nomorSub).join('\n')], ['Guru penyusun', p.guru || '—']
  ], [30, 70], { lbl: true }));

  isi.push(judul('I. Dasar Penyusunan', 1));
  isi.push(par('Dimensi profil lulusan yang diprioritaskan ditentukan berdasarkan ' + p.dasarDimensi + '.' + (p.sumberData ? ' Temuan: ' + p.sumberData : ''), { justify: true }));
  isi.push(par([run('Keadaan sekolah yang menjadi dasar kegiatan:', { bold: true })], { before: 80 }));
  isi.push(tabel(['Aspek', 'Keadaan', 'Dipakai untuk'], KONTEKS.filter(x => p.konteks[x.k]).map(x => [x.label, p.konteks[x.k], x.pakai]), [26, 46, 28]));

  isi.push(judul('II. Alur Pengembangan Kokurikuler', 1));
  k1.forEach((k, i) => {
    isi.push(judul('Kegiatan ' + (i + 1) + ': ' + k.bentuk, 2));
    isi.push(bagan(TAHAPAN_BENTUK[k.bentuk], UNGU));
    isi.push(par(KET_BENTUK[k.bentuk].replace(/, misalnya[^.]*\./, '.').replace(/ \(tantangan[^)]*\)/, '') + (k.bentuk === BENTUK_7KAIH ? ' Kebiasaan yang dibiasakan: ' + p.kebiasaan.join(', ') + '.' : '') +
      (k.bentuk === BENTUK_LAIN ? ' Yang diangkat: ' + p.unggulan + '.' : ''), { before: 80, justify: true }));
    const t = k2[i].pertemuan, n = x => t.filter(y => y.tahap === x).length;
    isi.push(par([run('Alur aktivitas (pengalaman belajar):', { bold: true })], { before: 60, keepNext: true }));
    isi.push(bagan(TAHAP_BELAJAR.map(x => x + ' (' + n(x) + ' pertemuan)'), '1B7F3E'));
  });
  isi.push(par('Jenis aktivitas: ' + p.jenisAktivitas.join(', ') + '. Porsi alur: memahami ' + p.porsi.memahami + '%, mengaplikasi ' + p.porsi.mengaplikasi + '%, merefleksi ' + p.porsi.merefleksi + '%.', { before: 80, justify: true }));

  isi.push(judul('III. Alokasi Waktu dan Jadwal', 1));
  isi.push(par('Alokasi kokurikuler kelas ' + ROMAWI[p.kelas] + ' adalah ' + PG.jpTahun[p.kelas] + ' JP per tahun (Panduan Kokurikuler 2025, Tabel 6), atau ' + p.jpMinggu + ' JP per minggu. ' +
    'Semester ini ' + p.jp + ' JP dilaksanakan dengan pola ' + ketPola(p) + ', menjadi ' + tl.length + ' pertemuan dalam ' + (tl.length ? tl[tl.length - 1].minggu : 0) + ' ' + sm.toLowerCase() + '.', { justify: true }));
  isi.push(tabel([sm, 'Hari', 'Keg', 'Pert', 'Tahap', 'Judul pertemuan', 'JP'], tl.map((r, i) => [(i && tl[i - 1].minggu === r.minggu) ? '' : String(r.minggu) + (r.tanggal ? '\n' + r.tanggal : ''),
    String(r.hari), String(r.k + 1), String(r.pt.no), r.pt.tahap, r.pt.judul, String(r.pt.jp)]), [14, 8, 8, 8, 20, 34, 8], { tengahKol: [1, 2, 3, 6] }));

  isi.push(judul('IV. Data untuk e-Rapor', 1));
  isi.push(tabel(['Tema', 'Nama kegiatan', 'Tujuan akhir kegiatan', 'Dimensi (subdimensi)'], k1.map(k => [k.tema, k.nama, k.tujuan, k.subdimensi.map(nomorSub).join('\n')]), [18, 20, 38, 24]));
  isi.push(par('Capaian setiap murid (Berkembang/Cakap/Mahir) ditetapkan pada akhir semester berdasarkan asesmen formatif dan sumatif pada bagian H. Cakap adalah standar yang diharapkan.', { italic: true, before: 60, justify: true }));

  isi.push(judul('V. Perencanaan Kegiatan', 1));
  k1.forEach((k, i) => {
    const pt = k2[i].pertemuan, as = k3[i];
    isi.push(new D.Paragraph({ children: [run('Kegiatan ' + (i + 1) + ': ' + k.nama, { bold: true, size: 24, color: UNGU })], pageBreakBefore: i > 0, spacing: { before: 240, after: 80, line: SPASI }, keepNext: true }));
    isi.push(tabel(null, [['Satuan pendidikan', PG.sekolah.nama], ['Kelas / semester', ROMAWI[p.kelas] + ' / ' + p.semester], ['Tema', k.tema], ['Bentuk', k.bentuk],
      ['Alokasi waktu', k.jp + ' JP · ' + pt.length + ' pertemuan'], ['Lokasi kegiatan', k.lokasi || '—']], [30, 70], { lbl: true }));
    isi.push(judul('A. Dimensi Profil Lulusan', 2));
    isi.push(...butir(k.subdimensi.map(s => nomorSub(s) + '. Target Cakap: ' + PG.resmi[s].Cakap)));
    isi.push(judul('B. Tujuan Pembelajaran', 2));
    isi.push(par('Tujuan akhir kegiatan: ' + k.tujuan, { justify: true }));
    if (k.tp && k.tp.length) { isi.push(par('Kegiatan ini juga menguatkan kompetensi:', { after: 20 })); isi.push(...butir(k.tp)); }
    if (k.pembiasaan) { isi.push(judul('Penentuan Pembiasaan (G7KAIH)', 2)); isi.push(par(k.pembiasaan, { justify: true })); }
    if (k.kaitan) { isi.push(judul('Nilai/Program Unggulan yang Diangkat', 2)); isi.push(par(k.kaitan, { justify: true })); }
    isi.push(judul('C. Praktik Pedagogis', 2)); isi.push(par(k.praktik || '—'));
    isi.push(judul('D. Lingkungan Belajar', 2)); isi.push(par(k.lingkungan || '—', { justify: true }));
    isi.push(judul('E. Kemitraan Pembelajaran', 2)); isi.push(par((k.mapel ? 'Mapel terlibat: ' + k.mapel + '. ' : '') + 'Mitra/narasumber: ' + (k.mitra || '—') + '.', { justify: true }));
    isi.push(judul('F. Pemanfaatan Digital', 2)); isi.push(par(k.digital || '—'));
    isi.push(judul('G. Kegiatan', 2));
    isi.push(par('Produk/aksi nyata: ' + (k.produk || '—') + '. ' + k.ringkasan, { justify: true }));
    TAHAP_BELAJAR.forEach(tb => {
      const daftar = pt.filter(x => x.tahap === tb);
      if (!daftar.length) return;
      isi.push(par([run(tb.toUpperCase(), { bold: true, color: '1B7F3E' })], { before: 120, after: 20, keepNext: true }));
      daftar.forEach(x => {
        isi.push(par([run('Pertemuan ' + x.no + ' (' + sm + ' ' + x.minggu + ', hari ke-' + x.hari + ', ' + x.jp + ' JP) — ', { bold: true }), run(x.judul, { bold: true, color: UNGU })], { before: 60, after: 20, keepNext: true }));
        if (x.jenis || x.tempat || x.bahan) isi.push(par([x.jenis ? 'Aktivitas: ' + x.jenis : '', x.tempat ? 'Tempat: ' + x.tempat : '', x.bahan ? 'Alat dan bahan: ' + x.bahan : ''].filter(Boolean).join(' · '), { italic: true, after: 20 }));
        isi.push(...butir(x.langkah));
      });
    });

    isi.push(judul('H. Asesmen', 2));
    isi.push(par([run('1. Asesmen formatif', { bold: true })], { before: 60, keepNext: true }));
    isi.push(par('a) Observasi dengan instrumen catatan anekdotal. Perilaku yang diamati:', { after: 20 }));
    as.observasi.forEach(o => { isi.push(par([run(nomorSub(o.subdimensi), { bold: true })], { indent: 400, after: 0 })); isi.push(...o.indikator.map(t => par('• ' + t, { indent: 700, hanging: 200, after: 0 }))); });
    const sub = as.observasi.map(o => o.subdimensi), lebarSub = Math.floor(48 / sub.length);
    isi.push(jarak());
    isi.push(tabel(['No', 'Nama murid'].concat(sub.map(s => 'Catatan: ' + s)), Array.from({ length: 10 }, (_, n) => [String(n + 1), ''].concat(sub.map(() => ''))),
      [6, 46 - (48 - lebarSub * sub.length)].concat(sub.map(() => lebarSub)), { tinggi: 400 }));
    isi.push(par('Lanjutkan baris sesuai jumlah murid. Tulis peristiwa singkat yang menjadi bukti, lalu beri kode B (Berkembang), C (Cakap), atau M (Mahir).', { italic: true, before: 40 }));
    if (as.diri.length) {
      isi.push(par('b) Penilaian diri murid (beri tanda ✓):', { before: 80, after: 20, keepNext: true }));
      isi.push(tabel(['No', 'Pernyataan', 'Sudah', 'Belum'], as.diri.map((t, n) => [String(n + 1), t, '', '']), [7, 65, 14, 14], { tengahKol: [0] }));
    }
    if (as.teman.length) { isi.push(par('c) Umpan balik teman sebaya:', { before: 80, after: 20, keepNext: true })); isi.push(...butir(as.teman)); }
    if (as.jurnal.length) { isi.push(par('d) Jurnal refleksi murid:', { before: 80, after: 20, keepNext: true })); isi.push(...butir(as.jurnal)); }
    if (as.kebiasaan.length) {
      isi.push(par('e) Jurnal kebiasaan 7 KAIH (diisi murid setiap hari, ditandatangani orang tua):', { before: 80, after: 20, keepNext: true }));
      isi.push(tabel(['Kebiasaan', 'Yang dicatat', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'], as.kebiasaan.map(x => [x.kebiasaan, x.indikator, '', '', '', '', '', '', '']),
        [20, 38, 6, 6, 6, 6, 6, 6, 6]));
    }
    isi.push(par([run('2. Asesmen sumatif: penilaian kinerja dengan instrumen rubrik', { bold: true })], { before: 120, keepNext: true }));
    isi.push(tabel(null, [['Bentuk', as.sumatif.bentuk || '—'], ['Tugas untuk murid', as.sumatif.tugas]], [25, 75], { lbl: true }));
    isi.push(jarak());
    isi.push(tabel(['Subdimensi / aspek', 'Mahir', 'Cakap', 'Berkembang'], as.sumatif.kriteria.map(c => [c.subdimensi + (c.aspek ? '\n' + c.aspek : ''), c.mahir, c.cakap, c.berkembang]), [22, 26, 26, 26]));
    isi.push(par([run('3. Asesmen sumatif: refleksi tertulis (uraian)', { bold: true })], { before: 120, keepNext: true }));
    isi.push(...butir(as.uraian.map(u => u.soal + ' (' + u.subdimensi + ')')));
    isi.push(par('Pedoman penskoran:', { before: 60, after: 20, keepNext: true }));
    isi.push(tabel(['No', 'Jawaban yang diharapkan', 'Mahir', 'Cakap', 'Berkembang'], as.uraian.map((u, n) => [String(n + 1), u.harapan, u.mahir, u.cakap, u.berkembang]), [6, 30, 21, 22, 21], { tengahKol: [0] }));
    if (as.pg) {
      isi.push(par([run('4. Soal pengetahuan ' + as.pg.mapel + ' (asesmen intrakurikuler, opsional)', { bold: true })], { before: 120, keepNext: true }));
      isi.push(par('Soal ini menilai pengetahuan mata pelajaran yang dipelajari dalam kegiatan dan diolah sebagai nilai mapel, bukan untuk deskripsi kokurikuler.', { italic: true }));
      as.pg.butir.forEach((b, n) => {
        isi.push(par((n + 1) + '. ' + b.soal, { indent: 400, hanging: 320, after: 0, keepNext: true }));
        b.pilihan.forEach(o => isi.push(par(o, { indent: 720, after: 0 })));
      });
      isi.push(par('Kisi-kisi dan kunci jawaban:', { before: 80, after: 20, keepNext: true }));
      isi.push(tabel(['No', 'Indikator soal', 'Kunci'], as.pg.butir.map((b, n) => [String(n + 1), b.indikator, (b.kunci || '').toUpperCase()]), [8, 77, 15], { tengahKol: [0, 2] }));
    }
    isi.push(par([run('5. Pengolahan hasil asesmen', { bold: true })], { before: 120, keepNext: true }));
    isi.push(...butir(['Untuk setiap subdimensi, kumpulkan bukti dari observasi (formatif), kinerja/produk, dan refleksi tertulis (sumatif).',
      'Tetapkan capaian akhir per subdimensi dengan melihat bukti yang paling sering muncul. Bila bukti seimbang, utamakan hasil kinerja/produk.',
      'Tuliskan capaian Berkembang/Cakap/Mahir di menu Kokurikuler Rapor Merdeka Digital; deskripsi rapor tersusun otomatis.',
      'Penilaian diri, umpan balik teman, dan jurnal dipakai untuk umpan balik dan refleksi, bukan untuk dijumlahkan.']));
    isi.push(jarak());
    isi.push(tabel(['No', 'Nama murid'].concat(sub.map(s => s + '\n(Obs / Kinerja / Refleksi → Akhir)')), Array.from({ length: 10 }, (_, n) => [String(n + 1), ''].concat(sub.map(() => '…/…/… → …'))),
      [6, 46 - (48 - lebarSub * sub.length)].concat(sub.map(() => lebarSub)), { tinggi: 400 }));
  });

  isi.push(judul('VI. Pengesahan', 1));
  const ttd = (a, b) => [par(a, { after: 900, line: 240 }), par(b, { line: 240 })];
  const tanpa = { style: D.BorderStyle.NONE, size: 0, color: 'FFFFFF' }, k3w = Math.floor(LEBAR / 3);
  isi.push(new D.Table({ width: { size: LEBAR, type: D.WidthType.DXA }, columnWidths: [k3w, k3w, LEBAR - 2 * k3w],
    borders: { top: tanpa, bottom: tanpa, left: tanpa, right: tanpa, insideHorizontal: tanpa, insideVertical: tanpa }, rows: [new D.TableRow({ children: [
    sel(ttd('Mengetahui,\nKepala Sekolah', '……………………………\nNIP. …………………'), { w: k3w }), sel(ttd('Mengetahui,\nKoordinator Kokurikuler', '……………………………\nNIP. …………………'), { w: k3w }),
    sel(ttd('……………, ……………\nGuru Kelas ' + ROMAWI[p.kelas], (p.guru || '……………………………') + '\nNIP. …………………'), { w: LEBAR - 2 * k3w })] })] }));

  return new D.Document({
    creator: 'Rapor Merdeka Digital', title: 'Program Kokurikuler ' + PG.sekolah.nama,
    styles: { default: { document: { run: { font: HURUF, size: UKURAN }, paragraph: { spacing: { line: SPASI } } } } },
    sections: [{ properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: MARGIN, bottom: MARGIN, left: MARGIN, right: MARGIN } } },
      footers: { default: new D.Footer({ children: [par([run('Program Kokurikuler · ' + PG.sekolah.nama + ' (NPSN ' + PG.sekolah.npsn + ') · disusun dengan Rapor Merdeka Digital', { size: 16, color: '64748B' })], { line: 240 })] }) },
      children: isi }]
  });
}

$('#t-prog').addEventListener('click', () => bukaProgramKok());
window.bukaProgramKok = bukaProgramKok;
})();
