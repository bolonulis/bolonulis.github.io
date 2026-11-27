/* ✨ Bantu tulis — usulan keterangan ekstrakurikuler dan catatan wali kelas (halaman Wali Kelas).
   - Gemini dipanggil langsung dari browser dengan kunci milik guru yang sama dengan Program Kokurikuler (KUNCI_GEMINI).
     Server aplikasi tidak pernah menerima kunci.
   - Privasi: ke Gemini hanya dikirim nomor urut sementara, nama ekskul + predikat, sifat yang dicentang, dan angka S/I/A.
     Nama, NISN, dan ID siswa TIDAK dikirim; hasil dipasangkan kembali di layar memakai nomor urut itu.
   - Hasil hanya USULAN di kotak isian. Tersimpan lewat tombol Simpan yang sudah ada.
   - Tanpa kunci atau bila Gemini gagal: memakai bank kalimat bawaan yang tetap bervariasi dalam satu kelas.
   Dimuat sesudah program.js (memakai ls, $, esc, pesan, sibuk, WK, WK_EKS, WK_HADIR, WK_UBAH dari halaman). */
(() => {
// Sama dengan program.js (kunci yang sama dipakai Program Kokurikuler).
const KUNCI_GEMINI = 'gemini-kunci';
const MODEL_GEMINI = ['gemini-3.5-flash', 'gemini-3.5-flash-lite'];
const URL_GEMINI = 'https://generativelanguage.googleapis.com/v1beta/models/';
function bacaJson(t){
  let s = String(t || '').replace(/```json|```/g, '').trim();
  const a = s.indexOf('{'), b = s.lastIndexOf('}');
  if (a >= 0 && b > a) s = s.slice(a, b + 1);
  return JSON.parse(s);
}

const BT_SIFAT = [
  { k: 'disiplin', label: 'Disiplin', frasa: 'dengan sikap disiplin', sifat: 'disiplin' },
  { k: 'kreatif', label: 'Kreatif', frasa: 'serta menunjukkan kreativitas', sifat: 'kreatif' },
  { k: 'kerjasama', label: 'Kerja sama', frasa: 'dan mampu bekerja sama dengan baik', sifat: 'mampu bekerja sama' },
  { k: 'percayadiri', label: 'Percaya diri', frasa: 'dengan penuh percaya diri', sifat: 'percaya diri' },
  { k: 'rajin', label: 'Rajin berlatih', frasa: 'dan rajin berlatih', sifat: 'rajin berlatih' },
  { k: 'tanggungjawab', label: 'Bertanggung jawab', frasa: 'serta bertanggung jawab atas tugasnya', sifat: 'bertanggung jawab' },
  { k: 'peduli', label: 'Peduli teman', frasa: 'dan peduli terhadap teman', sifat: 'peduli terhadap teman' },
  { k: 'pantang', label: 'Pantang menyerah', frasa: 'dengan semangat pantang menyerah', sifat: 'pantang menyerah' },
  { k: 'sopan', label: 'Sopan', frasa: 'dengan sikap sopan', sifat: 'sopan' },
  { k: 'mandiri', label: 'Mandiri', frasa: 'secara mandiri', sifat: 'mandiri' },
  { k: 'motivasi', label: 'Perlu motivasi', frasa: 'dan perlu terus diberi semangat', sifat: '', dukung: true },
  { k: 'pendampingan', label: 'Perlu pendampingan', frasa: 'dan masih perlu pendampingan', sifat: '', dukung: true }
];
const BT_BATAS = { eks: 200, hadir: 300 };   // di bawah batas server (300 dan 500 karakter) agar ringkas di rapor
let BT = null;   // { jenis:'eks'|'hadir', baris:[{ id, s, e?, sifat:[] }] }

/* ---------- bank kalimat (tanpa AI) ---------- */
const BT_BUKA = {
  'Sangat Baik': ['Sangat aktif dan bersemangat mengikuti kegiatan {e}', 'Menunjukkan kemampuan yang sangat baik dalam {e}',
    'Mengikuti kegiatan {e} dengan sangat baik', 'Sangat menonjol dalam kegiatan {e}', 'Berprestasi sangat baik dalam kegiatan {e}'],
  'Baik': ['Aktif mengikuti kegiatan {e}', 'Mengikuti {e} dengan baik', 'Menunjukkan perkembangan yang baik dalam {e}',
    'Rutin dan bersungguh-sungguh mengikuti {e}', 'Bersemangat mengikuti latihan {e}'],
  'Cukup': ['Cukup aktif mengikuti kegiatan {e}', 'Mengikuti {e} dengan cukup baik', 'Mulai menunjukkan kemajuan dalam {e}',
    'Berusaha mengikuti kegiatan {e} dengan cukup baik', 'Cukup bersemangat dalam kegiatan {e}'],
  'Kurang': ['Perlu lebih aktif dalam kegiatan {e}', 'Masih perlu bimbingan dalam mengikuti {e}',
    'Perlu meningkatkan kehadiran dan keaktifan dalam {e}', 'Perlu dukungan agar lebih bersemangat mengikuti {e}', 'Mulai berusaha mengikuti kegiatan {e}']
};
const BT_EKOR = ['', ' secara rutin', ' dengan penuh semangat', ' dan menunjukkan sikap yang positif', ' serta mengikuti setiap latihan dengan tertib',
  ' dan senang berlatih bersama teman', ' dengan antusias', ' dan selalu hadir tepat waktu'];
const BT_TUTUP = ['', ' sepanjang semester ini', ' selama semester ini'];

const BT_CAT_1 = ['Ananda telah mengikuti pembelajaran semester ini dengan baik.', 'Ananda aktif dan bersemangat dalam mengikuti pembelajaran.',
  'Ananda menunjukkan perkembangan yang baik selama semester ini.', 'Ananda mengikuti kegiatan di kelas dengan tertib dan bersemangat.',
  'Ananda menunjukkan kemajuan belajar yang menggembirakan.', 'Ananda mampu mengikuti pelajaran dengan sungguh-sungguh.',
  'Ananda senang belajar dan aktif dalam kegiatan kelas.', 'Ananda menunjukkan semangat belajar yang patut dihargai.'];
const BT_CAT_1S = ['Ananda menunjukkan sikap {s} selama mengikuti pembelajaran.', 'Ananda dikenal sebagai murid yang {s} di kelas.',
  'Sikap {s} Ananda tampak dalam kegiatan sehari-hari di kelas.', 'Ananda selalu berusaha {s} dalam setiap kegiatan belajar.'];
const BT_CAT_2 = {
  alpa: ['Ananda diharapkan meningkatkan kehadiran agar tidak tertinggal pelajaran.', 'Kehadiran di sekolah perlu ditingkatkan agar belajar semakin lancar.',
    'Ananda diharapkan selalu hadir agar dapat mengikuti pelajaran dengan utuh.'],
  sakit: ['Semoga Ananda selalu sehat sehingga dapat belajar setiap hari.', 'Jaga kesehatan agar Ananda dapat mengikuti pelajaran dengan lancar.',
    'Ananda diharapkan menjaga kesehatan agar belajar tetap lancar.'],
  motivasi: ['Ananda perlu terus diberi semangat agar lebih percaya diri dalam belajar.', 'Dengan dorongan dari rumah dan sekolah, Ananda pasti semakin bersemangat.',
    'Ananda diharapkan lebih berani bertanya dan mencoba hal baru.'],
  pendampingan: ['Dengan pendampingan di rumah dan di sekolah, Ananda pasti semakin berkembang.', 'Ananda masih memerlukan pendampingan agar belajarnya semakin lancar.',
    'Bimbingan yang tekun akan membantu Ananda berkembang lebih baik.'],
  umum: ['Pertahankan semangat belajar dan teruslah berprestasi.', 'Teruslah giat belajar agar prestasi semakin meningkat.',
    'Semoga semester depan Ananda semakin bersemangat dan berprestasi.', 'Tingkatkan terus rasa ingin tahu dalam belajar.',
    'Teruslah kembangkan kemampuan dengan rajin membaca.', 'Ananda dapat menjadi teladan yang baik bagi teman-teman.',
    'Pertahankan sikap baik ini di semester berikutnya.', 'Teruslah berlatih agar kemampuan semakin berkembang.']
};

function btNorm(t){ return String(t || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim(); }
function btSifat(k){ return BT_SIFAT.find(x => x.k === k); }
function btAcak(n){ return Math.floor(Math.random() * n); }

/** Kalimat bawaan untuk satu baris; `pakai` = himpunan kalimat yang sudah ada di kelas ini (agar tidak kembar). */
function btBank(b, pakai){
  if (BT.jenis === 'eks') {
    const buka = BT_BUKA[b.e.predikat] || BT_BUKA.Baik, sifat = b.sifat.map(btSifat).filter(Boolean);
    const ekor = sifat.length ? [' ' + sifat.map(x => x.frasa).join(' ')] : BT_EKOR;
    const n = buka.length * ekor.length * BT_TUTUP.length, mulai = btAcak(n);
    for (let i = 0; i < n; i++) {
      const x = (mulai + i) % n, o = buka[x % buka.length], t = ekor[Math.floor(x / buka.length) % ekor.length], u = BT_TUTUP[Math.floor(x / (buka.length * ekor.length))];
      if ((/dengan/.test(o) && /^ (dengan|secara)/.test(t)) || (/rutin/i.test(o) && /rutin/.test(t))) continue;   // hindari "dengan … dengan", "rutin … rutin"
      const k = o.replace('{e}', b.e.kegiatan) + t + u + '.';
      if (!pakai.has(btNorm(k))) return k;
    }
    return buka[0].replace('{e}', b.e.kegiatan) + ' dengan semangat yang patut dihargai.';
  }
  const sifat = b.sifat.map(btSifat).filter(x => x && x.sifat), dukung = b.sifat.map(btSifat).find(x => x && x.dukung);
  const satu = sifat.length ? BT_CAT_1S.map(p => p.replace('{s}', sifat.map(x => x.sifat).join(' dan '))) : BT_CAT_1;
  const p = WK_HADIR[b.s.id] || {};
  const dua = Number(p.alpa) > 0 ? BT_CAT_2.alpa : Number(p.sakit) >= 3 ? BT_CAT_2.sakit : dukung ? BT_CAT_2[dukung.k] : BT_CAT_2.umum;
  const n = satu.length * dua.length, mulai = btAcak(n);
  for (let i = 0; i < n; i++) {
    const x = (mulai + i) % n, k = satu[x % satu.length] + ' ' + dua[Math.floor(x / satu.length)];
    if (!pakai.has(btNorm(k))) return k;
  }
  for (const u of BT_CAT_2.umum) { const k = satu[0] + ' ' + u; if (!pakai.has(btNorm(k))) return k; }
  return satu[0] + ' Semoga semakin bersemangat.';
}

/* ---------- Gemini ---------- */
async function btGemini(sistem, perintah){
  const kunci = ls.get(KUNCI_GEMINI);
  if (!kunci) throw new Error('tanpa-kunci');
  let akhir = 'gagal';
  for (const model of MODEL_GEMINI) {
    const henti = new AbortController(), batas = setTimeout(() => henti.abort(), 60000);
    let r;
    try {
      r = await fetch(URL_GEMINI + encodeURIComponent(model) + ':generateContent', {
        method: 'POST', signal: henti.signal, headers: { 'Content-Type': 'application/json', 'x-goog-api-key': kunci },
        body: JSON.stringify({ systemInstruction: { parts: [{ text: sistem }] }, contents: [{ role: 'user', parts: [{ text: perintah }] }],
          generationConfig: { responseMimeType: 'application/json', temperature: 0.9, maxOutputTokens: 8192 } })
      });
    } catch (e) { throw new Error('jaringan'); } finally { clearTimeout(batas); }
    const j = await r.json().catch(() => ({}));
    if (r.ok) {
      const c = (j.candidates || [])[0] || {};
      return bacaJson(((c.content || {}).parts || []).map(p => p.text || '').join(''));
    }
    akhir = String(r.status);
    if (r.status === 404 || r.status >= 500) continue;   // model cadangan
    break;
  }
  throw new Error(akhir);
}

const BT_SISTEM = 'Anda wali kelas Sekolah Dasar di Indonesia yang menulis deskripsi rapor. Tulis dalam bahasa Indonesia baku, santun, positif, ' +
  'membangun, dan mudah dipahami orang tua. Jangan pernah menulis nama siswa, nama orang, atau angka nomor urut di dalam kalimat. ' +
  'Setiap kalimat dalam satu kelas WAJIB berbeda: variasikan susunan kalimat, kata kerja, dan pilihan kata; jangan mengulang pola yang sama. ' +
  'Jawab hanya dengan JSON sesuai format yang diminta.';

function btPerintah(){
  if (BT.jenis === 'eks') {
    const data = BT.baris.map(b => ({ id: b.id, ekskul: b.e.kegiatan, predikat: b.e.predikat, sifat: b.sifat.map(k => btSifat(k).label.toLowerCase()) }));
    return 'Tulis keterangan ekstrakurikuler untuk rapor, satu baris data = satu keterangan.\n' +
      'Ketentuan: tepat 1 kalimat, paling banyak ' + BT_BATAS.eks + ' karakter, tanpa sapaan dan tanpa nama; sesuai nama ekstrakurikuler dan predikatnya ' +
      '(Sangat Baik, Baik, Cukup, atau Kurang; untuk Cukup/Kurang tetap santun dan beri arah perbaikan); bila ada sifat, masukkan secara wajar. ' +
      'Tidak boleh ada dua keterangan yang sama atau hampir sama.\n' +
      'Format jawaban: {"hasil":[{"id":"…","kalimat":"…"}]} dengan id persis sama seperti data.\nData: ' + JSON.stringify(data);
  }
  const data = BT.baris.map(b => { const p = WK_HADIR[b.s.id] || {};
    return { id: b.id, sakit: Number(p.sakit) || 0, izin: Number(p.izin) || 0, tanpa_keterangan: Number(p.alpa) || 0, sifat: b.sifat.map(k => btSifat(k).label.toLowerCase()) }; });
  return 'Tulis catatan wali kelas untuk rapor semester, satu baris data = satu catatan.\n' +
    'Ketentuan: paling banyak 2 kalimat dan ' + BT_BATAS.hadir + ' karakter, memakai sapaan "Ananda" (tanpa nama), positif dan memotivasi; ' +
    'bila ada sifat, sebutkan secara wajar; bila tanpa_keterangan lebih dari 0, ajak meningkatkan kehadiran dengan santun; bila sakit banyak, doakan kesehatan; ' +
    '"perlu motivasi" atau "perlu pendampingan" ditulis halus sebagai harapan. Jangan menyebut angka hari. ' +
    'Tidak boleh ada dua catatan yang sama atau hampir sama.\n' +
    'Format jawaban: {"hasil":[{"id":"…","kalimat":"…"}]} dengan id persis sama seperti data.\nData: ' + JSON.stringify(data);
}

/** Kalimat dari Gemini diterima bila id cocok, panjang wajar, tidak kembar di kelas ini, dan jumlah kalimat sesuai. */
function btSah(k, pakai){
  const t = String(k || '').replace(/\s+/g, ' ').trim();
  if (!t || t.length > BT_BATAS[BT.jenis] || pakai.has(btNorm(t))) return '';
  const kalimat = t.split(/[.!?](\s|$)/).filter(x => x && x.trim()).length;
  if (kalimat > (BT.jenis === 'eks' ? 1 : 2)) return '';
  if (BT.jenis === 'hadir' && !/Ananda/.test(t)) return '';
  return t;
}

/* ---------- panel ---------- */
function btBaris(jenis){
  const baris = [];
  if (jenis === 'eks') {
    WK.siswa.forEach(s => (WK_EKS[s.id] || []).forEach(e => { if (e.kegiatan && e.predikat) baris.push({ s, e, sifat: [] }); }));
  } else WK.siswa.forEach(s => baris.push({ s, sifat: [] }));
  baris.forEach((b, i) => { b.id = String(i + 1); });
  return baris;
}
function btIsiLama(b){ return BT.jenis === 'eks' ? String(b.e.keterangan || '').trim() : String((WK_HADIR[b.s.id] || {}).catatan || '').trim(); }

function btPanduan(jenis){
  const eks = jenis === 'eks';
  return '<details class="bt-panduan" style="margin:0 0 10px">' +
    '<summary style="cursor:pointer">📖 Cara pakai dan saran (klik untuk membaca)</summary>' +
    '<div style="border:1px solid var(--line);border-radius:10px;padding:8px 10px;margin-top:8px">' +
    '<p style="margin:8px 0 4px"><b>Cara pakai</b></p><ol style="margin:0 0 6px 18px;padding:0;font-size:13.5px;line-height:1.5">' +
    (eks ? '<li>Pastikan setiap siswa sudah punya kegiatan dan predikat di tabel ekstrakurikuler.</li>'
         : '<li>Isi dulu angka sakit, izin, dan tanpa keterangan bila ada.</li>') +
    '<li>Untuk siswa yang ingin ditonjolkan, pilih 1–2 sifat yang paling terlihat. Boleh dikosongkan.</li>' +
    '<li>Klik <b>Buat usulan</b>. Usulan langsung masuk ke kotak isian di tabel.</li>' +
    '<li>Baca setiap usulan dan ubah bila kurang sesuai dengan pengamatan Bapak/Ibu.</li>' +
    '<li>Klik <b>' + (eks ? 'Simpan ekstrakurikuler' : 'Simpan ketidakhadiran &amp; catatan') + '</b>. Sebelum tombol ini diklik, usulan belum tersimpan.</li></ol>' +
    '<p style="margin:8px 0 4px"><b>Saran</b></p><ul style="margin:0 0 4px 18px;padding:0;font-size:13.5px;line-height:1.5">' +
    '<li>Memilih sifat membuat kalimat lebih khas untuk setiap anak.</li>' +
    '<li>Usulan hanya bantuan. Bapak/Ibu tetap penentu isi rapor.</li>' +
    '<li>Untuk anak yang masih perlu dukungan, pilih <i>Perlu motivasi</i> atau <i>Perlu pendampingan</i>. Kalimatnya tetap santun dan membangun.</li>' +
    '<li>Kotak yang sudah Bapak/Ibu ketik tidak diganti, kecuali mencentang <i>Ganti juga</i>.</li>' +
    '<li>Dengan kunci Gemini, kalimat lebih beragam. Tanpa kunci, fitur tetap bisa dipakai dengan kalimat bawaan.</li>' +
    '<li>Nama siswa tidak dikirim ke Gemini.</li>' +
    '<li>Kerjakan satu kelas sampai selesai dan simpan sebelum pindah halaman.</li></ul></div></details>';
}

function bukaBantuTulis(jenis){
  if (!WK) return;
  BT = { jenis, baris: btBaris(jenis) };
  const d = $('#bt-dialog');
  $('#bt-judul').textContent = jenis === 'eks' ? '✨ Bantu tulis keterangan ekstrakurikuler' : '✨ Bantu tulis catatan wali kelas';
  $('#bt-msg').textContent = ''; $('#bt-msg').className = 'msg';
  if (!BT.baris.length) {
    $('#bt-isi').innerHTML = btPanduan(jenis) + '<p class="hint">Belum ada siswa dengan ekstrakurikuler dan predikat. Pilih kegiatan dan predikat dulu, lalu buka Bantu tulis lagi.</p>';
    $('#bt-buat').classList.add('hidden'); d.showModal(); return;
  }
  $('#bt-buat').classList.remove('hidden');
  const adaKunci = !!ls.get(KUNCI_GEMINI), sudahDiisi = BT.baris.filter(btIsiLama).length;
  const opsiSifat = pilih => '<option value="">—</option>' + BT_SIFAT.map(x => '<option value="' + x.k + '"' + (x.k === pilih ? ' selected' : '') + '>' + esc(x.label) + '</option>').join('');
  $('#bt-isi').innerHTML = btPanduan(jenis) +
    '<p class="hint" style="margin:0 0 8px">Pilih 1–2 sifat untuk siswa yang ingin ditonjolkan (boleh dikosongkan). Nama siswa <b>tidak</b> dikirim ke Gemini. ' +
    'Hasilnya berupa usulan di kotak isian; baca dan ubah bila perlu, lalu klik <b>Simpan</b>.</p>' +
    (sudahDiisi ? '<label class="check" style="margin:0 0 8px"><input type="checkbox" id="bt-timpa"> <span>Ganti juga ' + sudahDiisi + ' kotak yang sudah Anda ketik (bawaan: tidak diganti)</span></label>' : '') +
    (adaKunci ? '<p class="sub" style="margin:0 0 8px">Memakai kunci Gemini yang tersimpan di perangkat ini.</p>'
      : '<details class="bt-kunci" style="margin:0 0 8px"><summary class="sub">Kunci Gemini belum diisi, usulan memakai kalimat bawaan. <b>Isi kunci (opsional)</b></summary>' +
        '<p class="hint" style="margin:6px 0">Buat kunci gratis di <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener">aistudio.google.com/apikey</a>, lalu tempel di sini. Kunci yang sama dipakai Program Kokurikuler dan hanya tersimpan di perangkat ini.</p>' +
        '<div style="display:flex;gap:6px"><input id="bt-kunci" type="password" autocomplete="off" spellcheck="false" placeholder="Tempel kunci API Gemini"><button class="btn small" type="button" id="bt-kunci-simpan" style="width:auto">Simpan</button></div></details>') +
    '<div class="bt-daftar">' + BT.baris.map((b, i) => '<div class="bt-baris"><div class="bt-nama"><b>' + esc(b.s.no) + '.</b> ' + esc(b.s.nama) +
      (b.e ? ' <span class="sub">· ' + esc(b.e.kegiatan) + ' (' + esc(b.e.predikat) + ')</span>' : '') + '</div>' +
      '<select data-bt="' + i + '" data-n="0" aria-label="Sifat 1">' + opsiSifat(b.sifat[0]) + '</select>' +
      '<select data-bt="' + i + '" data-n="1" aria-label="Sifat 2">' + opsiSifat(b.sifat[1]) + '</select></div>').join('') + '</div>';
  d.showModal();
}

async function buatUsulan(){
  const timpa = $('#bt-timpa') ? $('#bt-timpa').checked : false;
  const sasaran = BT.baris.filter(b => timpa || !btIsiLama(b));
  if (!sasaran.length) return pesan('#bt-msg', 'Semua kotak sudah Anda isi. Centang "Ganti juga" bila ingin diganti usulan baru.', false);
  const pakai = new Set(BT.baris.filter(b => !sasaran.includes(b)).map(b => btNorm(btIsiLama(b))).filter(Boolean));
  const usul = {};
  let sumber = 'bank', jadiAI = 0;
  const simpanBT = BT.baris; BT.baris = sasaran;
  try {
    const j = await btGemini(BT_SISTEM, btPerintah());
    (Array.isArray(j.hasil) ? j.hasil : []).forEach(h => {
      const id = String(h && h.id), b = sasaran.find(x => x.id === id);
      if (!b || usul[id]) return;
      const k = btSah(h.kalimat, pakai);
      if (k) { usul[id] = k; pakai.add(btNorm(k)); jadiAI++; }
    });
    sumber = 'ai';
  } catch (e) { sumber = e.message === 'tanpa-kunci' ? 'tanpa-kunci' : 'gagal'; }
  finally { BT.baris = simpanBT; }
  sasaran.forEach(b => { if (!usul[b.id]) { usul[b.id] = btBank(b, pakai); pakai.add(btNorm(usul[b.id])); } });
  sasaran.forEach(b => { if (BT.jenis === 'eks') b.e.keterangan = usul[b.id]; else WK_HADIR[b.s.id].catatan = usul[b.id]; });
  if (BT.jenis === 'eks') { WK_UBAH.eks = true; renderEkskul(); }
  else { WK_UBAH.hadir = true; if (typeof simpanDrafHadir === 'function') simpanDrafHadir(); renderHadir(); }
  $('#bt-dialog').close();
  const tujuan = BT.jenis === 'eks' ? '#wk-eks-msg' : '#wk-hadir-msg', tombol = BT.jenis === 'eks' ? 'Simpan ekstrakurikuler' : 'Simpan ketidakhadiran & catatan';
  const asal = sumber === 'ai' ? (jadiAI === sasaran.length ? '' : ' Sebagian memakai kalimat bawaan.')
    : sumber === 'tanpa-kunci' ? ' Disusun dengan kalimat bawaan.' : ' Gemini sedang tidak dapat dipakai, jadi usulan disusun dengan kalimat bawaan.';
  pesan(tujuan, '✨ Usulan sudah diisi di ' + sasaran.length + ' kotak.' + asal + ' Baca dan ubah bila perlu, lalu klik ' + tombol + '.', true);
}

(function pasangBantuTulis(){
  document.head.insertAdjacentHTML('beforeend', '<style>' +
    '#bt-dialog{max-width:620px}#bt-dialog .isi{padding:14px 18px;max-height:62vh;overflow:auto}' +
    '.bt-baris{display:grid;grid-template-columns:1fr 130px 130px;gap:6px;align-items:center;padding:6px 0;border-bottom:1px solid var(--line)}' +
    '.bt-baris select{font-size:13px;padding:6px}.bt-nama{font-size:13.5px;min-width:0}' +
    '@media (max-width:520px){.bt-baris{grid-template-columns:1fr 1fr}.bt-nama{grid-column:1/-1}}' +
    '.bt-neon{background:linear-gradient(135deg,#7c3aed,#2563eb)!important;color:#fff!important;font-weight:800!important;border:0!important;' +
    'text-shadow:0 1px 1px rgba(0,0,0,.25);box-shadow:0 2px 10px rgba(99,102,241,.45)!important;animation:btDenyut 2.6s ease-in-out 5}' +
    '.bt-neon:hover,.bt-neon:focus-visible{background:linear-gradient(135deg,#6d28d9,#1d4ed8)!important;box-shadow:0 3px 16px rgba(99,102,241,.6)!important}' +
    '.bt-panduan>summary{list-style:none;display:inline-block;background:linear-gradient(135deg,#7c3aed,#2563eb);color:#fff;font-weight:800;padding:8px 14px;border-radius:999px;' +
    'border:0;text-shadow:0 1px 1px rgba(0,0,0,.25);box-shadow:0 2px 10px rgba(99,102,241,.45);animation:btDenyut 2.6s ease-in-out 5}' +
    '.bt-panduan>summary::-webkit-details-marker{display:none}.bt-panduan[open]>summary{animation:none}' +
    '.bt-panduan>summary:hover,.bt-panduan>summary:focus-visible{background:linear-gradient(135deg,#6d28d9,#1d4ed8)}' +
    '@keyframes btDenyut{50%{box-shadow:0 2px 18px rgba(99,102,241,.75)}}' +
    '@media (prefers-reduced-motion:reduce){.bt-neon,.bt-panduan>summary{animation:none}}' +
    '</style>');
  document.body.insertAdjacentHTML('beforeend',
    '<dialog id="bt-dialog" class="profil" aria-labelledby="bt-judul"><div class="kepala"><small>USULAN KALIMAT</small><h3 id="bt-judul">✨ Bantu tulis</h3>' +
    '<p>Usulan bisa diubah sebelum disimpan</p></div><div class="isi" id="bt-isi"></div><div class="msg" id="bt-msg" style="margin:0 18px"></div>' +
    '<div class="tombol" style="padding:12px 18px 16px"><button class="btn" type="button" id="bt-buat">Buat usulan</button>' +
    '<button class="btn ghost" type="button" id="bt-tutup">Batal</button></div></dialog>');
  const tombol = (jenis, sesudah) => {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'btn small bt-neon'; b.style.width = 'auto'; b.id = 'bt-buka-' + jenis; b.textContent = '✨ Bantu tulis'; b.title = 'Usulan kalimat otomatis. Baca dan ubah bila perlu, lalu simpan.';
    b.addEventListener('click', () => bukaBantuTulis(jenis));
    $(sesudah).insertAdjacentElement('afterend', b);
  };
  tombol('eks', '#wk-eks-simpan');
  tombol('hadir', '#wk-hadir-simpan');
  $('#bt-tutup').addEventListener('click', () => $('#bt-dialog').close());
  $('#bt-buat').addEventListener('click', e => sibuk(e.target, buatUsulan));
  $('#bt-isi').addEventListener('change', e => {
    const t = e.target;
    if (t.dataset.bt === undefined) return;
    const b = BT.baris[Number(t.dataset.bt)];
    b.sifat[Number(t.dataset.n)] = t.value;
    b.sifat = b.sifat.filter(Boolean).filter((x, i, a) => a.indexOf(x) === i).slice(0, 2);
  });
  $('#bt-isi').addEventListener('click', e => {
    if (e.target.id !== 'bt-kunci-simpan') return;
    const k = $('#bt-kunci').value.trim();
    if (!/^[\w.-]{20,}$/.test(k)) return pesan('#bt-msg', 'Kunci belum lengkap atau memuat spasi. Salin ulang seluruh kunci.', false);
    ls.set(KUNCI_GEMINI, k);
    e.target.closest('details').outerHTML = '<p class="sub" style="margin:0 0 8px">Kunci tersimpan di perangkat ini. Usulan akan disusun dengan Gemini.</p>';
  });
})();
})();
