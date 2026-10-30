/* Data pengunduh untuk seluruh situs (e-book; halaman poster memakai kunci penyimpanan yang sama).
   Pengunduh mengisi data sekali per perangkat; setiap unduhan dicatat ke server Rapor Merdeka Digital
   lewat antrean di perangkat, sehingga catatan tidak hilang saat server tak terjangkau.
   Pakai: Pengunduh.pasang(akar) lalu Pengunduh.minta(fn) — fn dijalankan setelah data tersedia. */
const Pengunduh = (() => {
  const API = 'https://script.google.com/macros/s/AKfycbzTAde0R7qTZ3V3Tk_bjI9ue7_lkdKxW4DygSKuoBnvlgKMlRcFBnithtKEhau92LPQ/exec';
  const VERSI_DATA = 2;   // sama dengan poster/index.html; naikkan bersama bila semua perlu mengisi ulang
  const simpan = {
    get: k => { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } },
    set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* mode privat */ } }
  };
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  let akar = '', lanjut = null, mengirim = false;

  function data() {
    const d = simpan.get('poster-pengunduh');
    return d && d.versi === VERSI_DATA ? d : null;
  }
  function idPerangkat() {
    let id = simpan.get('poster-perangkat');
    if (!id) { id = 'p' + Date.now().toString(36) + Math.random().toString(36).slice(2, 10); simpan.set('poster-perangkat', id); }
    return id;
  }
  function kirim(req) {
    return fetch(API, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(req), keepalive: true })
      .then(r => r.json()).catch(() => ({ ok: false, putus: true }));
  }
  async function kirimAntrean() {
    if (mengirim) return;
    mengirim = true;
    try {
      while ((simpan.get('poster-antrean') || []).length) {
        const res = await kirim(simpan.get('poster-antrean')[0]);
        if (res.putus) break;
        simpan.set('poster-antrean', (simpan.get('poster-antrean') || []).slice(1));
      }
    } finally { mengirim = false; }
  }
  /** Catat satu permintaan (mis. { aksi: 'ebookUnduh', ebook, jenis, berkas }); data pengunduh ditambahkan otomatis. */
  function catat(req) {
    const d = data();
    if (!d) return;
    req = { ...req, pengunduh: { ...d, id: idPerangkat() } };
    simpan.set('poster-antrean', (simpan.get('poster-antrean') || []).concat([req]).slice(-200));
    if (!(simpan.get('poster-antrean') || []).length) { kirim(req); return; }   // penyimpanan diblokir: kirim langsung
    kirimAntrean();
  }

  const CSS = '.pgd{border:0;border-radius:18px;padding:0;max-width:min(560px,94vw);width:100%;box-shadow:0 30px 80px rgba(0,0,0,.35)}' +
    '.pgd::backdrop{background:rgba(10,20,30,.7)}.pgd form{padding:16px 18px;display:grid;grid-template-columns:1fr 1fr;gap:10px;font-family:inherit}' +
    '.pgd h3{margin:0;color:#12314f;grid-column:1/-1}.pgd .ket{margin:0;color:#5b6b7f;font-size:13.5px;grid-column:1/-1}' +
    '.pgd label{display:flex;flex-direction:column;gap:4px;font-size:13px;font-weight:700;color:#16202a}' +
    '.pgd input,.pgd select{font:inherit;font-size:15px;font-weight:400;padding:10px 12px;border:1px solid #eadfc7;border-radius:12px;background:#fff;color:#16202a;width:100%}' +
    '.pgd .penuh{grid-column:1/-1}.pgd .salah{color:#c5221f;font-size:13.5px;font-weight:600;margin:0;min-height:1em}' +
    '.pgd .aksi{display:flex;gap:8px;flex-wrap:wrap}.pgd button{font:inherit;font-weight:800;font-size:14.5px;border-radius:12px;padding:11px 16px;cursor:pointer;border:1px solid #eadfc7;background:#fff;color:#12314f}' +
    '.pgd button[type=submit]{background:#1b7f3e;color:#fff;border-color:#1b7f3e}.pgd .privasi{font-size:12.5px;color:#5b6b7f;margin:0}' +
    '@media(max-width:600px){.pgd form{grid-template-columns:1fr}}';
  const HTML = '<dialog class="pgd" id="pgd"><form novalidate>' +
    '<h3>Sebelum mengunduh</h3><p class="ket">Cukup diisi <b>sekali</b> di perangkat ini (berlaku juga untuk Poster IPAS). Unduhan berikutnya langsung tersimpan.</p>' +
    '<label>Nama<input name="nama" required data-label="nama" maxlength="80" autocomplete="name"></label>' +
    '<label>Asal sekolah<input name="sekolah" required data-label="asal sekolah" maxlength="80" placeholder="Contoh: SD N 1 Sukamaju"></label>' +
    '<label>Provinsi<select name="provinsi" required data-label="provinsi"><option value="">Memuat…</option></select></label>' +
    '<label>Kabupaten/Kota<select name="kabupaten" required data-label="kabupaten/kota" disabled><option value="">Pilih provinsi dulu…</option></select></label>' +
    '<label>Mengajar<select name="mengajar" required data-label="kelas yang diajar"><option value="">Pilih…</option>' +
    ['Kelas 1', 'Kelas 2', 'Kelas 3', 'Kelas 4', 'Kelas 5', 'Kelas 6', 'Guru mapel', 'Kepala sekolah', 'Lainnya'].map(x => '<option>' + x + '</option>').join('') + '</select></label>' +
    '<label>No. WhatsApp <span style="font-weight:400;color:#5b6b7f">(opsional)</span><input name="wa" type="tel" inputmode="tel" maxlength="20" placeholder="Untuk kabar karya baru"></label>' +
    '<p class="salah penuh"></p>' +
    '<div class="aksi penuh"><button type="submit">⬇️ Simpan &amp; lanjutkan</button><button type="button" data-batal>Batal</button></div>' +
    '<p class="privasi penuh">Data hanya dipakai Admin untuk mengetahui sebaran pemakai dan mengembangkan karya berikutnya. Tidak ditampilkan dan tidak dibagikan. <a href="' + '{AKAR}privasi.html" target="_blank" rel="noopener">Kebijakan privasi</a></p>' +
    '</form></dialog>';

  function muatWilayah() {
    if (typeof WILAYAH !== 'undefined') return Promise.resolve();
    return new Promise(selesai => {
      const s = document.createElement('script');
      s.src = akar + 'app/wilayah.js'; s.onload = selesai; s.onerror = selesai;
      document.head.appendChild(s);
    });
  }
  function isiKab(f) {
    const d = (typeof WILAYAH !== 'undefined' && WILAYAH[f.elements.provinsi.value]) || [];
    f.elements.kabupaten.innerHTML = '<option value="">' + (d.length ? 'Pilih kabupaten/kota…' : 'Pilih provinsi dulu…') + '</option>' +
      d.map(k => '<option>' + esc(k) + '</option>').join('');
    f.elements.kabupaten.disabled = !d.length;
  }
  function pasang(a) {
    akar = a || '';
    if (document.getElementById('pgd')) return;
    document.head.insertAdjacentHTML('beforeend', '<style>' + CSS + '</style>');
    document.body.insertAdjacentHTML('beforeend', HTML.replace('{AKAR}', akar));
    const dlg = document.getElementById('pgd'), f = dlg.querySelector('form');
    dlg.querySelector('[data-batal]').addEventListener('click', () => { lanjut = null; dlg.close(); });
    f.elements.provinsi.addEventListener('change', () => isiKab(f));
    f.addEventListener('submit', e => {
      e.preventDefault();
      const salah = f.querySelector('.salah');
      const kosong = [...f.querySelectorAll('[required]')].find(el => !el.value.trim());
      if (kosong) { salah.textContent = 'Lengkapi ' + kosong.dataset.label + ' terlebih dahulu.'; kosong.focus(); return; }
      const wa = f.elements.wa.value.replace(/\D/g, '');
      if (wa && !/^(08|628|8)\d{7,12}$/.test(wa)) { salah.textContent = 'Nomor WhatsApp belum benar, atau kosongkan saja.'; f.elements.wa.focus(); return; }
      simpan.set('poster-pengunduh', { nama: f.elements.nama.value.trim(), sekolah: f.elements.sekolah.value.trim(), provinsi: f.elements.provinsi.value,
        kabupaten: f.elements.kabupaten.value, mengajar: f.elements.mengajar.value, wa: f.elements.wa.value.trim(), versi: VERSI_DATA });
      dlg.close();
      const fn = lanjut; lanjut = null;
      if (fn) fn(data());
    });
    kirimAntrean();
  }
  /** Jalankan fn bila data pengunduh sudah ada; bila belum, tampilkan formulir dulu. */
  function minta(fn) {
    const d = data();
    if (d) return fn(d);
    lanjut = fn;
    const dlg = document.getElementById('pgd'), f = dlg.querySelector('form');
    f.querySelector('.salah').textContent = '';
    dlg.showModal();
    muatWilayah().then(() => {
      if (f.elements.provinsi.options.length > 1) return;
      f.elements.provinsi.innerHTML = '<option value="">Pilih provinsi…</option>' + (typeof WILAYAH !== 'undefined'
        ? Object.keys(WILAYAH).sort((a, b) => a.localeCompare(b)).map(p => '<option>' + esc(p) + '</option>').join('') : '');
    });
  }
  return { pasang, minta, catat, kirim, data };
})();
