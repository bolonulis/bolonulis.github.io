/* Membuat bank/materi.js (bagian GRATIS) dan bank/materi-premium.js (bagian PREMIUM, tersandi ringan) dari
   alat/materi-sumber.js. Setiap angka dihitung ulang dua kali (cek dan cek2); build gagal bila ada yang tidak cocok.
   Jalankan: node tka/alat/buat-materi.js */
const fs = require('fs'), path = require('path');
const sumber = require('./materi-sumber.js');
const jalur = (() => { const t = fs.readFileSync(path.join(__dirname, '../bank/jalur.js'), 'utf8'); return JSON.parse(t.slice(t.indexOf('{'), t.lastIndexOf('}') + 1)); })();

const fpb = (a, b) => b ? fpb(b, a % b) : a, kpk = (a, b) => a * b / fpb(a, b);
const hitung = ekspr => Function('fpb', 'kpk', '"use strict"; return (' + ekspr + ');')(fpb, kpk);
const sama = (a, b) => Math.abs(a - b) < 1e-9;
let galat = 0, dicek = 0;
function periksa(no, label, x) {
  const pasangan = [['nilai', 'cek'], ['nilai', 'cek2'], ['nilai2', 'cek3']];
  pasangan.forEach(([n, c]) => {
    if (x[c] === undefined) return;
    const v = hitung(x[c]); dicek++;
    if (!sama(v, x[n])) { galat++; console.error('✗ indikator ' + no + ' ' + label + ': ' + c + ' = ' + v + ', tertulis ' + n + ' = ' + x[n]); }
  });
  if (x.cek === undefined || x.cek2 === undefined) { galat++; console.error('✗ indikator ' + no + ' ' + label + ': cek/cek2 belum lengkap'); }
}

const gratis = {}, premium = {};
sumber.mat.forEach(d => {
  const ind = jalur.mapel.mat.indikator.find(i => i.no === d.no);
  if (!ind) throw new Error('Indikator ' + d.no + ' tidak ada di jalur.js');
  d.contoh.forEach((c, i) => periksa(d.no, 'contoh ' + (i + 1), c));
  d.latihan.forEach((c, i) => periksa(d.no, 'latihan ' + (i + 1), c));
  gratis[d.no] = { no: d.no, judul: ind.judul, indikator: ind.indikator, elemen: ind.elemen, p: d.p, ringkas: d.ringkas, gambar: d.gambar, awas: d.awas,
    contoh: d.contoh.map(c => ({ soal: c.soal, langkah: c.langkah })),
    pratinjau: { trik: d.trik.map(t => t.judul), latihan: d.latihan.length } };
  premium[d.no] = { trik: d.trik, tabelLatihan: d.tabelLatihan || '', latihan: d.latihan.map(c => ({ soal: c.soal, jawab: c.jawab, cara: c.cara })) };
});
if (galat) { console.error(galat + ' ketidakcocokan. Berkas TIDAK dibuat.'); process.exit(1); }

const urut = sumber.mat.map(d => d.no);
const kepala = '/* Materi per Indikator · Kelas Intensif TKA. DIBUAT OTOMATIS oleh tka/alat/buat-materi.js dari alat/materi-sumber.js; jangan disunting langsung. */\n';
fs.writeFileSync(path.join(__dirname, '../bank/materi.js'), kepala + 'const MATERI_TKA = ' + JSON.stringify({ per: sumber.per, mapel: { mat: { urut, isi: gratis } } }) + ';\n');
const sandi = Buffer.from(JSON.stringify({ mat: premium }), 'utf8').toString('base64').split('').reverse().join('');
fs.writeFileSync(path.join(__dirname, '../bank/materi-premium.js'), kepala.replace('Materi per Indikator', 'Materi per Indikator (bagian Kelas Premium)') + 'const MATERI_PREMIUM_TKA = ' + JSON.stringify(sandi) + ';\n');
console.log('✓ ' + dicek + ' hitungan cocok (' + urut.length + ' indikator: ' + urut.join(', ') + '). bank/materi.js dan bank/materi-premium.js dibuat.');
