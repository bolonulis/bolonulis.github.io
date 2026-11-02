/* Simulasi TKA: fungsi bersama halaman /tka/ dan /tka/ujian.html.
   Kunci jawaban tidak ada di peramban: penilaian dan pembahasan diminta ke server (TKA_API di konfigurasi.js). */
const TKA = (() => {
  const bank = {};
  const simpan = {
    get: (k, awal = null) => { try { const v = JSON.parse(localStorage.getItem(k)); return v ?? awal; } catch (e) { return awal; } },
    set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* mode privat / penyimpanan penuh */ } },
    hapus: k => { try { localStorage.removeItem(k); } catch (e) { /* abaikan */ } }
  };
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const HURUF = 'ABCDE';

  /** [[3/4]] → pecahan bersusun; [[1 1/4]] → pecahan campuran. */
  function pecahan(html) {
    return String(html ?? '').replace(/\[\[(?:(\d+) )?(\d+)\/(\d+)\]\]/g, (_, u, a, b) =>
      (u ? '<span class="pc-u">' + u + '</span>' : '') + '<span class="pc"><span>' + a + '</span><span>' + b + '</span></span>');
  }

  function idPerangkat() {
    let id = simpan.get('tka-perangkat');
    if (!id) { id = 't' + Date.now().toString(36) + Math.random().toString(36).slice(2, 10); simpan.set('tka-perangkat', id); }
    return id;
  }

  function siapServer() { return typeof TKA_API === 'string' && /^https:\/\//.test(TKA_API); }

  async function api(req) {
    if (!siapServer()) return { ok: false, pesan: 'Server penilaian belum dipasang oleh Admin.' };
    try {
      const r = await fetch(TKA_API, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ ...req, perangkat: idPerangkat() }) });
      return await r.json();
    } catch (e) {
      return { ok: false, putus: true, pesan: 'Tidak dapat terhubung ke server. Periksa koneksi internet, lalu coba lagi.' };
    }
  }

  function muatBank(id) {
    if (bank[id]) return Promise.resolve(bank[id]);
    if (!/^[a-z0-9-]+$/.test(id)) return Promise.reject(new Error('Paket tidak dikenal'));
    return new Promise((ok, gagal) => {
      const s = document.createElement('script');
      s.src = 'bank/' + id + '.js?v=2';
      s.onload = () => bank[id] ? ok(bank[id]) : gagal(new Error('Paket tidak dikenal'));
      s.onerror = () => gagal(new Error('Paket tidak dapat dimuat'));
      document.head.appendChild(s);
    });
  }

  const kode = {
    get: () => simpan.get('tka-kode'),
    set: v => simpan.set('tka-kode', v),
    hapus: () => simpan.hapus('tka-kode')
  };
  const peserta = { get: () => simpan.get('tka-peserta', {}), set: v => simpan.set('tka-peserta', v) };
  const riwayat = {
    semua: () => simpan.get('tka-riwayat', []),
    ambil: id => riwayat.semua().find(r => r.id === id),
    simpan: r => simpan.set('tka-riwayat', [r, ...riwayat.semua().filter(x => x.id !== r.id)].slice(0, 40))
  };

  /* ---------- Tampilan soal ---------- */

  /** Teks jawaban siswa untuk satu butir, dalam bentuk ringkas (mis. "B", "A, C", "B–S–B"). */
  function ringkasJawaban(q, j) {
    if (j === undefined || j === null) return '–';
    if (q.tipe === 'pg') return j;
    if (q.tipe === 'pgk') return j.length ? j.join(', ') : '–';
    return j.map(v => v === true ? q.kolom[0] : v === false ? q.kolom[1] : '–').join(' · ');
  }

  /** Bagian soal untuk mode tinjau/laporan: pilihan ditandai jawaban siswa (✎) dan kunci (✔). */
  function htmlTinjau(b, q, jawab, rinci) {
    let h = '';
    if (q.teks) h += '<div class="tj-teks">' + pecahan(q.teks) + '</div>';
    if (q.gambar) h += '<div class="tj-gbr">' + q.gambar + '</div>';
    if (q.tanya) h += '<div class="tj-teks">' + pecahan(q.tanya) + '</div>';
    const kunci = rinci && rinci.kunci;
    if (q.tipe === 'pg' || q.tipe === 'pgk') {
      const pilih = q.tipe === 'pg' ? (jawab ? [jawab] : []) : (jawab || []);
      const benar = kunci == null ? [] : (Array.isArray(kunci) ? kunci : [kunci]);
      h += '<ol class="tj-opsi">' + q.opsi.map((o, i) => {
        const L = HURUF[i], k = benar.includes(L), p = pilih.includes(L);
        return '<li class="' + (k ? 'kunci ' : '') + (p ? 'pilih' : '') + '"><b>' + L + '</b><div>' + pecahan(o) + '</div>' +
          (p ? '<em class="tanda-p">jawabanmu</em>' : '') + (k ? '<em class="tanda-k">kunci</em>' : '') + '</li>';
      }).join('') + '</ol>';
    } else {
      h += '<table class="tj-bs"><thead><tr><th>Pernyataan</th><th>Jawabanmu</th><th>Kunci</th></tr></thead><tbody>' +
        q.pernyataan.map((p, i) => {
          const j = jawab ? jawab[i] : null, k = kunci ? kunci[i] : null;
          const t = v => v === true ? q.kolom[0] : v === false ? q.kolom[1] : '–';
          return '<tr><td>' + pecahan(p) + '</td><td class="' + (k != null && j === k ? 'ok' : 'x') + '">' + t(j) + '</td><td><b>' + t(k) + '</b></td></tr>';
        }).join('') + '</tbody></table>';
    }
    return h;
  }

  function statusSkor(s) { return s >= 0.999 ? ['benar', 'Benar'] : s > 0 ? ['sebagian', 'Benar sebagian'] : ['salah', 'Salah']; }

  /** Rekap per elemen dan subelemen (mirip laporan hasil TKA), dari skor per butir. */
  function analisis(b, rinci) {
    const el = new Map();
    b.soal.forEach(q => {
      const s = rinci[q.no] ? rinci[q.no].skor : 0;
      if (!el.has(q.elemen)) el.set(q.elemen, { skor: 0, n: 0, sub: new Map() });
      const e = el.get(q.elemen); e.skor += s; e.n++;
      if (!e.sub.has(q.subelemen)) e.sub.set(q.subelemen, { skor: 0, n: 0, butir: [] });
      const u = e.sub.get(q.subelemen); u.skor += s; u.n++; u.butir.push(q.no);
    });
    return el;
  }
  const persen = (s, n) => Math.round(s / n * 10000) / 100;
  const angka = v => v.toLocaleString('id-ID', { maximumFractionDigits: 2 });

  function htmlAnalisis(b, rinci) {
    let h = '<table class="analisis"><thead><tr><th>Elemen / Subelemen</th><th>Nomor soal</th><th>Capaian</th></tr></thead><tbody>';
    analisis(b, rinci).forEach((e, nama) => {
      const pe = persen(e.skor, e.n);
      h += '<tr class="el"><td>' + esc(nama) + '</td><td></td><td>' + batang(pe) + '</td></tr>';
      e.sub.forEach((u, sn) => {
        h += '<tr><td class="sub">' + esc(sn) + '</td><td>' + u.butir.join(', ') + '</td><td>' + batang(persen(u.skor, u.n)) + '</td></tr>';
      });
    });
    return h + '</tbody></table>';
  }
  function batang(p) {
    const w = p >= 70 ? 'baik' : p >= 50 ? 'cukup' : 'kurang';
    return '<div class="bt"><span class="bt-isi ' + w + '" style="width:' + Math.max(2, p) + '%"></span></div><b class="bt-n">' + angka(p) + '%</b>';
  }

  /** Dokumen pembahasan utuh (HTML mandiri) untuk diunduh atau dicetak menjadi PDF. */
  function dokumenPembahasan(b, r, hasil) {
    const ps = r.peserta || {};
    const judul = 'Pembahasan Simulasi TKA ' + b.jenjang + ' ' + b.mapel + ' ' + b.paket;
    const tgl = new Date(r.waktu).toLocaleString('id-ID', { dateStyle: 'long', timeStyle: 'short' });
    let stimTampil = {};
    let isi = b.soal.map(q => {
      const rc = hasil.rinci[q.no] || { skor: 0 };
      const [cls, lbl] = statusSkor(rc.skor);
      let stim = '';
      if (q.stimulus && !stimTampil[q.stimulus]) {
        stimTampil[q.stimulus] = true;
        const st = b.stimulus[q.stimulus];
        stim = '<section class="stim"><h3>' + esc(st.judul) + '</h3>' + pecahan(st.isi) + '</section>';
      }
      return stim + '<article class="butir"><header><span class="no">Soal ' + q.no + '</span><span class="st ' + cls + '">' + lbl + '</span>' +
        '<span class="ind">' + esc(q.indikator) + '</span></header>' + htmlTinjau(b, q, r.jawaban[q.no], rc) +
        '<div class="bahas"><b>Pembahasan</b><div>' + pecahan(rc.bahas || '') + '</div></div></article>';
    }).join('');
    // gambar berkas (bank/gambar/...) dijadikan alamat lengkap agar tetap tampil di berkas unduhan
    const akar = new URL('bank/', location.href).href;
    isi = isi.replace(/src="bank\//g, 'src="' + akar);
    return '<!doctype html><html lang="id"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>' + esc(judul) + '</title><style>' + CSS_LAPORAN + '</style></head><body>' +
      '<header class="kop"><div><small>SIMULASI TKA · BOLONULIS.GITHUB.IO/TKA</small><h1>' + esc(judul) + '</h1>' +
      '<p>' + esc(ps.nama || '-') + (ps.sekolah ? ' · ' + esc(ps.sekolah) : '') + (ps.kelas ? ' · ' + esc(ps.kelas) : '') + '<br>' + tgl + '</p></div>' +
      '<div class="nilai"><small>Nilai</small><b>' + angka(hasil.nilai) + '</b><small>' + hasil.terjawab + ' dari ' + hasil.jumlah + ' soal dijawab</small></div></header>' +
      '<h2>Analisis per elemen</h2>' + htmlAnalisis(b, hasil.rinci) +
      '<h2>Ringkasan jawaban</h2><table class="ringkas"><thead><tr><th>No</th><th>Jawabanmu</th><th>Kunci</th><th>Hasil</th></tr></thead><tbody>' +
      b.soal.map(q => { const rc = hasil.rinci[q.no] || {}; const [c, l] = statusSkor(rc.skor || 0); return '<tr><td>' + q.no + '</td><td>' + esc(ringkasJawaban(q, r.jawaban[q.no])) + '</td><td>' + esc(ringkasJawaban(q, rc.kunci)) + '</td><td class="' + c + '">' + l + '</td></tr>'; }).join('') +
      '</tbody></table><h2>Soal dan pembahasan</h2>' + isi +
      '<footer>Soal simulasi ini disusun mengikuti kisi-kisi dan indikator TKA, bukan soal resmi. © ' + new Date().getFullYear() + ' Karya untuk Guru SD · bolonulis.github.io</footer></body></html>';
  }

  const CSS_LAPORAN = 'body{font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;color:#16202a;max-width:860px;margin:auto;padding:24px 18px;line-height:1.55;background:#fff}' +
    'h1{margin:4px 0;font-size:22px;color:#12314f}h2{color:#12314f;font-size:18px;margin:28px 0 10px;border-bottom:2px solid #ffd21f;padding-bottom:4px}h3{margin:0 0 8px;color:#12314f}' +
    '.kop{display:flex;justify-content:space-between;gap:16px;align-items:center;border-bottom:4px solid #12314f;padding-bottom:12px}.kop small{color:#5b6b7f;font-weight:700;font-size:11px;letter-spacing:.06em}.kop p{margin:4px 0 0;color:#5b6b7f;font-size:14px}' +
    '.nilai{text-align:center;background:#12314f;color:#fff;border-radius:14px;padding:10px 18px;min-width:130px}.nilai b{display:block;font-size:34px;color:#ffd21f;line-height:1.1}.nilai small{color:#d6e2ee;font-size:11px}' +
    'table{border-collapse:collapse;width:100%;font-size:14px}th,td{border:1px solid #dfe5ec;padding:6px 8px;text-align:left;vertical-align:top}th{background:#f1f5f9}' +
    '.analisis .el td{background:#eef4fb;font-weight:700}.analisis .sub{padding-left:22px}.bt{display:inline-block;width:110px;height:9px;background:#e6ebf1;border-radius:9px;vertical-align:middle;margin-right:6px;overflow:hidden}.bt-isi{display:block;height:100%}.baik{background:#1b7f3e}.cukup{background:#e0a400}.kurang{background:#c0392b}' +
    '.ringkas td.benar{color:#1b7f3e;font-weight:700}.ringkas td.sebagian{color:#b7791f;font-weight:700}.ringkas td.salah{color:#c0392b;font-weight:700}' +
    '.stim{background:#fffaf0;border:1px solid #eadfc7;border-radius:12px;padding:12px 16px;margin:18px 0 10px;break-inside:avoid}.stim p{margin:6px 0}' +
    '.butir{border:1px solid #dfe5ec;border-radius:12px;padding:12px 16px;margin:12px 0;break-inside:avoid}.butir header{display:flex;flex-wrap:wrap;gap:6px 10px;align-items:center;margin-bottom:8px}' +
    '.no{font-weight:800;color:#12314f}.st{font-size:12px;font-weight:800;padding:2px 9px;border-radius:99px}.st.benar{background:#e3f4e7;color:#1b7f3e}.st.sebagian{background:#fff3cd;color:#8a5a00}.st.salah{background:#fde2e1;color:#a61b1b}.ind{flex-basis:100%;font-size:12.5px;color:#5b6b7f}' +
    '.tj-opsi{list-style:none;padding:0;margin:8px 0}.tj-opsi li{display:flex;gap:10px;align-items:flex-start;border:1px solid #e6ebf1;border-radius:10px;padding:6px 10px;margin:5px 0}.tj-opsi li>b{flex:none;width:24px;height:24px;border-radius:50%;background:#eef2f6;display:grid;place-items:center;font-size:13px}.tj-opsi li>div{flex:1}' +
    '.tj-opsi li.kunci{border-color:#1b7f3e;background:#eefaf1}.tj-opsi li.kunci>b{background:#1b7f3e;color:#fff}.tj-opsi li.pilih:not(.kunci){border-color:#c0392b;background:#fdf0ef}.tj-opsi li.pilih:not(.kunci)>b{background:#c0392b;color:#fff}' +
    '.tj-opsi em{font-style:normal;font-size:11px;font-weight:800;padding:1px 7px;border-radius:99px;align-self:center}.tanda-k{background:#1b7f3e;color:#fff}.tanda-p{background:#12314f;color:#fff}' +
    '.tj-bs td.ok{color:#1b7f3e;font-weight:700}.tj-bs td.x{color:#c0392b}.tj-gbr{margin:8px 0;overflow-x:auto}.tj-gbr svg,.gbr{max-width:100%;height:auto;color:#16202a}.gbr2{display:flex;flex-wrap:wrap;gap:12px;margin:8px 0}' +
    'img{max-width:100%;height:auto}.tj-opsi img{max-height:140px;width:auto}.tj-opsi svg{max-height:120px;width:auto}.bahas{margin-top:10px;background:#f4f8fd;border-left:4px solid #1f6fb2;border-radius:6px;padding:8px 12px;font-size:14.5px}.bahas>b{color:#1f6fb2}' +
    '.pc{display:inline-flex;flex-direction:column;vertical-align:middle;text-align:center;font-size:.86em;line-height:1.1;margin:0 2px}.pc>span:first-child{border-bottom:1.5px solid currentColor;padding:0 2px}.pc-u{margin-right:1px}' +
    '.tabel{margin:6px 0}.tabel caption{font-weight:700;text-align:left;margin-bottom:4px}.poster{border:2px dashed #c0392b;border-radius:12px;padding:12px;text-align:center}.poster .besar{display:block;font-size:17px;color:#c0392b}' +
    'footer{margin-top:30px;color:#5b6b7f;font-size:12px;text-align:center}@media print{body{padding:0}h2{break-after:avoid}}';

  return {
    bank, simpan, esc, pecahan, api, siapServer, muatBank, kode, peserta, riwayat, idPerangkat, HURUF,
    ringkasJawaban, htmlTinjau, statusSkor, htmlAnalisis, dokumenPembahasan, angka,
    daftarkan: b => { bank[b.id] = b; }
  };
})();
