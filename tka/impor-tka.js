/* Kelas Intensif TKA · Impor Hasil TKA Sekolah (file "Hierarki" dari web hasil TKA).
   Berkas dibaca di browser guru dan TIDAK dikirim ke server. Hasilnya disimpan di perangkat ini (per kode kelas). */
const ImporTKA = (() => {
  const XLSX_URL = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
  let muat = null;
  function pustaka() {
    if (window.XLSX) return Promise.resolve(window.XLSX);
    if (!muat) muat = new Promise((ok, gagal) => {
      const s = document.createElement('script');
      s.src = XLSX_URL; s.onload = () => ok(window.XLSX); s.onerror = () => { muat = null; gagal(new Error('Pembaca Excel gagal dimuat. Periksa koneksi internet, lalu coba lagi.')); };
      document.head.appendChild(s);
    });
    return muat;
  }
  const angka = v => { if (v === null || v === undefined || v === '') return null; const n = typeof v === 'number' ? v : parseFloat(String(v).replace(',', '.')); return isNaN(n) ? null : n; };

  /** Ubah baris-baris lembar kerja menjadi data hasil TKA. Lempar galat dengan pesan ramah bila bukan berkas yang benar. */
  function olah(baris, namaBerkas) {
    const info = {};
    let kepala = -1;
    baris.forEach((r, i) => {
      if (kepala < 0 && r && String(r[0]).trim() === 'No' && String(r[1]).trim() === 'Level') kepala = i;
      else if (kepala < 0 && r && r[0] && r[1] !== undefined && r[1] !== null) info[String(r[0]).trim()] = String(r[1]).trim();
    });
    if (kepala < 0) throw new Error(namaBerkas + ': bukan berkas Hierarki hasil TKA. Unduh berkas "Hierarki" dari halaman hasil TKA.');
    const mp = (info['Mata Pelajaran'] || '').toLowerCase();
    const m = /matematika/.test(mp) ? 'mat' : /bahasa indonesia/.test(mp) ? 'bi' : null;
    if (!m) throw new Error(namaBerkas + ': mata pelajaran "' + (info['Mata Pelajaran'] || '?') + '" belum didukung. Gunakan berkas Matematika atau Bahasa Indonesia.');
    if (info['Jenjang'] && !/^SD/i.test(info['Jenjang'])) throw new Error(namaBerkas + ': berkas ini untuk jenjang ' + info['Jenjang'] + ', bukan SD.');
    if (info['Wilayah'] && !/sekolah/i.test(info['Wilayah'])) throw new Error(namaBerkas + ': berkas ini tingkat ' + info['Wilayah'] + '. Pilih tingkat Sekolah saat mengunduh, agar yang terbaca adalah hasil sekolah Anda.');
    const ind = {};
    for (let i = kepala + 1; i < baris.length; i++) {
      const r = baris[i]; if (!r || String(r[1] || '').trim() !== 'Indikator') continue;
      const no = /\((\d+)\)\s*\.?\s*$/.exec(String(r[2] || ''));
      if (!no) continue;
      ind[+no[1]] = { s: angka(r[3]), k: angka(r[4]), p: angka(r[5]), n: angka(r[6]) };
    }
    const jml = Object.keys(ind).length;
    if (jml < 20) throw new Error(namaBerkas + ': hanya ' + jml + ' indikator terbaca. Pastikan berkas tidak diubah setelah diunduh.');
    return { m, ind, provinsi: info['Provinsi'] || '', kabupaten: info['Kabupaten'] || '', peserta: angka(info['Total Peserta']), diunduh: info['Tanggal Download'] || '', berkas: namaBerkas, diimpor: Date.now() };
  }

  async function baca(file) {
    const X = await pustaka();
    const wb = X.read(await file.arrayBuffer(), { type: 'array' });
    const ws = wb.Sheets[wb.SheetNames[0]];
    return olah(X.utils.sheet_to_json(ws, { header: 1, raw: true, defval: null }), file.name);
  }

  const kunci = kode => 'tka-impor-' + kode;
  function ambil(kode) { try { return JSON.parse(localStorage.getItem(kunci(kode)) || '{}') || {}; } catch (e) { return {}; } }
  function simpan(kode, data) { try { localStorage.setItem(kunci(kode), JSON.stringify(data)); return true; } catch (e) { return false; } }
  function hapus(kode, m) { const d = ambil(kode); delete d[m]; simpan(kode, d); }

  return { baca, olah, ambil, simpan, hapus };
})();
