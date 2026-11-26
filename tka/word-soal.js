/* Kelas Intensif TKA · Unduh soal sebagai Word (.docx) — KHUSUS GURU (dimuat hanya oleh guru.html).
   Berkas dibuat di peramban dengan pustaka docx (tanpa Drive). Semua gambar soal (berkas .webp dan gambar SVG)
   diubah menjadi PNG lalu ditanam di berkas, sehingga ikut terbawa saat berkas dibuka di Word/Google Docs tanpa internet.
   Kunci & pembahasan hanya disertakan bila guru memintanya dan kelas Premium (diperiksa pemanggil dan server). */
const WordSoal = (() => {
  const PUSTAKA = 'https://cdn.jsdelivr.net/npm/docx@9.5.1/dist/index.iife.js';
  const HURUF = 'ABCDE';
  let muat = null;
  function muatDocx() {
    if (window.docx) return Promise.resolve();
    if (muat) return muat;
    muat = new Promise((ok, gagal) => {
      const s = document.createElement('script');
      s.src = PUSTAKA; s.onload = ok;
      s.onerror = () => { muat = null; gagal(new Error('Pustaka Word gagal dimuat. Periksa koneksi internet, lalu coba lagi.')); };
      document.head.appendChild(s);
    });
    return muat;
  }

  /* ---------- gambar → PNG ---------- */
  const MAKS_L = 520, MAKS_T = 420;   // ukuran tampil di Word (piksel, ±13,7 × 11 cm)
  function muatGambar(src) {
    return new Promise((ok, gagal) => { const im = new Image(); im.onload = () => ok(im); im.onerror = () => gagal(new Error('gambar')); im.src = src; });
  }
  async function kePng(src, lebarAsli, tinggiAsli, maksL, maksT, foto) {
    const im = await muatGambar(src);
    let w = lebarAsli || im.naturalWidth || 300, h = tinggiAsli || im.naturalHeight || 200;
    const skala = Math.min(1, (maksL || MAKS_L) / w, (maksT || MAKS_T) / h);
    const tw = Math.max(1, Math.round(w * skala)), th = Math.max(1, Math.round(h * skala));
    const c = document.createElement('canvas'), mutu = foto ? 1.6 : 2;   // lebih rapat dari ukuran tampil agar tajam saat dicetak
    c.width = tw * mutu; c.height = th * mutu;
    const g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height);
    g.drawImage(im, 0, 0, c.width, c.height);
    // foto (berkas .webp) → JPEG agar berkas Word tetap ringan; gambar garis (SVG) → PNG agar tetap tajam
    const b64 = c.toDataURL(foto ? 'image/jpeg' : 'image/png', 0.82).split(',')[1], bin = atob(b64), data = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) data[i] = bin.charCodeAt(i);
    return { data, w: tw, h: th, type: foto ? 'jpg' : 'png' };
  }
  function ukuranSvg(el) {
    const vb = (el.getAttribute('viewBox') || '').split(/[\s,]+/).map(Number);
    let w = parseFloat(el.getAttribute('width')), h = parseFloat(el.getAttribute('height'));
    if (!(w > 0) && vb.length === 4) w = vb[2];
    if (!(h > 0) && vb.length === 4) h = vb[3] * (w / vb[2] || 1);
    return { w: w > 0 ? w : 300, h: h > 0 ? h : 200 };
  }
  async function svgKePng(el, maksL, maksT) {
    const salin = el.cloneNode(true), u = ukuranSvg(el);
    salin.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    if (!salin.getAttribute('width')) salin.setAttribute('width', u.w);
    if (!salin.getAttribute('height')) salin.setAttribute('height', u.h);
    salin.setAttribute('style', 'color:#16202a;' + (salin.getAttribute('style') || ''));
    const teks = new XMLSerializer().serializeToString(salin).replace(/currentColor/g, '#16202a');
    const url = URL.createObjectURL(new Blob([teks], { type: 'image/svg+xml' }));
    try { return await kePng(url, u.w, u.h, maksL, maksT); } finally { URL.revokeObjectURL(url); }
  }

  /* ---------- HTML soal → paragraf Word ---------- */
  const pecahanTeks = s => String(s || '').replace(/\[\[(?:(\d+) )?(\d+)\/(\d+)\]\]/g, (_, u, a, b) => (u ? u + ' ' : '') + a + '/' + b);
  const BLOK = new Set(['P', 'DIV', 'SECTION', 'ARTICLE', 'FIGURE', 'FIGCAPTION', 'H1', 'H2', 'H3', 'H4', 'LI', 'UL', 'OL', 'BLOCKQUOTE', 'HEADER', 'FOOTER', 'CAPTION']);

  /** Ubah satu potongan HTML menjadi daftar elemen Word (Paragraph/Table). Gambar sudah ditanam (data URI). */
  async function keWord(html, gaya = {}, awalan) {
    const D = docx, akar = document.createElement('div');
    akar.innerHTML = pecahanTeks(html);
    const hasil = []; let baris = awalan ? awalan.slice() : [];
    const tutup = (opsi = {}) => {
      if (baris.some(r => !r._teks || r._teks.trim())) hasil.push(new D.Paragraph({ children: baris, spacing: { after: 80 }, ...gaya.paragraf, ...opsi }));
      baris = [];
    };
    const teks = (t, f) => { if (!t) return; const r = new D.TextRun({ text: t, bold: f.b, italics: f.i, size: gaya.ukuran }); r._teks = t; baris.push(r); };
    async function jalan(n, f, daftar) {
      if (n.nodeType === 3) { teks(n.nodeValue.replace(/\s+/g, ' '), f); return; }
      if (n.nodeType !== 1) return;
      const tag = n.tagName.toUpperCase();
      if (tag === 'SCRIPT' || tag === 'STYLE') return;
      if (tag === 'BR') { baris.push(new D.TextRun({ break: 1 })); return; }
      if (tag === 'IMG') {
        try { const p = await kePng(n.src, 0, 0, gaya.maksL, gaya.maksT, true); baris.push(new D.ImageRun({ type: p.type, data: p.data, transformation: { width: p.w, height: p.h } })); WordSoal._gambar++; }
        catch (e) { teks('[gambar]', f); }
        return;
      }
      if (tag === 'SVG') {
        try { const p = await svgKePng(n, gaya.maksL, gaya.maksT); baris.push(new D.ImageRun({ type: 'png', data: p.data, transformation: { width: p.w, height: p.h } })); WordSoal._gambar++; }
        catch (e) { teks('[gambar]', f); }
        return;
      }
      // kumpulan gambar berjajar (kartu-gbr, gbr2, ilus-kisi) → tabel 2–3 kolom agar gambar tidak sebesar satu halaman
      if (tag === 'DIV' && /\b(kartu-gbr|gbr2|ilus-kisi)\b/.test(n.className) && n.children.length > 1) {
        tutup();
        const isi = [...n.children], kol = Math.min(3, Number((n.getAttribute('style') || '').match(/--kolom:\s*(\d)/)?.[1]) || (isi.length === 4 ? 2 : 3));
        const rows = [];
        for (let i = 0; i < isi.length; i += kol) {
          const cells = [];
          for (let j = 0; j < kol; j++) {
            const c = isi[i + j], par = c ? await keWord(c.outerHTML, { ...gaya, maksL: Math.floor(500 / kol), maksT: 200 }) : [];
            cells.push(new D.TableCell({ children: par.length ? par : [new D.Paragraph('')], margins: { top: 40, bottom: 40, left: 60, right: 60 } }));
          }
          rows.push(new D.TableRow({ children: cells }));
        }
        hasil.push(new D.Table({ rows, width: { size: 100, type: D.WidthType.PERCENTAGE } }), new D.Paragraph({ text: '', spacing: { after: 60 } }));
        return;
      }
      if (tag === 'TABLE') {
        tutup();
        const rows = [];
        for (const tr of n.querySelectorAll('tr')) {
          const cells = [];
          for (const td of tr.children) {
            const isi = await keWord(td.innerHTML, { ...gaya, maksL: 220, maksT: 200 });
            cells.push(new D.TableCell({ children: isi.length ? isi : [new D.Paragraph('')], columnSpan: Number(td.getAttribute('colspan')) || 1,
              shading: td.tagName === 'TH' ? { fill: 'EEF2F7' } : undefined, margins: { top: 40, bottom: 40, left: 80, right: 80 } }));
          }
          if (cells.length) rows.push(new D.TableRow({ children: cells }));
        }
        const cap = n.querySelector('caption');
        if (cap) hasil.push(new D.Paragraph({ children: [new D.TextRun({ text: cap.textContent.trim(), bold: true })] }));
        if (rows.length) hasil.push(new D.Table({ rows, width: { size: 100, type: D.WidthType.PERCENTAGE } }), new D.Paragraph({ text: '', spacing: { after: 60 } }));
        return;
      }
      const blok = BLOK.has(tag);
      if (blok) tutup();
      const f2 = { b: f.b || tag === 'B' || tag === 'STRONG' || /^H\d$/.test(tag), i: f.i || tag === 'I' || tag === 'EM' };
      if (tag === 'LI') teks(daftar && daftar.urut ? (++daftar.n) + '. ' : '• ', f2);
      const anak = tag === 'OL' ? { urut: true, n: 0 } : tag === 'UL' ? { urut: false } : daftar;
      for (const c of [...n.childNodes]) { if (c.nodeType === 1 && c.tagName.toUpperCase() === 'CAPTION') continue; await jalan(c, f2, anak); }
      if (blok) tutup();
    }
    for (const c of [...akar.childNodes]) await jalan(c, {}, null);
    tutup();
    return hasil;
  }

  const ringkasKunci = (q, k) => {
    if (k == null) return '-';
    if (q.tipe === 'pg') return HURUF[k] || String(k);
    if (q.tipe === 'pgk') return (Array.isArray(k) ? k : [k]).map(i => HURUF[i]).join(', ');
    if (q.tipe === 'bs') return (Array.isArray(k) ? k : []).map((v, i) => '(' + (i + 1) + ') ' + (q.kolom ? q.kolom[v] : v)).join('; ');
    return String(k);
  };

  /** Satu paket soal → daftar elemen Word. */
  async function isiPaket(b, rinci, judul, ket, opsi) {
    const D = docx, out = [];
    out.push(new D.Paragraph({ children: [new D.TextRun({ text: opsi.kop || 'KELAS INTENSIF TKA', size: 18, color: '5B6B7F', bold: true })] }));
    out.push(new D.Paragraph({ heading: D.HeadingLevel.HEADING_1, children: [new D.TextRun({ text: (rinci ? 'Kunci & Pembahasan · ' : '') + judul, bold: true, size: 30, color: '12314F' })] }));
    if (ket) out.push(new D.Paragraph({ children: [new D.TextRun({ text: ket, size: 20, color: '5B6B7F' })], spacing: { after: 120 } }));
    if (!rinci) {
      out.push(new D.Paragraph({ children: [new D.TextRun({ text: 'Nama: ........................................   Kelas: ..........   Sekolah: ..............................', size: 22 })], spacing: { after: 160 } }));
      out.push(new D.Paragraph({ children: [new D.TextRun({ text: 'Petunjuk: pilihan ganda → pilih satu jawaban; pilihan ganda kompleks → pilih semua jawaban yang benar; Benar/Salah → beri tanda centang pada kolom yang sesuai.', italics: true, size: 20 })], spacing: { after: 200 } }));
    }
    const sudah = {};
    for (const q of b.soal) {
      if (q.stimulus && !sudah[q.stimulus] && b.stimulus && b.stimulus[q.stimulus]) {
        sudah[q.stimulus] = true;
        const st = b.stimulus[q.stimulus], nomor = b.soal.filter(x => x.stimulus === q.stimulus).map(x => x.no);
        out.push(new D.Paragraph({ children: [new D.TextRun({ text: 'Bacalah teks berikut untuk menjawab soal nomor ' + nomor[0] + (nomor.length > 1 ? '–' + nomor[nomor.length - 1] : '') + '.', italics: true, size: 20 })], spacing: { before: 200 } }));
        out.push(new D.Paragraph({ children: [new D.TextRun({ text: st.judul || '', bold: true })] }));
        out.push(...await keWord(st.isi));
      }
      const nomor = new D.TextRun({ text: q.no + '. ', bold: true }); nomor._teks = 'x';   // nomor di depan paragraf pertama soal
      out.push(new D.Paragraph({ text: '', spacing: { before: 120 } }), ...await keWord(q.teks || '', {}, [nomor]));
      if (q.gambar) out.push(...await keWord(q.gambar));
      if (q.tanya) out.push(...await keWord(q.tanya));
      if (opsi.petunjuk && q.petunjuk) out.push(...await keWord('<i>Petunjuk:</i> ' + q.petunjuk));
      if (q.tipe === 'pgk') out.push(new D.Paragraph({ children: [new D.TextRun({ text: 'Jawaban benar lebih dari satu.', italics: true, size: 20 })] }));
      if (q.tipe === 'pg' || q.tipe === 'pgk') {
        for (let i = 0; i < q.opsi.length; i++) {
          const h = new D.TextRun({ text: (q.tipe === 'pgk' ? '☐ ' : '') + HURUF[i] + '. ', bold: true }); h._teks = 'x';
          out.push(...await keWord(q.opsi[i], { maksL: 260, maksT: 200, paragraf: { indent: { left: 360 } } }, [h]));
        }
      } else if (q.tipe === 'bs') {
        const sel = t => new D.TableCell({ children: [new D.Paragraph({ children: [new D.TextRun({ text: t, bold: true })] })], shading: { fill: 'EEF2F7' } });
        const rows = [new D.TableRow({ children: [sel('Pernyataan'), ...q.kolom.map(sel)] })];
        for (const p of q.pernyataan) {
          const isi = await keWord(p, { maksL: 220, maksT: 160 });
          rows.push(new D.TableRow({ children: [new D.TableCell({ children: isi.length ? isi : [new D.Paragraph('')] }), ...q.kolom.map(() => new D.TableCell({ children: [new D.Paragraph('')] }))] }));
        }
        out.push(new D.Table({ rows, width: { size: 100, type: D.WidthType.PERCENTAGE } }));
      }
      if (rinci && rinci[q.no]) {
        out.push(new D.Paragraph({ children: [new D.TextRun({ text: 'Kunci: ' + ringkasKunci(q, rinci[q.no].kunci), bold: true, color: '1B7F3E' })], spacing: { before: 80 }, shading: { fill: 'EEFAF2' } }));
        out.push(...await keWord(rinci[q.no].bahas || '', { paragraf: { shading: { fill: 'EEFAF2' } } }));
      }
    }
    if (!rinci) {
      out.push(new D.Paragraph({ children: [new D.PageBreak()] }));
      out.push(new D.Paragraph({ heading: D.HeadingLevel.HEADING_2, children: [new D.TextRun({ text: 'Lembar Jawaban', bold: true })] }));
      for (const q of b.soal) {
        const pil = q.tipe === 'bs' ? q.pernyataan.map((_, i) => '(' + (i + 1) + ') ' + q.kolom.map(k => '☐ ' + k.split(' ').map(w => w[0]).join('')).join('  ')).join('    ')
          : q.opsi.map((_, i) => (q.tipe === 'pgk' ? '☐ ' : '○ ') + HURUF[i]).join('   ');
        out.push(new D.Paragraph({ children: [new D.TextRun({ text: q.no + '.  ', bold: true }), new D.TextRun({ text: pil })], spacing: { after: 60 } }));
      }
    }
    out.push(new D.Paragraph({ children: [new D.TextRun({ text: rinci ? 'Dokumen guru Kelas Intensif TKA. Mohon tidak disebarkan kepada siswa sebelum mengerjakan.' : 'Soal Kelas Intensif TKA · bolonulis.github.io/tka', size: 16, color: '5B6B7F' })], spacing: { before: 240 } }));
    return out;
  }

  /**
   * Buat berkas Word untuk satu atau beberapa paket.
   * daftar: [{ bank, rinci|null, judul, ket, opsi }]. Gambar ditanam lewat TKA.tanamGambar (data URI) sebelum diubah ke PNG.
   */
  async function buat(daftar) {
    await muatDocx();
    const D = docx; WordSoal._gambar = 0;
    const anak = [];
    for (let i = 0; i < daftar.length; i++) {
      const x = daftar[i];
      const bank = await tanamBank(x.bank), rinci = x.rinci ? await tanamRinci(x.rinci) : null;
      if (i) anak.push(new D.Paragraph({ children: [new D.PageBreak()] }));
      anak.push(...await isiPaket(bank, rinci, x.judul, x.ket, x.opsi || {}));
    }
    const doc = new D.Document({
      creator: 'Kelas Intensif TKA', title: daftar.map(x => x.judul).join(' + ').slice(0, 200),
      styles: { default: { document: { run: { font: 'Calibri', size: 23 } } } },
      sections: [{ properties: { page: { margin: { top: 1000, bottom: 1000, left: 1100, right: 1100 } } }, children: anak }]
    });
    return D.Packer.toBlob(doc);
  }
  /* Semua <img> di bank ditanam sebagai data URI (menunggu semua gambar siap), tanpa skrip penjaga. */
  const bersih = h => h.replace(/<script[\s\S]*?<\/script>/gi, '');
  async function tanam(h) { return h && /<img/i.test(h) ? bersih(await TKA.tanamGambar(h)) : h; }
  async function tanamBank(b) {
    const c = JSON.parse(JSON.stringify(b));
    for (const k of Object.keys(c.stimulus || {})) c.stimulus[k].isi = await tanam(c.stimulus[k].isi);
    for (const q of c.soal) {
      for (const f of ['teks', 'gambar', 'tanya', 'petunjuk']) if (q[f]) q[f] = await tanam(q[f]);
      if (q.opsi) q.opsi = await Promise.all(q.opsi.map(tanam));
      if (q.pernyataan) q.pernyataan = await Promise.all(q.pernyataan.map(tanam));
    }
    return c;
  }
  async function tanamRinci(r) {
    const c = JSON.parse(JSON.stringify(r));
    for (const k of Object.keys(c)) if (c[k] && c[k].bahas) c[k].bahas = await tanam(c[k].bahas);
    return c;
  }
  function simpan(blob, nama) {
    const url = URL.createObjectURL(blob), a = document.createElement('a');
    a.href = url; a.download = nama.replace(/[\\/:*?"<>|]+/g, '-') + '.docx';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 15000);
  }
  return { buat, simpan, _gambar: 0 };
})();
