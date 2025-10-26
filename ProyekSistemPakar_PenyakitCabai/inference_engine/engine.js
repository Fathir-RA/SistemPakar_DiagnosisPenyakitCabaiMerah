/**
 * Menggabungkan dua nilai Certainty Factor (CF)
 * Ini adalah rumus inti dari paper 
 * CFcombine = CF1 + CF2 * (1 - CF1)
 */
function cfCombine(cf1, cf2) {
    // Memastikan perhitungan untuk nilai positif
    if (cf1 >= 0 && cf2 >= 0) {
        return cf1 + cf2 * (1 - cf1);
    }
    // (Bisa ditambahkan logika untuk CF negatif jika perlu, 
    // tapi berdasarkan paper, kita hanya menangani nilai positif)
    return 0; 
}


/**
 * FUNGSI UTAMA: JALANKAN INFERENCE ENGINE
 * Ini adalah fungsi "otak" yang akan dipanggil oleh app.js
 *
 * @param {Array} inputPengguna - Daftar gejala yang dipilih user, cth: [{id: 'G01', cf_pakar: 0.6, cf_user: 0.8}, ...]
 * @param {Array} allRules - Daftar semua aturan dari rules.json
 * @returns {Array} - Daftar hasil diagnosis, cth: [{id: 'K003', cf: 0.75}, ...]
 */
function jalankanInferenceEngine(inputPengguna, allRules) {
    
    // --- 1. INISIALISASI ---

    // `factBaseCF` adalah "meja kerja" kita. 
    // Isinya adalah semua fakta yang kita ketahui (gejala + penyakit) dan nilai CF-nya.
    let factBaseCF = {};

    // `finalDiseaseCFs` menyimpan hasil akhir CF untuk setiap penyakit.
    // Ini penting untuk menggabungkan aturan PARALEL.
    let finalDiseaseCFs = {};

    // `firedRuleIDs` untuk melacak aturan yang sudah dieksekusi agar tidak berulang.
    let firedRuleIDs = new Set();

    // Pertama, isi `factBaseCF` dengan input dari pengguna
    // Ini adalah langkah perhitungan pertama di paper 
    // CF_Gejala = CF_Pakar * CF_User
    inputPengguna.forEach(input => {
        const cfGejala = input.cf_pakar * input.cf_user;
        factBaseCF[input.id] = cfGejala;
    });

    console.log("Fact Base Awal (Gejala):", factBaseCF);


    // --- 2. PROSES FORWARD CHAINING (BERULANG) ---

    let faktaBaruDitemukan = true; // Flag untuk loop
    
    // Kita gunakan do...while untuk memastikan loop berjalan setidaknya satu kali
    do {
        faktaBaruDitemukan = false;

        // Iterasi melalui semua aturan di basis pengetahuan
        for (const rule of allRules) {
            
            // Cek apakah aturan ini sudah dieksekusi
            if (firedRuleIDs.has(rule.id)) {
                continue; // Lanjut ke aturan berikutnya
            }

            // Cek apakah SEMUA premis (gejala 'if') ada di 'factBaseCF'
            const isReadyToFire = rule.if.every(premiseId => {
                return factBaseCF[premiseId] !== undefined;
            });

            // Jika tidak siap (gejala kurang) ATAU sudah dieksekusi, lewati
            if (!isReadyToFire) {
                continue; 
            }

            // --- Aturan SIAP DIEKSEKUSI ---
            console.log(`Aturan ${rule.id} siap dieksekusi.`);
            faktaBaruDitemukan = true;
            firedRuleIDs.add(rule.id);

            // 1. Ambil nilai CF dari semua premis
            const premiseCFs = rule.if.map(premiseId => factBaseCF[premiseId]);

            // 2. Hitung CF untuk aturan ini
            // Kita gabungkan semua CF premisnya satu per satu
            // cth: CF(G1+G2+G3) = cfCombine(cfCombine(CF(G1), CF(G2)), CF(G3))
            const cfRule = premiseCFs.reduce((acc, cf) => cfCombine(acc, cf), 0); // Mulai dari 0

            const disease = rule.then;

            // 3. LOGIKA PARALEL:
            // Cek apakah penyakit ini sudah ada di hasil akhir (ditemukan oleh aturan lain)
            const cfOld = finalDiseaseCFs[disease] || 0; // Ambil CF lama, atau 0 jika baru

            // Gabungkan CF lama dengan CF aturan baru ini
            const cfNew = cfCombine(cfOld, cfRule);
            
            // Simpan hasil gabungan (paralel)
            finalDiseaseCFs[disease] = cfNew;

            // 4. LOGIKA SEKUENSIAL:
            // Tambahkan hasil ini ke 'factBaseCF' agar bisa digunakan oleh aturan lain
            // pada putaran loop berikutnya.
            factBaseCF[disease] = cfNew; 
        }

    } while (faktaBaruDitemukan); // Ulangi jika ada aturan baru yang dieksekusi


    // --- 3. FORMAT HASIL AKHIR ---
    console.log("Hasil Akhir (CFs):", finalDiseaseCFs);

    // Ubah format objek {K001: 0.8, K003: 0.7} menjadi array [{id: 'K001', cf: 0.8}, ...]
    const hasilArray = Object.keys(finalDiseaseCFs).map(diseaseId => {
        return {
            id: diseaseId,
            cf: finalDiseaseCFs[diseaseId]
        };
    });

    return hasilArray;
}