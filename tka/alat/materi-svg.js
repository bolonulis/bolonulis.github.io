/* Gambar sederhana (SVG ringan) untuk Materi per Indikator. Dipakai oleh materi-sumber.js. */
const W = '#12314f', ORANYE = '#f59e0b', BIRU = '#60a5fa', HIJAU = '#34d399', ABU = '#cbd5e1';
const teks = s => String(s).replace(/\[\[(?:(\d+) )?(\d+)\/(\d+)\]\]/g, (_, u, a, b) => (u ? u + ' ' : '') + a + '/' + b).replace(/&/g, '&amp;').replace(/</g, '&lt;');
const svg = (w, h, isi, label) => '<svg class="mt-svg" viewBox="0 0 ' + w + ' ' + h + '" width="' + w + '" height="' + h + '" role="img" aria-label="' + teks(label) + '" xmlns="http://www.w3.org/2000/svg" font-family="system-ui,sans-serif">' + isi + '</svg>';

module.exports = {
  /** Layang-layang dibagi garis bantu menjadi dua segitiga (alas 8, tinggi 3 + 3), di atas petak 1 cm. */
  layang() {
    const u = 22, ox = 20, oy = 14; let g = '';
    for (let i = 0; i <= 8; i++) g += '<line x1="' + (ox + i * u) + '" y1="' + oy + '" x2="' + (ox + i * u) + '" y2="' + (oy + 6 * u) + '" stroke="' + ABU + '"/>';
    for (let j = 0; j <= 6; j++) g += '<line x1="' + ox + '" y1="' + (oy + j * u) + '" x2="' + (ox + 8 * u) + '" y2="' + (oy + j * u) + '" stroke="' + ABU + '"/>';
    const P = (x, y) => (ox + x * u) + ',' + (oy + y * u);
    g += '<polygon points="' + P(0, 3) + ' ' + P(5, 0) + ' ' + P(8, 3) + '" fill="#fde68a" stroke="' + W + '" stroke-width="2"/>';
    g += '<polygon points="' + P(0, 3) + ' ' + P(5, 6) + ' ' + P(8, 3) + '" fill="#bfdbfe" stroke="' + W + '" stroke-width="2"/>';
    g += '<line x1="' + (ox + 5 * u) + '" y1="' + oy + '" x2="' + (ox + 5 * u) + '" y2="' + (oy + 3 * u) + '" stroke="#dc2626" stroke-width="2" stroke-dasharray="5 4"/>';
    g += '<text x="' + (ox + 5 * u + 5) + '" y="' + (oy + 1.7 * u) + '" font-size="13" fill="#dc2626" font-weight="700">tinggi 3</text>';
    g += '<text x="' + (ox + 2.2 * u) + '" y="' + (oy + 3 * u - 5) + '" font-size="13" fill="' + W + '" font-weight="700">alas 8</text>';
    return svg(220, 160, g, 'Layang-layang dibagi menjadi dua segitiga dengan alas 8 dan tinggi 3');
  },
  /** Persegi panjang dengan keempat sisi diberi angka. */
  persegiPanjang(p, l) {
    const g = '<rect x="40" y="25" width="180" height="90" fill="#dcfce7" stroke="' + W + '" stroke-width="2"/>' +
      '<text x="130" y="18" text-anchor="middle" font-size="14" font-weight="700" fill="' + W + '">' + p + ' m</text>' +
      '<text x="130" y="136" text-anchor="middle" font-size="14" font-weight="700" fill="' + W + '">' + p + ' m</text>' +
      '<text x="34" y="75" text-anchor="end" font-size="14" font-weight="700" fill="' + W + '">' + l + ' m</text>' +
      '<text x="226" y="75" font-size="14" font-weight="700" fill="' + W + '">' + l + ' m</text>' +
      '<text x="130" y="68" text-anchor="middle" font-size="13" fill="#166534">luas = ' + p + ' × ' + l + '</text>' +
      '<text x="130" y="86" text-anchor="middle" font-size="13" fill="#166534">keliling = ' + p + ' + ' + l + ' + ' + p + ' + ' + l + '</text>';
    return svg(270, 145, g, 'Persegi panjang ' + p + ' kali ' + l + ' meter');
  },
  /** Denah angka tampak atas (baris pertama = belakang). */
  denah(baris) {
    const u = 40, ox = 60, oy = 26; let g = '<text x="' + (ox + baris[0].length * u / 2) + '" y="16" text-anchor="middle" font-size="12" fill="#64748b">belakang</text>';
    baris.forEach((b, j) => b.forEach((v, i) => {
      g += '<rect x="' + (ox + i * u) + '" y="' + (oy + j * u) + '" width="' + u + '" height="' + u + '" fill="#e0f2fe" stroke="' + W + '" stroke-width="2"/>' +
        '<text x="' + (ox + i * u + u / 2) + '" y="' + (oy + j * u + u / 2 + 7) + '" text-anchor="middle" font-size="20" font-weight="800" fill="' + W + '">' + v + '</text>';
    }));
    g += '<text x="' + (ox + baris[0].length * u / 2) + '" y="' + (oy + baris.length * u + 16) + '" text-anchor="middle" font-size="12" fill="#64748b">depan</text>';
    return svg(ox * 2 + baris[0].length * u, oy + baris.length * u + 26, g, 'Denah angka tampak atas');
  },
  /** Neraca: piring kiri lebih berat (turun). */
  neraca(kiri, kanan) {
    const g = '<polygon points="130,150 115,175 145,175" fill="' + W + '"/><line x1="130" y1="150" x2="130" y2="70" stroke="' + W + '" stroke-width="4"/>' +
      '<line x1="40" y1="82" x2="220" y2="58" stroke="' + W + '" stroke-width="4"/>' +
      '<line x1="40" y1="82" x2="40" y2="110" stroke="' + W + '" stroke-width="2"/><line x1="220" y1="58" x2="220" y2="86" stroke="' + W + '" stroke-width="2"/>' +
      '<path d="M8 110 h64 a32 12 0 0 1 -64 0z" fill="#fde68a" stroke="' + W + '"/><path d="M188 86 h64 a32 12 0 0 1 -64 0z" fill="#bfdbfe" stroke="' + W + '"/>' +
      '<text x="40" y="104" text-anchor="middle" font-size="14" font-weight="800" fill="' + W + '">' + teks(kiri) + '</text>' +
      '<text x="220" y="80" text-anchor="middle" font-size="14" font-weight="800" fill="' + W + '">' + teks(kanan) + '</text>' +
      '<text x="40" y="142" text-anchor="middle" font-size="12" fill="#b45309">lebih berat → turun</text>';
    return svg(260, 180, g, 'Neraca: ' + kiri + ' lebih berat daripada ' + kanan + ' sehingga turun');
  },
  /** Tabel HTML sederhana. */
  tabel(kepala, isi, judul) {
    return '<table class="mt-tabel"><caption>' + teks(judul) + '</caption><thead><tr>' + kepala.map(k => '<th>' + teks(k) + '</th>').join('') + '</tr></thead><tbody>' +
      isi.map(b => '<tr>' + b.map(v => '<td>' + teks(v) + '</td>').join('') + '</tr>').join('') + '</tbody></table>';
  },
  /** Garis bilangan 0–1 dengan titik-titik bilangan. */
  garisBilangan(titik) {
    const x = v => 20 + v * 300; let g = '<line x1="20" y1="60" x2="320" y2="60" stroke="' + W + '" stroke-width="2"/>';
    for (let i = 0; i <= 10; i++) g += '<line x1="' + x(i / 10) + '" y1="55" x2="' + x(i / 10) + '" y2="65" stroke="' + W + '"/>' + (i % 5 === 0 ? '<text x="' + x(i / 10) + '" y="82" text-anchor="middle" font-size="12" fill="#64748b">' + (i / 10).toString().replace('.', ',') + '</text>' : '');
    titik.forEach(([lb, v], k) => { g += '<circle cx="' + x(v) + '" cy="60" r="5" fill="' + [ORANYE, BIRU, HIJAU, '#a78bfa'][k % 4] + '"/><text x="' + x(v) + '" y="' + (k % 2 ? 44 : 30) + '" text-anchor="middle" font-size="13" font-weight="800" fill="' + W + '">' + teks(lb) + '</text>'; });
    return svg(340, 92, g, 'Garis bilangan 0 sampai 1');
  },
  /** 8 kue dipotong setengah → 16 potong. */
  pecahanSetengah() {
    let g = '';
    for (let i = 0; i < 8; i++) { const cx = 26 + i * 38; g += '<circle cx="' + cx + '" cy="40" r="16" fill="#fde68a" stroke="' + W + '"/><line x1="' + cx + '" y1="24" x2="' + cx + '" y2="56" stroke="#dc2626" stroke-width="2"/>'; }
    g += '<text x="160" y="84" text-anchor="middle" font-size="13" fill="' + W + '">8 kue, tiap kue dipotong 2 → 8 : [½] = 16 potong</text>'.replace('[½]', '½');
    return svg(320, 94, g, 'Delapan kue masing-masing dipotong dua menjadi enam belas potong');
  },
  /** Gelas ukur dengan n bagian, terisi sampai garis k. */
  gelasUkur(n, k, label) {
    const tinggi = 150, atas = 15, bawah = atas + tinggi, l = 70, x0 = 60; let g = '';
    const isi = tinggi * k / n;
    g += '<rect x="' + x0 + '" y="' + (bawah - isi) + '" width="' + l + '" height="' + isi + '" fill="#bfdbfe"/>';
    g += '<path d="M' + x0 + ' ' + atas + ' V' + bawah + ' H' + (x0 + l) + ' V' + atas + '" fill="none" stroke="' + W + '" stroke-width="3"/>';
    for (let i = 1; i <= n; i++) { const y = bawah - tinggi * i / n; g += '<line x1="' + x0 + '" y1="' + y + '" x2="' + (x0 + 18) + '" y2="' + y + '" stroke="' + W + '" stroke-width="2"/><text x="' + (x0 - 6) + '" y="' + (y + 4) + '" text-anchor="end" font-size="12" fill="' + W + '">' + (i === n ? label : 'garis ' + i) + '</text>'; }
    return svg(200, 180, g, 'Gelas ukur ' + label + ' dengan ' + n + ' garis, terisi sampai garis ' + k);
  },
  /** Piktogram: [[nama, banyak gambar (boleh .5)]], 1 gambar = skala. */
  piktogram(baris, skala, satuan) {
    let g = '', y = 24;
    baris.forEach(([nm, n]) => {
      g += '<text x="8" y="' + (y + 5) + '" font-size="13" font-weight="700" fill="' + W + '">' + teks(nm) + '</text>';
      for (let i = 0; i < Math.ceil(n); i++) {
        const x = 64 + i * 26, sebagian = n - i < 1;
        g += sebagian ? '<path d="M' + x + ' ' + (y - 10) + ' A10 10 0 0 0 ' + x + ' ' + (y + 10) + ' Z" fill="' + ORANYE + '"/>' : '<circle cx="' + x + '" cy="' + y + '" r="10" fill="' + ORANYE + '"/>';
      }
      y += 30;
    });
    g += '<text x="8" y="' + (y + 4) + '" font-size="12" fill="#64748b">Keterangan: 1 ● = ' + skala + ' ' + teks(satuan) + ', ◖ = ' + (skala / 2).toString().replace('.', ',') + ' ' + teks(satuan) + '</text>';
    return svg(250, y + 14, g, 'Piktogram, satu gambar mewakili ' + skala + ' ' + satuan);
  },
  /** Kelipatan dua bilangan pada dua garis, bertemu di KPK. */
  kelipatan(a, b, kpk) {
    const x = v => 20 + v * 11; let g = '';
    [[a, 30, ORANYE], [b, 70, BIRU]].forEach(([n, y, c]) => {
      g += '<line x1="20" y1="' + y + '" x2="' + x(kpk + 2) + '" y2="' + y + '" stroke="' + ABU + '" stroke-width="2"/><text x="4" y="' + (y + 4) + '" font-size="12" font-weight="800" fill="' + W + '">' + n + '</text>';
      for (let v = n; v <= kpk; v += n) g += '<circle cx="' + x(v) + '" cy="' + y + '" r="6" fill="' + (v === kpk ? '#dc2626' : c) + '"/><text x="' + x(v) + '" y="' + (y - 10) + '" text-anchor="middle" font-size="11" fill="' + W + '">' + v + '</text>';
    });
    g += '<text x="' + x(kpk) + '" y="98" text-anchor="middle" font-size="12" font-weight="800" fill="#dc2626">KPK = ' + kpk + '</text>';
    return svg(x(kpk + 3), 106, g, 'Kelipatan ' + a + ' dan ' + b + ' bertemu di ' + kpk);
  }
};
