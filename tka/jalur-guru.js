/* Kelas Intensif TKA · Jalur Belajar Bertahap (dasbor guru): tab, rilis soal, analisis, perkembangan.
   Memakai variabel dasbor dari guru.html (KELAS, DATA, $, esc, angka, premiumAktif) saat fungsi dipanggil. */
const JG = (() => {
  const J = TKA.jalur, V = J.VERSI;
  const ADA = new Set(JALUR_TKA.ada);
  const kn = n => String(n || '').trim().toLowerCase().replace(/\s+/g, ' ');
  let TAB = TKA.simpan.get('tka-guru-tab', 'ringkas'), MRILIS = 'mat', MANALISIS = 'mat', CENTANG = null, PILIH = null;

  /* ---------- daftar paket ---------- */
  const paketKelas = () => JALUR_TKA.paket.filter(p => p.ada).map(p => ({ id: p.id, mapel: p.mapel, paket: p.paket + ' (edisi kelas)', durasi: p.durasi, soal: p.soal, kelas: true }));
  const judulInd = (m, no) => { const d = JALUR_TKA.mapel[m].indikator.find(x => x.no === no); return d ? d.judul : 'Indikator ' + no; };
  function namaItem(id) {
    const it = J.info(id); if (!it) return id;
    return it.jenis === 'kls' ? 'Tes akhir ' + JALUR_TKA.mapel[it.m].nama + ' Paket ' + it.paket : V[it.versi].kode + ' · ' + judulInd(it.m, it.no);
  }

  /* ---------- kemajuan ---------- */
  function petaKemajuan() {
    const m = new Map();
    ((DATA && DATA.kemajuan) || []).forEach(x => m.set(kn(x.nama), x));
    return m;
  }
  function namaSiswa() {
    const daftar = (DATA && DATA.siswa) || [], ada = new Set(daftar.map(kn)), lain = [];
    ((DATA && DATA.kemajuan) || []).forEach(x => { if (!ada.has(kn(x.nama))) { ada.add(kn(x.nama)); lain.push(x.nama); } });
    return daftar.concat(lain);
  }
  function keadaan(id, d) {
    if (!d) return { k: 'belum' };
    const it = J.info(id), now = Date.now() + ((DATA && DATA.sekarang) ? DATA.sekarang - (DATA._diterima || Date.now()) : 0);
    if (d.s === 'mulai' && now > d.m + it.durasi * 60000 && it.sekali) return { k: 'habis', d };
    if (d.s === 'mulai' && !d.j) return { k: 'jalan', d };
    if (d.s === 'izin') return { k: 'izin', d };
    if (d.j) return { k: 'nilai', d, n: it.sekali ? d.t : d.b };
    return { k: 'jalan', d };
  }
  const warna = n => n >= 80 ? 'hm-b' : n >= 60 ? 'hm-c' : 'hm-k';

  /* ---------- tab ---------- */
  function pasangTab() {
    const nav = $('tab-dasbor'); if (!nav || nav.dataset.siap) return;
    nav.dataset.siap = '1';
    nav.onclick = e => { const b = e.target.closest('button[data-tab]'); if (b) bukaTab(b.dataset.tab, true); };
  }
  function bukaTab(t, gulir) {
    TAB = t; TKA.simpan.set('tka-guru-tab', t);
    document.querySelectorAll('#tab-dasbor button').forEach(b => b.classList.toggle('aktif', b.dataset.tab === t));
    document.querySelectorAll('[data-panel]').forEach(p => { p.hidden = p.dataset.panel !== t; });
    if (t === 'tes' || t === 'riwayat') {
      const panel = document.querySelector('[data-panel="' + t + '"]');
      panel.appendChild($('d-paket')); panel.appendChild($('d-isi'));
      const daftar = paketTab(t);
      if (!daftar.some(p => p.id === PAKET) && daftar.length) PAKET = daftar[0].id;
      if (typeof gambar === 'function' && DATA) gambar();
    }
    if (gulir) $('tab-dasbor').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  /** Paket yang tampil pada tab Tes akhir / Riwayat. */
  function paketTab(t) {
    const ada = new Set(((DATA && DATA.baris) || []).map(b => b.paket));
    if (t === 'tes') return paketKelas().concat((typeof PAKET_EKSKLUSIF === 'undefined' ? [] : PAKET_EKSKLUSIF).filter(p => premiumAktif() || ada.has(p.id)));
    return PAKET_TKA.slice();
  }

  /* ---------- kartu pembaruan ---------- */
  function gambarBaru() {
    const el = $('k-baru'); if (!el) return;
    let tutup = false; try { tutup = !!localStorage.getItem('tka-guru-baru-' + KELAS.kode); } catch (e) { tutup = false; }
    const kosong = !(DATA.rilis || []).length;
    el.hidden = tutup && !kosong;
    el.innerHTML = '<button class="tutup-k" type="button" aria-label="Tutup" title="Tutup">✕</button>' +
      '<h2>🆕 Kelas Intensif TKA kini lebih terarah!</h2>' +
      '<p class="sub" style="margin:0 0 10px">' + (kosong ? 'Mulai hari ini, <b>semua soal di kelas Anda tertutup</b> dan baru terbuka setelah Anda rilis.' : 'Ringkasan cara kerja Jalur Belajar Bertahap.') + ' Yang baru:</p>' +
      '<ul class="baru-isi"><li><b>Soal baru berjenjang</b> per indikator: 🌱 V1 Pemahaman → 🧩 V2 Model TKA → 🎯 V3 Prediksi TKA (→ 🚀 V4 Prediksi Lanjutan untuk Kelas Premium).</li>' +
      '<li><b>Sekali kesempatan</b> untuk V2, V3, dan tes akhir, agar nilai menunjukkan pemahaman siswa yang sebenarnya, bukan hasil menebak. V1 boleh diulang.</li>' +
      '<li>Siswa langsung membaca <b>pembahasan</b> setelah menyelesaikan latihan V1–V3.</li>' +
      '<li><b>Tabel analisis</b> per indikator menunjukkan materi yang perlu pendalaman.</li>' +
      '<li><b>Tes akhir</b> Paket 1 dan 2 edisi kelas (soal baru). Nilai lama tetap tersimpan di tab Riwayat, dan nilai paket lama menjadi <b>Nilai Awal</b> untuk melihat perkembangan.</li></ul>' +
      '<div class="panduan-kecil" style="margin-top:12px"><b>🧭 Langkah berikutnya:</b><ol><li>Buka tab <b>📋 Atur Rilis</b>.</li><li>Centang <b>V1</b> untuk 2–4 indikator yang sedang dipelajari.</li><li>Ketuk <b>💾 Simpan</b>.</li><li>Ketuk <b>Bagikan ke WhatsApp</b> agar siswa membuka <b>Peta Belajar</b>.</li></ol></div>' +
      '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px"><button class="btn" type="button" data-ke="rilis">📋 Mulai atur rilis soal</button><button class="btn ghost" type="button" data-ke-panduan>📘 Baca panduan</button></div>';
    el.querySelector('.tutup-k').onclick = () => { try { localStorage.setItem('tka-guru-baru-' + KELAS.kode, '1'); } catch (e) { /* abaikan */ } el.hidden = true; };
    el.querySelector('[data-ke]').onclick = () => bukaTab('rilis', true);
    el.querySelector('[data-ke-panduan]').onclick = () => { const d = $('panduan-guru'); d.open = true; const s = $('pg-jalur'); (s || d).scrollIntoView({ behavior: 'smooth' }); };
  }

  /* ---------- atur rilis ---------- */
  function gambarRilis() {
    const el = $('k-rilis'); if (!el) return;
    if (!CENTANG) CENTANG = new Set(DATA.rilis || []);
    const awal = new Set(DATA.rilis || []), premium = premiumAktif(), km = petaKemajuan(), siswa = namaSiswa();
    const ubah = [...CENTANG].filter(x => !awal.has(x)).length + [...awal].filter(x => !CENTANG.has(x)).length;
    const d = JALUR_TKA.mapel[MRILIS];
    const grup = []; d.indikator.forEach(x => { let g = grup.find(g => g.el === x.elemen); if (!g) grup.push(g = { el: x.elemen, isi: [] }); g.isi.push(x); });
    const selesaiItem = id => siswa.filter(n => { const x = km.get(kn(n)); return x && x.data[id] && x.data[id].j; }).length;
    const kotak = id => {
      const it = J.info(id);
      if (!ADA.has(id)) return '<span class="rl-segera" title="Soal sedang disiapkan">segera</span>';
      if (it.premium && !premium) return '<span class="rl-segera" title="Khusus Kelas Premium">⭐</span>';
      return '<label class="rl-cek"><input type="checkbox" data-id="' + id + '"' + (CENTANG.has(id) ? ' checked' : '') + '><span></span></label>';
    };
    const grupCek = (isi, v) => {
      const ids = isi.map(x => J.id(MRILIS, x.no, v)).filter(id => ADA.has(id) && !(J.info(id).premium && !premium));
      if (!ids.length) return '';
      const semua = ids.every(id => CENTANG.has(id));
      return '<label class="rl-cek kecil" title="Centang semua ' + V[v].kode + ' pada kelompok ini"><input type="checkbox" data-grup="' + ids.join(',') + '"' + (semua ? ' checked' : '') + '><span></span></label>';
    };
    const jumlahDibuka = m => [...CENTANG].filter(id => J.info(id) && J.info(id).m === m).length;
    el.innerHTML = '<div class="kepala-kelas"><div><h2 style="margin:0">📋 Atur Rilis Soal</h2><p class="sub" style="margin:2px 0 0">Centang latihan yang boleh dikerjakan siswa, lalu ketuk <b>💾 Simpan</b>. Yang tidak dicentang tetap terkunci 🔒 di Peta Belajar siswa.</p></div></div>' +
      '<div class="panduan-kecil"><b>Aturannya:</b><ul><li><b>🌱 V1 Pemahaman</b>: ada petunjuk, boleh diulang. <b>🧩 V2 Model TKA</b> dan <b>🎯 V3 Prediksi TKA</b>: sekali kesempatan.</li><li>Begitu dicentang dan disimpan, latihan langsung terlihat oleh <b>semua siswa</b> di kelas ini.</li><li>Menghapus centang menutup latihan bagi siswa yang belum mengerjakan. Nilai yang sudah masuk tetap tersimpan.</li><li>Tidak perlu membuka semua sekaligus. Mulailah dengan <b>2–4 indikator</b> yang sedang dipelajari.</li></ul></div>' +
      '<details class="strategi" id="rl-strategi"><summary>💡 Saran cara mengajar dengan V1, V2, dan V3</summary>' +
      '<div class="str-isi"><div><b>1. Bertahap per minggu</b><ol><li>Senin: jelaskan materi, lalu rilis <b>V1</b>. Siswa mengerjakan di rumah dan boleh mengulang.</li><li>Rabu: cek tab <b>📊 Analisis</b>. Bahas soal V1 yang banyak salah.</li><li>Kamis: rilis <b>V2</b> sebagai tugas (sekali kesempatan).</li><li>Akhir pekan: rilis <b>V3</b> bagi kelas yang V2-nya sudah baik.</li></ol></div>' +
      '<div><b>2. Belajar bersama di kelas</b><ol><li>Tampilkan V1 di layar atau proyektor, kerjakan bersama sambil membuka <b>💡 petunjuk</b>.</li><li>Minta siswa mengerjakan V2 sendiri di kelas (15 menit), seperti kuis.</li><li>Bahas pembahasannya bersama setelah semua selesai.</li></ol></div>' +
      '<div><b>3. Remedial dari analisis</b><ol><li>Lihat indikator bertanda 🔴 di tab Analisis.</li><li>Ajarkan ulang dengan contoh lain, lalu minta siswa mengulang <b>V1</b> sampai nilainya minimal 80.</li><li>Untuk siswa yang terkendala teknis, gunakan <b>🔁 Izinkan ulang</b>.</li></ol></div>' +
      '<div><b>4. Menuju tes akhir</b><ol><li>Setelah satu elemen (mis. Bilangan) selesai sampai V2/V3, lanjutkan elemen berikutnya.</li><li>Setelah semua indikator dilatih, rilis <b>Tes akhir Paket 1</b>.</li><li>Bandingkan <b>Nilai Awal → Tes Akhir</b> di tab Analisis.</li></ol></div></div></details>' +
      '<div class="tab-mini">' + Object.keys(JALUR_TKA.mapel).map(m => '<button type="button" data-m="' + m + '" class="' + (m === MRILIS ? 'aktif' : '') + '">' + esc(JALUR_TKA.mapel[m].nama) + ' <small>(' + jumlahDibuka(m) + ' dibuka)</small></button>').join('') + '</div>' +
      '<div class="rl-alat"><button class="btn ghost kecil" type="button" data-semua="1">Centang semua V1</button><button class="btn ghost kecil" type="button" data-semua="2">Centang semua V2</button><button class="btn ghost kecil" type="button" data-semua="3">Centang semua V3</button><button class="btn ghost kecil" type="button" data-kosong>Kosongkan ' + esc(d.nama) + '</button></div>' +
      '<div style="overflow-x:auto"><table class="rl-tabel"><thead><tr><th>Indikator</th>' + [1, 2, 3, 4].map(v => '<th class="rl-v v' + v + '">' + V[v].ikon + ' ' + V[v].kode + '<small>' + V[v].nama + (v === 4 ? ' ⭐' : '') + '</small></th>').join('') + '<th>Sudah mengerjakan</th></tr></thead><tbody>' +
      grup.map(g => '<tr class="rl-grup"><td>' + esc(g.el) + '</td>' + [1, 2, 3, 4].map(v => '<td class="rl-c">' + grupCek(g.isi, v) + '</td>').join('') + '<td></td></tr>' +
        g.isi.map(x => {
          const dibuka = [1, 2, 3, 4].map(v => J.id(MRILIS, x.no, v)).filter(id => awal.has(id));
          return '<tr><td><b>' + x.no + '. ' + esc(x.judul) + '</b><small>' + esc(x.indikator) + '</small></td>' + [1, 2, 3, 4].map(v => '<td class="rl-c">' + kotak(J.id(MRILIS, x.no, v)) + '</td>').join('') +
            '<td class="rl-maju">' + (dibuka.length ? dibuka.map(id => '<span class="rl-pil v' + J.info(id).versi + '">' + V[J.info(id).versi].kode + ' ' + selesaiItem(id) + (siswa.length ? '/' + siswa.length : '') + '</span>').join('') : '<span class="catatan">belum dibuka</span>') + '</td></tr>';
        }).join('')).join('') + '</tbody></table></div>' +
      '<h3 style="margin:18px 0 6px">🏁 Tes akhir (paket 30 soal edisi kelas)</h3><p class="sub" style="margin:0 0 8px">Rilis setelah siswa berlatih semua indikator. Sekali kesempatan, siswa hanya melihat nilai.</p>' +
      '<div class="rl-paket">' + JALUR_TKA.paket.map(p => '<div class="' + (CENTANG.has(p.id) ? 'aktif' : '') + '"><b>' + esc(p.mapel + ' · ' + p.paket) + '</b><small>30 soal · 75 menit</small>' +
        (p.ada ? '<label class="rl-saklar"><input type="checkbox" data-id="' + p.id + '"' + (CENTANG.has(p.id) ? ' checked' : '') + '> ' + (CENTANG.has(p.id) ? 'Dibuka' : 'Tertutup') + '</label>' + (awal.has(p.id) ? '<small>' + selesaiItem(p.id) + (siswa.length ? '/' + siswa.length : '') + ' siswa sudah mengerjakan</small>' : '') : '<span class="rl-segera">segera hadir</span>') + '</div>').join('') + '</div>' +
      '<div class="rl-simpan' + (ubah ? ' ubah' : '') + '"><span>' + (ubah ? '✏️ <b>' + ubah + ' perubahan</b> belum disimpan.' : '✔ Semua centang sudah tersimpan.') + '</span><span id="rl-pesan" class="catatan"></span><button class="btn hijau" type="button" id="rl-simpan"' + (ubah ? '' : ' disabled') + '>💾 Simpan</button></div>';
    el.querySelector('.tab-mini').onclick = e => { const b = e.target.closest('button'); if (!b) return; MRILIS = b.dataset.m; gambarRilis(); };
    el.querySelectorAll('input[data-id]').forEach(c => c.onchange = () => { if (c.checked) CENTANG.add(c.dataset.id); else CENTANG.delete(c.dataset.id); gambarRilis(); });
    el.querySelectorAll('input[data-grup]').forEach(c => c.onchange = () => { c.dataset.grup.split(',').forEach(id => { if (c.checked) CENTANG.add(id); else CENTANG.delete(id); }); gambarRilis(); });
    el.querySelectorAll('[data-semua]').forEach(b => b.onclick = () => { d.indikator.forEach(x => { const id = J.id(MRILIS, x.no, +b.dataset.semua); if (ADA.has(id)) CENTANG.add(id); }); gambarRilis(); });
    el.querySelector('[data-kosong]').onclick = () => { [...CENTANG].forEach(id => { const it = J.info(id); if (it && it.m === MRILIS && it.jenis === 'jb') CENTANG.delete(id); }); gambarRilis(); };
    $('rl-simpan').onclick = simpanRilis;
  }

  async function simpanRilis() {
    const b = $('rl-simpan'), lama = new Set(DATA.rilis || []);
    b.disabled = true; $('rl-pesan').textContent = 'Menyimpan…';
    const r = await TKA.api({ aksi: 'simpanRilis', kode: KELAS.kode, pin: KELAS.pin, dibuka: [...CENTANG] });
    if (!r.ok) { b.disabled = false; $('rl-pesan').textContent = r.pesan || 'Gagal menyimpan. Coba lagi.'; return; }
    DATA.rilis = r.rilis; CENTANG = new Set(r.rilis);
    const baru = r.rilis.filter(id => !lama.has(id));
    gambarRilis(); gambarBaru(); gambarAnalisis();
    if (typeof gambarLangkah === 'function') gambarLangkah();
    const t = new URL('belajar.html?kelas=' + KELAS.kode, location.href).href;
    const pesan = 'Anak-anak ' + KELAS.kelas + ', ada latihan baru di *Peta Belajar* Kelas Intensif TKA 🎉\n\n' + baru.slice(0, 12).map(id => '• ' + namaItem(id)).join('\n') + (baru.length > 12 ? '\n• … dan ' + (baru.length - 12) + ' latihan lain' : '') +
      '\n\n👉 ' + t + '\n\nPilih namamu, lalu kerjakan dari yang paling atas. V2 dan V3 hanya sekali kesempatan, jadi kerjakan dengan teliti dan baca pembahasannya setelah selesai. Semangat! 💪\n— ' + KELAS.guru;
    dialogInfo('✅ Tersimpan', 'Latihan yang dicentang <b>langsung terlihat</b> di Peta Belajar siswa' + (baru.length ? ' (' + baru.length + ' latihan baru dibuka)' : '') + '.' + (baru.length ? '<br><br><b>Langkah berikutnya:</b> kabari siswa lewat WhatsApp.' : ''),
      baru.length ? [['📲 Kabari siswa lewat WhatsApp', 'https://wa.me/?text=' + encodeURIComponent(pesan)]] : []);
  }

  function dialogInfo(judul, isi, tautan) {
    let d = $('dlg-jg');
    if (!d) { d = document.createElement('dialog'); d.id = 'dlg-jg'; d.className = 'dlg-jg'; document.body.appendChild(d); }
    d.innerHTML = '<h3 style="margin:0 0 6px">' + judul + '</h3><p style="margin:0 0 14px;font-size:14.5px">' + isi + '</p><div style="display:flex;gap:8px;flex-wrap:wrap">' +
      tautan.map(([t, h]) => '<a class="btn wa" target="_blank" rel="noopener" href="' + h + '">' + t + '</a>').join('') + '<button class="btn ghost" type="button">Tutup</button></div>';
    d.querySelector('button').onclick = () => d.close();
    d.showModal();
  }

  /* ---------- analisis ---------- */
  function gambarAnalisis() {
    const el = $('k-analisis'); if (!el) return;
    const km = petaKemajuan(), siswa = namaSiswa(), rilis = new Set(DATA.rilis || []);
    const m = MANALISIS;
    // kolom: item jb mapel ini yang dibuka atau sudah pernah dikerjakan
    const kol = new Set();
    rilis.forEach(id => { const it = J.info(id); if (it && it.jenis === 'jb' && it.m === m) kol.add(id); });
    (DATA.kemajuan || []).forEach(x => Object.keys(x.data).forEach(id => { const it = J.info(id); if (it && it.jenis === 'jb' && it.m === m) kol.add(id); }));
    const kolom = [...kol].sort((a, b) => { const x = J.info(a), y = J.info(b); return x.no - y.no || x.versi - y.versi; });
    const ind = []; kolom.forEach(id => { const it = J.info(id); let g = ind.find(g => g.no === it.no); if (!g) ind.push(g = { no: it.no, ids: [] }); g.ids.push(id); });
    const kepala = '<div class="kepala-kelas"><div><h2 style="margin:0">📊 Analisis Jalur Belajar</h2><p class="sub" style="margin:2px 0 0">Nilai setiap siswa per indikator dan versi. V2, V3, dan tes akhir memakai <b>nilai murni</b> (sekali kesempatan). V1 menampilkan nilai terbaik.</p></div></div>' +
      '<div class="tab-mini">' + Object.keys(JALUR_TKA.mapel).map(x => '<button type="button" data-m="' + x + '" class="' + (x === m ? 'aktif' : '') + '">' + esc(JALUR_TKA.mapel[x].nama) + '</button>').join('') + '</div>';
    let isi = '';
    if (!kolom.length) {
      isi = '<div class="kosong"><b>Belum ada latihan ' + esc(JALUR_TKA.mapel[m].nama) + ' yang dibuka</b>Rilis latihan di tab 📋 Atur Rilis. Setelah siswa mengerjakan, analisisnya muncul di sini.<br><br><button class="btn" type="button" data-ke="rilis">📋 Buka Atur Rilis</button></div>';
    } else {
      // rata-rata per kolom & status indikator
      const rata = {}, jumlah = {};
      kolom.forEach(id => {
        const n = siswa.map(s => keadaan(id, (km.get(kn(s)) || { data: {} }).data[id])).filter(x => x.k === 'nilai').map(x => x.n);
        jumlah[id] = n.length; rata[id] = n.length ? n.reduce((a, b) => a + b, 0) / n.length : null;
      });
      const statusInd = ind.map(g => { const ada = g.ids.filter(id => rata[id] !== null); if (!ada.length) return { g, r: null }; const id = ada[ada.length - 1]; return { g, r: rata[id], id }; });
      const merah = statusInd.filter(x => x.r !== null && x.r < 60), kuning = statusInd.filter(x => x.r !== null && x.r >= 60 && x.r < 80), hijau = statusInd.filter(x => x.r !== null && x.r >= 80);
      const belumSama = siswa.filter(s => { const x = km.get(kn(s)); return !x || !kolom.some(id => x.data[id] && x.data[id].j); });
      const perhatian = siswa.map(s => { const x = km.get(kn(s)); if (!x) return null; const n = kolom.map(id => keadaan(id, x.data[id])).filter(k => k.k === 'nilai').map(k => k.n); return n.length ? { s, r: n.reduce((a, b) => a + b, 0) / n.length } : null; }).filter(x => x && x.r < 60);
      const habis = []; siswa.forEach(s => { const x = km.get(kn(s)); if (x) kolom.forEach(id => { if (keadaan(id, x.data[id]).k === 'habis') habis.push([s, id]); }); });
      isi += '<div class="ringkas-an">' +
        '<div class="ra merah"><b>🔴 ' + merah.length + ' indikator perlu pendalaman</b>' + (merah.length ? '<ul>' + merah.map(x => '<li>' + x.g.no + '. ' + esc(judulInd(m, x.g.no)) + ' <small>(rata-rata ' + angka(Math.round(x.r)) + ')</small></li>').join('') + '</ul><small>Ajarkan ulang, lalu minta siswa mengulang V1.</small>' : '<small>Tidak ada. 👍</small>') + '</div>' +
        '<div class="ra kuning"><b>⚠️ ' + kuning.length + ' indikator hampir dikuasai</b>' + (kuning.length ? '<ul>' + kuning.map(x => '<li>' + x.g.no + '. ' + esc(judulInd(m, x.g.no)) + ' <small>(' + angka(Math.round(x.r)) + ')</small></li>').join('') + '</ul>' : '<small>–</small>') + '</div>' +
        '<div class="ra hijau"><b>✅ ' + hijau.length + ' indikator sudah dikuasai</b><small>' + (hijau.length ? 'Siap lanjut ke versi berikutnya.' : 'Belum ada.') + '</small></div></div>' +
        (belumSama.length ? '<p class="catatan" style="margin:8px 0 0">⏳ <b>Belum mengerjakan sama sekali:</b> ' + belumSama.map(esc).join(', ') + '</p>' : '') +
        (perhatian.length ? '<p class="catatan" style="margin:4px 0 0">🧡 <b>Perlu perhatian khusus (rata-rata &lt; 60):</b> ' + perhatian.map(x => esc(x.s) + ' (' + angka(Math.round(x.r)) + ')').join(', ') + '</p>' : '') +
        (habis.length ? '<p class="catatan" style="margin:4px 0 0">⚠️ <b>Jawaban tidak terkumpul</b> (waktu habis, mungkin internet putus): ' + habis.map(([s, id]) => esc(s) + ' – ' + J.info(id).no + '·' + V[J.info(id).versi].kode).join(', ') + '. Ketuk selnya untuk <b>Izinkan ulang</b>.</p>' : '');
      isi += '<div class="hm-legenda"><span><i class="hm-b"></i>≥ 80 dikuasai</span><span><i class="hm-c"></i>60–79 hampir</span><span><i class="hm-k"></i>&lt; 60 perlu bimbingan</span><span><i class="hm-0"></i>belum</span><span>⏳ sedang · ⚠️ tidak terkumpul · 🔁 diizinkan ulang · <sup>3×</sup> jumlah percobaan V1</span></div>' +
        '<div class="hm-wadah"><table class="hm"><thead><tr><th class="hm-nama" rowspan="2">Siswa</th>' + ind.map(g => '<th colspan="' + g.ids.length + '" class="hm-ind" title="' + esc(judulInd(m, g.no)) + '">' + g.no + '<small>' + esc(judulInd(m, g.no).slice(0, 14)) + (judulInd(m, g.no).length > 14 ? '…' : '') + '</small></th>').join('') + '<th rowspan="2">Rata-<br>rata</th></tr>' +
        '<tr>' + kolom.map(id => '<th class="hm-v v' + J.info(id).versi + '">' + V[J.info(id).versi].kode + (rilis.has(id) ? '' : '<small title="Sudah ditutup">🔒</small>') + '</th>').join('') + '</tr></thead><tbody>' +
        siswa.map(s => {
          const x = km.get(kn(s)) || { data: {} }, nilai = [];
          const sel = kolom.map(id => {
            const k = keadaan(id, x.data[id]), it = J.info(id);
            if (k.k === 'nilai') { nilai.push(k.n); return '<td class="' + warna(k.n) + '" data-s="' + esc(s) + '" data-id="' + id + '" title="' + esc(s + ' · ' + namaItem(id) + ' · ' + (it.sekali ? 'nilai ' + angka(k.d.t) : 'pertama ' + angka(k.d.p) + ' → terbaik ' + angka(k.d.b) + ' (' + k.d.j + '×)')) + '">' + angka(Math.round(k.n)) + (!it.sekali && k.d.j > 1 ? '<sup>' + k.d.j + '×</sup>' : '') + (k.d.iz ? '<sup>🔁</sup>' : '') + '</td>'; }
            if (k.k === 'habis') return '<td class="hm-x" data-s="' + esc(s) + '" data-id="' + id + '" title="Waktu habis, jawaban tidak terkumpul">⚠️</td>';
            if (k.k === 'izin') return '<td class="hm-0" data-s="' + esc(s) + '" data-id="' + id + '" title="Sudah diizinkan ulang">🔁</td>';
            if (k.k === 'jalan') return '<td class="hm-0" data-s="' + esc(s) + '" data-id="' + id + '" title="Sedang mengerjakan">⏳</td>';
            return '<td class="hm-0"' + (rilis.has(id) ? ' title="Belum mengerjakan"' : '') + '></td>';
          }).join('');
          const r = nilai.length ? nilai.reduce((a, b) => a + b, 0) / nilai.length : null;
          return '<tr><td class="hm-nama">' + esc(s) + '</td>' + sel + '<td class="hm-rata">' + (r === null ? '–' : '<b class="' + warna(r) + '">' + angka(Math.round(r)) + '</b>') + '</td></tr>';
        }).join('') +
        '</tbody><tfoot><tr><td class="hm-nama">Rata-rata kelas</td>' + kolom.map(id => '<td>' + (rata[id] === null ? '–' : '<b class="' + warna(rata[id]) + '">' + angka(Math.round(rata[id])) + '</b>') + '<small>' + jumlah[id] + ' siswa</small></td>').join('') + '<td></td></tr>' +
        '<tr><td class="hm-nama">Status</td>' + ind.map(g => { const st = statusInd.find(x => x.g === g); return '<td colspan="' + g.ids.length + '" class="hm-st">' + (st.r === null ? '–' : st.r >= 80 ? '✅' : st.r >= 60 ? '⚠️' : '🔴') + '</td>'; }).join('') + '<td></td></tr></tfoot></table></div>' +
        '<div class="hm-detail" id="hm-detail" hidden></div>';
    }
    el.innerHTML = kepala + isi + gambarPerkembangan();
    el.querySelector('.tab-mini').onclick = e => { const b = e.target.closest('button'); if (!b) return; MANALISIS = b.dataset.m; gambarAnalisis(); };
    const ke = el.querySelector('[data-ke]'); if (ke) ke.onclick = () => bukaTab('rilis', true);
    el.querySelectorAll('td[data-id]').forEach(td => td.onclick = () => detail(td.dataset.s, td.dataset.id));
    el.querySelectorAll('td[data-kls]').forEach(td => td.onclick = () => detail(td.dataset.s, td.dataset.kls));
  }

  function detail(nama, id) {
    const box = $('hm-detail') || $('pk-detail-kls'); if (!box) return;
    const x = petaKemajuan().get(kn(nama)), d = x && x.data[id], k = keadaan(id, d), it = J.info(id);
    let isi = '<b>' + esc(nama) + '</b> · ' + esc(namaItem(id)) + '<br>';
    if (k.k === 'nilai') isi += it.sekali ? 'Nilai: <b>' + angka(d.t) + '</b>' + (d.iz ? ' (sudah diizinkan ulang ' + d.iz + '×, nilai pertama ' + angka(d.p) + ')' : '') : 'Nilai pertama <b>' + angka(d.p) + '</b> → terbaik <b>' + angka(d.b) + '</b>, terakhir ' + angka(d.t) + ' · ' + d.j + '× mencoba';
    else if (k.k === 'habis') isi += '⚠️ Waktu mengerjakan habis dan jawaban tidak terkumpul (mungkin internet putus atau halaman ditutup).';
    else if (k.k === 'izin') isi += '🔁 Sudah diizinkan ulang. Menunggu siswa mengerjakan.';
    else if (k.k === 'jalan') isi += '⏳ Sedang mengerjakan.';
    const bisaIzin = it.sekali && d && (k.k === 'nilai' || k.k === 'habis');
    box.innerHTML = isi + (bisaIzin ? '<div style="margin-top:8px;display:flex;gap:8px;flex-wrap:wrap;align-items:center"><button class="btn kecil" type="button" id="hm-izin">🔁 Izinkan ulang</button><span class="catatan">Beri satu kesempatan lagi (mis. HP mati atau internet putus). Nilai baru akan menggantikan nilai ini.</span></div>' : '');
    box.hidden = false;
    const b = $('hm-izin');
    if (b) b.onclick = async () => {
      if (!confirm('Izinkan ' + nama + ' mengerjakan ' + namaItem(id) + ' sekali lagi?')) return;
      b.disabled = true;
      const r = await TKA.api({ aksi: 'izinUlang', kode: KELAS.kode, pin: KELAS.pin, item: id, nama });
      if (!r.ok) { b.disabled = false; alert(r.pesan || 'Gagal.'); return; }
      DATA.kemajuan = r.kemajuan; gambarAnalisis();
      const bx = $('hm-detail'); if (bx) { bx.hidden = false; bx.innerHTML = '✅ <b>' + esc(nama) + '</b> sekarang bisa mengerjakan <b>' + esc(namaItem(id)) + '</b> lagi dari Peta Belajarnya.'; }
    };
  }

  /* ---------- nilai awal → tes akhir ---------- */
  function gambarPerkembangan() {
    const km = petaKemajuan(), siswa = namaSiswa(), baris = (DATA && DATA.baris) || [];
    const awal = (s, m) => { const b = baris.filter(b => kn(b.nama) === kn(s) && new RegExp('^sd-' + m + '-[12]$').test(b.paket)).sort((a, b) => (+new Date(a.waktu) || a.waktu) - (+new Date(b.waktu) || b.waktu))[0]; return b ? b.nilai : null; };
    const akhir = (s, m) => { const x = km.get(kn(s)); if (!x) return null; const c = ['kls-' + m + '-1', 'kls-' + m + '-2'].map(id => x.data[id]).filter(d => d && d.j).sort((a, b) => (b.w || 0) - (a.w || 0)); return c.length ? c[0].t : null; };
    const baris2 = siswa.map(s => ({ s, a: { mat: awal(s, 'mat'), bi: awal(s, 'bi') }, z: { mat: akhir(s, 'mat'), bi: akhir(s, 'bi') } })).filter(x => x.a.mat !== null || x.a.bi !== null || x.z.mat !== null || x.z.bi !== null);
    const sel = (a, z) => {
      if (a === null && z === null) return '<td>–</td><td>–</td><td></td>';
      const d = a !== null && z !== null ? z - a : null;
      return '<td>' + (a === null ? '–' : angka(a)) + '</td><td>' + (z === null ? '<span class="catatan">belum</span>' : '<b>' + angka(z) + '</b>') + '</td><td>' + (d === null ? '' : '<b class="' + (d >= 0 ? 'naik' : 'turun') + '">' + (d >= 0 ? '▲ +' : '▼ ') + angka(Math.round(d * 10) / 10) + '</b>') + '</td>';
    };
    return '<h3 style="margin:22px 0 4px">📈 Nilai Awal → Tes Akhir</h3><p class="sub" style="margin:0 0 8px"><b>Nilai Awal</b> = pengerjaan pertama Paket 1/2 sebelum pembaruan. <b>Tes Akhir</b> = Paket edisi kelas (sekali kesempatan, soal baru). Selisihnya menunjukkan perkembangan setelah berlatih.</p>' +
      (baris2.length ? '<div style="overflow-x:auto"><table class="pk-tabel"><thead><tr><th rowspan="2">Siswa</th><th colspan="3">Matematika</th><th colspan="3">Bahasa Indonesia</th></tr><tr><th>Awal</th><th>Akhir</th><th>Selisih</th><th>Awal</th><th>Akhir</th><th>Selisih</th></tr></thead><tbody>' +
        baris2.map(x => '<tr><td><b>' + esc(x.s) + '</b></td>' + sel(x.a.mat, x.z.mat) + sel(x.a.bi, x.z.bi) + '</tr>').join('') + '</tbody></table></div>'
        : '<div class="kosong" style="padding:14px"><b>Belum ada data</b>Nilai Awal muncul dari pengerjaan Paket 1/2 sebelum pembaruan. Tes Akhir muncul setelah Anda merilis dan siswa mengerjakan Paket edisi kelas.</div>');
  }

  /** Dipanggil setiap data dasbor dimuat ulang. */
  function gambarSemua() {
    if (DATA && !DATA._diterima) DATA._diterima = Date.now();
    CENTANG = new Set(DATA.rilis || []);
    pasangTab(); gambarBaru(); gambarRilis(); gambarAnalisis();
    document.querySelectorAll('#tab-dasbor button').forEach(b => b.classList.toggle('aktif', b.dataset.tab === TAB));
    document.querySelectorAll('[data-panel]').forEach(p => { p.hidden = p.dataset.panel !== TAB; });
    const jml = (DATA.rilis || []).length, tb = document.querySelector('#tab-dasbor [data-tab="rilis"] small');
    if (tb) tb.textContent = jml ? ' (' + jml + ')' : '';
  }

  return { gambarSemua, bukaTab, paketTab, paketKelas, namaItem, tab: () => TAB, paketPanel: t => { const p = document.querySelector('[data-panel="' + t + '"]'); if (p && $('d-paket').parentElement !== p) { p.appendChild($('d-paket')); p.appendChild($('d-isi')); } } };
})();
