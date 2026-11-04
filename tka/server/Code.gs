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
  WA_ADMIN: '6281196939694'
};

var LEMBAR_AKSES = 'Akses';
var LEMBAR_NILAI = 'Nilai';
var KEPALA_AKSES = ['Kode', 'Nama', 'No. WA', 'Dibuat', 'Aktif', 'Perangkat', 'Dipakai', 'Terakhir dipakai', 'Catatan'];
var KEPALA_NILAI = ['Waktu', 'Nama', 'Sekolah', 'Kelas', 'Paket', 'Nilai', 'Terjawab', 'Kode akses', 'Perangkat', 'Provinsi', 'Kabupaten/Kota', 'Kecamatan', 'Kode kelas', 'Skor per soal'];
var LEMBAR_KELAS = 'Kelas';
var KEPALA_KELAS = ['Kode kelas', 'PIN guru', 'Nama guru', 'Sekolah', 'Kelas', 'No. WA', 'Dibuat', 'Daftar siswa'];

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
  var h = hitung_(bank, jawaban);
  var akses = req.kode ? periksaKode_(req.kode, req.perangkat) : null;
  if (!req.lihatUlang) catatNilai_(req, h, akses && akses.ok ? akses.kode : '');

  var hasil = { ok: true, nilai: h.nilai, terjawab: h.terjawab, jumlah: h.jumlah, premium: false };
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
    if (!e || !e.range || e.range.getSheet().getName() !== LEMBAR_AKSES) return;
    var sh = e.range.getSheet(), awal = e.range.getRow(), n = Math.min(e.range.getNumRows(), 200);
    var cache = CacheService.getScriptCache();
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
      Object.keys(h.skor).sort(function (a, b) { return a - b; }).map(function (n) { return Math.round(h.skor[n] * 100) / 100; }).join(',')]);
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

/** Data kelas berdasarkan kode (disimpan sementara 6 jam). */
function dataKelas_(kode) {
  kode = rapikanKode_(kode);
  if (kode.length < 4) return null;
  var c = CacheService.getScriptCache(), k = c.get('kelas_' + kode);
  if (k) return JSON.parse(k);
  var hasil = null;
  lembar_(LEMBAR_KELAS, KEPALA_KELAS).getDataRange().getValues().slice(1).some(function (b) {
    if (rapikanKode_(b[0]) !== kode) return false;
    hasil = { kode: kode, pin: String(b[1]).replace(/^'/, ''), guru: String(b[2]), sekolah: String(b[3]), kelas: String(b[4]), siswa: rapikanSiswa_(b[7]) };
    return true;
  });
  if (hasil) c.put('kelas_' + kode, JSON.stringify(hasil), 21600);
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
  return k ? { ok: true, kode: k.kode, guru: k.guru, sekolah: k.sekolah, kelas: k.kelas, siswa: k.siswa || [] } : { ok: false, pesan: 'Kode kelas tidak ditemukan. Periksa kembali kode dari gurumu.' };
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
      terjawab: String(b[6]), skor: String(b[13] || '').split(',').filter(String).map(Number) });
  });
  return { ok: true, kelas: { kode: k.kode, guru: k.guru, sekolah: k.sekolah, kelas: k.kelas }, siswa: k.siswa || [], baris: baris };
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
  cache.put('statistik', JSON.stringify(hasil), 600);
  return hasil;
}

/* ============================ MENU ADMIN DI SPREADSHEET ============================ */

function onOpen() {
  SpreadsheetApp.getUi().createMenu('Simulasi TKA')
    .addItem('Buat kode akses baru…', 'menuBuatKode')
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
