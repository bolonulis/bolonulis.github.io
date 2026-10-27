/* Dipakai bersama halaman depan, /rapor/, dan /rpp-flash/: angka pemakai dan testimoni yang disetujui pengembang.
   Semua hanya hiasan: bila server tidak terjangkau, bagiannya tetap tersembunyi. */
const LAYANAN = {
  rapor: { nama: 'Rapor Merdeka Digital', url: 'https://script.google.com/macros/s/AKfycbzTAde0R7qTZ3V3Tk_bjI9ue7_lkdKxW4DygSKuoBnvlgKMlRcFBnithtKEhau92LPQ/exec', post: true },
  rpp: { nama: 'RPP Flash', url: 'https://script.google.com/macros/s/AKfycbyIqhmej0QdEedB0DisrnUsfUW4g0W5ubCQPhLavHAk-EWb_QTozx7Xu9f-t2vIRTpcAQ/exec', post: false }
};
function tanyaLayanan(kunci, aksi) {
  const l = LAYANAN[kunci];
  const req = l.post
    ? fetch(l.url, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ aksi }) })
    : fetch(l.url + '?aksi=' + aksi);
  return req.then(r => r.json()).catch(() => ({ ok: false }));
}
const escB = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/** "Sudah digunakan oleh 12 sekolah di 3 kabupaten/kota" ke elemen id, untuk aplikasi kunci. */
function tampilPemakai(kunci, id) {
  tanyaLayanan(kunci, 'statistik').then(s => {
    const el = document.getElementById(id);
    if (!el || !s.ok || !s.sekolah) return;
    el.textContent = '🏫 Sudah digunakan oleh ' + s.sekolah + ' sekolah di ' + s.kabupaten + ' kabupaten/kota' + (s.rpp ? ' · ' + s.rpp + ' RPP disusun' : '');
    el.hidden = false;
  });
}

/** Testimoni yang sudah disetujui dari aplikasi-aplikasi kunci, digabung ke wadah id (bagian bungkus ditampilkan bila ada). */
function tampilTestimoni(daftarKunci, id, bungkusId) {
  Promise.all(daftarKunci.map(k => tanyaLayanan(k, 'testimoni').then(h => (h.ok && h.testimoni || []).map(t => ({ ...t, aplikasi: LAYANAN[k].nama })))))
    .then(semua => {
      const t = [];
      const panjang = Math.max(0, ...semua.map(a => a.length));
      for (let i = 0; i < panjang; i++) semua.forEach(a => { if (a[i]) t.push(a[i]); }); // selang-seling antaraplikasi
      if (!t.length) return;
      document.getElementById(id).innerHTML = t.slice(0, 9).map(x =>
        '<figure class="testi"><blockquote>“' + escB(x.isi) + '”</blockquote><figcaption><b>' + escB(x.nama) + '</b>' +
        [x.jabatan, x.sekolah, x.kabupaten].filter(Boolean).map(v => '<span>' + escB(v) + '</span>').join('') +
        (daftarKunci.length > 1 ? '<em>' + escB(x.aplikasi) + '</em>' : '') + '</figcaption></figure>').join('');
      document.getElementById(bungkusId).hidden = false;
    });
}

/** Formulir yang menyusun pesan WhatsApp siap kirim (guru tinggal klik Kirim di WhatsApp). */
function pasangFormWa(formId, susun) {
  const f = document.getElementById(formId);
  if (!f) return;
  f.addEventListener('submit', e => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(f).entries());
    for (const [k, v] of Object.entries(data)) data[k] = String(v).trim();
    const salah = f.querySelector('.salah');
    const kosong = [...f.querySelectorAll('[required]')].find(el => !el.value.trim());
    if (kosong) { salah.textContent = 'Lengkapi ' + kosong.dataset.label + ' terlebih dahulu.'; kosong.focus(); return; }
    salah.textContent = '';
    window.open('https://wa.me/6281196939694?text=' + encodeURIComponent(susun(data)), '_blank', 'noopener');
  });
}
