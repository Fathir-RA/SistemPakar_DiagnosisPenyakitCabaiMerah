# Sistem Pakar Diagnosis Penyakit Cabai Merah

Proyek ini adalah implementasi sistem pakar berbasis web sederhana untuk mendiagnosis penyakit pada tanaman cabai merah. Sistem ini dibuat menggunakan HTML, CSS (inline), dan JavaScript murni (Vanilla JS).

Sistem menggunakan metode inferensi **Forward Chaining** dan kalkulasi keyakinan **Certainty Factor (CF)** untuk memberikan diagnosis berdasarkan gejala yang dipilih oleh pengguna.

## Konteks Tugas

Proyek ini dibuat untuk memenuhi tugas akademis yang mengharuskan replikasi sistem pakar dari penelitian ilmiah. Syarat utama tugas adalah:
1.  Mereplikasi sistem pakar dari sumber ilmiah.
2.  Menggunakan metode **Forward Chaining** dan **Certainty Factor (CF)**.
3.  Basis pengetahuan (`rules.json`) wajib mengandung **Aturan Paralel** dan/atau **Aturan Sekuensial**.

## Metodologi

Sistem ini bekerja dengan dua komponen utama yang ada di dalam folder `inference_engine/`:

1.  **Forward Chaining:** Digunakan sebagai mesin inferensi. Sistem memulai dengan fakta (gejala yang diinput pengguna) dan menelusuri aturan (`rules.json`) secara berulang (loop) untuk menemukan semua kesimpulan (penyakit) yang mungkin. Mesin ini mendukung aturan sekuensial (aturan yang premisnya adalah hasil dari aturan lain).
2.  **Certainty Factor (CF):** Digunakan untuk menghitung tingkat keyakinan diagnosis. [cite_start]Model perhitungan didasarkan pada Paper 3, di mana **CF Gejala** dihitung terlebih dahulu (`CF_Pakar * CF_User`), kemudian digabungkan menggunakan rumus `CFcombine = CF1 + CF2 * (1 - CF1)` [cite: 599-601].

## Basis Pengetahuan (Knowledge Base)

Basis pengetahuan (semua file di dalam folder `rules/`) diekstrak dari paper acuan. Sesuai syarat tugas, file `rules.json` telah **dimodifikasi** dari sumber aslinya untuk menyertakan:

* **Aturan Paralel:**
    * `R_K003_A` dan `R_K003_B` (keduanya menghasilkan penyakit `K003`).
    * `R_K004_A` dan `R_SEQ_K004_B` (keduanya menghasilkan penyakit `K004`).
    * Ini adalah dua atau lebih aturan berbeda yang menghasilkan satu kesimpulan yang sama.

* **Aturan Sekuensial:**
    * Aturan `R_SEQ_K004_B`.
    * Aturan ini memiliki premis `"K006"`, yang merupakan hasil (konklusi) dari aturan `R_K006`. Ini menjadikannya aturan berantai yang hanya bisa aktif setelah `R_K006` terbukti.

## Cara Menjalankan

Aplikasi ini **tidak bisa dijalankan** dengan langsung membuka file `ui/index.html` (klik dua kali) dari komputer Anda.

Ini dikarenakan aplikasi menggunakan `fetch()` API untuk memuat file `.json`, yang akan diblokir oleh kebijakan keamanan browser (CORS) jika tidak dijalankan melalui server.

**Cara menjalankannya adalah dengan menggunakan web server lokal.**

### Cara Termudah (via VSCode):

1.  Buka proyek ini di VSCode.
2.  Pastikan Anda memiliki ekstensi [**Live Server**](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer).
3.  Di panel explorer VSCode, klik kanan pada file `ui/index.html`.
4.  Pilih **"Open with Live Server"**.
5.  Browser akan terbuka secara otomatis dengan alamat yang benar (contoh: `http://127.0.0.1:5500/ui/`) dan aplikasi akan berjalan.

## Sumber Acuan (Penelitian)

Seluruh data gejala, penyakit, aturan awal, dan nilai CF Pakar diekstrak dari penelitian berikut:

> Agus, F., Wulandari, H. E., & Astuti, I. F. (2017). **Expert System With Certainty Factor For Early Diagnosis Of Red Chili Peppers Diseases**. [cite_start]*Journal of Applied Intelligent System, 2*(2), 52-66. [cite: 437-621]
