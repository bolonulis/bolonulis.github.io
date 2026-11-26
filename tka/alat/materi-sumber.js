/* Sumber Materi per Indikator (Kelas Intensif TKA), tahap 1: 10 indikator Matematika dengan persentase benar
   terendah (bank/jebakan.js, data 14 November 2026).
   Diolah oleh alat/buat-materi.js menjadi bank/materi.js (gratis) dan bank/materi-premium.js (Premium).
   Setiap contoh/soal hitung punya `cek` dan `cek2`: dua cara hitung berbeda yang harus sama dengan `nilai`
   (diperiksa otomatis oleh buat-materi.js). Pecahan ditulis [[a/b]] atau [[c a/b]]. */
const S = require('./materi-svg.js');

module.exports = {
  per: '14 November 2026',
  mat: [
    /* ------------------------------------------------------------------ 21 */
    {
      no: 21, p: 22,
      ringkas: [
        'Luas segitiga = <b>alas × tinggi : 2</b>.',
        '<b>Tinggi</b> selalu <b>tegak lurus</b> (membentuk sudut siku-siku) dengan alas. Sisi miring <b>bukan</b> tinggi.',
        'Bangun segi banyak bisa dipotong menjadi beberapa segitiga dengan <b>garis bantu</b>. Hitung luas setiap segitiga, lalu <b>jumlahkan</b>.',
        'Pada gambar berpetak, hitung alas dan tinggi dengan menghitung petak secara <b>lurus</b> (mendatar dan tegak).'
      ],
      gambar: S.layang(),
      awas: 'Jangan berhenti setelah menghitung satu segitiga. Bangun gabungan berarti luasnya <b>dijumlahkan</b>.',
      contoh: [
        { soal: 'Layang-layang di gambar dipotong menjadi dua segitiga oleh garis mendatar sepanjang 8 cm. Tinggi tiap segitiga 3 cm. Berapa luas layang-layang?',
          langkah: ['Segitiga atas: 8 × 3 : 2 = 12 cm².', 'Segitiga bawah: 8 × 3 : 2 = 12 cm².', 'Luas layang-layang = 12 + 12 = <b>24 cm²</b>.'],
          nilai: 24, cek: '8*3/2 + 8*3/2', cek2: '8*6/2' },
        { soal: 'Sebuah bangun dibagi menjadi dua segitiga. Segitiga pertama alasnya 10 cm, segitiga kedua alasnya 4 cm. Tinggi keduanya sama, 6 cm. Berapa luas bangun itu?',
          langkah: ['Segitiga pertama: 10 × 6 : 2 = 30 cm².', 'Segitiga kedua: 4 × 6 : 2 = 12 cm².', 'Luas bangun = 30 + 12 = <b>42 cm²</b>.'],
          nilai: 42, cek: '10*6/2 + 4*6/2', cek2: '(10+4)*6/2' }
      ],
      trik: [
        { judul: 'Potong dari satu titik sudut', isi: 'Tarik garis bantu dari <b>satu</b> titik sudut ke titik-titik sudut lainnya. Bangun segi empat menjadi 2 segitiga, segi lima menjadi 3 segitiga. Beri nomor setiap segitiga agar tidak ada yang terlewat.' },
        { judul: 'Kotak dikurangi pojok', isi: 'Bila bangunnya ada di dalam persegi panjang, hitung luas persegi panjangnya, lalu <b>kurangi</b> segitiga-segitiga di pojok yang tidak termasuk. Sering lebih cepat daripada menjumlahkan.' },
        { judul: 'Cek setengah kotak', isi: 'Luas segitiga selalu <b>setengah</b> luas persegi panjang yang alas dan tingginya sama. Kalau jawabanmu lebih dari luas kotaknya, pasti ada yang salah.' },
        { judul: 'Diagonal layang-layang dan belah ketupat', isi: 'Luas = diagonal 1 × diagonal 2 : 2. Ini sama dengan menjumlahkan dua segitiga, jadi boleh dipakai sebagai cara cepat sekaligus cara memeriksa.' }
      ],
      latihan: [
        { soal: 'Segitiga dengan alas 12 cm dan tinggi 5 cm. Berapa luasnya?', jawab: '30 cm²', cara: '12 × 5 : 2 = 30', nilai: 30, cek: '12*5/2', cek2: '60/2' },
        { soal: 'Bangun terdiri atas dua segitiga yang sama besar. Setiap segitiga beralas 10 cm dan tinggi 4 cm. Berapa luas bangun?', jawab: '40 cm²', cara: '10 × 4 : 2 = 20, lalu 20 + 20 = 40', nilai: 40, cek: '2*(10*4/2)', cek2: '10*4' },
        { soal: 'Layang-layang memiliki diagonal 10 cm dan 7 cm. Berapa luasnya?', jawab: '35 cm²', cara: '10 × 7 : 2 = 35', nilai: 35, cek: '10*7/2', cek2: '10*3.5/2 + 10*3.5/2' },
        { soal: 'Segi empat ABCD dipotong oleh diagonal AC yang panjangnya 9 cm. Tinggi segitiga ABC dari titik B ke AC adalah 4 cm, dan tinggi segitiga ACD dari titik D ke AC adalah 6 cm. Berapa luas segi empat?', jawab: '45 cm²', cara: '9 × 4 : 2 = 18 dan 9 × 6 : 2 = 27, jadi 18 + 27 = 45', nilai: 45, cek: '9*4/2 + 9*6/2', cek2: '9*(4+6)/2' },
        { soal: 'Belah ketupat dengan diagonal 12 cm dan 8 cm. Berapa luasnya?', jawab: '48 cm²', cara: '12 × 8 : 2 = 48', nilai: 48, cek: '12*8/2', cek2: '4*(6*4/2)' },
        { soal: 'Persegi panjang 8 cm × 6 cm. Di dua pojoknya dipotong segitiga siku-siku dengan sisi siku 3 cm dan 2 cm. Berapa luas bangun yang tersisa?', jawab: '42 cm²', cara: '8 × 6 = 48; satu segitiga 3 × 2 : 2 = 3; 48 − 3 − 3 = 42', nilai: 42, cek: '8*6 - 2*(3*2/2)', cek2: '48 - 6' }
      ]
    },
    /* ------------------------------------------------------------------ 22 */
    {
      no: 22, p: 29,
      ringkas: [
        '<b>Keliling</b> = panjang semua sisi dijumlahkan. Persegi panjang: <b>2 × (panjang + lebar)</b>. Persegi: <b>4 × sisi</b>.',
        '<b>Luas</b> = daerah di dalamnya. Persegi panjang: <b>panjang × lebar</b>. Persegi: <b>sisi × sisi</b>.',
        'Satuan keliling: cm atau m. Satuan luas: <b>cm²</b> atau <b>m²</b>.',
        'Bila luas dan satu sisi diketahui, sisi yang lain = <b>luas : sisi</b> yang diketahui.'
      ],
      gambar: S.persegiPanjang(12, 6),
      awas: 'Keliling bukan panjang + lebar saja. Ada <b>empat</b> sisi, jadi jumlahkan keempatnya.',
      contoh: [
        { soal: 'Kebun berbentuk persegi panjang dengan panjang 12 m dan lebar 6 m. Berapa keliling dan luasnya?',
          langkah: ['Keliling = 12 + 6 + 12 + 6 = <b>36 m</b>.', 'Luas = 12 × 6 = <b>72 m²</b>.'],
          nilai: 36, cek: '2*(12+6)', cek2: '12+6+12+6', nilai2: 72, cek3: '12*6' },
        { soal: 'Sebuah persegi luasnya 49 cm². Berapa kelilingnya?',
          langkah: ['Cari sisi: bilangan yang dikali dirinya sendiri sama dengan 49 adalah 7. Jadi sisi = 7 cm.', 'Keliling = 4 × 7 = <b>28 cm</b>.'],
          nilai: 28, cek: '4*Math.sqrt(49)', cek2: '7+7+7+7' }
      ],
      trik: [
        { judul: 'Gambar dan tulis keempat sisi', isi: 'Buat sketsa persegi panjang, tulis angka di <b>keempat</b> sisinya, lalu jumlahkan. Cara ini mencegah lupa mengalikan 2.' },
        { judul: 'Pagar = keliling, ubin = luas', isi: 'Kata <b>pagar, bingkai, lari mengelilingi, pita di tepi</b> → keliling. Kata <b>ubin, karpet, rumput, cat, menutupi</b> → luas.' },
        { judul: 'Sisi yang hilang', isi: 'Luas 54 cm² dan lebar 6 cm? Panjang = 54 : 6 = 9 cm. Setelah semua sisi diketahui, baru hitung keliling.' },
        { judul: 'Cek satuan', isi: 'Jawaban keliling memakai cm/m, jawaban luas memakai cm²/m². Kalau satuannya tidak cocok dengan yang ditanya, baca soal sekali lagi.' }
      ],
      latihan: [
        { soal: 'Taman berukuran 15 m × 8 m akan dipagari di sekelilingnya. Berapa panjang pagar?', jawab: '46 m', cara: '2 × (15 + 8) = 46', nilai: 46, cek: '2*(15+8)', cek2: '15+8+15+8' },
        { soal: 'Lantai berukuran 5 m × 4 m ditutup ubin berukuran 1 m × 1 m. Berapa ubin yang diperlukan?', jawab: '20 ubin', cara: '5 × 4 = 20', nilai: 20, cek: '5*4', cek2: '4+4+4+4+4' },
        { soal: 'Persegi panjang luasnya 54 cm² dan lebarnya 6 cm. Berapa kelilingnya?', jawab: '30 cm', cara: 'panjang = 54 : 6 = 9; keliling = 2 × (9 + 6) = 30', nilai: 30, cek: '2*(54/6+6)', cek2: '9+6+9+6' },
        { soal: 'Persegi kelilingnya 36 cm. Berapa luasnya?', jawab: '81 cm²', cara: 'sisi = 36 : 4 = 9; luas = 9 × 9 = 81', nilai: 81, cek: '(36/4)**2', cek2: '9*9' },
        { soal: 'Lapangan berukuran 20 m × 10 m. Raka berlari mengelilinginya 3 kali. Berapa meter jarak yang ditempuh?', jawab: '180 m', cara: 'keliling = 2 × (20 + 10) = 60; 3 × 60 = 180', nilai: 180, cek: '3*2*(20+10)', cek2: '60+60+60' },
        { soal: 'Kertas berukuran 30 cm × 20 cm dipotong menjadi persegi-persegi kecil 10 cm × 10 cm. Berapa potong persegi kecil yang didapat?', jawab: '6 potong', cara: '30 : 10 = 3 dan 20 : 10 = 2; 3 × 2 = 6', nilai: 6, cek: '(30/10)*(20/10)', cek2: '(30*20)/(10*10)' }
      ]
    },
    /* ------------------------------------------------------------------ 15 */
    {
      no: 15, p: 37,
      ringkas: [
        'Bangun ruang dari kubus kecil dihitung <b>lapis demi lapis</b>: banyak kubus satu lapis × banyak lapis.',
        'Kubus besar berukuran 4 × 4 × 4 berisi 4 × 4 × 4 = <b>64</b> kubus kecil, bukan 16.',
        '<b>Denah angka</b> (tampak atas): angka di tiap kotak = tinggi tumpukan. Banyak kubus = <b>jumlah semua angka</b>.',
        '<b>Tampak depan</b> = angka <b>terbesar</b> di setiap kolom. <b>Tampak samping</b> = angka terbesar di setiap baris.'
      ],
      gambar: S.denah([[2, 1, 3], [1, 2, 1]]),
      awas: 'Kubus yang tersembunyi di belakang atau di bawah tetap dihitung.',
      contoh: [
        { soal: 'Kubus besar disusun dari kubus kecil, 4 kubus pada setiap rusuknya. Berapa kubus kecil seluruhnya?',
          langkah: ['Satu lapis: 4 × 4 = 16 kubus.', 'Ada 4 lapis: 16 × 4 = <b>64 kubus</b>.'],
          nilai: 64, cek: '4*4*4', cek2: '16+16+16+16' },
        { soal: 'Denah tampak atas di gambar: baris belakang 2, 1, 3 dan baris depan 1, 2, 1. Berapa banyak kubus, dan bagaimana tinggi tampak depan tiap kolom?',
          langkah: ['Banyak kubus = 2 + 1 + 3 + 1 + 2 + 1 = <b>10 kubus</b>.', 'Tampak depan, kolom kiri: angka terbesar 2 dan 1 → 2. Kolom tengah: 1 dan 2 → 2. Kolom kanan: 3 dan 1 → 3.', 'Jadi tampak depan setinggi <b>2, 2, 3</b>.'],
          nilai: 10, cek: '[2,1,3,1,2,1].reduce((a,b)=>a+b)', cek2: '(2+1+3)+(1+2+1)' }
      ],
      trik: [
        { judul: 'Hitung per lapis, bukan per kubus', isi: 'Hitung satu lapis (panjang × lebar), lalu kalikan banyak lapis. Lebih cepat dan tidak ada kubus yang terlewat.' },
        { judul: 'Ubah gambar menjadi denah angka', isi: 'Untuk tumpukan yang tidak rata, tulis tinggi setiap tumpukan pada denah, lalu jumlahkan semua angkanya.' },
        { judul: 'Tampak depan dan samping', isi: 'Tampak depan: lihat setiap kolom dari depan, ambil angka terbesar. Tampak samping: lihat setiap baris dari samping, ambil angka terbesar.' },
        { judul: 'Jaring-jaring kubus', isi: 'Jaring-jaring kubus selalu terdiri atas <b>6 persegi</b>. Bayangkan satu persegi sebagai alas, lalu lipat sisi lain ke atas. Bila ada dua persegi yang menutupi tempat yang sama, itu bukan jaring-jaring kubus.' }
      ],
      latihan: [
        { soal: 'Balok disusun dari kubus satuan berukuran 5 × 3 × 2. Berapa kubus satuan yang dipakai?', jawab: '30 kubus', cara: '5 × 3 = 15 per lapis; 15 × 2 = 30', nilai: 30, cek: '5*3*2', cek2: '15+15' },
        { soal: 'Kubus besar dengan 3 kubus kecil pada setiap rusuknya. Berapa kubus kecil seluruhnya?', jawab: '27 kubus', cara: '3 × 3 × 3 = 27', nilai: 27, cek: '3**3', cek2: '9+9+9' },
        { soal: 'Denah angka: baris belakang 3 dan 1, baris depan 2 dan 2. Berapa banyak kubus?', jawab: '8 kubus', cara: '3 + 1 + 2 + 2 = 8', nilai: 8, cek: '3+1+2+2', cek2: '[3,1,2,2].reduce((a,b)=>a+b)' },
        { soal: 'Dari denah pada soal nomor 3, berapa tinggi tampak depan kolom kiri dan kolom kanan?', jawab: 'Kiri 3, kanan 2', cara: 'kolom kiri: 3 dan 2 → 3; kolom kanan: 1 dan 2 → 2', nilai: 5, cek: 'Math.max(3,2)+Math.max(1,2)', cek2: '3+2' },
        { soal: 'Tangga kubus: tumpukan pertama 1 kubus, kedua 2 kubus, ketiga 3 kubus, keempat 4 kubus. Berapa kubus seluruhnya?', jawab: '10 kubus', cara: '1 + 2 + 3 + 4 = 10', nilai: 10, cek: '1+2+3+4', cek2: '4*5/2' },
        { soal: 'Kubus 2 × 2 × 2 dari kubus kecil diambil 1 kubus kecilnya. Berapa kubus kecil yang tersisa?', jawab: '7 kubus', cara: '2 × 2 × 2 = 8; 8 − 1 = 7', nilai: 7, cek: '2*2*2-1', cek2: '4+3' }
      ]
    },
    /* ------------------------------------------------------------------ 18 */
    {
      no: 18, p: 39,
      ringkas: [
        'Sisi neraca yang <b>lebih berat akan turun</b>. Sisi yang lebih ringan naik.',
        'Neraca <b>seimbang</b> bila jumlah berat di kedua piring <b>sama</b>.',
        'Jumlahkan dulu berat semua benda di setiap piring, baru bandingkan. Samakan satuan (1 kg = 1.000 g).',
        'Bila beratnya ditulis dengan benda lain (1 semangka = 4 jeruk), <b>ganti</b> semua benda menjadi satu jenis dulu.'
      ],
      gambar: S.neraca('400 g', '350 g'),
      awas: 'Sisi yang berat itu <b>turun</b>, bukan naik. Ingat batu di timbangan: berat, jadi turun.',
      contoh: [
        { soal: 'Piring kiri berisi tas 400 g, piring kanan berisi botol 350 g. Sisi mana yang turun, dan berapa selisih beratnya?',
          langkah: ['400 g lebih berat daripada 350 g, jadi <b>piring kiri turun</b>.', 'Selisih = 400 − 350 = <b>50 g</b>.'],
          nilai: 50, cek: '400-350', cek2: '-(350-400)' },
        { soal: '1 semangka seberat 4 jeruk. 2 jeruk seberat 1 mangga. 1 semangka seberat berapa mangga?',
          langkah: ['1 semangka = 4 jeruk.', '4 jeruk = 2 kelompok yang masing-masing 2 jeruk = 2 mangga.', 'Jadi 1 semangka = <b>2 mangga</b>.'],
          nilai: 2, cek: '4/2', cek2: '(4*1)/2' }
      ],
      trik: [
        { judul: 'Tulis angka di bawah piring', isi: 'Hitung total berat tiap piring dan tulis di bawahnya. Setelah itu tinggal membandingkan dua angka.' },
        { judul: 'Coret benda yang sama', isi: 'Bila kedua piring sama-sama berisi benda yang sama, coret benda itu dari kedua sisi. Neraca tetap seimbang dan soal menjadi lebih mudah.' },
        { judul: 'Satu jenis saja', isi: 'Ganti semua benda menjadi satu jenis (misalnya semuanya menjadi jeruk) langkah demi langkah, lalu bandingkan.' },
        { judul: 'Samakan satuan', isi: '1 kg = 1.000 g. Ubah semuanya ke gram sebelum dijumlahkan, misalnya 1,5 kg = 1.500 g.' }
      ],
      latihan: [
        { soal: 'Piring kiri berisi 3 apel, masing-masing 150 g. Piring kanan berisi anak timbangan 500 g. Sisi mana yang turun?', jawab: 'Kanan turun (450 g < 500 g)', cara: '3 × 150 = 450; 450 < 500, jadi kanan lebih berat', nilai: 450, cek: '3*150', cek2: '150+150+150' },
        { soal: '2 kotak seimbang dengan 6 bola. 1 kotak seimbang dengan berapa bola?', jawab: '3 bola', cara: '6 : 2 = 3', nilai: 3, cek: '6/2', cek2: '3*2/2' },
        { soal: '1 nanas seberat 3 jeruk. 1 jeruk seberat 2 tomat. 1 nanas seberat berapa tomat?', jawab: '6 tomat', cara: '3 jeruk = 3 × 2 tomat = 6 tomat', nilai: 6, cek: '3*2', cek2: '2+2+2' },
        { soal: 'Piring kiri berisi 2 kotak sama berat dan anak timbangan 1 kg. Piring kanan berisi 5 kg. Neraca seimbang. Berapa berat 1 kotak?', jawab: '2 kg', cara: '5 − 1 = 4 kg untuk 2 kotak; 4 : 2 = 2', nilai: 2, cek: '(5-1)/2', cek2: '4/2' },
        { soal: 'Piring kiri berisi 1,5 kg beras. Piring kanan berisi 1.200 g gula dan 300 g garam. Bagaimana keadaan neraca?', jawab: 'Seimbang (1.500 g = 1.500 g)', cara: '1,5 kg = 1.500 g; 1.200 + 300 = 1.500', nilai: 1500, cek: '1.5*1000', cek2: '1200+300' },
        { soal: '3 buku seberat 1 kamus. Berat kamus 600 g. Berapa berat 1 buku?', jawab: '200 g', cara: '600 : 3 = 200', nilai: 200, cek: '600/3', cek2: '2*100' }
      ]
    },
    /* ------------------------------------------------------------------ 27 */
    {
      no: 27, p: 39,
      ringkas: [
        'Baca <b>judul</b> tabel atau diagram dulu: datanya tentang apa dan satuannya apa.',
        'Cari jawaban di <b>pertemuan baris dan kolom</b>. Telusuri dengan jari agar tidak salah baris.',
        'Banyak soal butuh <b>dua langkah</b>: menjumlah, mencari selisih, atau rata-rata.',
        '<b>Rata-rata</b> = jumlah semua data : banyak data.'
      ],
      gambar: S.tabel(['Hari', 'Kue A', 'Kue B'], [['Senin', 12, 8], ['Selasa', 15, 14], ['Rabu', 10, 16], ['Kamis', 18, 9]], 'Penjualan kue (bungkus)'),
      awas: 'Jangan berhenti di langkah pertama. Tulis dulu <b>apa yang ditanya</b>, lalu centang setiap langkah yang selesai.',
      contoh: [
        { soal: 'Dari tabel penjualan kue, berapa jumlah Kue A yang terjual dari Senin sampai Kamis?',
          langkah: ['Ambil kolom Kue A: 12, 15, 10, 18.', 'Jumlah = 12 + 15 + 10 + 18 = <b>55 bungkus</b>.'],
          nilai: 55, cek: '12+15+10+18', cek2: '[12,15,10,18].reduce((a,b)=>a+b)' },
        { soal: 'Pada hari apa selisih penjualan Kue A dan Kue B paling besar?',
          langkah: ['Senin 12 − 8 = 4. Selasa 15 − 14 = 1. Rabu 16 − 10 = 6. Kamis 18 − 9 = 9.', 'Selisih terbesar 9, yaitu hari <b>Kamis</b>.'],
          nilai: 9, cek: 'Math.max(12-8,15-14,16-10,18-9)', cek2: '18-9' }
      ],
      trik: [
        { judul: 'Tulis yang ditanya', isi: 'Sebelum menghitung, tulis di pojok kertas: "ditanya: jumlah/selisih/rata-rata …". Setelah selesai, cocokkan jawabanmu dengan tulisan itu.' },
        { judul: 'Tandai baris dan kolom', isi: 'Pakai dua jari: satu di baris, satu di kolom. Pada diagram ganda, perhatikan warna di keterangan (legenda) sebelum membaca batang.' },
        { judul: 'Rata-rata dua langkah', isi: 'Langkah 1: jumlahkan semua data. Langkah 2: bagi dengan banyak data. Contoh (18 + 26) : 2 = 44 : 2 = 22, bukan 44.' },
        { judul: 'Cek masuk akal', isi: 'Rata-rata selalu berada di antara data terkecil dan terbesar. Selisih tidak mungkin lebih besar daripada data yang terbesar.' }
      ],
      tabelLatihan: S.tabel(['Bulan', 'Dina', 'Raka'], [['Januari', 20, 15], ['Februari', 25, 30], ['Maret', 15, 20], ['April', 30, 25]], 'Tabungan (ribu rupiah)'),
      latihan: [
        { soal: 'Lihat tabel tabungan. Berapa total tabungan Dina dari Januari sampai April?', jawab: 'Rp90.000 (90 ribu)', cara: '20 + 25 + 15 + 30 = 90', nilai: 90, cek: '20+25+15+30', cek2: '[20,25,15,30].reduce((a,b)=>a+b)' },
        { soal: 'Pada bulan apa saja tabungan Raka lebih banyak daripada tabungan Dina?', jawab: 'Februari dan Maret', cara: 'Februari 30 > 25, Maret 20 > 15', nilai: 2, cek: '[[20,15],[25,30],[15,20],[30,25]].filter(x=>x[1]>x[0]).length', cek2: '2' },
        { soal: 'Berapa selisih total tabungan Dina dan Raka selama empat bulan?', jawab: 'Tidak ada selisih (keduanya 90 ribu)', cara: 'Dina 90, Raka 15 + 30 + 20 + 25 = 90; 90 − 90 = 0', nilai: 0, cek: '(20+25+15+30)-(15+30+20+25)', cek2: '90-90' },
        { soal: 'Berapa rata-rata tabungan Dina setiap bulan?', jawab: 'Rp22.500 (22,5 ribu)', cara: '90 : 4 = 22,5', nilai: 22.5, cek: '(20+25+15+30)/4', cek2: '90/4' },
        { soal: 'Berapa jumlah tabungan Dina dan Raka pada bulan April?', jawab: 'Rp55.000 (55 ribu)', cara: '30 + 25 = 55', nilai: 55, cek: '30+25', cek2: '55' },
        { soal: 'Nilai ulangan Sari 18 dan 26. Berapa rata-ratanya?', jawab: '22', cara: '(18 + 26) : 2 = 44 : 2 = 22', nilai: 22, cek: '(18+26)/2', cek2: '18+(26-18)/2' }
      ]
    },
    /* ------------------------------------------------------------------ 2 */
    {
      no: 2, p: 40,
      ringkas: [
        'Bilangan bisa ditulis sebagai <b>pecahan</b>, <b>desimal</b>, atau <b>persen</b>. Untuk mengurutkan, ubah semuanya ke <b>satu bentuk</b>, misalnya desimal.',
        'Pecahan → desimal: bagi pembilang dengan penyebut. [[5/8]] = 5 : 8 = 0,625.',
        'Persen → desimal: bagi 100. 55% = 0,55.',
        'Untuk ukuran, <b>samakan satuan</b> dulu: 0,6 m = 60 cm.'
      ],
      gambar: S.garisBilangan([['[[2/5]]', 0.4], ['55%', 0.55], ['0,6', 0.6], ['[[5/8]]', 0.625]]),
      awas: 'Lingkari kata <b>terbesar</b> atau <b>terkecil</b> di soal agar urutanmu tidak terbalik.',
      contoh: [
        { soal: 'Urutkan dari yang terkecil: 0,6 ; [[5/8]] ; 55% ; [[2/5]].',
          langkah: ['Ubah ke desimal: 0,6 = 0,600; [[5/8]] = 0,625; 55% = 0,550; [[2/5]] = 0,400.', 'Urutan dari terkecil: <b>[[2/5]], 55%, 0,6, [[5/8]]</b>.'],
          nilai: 1, cek: 'JSON.stringify([0.6,5/8,0.55,2/5].map((v,i)=>[v,i]).sort((a,b)=>a[0]-b[0]).map(x=>x[1]))==="[3,2,0,1]"?1:0', cek2: '(2/5<0.55 && 0.55<0.6 && 0.6<5/8)?1:0' },
        { soal: 'Urutkan dari yang terbesar: 65 cm ; 0,6 m ; [[3/4]] m.',
          langkah: ['Ubah ke cm: 65 cm; 0,6 m = 60 cm; [[3/4]] m = 75 cm.', 'Urutan dari terbesar: <b>[[3/4]] m, 65 cm, 0,6 m</b>.'],
          nilai: 1, cek: '(0.75*100>65 && 65>0.6*100)?1:0', cek2: '(75>65 && 65>60)?1:0' }
      ],
      trik: [
        { judul: 'Tabel ubahan', isi: 'Tulis setiap bilangan dalam satu baris, lalu tulis bentuk desimalnya tepat di bawahnya. Urutkan baris bawah, lalu salin bentuk aslinya.' },
        { judul: 'Hafalkan pecahan istimewa', isi: '[[1/2]] = 0,5 · [[1/4]] = 0,25 · [[3/4]] = 0,75 · [[1/5]] = 0,2 · [[2/5]] = 0,4 · [[1/8]] = 0,125 · [[1/10]] = 0,1.' },
        { judul: 'Samakan banyak angka di belakang koma', isi: '0,6 dan 0,55? Tulis 0,60 dan 0,55. Sekarang mudah terlihat 60 lebih besar daripada 55, jadi 0,6 lebih besar.' },
        { judul: 'Cek arah', isi: 'Setelah selesai, baca lagi soalnya: diminta dari terkecil atau dari terbesar? Bilangan pertama jawabanmu harus cocok.' }
      ],
      latihan: [
        { soal: 'Urutkan dari yang terkecil: 0,3 ; [[1/4]] ; 35% ; 0,32.', jawab: '[[1/4]], 0,3, 0,32, 35%', cara: '0,25 ; 0,30 ; 0,32 ; 0,35', nilai: 1, cek: '(1/4<0.3 && 0.3<0.32 && 0.32<0.35)?1:0', cek2: '(25<30 && 30<32 && 32<35)?1:0' },
        { soal: 'Manakah yang terbesar: [[3/5]] ; 0,65 ; 62%?', jawab: '0,65', cara: '0,60 ; 0,65 ; 0,62', nilai: 0.65, cek: 'Math.max(3/5,0.65,0.62)', cek2: '0.65' },
        { soal: 'Urutkan dari yang terbesar: 1,2 m ; 115 cm ; [[1 1/4]] m.', jawab: '[[1 1/4]] m, 1,2 m, 115 cm', cara: '125 cm ; 120 cm ; 115 cm', nilai: 1, cek: '(1.25*100>1.2*100 && 1.2*100>115)?1:0', cek2: '(125>120 && 120>115)?1:0' },
        { soal: 'Manakah yang nilainya sama dengan 0,75? (a) [[3/4]] (b) 7,5% (c) 75%', jawab: '(a) [[3/4]] dan (c) 75%', cara: '[[3/4]] = 0,75 ; 7,5% = 0,075 ; 75% = 0,75', nilai: 1, cek: '(3/4===0.75 && 75/100===0.75 && 7.5/100!==0.75)?1:0', cek2: '1' },
        { soal: 'Manakah yang terkecil: [[2/5]] ; 0,45 ; 38%?', jawab: '38%', cara: '0,40 ; 0,45 ; 0,38', nilai: 0.38, cek: 'Math.min(2/5,0.45,0.38)', cek2: '38/100' },
        { soal: 'Urutkan dari yang terkecil: [[7/10]] ; 0,07 ; 72%.', jawab: '0,07, [[7/10]], 72%', cara: '0,07 ; 0,70 ; 0,72', nilai: 1, cek: '(0.07<7/10 && 7/10<0.72)?1:0', cek2: '(7<70 && 70<72)?1:0' }
      ]
    },
    /* ------------------------------------------------------------------ 6 */
    {
      no: 6, p: 40,
      ringkas: [
        'Urutan menghitung: <b>kurung dulu</b>, lalu <b>kali dan bagi</b>, baru <b>tambah dan kurang</b>.',
        'Bilangan asli × pecahan: kalikan dengan pembilangnya. 3 × [[2/3]] = [[6/3]] = 2.',
        'Dibagi pecahan = <b>dikali kebalikannya</b>. 8 : [[1/2]] = 8 × 2 = 16.',
        'Tambah atau kurang pecahan: <b>samakan penyebut</b> dulu. Sederhanakan hasil akhirnya.'
      ],
      gambar: S.pecahanSetengah(),
      awas: 'Dibagi [[1/2]] hasilnya <b>lebih besar</b>, bukan lebih kecil. "Ada berapa setengah di dalam 8 kue?" Ada 16.',
      contoh: [
        { soal: 'Hitung 3 × [[2/3]] + [[1/2]].',
          langkah: ['Kali dulu: 3 × [[2/3]] = [[6/3]] = 2.', 'Lalu tambah: 2 + [[1/2]] = <b>[[2 1/2]]</b>.'],
          nilai: 2.5, cek: '3*(2/3)+1/2', cek2: '(6/3)+0.5' },
        { soal: 'Hitung 8 : [[1/2]].',
          langkah: ['Dibagi [[1/2]] sama dengan dikali 2.', '8 × 2 = <b>16</b>.'],
          nilai: 16, cek: '8/(1/2)', cek2: '8*2' }
      ],
      trik: [
        { judul: 'Lingkari × dan : dulu', isi: 'Sebelum menghitung, lingkari semua tanda × dan :. Kerjakan yang dilingkari, baru tambah dan kurang dari kiri ke kanan.' },
        { judul: 'Balik lalu kali', isi: 'Untuk membagi dengan pecahan, balik pecahannya lalu kalikan. 6 : [[1/3]] = 6 × 3 = 18.' },
        { judul: 'Sederhanakan sebelum mengali', isi: '12 × [[3/4]]: bagi dulu 12 : 4 = 3, lalu 3 × 3 = 9. Angkanya tetap kecil dan jarang salah.' },
        { judul: 'Cek masuk akal', isi: 'Dikali pecahan yang kurang dari 1 → hasilnya lebih kecil. Dibagi pecahan yang kurang dari 1 → hasilnya lebih besar.' }
      ],
      latihan: [
        { soal: 'Hitung 12 × [[3/4]] − 2.', jawab: '7', cara: '12 × [[3/4]] = 9; 9 − 2 = 7', nilai: 7, cek: '12*(3/4)-2', cek2: '(12/4)*3-2' },
        { soal: 'Hitung 6 : [[1/3]].', jawab: '18', cara: '6 × 3 = 18', nilai: 18, cek: '6/(1/3)', cek2: '6*3' },
        { soal: 'Hitung [[1/2]] + 2 × [[1/4]].', jawab: '1', cara: '2 × [[1/4]] = [[1/2]]; [[1/2]] + [[1/2]] = 1', nilai: 1, cek: '1/2+2*(1/4)', cek2: '0.5+0.5' },
        { soal: 'Hitung 5 − [[3/4]] × 4.', jawab: '2', cara: '[[3/4]] × 4 = 3; 5 − 3 = 2', nilai: 2, cek: '5-(3/4)*4', cek2: '5-3' },
        { soal: 'Hitung ([[2/3]] + [[1/3]]) × 5.', jawab: '5', cara: '[[2/3]] + [[1/3]] = 1; 1 × 5 = 5', nilai: 5, cek: '(2/3+1/3)*5', cek2: '1*5' },
        { soal: 'Ibu punya 3 kg gula. Gula dimasukkan ke kantong-kantong yang masing-masing berisi [[1/4]] kg. Berapa kantong yang terisi?', jawab: '12 kantong', cara: '3 : [[1/4]] = 3 × 4 = 12', nilai: 12, cek: '3/(1/4)', cek2: '3*4' }
      ]
    },
    /* ------------------------------------------------------------------ 17 */
    {
      no: 17, p: 40,
      ringkas: [
        '<b>Volume</b> = banyak kubus satuan yang dapat mengisi sebuah bangun.',
        'Volume balok = <b>panjang × lebar × tinggi</b>: satu lapis (panjang × lebar), dikali banyak lapis (tinggi).',
        '1 liter = 1.000 mL = 1 dm³. 1 cm³ = 1 mL.',
        'Gelas ukur: hitung dulu <b>nilai satu garis</b> = isi penuh : banyak bagian, baru baca tinggi air.'
      ],
      gambar: S.gelasUkur(5, 3, '2 L'),
      awas: 'Volume memakai <b>tiga</b> ukuran. Jangan berhenti di panjang × lebar.',
      contoh: [
        { soal: 'Balok disusun dari kubus satuan: panjang 4, lebar 2, tinggi 3. Berapa volumenya?',
          langkah: ['Satu lapis: 4 × 2 = 8 kubus.', 'Ada 3 lapis: 8 × 3 = <b>24 kubus satuan</b>.'],
          nilai: 24, cek: '4*2*3', cek2: '8+8+8' },
        { soal: 'Gelas ukur berisi penuh 2 liter dibagi menjadi 5 bagian sama. Air sampai garis ke-3. Berapa mL air di dalamnya?',
          langkah: ['2 liter = 2.000 mL. Satu garis = 2.000 : 5 = 400 mL.', 'Air sampai garis ke-3: 3 × 400 = <b>1.200 mL</b>.'],
          nilai: 1200, cek: '3*(2000/5)', cek2: '2000*3/5' }
      ],
      trik: [
        { judul: 'Lapis demi lapis', isi: 'Hitung satu lapis paling bawah, lalu kalikan dengan banyak lapis. Cara ini juga berlaku untuk menghitung kubus yang masih kurang.' },
        { judul: 'Nilai satu garis', isi: 'Pada gelas ukur atau botol berskala, tulis nilai satu garis di samping gambar sebelum membaca tinggi air.' },
        { judul: 'Ingat 1 dm³ = 1 liter', isi: 'Akuarium 50 cm × 30 cm × 20 cm = 30.000 cm³ = 30.000 mL = 30 liter.' },
        { judul: 'Tinggi air, bukan tinggi wadah', isi: 'Bila wadah hanya terisi sebagian, kalikan dengan tinggi airnya, bukan tinggi wadahnya.' }
      ],
      latihan: [
        { soal: 'Balok dari kubus satuan berukuran 5 × 4 × 2. Berapa volumenya?', jawab: '40 kubus satuan', cara: '5 × 4 = 20; 20 × 2 = 40', nilai: 40, cek: '5*4*2', cek2: '20+20' },
        { soal: 'Kubus dengan 3 kubus satuan pada setiap rusuknya. Berapa volumenya?', jawab: '27 kubus satuan', cara: '3 × 3 × 3 = 27', nilai: 27, cek: '3**3', cek2: '9*3' },
        { soal: 'Botol 1 liter memiliki 4 garis skala yang sama jaraknya (garis ke-4 = penuh). Air sampai garis ke-2. Berapa mL air?', jawab: '500 mL', cara: '1.000 : 4 = 250; 2 × 250 = 500', nilai: 500, cek: '2*(1000/4)', cek2: '1000/2' },
        { soal: 'Kotak berukuran 6 × 3 × 2 kubus satuan sudah berisi 20 kubus. Berapa kubus lagi yang diperlukan agar penuh?', jawab: '16 kubus', cara: '6 × 3 × 2 = 36; 36 − 20 = 16', nilai: 16, cek: '6*3*2-20', cek2: '36-20' },
        { soal: 'Akuarium berukuran panjang 50 cm, lebar 30 cm, tinggi 40 cm diisi air setinggi 20 cm. Berapa liter air di dalamnya?', jawab: '30 liter', cara: '50 × 30 × 20 = 30.000 cm³ = 30 liter', nilai: 30, cek: '50*30*20/1000', cek2: '(50*30*40/1000)/2' },
        { soal: 'Satu lapis berisi 3 × 4 kubus satuan dan ada 5 lapis. Berapa volumenya?', jawab: '60 kubus satuan', cara: '3 × 4 = 12; 12 × 5 = 60', nilai: 60, cek: '3*4*5', cek2: '12*5' }
      ]
    },
    /* ------------------------------------------------------------------ 29 */
    {
      no: 29, p: 41,
      ringkas: [
        'Data bisa disajikan dengan <b>turus</b>, <b>tabel</b>, <b>piktogram</b>, atau <b>diagram batang</b>.',
        'Pada piktogram, <b>satu gambar mewakili beberapa benda</b>. Lihat keterangannya, misalnya 1 ⭐ = 4 buku.',
        'Setengah gambar = setengah dari nilai satu gambar.',
        'Tinggi batang pada diagram harus sesuai dengan angka di tabel. Perhatikan skala sumbu tegaknya.'
      ],
      gambar: S.piktogram([['Dina', 3.5], ['Raka', 2], ['Sari', 4]], 4, 'buku'),
      awas: 'Satu gambar <b>bukan</b> satu benda. Tulis keterangan skala di samping piktogram sebelum menghitung.',
      contoh: [
        { soal: 'Pada piktogram, 1 ⭐ = 4 buku. Dina mendapat 3 ⭐ dan setengah ⭐. Berapa buku yang dibaca Dina?',
          langkah: ['3 ⭐ = 3 × 4 = 12 buku.', 'Setengah ⭐ = 4 : 2 = 2 buku.', 'Jumlah = 12 + 2 = <b>14 buku</b>.'],
          nilai: 14, cek: '3.5*4', cek2: '3*4+4/2' },
        { soal: 'Hasil turus warna kesukaan: merah ||||| || (7), biru |||| (4), hijau ||||| (5). Berapa siswa seluruhnya?',
          langkah: ['Ubah turus ke angka: merah 7, biru 4, hijau 5.', 'Jumlah = 7 + 4 + 5 = <b>16 siswa</b>.'],
          nilai: 16, cek: '7+4+5', cek2: '5+2+4+5' }
      ],
      trik: [
        { judul: 'Tulis skala dulu', isi: 'Sebelum membaca piktogram, tulis besar-besar di samping: "1 gambar = …". Kalikan banyak gambar dengan angka itu.' },
        { judul: 'Setengah gambar', isi: 'Setengah gambar bernilai setengah skala. Bila 1 gambar = 10, setengah gambar = 5.' },
        { judul: 'Menggambar piktogram', isi: 'Untuk menyajikan 35 benda dengan 1 gambar = 5, bagi 35 : 5 = 7 gambar.' },
        { judul: 'Cek batang dengan tabel', isi: 'Bandingkan tinggi setiap batang dengan angka di tabel satu per satu. Batang yang tingginya tidak sama dengan angkanya adalah batang yang salah.' }
      ],
      latihan: [
        { soal: 'Pada piktogram, 1 🍎 = 10 apel. Kebun A mendapat 4 🍎. Berapa apel di kebun A?', jawab: '40 apel', cara: '4 × 10 = 40', nilai: 40, cek: '4*10', cek2: '10+10+10+10' },
        { soal: '1 ⭐ = 4 buku. Raka mendapat 2 ⭐ dan setengah ⭐. Berapa buku yang dibaca Raka?', jawab: '10 buku', cara: '2 × 4 + 2 = 10', nilai: 10, cek: '2.5*4', cek2: '2*4+4/2' },
        { soal: 'Tabel: kelas A 12 siswa, kelas B 8 siswa. Pada diagram batang, batang kelas A setinggi 12 dan batang kelas B setinggi 10. Batang mana yang salah?', jawab: 'Batang kelas B (seharusnya 8)', cara: 'A: 12 = 12 cocok; B: 10 ≠ 8', nilai: 8, cek: '8', cek2: '12-4' },
        { soal: 'Turus ||||| ||||| ||| menunjukkan angka berapa?', jawab: '13', cara: '5 + 5 + 3 = 13', nilai: 13, cek: '5+5+3', cek2: '2*5+3' },
        { soal: 'Kamu akan menggambar piktogram 35 kelereng dengan 1 gambar = 5 kelereng. Berapa gambar yang diperlukan?', jawab: '7 gambar', cara: '35 : 5 = 7', nilai: 7, cek: '35/5', cek2: '7' },
        { soal: 'Tabel jajan sehat: Senin 15, Selasa 9, Rabu 12, Kamis 6 bungkus. Berapa bungkus seluruhnya?', jawab: '42 bungkus', cara: '15 + 9 + 12 + 6 = 42', nilai: 42, cek: '15+9+12+6', cek2: '[15,9,12,6].reduce((a,b)=>a+b)' }
      ]
    },
    /* ------------------------------------------------------------------ 12 */
    {
      no: 12, p: 43,
      ringkas: [
        '<b>KPK</b> (kelipatan persekutuan terkecil) dipakai untuk soal <b>"bersamaan lagi"</b>, "serentak", "bertemu lagi".',
        '<b>FPB</b> (faktor persekutuan terbesar) dipakai untuk soal <b>"dibagi sama banyak, sebanyak-banyaknya"</b>.',
        'Cara mudah KPK: tulis kelipatan bilangan terbesar, cari yang juga habis dibagi bilangan lain.',
        'Untuk tanggal: tanggal bersama lagi = tanggal awal <b>+ KPK</b>. Perhatikan jumlah hari dalam bulan.'
      ],
      gambar: S.kelipatan(6, 8, 24),
      awas: 'Hasil KPK adalah <b>selang waktunya</b>. Tambahkan ke tanggal atau jam awal: bersama 2 Juni, KPK 12 hari → 14 Juni.',
      contoh: [
        { soal: 'Lampu merah berkedip setiap 6 detik, lampu biru setiap 8 detik. Keduanya berkedip bersama. Setelah berapa detik keduanya berkedip bersama lagi?',
          langkah: ['Kelipatan 8: 8, 16, <b>24</b>, … Yang juga kelipatan 6 adalah 24.', 'KPK = 24, jadi bersama lagi setelah <b>24 detik</b>.'],
          nilai: 24, cek: 'kpk(6,8)', cek2: '6*8/fpb(6,8)' },
        { soal: '24 apel dan 36 jeruk dibagikan sama banyak ke dalam kantong sebanyak-banyaknya. Berapa kantong, dan apa isi tiap kantong?',
          langkah: ['FPB dari 24 dan 36 adalah 12. Jadi ada <b>12 kantong</b>.', 'Tiap kantong: 24 : 12 = 2 apel dan 36 : 12 = 3 jeruk.'],
          nilai: 12, cek: 'fpb(24,36)', cek2: '[...Array(24).keys()].map(i=>i+1).filter(d=>24%d===0&&36%d===0).pop()' }
      ],
      trik: [
        { judul: 'Kata kunci', isi: '"Bersamaan lagi, serentak, bertemu lagi, berbunyi bersama" → <b>KPK</b>. "Dibagi sama banyak, sebanyak-banyaknya, paling banyak kelompok" → <b>FPB</b>.' },
        { judul: 'KPK cepat', isi: 'Tulis kelipatan bilangan yang <b>terbesar</b> saja: 8, 16, 24, … Berhenti di bilangan pertama yang juga habis dibagi bilangan lainnya.' },
        { judul: 'FPB cepat', isi: 'Mulai dari bilangan yang <b>terkecil</b>, lalu turun: apakah keduanya habis dibagi? 24 dan 36: 24? tidak; 12? ya → FPB 12.' },
        { judul: 'Tanggal dan jam', isi: 'Tambahkan KPK ke tanggal awal. Bila lewat akhir bulan, kurangi jumlah hari bulan itu: 25 Januari + 10 hari = 35 − 31 = 4 Februari.' }
      ],
      latihan: [
        { soal: 'Berapa KPK dari 4 dan 6?', jawab: '12', cara: 'kelipatan 6: 6, 12 → 12 habis dibagi 4', nilai: 12, cek: 'kpk(4,6)', cek2: '4*6/fpb(4,6)' },
        { soal: 'Berapa FPB dari 18 dan 24?', jawab: '6', cara: 'faktor 18: 1, 2, 3, 6, 9, 18; faktor 24: 1, 2, 3, 4, 6, 8, 12, 24 → terbesar yang sama: 6', nilai: 6, cek: 'fpb(18,24)', cek2: '18*24/kpk(18,24)' },
        { soal: 'Dina les setiap 3 hari, Raka setiap 4 hari. Mereka les bersama pada 5 Maret. Kapan mereka les bersama lagi?', jawab: '17 Maret', cara: 'KPK 3 dan 4 = 12; 5 + 12 = 17', nilai: 17, cek: '5+kpk(3,4)', cek2: '5+12' },
        { soal: '30 pensil dan 45 buku dibagikan sama banyak kepada anak-anak sebanyak-banyaknya. Berapa anak yang mendapat bagian, dan apa yang didapat tiap anak?', jawab: '15 anak; tiap anak 2 pensil dan 3 buku', cara: 'FPB 30 dan 45 = 15; 30 : 15 = 2; 45 : 15 = 3', nilai: 15, cek: 'fpb(30,45)', cek2: '30*45/kpk(30,45)' },
        { soal: 'Bus A berangkat setiap 10 menit, bus B setiap 15 menit. Keduanya berangkat bersama pukul 07.00. Pukul berapa keduanya berangkat bersama lagi?', jawab: 'Pukul 07.30', cara: 'KPK 10 dan 15 = 30 menit; 07.00 + 30 menit = 07.30', nilai: 30, cek: 'kpk(10,15)', cek2: '10*15/fpb(10,15)' },
        { soal: 'Dua kegiatan berlangsung bersama pada 25 Januari. KPK jadwalnya 10 hari. Kapan bersama lagi? (Januari ada 31 hari.)', jawab: '4 Februari', cara: '25 + 10 = 35; 35 − 31 = 4 → 4 Februari', nilai: 4, cek: '25+10-31', cek2: 'new Date(2027,0,25+10).getDate()' }
      ]
    }
  ]
};
