// Membuat PDF soal (tanpa kunci) untuk setiap paket: tka/pdf/<id>.pdf
// Pakai (butuh Node + Playwright/Chromium): node tka/alat/buat-pdf.js
// Jalankan ulang setiap kali bank soal berubah.
const fs = require('fs'), path = require('path'), vm = require('vm');
const { chromium } = require('playwright');
const AKAR = path.join(__dirname, '..');

const ctx = { console, location: { href: 'https://bolonulis.github.io/tka/' } };
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(AKAR, 'tka.js'), 'utf8') + '\nthis.TKA = TKA;', ctx);
vm.runInContext(fs.readFileSync(path.join(AKAR, 'bank/daftar.js'), 'utf8') + '\nthis.PAKET_TKA = PAKET_TKA;', ctx);

(async () => {
  const br = await chromium.launch();
  const hal = await br.newPage();
  for (const p of ctx.PAKET_TKA) {
    vm.runInContext(fs.readFileSync(path.join(AKAR, 'bank', p.id + '.js'), 'utf8'), ctx);
    const b = ctx.TKA.bank[p.id];
    await hal.setContent(ctx.TKA.dokumenSoal(b), { waitUntil: 'load' });
    const keluar = path.join(AKAR, 'pdf', p.id + '.pdf');
    await hal.pdf({
      path: keluar, format: 'A4', printBackground: true, preferCSSPageSize: true,
      displayHeaderFooter: true, headerTemplate: '<span></span>',
      footerTemplate: '<div style="font-size:8px;width:100%;text-align:center;color:#777;font-family:sans-serif">Simulasi TKA ' + b.jenjang + ' ' + b.mapel + ' ' + b.paket + ' · bolonulis.github.io/tka · Halaman <span class="pageNumber"></span> dari <span class="totalPages"></span></div>'
    });
    console.log('PDF:', path.relative(process.cwd(), keluar), Math.round(fs.statSync(keluar).size / 1024) + ' KB');
  }
  await br.close();
})();
