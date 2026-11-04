// Membuat PDF soal (tanpa kunci) untuk setiap paket: tka/pdf/<id>.pdf
// Pakai (butuh Node + Playwright/Chromium): node tka/alat/buat-pdf.js
// Jalankan ulang setiap kali bank soal berubah.
const fs = require('fs'), path = require('path'), vm = require('vm');
const { chromium } = require('playwright');
const AKAR = path.join(__dirname, '..');

const ctx = { console, URL, location: { href: 'https://bolonulis.github.io/tka/' } };
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(AKAR, 'tka.js'), 'utf8') + '\nthis.TKA = TKA;', ctx);
vm.runInContext(fs.readFileSync(path.join(AKAR, 'bank/daftar.js'), 'utf8') + '\nthis.PAKET_TKA = PAKET_TKA;', ctx);

(async () => {
  const br = await chromium.launch();
  const hal = await br.newPage();
  // Gambar AI diperkecil (JPEG 520 px) khusus untuk PDF agar ukuran berkas ringan untuk diunduh di HP.
  const { execFileSync } = require('child_process');
  const KECIL = fs.mkdtempSync(path.join(require('os').tmpdir(), 'tka-pdf-'));
  await hal.route('**/tka/bank/gambar/*', async r => {
    const nama = decodeURIComponent(new URL(r.request().url()).pathname.split('/').pop());
    const asal = path.join(AKAR, 'bank/gambar', nama), jadi = path.join(KECIL, nama + '.jpg');
    if (!fs.existsSync(asal)) return r.fulfill({ status: 404 });
    if (!fs.existsSync(jadi)) execFileSync('python3', ['-c', 'import sys;from PIL import Image;im=Image.open(sys.argv[1]).convert("RGB");im.thumbnail((520,520));im.save(sys.argv[2],quality=72,optimize=True)', asal, jadi]);
    r.fulfill({ contentType: 'image/jpeg', body: fs.readFileSync(jadi) });
  });
  for (const p of ctx.PAKET_TKA) {
    vm.runInContext(fs.readFileSync(path.join(AKAR, 'bank', p.id + '.js'), 'utf8'), ctx);
    const b = ctx.TKA.bank[p.id];
    await hal.setContent(ctx.TKA.dokumenSoal(b), { waitUntil: 'networkidle' });
    const rusak = await hal.evaluate(() => [...document.images].filter(i => !i.complete || i.naturalWidth === 0).length);
    if (rusak) throw new Error(p.id + ': ' + rusak + ' gambar gagal dimuat');
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
