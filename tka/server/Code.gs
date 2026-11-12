/**
 * SERVER SIMULASI TKA (Google Apps Script, terikat pada Google Spreadsheet).
 *
 * Tugas server:
 *  1. Menilai jawaban siswa. Kunci jawaban hanya ada di sini (berkas Kunci.gs), tidak pernah dikirim ke peramban
 *     kecuali kepada pemegang kode akses yang sah.
 *  2. Memeriksa kode akses Pembahasan (lembar "Akses").
 *  3. Mencatat setiap pengerjaan (lembar "Nilai").
 *
 * Berkas di proyek Apps Script:
 *  - Code.gs  : berkas ini (boleh publik).
 *  - Kunci.gs : kunci jawaban & pembahasan (RAHASIA, dikirim terpisah oleh pengembang, JANGAN diunggah ke GitHub).
 *
 * Cara memasang: lihat tka/server/PANDUAN.md.
 */

var PENGATURAN = {
  MAKS_PERANGKAT: 50,         // satu kode akses boleh dipakai di berapa perangkat (HP/laptop) berbeda
  WA_ADMIN: '6281196939694',
  HARI_COBA_PREMIUM: 14,      // coba gratis Kelas Premium (sekali per kelas)
  COBA_ULANG_SEJAK: '2026-11-12T22:10:00Z',   // coba gratis yang dipakai sebelum tanggal ini dianggap belum dipakai (reset)
  KELAS_PER_KODE: 1,          // satu kode akses Pembahasan dapat mengaktifkan Kelas Premium untuk berapa kelas
  JALUR_AKTIF: true,          // Jalur Belajar Bertahap: true = soal lama tidak lagi tercatat ke dasbor kelas (semua soal kelas lewat rilis guru)
  JEDA_KUMPUL_MENIT: 15       // tenggang pengumpulan setelah waktu mengerjakan habis (koneksi lambat)
};

var LEMBAR_AKSES = 'Akses';
var LEMBAR_NILAI = 'Nilai';
var KEPALA_AKSES = ['Kode', 'Nama', 'No. WA', 'Dibuat', 'Aktif', 'Perangkat', 'Dipakai', 'Terakhir dipakai', 'Catatan'];
var KEPALA_NILAI = ['Waktu', 'Nama', 'Sekolah', 'Kelas', 'Paket', 'Nilai', 'Terjawab', 'Kode akses', 'Perangkat', 'Provinsi', 'Kabupaten/Kota', 'Kecamatan', 'Kode kelas', 'Skor per soal', 'Ujian serentak'];
var LEMBAR_KELAS = 'Kelas';
var LEMBAR_UJIAN = 'Ujian';
var KEPALA_UJIAN = ['ID ujian', 'Kode kelas', 'Paket', 'Mulai', 'Selesai', 'Durasi (menit)', 'Dibuat', 'Status'];
var LEMBAR_PESERTA = 'Peserta Ujian';
var KEPALA_PESERTA = ['ID ujian', 'Nama', 'Mulai mengerjakan', 'Selesai', 'Nilai'];
var LEMBAR_RILIS = 'Rilis';
var KEPALA_RILIS = ['Kode kelas', 'Dibuka', 'Diperbarui'];
var LEMBAR_KEMAJUAN = 'Kemajuan';
var KEPALA_KEMAJUAN = ['Kunci', 'Kode kelas', 'Nama', 'Data', 'Diperbarui'];
var KEPALA_KELAS = ['Kode kelas', 'PIN guru', 'Nama guru', 'Sekolah', 'Kelas', 'No. WA', 'Dibuat', 'Daftar siswa', 'Premium sampai', 'Coba gratis dipakai', 'Catatan premium', 'Kode akses'];

/* ============================ WEB APP ============================ */

function doGet(e) {
  if (e && e.parameter && e.parameter.aksi === 'statistik') return json_(statistik_());
  return json_({ ok: true, layanan: 'Simulasi TKA', paket: Object.keys(KUNCI_TKA) });
}

function doPost(e) {
  var req;
  try { req = JSON.parse(e.postData.contents); } catch (err) { return json_({ ok: false, pesan: 'Permintaan tidak valid.' }); }
  try {
    if (req.aksi === 'nilai') return json_(nilai_(req));
    if (req.aksi === 'cekKode') return json_(cekKode_(req));
    if (req.aksi === 'statistik') return json_(statistik_());
    if (req.aksi === 'buatKelas') return json_(buatKelas_(req));
    if (req.aksi === 'cekKelas') return json_(cekKelas_(req));
    if (req.aksi === 'dasbor') return json_(dasbor_(req));
    if (req.aksi === 'aturSiswa') return json_(aturSiswa_(req));
    if (req.aksi === 'cobaPremium') return json_(cobaPremium_(req));
    if (req.aksi === 'premiumDenganKode') return json_(premiumDenganKode_(req));
    if (req.aksi === 'buatUjian') return json_(buatUjian_(req));
    if (req.aksi === 'batalUjian') return json_(batalUjian_(req));
    if (req.aksi === 'cekUjian') return json_(cekUjian_(req));
    if (req.aksi === 'mulaiUjian') return json_(mulaiUjian_(req));
    if (req.aksi === 'statusUjian') return json_(statusUjian_(req));
    if (req.aksi === 'bankGuru') return json_(bankGuru_(req));
    if (req.aksi === 'pembahasanGuru') return json_(pembahasanGuru_(req));
    if (req.aksi === 'simpanRilis') return json_(simpanRilis_(req));
    if (req.aksi === 'izinUlang') return json_(izinUlang_(req));
    if (req.aksi === 'petaSiswa') return json_(petaSiswa_(req));
    if (req.aksi === 'mulaiItem') return json_(mulaiItem_(req));
    return json_({ ok: false, pesan: 'Aksi tidak dikenal.' });
  } catch (err) {
    return json_({ ok: false, pesan: 'Server sedang sibuk. Coba lagi sebentar lagi. (' + err.message + ')' });
  }
}

function json_(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}

/* ============================ PENILAIAN ============================ */

/** Skor satu butir (0–1).
 *  pg  : benar = 1.
 *  pgk : (pilihan benar − pilihan salah) / banyak kunci, paling kecil 0.
 *  bs  : banyak pernyataan yang tepat / banyak pernyataan. */
function skorButir_(kunci, jawab) {
  if (jawab === undefined || jawab === null) return 0;
  if (kunci.t === 'pg') return jawab === kunci.k ? 1 : 0;
  if (kunci.t === 'pgk') {
    if (!Array.isArray(jawab)) return 0;
    var benar = 0, salah = 0, sudah = {};
    jawab.forEach(function (h) {
      if (sudah[h]) return; sudah[h] = true;
      if (kunci.k.indexOf(h) >= 0) benar++; else salah++;
    });
    return Math.max(0, benar - salah) / kunci.k.length;
  }
  if (kunci.t === 'bs') {
    if (!Array.isArray(jawab)) return 0;
    var cocok = 0;
    kunci.k.forEach(function (k, i) { if (jawab[i] === k) cocok++; });
    return cocok / kunci.k.length;
  }
  return 0;
}

function terisi_(jawab) {
  if (jawab === undefined || jawab === null || jawab === '') return false;
  if (Array.isArray(jawab)) return jawab.some(function (x) { return x !== null && x !== undefined; });
  return true;
}

/** Menilai seluruh jawaban satu paket. */
function hitung_(bank, jawaban) {
  var nomor = Object.keys(bank), total = 0, terjawab = 0, skor = {};
  nomor.forEach(function (no) {
    var j = jawaban[no];
    skor[no] = skorButir_(bank[no], j);
    total += skor[no];
    if (terisi_(j)) terjawab++;
  });
  return { skor: skor, nilai: Math.round(total / nomor.length * 10000) / 100, terjawab: terjawab, jumlah: nomor.length };
}

function nilai_(req) {
  var bank = KUNCI_TKA[req.paket];
  if (!bank) return { ok: false, pesan: 'Paket soal tidak dikenal.' };
  var jawaban = (req.jawaban && typeof req.jawaban === 'object') ? req.jawaban : {};
  if (infoItem_(req.paket) && !req.ujian) return nilaiItem_(req, bank, jawaban);
  if (bankEksklusif_(req.paket) && !req.ujian && !req.lihatUlang) return { ok: false, pesan: 'Paket ini hanya dapat dikerjakan lewat ujian serentak.' };
  // Jalur Belajar aktif: soal umum (Paket 1–2 lama dan latihan lama) tidak lagi masuk dasbor kelas, kecuali lewat ujian serentak.
  if (PENGATURAN.JALUR_AKTIF && !req.ujian && req.peserta && req.peserta.kodeKelas) req.peserta.kodeKelas = '';
  var h = hitung_(bank, jawaban);
  var akses = req.kode ? periksaKode_(req.kode, req.perangkat) : null;
  // Kelas Premium membuka semua latihan untuk siswa, tetapi kunci & pembahasan hanya untuk guru (dasbor) dan pemegang kode akses.
  var kelasPremium = (akses && akses.ok) ? null : premiumLewatKelas_(req.peserta);
  // Latihan per indikator: hanya set gratis yang terbuka untuk semua; set lain untuk Kelas Premium atau pemegang kode akses.
  if (latihanTerkunci_(req.paket) && !(akses && akses.ok) && !kelasPremium) {
    return { ok: false, terkunci: true, pesan: 'Latihan ini khusus Kelas Premium atau pemegang kode akses Pembahasan.' };
  }
  var uj = null;
  if (req.ujian && !req.lihatUlang) {
    uj = periksaKirimUjian_(req);
    if (!uj.ok) return uj;
    if (uj.sudah) return { ok: true, nilai: uj.nilai, terjawab: h.terjawab, jumlah: h.jumlah, premium: false, ujian: true };
  }
  if (!req.lihatUlang) catatNilai_(req, h, akses && akses.ok ? akses.kode : '');
  if (uj) catatPesertaUjian_(uj.id, req.peserta.nama, h.nilai);

  var hasil = { ok: true, nilai: h.nilai, terjawab: h.terjawab, jumlah: h.jumlah, premium: false };
  if (uj) hasil.ujian = true;
  var saran = saranLatihan_(req.paket, h.skor);
  if (saran.length) hasil.saran = saran;
  if (akses && akses.ok) {
    hasil.premium = true;
    hasil.nama = akses.nama;
    hasil.rinci = {};
    Object.keys(bank).forEach(function (no) { hasil.rinci[no] = { skor: h.skor[no], kunci: bank[no].k, bahas: bank[no].b }; });
  } else if (akses) {
    hasil.pesanKode = akses.pesan;
  }
  return hasil;
}

/** Remedial otomatis: latihan per indikator untuk soal yang belum benar penuh (skor terendah dahulu, maksimal 5).
 *  Hanya nama latihan yang dikirim, bukan kunci jawaban. */
function saranLatihan_(paket, skor) {
  var m = /^sd-(mat|bi)-/.exec(String(paket));
  var peta = m && typeof LATIHAN_PETA !== 'undefined' ? LATIHAN_PETA[m[1]] : null;
  if (!peta) return [];
  var hasil = [];
  Object.keys(skor).filter(function (no) { return skor[no] < 1 && peta[no]; })
    .sort(function (a, b) { return skor[a] - skor[b] || a - b; })
    .forEach(function (no) { if (hasil.indexOf(peta[no]) < 0 && hasil.length < 5) hasil.push(peta[no]); });
  return hasil;
}

function latihanTerkunci_(paket) {
  if (!/^lt-/.test(String(paket))) return false;
  var gratis = typeof LATIHAN_GRATIS !== 'undefined' ? LATIHAN_GRATIS : [];
  return gratis.indexOf(paket) < 0;
}

/* ============================ KODE AKSES ============================ */

function rapikanKode_(kode) {
  return String(kode || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
}

function cekKode_(req) {
  var a = periksaKode_(req.kode, req.perangkat);
  return a.ok ? { ok: true, nama: a.nama, kode: a.kode } : { ok: false, pesan: a.pesan };
}

/* Pemeriksaan kode dibuat ringan agar server tahan banyak siswa sekaligus (batas Apps Script 30 proses bersamaan):
 *  - Peta kode → baris disimpan di CacheService (10 menit), tidak membaca seluruh lembar Akses setiap kali.
 *  - Perangkat yang sudah terdaftar dilayani tanpa LockService (tanpa antre).
 *  - Lock hanya dipakai saat mendaftarkan perangkat baru; hitungan "Dipakai" diperbarui paling sering sejam sekali per kode.
 *  - Mengedit lembar Akses (atau membuat kode baru lewat menu) langsung mengosongkan cache. */
var CACHE_AKSES = 'akses_v2';
var CACHE_TTL = 600;
var PESAN_TIDAK_DIKENAL = 'Kode akses tidak dikenal. Periksa kembali penulisannya.';

function daftarPerangkat_(nilai) {
  return String(nilai || '').split(',').map(function (s) { return s.trim(); }).filter(String);
}

/** { KODERAPI: [nomorBaris, nama, aktif] } dari cache, atau dibaca ulang dari lembar Akses. */
function petaAkses_(paksa) {
  var cache = CacheService.getScriptCache();
  if (!paksa) {
    var c = cache.get(CACHE_AKSES);
    if (c) return JSON.parse(c);
  }
  var data = lembar_(LEMBAR_AKSES, KEPALA_AKSES).getDataRange().getValues();
  var peta = {};
  for (var r = 1; r < data.length; r++) {
    var k = rapikanKode_(data[r][0]);
    if (k) peta[k] = [r + 1, String(data[r][1] || ''), String(data[r][4] || '').trim().toUpperCase()];
  }
  try { cache.put(CACHE_AKSES, JSON.stringify(peta), CACHE_TTL); } catch (err) { /* terlalu besar: tanpa cache */ }
  return peta;
}

function lupakanAkses_(kodeRapi) {
  var cache = CacheService.getScriptCache();
  cache.remove(CACHE_AKSES);
  if (kodeRapi) cache.remove('dev_' + kodeRapi);
}

/** Memeriksa kode dan mendaftarkan perangkat baru bila masih ada kuota. */
function periksaKode_(kode, perangkat) {
  var dicari = rapikanKode_(kode);
  if (dicari.length < 6) return { ok: false, pesan: PESAN_TIDAK_DIKENAL };
  perangkat = String(perangkat || 'tanpa-id').slice(0, 40);
  var cache = CacheService.getScriptCache();
  var peta = petaAkses_(false), e = peta[dicari];
  if (!e) { peta = petaAkses_(true); e = peta[dicari]; }          // kode baru yang belum masuk cache
  if (!e) return { ok: false, pesan: PESAN_TIDAK_DIKENAL };
  if (e[2] && e[2] !== 'YA') return { ok: false, pesan: 'Kode akses ini sedang tidak aktif. Silakan hubungi Admin.' };

  var sh = lembar_(LEMBAR_AKSES, KEPALA_AKSES);
  var simpananDev = cache.get('dev_' + dicari);
  var daftar = simpananDev !== null ? daftarPerangkat_(simpananDev) : null;
  if (daftar === null) {
    var baris = sh.getRange(e[0], 1, 1, 6).getValues()[0];
    if (rapikanKode_(baris[0]) !== dicari) { lupakanAkses_(dicari); return periksaKodeLambat_(dicari, perangkat); }   // baris bergeser
    daftar = daftarPerangkat_(baris[5]);
    cache.put('dev_' + dicari, daftar.join(', '), CACHE_TTL);
  }

  if (daftar.indexOf(perangkat) >= 0) {
    // jalur cepat: perangkat sudah terdaftar, tanpa antre
    if (!cache.get('pakai_' + dicari)) {
      cache.put('pakai_' + dicari, '1', 3600);
      try { if (rapikanKode_(sh.getRange(e[0], 1).getValue()) === dicari) sh.getRange(e[0], 8).setValue(new Date()); } catch (err) { /* tidak penting */ }
    }
    return { ok: true, nama: e[1], kode: kodeAsli_(sh, e[0], dicari) };
  }
  return periksaKodeLambat_(dicari, perangkat);
}

function kodeAsli_(sh, baris, dicari) {
  var c = CacheService.getScriptCache(), k = c.get('asli_' + dicari);
  if (k) return k;
  k = String(sh.getRange(baris, 1).getValue());
  c.put('asli_' + dicari, k, 21600);
  return k;
}

/** Jalur lambat dengan lock: mendaftarkan perangkat baru (atau mencari ulang bila baris bergeser). */
function periksaKodeLambat_(dicari, perangkat) {
  var kunci = LockService.getScriptLock();
  kunci.waitLock(15000);
  try {
    var sh = lembar_(LEMBAR_AKSES, KEPALA_AKSES);
    var data = sh.getDataRange().getValues();
    for (var r = 1; r < data.length; r++) {
      if (rapikanKode_(data[r][0]) !== dicari) continue;
      var aktif = String(data[r][4]).trim().toUpperCase();
      if (aktif && aktif !== 'YA') return { ok: false, pesan: 'Kode akses ini sedang tidak aktif. Silakan hubungi Admin.' };
      var daftar = daftarPerangkat_(data[r][5]);
      if (daftar.indexOf(perangkat) < 0) {
        if (daftar.length >= PENGATURAN.MAKS_PERANGKAT) {
          return { ok: false, pesan: 'Kode akses ini sudah dipakai di ' + PENGATURAN.MAKS_PERANGKAT + ' perangkat. Hubungi Admin bila perlu dipindahkan ke perangkat baru.' };
        }
        daftar.push(perangkat);
        sh.getRange(r + 1, 6).setValue(daftar.join(', '));
      }
      sh.getRange(r + 1, 7, 1, 2).setValues([[(Number(data[r][6]) || 0) + 1, new Date()]]);
      CacheService.getScriptCache().put('dev_' + dicari, daftar.join(', '), CACHE_TTL);
      return { ok: true, nama: String(data[r][1] || ''), kode: String(data[r][0]) };
    }
    return { ok: false, pesan: PESAN_TIDAK_DIKENAL };
  } finally {
    kunci.releaseLock();
  }
}

/** Admin mengubah lembar Akses (menonaktifkan kode, mengosongkan Perangkat, menambah/menghapus baris):
 *  cache dikosongkan agar perubahan langsung berlaku. */
function onEdit(e) {
  try {
    if (!e || !e.range) return;
    var sh = e.range.getSheet(), awal = e.range.getRow(), n = Math.min(e.range.getNumRows(), 200);
    var cache = CacheService.getScriptCache();
    if (sh.getName() === LEMBAR_RILIS) {
      sh.getRange(awal, 1, n, 1).getValues().forEach(function (b) { var k = rapikanKode_(b[0]); if (k) cache.remove('rilis_' + k); });
      return;
    }
    if (sh.getName() === LEMBAR_KELAS) {
      sh.getRange(awal, 1, n, 1).getValues().forEach(function (b) { var k = rapikanKode_(b[0]); if (k) cache.remove('kelas_' + k); });
      return;
    }
    if (sh.getName() !== LEMBAR_AKSES) return;
    cache.remove(CACHE_AKSES);
    sh.getRange(awal, 1, n, 1).getValues().forEach(function (b) { var k = rapikanKode_(b[0]); if (k) cache.remove('dev_' + k); });
  } catch (err) { /* abaikan */ }
}

/* ============================ PENCATATAN ============================ */

function catatNilai_(req, h, kode) {
  try {
    var p = req.peserta || {};
    var potong = function (s) { return String(s || '').slice(0, 80); };
    lembar_(LEMBAR_NILAI, KEPALA_NILAI).appendRow([new Date(), potong(p.nama), potong(p.sekolah), potong(p.kelas), req.paket, h.nilai, h.terjawab + '/' + h.jumlah, kode, potong(req.perangkat),
      potong(p.provinsi), potong(p.kabupaten), potong(p.kecamatan), rapikanKode_(p.kodeKelas).slice(0, 12),
      Object.keys(h.skor).sort(function (a, b) { return a - b; }).map(function (n) { return Math.round(h.skor[n] * 100) / 100; }).join(','),
      req.ujian ? String(req.ujian).slice(0, 12) : '']);
  } catch (err) { /* pencatatan gagal tidak boleh menggagalkan penilaian */ }
}

function lembar_(nama, kepala) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(nama);
  if (!sh) {
    sh = ss.insertSheet(nama);
    sh.getRange(1, 1, 1, kepala.length).setValues([kepala]).setFontWeight('bold').setBackground('#12314f').setFontColor('#ffffff');
    sh.setFrozenRows(1);
  } else if (sh.getLastColumn() < kepala.length) {
    // lembar lama: tambahkan judul kolom baru tanpa mengubah data
    sh.getRange(1, 1, 1, kepala.length).setValues([kepala]).setFontWeight('bold').setBackground('#12314f').setFontColor('#ffffff');
  }
  return sh;
}

/* ============================ KELAS & DASBOR GURU ============================ */

/** Guru membuat kelas: mendapat kode kelas (dibagikan ke siswa) dan PIN guru (rahasia, untuk membuka dasbor). */
function buatKelas_(req) {
  var potong = function (s, n) { return String(s || '').trim().slice(0, n || 60); };
  var nama = potong(req.nama), kelas = potong(req.kelas, 30), sekolah = potong(req.sekolah, 80);
  if (!nama || !kelas || !sekolah) return { ok: false, pesan: 'Lengkapi nama guru, sekolah, dan kelas.' };
  var huruf = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  var kunci = LockService.getScriptLock();
  kunci.waitLock(15000);
  try {
    var sh = lembar_(LEMBAR_KELAS, KEPALA_KELAS);
    var ada = {};
    sh.getDataRange().getValues().slice(1).forEach(function (b) { ada[rapikanKode_(b[0])] = true; });
    var kode;
    do { kode = ''; for (var i = 0; i < 6; i++) kode += huruf.charAt(Math.floor(Math.random() * huruf.length)); } while (ada[kode]);
    var pin = String(Math.floor(100000 + Math.random() * 900000));
    sh.appendRow([kode, "'" + pin, nama, sekolah, kelas, "'" + potong(req.wa, 20), new Date(), rapikanSiswa_(req.siswa).join('\n')]);
    CacheService.getScriptCache().remove('kelas_' + kode);
    return { ok: true, kode: kode, pin: pin, nama: nama, sekolah: sekolah, kelas: kelas, siswa: rapikanSiswa_(req.siswa) };
  } finally { kunci.releaseLock(); }
}

/** Data kelas berdasarkan kode (disimpan sementara 5 menit agar perubahan manual di lembar Kelas cepat terbaca). */
function dataKelas_(kode) {
  kode = rapikanKode_(kode);
  if (kode.length < 4) return null;
  var c = CacheService.getScriptCache(), k = c.get('kelas_' + kode);
  if (k) return JSON.parse(k);
  var hasil = null;
  lembar_(LEMBAR_KELAS, KEPALA_KELAS).getDataRange().getValues().slice(1).some(function (b) {
    if (rapikanKode_(b[0]) !== kode) return false;
    hasil = { kode: kode, pin: String(b[1]).replace(/^'/, ''), guru: String(b[2]), sekolah: String(b[3]), kelas: String(b[4]), siswa: rapikanSiswa_(b[7]),
      premiumSampai: waktu_(b[8]), cobaDipakai: cobaDipakai_(b[9]), masaCoba: String(b[10] || '').indexOf('Coba') === 0 };
    return true;
  });
  if (hasil) c.put('kelas_' + kode, JSON.stringify(hasil), 300);
  return hasil;
}

/** Daftar nama siswa: dari teks (satu nama per baris) atau array; dirapikan, tanpa duplikat, maksimal 60 nama. */
function rapikanSiswa_(v) {
  var a = Array.isArray(v) ? v : String(v || '').split(/\r?\n|;/);
  var lihat = {}, hasil = [];
  a.forEach(function (n) {
    n = String(n || '').replace(/^\s*\d+[.)]\s*/, '').replace(/\s+/g, ' ').trim().slice(0, 60);
    var k = n.toLowerCase();
    if (n && !lihat[k] && hasil.length < 60) { lihat[k] = 1; hasil.push(n); }
  });
  return hasil;
}

/** Guru mengubah daftar nama siswa (butuh PIN). */
function aturSiswa_(req) {
  var k = dataKelas_(req.kode);
  if (!k || String(req.pin || '').trim() !== k.pin) return { ok: false, pesan: 'Kode kelas atau PIN guru salah.' };
  var siswa = rapikanSiswa_(req.siswa);
  var kunci = LockService.getScriptLock();
  kunci.waitLock(15000);
  try {
    var sh = lembar_(LEMBAR_KELAS, KEPALA_KELAS), data = sh.getDataRange().getValues();
    for (var r = 1; r < data.length; r++) {
      if (rapikanKode_(data[r][0]) !== k.kode) continue;
      sh.getRange(r + 1, 8).setValue(siswa.join('\n'));
      CacheService.getScriptCache().remove('kelas_' + k.kode);
      return { ok: true, siswa: siswa };
    }
    return { ok: false, pesan: 'Kelas tidak ditemukan.' };
  } finally { kunci.releaseLock(); }
}

/** Siswa memeriksa kode kelas sebelum mengerjakan (tanpa PIN). */
function cekKelas_(req) {
  var k = dataKelas_(req.kode);
  return k ? { ok: true, kode: k.kode, guru: k.guru, sekolah: k.sekolah, kelas: k.kelas, siswa: k.siswa || [], premium: premiumAktif_(k), jalur: PENGATURAN.JALUR_AKTIF } : { ok: false, pesan: 'Kode kelas tidak ditemukan. Periksa kembali kode dari gurumu.' };
}

/** Dasbor guru: semua pengerjaan siswa di kelas itu (butuh PIN). */
function dasbor_(req) {
  var k = dataKelas_(req.kode);
  if (!k || String(req.pin || '').trim() !== k.pin) return { ok: false, pesan: 'Kode kelas atau PIN guru salah.' };
  var data = lembar_(LEMBAR_NILAI, KEPALA_NILAI).getDataRange().getValues().slice(1);
  var baris = [];
  data.forEach(function (b) {
    if (rapikanKode_(b[12]) !== k.kode) return;
    baris.push({ waktu: b[0] instanceof Date ? b[0].getTime() : String(b[0]), nama: String(b[1]), paket: String(b[4]), nilai: Number(b[5]) || 0,
      terjawab: String(b[6]), skor: String(b[13] || '').split(',').filter(String).map(Number), ujian: String(b[14] || '') });
  });
  return { ok: true, kelas: { kode: k.kode, guru: k.guru, sekolah: k.sekolah, kelas: k.kelas }, siswa: k.siswa || [], baris: baris, premium: infoPremium_(k), ujian: daftarUjian_(k.kode),
    rilis: dataRilis_(k.kode), kemajuan: kemajuanKelas_(k.kode), jalurAktif: PENGATURAN.JALUR_AKTIF, sekarang: Date.now() };
}

/* ============================ KELAS PREMIUM ============================ */
/* Kolom "Premium sampai" (I) di lembar Kelas menentukan status Premium. Diisi oleh:
 *  - guru sendiri: "Coba Premium gratis" sekali per kelas (PENGATURAN.HARI_COBA_PREMIUM hari), atau
 *  - Admin: menu "Aktifkan Kelas Premium…" setelah dukungan diterima (berlaku satu tahun ajaran). */

function waktu_(v) {
  if (v instanceof Date) return v.getTime();
  var t = v ? new Date(v).getTime() : 0;
  return isNaN(t) ? 0 : t;
}

/** Coba gratis dianggap terpakai hanya bila dipakai sejak tanggal reset terakhir. */
function cobaDipakai_(v) { return !!v && waktu_(v) >= waktu_(PENGATURAN.COBA_ULANG_SEJAK); }

function premiumAktif_(k) { return !!(k && k.premiumSampai && k.premiumSampai > Date.now()); }

function infoPremium_(k) {
  return { aktif: premiumAktif_(k), sampai: k.premiumSampai || 0, cobaDipakai: !!k.cobaDipakai, masaCoba: !!k.masaCoba, hariCoba: PENGATURAN.HARI_COBA_PREMIUM };
}

/** Siswa di Kelas Premium boleh mengerjakan semua latihan. Bila guru mengisi daftar siswa, nama harus ada di daftar. */
function premiumLewatKelas_(peserta) {
  var kode = peserta && peserta.kodeKelas;
  if (!kode) return null;
  var k = dataKelas_(kode);
  if (!premiumAktif_(k)) return null;
  if (k.siswa && k.siswa.length) {
    var nama = String(peserta.nama || '').replace(/\s+/g, ' ').trim().toLowerCase();
    if (!k.siswa.some(function (n) { return n.toLowerCase() === nama; })) return null;
  }
  return k.kelas + ' · ' + k.sekolah;
}

function ubahKelas_(kode, ubah) {
  var kunci = LockService.getScriptLock();
  kunci.waitLock(15000);
  try {
    var sh = lembar_(LEMBAR_KELAS, KEPALA_KELAS), data = sh.getDataRange().getValues();
    for (var r = 1; r < data.length; r++) {
      if (rapikanKode_(data[r][0]) !== kode) continue;
      var baris = data[r].slice(0, KEPALA_KELAS.length);
      while (baris.length < KEPALA_KELAS.length) baris.push('');
      var hasil = ubah(baris);
      if (hasil && hasil.ok === false) return hasil;
      sh.getRange(r + 1, 9, 1, 4).setValues([baris.slice(8, 12)]);   // hanya kolom Premium (I–L) yang ditulis
      CacheService.getScriptCache().remove('kelas_' + kode);
      return hasil || { ok: true };
    }
    return { ok: false, pesan: 'Kelas tidak ditemukan.' };
  } finally { kunci.releaseLock(); }
}

/** Guru mengaktifkan coba gratis Kelas Premium (sekali per kelas, butuh PIN). */
function cobaPremium_(req) {
  var k = dataKelas_(req.kode);
  if (!k || String(req.pin || '').trim() !== k.pin) return { ok: false, pesan: 'Kode kelas atau PIN guru salah.' };
  var hasil = ubahKelas_(k.kode, function (b) {
    if (cobaDipakai_(b[9])) return { ok: false, pesan: 'Coba gratis Premium sudah pernah dipakai untuk kelas ini.' };
    var sampai = new Date(Date.now() + PENGATURAN.HARI_COBA_PREMIUM * 86400000);
    if (waktu_(b[8]) < sampai.getTime()) b[8] = sampai;
    b[9] = new Date();
    b[10] = 'Coba gratis ' + PENGATURAN.HARI_COBA_PREMIUM + ' hari';
    return { ok: true };
  });
  if (!hasil.ok) return hasil;
  return { ok: true, premium: infoPremium_(dataKelas_(k.kode)) };
}

/** Guru yang sudah membeli kode akses Pembahasan memakai kode itu untuk mengaktifkan Kelas Premium (1 tahun ajaran). */
function premiumDenganKode_(req) {
  var k = dataKelas_(req.kode);
  if (!k || String(req.pin || '').trim() !== k.pin) return { ok: false, pesan: 'Kode kelas atau PIN guru salah.' };
  var a = periksaKode_(req.kodeAkses, 'kelas-' + k.kode);
  if (!a.ok) return { ok: false, pesan: a.pesan };
  var dipakai = 0, sh = lembar_(LEMBAR_KELAS, KEPALA_KELAS);
  sh.getDataRange().getValues().slice(1).forEach(function (b) { if (rapikanKode_(b[11]) === rapikanKode_(a.kode) && rapikanKode_(b[0]) !== k.kode) dipakai++; });
  var sampai = akhirTahunAjaran_(new Date());
  var h = ubahKelas_(k.kode, function (b) {
    if (rapikanKode_(b[11]) === rapikanKode_(a.kode)) {
      if (waktu_(b[8]) > Date.now()) return { ok: true };
      return { ok: false, pesan: 'Kode ini sudah pernah mengaktifkan Premium untuk kelas ini. Untuk tahun ajaran baru, hubungi Admin.' };
    }
    if (dipakai >= PENGATURAN.KELAS_PER_KODE) return { ok: false, pesan: 'Kode akses ini sudah dipakai untuk Kelas Premium lain. Satu kode berlaku untuk ' + PENGATURAN.KELAS_PER_KODE + ' kelas. Hubungi Admin bila perlu kelas tambahan.' };
    if (waktu_(b[8]) < sampai.getTime()) b[8] = sampai;
    b[10] = 'Premium dari kode akses (' + a.nama + ')';
    b[11] = a.kode;
    return { ok: true };
  });
  if (!h.ok) return h;
  return { ok: true, premium: infoPremium_(dataKelas_(k.kode)) };
}

/** Kunci & pembahasan satu paket untuk guru Kelas Premium. */
function pembahasanGuru_(req) {
  var k = dataKelas_(req.kode);
  if (!k || String(req.pin || '').trim() !== k.pin) return { ok: false, pesan: 'Kode kelas atau PIN guru salah.' };
  // Kunci & pembahasan di dasbor guru (termasuk cetak kunci latihan Jalur Belajar) khusus Kelas Premium.
  if (!premiumAktif_(k)) return { ok: false, pesan: 'Kunci & pembahasan untuk guru tersedia di Kelas Premium.' };
  var bank = KUNCI_TKA[req.paket];
  if (!bank) return { ok: false, pesan: 'Paket soal tidak dikenal.' };
  var rinci = {};
  Object.keys(bank).forEach(function (no) { rinci[no] = { kunci: bank[no].k, bahas: bank[no].b }; });
  return { ok: true, rinci: rinci };
}

/** Akhir masa Premium berbayar: 31 Juli setelah tahun ajaran berjalan selesai.
 *  Aktivasi Januari–April → 31 Juli tahun ini; Mei–Desember → 31 Juli tahun depan (sudah mencakup tahun ajaran berikutnya). */
function akhirTahunAjaran_(dari) {
  var th = dari.getFullYear() + (dari.getMonth() >= 4 ? 1 : 0);
  return new Date(th, 6, 31, 23, 59, 59);
}

function aktifkanPremium(kode) {
  kode = rapikanKode_(kode);
  var sampai = akhirTahunAjaran_(new Date());
  var h = ubahKelas_(kode, function (b) {
    if (waktu_(b[8]) < sampai.getTime()) b[8] = sampai;
    b[10] = 'Premium tahun ajaran, diaktifkan ' + Utilities.formatDate(new Date(), 'Asia/Jakarta', 'd MMM yyyy');
    return { ok: true, guru: String(b[2]), kelas: String(b[4]), sekolah: String(b[3]), sampai: b[8] };
  });
  return h;
}

function menuAktifkanPremium() {
  var ui = SpreadsheetApp.getUi();
  var r = ui.prompt('Aktifkan Kelas Premium', 'Kode kelas (6 huruf, dari guru):', ui.ButtonSet.OK_CANCEL);
  if (r.getSelectedButton() !== ui.Button.OK || !r.getResponseText().trim()) return;
  var h = aktifkanPremium(r.getResponseText());
  if (!h.ok) { ui.alert(h.pesan); return; }
  var tgl = Utilities.formatDate(h.sampai, 'Asia/Jakarta', 'd MMMM yyyy');
  ui.alert('Kelas Premium aktif sampai ' + tgl,
    'Kirimkan pesan ini kepada guru:\n\nTerima kasih atas dukungannya, ' + h.guru + ' 🙏\n\n' +
    'Kelas Intensif TKA ' + h.kelas + ' (' + h.sekolah + ') kini *Premium* sampai ' + tgl + '.\n' +
    'Semua latihan per indikator kini terbuka untuk siswa di daftar kelas, dan Bapak/Ibu dapat melihat kunci & pembahasan setiap soal di dasbor (siap ditampilkan atau dicetak untuk membahas di kelas).\n\n' +
    'Buka dasbor: https://bolonulis.github.io/tka/guru.html', ui.ButtonSet.OK);
}

/* ============================ UJIAN SERENTAK (KELAS PREMIUM) ============================ */
/* Guru menjadwalkan tryout: semua siswa mulai dan selesai pada jam yang sama, hanya satu kali kesempatan.
 * Lembar "Ujian" menyimpan jadwal; lembar "Peserta Ujian" mencatat siapa yang sedang/sudah mengerjakan. */

function barisUjian_(b) {
  var mulai = waktu_(b[3]), selesai = waktu_(b[4]);
  return { id: String(b[0]), kode: rapikanKode_(b[1]), paket: String(b[2]), mulai: mulai, selesai: selesai, durasi: Number(b[5]) || 0, status: String(b[7] || 'AKTIF') };
}

function daftarUjian_(kode) {
  var hasil = [];
  lembar_(LEMBAR_UJIAN, KEPALA_UJIAN).getDataRange().getValues().slice(1).forEach(function (b) {
    if (rapikanKode_(b[1]) === kode) hasil.push(barisUjian_(b));
  });
  return hasil.sort(function (a, b) { return b.mulai - a.mulai; }).slice(0, 30);
}

function dataUjian_(id) {
  id = String(id || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (id.length < 6) return null;
  var c = CacheService.getScriptCache(), simpan = c.get('uj_' + id);
  if (simpan) return JSON.parse(simpan);
  var hasil = null;
  lembar_(LEMBAR_UJIAN, KEPALA_UJIAN).getDataRange().getValues().slice(1).some(function (b) {
    if (String(b[0]).toUpperCase() !== id) return false;
    hasil = barisUjian_(b); return true;
  });
  if (hasil) c.put('uj_' + id, JSON.stringify(hasil), 600);
  return hasil;
}

function buatUjian_(req) {
  var k = dataKelas_(req.kode);
  if (!k || String(req.pin || '').trim() !== k.pin) return { ok: false, pesan: 'Kode kelas atau PIN guru salah.' };
  if (!premiumAktif_(k)) return { ok: false, pesan: 'Ujian serentak tersedia untuk Kelas Premium.' };
  if (!KUNCI_TKA[req.paket] || /^(lt|jb)-/.test(String(req.paket))) return { ok: false, pesan: 'Pilih paket tryout.' };
  var mulai = Number(req.mulai), durasi = Math.round(Number(req.durasi));
  if (!mulai || mulai < Date.now() - 5 * 60000) return { ok: false, pesan: 'Waktu mulai sudah lewat. Pilih waktu yang akan datang.' };
  if (mulai > Date.now() + 120 * 86400000) return { ok: false, pesan: 'Jadwal paling lambat 120 hari dari sekarang.' };
  if (!(durasi >= 10 && durasi <= 180)) return { ok: false, pesan: 'Durasi 10–180 menit.' };
  var huruf = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789', id;
  var kunci = LockService.getScriptLock();
  kunci.waitLock(15000);
  try {
    var sh = lembar_(LEMBAR_UJIAN, KEPALA_UJIAN), ada = {};
    sh.getDataRange().getValues().slice(1).forEach(function (b) { ada[String(b[0])] = 1; });
    do { id = 'U'; for (var i = 0; i < 7; i++) id += huruf.charAt(Math.floor(Math.random() * huruf.length)); } while (ada[id]);
    sh.appendRow([id, k.kode, req.paket, new Date(mulai), new Date(mulai + durasi * 60000), durasi, new Date(), 'AKTIF']);
  } finally { kunci.releaseLock(); }
  return { ok: true, ujian: dataUjian_(id), daftar: daftarUjian_(k.kode) };
}

function batalUjian_(req) {
  var k = dataKelas_(req.kode);
  if (!k || String(req.pin || '').trim() !== k.pin) return { ok: false, pesan: 'Kode kelas atau PIN guru salah.' };
  var sh = lembar_(LEMBAR_UJIAN, KEPALA_UJIAN), data = sh.getDataRange().getValues();
  for (var r = 1; r < data.length; r++) {
    if (String(data[r][0]) !== String(req.id) || rapikanKode_(data[r][1]) !== k.kode) continue;
    if (Date.now() >= waktu_(data[r][3])) return { ok: false, pesan: 'Ujian sudah dimulai sehingga tidak dapat dibatalkan.' };
    sh.getRange(r + 1, 8).setValue('BATAL');
    CacheService.getScriptCache().remove('uj_' + req.id);
    return { ok: true, daftar: daftarUjian_(k.kode) };
  }
  return { ok: false, pesan: 'Ujian tidak ditemukan.' };
}

/** Siswa membuka tautan ujian: jadwal, kelas, daftar nama, dan jam server (untuk hitung mundur yang tepat). */
function cekUjian_(req) {
  var u = dataUjian_(req.id);
  if (!u) return { ok: false, pesan: 'Ujian tidak ditemukan. Periksa kembali tautan dari gurumu.' };
  if (u.status === 'BATAL') return { ok: false, pesan: 'Ujian ini dibatalkan oleh guru.' };
  var k = dataKelas_(u.kode);
  if (!k) return { ok: false, pesan: 'Kelas ujian tidak ditemukan.' };
  var hasil = { ok: true, ujian: u, kelas: { kode: k.kode, guru: k.guru, sekolah: k.sekolah, kelas: k.kelas, siswa: k.siswa || [] }, sekarang: Date.now() };
  var bx = bankEksklusif_(u.paket);
  if (bx) hasil.eksklusif = { jenjang: bx.jenjang, mapel: bx.mapel, paket: bx.paket, durasi: bx.durasi, jumlah: bx.soal.length };
  return hasil;
}

function cariPeserta_(id, nama) {
  var sh = lembar_(LEMBAR_PESERTA, KEPALA_PESERTA), data = sh.getDataRange().getValues(), n = String(nama || '').replace(/\s+/g, ' ').trim().toLowerCase();
  for (var r = 1; r < data.length; r++) if (String(data[r][0]) === id && String(data[r][1]).replace(/\s+/g, ' ').trim().toLowerCase() === n) return { sh: sh, baris: r + 1, data: data[r] };
  return { sh: sh, baris: 0 };
}

function namaTerdaftar_(k, nama) {
  if (!k.siswa || !k.siswa.length) return true;
  var n = String(nama || '').replace(/\s+/g, ' ').trim().toLowerCase();
  return k.siswa.some(function (x) { return x.toLowerCase() === n; });
}

/** Siswa menekan "Mulai": dicatat sebagai sedang mengerjakan. Menolak bila sudah pernah mengumpulkan. */
function mulaiUjian_(req) {
  var u = dataUjian_(req.id);
  if (!u || u.status === 'BATAL') return { ok: false, pesan: 'Ujian tidak tersedia.' };
  var now = Date.now();
  if (now < u.mulai - 60000) return { ok: false, pesan: 'Ujian belum dimulai.', belum: true, sekarang: now };
  if (now > u.selesai) return { ok: false, pesan: 'Waktu ujian sudah berakhir.' };
  var k = dataKelas_(u.kode);
  if (!k || !namaTerdaftar_(k, req.nama)) return { ok: false, pesan: 'Namamu tidak ada di daftar kelas ujian ini.' };
  var kunci = LockService.getScriptLock();
  kunci.waitLock(20000);
  try {
    var p = cariPeserta_(u.id, req.nama);
    if (p.baris && p.data[3]) return { ok: false, sudah: true, pesan: 'Kamu sudah mengumpulkan ujian ini. Ujian serentak hanya satu kali kesempatan.' };
    if (!p.baris) p.sh.appendRow([u.id, String(req.nama).slice(0, 60), new Date(), '', '']);
  } finally { kunci.releaseLock(); }
  var bx = bankEksklusif_(u.paket);
  return bx ? { ok: true, sekarang: now, bank: bx } : { ok: true, sekarang: now };
}

/** Paket eksklusif (soal hanya di server). */
function bankEksklusif_(paket) {
  if (typeof BANK_EKSKLUSIF !== 'undefined' && BANK_EKSKLUSIF[paket]) return BANK_EKSKLUSIF[paket];
  if (typeof BANK_KELAS !== 'undefined' && BANK_KELAS[paket]) return BANK_KELAS[paket];
  return null;
}

/** Soal paket eksklusif untuk dasbor guru Kelas Premium (analisis dan dokumen kunci). */
function bankGuru_(req) {
  var k = dataKelas_(req.kode);
  if (!k || String(req.pin || '').trim() !== k.pin) return { ok: false, pesan: 'Kode kelas atau PIN guru salah.' };
  if (!infoItem_(req.paket) && !premiumAktif_(k)) return { ok: false, pesan: 'Fitur ini tersedia untuk Kelas Premium.' };
  var bx = bankEksklusif_(req.paket);
  return bx ? { ok: true, bank: bx } : { ok: false, pesan: 'Paket tidak ditemukan.' };
}

/** Pemeriksaan saat siswa mengumpulkan jawaban ujian serentak. */
function periksaKirimUjian_(req) {
  var u = dataUjian_(req.ujian), p = req.peserta || {};
  if (!u || u.status === 'BATAL') return { ok: false, pesan: 'Ujian tidak tersedia.' };
  if (u.paket !== req.paket || rapikanKode_(p.kodeKelas) !== u.kode) return { ok: false, pesan: 'Data ujian tidak cocok.' };
  var c = cariPeserta_(u.id, p.nama);
  if (c.baris && c.data[3]) return { ok: true, sudah: true, nilai: Number(c.data[4]) || 0, id: u.id };
  if (Date.now() > u.selesai + 15 * 60000) return { ok: false, pesan: 'Batas pengumpulan ujian sudah lewat.' };
  return { ok: true, id: u.id };
}

function catatPesertaUjian_(id, nama, nilai) {
  var kunci = LockService.getScriptLock();
  kunci.waitLock(20000);
  try {
    var p = cariPeserta_(id, nama);
    if (p.baris) p.sh.getRange(p.baris, 4, 1, 2).setValues([[new Date(), nilai]]);
    else p.sh.appendRow([id, String(nama).slice(0, 60), '', new Date(), nilai]);
  } catch (err) { /* abaikan */ } finally { kunci.releaseLock(); }
}

/** Pantauan guru: siapa yang sedang mengerjakan, sudah selesai, atau belum masuk. */
function statusUjian_(req) {
  var k = dataKelas_(req.kode);
  if (!k || String(req.pin || '').trim() !== k.pin) return { ok: false, pesan: 'Kode kelas atau PIN guru salah.' };
  var u = dataUjian_(req.id);
  if (!u || u.kode !== k.kode) return { ok: false, pesan: 'Ujian tidak ditemukan.' };
  var peserta = [];
  lembar_(LEMBAR_PESERTA, KEPALA_PESERTA).getDataRange().getValues().slice(1).forEach(function (b) {
    if (String(b[0]) === u.id) peserta.push({ nama: String(b[1]), mulai: waktu_(b[2]), selesai: waktu_(b[3]), nilai: b[3] ? Number(b[4]) : null });
  });
  return { ok: true, ujian: u, siswa: k.siswa || [], peserta: peserta, sekarang: Date.now() };
}


/* ============================ JALUR BELAJAR BERTAHAP ============================ */
/* Soal Kelas Intensif hanya ada di server dan baru terbuka setelah dirilis guru.
 *  - Latihan per indikator: jb-<mapel>-<NN>-v<1..4>. V1 boleh diulang; V2–V4 sekali kesempatan; V4 khusus Kelas Premium.
 *    Setelah selesai, siswa langsung melihat pembahasan.
 *  - Paket tes akhir edisi kelas: kls-<mapel>-<1|2>. Sekali kesempatan, siswa hanya melihat nilai.
 * Lembar "Rilis": soal yang dibuka guru per kelas. Lembar "Kemajuan": satu baris per siswa per kelas (data percobaan dalam JSON). */

/** Jenis dan aturan sebuah soal Jalur Belajar dari ID-nya; null bila bukan soal Jalur Belajar. */
function infoItem_(id) {
  id = String(id || '');
  var m = /^jb-(mat|bi)-(\d\d)-v([1-4])$/.exec(id);
  if (m) {
    var v = Number(m[3]);
    return { id: id, jenis: 'jb', mapel: m[1], no: Number(m[2]), versi: v, sekali: v > 1, premium: v === 4, durasi: v === 4 ? 30 : v === 3 ? 20 : 15 };
  }
  m = /^kls-(mat|bi)-([12])$/.exec(id);
  if (m) return { id: id, jenis: 'kls', mapel: m[1], paket: Number(m[2]), sekali: true, premium: false, durasi: 75 };
  return null;
}
function itemAda_(id) { return !!(infoItem_(id) && KUNCI_TKA[id] && bankEksklusif_(id)); }
function rapiNama_(n) { return String(n || '').replace(/\s+/g, ' ').trim().toLowerCase(); }

/** Daftar soal yang dibuka guru untuk kelas ini. */
function dataRilis_(kode) {
  var c = CacheService.getScriptCache(), s = c.get('rilis_' + kode);
  if (s !== null) return s ? s.split(',') : [];
  var dibuka = [];
  lembar_(LEMBAR_RILIS, KEPALA_RILIS).getDataRange().getValues().slice(1).some(function (b) {
    if (rapikanKode_(b[0]) !== kode) return false;
    dibuka = String(b[1] || '').split(',').map(function (x) { return x.trim(); }).filter(function (x) { return !!infoItem_(x); });
    return true;
  });
  c.put('rilis_' + kode, dibuka.join(','), 300);
  return dibuka;
}

/** Guru menyimpan centang rilis (butuh PIN). V4 hanya untuk Kelas Premium. */
function simpanRilis_(req) {
  var k = dataKelas_(req.kode);
  if (!k || String(req.pin || '').trim() !== k.pin) return { ok: false, pesan: 'Kode kelas atau PIN guru salah.' };
  var premium = premiumAktif_(k), lihat = {}, dibuka = [];
  (Array.isArray(req.dibuka) ? req.dibuka : []).forEach(function (id) {
    id = String(id); var it = infoItem_(id);
    if (!it || lihat[id] || !itemAda_(id)) return;
    if (it.premium && !premium) return;
    lihat[id] = 1; dibuka.push(id);
  });
  var kunci = LockService.getScriptLock();
  kunci.waitLock(15000);
  try {
    var sh = lembar_(LEMBAR_RILIS, KEPALA_RILIS), data = sh.getDataRange().getValues(), baris = 0;
    for (var r = 1; r < data.length; r++) if (rapikanKode_(data[r][0]) === k.kode) { baris = r + 1; break; }
    if (baris) sh.getRange(baris, 2, 1, 2).setValues([[dibuka.join(','), new Date()]]);
    else sh.appendRow([k.kode, dibuka.join(','), new Date()]);
    CacheService.getScriptCache().put('rilis_' + k.kode, dibuka.join(','), 300);
  } finally { kunci.releaseLock(); }
  return { ok: true, rilis: dibuka };
}

/** Baris kemajuan seorang siswa: { sh, baris, data }. */
function cariKemajuan_(kode, nama) {
  var sh = lembar_(LEMBAR_KEMAJUAN, KEPALA_KEMAJUAN), kunci = kode + '|' + rapiNama_(nama);
  var akhir = sh.getLastRow();
  if (akhir >= 2) {
    var kol = sh.getRange(2, 1, akhir - 1, 1).getValues();
    for (var i = 0; i < kol.length; i++) {
      if (String(kol[i][0]) !== kunci) continue;
      var d = {};
      try { d = JSON.parse(String(sh.getRange(i + 2, 4).getValue() || '{}')) || {}; } catch (err) { d = {}; }
      return { sh: sh, baris: i + 2, data: d, kunci: kunci };
    }
  }
  return { sh: sh, baris: 0, data: {}, kunci: kunci };
}
function simpanKemajuan_(p, kode, nama) {
  var isi = JSON.stringify(p.data);
  if (p.baris) p.sh.getRange(p.baris, 4, 1, 2).setValues([[isi, new Date()]]);
  else { p.sh.appendRow([p.kunci, kode, String(nama).replace(/\s+/g, ' ').trim().slice(0, 60), isi, new Date()]); p.baris = p.sh.getLastRow(); }
}
/** Semua kemajuan siswa di satu kelas (untuk dasbor guru). */
function kemajuanKelas_(kode) {
  var hasil = [];
  lembar_(LEMBAR_KEMAJUAN, KEPALA_KEMAJUAN).getDataRange().getValues().slice(1).forEach(function (b) {
    if (rapikanKode_(b[1]) !== kode) return;
    var d = {}; try { d = JSON.parse(String(b[3] || '{}')) || {}; } catch (err) { d = {}; }
    hasil.push({ nama: String(b[2]), data: d });
  });
  return hasil;
}

/** Status satu soal bagi siswa: bisa dikerjakan atau tidak, dan alasannya. */
function statusItem_(it, d, now) {
  if (!d) return { boleh: true, baru: true };
  if (!it.sekali) return { boleh: true, lanjut: d.s === 'mulai' && now < d.m + it.durasi * 60000 };
  if (d.s === 'izin') return { boleh: true, baru: true };
  if (d.s === 'mulai' && now < d.m + it.durasi * 60000) return { boleh: true, lanjut: true };
  if (d.s === 'mulai') return { boleh: false, habis: true, pesan: 'Waktu mengerjakan sudah habis dan jawaban tidak terkumpul. Minta gurumu menekan "Izinkan ulang" agar kamu bisa mengerjakan lagi.' };
  return { boleh: false, selesai: true, pesan: 'Kamu sudah mengerjakan soal ini. Kesempatannya hanya sekali, jadi nilaimu sudah tersimpan di dasbor guru.' };
}

/** Peta Belajar siswa: soal yang dibuka guru dan kemajuan siswa itu sendiri (tanpa PIN, hanya data milik siswa). */
function petaSiswa_(req) {
  var k = dataKelas_(req.kode);
  if (!k) return { ok: false, pesan: 'Kode kelas tidak ditemukan. Periksa kembali tautan dari gurumu.' };
  var info = { kode: k.kode, guru: k.guru, sekolah: k.sekolah, kelas: k.kelas, siswa: k.siswa || [], premium: premiumAktif_(k) };
  if (!req.nama) return { ok: true, kelas: info, rilis: dataRilis_(k.kode), sekarang: Date.now() };
  if (!namaTerdaftar_(k, req.nama)) return { ok: false, pesan: 'Namamu tidak ada di daftar kelas. Pilih namamu dari daftar.' };
  var p = cariKemajuan_(k.kode, req.nama), now = Date.now(), milik = {};
  Object.keys(p.data).forEach(function (id) {
    var it = infoItem_(id), d = p.data[id]; if (!it) return;
    var st = statusItem_(it, d, now);
    milik[id] = { s: d.s, j: d.j || 0, p: d.p, t: d.t, b: d.b, iz: d.iz || 0, boleh: st.boleh, lanjut: !!st.lanjut, habis: !!st.habis };
  });
  return { ok: true, kelas: info, rilis: dataRilis_(k.kode), milik: milik, sekarang: now };
}

/** Siswa menekan "Mulai" pada soal Jalur Belajar: diperiksa, dicatat, lalu soal dikirim. */
function mulaiItem_(req) {
  var it = infoItem_(req.item), k = dataKelas_(req.kode);
  if (!it || !itemAda_(it.id)) return { ok: false, pesan: 'Soal tidak ditemukan.' };
  if (!k) return { ok: false, pesan: 'Kode kelas tidak ditemukan.' };
  if (!req.nama || !namaTerdaftar_(k, req.nama)) return { ok: false, pesan: 'Namamu tidak ada di daftar kelas. Pilih namamu dari daftar.' };
  if (dataRilis_(k.kode).indexOf(it.id) < 0) return { ok: false, terkunci: true, pesan: 'Soal ini belum dibuka oleh gurumu. Tunggu sampai gurumu merilisnya, ya.' };
  if (it.premium && !premiumAktif_(k)) return { ok: false, terkunci: true, pesan: 'Soal ini khusus Kelas Premium.' };
  var now = Date.now(), st, d;
  var kunci = LockService.getScriptLock();
  kunci.waitLock(20000);
  try {
    var p = cariKemajuan_(k.kode, req.nama);
    d = p.data[it.id];
    st = statusItem_(it, d, now);
    if (!st.boleh) return { ok: false, sudah: !!st.selesai, habis: !!st.habis, pesan: st.pesan };
    if (!st.lanjut) {
      d = d || { j: 0, iz: 0 };
      d.s = 'mulai'; d.m = now;
      p.data[it.id] = d;
      simpanKemajuan_(p, k.kode, req.nama);
    }
  } finally { kunci.releaseLock(); }
  return { ok: true, bank: bankEksklusif_(it.id), mulai: d.m, batas: d.m + it.durasi * 60000, durasi: it.durasi, sekali: it.sekali, lanjut: !!st.lanjut, sekarang: now };
}

/** Penilaian soal Jalur Belajar. */
function nilaiItem_(req, bank, jawaban) {
  var it = infoItem_(req.paket), ps = req.peserta || {}, k = dataKelas_(ps.kodeKelas);
  if (!k || !ps.nama) return { ok: false, pesan: 'Data kelas atau nama tidak lengkap.' };
  var h = hitung_(bank, jawaban), now = Date.now(), d;
  if (req.lihatUlang) {
    var lihat = cariKemajuan_(k.kode, ps.nama).data[it.id];
    if (!lihat || !lihat.j) return { ok: false, pesan: 'Belum ada nilai untuk soal ini.' };
    return hasilItem_(it, bank, h, req, lihat);
  }
  var kunci = LockService.getScriptLock();
  kunci.waitLock(20000);
  try {
    var p = cariKemajuan_(k.kode, ps.nama);
    d = p.data[it.id];
    if (!d) return { ok: false, pesan: 'Mulai soal ini dari Peta Belajar terlebih dahulu.' };
    if (d.s !== 'mulai') {
      // sudah dikumpulkan (mis. kiriman ulang karena koneksi putus): kembalikan nilai yang tersimpan
      if (d.j) return hasilItem_(it, bank, { nilai: d.t, terjawab: h.terjawab, jumlah: h.jumlah, skor: h.skor }, req, d, true);
      return { ok: false, pesan: 'Mulai soal ini dari Peta Belajar terlebih dahulu.' };
    }
    if (it.sekali && now > d.m + (it.durasi + PENGATURAN.JEDA_KUMPUL_MENIT) * 60000) return { ok: false, pesan: 'Batas waktu pengumpulan sudah lewat. Minta gurumu menekan "Izinkan ulang".' };
    d.j = (d.j || 0) + 1;
    if (d.p === undefined || d.p === null) d.p = h.nilai;
    d.t = h.nilai;
    d.b = Math.max(Number(d.b) || 0, h.nilai);
    d.s = 'selesai'; d.w = now;
    p.data[it.id] = d;
    simpanKemajuan_(p, k.kode, ps.nama);
  } finally { kunci.releaseLock(); }
  catatNilai_(req, h, '');
  return hasilItem_(it, bank, h, req, d);
}

function hasilItem_(it, bank, h, req, d, sudah) {
  var hasil = { ok: true, nilai: h.nilai, terjawab: h.terjawab, jumlah: h.jumlah, premium: false, item: it.id, sekali: it.sekali, jumlahCoba: d.j || 0, pertama: d.p, terbaik: d.b };
  if (sudah) hasil.sudah = true;
  if (it.jenis === 'jb') {
    hasil.rinci = {};
    Object.keys(bank).forEach(function (no) { hasil.rinci[no] = { skor: h.skor[no], kunci: bank[no].k, bahas: bank[no].b }; });
  } else {
    hasil.saranJalur = saranJalur_(it, bank, h.skor, rapikanKode_((req.peserta || {}).kodeKelas));
  }
  return hasil;
}

/** Setelah paket tes akhir: latihan yang sudah dibuka guru untuk indikator yang belum dikuasai (maksimal 5). */
function saranJalur_(it, bank, skor, kode) {
  var dibuka = dataRilis_(kode), hasil = [];
  Object.keys(skor).filter(function (no) { return skor[no] < 1 && bank[no] && bank[no].i; })
    .sort(function (a, b) { return skor[a] - skor[b] || a - b; })
    .forEach(function (no) {
      var dasar = 'jb-' + it.mapel + '-' + ('0' + bank[no].i).slice(-2) + '-v';
      for (var v = 1; v <= 3; v++) if (dibuka.indexOf(dasar + v) >= 0 && hasil.indexOf(dasar + v) < 0 && hasil.length < 5) { hasil.push(dasar + v); break; }
    });
  return hasil;
}

/** Guru memberi satu kesempatan lagi kepada siswa (mis. HP mati saat mengerjakan). */
function izinUlang_(req) {
  var k = dataKelas_(req.kode);
  if (!k || String(req.pin || '').trim() !== k.pin) return { ok: false, pesan: 'Kode kelas atau PIN guru salah.' };
  var it = infoItem_(req.item);
  if (!it || !req.nama) return { ok: false, pesan: 'Pilih siswa dan soal.' };
  var kunci = LockService.getScriptLock();
  kunci.waitLock(15000);
  try {
    var p = cariKemajuan_(k.kode, req.nama), d = p.data[it.id];
    if (!d) return { ok: false, pesan: 'Siswa ini belum pernah membuka soal tersebut, jadi tidak perlu diizinkan ulang.' };
    d.s = 'izin'; d.iz = (d.iz || 0) + 1;
    p.data[it.id] = d;
    simpanKemajuan_(p, k.kode, req.nama);
  } finally { kunci.releaseLock(); }
  return { ok: true, kemajuan: kemajuanKelas_(k.kode) };
}

/* ============================ STATISTIK PUBLIK ============================ */

/** Angka gabungan untuk ditampilkan di situs (tanpa nama atau data pribadi apa pun).
 *  Baris uji (nama berawalan "UJI SISTEM") tidak dihitung. Hasil disimpan sementara 10 menit. */
function statistik_() {
  var cache = CacheService.getScriptCache(), simpanan = cache.get('statistik');
  if (simpanan) return JSON.parse(simpanan);
  var data = lembar_(LEMBAR_NILAI, KEPALA_NILAI).getDataRange().getValues().slice(1);
  var rapi = function (v) { return String(v || '').trim().toLowerCase().replace(/\s+/g, ' '); };
  var siswa = {}, sekolah = {}, kec = {}, kab = {}, prov = {}, pengerjaan = 0;
  data.forEach(function (b) {
    var nama = rapi(b[1]);
    if (!nama || nama.indexOf('uji sistem') === 0) return;
    pengerjaan++;
    siswa[nama + '|' + rapi(b[8])] = 1;
    var pv = rapi(b[9]), kb = rapi(b[10]), kc = rapi(b[11]), sk = rapi(b[2]);
    if (sk) sekolah[sk + '|' + kb] = 1;
    if (pv) prov[pv] = 1;
    if (kb) kab[pv + '|' + kb] = 1;
    if (kc) kec[kb + '|' + kc] = 1;
  });
  var n = function (o) { return Object.keys(o).length; };
  var hasil = { ok: true, pengerjaan: pengerjaan, siswa: n(siswa), sekolah: n(sekolah), kecamatan: n(kec), kabupaten: n(kab), provinsi: n(prov) };
  // Pemakai Kelas Intensif TKA (tanpa nama; baris uji tidak dihitung)
  var kelasSah = {}, guru = {}, sekolahKelas = {}, terdaftar = 0;
  lembar_(LEMBAR_KELAS, KEPALA_KELAS).getDataRange().getValues().slice(1).forEach(function (b) {
    var kode = rapikanKode_(b[0]), g = rapi(b[2]), sk = rapi(b[3]);
    if (!kode || g.indexOf('uji sistem') === 0 || sk.indexOf('uji sistem') === 0) return;
    kelasSah[kode] = 1; guru[g + '|' + sk] = 1; if (sk) sekolahKelas[sk] = 1;
    terdaftar += rapikanSiswa_(b[7]).length;
  });
  var aktif = {}, pengerjaanKelas = 0;
  data.forEach(function (b) {
    var kode = rapikanKode_(b[12]), nama = rapi(b[1]);
    if (!kode || !kelasSah[kode] || !nama || nama.indexOf('uji sistem') === 0) return;
    pengerjaanKelas++; aktif[kode + '|' + nama] = 1;
  });
  hasil.kelas = { kelas: n(kelasSah), guru: n(guru), sekolah: n(sekolahKelas), terdaftar: terdaftar, aktif: n(aktif), pengerjaan: pengerjaanKelas };
  cache.put('statistik', JSON.stringify(hasil), 600);
  return hasil;
}

/* ============================ MENU ADMIN DI SPREADSHEET ============================ */

function onOpen() {
  SpreadsheetApp.getUi().createMenu('Simulasi TKA')
    .addItem('Buat kode akses baru…', 'menuBuatKode')
    .addItem('Aktifkan Kelas Premium…', 'menuAktifkanPremium')
    .addItem('Siapkan lembar Akses & Nilai', 'menuSiapkan')
    .addToUi();
}

function menuSiapkan() {
  lembar_(LEMBAR_AKSES, KEPALA_AKSES);
  lembar_(LEMBAR_NILAI, KEPALA_NILAI);
  SpreadsheetApp.getUi().alert('Lembar "Akses" dan "Nilai" sudah siap.');
}

/** Admin: setelah siswa/orang tua mengirim dukungan, buat kode akses lewat menu ini. */
function menuBuatKode() {
  var ui = SpreadsheetApp.getUi();
  var r1 = ui.prompt('Kode akses baru', 'Nama siswa (dan sekolah):', ui.ButtonSet.OK_CANCEL);
  if (r1.getSelectedButton() !== ui.Button.OK || !r1.getResponseText().trim()) return;
  var r2 = ui.prompt('Kode akses baru', 'Nomor WhatsApp (contoh 08123456789):', ui.ButtonSet.OK_CANCEL);
  if (r2.getSelectedButton() !== ui.Button.OK) return;
  var kode = buatKode(r1.getResponseText().trim(), r2.getResponseText().trim());
  ui.alert('Kode akses: ' + kode,
    'Kirimkan pesan ini kepada siswa:\n\n' + pesanKode_(r1.getResponseText().trim(), kode), ui.ButtonSet.OK);
}

/** Membuat dan menyimpan kode akses unik, mis. TKA-7KQ4-M2XP. */
function buatKode(nama, wa) {
  var huruf = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';   // tanpa 0/O/1/I/L agar tidak tertukar
  var sh = lembar_(LEMBAR_AKSES, KEPALA_AKSES);
  var ada = {};
  sh.getDataRange().getValues().slice(1).forEach(function (b) { ada[rapikanKode_(b[0])] = true; });
  var kode;
  do {
    var s = '';
    for (var i = 0; i < 8; i++) s += huruf.charAt(Math.floor(Math.random() * huruf.length));
    kode = 'TKA-' + s.slice(0, 4) + '-' + s.slice(4);
  } while (ada[rapikanKode_(kode)]);
  sh.appendRow([kode, nama || '', "'" + String(wa || ''), new Date(), 'YA', '', 0, '', '']);
  lupakanAkses_(rapikanKode_(kode));
  return kode;
}

function pesanKode_(nama, kode) {
  return 'Terima kasih atas dukungannya, ' + nama + ' 🙏\n\n' +
    'Kode akses Pembahasan Simulasi TKA: ' + kode + '\n\n' +
    'Cara memakai:\n1. Buka https://bolonulis.github.io/tka/\n2. Masukkan kode di kotak "Kode akses Pembahasan"\n' +
    '3. Kerjakan soal; setelah selesai, kunci jawaban, pembahasan, dan analisis per elemen langsung tampil dan bisa diunduh.\n\n' +
    'Kode berlaku tanpa batas waktu untuk semua paket, dan dapat dipakai di ' + PENGATURAN.MAKS_PERANGKAT + ' perangkat.';
}
