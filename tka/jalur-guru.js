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
  /* ---------- acuan rata-rata nasional TKA ---------- */
  const NAS = typeof NASIONAL_TKA === 'undefined' ? null : NASIONAL_TKA;
  const nas = (m, no) => NAS && NAS[m] ? NAS[m][no] : undefined;
  const pctNas = v => String(Math.round(v * 10) / 10).replace('.', ',') + '%';
  /** 6 indikator dengan rata-rata nasional terendah pada mapel itu. */
  const SULIT = {}; if (NAS) ['mat', 'bi'].forEach(m => { SULIT[m] = new Set(Object.entries(NAS[m] || {}).sort((a, b) => a[1] - b[1]).slice(0, 6).map(x => +x[0])); });
  const sulit = (m, no) => !!(SULIT[m] && SULIT[m].has(no));
  const lencanaSulit = (m, no) => sulit(m, no) ? ' <span class="rl-sulit" title="Termasuk 6 indikator dengan rata-rata nasional TKA terendah">🔥 Sulit nasional · ' + pctNas(nas(m, no)) + '</span>' : '';

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

  /* ---------- pengingat siswa (kartu Ringkasan) ---------- */
  function selesai(x, id) { return !!(x && x.data[id] && x.data[id].j > 0); }
  function gambarIngat() {
    const el = $('k-ingat'); if (!el) return;
    const rilis = (DATA.rilis || []).filter(id => J.info(id)), rw = DATA.rilisWaktu || {}, km = petaKemajuan(), siswa = namaSiswa();
    if (!rilis.length || !siswa.length) { el.hidden = true; return; }
    const now = Date.now(), MINGGU = 7 * 864e5;
    const baru = rilis.filter(id => rw[id] && rw[id] > now - MINGGU), fokus = baru.length ? baru : rilis;
    const belum = siswa.filter(s => { const x = km.get(kn(s)); return fokus.some(id => !selesai(x, id)); });
    const terakhir = s => { const x = km.get(kn(s)); return x ? Math.max(0, ...Object.values(x.data).map(d => d.w || d.m || 0)) : 0; };
    const diam = siswa.filter(s => terakhir(s) < now - MINGGU);
    const daftar = fokus.slice().sort((a, b) => (rw[b] || 0) - (rw[a] || 0));
    el.innerHTML = '<div class="kepala-kelas"><div><h2 style="margin:0">📣 Pengingat siswa</h2><p class="sub" style="margin:2px 0 0">' +
      (baru.length ? '<b>' + baru.length + ' latihan dibuka minggu ini.</b> ' : 'Belum ada latihan baru minggu ini. ') + 'Siswa melihat tanda 🆕 dan target 3 latihan per minggu di Peta Belajar.</p></div></div>' +
      '<div class="ingat-angka"><div><b>' + (siswa.length - belum.length) + '/' + siswa.length + '</b><small>siswa menyelesaikan ' + (baru.length ? 'semua latihan baru' : 'semua latihan yang dibuka') + '</small></div>' +
      '<div><b>' + belum.length + '</b><small>siswa belum selesai</small></div><div><b>' + diam.length + '</b><small>siswa tidak berlatih 7 hari terakhir</small></div></div>' +
      '<details style="margin:8px 0"><summary style="cursor:pointer;font-weight:700;font-size:14px">Lihat rincian</summary><ul style="margin:6px 0;padding-left:20px;font-size:14px">' +
      daftar.slice(0, 10).map(id => '<li>' + esc(namaItem(id)) + ' — ' + siswa.filter(s => selesai(km.get(kn(s)), id)).length + '/' + siswa.length + ' selesai</li>').join('') + '</ul>' +
      (belum.length ? '<p style="margin:4px 0;font-size:14px"><b>Belum selesai:</b> ' + belum.map(esc).join(', ') + '</p>' : '') +
      (diam.length ? '<p style="margin:4px 0;font-size:14px"><b>Tidak berlatih 7 hari:</b> ' + diam.map(esc).join(', ') + '</p>' : '') + '</details>' +
      '<label style="display:flex;gap:6px;align-items:center;font-size:13.5px;margin:4px 0 10px"><input type="checkbox" id="ig-nama"> Sebutkan nama siswa yang belum selesai <span style="color:var(--muted)">(sebaiknya tidak untuk grup)</span></label>' +
      '<div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn wa" type="button" id="ig-wa">💬 Kirim pengingat ke grup WA kelas</button></div>';
    el.hidden = false;
    $('ig-wa').onclick = () => {
      const pakaiNama = $('ig-nama').checked;
      const pesan = 'Assalamu’alaikum/Salam sejahtera, anak-anak ' + KELAS.kelas + ' 🙏\n\n📚 *' + (baru.length ? 'Latihan baru minggu ini' : 'Latihan yang sudah dibuka') + '* di Peta Belajar:\n' +
        daftar.slice(0, 8).map(id => '• ' + namaItem(id)).join('\n') + (daftar.length > 8 ? '\n• dan ' + (daftar.length - 8) + ' latihan lainnya' : '') +
        '\n\n✅ ' + (siswa.length - belum.length) + ' dari ' + siswa.length + ' siswa sudah menyelesaikan semuanya. ' + (belum.length ? 'Ayo yang belum, kerjakan sedikit demi sedikit!' : 'Hebat, semuanya sudah selesai! 🎉') +
        (pakaiNama && belum.length ? '\nBelum selesai: ' + belum.join(', ') : '') +
        '\n🎯 Target minggu ini: 3 latihan.\n\n👉 ' + tautanKelas(KELAS) + '\n\n— ' + KELAS.guru;
      window.open('https://wa.me/?text=' + encodeURIComponent(pesan), '_blank', 'noopener');
    };
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
      '<div class="panduan-kecil"><b>Aturannya:</b><ul><li><b>🌱 V1 Pemahaman</b>: ada petunjuk, boleh diulang. <b>🧩 V2 Model TKA</b>, <b>🎯 V3 Prediksi TKA</b>, dan <b>🚀 V4 Prediksi Lanjutan</b> (10 soal, 30 menit, Kelas Premium): sekali kesempatan.</li><li>Begitu dicentang dan disimpan, latihan langsung terlihat oleh <b>semua siswa</b> di kelas ini.</li><li>Menghapus centang menutup latihan bagi siswa yang belum mengerjakan. Nilai yang sudah masuk tetap tersimpan.</li><li>Tidak perlu membuka semua sekaligus. Mulailah dengan <b>2–4 indikator</b> yang sedang dipelajari.</li></ul></div>' +
      '<details class="strategi" id="rl-strategi"><summary>💡 Saran cara mengajar dengan V1, V2, dan V3</summary>' +
      '<div class="str-isi"><div><b>1. Bertahap per minggu</b><ol><li>Senin: jelaskan materi, lalu rilis <b>V1</b>. Siswa mengerjakan di rumah dan boleh mengulang.</li><li>Rabu: cek tab <b>📊 Analisis</b>. Bahas soal V1 yang banyak salah.</li><li>Kamis: rilis <b>V2</b> sebagai tugas (sekali kesempatan).</li><li>Akhir pekan: rilis <b>V3</b> bagi kelas yang V2-nya sudah baik.</li></ol></div>' +
      '<div><b>2. Belajar bersama di kelas</b><ol><li>Tampilkan V1 di layar atau proyektor, kerjakan bersama sambil membuka <b>💡 petunjuk</b>.</li><li>Minta siswa mengerjakan V2 sendiri di kelas (15 menit), seperti kuis.</li><li>Bahas pembahasannya bersama setelah semua selesai.</li></ol></div>' +
      '<div><b>3. Remedial dari analisis</b><ol><li>Lihat indikator bertanda 🔴 di tab Analisis.</li><li>Ajarkan ulang dengan contoh lain, lalu minta siswa mengulang <b>V1</b> sampai nilainya minimal 80.</li><li>Untuk siswa yang terkendala teknis, gunakan <b>🔁 Izinkan ulang</b>.</li></ol></div>' +
      '<div><b>4. Menuju tes akhir</b><ol><li>Setelah satu elemen (mis. Bilangan) selesai sampai V2/V3, lanjutkan elemen berikutnya.</li><li>Setelah semua indikator dilatih, rilis <b>Tes akhir Paket 1</b>.</li><li>Bandingkan <b>Nilai Awal → Tes Akhir</b> di tab Analisis.</li></ol></div></div></details>' +
      '<div class="tab-mini">' + Object.keys(JALUR_TKA.mapel).map(m => '<button type="button" data-m="' + m + '" class="' + (m === MRILIS ? 'aktif' : '') + '">' + esc(JALUR_TKA.mapel[m].nama) + ' <small>(' + jumlahDibuka(m) + ' dibuka)</small></button>').join('') + '</div>' +
      '<div class="rl-alat"><button class="btn ghost kecil" type="button" data-semua="1">Centang semua V1</button><button class="btn ghost kecil" type="button" data-semua="2">Centang semua V2</button><button class="btn ghost kecil" type="button" data-semua="3">Centang semua V3</button>' + (premium ? '<button class="btn ghost kecil" type="button" data-semua="4">Centang semua V4</button>' : '') + '<button class="btn ghost kecil" type="button" data-kosong>Kosongkan ' + esc(d.nama) + '</button></div>' +
      '<div style="overflow-x:auto"><table class="rl-tabel"><thead><tr><th>Indikator</th>' + [1, 2, 3, 4].map(v => '<th class="rl-v v' + v + '">' + V[v].ikon + ' ' + V[v].kode + '<small>' + V[v].nama + (v === 4 ? ' ⭐' : '') + '</small></th>').join('') + '<th>Sudah mengerjakan</th></tr></thead><tbody>' +
      grup.map(g => '<tr class="rl-grup"><td>' + esc(g.el) + '</td>' + [1, 2, 3, 4].map(v => '<td class="rl-c">' + grupCek(g.isi, v) + '</td>').join('') + '<td></td></tr>' +
        g.isi.map(x => {
          const dibuka = [1, 2, 3, 4].map(v => J.id(MRILIS, x.no, v)).filter(id => awal.has(id));
          return '<tr><td><b>' + x.no + '. ' + esc(x.judul) + '</b>' + lencanaSulit(MRILIS, x.no) + '<small>' + esc(x.indikator) + '</small></td>' + [1, 2, 3, 4].map(v => '<td class="rl-c">' + kotak(J.id(MRILIS, x.no, v)) + '</td>').join('') +
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



  /* ---------- rapor orang tua: kemajuan Jalur Belajar seorang siswa ---------- */
  function raporJalur(nama) {
    const d = ((petaKemajuan().get(kn(nama)) || {}).data) || {}, rilis = DATA.rilis || [], hasil = [];
    for (const m of Object.keys(JALUR_TKA.mapel)) {
      const baris = [];
      JALUR_TKA.mapel[m].indikator.forEach(x => {
        const sel = {}; let ada = false;
        [1, 2, 3, 4].forEach(v => { const id = J.id(m, x.no, v), k = keadaan(id, d[id]); if (k.k === 'nilai') { sel[v] = Math.round(k.n); ada = true; } });
        if (!ada) return;
        const vs = Object.keys(sel).map(Number), puncak = Math.max(...vs);
        baris.push({ no: x.no, judul: x.judul, sel, puncak, nilai: sel[puncak] });
      });
      const belum = rilis.filter(id => { const it = J.info(id); return it && it.m === m && it.jenis === 'jb' && keadaan(id, d[id]).k === 'belum'; })
        .sort((a, b) => J.info(a).no - J.info(b).no || J.info(a).versi - J.info(b).versi);
      const tes = JALUR_TKA.paket.filter(p => p.ada && p.m === m).map(p => ({ p, k: keadaan(p.id, d[p.id]) })).filter(x => x.k.k === 'nilai').map(x => ({ nama: 'Tes akhir Paket ' + J.info(x.p.id).paket, nilai: Math.round(x.k.n) }));
      hasil.push({ m, mapel: JALUR_TKA.mapel[m].nama, baris, belum: belum.map(id => ({ id, nama: namaItem(id) })), tes,
        tuntas: baris.filter(b => b.nilai >= 80).length, perlu: baris.filter(b => b.nilai < 60) });
    }
    return hasil;
  }
  /* ---------- pembaruan soal: catatan cetak & pemberitahuan ---------- */
  const PBR = typeof PEMBARUAN_TKA === 'undefined' ? [] : PEMBARUAN_TKA;
  function simpanan(k, v) { try { if (v === undefined) return JSON.parse(localStorage.getItem(k) || 'null'); localStorage.setItem(k, JSON.stringify(v)); } catch (e) { return null; } return v; }
  function logCetak() { return simpanan('tka-cetak-' + KELAS.kode) || {}; }
  function catatCetak(ids, kunci) { const l = logCetak(), t = Date.now(); ids.forEach(id => { l[id] = l[id] || {}; l[id][kunci ? 'k' : 's'] = t; }); simpanan('tka-cetak-' + KELAS.kode, l); }
  /** Waktu dasbor ini mulai mencatat cetakan. Pembaruan sebelum waktu ini: riwayat cetak guru tidak diketahui. */
  function mulaiCatat() { let m = simpanan('tka-cetak-mulai'); if (!m) m = simpanan('tka-cetak-mulai', Date.now()); return m || Date.now(); }
  function kelasLama(u) { const d = DATA && DATA.kelas && DATA.kelas.dibuat; return !d || d < u.waktu; }
  function kenaPbr(u, id, kunci) { return (u.soal || []).includes(id) || (kunci && (u.kunci || []).includes(id)); }
  /** Apakah cetakan dokumen ini perlu diulang? null, atau { u, pasti } untuk pembaruan terbaru yang mengenainya. */
  function perluUlang(id, kunci) {
    const l = logCetak()[id], t = l && (kunci ? l.k : l.s);
    for (const u of PBR) {
      if (!kenaPbr(u, id, kunci) || !kelasLama(u)) continue;
      if (t) return t < u.waktu ? { u, pasti: true } : null;
      return mulaiCatat() >= u.waktu && Date.now() - u.waktu < 60 * 864e5 ? { u, pasti: false } : null;
    }
    return null;
  }
  function tandaUlang(ids, kunci) {
    const st = ids.map(id => perluUlang(id, kunci)).filter(Boolean);
    if (!st.length) return '';
    const pasti = st.some(x => x.pasti);
    return ' <span class="ct-baru' + (pasti ? ' pasti' : '') + '" title="Diperbarui ' + st[0].u.tgl + (pasti ? '. Anda pernah mencetak versi lama: cetak ulang.' : '. Bila pernah mencetak sebelum tanggal ini, cetak ulang.') + '">🔄</span>';
  }
  /** Daftar dokumen yang pernah dicetak sebelum pembaruan u. */
  function cetakanLama(u) {
    const l = logCetak(), hasil = [];
    Object.keys(l).forEach(id => { if (!J.info(id) && !/^kls-/.test(id)) return;
      if (l[id].s && l[id].s < u.waktu && kenaPbr(u, id, false)) hasil.push('📄 ' + judulCetak(id));
      if (l[id].k && l[id].k < u.waktu && kenaPbr(u, id, true)) hasil.push('🔑 ' + judulCetak(id)); });
    return hasil;
  }
  let PBR_DICEK = false;
  function cekPembaruan(semuaRiwayat) {
    if (!PBR.length || !KELAS) return;
    const kunciLihat = 'tka-pbr-lihat-' + KELAS.kode, lihat = simpanan(kunciLihat) || [];
    const tampil = [];
    PBR.forEach(u => {
      if (!semuaRiwayat && (lihat.includes(u.kode) || !kelasLama(u))) return;
      const lama = cetakanLama(u), target = !u.semua;
      if (!semuaRiwayat && target && !lama.length && mulaiCatat() < u.waktu) { lihat.push(u.kode); return; }   // tidak pernah mencetak dokumen yang berubah
      tampil.push({ u, lama });
    });
    simpanan(kunciLihat, lihat);
    if (!tampil.length) return;
    let d = $('dlg-pbr');
    if (!d) { d = document.createElement('dialog'); d.id = 'dlg-pbr'; d.className = 'dlg-jg dlg-pbr'; document.body.appendChild(d); }
    const adaCetak = tampil.some(x => !x.u.semua);
    d.innerHTML = '<h3 style="margin:0 0 4px">🔔 ' + (semuaRiwayat ? 'Catatan pembaruan soal' : 'Ada pembaruan soal') + '</h3>' +
      '<p class="sub" style="margin:0 0 10px">Siswa yang mengerjakan di HP otomatis mendapat versi terbaru. Nilai yang sudah masuk tetap tersimpan.</p>' +
      tampil.map(({ u, lama }) => '<div class="pbr-blok"><b>' + u.judul + '</b> <small>' + u.tgl + '</small><ul>' + u.poin.map(x => '<li>' + x + '</li>').join('') + '</ul>' +
        (u.semua ? '' : lama.length
          ? '<div class="pbr-cetak"><b>🖨️ Dokumen yang pernah Anda cetak dan sudah berubah:</b><ul>' + lama.slice(0, 8).map(x => '<li>' + esc(x) + '</li>').join('') + (lama.length > 8 ? '<li>dan ' + (lama.length - 8) + ' dokumen lainnya</li>' : '') + '</ul>Cetak ulang dokumen tersebut. Di tab Cetak Soal, dokumen ini ditandai 🔄.</div>'
          : '<div class="pbr-cetak"><b>🖨️ Pernah mencetak atau menyimpan PDF soal sebelum ' + u.tgl + '?</b> Cetak ulang <b>lembar soal dan kuncinya bersamaan</b> di tab Cetak Soal (ditandai 🔄). Jangan memasangkan lembar soal lama dengan kunci baru, karena urutan pernyataan dapat berbeda.</div>') + '</div>').join('') +
      '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px">' + (adaCetak ? '<button class="btn" type="button" data-pbr-cetak>🖨️ Buka Cetak Soal</button>' : '') +
      (tampil.some(x => x.u.semua) ? (premiumAktif() ? '<button class="btn ghost" type="button" data-pbr-rilis>📋 Buka Atur Rilis</button>' : '<button class="btn emas" type="button" data-pbr-premium>⭐ Lihat Kelas Premium</button>') : '') + '<button class="btn ghost" type="button" data-pbr-tutup>Mengerti</button></div>';
    const tandai = () => { const l2 = simpanan(kunciLihat) || []; tampil.forEach(x => { if (!l2.includes(x.u.kode)) l2.push(x.u.kode); }); simpanan(kunciLihat, l2); };
    d.onclose = tandai;
    d.querySelector('[data-pbr-tutup]').onclick = () => d.close();
    const bc = d.querySelector('[data-pbr-cetak]'); if (bc) bc.onclick = () => { d.close(); bukaTab('cetak', true); };
    const br = d.querySelector('[data-pbr-rilis]'); if (br) br.onclick = () => { d.close(); bukaTab('rilis', true); };
    const bp = d.querySelector('[data-pbr-premium]'); if (bp) bp.onclick = () => { d.close(); ajakPremium(); };
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
        '<div class="ra merah"><b>🔴 ' + merah.length + ' indikator perlu pendalaman</b>' + (merah.length ? '<ul>' + merah.map(x => '<li>' + x.g.no + '. ' + esc(judulInd(m, x.g.no)) + ' <small>(rata-rata ' + angka(Math.round(x.r)) + (nas(m, x.g.no) !== undefined ? ' · nasional ' + pctNas(nas(m, x.g.no)) : '') + ')</small>' + (sulit(m, x.g.no) ? ' 🔥' : '') + '</li>').join('') + '</ul><small>Ajarkan ulang, lalu minta siswa mengulang V1.</small>' : '<small>Tidak ada. 👍</small>') + '</div>' +
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
          return '<tr><td class="hm-nama" title="' + esc(s) + '"><button type="button" class="btn-mini hm-rapor cetak-sembunyi" data-rapor-jg="' + esc(s) + '" title="Rapor untuk orang tua">📄</button> ' + esc(s) + '</td>' + sel + '<td class="hm-rata">' + (r === null ? '–' : '<b class="' + warna(r) + '">' + angka(Math.round(r)) + '</b>') + '</td></tr>';
        }).join('') +
        '</tbody><tfoot><tr><td class="hm-nama">Rata-rata kelas</td>' + kolom.map(id => '<td>' + (rata[id] === null ? '–' : '<b class="' + warna(rata[id]) + '">' + angka(Math.round(rata[id])) + '</b>') + '<small>' + jumlah[id] + ' siswa</small></td>').join('') + '<td></td></tr>' +
        '<tr><td class="hm-nama">Status</td>' + ind.map(g => { const st = statusInd.find(x => x.g === g); return '<td colspan="' + g.ids.length + '" class="hm-st">' + (st.r === null ? '–' : st.r >= 80 ? '✅' : st.r >= 60 ? '⚠️' : '🔴') + '</td>'; }).join('') + '<td></td></tr>' +
        (NAS ? '<tr><td class="hm-nama" title="Persentase benar rata-rata nasional pada TKA, sebagai acuan tingkat kesulitan">Nasional TKA</td>' + ind.map(g => '<td colspan="' + g.ids.length + '" class="hm-nas">' + (nas(m, g.no) === undefined ? '–' : pctNas(nas(m, g.no)) + (sulit(m, g.no) ? '<small>🔥 sulit</small>' : '')) + '</td>').join('') + '<td></td></tr>' : '') + '</tfoot></table></div>' +
        (NAS ? '<p class="catatan" style="margin:6px 0 0"><b>Nasional TKA</b> = persentase jawaban benar rata-rata nasional pada TKA SD, sebagai acuan tingkat kesulitan indikator. Nilai latihan kelas dan angka nasional berasal dari soal yang berbeda, jadi bandingkan polanya, bukan angkanya persis. 🔥 = 6 indikator tersulit secara nasional.</p>' : '') +
        '<div class="hm-detail" id="hm-detail" hidden></div>';
    }
    el.innerHTML = kepala + isi + gambarImpor() + gambarPerkembangan();
    pasangImpor(el);
    el.querySelector('.tab-mini').onclick = e => { const b = e.target.closest('button'); if (!b) return; MANALISIS = b.dataset.m; gambarAnalisis(); };
    const ke = el.querySelector('[data-ke]'); if (ke) ke.onclick = () => bukaTab('rilis', true);
    el.querySelectorAll('td[data-id]').forEach(td => td.onclick = () => detail(td.dataset.s, td.dataset.id));
    el.querySelectorAll('[data-rapor-jg]').forEach(b => b.onclick = e => { e.stopPropagation(); if (typeof raporSiswa === 'function') raporSiswa(b.dataset.raporJg); });
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

  /* ---------- impor hasil TKA sekolah (tahun lalu) ---------- */
  const TKA_WEB = 'https://tka.kemendikdasmen.go.id/hasiltka';
  /** Rata-rata kelas per indikator dari latihan tahun ini (versi tertinggi yang sudah ada nilainya). */
  function rataIndikator(m) {
    const km = petaKemajuan(), siswa = namaSiswa(), hasil = {};
    for (let no = 1; no <= 30; no++) {
      for (let v = 4; v >= 1; v--) {
        const id = J.id(m, no, v), n = siswa.map(s => keadaan(id, (km.get(kn(s)) || { data: {} }).data[id])).filter(x => x.k === 'nilai').map(x => x.n);
        if (n.length) { hasil[no] = { r: n.reduce((a, b) => a + b, 0) / n.length, v, jml: n.length }; break; }
      }
    }
    return hasil;
  }
  /** Label tiap indikator: gabungan pola sekolah tahun lalu dan latihan kelas tahun ini. */
  function labelImpor(m) {
    const d = ImporTKA.ambil(KELAS.kode)[m]; if (!d) return null;
    const kini = rataIndikator(m);
    return JALUR_TKA.mapel[m].indikator.map(x => {
      const t = d.ind[x.no] || {}, k = kini[x.no], lemahLalu = t.s !== null && t.n !== null && t.s !== undefined && t.s < t.n;
      let lb;
      if (k) lb = k.r < 60 ? (lemahLalu ? 'prioritas' : 'pantau') : k.r < 80 ? (lemahLalu ? 'pantau' : 'aman') : 'aman';
      else lb = lemahLalu ? 'waspada' : 'aman';
      return { no: x.no, judul: x.judul, t, k, lemahLalu, lb };
    });
  }
  const LB = { prioritas: ['🔴', 'Prioritas', 'Lemah tahun lalu dan lemah juga di latihan tahun ini'], waspada: ['🟠', 'Waspada', 'Lemah tahun lalu, latihan tahun ini belum ada'], pantau: ['🟡', 'Pantau', 'Salah satu sumber menunjukkan kelemahan'], aman: ['🟢', 'Aman', 'Baik tahun lalu atau sudah dikuasai tahun ini'] };
  const persen = v => v === null || v === undefined ? '–' : angka(Math.round(v * 10) / 10) + '%';
  function panduanUnduh() {
    return '<details class="strategi"' + (Object.keys(ImporTKA.ambil(KELAS.kode)).length ? '' : ' open') + '><summary>📥 Cara mengunduh berkas hasil TKA sekolah</summary><div class="panduan-kecil" style="margin:8px 0 0"><ol>' +
      '<li>Buka <a href="' + TKA_WEB + '" target="_blank" rel="noopener"><b>tka.kemendikdasmen.go.id/hasiltka</b></a>.</li>' +
      '<li>Masuk dengan <b>akun proktor TKA</b> sekolah Anda. Akun ini biasanya dipegang proktor atau operator sekolah; mintalah bantuan bila bukan Anda yang memegangnya. Jangan bagikan kata sandi proktor kepada siapa pun.</li>' +
      '<li>Pilih jenjang <b>SD</b>, tingkat wilayah <b>Sekolah</b>, dan mata pelajaran <b>Matematika</b>.</li>' +
      '<li>Buka tampilan <b>Hierarki</b> (Elemen → Indikator), lalu unduh sebagai <b>Excel</b>. Nama berkasnya berawalan <code>Hierarki_Matematika_Sekolah_…</code>.</li>' +
      '<li>Ulangi untuk <b>Bahasa Indonesia</b>.</li>' +
      '<li>Kembali ke halaman ini, ketuk <b>📂 Pilih berkas</b>, lalu pilih kedua berkas sekaligus.</li></ol>' +
      '<p style="margin:6px 0 0">🔒 Berkas dibaca langsung di perangkat ini dan <b>tidak dikirim</b> ke server Kelas Intensif. Datanya tersimpan di perangkat ini saja, jadi ulangi impor bila Anda membuka dasbor dari HP/laptop lain.</p></div></details>';
  }
  function gambarImpor() {
    const premium = premiumAktif(), m = MANALISIS, nama = JALUR_TKA.mapel[m].nama;
    let h = '<h3 style="margin:22px 0 4px">🏫 Hasil TKA Sekolah Tahun Lalu</h3><p class="sub" style="margin:0 0 8px">Pola sekolah dari angkatan sebelumnya, dibandingkan dengan rata-rata nasional dan latihan kelas tahun ini. <b>Bukan penilaian siswa tahun ini</b>, melainkan petunjuk materi yang perlu mendapat porsi lebih.</p>';
    if (!premium) return h + '<div class="ajak-premium"><b>⭐ Fitur Kelas Premium.</b> Impor berkas hasil TKA sekolah dari web TKA, lalu dapatkan saran indikator yang perlu dirilis lebih dulu. <button type="button" class="btn emas kecil" id="im-premium">🎁 Coba gratis 14 hari / ⭐ Aktifkan Premium</button></div>';
    const data = ImporTKA.ambil(KELAS.kode), d = data[m];
    h += panduanUnduh() + '<div class="rl-alat" style="margin-top:8px"><label class="btn kecil" style="cursor:pointer">📂 Pilih berkas<input type="file" id="im-berkas" accept=".xlsx,.xls" multiple hidden></label>' +
      (d ? '<button type="button" class="btn ghost kecil" id="im-hapus">🗑️ Hapus data ' + esc(nama) + '</button>' : '') + '<span id="im-pesan" class="catatan"></span></div>';
    if (!d) return h + '<div class="kosong" style="padding:14px"><b>Belum ada data hasil TKA ' + esc(nama) + '</b>Ikuti langkah di atas untuk mengunduh berkas Hierarki dari web TKA, lalu impor di sini.' + (Object.keys(data).length ? '<br>Data mapel lain sudah ada; pilih tab mapelnya di atas.' : '') + '</div>';
    const L = labelImpor(m), hit = k => L.filter(x => x.lb === k).length;
    const rataS = L.filter(x => x.t.s !== null && x.t.s !== undefined), rs = rataS.reduce((a, x) => a + x.t.s, 0) / (rataS.length || 1), rn = rataS.reduce((a, x) => a + (x.t.n || 0), 0) / (rataS.length || 1);
    const urut = L.filter(x => x.lb === 'prioritas' || x.lb === 'waspada').sort((a, b) => (a.lb === 'prioritas' ? 0 : 1) - (b.lb === 'prioritas' ? 0 : 1) || (a.t.s - a.t.n) - (b.t.s - b.t.n));
    h += '<p class="catatan" style="margin:8px 0">Sumber: <b>' + esc(d.berkas) + '</b>' + (d.diunduh ? ' · diunduh ' + esc(d.diunduh) : '') + (d.peserta ? ' · ' + d.peserta + ' peserta' : '') + (d.kabupaten ? ' · ' + esc(d.kabupaten) : '') + '. Rata-rata sekolah <b>' + persen(rs) + '</b>, nasional <b>' + persen(rn) + '</b>.' + (d.peserta && d.peserta < 15 ? ' Jumlah peserta kecil, jadi angkanya cukup dijadikan petunjuk.' : '') + '</p>' +
      '<div class="ringkas-an">' + ['prioritas', 'waspada', 'pantau', 'aman'].map(k => '<div class="ra ' + (k === 'prioritas' ? 'merah' : k === 'aman' ? 'hijau' : 'kuning') + '"><b>' + LB[k][0] + ' ' + hit(k) + ' ' + LB[k][1] + '</b><small>' + LB[k][2] + '.</small></div>').join('') + '</div>' +
      (urut.length ? '<div class="rl-alat" style="margin-top:8px"><button type="button" class="btn hijau kecil" id="im-saran">📋 Centang V1 untuk ' + Math.min(4, urut.length) + ' indikator prioritas</button><span class="catatan">Indikator: ' + urut.slice(0, 4).map(x => x.no).join(', ') + '. Anda tetap bisa mengubah centangnya sebelum menyimpan.</span></div>' : '') +
      '<div style="overflow-x:auto;margin-top:8px"><table class="pk-tabel"><thead><tr><th>Indikator</th><th>TKA sekolah<br><small>tahun lalu</small></th><th>Nasional</th><th>Latihan kelas<br><small>tahun ini</small></th><th>Status</th></tr></thead><tbody>' +
      L.map(x => '<tr><td><b>' + x.no + '.</b> ' + esc(x.judul) + '</td><td' + (x.lemahLalu ? ' style="color:#b91c1c;font-weight:700"' : '') + '>' + persen(x.t.s) + '</td><td>' + persen(x.t.n) + '</td><td>' + (x.k ? '<b class="' + warna(x.k.r) + '">' + angka(Math.round(x.k.r)) + '</b> <small>' + V[x.k.v].kode + ', ' + x.k.jml + ' siswa</small>' : '<span class="catatan">belum</span>') + '</td><td title="' + esc(LB[x.lb][2]) + '">' + LB[x.lb][0] + ' ' + LB[x.lb][1] + '</td></tr>').join('') +
      '</tbody></table></div><p class="catatan" style="margin:6px 0 0">Angka merah = di bawah rata-rata nasional. Untuk beberapa indikator Matematika, angka nasional dari web TKA dihitung per kompetensi sehingga sama untuk indikator sekelompok.</p>';
    return h;
  }
  function pasangImpor(el) {
    const ap = el.querySelector('#im-premium'); if (ap) ap.onclick = ajakPremium;
    const f = el.querySelector('#im-berkas');
    if (f) f.onchange = async () => {
      const pesan = el.querySelector('#im-pesan'), data = ImporTKA.ambil(KELAS.kode), ok = [], galat = [];
      pesan.textContent = '⏳ Membaca berkas…';
      for (const file of f.files) { try { const d = await ImporTKA.baca(file); data[d.m] = d; ok.push(JALUR_TKA.mapel[d.m].nama); } catch (e) { galat.push(e.message); } }
      if (ok.length && !ImporTKA.simpan(KELAS.kode, data)) galat.push('Data tidak dapat disimpan di perangkat ini (mode penyamaran?).');
      if (ok.length) { const m1 = Object.keys(data).find(m => JALUR_TKA.mapel[m].nama === ok[0]); if (m1 && !data[MANALISIS]) MANALISIS = m1; gambarAnalisis(); }
      const p2 = $('im-pesan'); if (p2) p2.innerHTML = (ok.length ? '✅ Berhasil: ' + ok.map(esc).join(', ') + '. ' : '') + (galat.length ? '<span style="color:#b91c1c">⚠️ ' + galat.map(esc).join(' ') + '</span>' : '');
    };
    const hp = el.querySelector('#im-hapus');
    if (hp) hp.onclick = () => { if (!confirm('Hapus data hasil TKA ' + JALUR_TKA.mapel[MANALISIS].nama + ' dari perangkat ini?')) return; ImporTKA.hapus(KELAS.kode, MANALISIS); gambarAnalisis(); };
    const sr = el.querySelector('#im-saran');
    if (sr) sr.onclick = () => {
      const L = labelImpor(MANALISIS).filter(x => x.lb === 'prioritas' || x.lb === 'waspada').sort((a, b) => (a.lb === 'prioritas' ? 0 : 1) - (b.lb === 'prioritas' ? 0 : 1) || (a.t.s - a.t.n) - (b.t.s - b.t.n)).slice(0, 4);
      if (!CENTANG) CENTANG = new Set(DATA.rilis || []);
      L.forEach(x => { const id = J.id(MANALISIS, x.no, 1); if (ADA.has(id)) CENTANG.add(id); });
      MRILIS = MANALISIS; bukaTab('rilis', true); gambarRilis();
      const ps = $('rl-pesan'); if (ps) ps.textContent = '📋 V1 indikator ' + L.map(x => x.no).join(', ') + ' sudah dicentang dari saran hasil TKA. Ketuk 💾 Simpan untuk membukanya bagi siswa.';
    };
  }
  /** Bagian laporan kepala sekolah: indikator tersulit nasional dan capaian latihan kelas. */
  function laporanNasional() {
    if (!NAS || typeof KELAS === 'undefined' || !KELAS) return '';
    return '<h2>Indikator tersulit secara nasional</h2><p>Enam indikator dengan persentase benar terendah pada TKA SD tingkat nasional, beserta capaian latihan kelas ini. Indikator-indikator ini layak mendapat porsi latihan lebih.</p>' +
      Object.keys(JALUR_TKA.mapel).map(m => {
        const kini = rataIndikator(m), daf = [...SULIT[m]].sort((a, b) => nas(m, a) - nas(m, b));
        return '<section><h3>' + esc(JALUR_TKA.mapel[m].nama) + '</h3><table><tr><th>Indikator</th><th>Nasional TKA</th><th>Latihan kelas</th></tr>' +
          daf.map(no => '<tr><td>' + no + '. ' + esc(judulInd(m, no)) + '</td><td style="text-align:center">' + pctNas(nas(m, no)) + '</td><td style="text-align:center">' + (kini[no] ? angka(Math.round(kini[no].r)) + ' <small>(' + V[kini[no].v].kode + ', ' + kini[no].jml + ' siswa)</small>' : 'belum dilatih') + '</td></tr>').join('') + '</table></section>';
      }).join('');
  }
  /** Bagian laporan kepala sekolah (kosong bila belum ada data impor). */
  function laporanImpor() {
    if (typeof KELAS === 'undefined' || !KELAS) return '';
    const data = ImporTKA.ambil(KELAS.kode), ms = Object.keys(JALUR_TKA.mapel).filter(m => data[m]);
    if (!ms.length) return '';
    return '<h2>Hasil TKA sekolah tahun lalu dan tindak lanjutnya</h2><p>Data angkatan sebelumnya dari web hasil TKA, dipakai sebagai petunjuk materi yang perlu mendapat porsi lebih. Bukan penilaian siswa tahun ini.</p>' +
      ms.map(m => {
        const L = labelImpor(m), d = data[m], ada = L.filter(x => x.t.s !== null && x.t.s !== undefined);
        const rs = ada.reduce((a, x) => a + x.t.s, 0) / (ada.length || 1), rn = ada.reduce((a, x) => a + (x.t.n || 0), 0) / (ada.length || 1);
        const pr = L.filter(x => x.lb === 'prioritas'), ws = L.filter(x => x.lb === 'waspada');
        return '<section><h3>' + esc(JALUR_TKA.mapel[m].nama) + '</h3><div class="kotak"><div><small>Rata-rata sekolah</small><b>' + persen(rs) + '</b></div><div><small>Rata-rata nasional</small><b>' + persen(rn) + '</b></div><div><small>Peserta</small><b>' + (d.peserta || '–') + '</b></div><div><small>Indikator di bawah nasional</small><b>' + L.filter(x => x.lemahLalu).length + '</b></div></div>' +
          (pr.length ? '<p style="margin:8px 0 2px"><b>🔴 Prioritas</b> (lemah tahun lalu dan lemah juga di latihan tahun ini):</p><ol>' + pr.map(x => '<li>' + x.no + '. ' + esc(x.judul) + ' — TKA ' + persen(x.t.s) + ' (nasional ' + persen(x.t.n) + '), latihan ' + angka(Math.round(x.k.r)) + '</li>').join('') + '</ol>' : '') +
          (ws.length ? '<p style="margin:8px 0 2px"><b>🟠 Waspada</b> (lemah tahun lalu, belum dilatih tahun ini):</p><p>' + ws.map(x => x.no + '. ' + esc(x.judul)).join('; ') + '</p>' : '') + '</section>';
      }).join('');
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


  /* ---------- cetak soal (PDF) untuk kelas tanpa HP ---------- */
  let MCETAK = 'mat';
  function judulCetak(id) {
    const it = J.info(id);
    if (it.jenis === 'kls') return 'Tes Akhir ' + JALUR_TKA.mapel[it.m].nama + ' · Paket ' + it.paket + ' (edisi kelas)';
    return 'Latihan ' + V[it.versi].kode + ' ' + V[it.versi].nama + ' · ' + JALUR_TKA.mapel[it.m].nama + ' · ' + it.no + '. ' + judulInd(it.m, it.no);
  }
  async function cetak(ids, kunci) {
    if (kunci && !premiumAktif()) { ajakPremium(); return; }
    const w = window.open('', '_blank');
    if (!w) { alert('Izinkan jendela pop-up untuk membuka dokumen cetak.'); return; }
    w.document.write('<p style="font-family:sans-serif;padding:30px;text-align:center">⏳ Menyiapkan ' + ids.length + ' dokumen soal… Mohon tunggu.</p>');
    const bagian = []; let kepala = '';
    try {
      for (const id of ids) {
        const b = await bankUntuk(id);
        let rinci = null;
        if (kunci) { rinci = await ambilPembahasan(id); if (!rinci) throw new Error('Kunci & pembahasan ' + judulCetak(id) + ' tersedia untuk Kelas Premium.'); }
        const it = J.info(id), eks = !it;
        const html = TKA.dokumenSoal(b, rinci, KELAS.kelas + ' · ' + KELAS.sekolah + ' · Guru: ' + KELAS.guru,
          { judul: eks ? null : judulCetak(id), kop: 'KELAS INTENSIF TKA · ' + KELAS.kelas.toUpperCase() + ' · ' + KELAS.sekolah.toUpperCase(), petunjuk: it && it.versi === 1, tanpaAjak: true });
        if (!kepala) kepala = html.split('<body>')[0];
        bagian.push(html.split('<body>')[1].split('</body>')[0]);
      }
    } catch (e) { w.document.open(); w.document.write('<p style="font-family:sans-serif;padding:30px;text-align:center">⚠️ ' + esc(e.message || 'Dokumen gagal dibuat.') + '</p>'); w.document.close(); return; }
    const alat = '<div class="jangan-cetak" style="position:sticky;top:0;background:#fffbeb;border-bottom:1px solid #f5d58a;padding:8px 12px;font:14px sans-serif;z-index:9"><button onclick="print()" style="font:inherit;font-weight:700;padding:6px 14px">🖨️ Cetak / Simpan PDF</button> Pilih <b>"Simpan sebagai PDF"</b> pada jendela cetak untuk menyimpan berkas.</div><style>@media print{.jangan-cetak{display:none}}</style>';
    w.document.open();
    w.document.write(kepala + '<body>' + alat + bagian.join('<div style="break-before:page;page-break-before:always"></div>') + '<script>window.onload=()=>setTimeout(()=>print(),500)<\/script></body></html>');
    w.document.close();
    catatCetak(ids, kunci); gambarCetak();
  }
  function ajakPremium() {
    dialogInfo('⭐ Kunci & pembahasan khusus Kelas Premium',
      'Cetak <b>kunci jawaban dan pembahasan lengkap</b> setiap soal (latihan V1–V3, tes akhir, dan Paket 3) untuk membahas soal bersama siswa di kelas.<br><br>' +
      '🎁 <b>Coba gratis 14 hari</b>, cukup satu klik, atau berlangganan <b>Rp50.000 per kelas per tahun ajaran</b>. Kelas Premium juga membuka ujian serentak, Paket 3 eksklusif, peta kemampuan, rapor orang tua, dan laporan kepala sekolah.<br><br>' +
      '<b>Langkah berikutnya:</b> ketuk <b>⭐ Lihat Kelas Premium</b>, lalu pilih <b>🎁 Coba Premium gratis 14 hari</b> atau <b>⭐ Aktifkan Premium</b>.', []);
    const d = $('dlg-jg'), b = document.createElement('button');
    b.className = 'btn emas'; b.type = 'button'; b.textContent = '⭐ Lihat Kelas Premium';
    b.onclick = () => { d.close(); bukaTab('ringkas', false); setTimeout(() => $('k-premium').scrollIntoView({ behavior: 'smooth', block: 'center' }), 50); };
    d.querySelector('div').prepend(b);
  }
  function gambarCetak() {
    const el = $('k-cetak'); if (!el) return;
    const d = JALUR_TKA.mapel[MCETAK], premium = premiumAktif();
    const grup = []; d.indikator.forEach(x => { let g = grup.find(g => g.el === x.elemen); if (!g) grup.push(g = { el: x.elemen, isi: [] }); g.isi.push(x); });
    const tombol = (ids, kunci, label) => '<button type="button" class="btn-mini' + (kunci ? (premium ? ' kunci' : ' kunci-tutup') : '') + '" data-cetak="' + ids.join(',') + '"' + (kunci ? ' data-kunci="1" title="' + (premium ? 'Kunci & pembahasan untuk guru' : 'Khusus Kelas Premium') + '"' : '') + '>' + (kunci && !premium ? label.replace('🔑', '🔒') + ' ⭐' : label) + (kunci && !premium ? '' : tandaUlang(ids, kunci)) + '</button>';
    const versi = premium ? [1, 2, 3, 4] : [1, 2, 3];
    el.innerHTML = '<div class="kepala-kelas"><div><h2 style="margin:0">🖨️ Cetak Soal (PDF)</h2><p class="sub" style="margin:2px 0 0">Untuk pembelajaran di kelas bila tidak semua siswa memiliki HP. Soal dicetak lengkap dengan <b>lembar jawaban</b>.</p></div></div>' +
      '<div class="panduan-kecil"><b>Cara memakai:</b><ol><li>Ketuk <b>📄 Soal</b> untuk lembar soal siswa (gratis), atau <b>🔑 Kunci</b> untuk kunci &amp; pembahasan sebagai pegangan guru (Kelas Premium).</li><li>Jendela cetak terbuka otomatis. Pilih printer untuk mencetak, atau pilih <b>Simpan sebagai PDF</b> untuk menyimpan berkas.</li><li>Ingin satu berkas untuk satu elemen? Ketuk tombol di baris kelompok (misalnya <b>📄 Semua V1</b>).</li></ol>' +
      '<p style="margin:6px 0 0"><b>Perlu diingat:</b> nilai dari lembar kertas tidak masuk dasbor secara otomatis. Soal yang sudah dikerjakan siswa di kertas sebaiknya <b>tidak dirilis lagi di HP</b> untuk siswa yang sama, agar nilai di dasbor tetap murni. Latihan V1 dicetak beserta 💡 petunjuknya.</p>' + (PBR.length ? '<p style="margin:6px 0 0"><span class="ct-baru">🔄</span> = soal atau kunci <b>diperbarui</b> setelah Anda mencetaknya. Cetak ulang lembar soal dan kuncinya bersamaan. <button type="button" class="btn ghost kecil" data-pbr-riwayat>📰 Catatan pembaruan</button></p>' : '') + '</div>' +
      '<div class="tab-mini">' + Object.keys(JALUR_TKA.mapel).map(m => '<button type="button" data-m="' + m + '" class="' + (m === MCETAK ? 'aktif' : '') + '">' + esc(JALUR_TKA.mapel[m].nama) + '</button>').join('') + '</div>' +
      '<div style="overflow-x:auto"><table class="rl-tabel ct-tabel"><thead><tr><th>Indikator</th>' + versi.map(v => '<th class="rl-v v' + v + '">' + V[v].ikon + ' ' + V[v].kode + '<small>' + V[v].nama + '</small></th>').join('') + '</tr></thead><tbody>' +
      grup.map(g => {
        const sel = versi.map(v => { const ids = g.isi.map(x => J.id(MCETAK, x.no, v)).filter(id => ADA.has(id)); return '<td class="rl-c">' + (ids.length ? tombol(ids, false, '📄 Semua ' + V[v].kode) + tombol(ids, true, '🔑') : '') + '</td>'; }).join('');
        return '<tr class="rl-grup"><td>' + esc(g.el) + ' <span style="font-weight:600;text-transform:none;letter-spacing:0">(' + g.isi.length + ' indikator)</span></td>' + sel + '</tr>' +
          g.isi.map(x => '<tr><td><b>' + x.no + '. ' + esc(x.judul) + '</b><small>' + esc(x.indikator) + '</small></td>' + versi.map(v => { const id = J.id(MCETAK, x.no, v); return '<td class="rl-c">' + (ADA.has(id) ? tombol([id], false, '📄 Soal') + tombol([id], true, '🔑 Kunci') : '<span class="rl-segera">segera</span>') + '</td>'; }).join('') + '</tr>').join('');
      }).join('') + '</tbody></table></div>' +
      '<h3 style="margin:18px 0 6px">🏁 Paket soal 30 butir</h3><div class="rl-paket">' +
      JALUR_TKA.paket.filter(p => p.ada).map(p => '<div><b>' + esc(p.mapel + ' · ' + p.paket) + '</b><small>Edisi kelas (soal hanya di Kelas Intensif) · 30 soal · 75 menit</small>' + tombol([p.id], false, '📄 Soal + lembar jawaban') + tombol([p.id], true, '🔑 Kunci') + '</div>').join('') +
      (typeof PAKET_EKSKLUSIF === 'undefined' ? [] : PAKET_EKSKLUSIF).map(p => '<div><b>⭐ ' + esc(p.mapel + ' · ' + p.paket) + '</b><small>Eksklusif ujian serentak · Kelas Premium</small>' + (premium ? tombol([p.id], false, '📄 Soal + lembar jawaban') + tombol([p.id], true, '🔑 Kunci') : '<span class="rl-segera">⭐ Kelas Premium</span>') + '</div>').join('') +
      PAKET_TKA.map(p => '<div><b>' + esc(p.mapel + ' · ' + p.paket) + '</b><small>Paket umum (juga terbuka di halaman Simulasi TKA)</small><a class="btn-mini" href="pdf/' + p.id + '.pdf?v=3" target="_blank" rel="noopener">📄 Unduh PDF</a></div>').join('') + '</div>' +
      (premium ? '<p class="catatan" style="margin:10px 0 0">⭐ Kelas Premium aktif: semua kunci &amp; pembahasan dapat dicetak.</p>' : '<div class="ajak-premium"><b>🔒 Kunci &amp; pembahasan khusus Kelas Premium.</b> Lembar soal tetap gratis. Ingin mencetak kunci untuk membahas soal di kelas? <button type="button" class="btn emas kecil" id="ct-premium">🎁 Coba gratis 14 hari / ⭐ Aktifkan Premium</button></div>');
    el.querySelector('.tab-mini').onclick = e => { const b = e.target.closest('button'); if (!b) return; MCETAK = b.dataset.m; gambarCetak(); };
    el.querySelectorAll('[data-cetak]').forEach(b => b.onclick = () => cetak(b.dataset.cetak.split(','), !!b.dataset.kunci));
    const rw = el.querySelector('[data-pbr-riwayat]'); if (rw) rw.onclick = () => cekPembaruan(true);
    const ap = $('ct-premium'); if (ap) ap.onclick = ajakPremium;
  }

  /** Dipanggil setiap data dasbor dimuat ulang. */
  function gambarSemua() {
    if (DATA && !DATA._diterima) DATA._diterima = Date.now();
    CENTANG = new Set(DATA.rilis || []);
    pasangTab(); gambarBaru(); gambarIngat(); gambarRilis(); gambarAnalisis(); gambarCetak();
    if (!PBR_DICEK) { PBR_DICEK = true; mulaiCatat(); setTimeout(() => cekPembaruan(false), 600); }
    document.querySelectorAll('#tab-dasbor button').forEach(b => b.classList.toggle('aktif', b.dataset.tab === TAB));
    document.querySelectorAll('[data-panel]').forEach(p => { p.hidden = p.dataset.panel !== TAB; });
    const jml = (DATA.rilis || []).length, tb = document.querySelector('#tab-dasbor [data-tab="rilis"] small');
    if (tb) tb.textContent = jml ? ' (' + jml + ')' : '';
  }

  return { raporJalur, laporanImpor, laporanNasional, gambarSemua, bukaTab, paketTab, paketKelas, namaItem, tab: () => TAB, paketPanel: t => { const p = document.querySelector('[data-panel="' + t + '"]'); if (p && $('d-paket').parentElement !== p) { p.appendChild($('d-paket')); p.appendChild($('d-isi')); } } };
})();
