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
2.  **Certainty Factor (CF):** Digunakan untuk menghitung tingkat keyakinan diagnosis. Model perhitungan didasarkan pada Paper 3, di mana **CF Gejala** dihitung terlebih dahulu (`CF_Pakar * CF_User`), kemudian digabungkan menggunakan rumus `CFcombine = CF1 + CF2 * (1 - CF1)`.

## Struktur Proyek

Berikut adalah struktur folder dari proyek ini:
