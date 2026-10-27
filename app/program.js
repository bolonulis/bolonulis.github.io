/* Program Kokurikuler — penyusun bertahap berbantuan Gemini.
   Gemini dipanggil langsung dari browser dengan kunci API milik guru (disimpan hanya di perangkat ini).
   Server aplikasi hanya mencatat kuota per sekolah, menyimpan draf, dan membuat Google Docs.
   Yang pasti (JP, teks Kepka 058, isian e-Rapor, timeline) dihitung di sini, bukan oleh AI. */
(() => {
const KUNCI_GEMINI = 'gemini-kunci';
const MODEL_GEMINI = ['gemini-3.5-flash', 'gemini-3.5-flash-lite'];
const URL_GEMINI = 'https://generativelanguage.googleapis.com/v1beta/models/';
const LANGKAH = ['Persiapan', 'Tahap 1 · Rancangan', 'Tahap 2 · Alur & Pertemuan', 'Tahap 3 · Observasi & Asesmen', 'Dokumen'];
const BENTUK = ['Kolaboratif lintas disiplin ilmu', 'Gerakan 7 Kebiasaan Anak Indonesia Hebat', 'Cara lainnya'];
const TAHAP_BELAJAR = ['Memahami', 'Mengaplikasi', 'Merefleksi'];
const ROMAWI = ['', 'I', 'II', 'III', 'IV', 'V', 'VI'];

let PG = null;          // info dari server: kuota, referensi, daftar program
let PR = null;          // program yang dibuka: { id, ta, data }
let LIHAT = 0;          // langkah yang sedang ditampilkan
let PG_UBAH = false;

/* ---------- util ---------- */
const fase = k => (k <= 2 ? 'A' : k <= 4 ? 'B' : 'C');
const dimensiDari = sub => ((PG.referensi.find(d => d.sub.includes(sub)) || {}).dimensi || '');
const tunggu = ms => new Promise(r => setTimeout(r, ms));
const teks = v => String(v == null ? '' : v).trim();
const satuKalimat = v => teks(v).replace(/\s+/g, ' ');
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
/** Pertemuan sebuah kegiatan: jumlah dan JP tiap pertemuan dihitung dari JP kegiatan, bukan oleh AI. */
function slotPertemuan(jp, jpp){
  const n = Math.max(1, Math.ceil(jp / jpp)), hasil = [];
  for (let i = 0; i < n; i++) hasil.push({ no: i + 1, jp: i < n - 1 ? jpp : jp - jpp * (n - 1) });
  return hasil;
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
  'kegiatan beralur dengan pengalaman belajar memahami, mengaplikasi, dan merefleksi; berpusat pada murid, kontekstual, aman, dan menggembirakan. ' +
  'Pakai bahasa Indonesia baku yang sederhana dan jelas untuk guru SD. Jangan menyebut nama murid. Jawab HANYA dengan JSON sesuai format yang diminta.';

function ringkasPersiapan(p){
  return 'Kelas ' + p.kelas + ' (Fase ' + fase(p.kelas) + '), semester ' + p.semester + '. Alokasi semester ini: ' + p.jp + ' JP (1 JP = 35 menit), ' +
    p.jumlahKegiatan + ' kegiatan, pola ' + p.pola + ', ' + p.jpPertemuan + ' JP per pertemuan, ' + p.pertemuanPerMinggu + ' pertemuan per minggu.\n' +
    'Subdimensi fokus dan target tahap Cakap (Kepka BSKAP 058/H/KR/2025):\n' +
    p.subdimensi.map(s => '- ' + s + ' (dimensi ' + dimensiDari(s) + '): ' + PG.resmi[s].Cakap).join('\n') +
    (p.sumberData ? '\nTemuan Rapor Pendidikan/data sekolah: ' + p.sumberData : '') +
    (p.konteks ? '\nKonteks sekolah: ' + p.konteks : '');
}

/* ---------- penyusunan per tahap ---------- */
async function susunTahap1(){
  const p = PR.data.persiapan;
  const contohTema = (PG.temaKok || []).map(t => t.tema).join('; ');
  const perintah = ringkasPersiapan(p) + '\n\nSusun ' + p.jumlahKegiatan + ' kegiatan kokurikuler untuk semester ini. Jumlah JP seluruh kegiatan HARUS tepat ' + p.jp +
    ' JP. Setiap subdimensi fokus harus dikuatkan oleh minimal satu kegiatan, dan subdimensi tiap kegiatan hanya boleh dipilih dari daftar fokus. ' +
    'Inspirasi tema (boleh tema lain yang kontekstual): ' + contohTema + '.\n' +
    'Format JSON: {"kegiatan":[{"tema":"…","nama":"nama kegiatan yang menarik, maks 8 kata","bentuk":"' + BENTUK.join('" | "') + '",' +
    '"kebiasaan_7kaih":"diisi bila bentuknya Gerakan 7 KAIH","ringkasan":"2–3 kalimat gambaran kegiatan","mapel":["mapel yang terlibat"],' +
    '"mitra":["mitra/narasumber yang realistis"],"produk":"hasil akhir atau aksi nyata murid","jp":angka,"subdimensi":["…"],' +
    '"tujuan_akhir":"satu kalimat diawali Melalui kegiatan … murid mampu …, maks 300 karakter"}]}';
  const j = await gemini(SISTEM, perintah, 12000);
  let keg = (Array.isArray(j.kegiatan) ? j.kegiatan : []).slice(0, p.jumlahKegiatan);
  if (!keg.length) throw new Error('Gemini tidak menyusun kegiatan. Coba lagi.');
  while (keg.length < p.jumlahKegiatan) keg.push({ ...keg[0], nama: keg[0].nama + ' (lanjutan)' });
  keg = keg.map(k => {
    const sub = (Array.isArray(k.subdimensi) ? k.subdimensi : []).map(s => p.subdimensi.find(x => x.toLowerCase() === teks(s).toLowerCase())).filter(Boolean);
    return {
      tema: satuKalimat(k.tema).slice(0, 100), nama: satuKalimat(k.nama).slice(0, 150),
      bentuk: BENTUK.find(b => b.toLowerCase() === teks(k.bentuk).toLowerCase()) || BENTUK[0], kebiasaan: satuKalimat(k.kebiasaan_7kaih),
      ringkasan: teks(k.ringkasan), mapel: (k.mapel || []).map(teks).filter(Boolean).join(', '), mitra: (k.mitra || []).map(teks).filter(Boolean).join(', '),
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
  delete PR.data.tahap2; delete PR.data.tahap3;
  PR.data.tahap = 1;
}

async function susunTahap2(){
  const p = PR.data.persiapan, hasil = [];
  for (const [i, k] of PR.data.tahap1.kegiatan.entries()) {
    const slot = slotPertemuan(k.jp, p.jpPertemuan);
    tampilSibuk('Menyusun alur kegiatan ' + (i + 1) + ' dari ' + PR.data.tahap1.kegiatan.length + ' (' + slot.length + ' pertemuan)…');
    const perintah = ringkasPersiapan(p) + '\n\nKegiatan: "' + k.nama + '" (tema ' + k.tema + ', bentuk ' + k.bentuk + (k.kebiasaan ? ', kebiasaan ' + k.kebiasaan : '') + ').\n' +
      'Ringkasan: ' + k.ringkasan + '\nMapel: ' + k.mapel + '. Mitra: ' + k.mitra + '. Produk/aksi nyata: ' + k.produk + '.\nSubdimensi: ' + k.subdimensi.join(', ') + '.\nTujuan akhir: ' + k.tujuan + '\n\n' +
      'Rancang TEPAT ' + slot.length + ' pertemuan dengan JP berikut (jangan diubah): ' + slot.map(s => 'P' + s.no + '=' + s.jp + ' JP').join(', ') + '. ' +
      'Urutannya beralur: kira-kira seperempat awal Memahami, bagian tengah Mengaplikasi, dan bagian akhir Merefleksi. Pertemuan terakhir berisi presentasi/pameran produk, asesmen sumatif, dan refleksi. ' +
      'Setiap pertemuan berisi 3–6 langkah konkret yang bisa langsung dilakukan guru.\n' +
      'Format JSON: {"pertemuan":[{"no":1,"tahap":"Memahami | Mengaplikasi | Merefleksi","judul":"…","langkah":["…"],"tempat":"…","bahan":"alat dan bahan"}]}';
    const j = await gemini(SISTEM, perintah, 24000);
    const dari = Array.isArray(j.pertemuan) ? j.pertemuan : [];
    hasil.push({ pertemuan: slot.map((s, x) => {
      const a = dari.find(d => Number(d.no) === s.no) || dari[x] || {};
      return { no: s.no, jp: s.jp, tahap: TAHAP_BELAJAR.find(t => t.toLowerCase() === teks(a.tahap).toLowerCase()) || (x < slot.length / 4 ? 'Memahami' : x === slot.length - 1 ? 'Merefleksi' : 'Mengaplikasi'),
        judul: satuKalimat(a.judul) || 'Pertemuan ' + s.no, langkah: (Array.isArray(a.langkah) ? a.langkah : [a.langkah]).map(satuKalimat).filter(Boolean),
        tempat: satuKalimat(a.tempat), bahan: satuKalimat(a.bahan) };
    }) });
  }
  PR.data.tahap2 = { kegiatan: hasil };
  delete PR.data.tahap3;
  PR.data.tahap = 2;
}

async function susunTahap3(){
  const p = PR.data.persiapan, hasil = [];
  for (const [i, k] of PR.data.tahap1.kegiatan.entries()) {
    tampilSibuk('Menyusun lembar observasi dan asesmen sumatif kegiatan ' + (i + 1) + '…');
    const pt = PR.data.tahap2.kegiatan[i].pertemuan;
    const perintah = 'Kelas ' + p.kelas + ' (Fase ' + fase(p.kelas) + '). Kegiatan "' + k.nama + '", produk/aksi nyata: ' + k.produk + '.\nAlur singkat: ' +
      pt.map(x => 'P' + x.no + ' ' + x.tahap + ': ' + x.judul).join('; ') + '\n\nRumusan resmi tahap capaian (Kepka BSKAP 058/H/KR/2025) untuk subdimensi kegiatan ini:\n' +
      k.subdimensi.map(s => '- ' + s + '\n  Berkembang: ' + PG.resmi[s].Berkembang + '\n  Cakap: ' + PG.resmi[s].Cakap + '\n  Mahir: ' + PG.resmi[s].Mahir).join('\n') +
      '\n\nSusun (1) indikator lembar observasi: 3 perilaku yang dapat diamati guru selama kegiatan ini untuk setiap subdimensi; dan ' +
      '(2) asesmen sumatif akhir kegiatan berbasis kinerja/produk dengan rubrik per subdimensi. Deskriptor Mahir, Cakap, dan Berkembang harus sejalan dengan rumusan resmi di atas ' +
      'tetapi dikontekstualkan pada kegiatan ini. Cakap adalah standar yang diharapkan.\n' +
      'Format JSON: {"observasi":[{"subdimensi":"…","indikator":["…","…","…"]}],"sumatif":{"bentuk":"…","tugas":"petunjuk tugas untuk murid, 2–4 kalimat",' +
      '"kriteria":[{"subdimensi":"…","aspek":"…","mahir":"…","cakap":"…","berkembang":"…"}]}}';
    const j = await gemini(SISTEM, perintah, 16000);
    const obs = Array.isArray(j.observasi) ? j.observasi : [], s = j.sumatif || {}, kr = Array.isArray(s.kriteria) ? s.kriteria : [];
    const cari = (arr, sub) => arr.find(o => teks(o.subdimensi).toLowerCase() === sub.toLowerCase()) || {};
    hasil.push({
      observasi: k.subdimensi.map(sub => ({ subdimensi: sub, indikator: ((cari(obs, sub).indikator) || []).map(satuKalimat).filter(Boolean) })),
      sumatif: { bentuk: satuKalimat(s.bentuk), tugas: teks(s.tugas), kriteria: k.subdimensi.map(sub => {
        const c = cari(kr, sub);
        return { subdimensi: sub, aspek: satuKalimat(c.aspek), mahir: satuKalimat(c.mahir), cakap: satuKalimat(c.cakap), berkembang: satuKalimat(c.berkembang) };
      }) }
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
    $('#pg-kuota-teks').textContent = 'Dihitung untuk seluruh sekolah (NPSN), bukan per guru. Memperbaiki dan mengunduh ulang program tidak mengurangi kuota.';
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
  if (!/^AIza[\w-]{20,}$/.test(k)) return pesan('#pg-kunci-msg', 'Kunci API Gemini diawali "AIza". Salin ulang dari aistudio.google.com/apikey.', false);
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
    LIHAT = Math.min(4, (PR.data.tahap || 0) + 1);
    bukaKerja();
  });
});
$('#pg-baru').addEventListener('click', () => {
  if (!ls.get(KUNCI_GEMINI)) { pesan('#pg-info', 'Isi dulu Kunci API Gemini (bagian 🔐 di bawah), baru mulai program.', false); $('#pg-kunci-box').open = true; $('#pg-kunci-box').scrollIntoView({ behavior: 'smooth' }); return; } PR = { id: '', ta: PG.tahunAjaran, data: { tahap: 0 } }; LIHAT = 0; bukaKerja(); });
$('#pg-kembali').addEventListener('click', async () => {
  if (PG_UBAH && !confirm('Ada perubahan yang belum disimpan. Tinggalkan?')) return;
  PG_UBAH = false; bukaProgramKok();
});

/* ---------- kerja bertahap ---------- */
function bukaKerja(){
  $('#pg-depan').classList.add('hidden'); $('#pg-kerja').classList.remove('hidden'); $('#pg-msg').textContent = '';
  render();
}
function render(){
  const t = PR.data.tahap || 0, p = PR.data.persiapan;
  $('#pg-judul').textContent = p ? 'Kelas ' + p.kelas + ' · Semester ' + p.semester + ' · ' + PR.ta : 'Program baru';
  $('#pg-langkah').innerHTML = LANGKAH.map((l, i) => {
    const bisa = PR.id && i <= Math.min(4, t + 1);
    return '<span class="' + (i === LIHAT ? 'on' : i <= t && PR.id ? 'ok' : '') + '"' + (bisa ? ' data-langkah="' + i + '" style="cursor:pointer"' : '') + '>' + (i <= t && PR.id && i !== LIHAT ? '✓ ' : '') + l + '</span>';
  }).join('');
  [renderPersiapan, renderT1, renderT2, renderT3, renderDokumen][LIHAT]();
}
$('#pg-langkah').addEventListener('click', e => {
  const s = e.target.closest('[data-langkah]');
  if (!s) return;
  if (PG_UBAH && !confirm('Perubahan di tahap ini belum disimpan. Pindah tahap?')) return;
  PG_UBAH = false; LIHAT = Number(s.dataset.langkah); $('#pg-msg').textContent = ''; render();
});
function tampilSibuk(t){ const el = $('#pg-sibuk'); if (el) el.textContent = '⏳ ' + t; }
/** Menjalankan satu tahap Gemini: tombol dikunci, hasil langsung disimpan agar tidak hilang. */
async function jalankanAi(btn, fn, lanjut){
  if (!ls.get(KUNCI_GEMINI)) return pesan('#pg-msg', 'Isi dulu kunci API Gemini di halaman depan menu ini (bagian 🔐 Kunci API Gemini).', false);
  await sibuk(btn, async () => {
    btn.insertAdjacentHTML('afterend', '<div class="pg-sibuk" id="pg-sibuk">⏳ Gemini sedang menyusun… biasanya 20–60 detik. Jangan tutup halaman ini.</div>');
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

/* Persiapan: formulir, tanpa AI. Setelah program dimulai, persiapan hanya bisa dilihat. */
function renderPersiapan(){
  const p = PR.data.persiapan;
  if (p) {
    $('#pg-panel').innerHTML = '<h3 style="margin-top:0">Persiapan</h3><table class="pg-tabel"><tbody>' + [
      ['Kelas / semester', 'Kelas ' + p.kelas + ' (Fase ' + fase(p.kelas) + '), semester ' + p.semester],
      ['JP semester ini', p.jp + ' JP dari ' + PG.jpTahun[p.kelas] + ' JP setahun'], ['Jumlah kegiatan', p.jumlahKegiatan],
      ['Pola', p.pola + ', ' + p.jpPertemuan + ' JP per pertemuan, ' + p.pertemuanPerMinggu + ' pertemuan per minggu' + (p.mulai ? ', mulai ' + tglPanjang(p.mulai) : '')],
      ['Subdimensi fokus', p.subdimensi.map(s => s + ' (' + dimensiDari(s) + ')').join('; ')], ['Data Rapor Pendidikan', p.sumberData || '–'], ['Konteks sekolah', p.konteks || '–'], ['Guru', p.guru || '–']
    ].map(r => '<tr><th style="width:28%">' + esc(r[0]) + '</th><td>' + esc(r[1]) + '</td></tr>').join('') + '</tbody></table>' +
      '<p class="hint">Persiapan tidak bisa diubah setelah program dimulai. Bila perlu persiapan lain, buat program baru.</p>' +
      '<div class="toolbar"><button class="btn small" type="button" data-ke-langkah="1">Ke Tahap 1 →</button></div>';
    return;
  }
  const kelas = Number(ls.get('pg-kelas')) || 1;
  $('#pg-panel').innerHTML = '<h3 style="margin-top:0">Persiapan program</h3><p class="hint">Isi sesuai keputusan tim kokurikuler sekolah. Bagian ini tidak memakai Gemini.</p>' +
    '<form id="pg-form" class="pg-form">' +
    '<div class="pg-tiga"><div><label>Kelas</label><select id="pf-kelas">' + [1, 2, 3, 4, 5, 6].map(k => '<option value="' + k + '"' + (k === kelas ? ' selected' : '') + '>Kelas ' + k + '</option>').join('') + '</select><div class="hint" id="pf-jp-tahun"></div></div>' +
    '<div><label>Semester</label><select id="pf-semester"><option value="1"' + (PG.semester === 1 ? ' selected' : '') + '>Semester 1 (Ganjil)</option><option value="2"' + (PG.semester === 2 ? ' selected' : '') + '>Semester 2 (Genap)</option></select></div>' +
    '<div><label>JP kokurikuler semester ini</label><input id="pf-jp" type="number" min="1"><div class="hint">Boleh tidak sama antarsemester.</div></div></div>' +
    '<div class="pg-tiga"><div><label>Jumlah kegiatan semester ini</label><select id="pf-keg"><option value="1">1 kegiatan</option><option value="2">2 kegiatan</option></select></div>' +
    '<div><label>Pola pelaksanaan</label><select id="pf-pola"><option value="Blok">Blok (beberapa hari/minggu berturut-turut)</option><option value="Menyebar">Menyebar (rutin tiap minggu)</option><option value="Kombinasi">Kombinasi</option></select></div>' +
    '<div><label>Tanggal mulai (boleh kosong)</label><input id="pf-mulai" type="date"></div></div>' +
    '<div class="pg-dua"><div><label>JP per pertemuan</label><input id="pf-jpp" type="number" min="1" max="8" value="3"></div>' +
    '<div><label>Pertemuan per minggu</label><input id="pf-perminggu" type="number" min="1" max="6" value="5"><div class="hint">Blok: 4–6; menyebar: 1–2.</div></div></div>' +
    '<label>Subdimensi profil lulusan yang menjadi fokus (pilih 1–3, e-Rapor membatasi paling banyak 3)</label><div id="pf-sub">' +
    PG.referensi.map(d => '<div class="pg-dim"><b>' + esc(d.dimensi) + '</b><div class="pg-sub">' + d.sub.map(s => '<label title="' + esc('Cakap: ' + PG.resmi[s].Cakap) + '"><input type="checkbox" value="' + esc(s) + '">' + esc(s) + '</label>').join('') + '</div></div>').join('') +
    '</div><label>Temuan Rapor Pendidikan / data sekolah (disarankan)</label><textarea id="pf-data" maxlength="600" placeholder="Contoh: Nalar kritis 42,6 (Kurang, turun 14,3); kreativitas 46,6 (Kurang); literasi mengevaluasi teks rendah."></textarea>' +
    '<label>Konteks sekolah dan lingkungan</label><textarea id="pf-konteks" maxlength="1500" placeholder="Contoh: sekolah di dekat sawah dan pasar; banyak orang tua petani; ada sanggar tari di desa; sampah plastik jajanan menumpuk."></textarea>' +
    '<label>Nama guru penyusun (untuk dokumen)</label><input id="pf-guru" type="text" maxlength="100">' +
    '<div class="toolbar"><button class="btn small" type="submit">Mulai program</button><span class="sub" id="pf-kuota"></span></div></form>';
  const isiJp = () => { const k = Number($('#pf-kelas').value), t = PG.jpTahun[k]; $('#pf-jp-tahun').textContent = 'Alokasi setahun: ' + t + ' JP'; $('#pf-jp').max = t; $('#pf-jp').value = Math.round(t / 2); };
  isiJp();
  $('#pf-kelas').addEventListener('change', () => { ls.set('pg-kelas', $('#pf-kelas').value); isiJp(); });
  $('#pf-pola').addEventListener('change', () => { $('#pf-perminggu').value = $('#pf-pola').value === 'Menyebar' ? 1 : $('#pf-pola').value === 'Kombinasi' ? 2 : 5; });
  $('#pf-sub').addEventListener('change', () => {
    const n = $('#pf-sub').querySelectorAll('input:checked').length;
    $('#pf-sub').querySelectorAll('input').forEach(x => { x.disabled = !x.checked && n >= 3; });
  });
  $('#pf-kuota').textContent = PG.kuota.lisensiSampai ? 'Lisensi Sekolah aktif.' : 'Memakai 1 dari ' + PG.kuota.sisaGratis + ' kuota gratis yang tersisa.';
  $('#pg-form').addEventListener('submit', e => { e.preventDefault(); kirim(e.target, async () => {
    const persiapan = { kelas: Number($('#pf-kelas').value), semester: Number($('#pf-semester').value), jp: Number($('#pf-jp').value),
      jumlahKegiatan: Number($('#pf-keg').value), pola: $('#pf-pola').value, mulai: $('#pf-mulai').value, jpPertemuan: Number($('#pf-jpp').value),
      pertemuanPerMinggu: Number($('#pf-perminggu').value), subdimensi: [...$('#pf-sub').querySelectorAll('input:checked')].map(x => x.value),
      sumberData: $('#pf-data').value, konteks: $('#pf-konteks').value, guru: $('#pf-guru').value };
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
    $('#pg-panel').innerHTML = '<h3 style="margin-top:0">Tahap 1 · Rancangan kegiatan</h3><p>Gemini menyusun tema, nama kegiatan, bentuk, mapel dan mitra, produk akhir, pembagian JP, subdimensi, dan tujuan akhir kegiatan. Semua bisa Anda koreksi sesudahnya.</p>' + tombol;
  } else {
    const p = PR.data.persiapan;
    $('#pg-panel').innerHTML = '<h3 style="margin-top:0">Tahap 1 · Rancangan kegiatan</h3><p class="hint">Periksa dan koreksi. Tema, nama kegiatan, tujuan akhir, dan subdimensi inilah yang nanti diisikan ke e-Rapor.</p>' +
      d.kegiatan.map((k, i) => '<div class="pg-blok"><h4>Kegiatan ' + (i + 1) + '</h4>' +
        '<div class="pg-dua"><div>' + isian('Tema', 'tahap1.kegiatan.' + i + '.tema', { maks: 100 }) + '</div><div>' + isian('Nama kegiatan', 'tahap1.kegiatan.' + i + '.nama', { maks: 150 }) + '</div></div>' +
        '<div class="pg-dua"><div><label>Bentuk</label><select data-p="tahap1.kegiatan.' + i + '.bentuk">' + BENTUK.map(b => '<option' + (b === k.bentuk ? ' selected' : '') + '>' + esc(b) + '</option>').join('') + '</select></div>' +
        '<div>' + isian('Kebiasaan 7 KAIH (bila bentuknya Gerakan 7 KAIH)', 'tahap1.kegiatan.' + i + '.kebiasaan') + '</div></div>' +
        isian('Ringkasan kegiatan', 'tahap1.kegiatan.' + i + '.ringkasan', { area: true }) +
        '<div class="pg-tiga"><div>' + isian('Mapel terlibat', 'tahap1.kegiatan.' + i + '.mapel') + '</div><div>' + isian('Mitra/narasumber', 'tahap1.kegiatan.' + i + '.mitra') + '</div><div>' + isian('JP kegiatan', 'tahap1.kegiatan.' + i + '.jp', { j: 'angka' }) + '</div></div>' +
        isian('Produk / aksi nyata', 'tahap1.kegiatan.' + i + '.produk') +
        '<label>Subdimensi kegiatan ini</label><div class="pg-sub">' + p.subdimensi.map(s => '<label><input type="checkbox" data-daftar="tahap1.kegiatan.' + i + '.subdimensi" data-nilai="' + esc(s) + '"' + (k.subdimensi.includes(s) ? ' checked' : '') + '>' + esc(s) + '</label>').join('') + '</div>' +
        isian('Tujuan akhir kegiatan (untuk e-Rapor)', 'tahap1.kegiatan.' + i + '.tujuan', { area: true, baris: 2 }) +
        '<button class="btn ghost small" type="button" data-pola="' + i + '">Susun ulang tujuan dengan pola baku</button></div>').join('') +
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
      if (PR.data.tahap2 && PR.data.tahap2.kegiatan.some((x, i) => x.pertemuan.reduce((a, q) => a + q.jp, 0) !== PR.data.tahap1.kegiatan[i].jp)) {
        delete PR.data.tahap2; delete PR.data.tahap3; PR.data.tahap = 1;      // JP berubah: alur perlu disusun ulang
      } else PR.data.tahap = Math.max(PR.data.tahap, 1);
      if (await simpanProgram(true)) { LIHAT = 2; render(); }
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

/** Timeline dihitung dari urutan pertemuan dan jumlah pertemuan per minggu. */
function timeline(){
  const p = PR.data.persiapan, baris = [];
  let i = 0;
  (PR.data.tahap2 ? PR.data.tahap2.kegiatan : []).forEach((kg, k) => kg.pertemuan.forEach(pt => {
    const minggu = Math.floor(i / p.pertemuanPerMinggu) + 1;
    baris.push({ k, pt, minggu, tanggal: tanggalMinggu(p.mulai, minggu) }); i++;
  }));
  return baris;
}

function renderT2(){
  const d = PR.data.tahap2, p = PR.data.persiapan;
  const tombol = '<button class="btn small" type="button" id="pg-ai2">' + (d ? '✨ Susun ulang Tahap 2' : '✨ Susun alur & pertemuan (Tahap 2)') + '</button>';
  const info = PR.data.tahap1.kegiatan.map((k, i) => 'Kegiatan ' + (i + 1) + ' “' + k.nama + '”: ' + k.jp + ' JP → ' + slotPertemuan(k.jp, p.jpPertemuan).length + ' pertemuan').join(' · ');
  if (!d) {
    $('#pg-panel').innerHTML = '<h3 style="margin-top:0">Tahap 2 · Alur & pertemuan</h3><p>Gemini menyusun alur memahami, mengaplikasi, dan merefleksi beserta langkah tiap pertemuan. Jumlah pertemuan dan JP-nya dihitung aplikasi.</p><p class="hint">' + esc(info) + '</p>' + tombol;
  } else {
    const tl = timeline();
    $('#pg-panel').innerHTML = '<h3 style="margin-top:0">Tahap 2 · Alur & pertemuan</h3><p class="hint">' + esc(info) + '. Koreksi judul, tahap, dan langkah. Satu langkah per baris.</p>' +
      '<details><summary><b>Peta timeline</b> (' + tl.length + ' pertemuan, ' + (tl.length ? tl[tl.length - 1].minggu : 0) + ' minggu)</summary><table class="pg-tabel" style="margin-top:8px"><thead><tr><th>Minggu</th><th>Kegiatan</th><th>Pertemuan</th><th>Tahap</th><th>Judul</th><th>JP</th></tr></thead><tbody>' +
      tl.map(r => '<tr><td>' + r.minggu + (r.tanggal ? '<br><span class="sub">' + esc(r.tanggal) + '</span>' : '') + '</td><td>' + (r.k + 1) + '</td><td>' + r.pt.no + '</td><td>' + esc(r.pt.tahap) + '</td><td>' + esc(r.pt.judul) + '</td><td>' + r.pt.jp + '</td></tr>').join('') + '</tbody></table></details>' +
      d.kegiatan.map((kg, i) => '<div class="pg-blok"><h4>Kegiatan ' + (i + 1) + ': ' + esc(PR.data.tahap1.kegiatan[i].nama) + '</h4>' + kg.pertemuan.map((pt, x) => {
        const jl = 'tahap2.kegiatan.' + i + '.pertemuan.' + x;
        return '<div class="pg-pt"><div class="kepala">Pertemuan ' + pt.no + ' · ' + pt.jp + ' JP</div>' +
          '<div class="pg-dua"><div><label>Tahap</label><select data-p="' + jl + '.tahap">' + TAHAP_BELAJAR.map(t => '<option' + (t === pt.tahap ? ' selected' : '') + '>' + t + '</option>').join('') + '</select></div><div>' + isian('Judul', jl + '.judul') + '</div></div>' +
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
  const d = PR.data.tahap3;
  const tombol = '<button class="btn small" type="button" id="pg-ai3">' + (d ? '✨ Susun ulang Tahap 3' : '✨ Susun observasi & asesmen (Tahap 3)') + '</button>';
  if (!d) {
    $('#pg-panel').innerHTML = '<h3 style="margin-top:0">Tahap 3 · Lembar observasi & asesmen sumatif</h3><p>Gemini menyusun indikator perilaku yang diamati dan rubrik asesmen sumatif akhir kegiatan. Tahap Berkembang, Cakap, dan Mahir mengacu pada rumusan resmi Kepka 058.</p>' + tombol;
  } else {
    $('#pg-panel').innerHTML = '<h3 style="margin-top:0">Tahap 3 · Lembar observasi & asesmen sumatif</h3><p class="hint">Teks abu-abu adalah rumusan resmi Kepka 058 sebagai acuan; deskriptor rubrik boleh dikontekstualkan tetapi jangan bertentangan.</p>' +
      d.kegiatan.map((kg, i) => '<div class="pg-blok"><h4>Kegiatan ' + (i + 1) + ': ' + esc(PR.data.tahap1.kegiatan[i].nama) + '</h4><b>Indikator lembar observasi</b>' +
        kg.observasi.map((o, x) => isian(esc(o.subdimensi) + ' — perilaku yang diamati (satu per baris)', 'tahap3.kegiatan.' + i + '.observasi.' + x + '.indikator', { area: true, j: 'baris' })).join('') +
        '<b style="display:block;margin-top:12px">Asesmen sumatif akhir kegiatan</b><div class="pg-dua"><div>' + isian('Bentuk', 'tahap3.kegiatan.' + i + '.sumatif.bentuk') + '</div><div></div></div>' +
        isian('Tugas untuk murid', 'tahap3.kegiatan.' + i + '.sumatif.tugas', { area: true }) +
        kg.sumatif.kriteria.map((c, x) => { const jl = 'tahap3.kegiatan.' + i + '.sumatif.kriteria.' + x, r = PG.resmi[c.subdimensi] || {};
          return '<div class="pg-pt"><div class="kepala">Rubrik: ' + esc(c.subdimensi) + '</div>' + isian('Aspek yang dinilai', jl + '.aspek') +
            ['mahir', 'cakap', 'berkembang'].map(l => isian(l[0].toUpperCase() + l.slice(1), jl + '.' + l, { area: true, baris: 2 }) + '<div class="pg-resmi">Resmi: ' + esc(r[l[0].toUpperCase() + l.slice(1)] || '') + '</div>').join('') + '</div>';
        }).join('') + '</div>').join('') +
      '<div class="toolbar">' + tombol + '<button class="btn small" type="button" id="pg-lanjut3">Simpan &amp; lanjut ke Dokumen →</button></div>';
    $('#pg-lanjut3').addEventListener('click', e => sibuk(e.target, async () => {
      const kosong = d.kegiatan.some(kg => kg.observasi.some(o => !o.indikator.length) || kg.sumatif.kriteria.some(c => !teks(c.mahir) || !teks(c.cakap) || !teks(c.berkembang)) || !teks(kg.sumatif.tugas));
      if (kosong) return pesan('#pg-msg', 'Lengkapi indikator observasi, tugas sumatif, dan deskriptor Mahir/Cakap/Berkembang.', false);
      PR.data.tahap = Math.max(PR.data.tahap, 3);
      if (await simpanProgram(true)) { LIHAT = 4; render(); }
    }));
  }
  $('#pg-ai3').addEventListener('click', e => {
    if (d && !confirm('Susun ulang Tahap 3? Isi observasi dan asesmen yang sekarang akan diganti.')) return;
    jalankanAi(e.target, susunTahap3, 3);
  });
}

function renderDokumen(){
  const k1 = PR.data.tahap1.kegiatan, p = PR.data.persiapan;
  $('#pg-panel').innerHTML = '<h3 style="margin-top:0">Dokumen program</h3><p>Program sudah tervalidasi. Dokumen berisi: identitas, data untuk e-Rapor, rancangan kegiatan, peta timeline, rincian pertemuan, lembar observasi, asesmen sumatif, dan lembar pengesahan.</p>' +
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

/* ---------- dokumen Word (pustaka docx) ---------- */
async function dokumenProgram(){
  await muatPustaka('docx');
  const D = docx, p = PR.data.persiapan, k1 = PR.data.tahap1.kegiatan, k2 = PR.data.tahap2.kegiatan, k3 = PR.data.tahap3.kegiatan;
  const LEBAR = 9900, UNGU = '4B2A8C', HURUF = 'Arial';
  // teks berisi "\n" menjadi baris terpisah di Word
  const runs = (t, o = {}) => String(t == null ? '' : t).split('\n').map((x, i) => new D.TextRun({ text: x, break: i ? 1 : undefined, font: HURUF, size: o.size || 20, bold: o.bold, italics: o.italic, color: o.color }));
  const run = (t, o = {}) => runs(t, o)[0];
  const par = (t, o = {}) => new D.Paragraph({ children: Array.isArray(t) ? t : runs(t, o), alignment: o.center ? D.AlignmentType.CENTER : undefined,
    spacing: { before: o.before || 0, after: o.after == null ? 80 : o.after }, bullet: o.bullet ? { level: 0 } : undefined, numbering: o.nomor });
  const judul = (t, lv) => new D.Paragraph({ children: [run(t, { bold: true, size: lv === 1 ? 26 : 22, color: UNGU })], spacing: { before: lv === 1 ? 280 : 180, after: 100 }, keepNext: true });
  const sel = (isi, o = {}) => new D.TableCell({
    children: (Array.isArray(isi) ? isi : [isi]).map(x => (x instanceof D.Paragraph ? x : par(x, { bold: o.bold, color: o.color, size: o.size || 18, after: 20 }))),
    width: { size: o.w, type: D.WidthType.DXA }, shading: o.isi ? { fill: o.isi, type: D.ShadingType.CLEAR, color: 'auto' } : undefined,
    columnSpan: o.span, margins: { top: 50, bottom: 50, left: 80, right: 80 } });
  const tabel = (judulKol, baris, persen, o = {}) => {
    const w = persen.map(x => Math.round(LEBAR * x / 100));
    const kepala = judulKol ? [new D.TableRow({ tableHeader: true, children: judulKol.map((t, i) => sel(t, { w: w[i], bold: true, color: 'FFFFFF', isi: UNGU })) })] : [];
    return new D.Table({ width: { size: LEBAR, type: D.WidthType.DXA }, columnWidths: w,
      rows: kepala.concat(baris.map(b => new D.TableRow({ cantSplit: true, height: o.tinggi ? { value: o.tinggi, rule: D.HeightRule.ATLEAST } : undefined,
        children: b.map((t, i) => sel(t, { w: w[i], bold: o.lbl && i === 0, isi: o.lbl && i === 0 ? 'F1ECFB' : undefined })) }))) });
  };
  const jarak = () => par('', { after: 60 });
  const nomorSub = s => dimensiDari(s) + ' — ' + s;
  const tl = timeline();
  const isi = [];

  isi.push(par([run('PROGRAM KOKURIKULER', { bold: true, size: 32, color: UNGU })], { center: true, after: 40 }));
  isi.push(par([run(PG.sekolah.nama + ' · Tahun Ajaran ' + PR.ta, { bold: true, size: 22 })], { center: true, after: 200 }));
  isi.push(tabel(null, [
    ['Satuan pendidikan', PG.sekolah.nama + ' (NPSN ' + PG.sekolah.npsn + ')'], ['Kelas / fase / semester', ROMAWI[p.kelas] + ' / ' + fase(p.kelas) + ' / ' + (p.semester === 1 ? '1 (Ganjil)' : '2 (Genap)')],
    ['Alokasi waktu', p.jp + ' JP semester ini (alokasi kelas ' + ROMAWI[p.kelas] + ' setahun ' + PG.jpTahun[p.kelas] + ' JP; 1 JP = 35 menit)'],
    ['Pola pelaksanaan', p.pola + '; ' + p.jpPertemuan + ' JP per pertemuan; ' + p.pertemuanPerMinggu + ' pertemuan per minggu' + (p.mulai ? '; mulai ' + tglPanjang(p.mulai) : '')],
    ['Jumlah kegiatan', String(k1.length)], ['Fokus profil lulusan', p.subdimensi.map(nomorSub).join('; ')], ['Dasar analisis', p.sumberData || '—'], ['Konteks sekolah', p.konteks || '—'], ['Guru penyusun', p.guru || '—']
  ], [30, 70], { lbl: true }));

  isi.push(judul('A. Data untuk e-Rapor', 1));
  isi.push(tabel(['Tema', 'Nama kegiatan', 'Tujuan akhir kegiatan', 'Dimensi (subdimensi)'], k1.map(k => [k.tema, k.nama, k.tujuan, k.subdimensi.map(nomorSub).join('; ')]), [18, 20, 38, 24]));
  isi.push(par('Capaian setiap murid (Berkembang/Cakap/Mahir) diisi pada akhir kegiatan berdasarkan lembar observasi dan asesmen sumatif di bawah. Cakap adalah standar yang diharapkan.', { size: 17, italic: true, before: 60 }));

  isi.push(judul('B. Rancangan Kegiatan', 1));
  k1.forEach((k, i) => {
    isi.push(judul('Kegiatan ' + (i + 1) + ': ' + k.nama, 2));
    isi.push(tabel(null, [['Tema', k.tema], ['Bentuk', k.bentuk + (k.kebiasaan ? ' (' + k.kebiasaan + ')' : '')], ['Ringkasan', k.ringkasan], ['Dimensi profil lulusan', k.subdimensi.map(nomorSub).join('; ')],
      ['Target tahap Cakap (Kepka 058)', k.subdimensi.map(s => s + ': ' + PG.resmi[s].Cakap).join(' | ')], ['Tujuan akhir', k.tujuan], ['Mapel terlibat', k.mapel || '—'], ['Mitra/narasumber', k.mitra || '—'],
      ['Produk / aksi nyata', k.produk || '—'], ['Alokasi', k.jp + ' JP · ' + k2[i].pertemuan.length + ' pertemuan']], [30, 70], { lbl: true }));
  });

  isi.push(judul('C. Peta Timeline dan Pemetaan Kegiatan', 1));
  // tanggal cukup ditulis pada pertemuan pertama setiap minggu
  isi.push(tabel(['Minggu', 'Kegiatan', 'Pert.', 'Tahap', 'Judul pertemuan', 'JP'], tl.map((r, i) => [(i && tl[i - 1].minggu === r.minggu) ? '' : String(r.minggu) + (r.tanggal ? '\n' + r.tanggal : ''),
    String(r.k + 1), String(r.pt.no), r.pt.tahap, r.pt.judul, String(r.pt.jp)]), [13, 10, 8, 15, 46, 8]));
  isi.push(par('Jumlah: ' + tl.length + ' pertemuan, ' + tl.reduce((a, r) => a + r.pt.jp, 0) + ' JP.', { bold: true, size: 18, before: 60 }));

  isi.push(judul('D. Rincian Pertemuan', 1));
  k2.forEach((kg, i) => {
    isi.push(judul('Kegiatan ' + (i + 1) + ': ' + k1[i].nama, 2));
    kg.pertemuan.forEach(pt => {
      isi.push(par([run('Pertemuan ' + pt.no + ' · ' + pt.tahap + ' · ' + pt.jp + ' JP — ', { bold: true }), run(pt.judul, { bold: true, color: UNGU })], { before: 120, after: 40 }));
      if (pt.tempat || pt.bahan) isi.push(par('Tempat: ' + (pt.tempat || '—') + ' · Alat dan bahan: ' + (pt.bahan || '—'), { size: 18, italic: true, after: 40 }));
      pt.langkah.forEach((l, n) => isi.push(par((n + 1) + '. ' + l, { size: 19, after: 30 })));
    });
  });

  isi.push(judul('E. Lembar Observasi', 1));
  k3.forEach((kg, i) => {
    isi.push(judul('Kegiatan ' + (i + 1) + ': ' + k1[i].nama, 2));
    kg.observasi.forEach(o => {
      isi.push(par([run(nomorSub(o.subdimensi), { bold: true })], { before: 80, after: 30 }));
      o.indikator.forEach(t => isi.push(par('• ' + t, { size: 19, after: 20 })));
    });
    isi.push(par('Acuan tahap (Kepka 058): B = Berkembang, C = Cakap, M = Mahir. Tulis juga catatan peristiwa singkat sebagai bukti.', { size: 17, italic: true, before: 80 }));
    const sub = kg.observasi.map(o => o.subdimensi), lebarSub = Math.floor(36 / sub.length);
    isi.push(tabel(['No', 'Nama murid'].concat(sub, ['Catatan peristiwa']), Array.from({ length: 28 }, (_, n) => [String(n + 1), ''].concat(sub.map(() => 'B / C / M'), [''])),
      [6, 26].concat(sub.map(() => lebarSub), [68 - lebarSub * sub.length])));
  });

  isi.push(judul('F. Asesmen Sumatif Akhir Kegiatan', 1));
  k3.forEach((kg, i) => {
    isi.push(judul('Kegiatan ' + (i + 1) + ': ' + k1[i].nama, 2));
    isi.push(tabel(null, [['Bentuk', kg.sumatif.bentuk || '—'], ['Tugas untuk murid', kg.sumatif.tugas]], [25, 75], { lbl: true }));
    isi.push(jarak());
    isi.push(tabel(['Subdimensi / aspek', 'Mahir', 'Cakap', 'Berkembang'], kg.sumatif.kriteria.map(c => [c.subdimensi + (c.aspek ? '\n' + c.aspek : ''), c.mahir, c.cakap, c.berkembang]), [22, 26, 26, 26]));
  });

  isi.push(judul('G. Pengesahan', 1));
  const ttd = (a, b) => [par(a, { after: 600 }), par(b)];
  const tanpa = { style: D.BorderStyle.NONE, size: 0, color: 'FFFFFF' };
  isi.push(new D.Table({ width: { size: LEBAR, type: D.WidthType.DXA }, columnWidths: [3300, 3300, 3300],
    borders: { top: tanpa, bottom: tanpa, left: tanpa, right: tanpa, insideHorizontal: tanpa, insideVertical: tanpa }, rows: [new D.TableRow({ children: [
    sel(ttd('Mengetahui,\nKepala Sekolah', '……………………………\nNIP. …………………'), { w: 3300 }), sel(ttd('Mengetahui,\nKoordinator Kokurikuler', '……………………………\nNIP. …………………'), { w: 3300 }),
    sel(ttd('……………, ……………\nGuru Kelas ' + ROMAWI[p.kelas], (p.guru || '……………………………') + '\nNIP. …………………'), { w: 3300 })] })] }));

  return new D.Document({
    creator: 'Rapor Merdeka Digital', title: 'Program Kokurikuler ' + PG.sekolah.nama,
    styles: { default: { document: { run: { font: HURUF, size: 20 } } } },
    sections: [{ properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 1000, bottom: 1000, left: 1000, right: 1000 } } },
      footers: { default: new D.Footer({ children: [par([run('Program Kokurikuler · ' + PG.sekolah.nama + ' (NPSN ' + PG.sekolah.npsn + ') · disusun dengan Rapor Merdeka Digital', { size: 15, color: '64748B' })])] }) },
      children: isi }]
  });
}

$('#t-prog').addEventListener('click', () => bukaProgramKok());
window.bukaProgramKok = bukaProgramKok;
})();
