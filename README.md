# Ruang Belajar — Pengantar Bisnis Digital

Website pembelajaran statis untuk enam pertemuan materi. Seluruh materi terstruktur berada di `courseData.js`; tampilan dan interaksi berada di `app.js` dan `styles.css`.

## Menjalankan

Di Termux atau lingkungan yang memiliki Node.js:

```sh
npm start
```

Buka `http://localhost:4173` di browser. Server menggunakan Node.js bawaan tanpa paket tambahan. Alternatifnya, jalankan `python3 -m http.server 4173` dari direktori ini.

Progress baca, pilihan tema, dan jawaban kuis disimpan di `localStorage` browser.

## Isi

- Dashboard studi, navigasi enam pertemuan, progress tracker, dan pencarian `Ctrl/Cmd + K`.
- Tampilan materi lengkap atau ringkasan ujian untuk setiap pertemuan.
- Visualisasi interaktif khusus untuk keenam modul, flashcards, dan mini quiz dengan pembahasan.
- Tema editorial terang dan gelap.

Materi disarikan dari PDF pertemuan 1–6 yang berada di direktori ini. Untuk menjaga ketepatan sumber, metode SWOT/kompetitif tidak ditambahkan pada modul 6 karena file sumber hanya membahas BMC dan konsistensi/fit antarkomponen.
