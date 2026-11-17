#!/usr/bin/env node
/* Memisahkan Kunci.js (hasil dekripsi Kunci.gs.enc) menjadi:
 *   - Kunci.js kecil: nilai kecil (kunci admin, daftar latihan) + PAKET_BANK (paket → nama berkas data);
 *   - kunci.html, bank-eksklusif.html, bank-kelas.html: data besar sebagai JSON.
 * Tujuannya agar data 2,5 MB tidak ikut dimuat di setiap permintaan (lihat dataBesar_ di Code.gs).
 * Dipanggil oleh .github/workflows/apps-script.yml:  node tka/server/pisah-kunci.js proyek
 * Skrip ini tidak berisi data apa pun; isi kunci hanya ada di Kunci.gs.enc yang terenkripsi. */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const BESAR = { KUNCI_TKA: 'kunci', BANK_EKSKLUSIF: 'bank-eksklusif', BANK_KELAS: 'bank-kelas' };

function gagal(pesan) { console.error('::error::' + pesan); process.exit(1); }

// JSON yang aman ditaruh di berkas HTML: <, >, & ditulis sebagai \u003c dst. (JSON.parse mengembalikannya utuh).
function jsonAman(nilai) {
  return JSON.stringify(nilai).replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/&/g, '\\u0026');
}

const dir = process.argv[2] || 'proyek';
const sumber = path.join(dir, 'Kunci.js');
const teks = fs.readFileSync(sumber, 'utf8');

const konteks = {};
vm.createContext(konteks);
vm.runInContext(teks, konteks, { filename: 'Kunci.js' });
const nama = Object.keys(konteks);

for (const n of Object.keys(BESAR)) if (!konteks[n] || typeof konteks[n] !== 'object') gagal('Kunci.js tidak berisi ' + n);

const kecil = [];
const paketBank = {};
for (const n of nama) {
  const v = konteks[n];
  if (typeof v === 'function') gagal('Kunci.js berisi fungsi ' + n + '; pemisahan hanya untuk data.');
  if (BESAR[n]) {
    const berkas = BESAR[n];
    const isi = jsonAman(v);
    if (JSON.stringify(JSON.parse(isi)) !== JSON.stringify(v)) gagal('Data ' + n + ' berubah setelah ditulis ulang.');
    fs.writeFileSync(path.join(dir, berkas + '.html'), isi);
    if (n !== 'KUNCI_TKA') Object.keys(v).forEach(function (p) { if (!paketBank[p]) paketBank[p] = berkas; });
    console.log(n + ' → ' + berkas + '.html (' + Object.keys(v).length + ' paket, ' + isi.length + ' karakter)');
  } else {
    kecil.push('var ' + n + ' = ' + JSON.stringify(v) + ';');
  }
}
kecil.push('var PAKET_BANK = ' + JSON.stringify(paketBank) + ';');

const hasil = '/** Bagian kecil Kunci.gs (dipisah otomatis oleh pisah-kunci.js). Data besar ada di kunci.html dan bank-*.html. */\n' +
  kecil.join('\n') + '\n';
if (/KUNCI_TKA|BANK_EKSKLUSIF|BANK_KELAS/.test(hasil)) gagal('Kunci.js kecil masih memuat data besar.');
fs.writeFileSync(sumber, hasil);
console.log('Kunci.js kecil: ' + hasil.length + ' karakter (semula ' + teks.length + ')');
