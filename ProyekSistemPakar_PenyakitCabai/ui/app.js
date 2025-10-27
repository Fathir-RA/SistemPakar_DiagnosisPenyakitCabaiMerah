document.addEventListener('DOMContentLoaded', () => {

    // --- 1. AMBIL REFERENSI ELEMEN ---
    
    // Empat "Page" utama
    const pageSelamatDatang = document.getElementById('page-selamat-datang');
    const pagePilihGejala = document.getElementById('page-pilih-gejala');
    const pageTingkatKeyakinan = document.getElementById('page-tingkat-keyakinan');
    const pageHasil = document.getElementById('page-hasil');

    // Tombol-tombol navigasi
    const btnMulai = document.getElementById('btn-mulai');
    const btnLanjutKeyakinan = document.getElementById('btn-lanjut-keyakinan');
    const btnDiagnosis = document.getElementById('btn-diagnosis');
    const btnDiagnosisLagi = document.getElementById('btn-diagnosis-lagi');
    const btnKembaliGejala = document.getElementById('btn-kembali-gejala'); // Tombol Kembali

    // Kontainer dinamis
    const gejalaContainer = document.getElementById('gejala-container');
    const gejalaLoading = document.getElementById('gejala-loading');
    const gejalaError = document.getElementById('gejala-error');
    
    const keyakinanContainer = document.getElementById('keyakinan-container');
    const keyakinanError = document.getElementById('keyakinan-error');

    const hasilList = document.getElementById('hasil-list');
    const hasilLoading = document.getElementById('hasil-loading');
    const hasilPlaceholder = document.getElementById('hasil-placeholder');
    
    // --- 2. VARIABEL GLOBAL (STATE) ---

    // Variabel untuk menyimpan data dari JSON
    let allGejala = [];
    let allRules = [];
    let allDiseases = [];
    
    // Variabel untuk menyimpan pilihan user
    let selectedGejalaObjects = [];
    let finalUserInput = []; // inputPengguna untuk engine

    // --- 3. LOGIKA NAVIGASI (PINDAH HALAMAN) ---

    function showPage(pageIdToShow) {
        // Sembunyikan semua page dulu
        pageSelamatDatang.style.display = 'none';
        pagePilihGejala.style.display = 'none';
        pageTingkatKeyakinan.style.display = 'none';
        pageHasil.style.display = 'none';

        // Tampilkan page yang diminta
        const pageToShow = document.getElementById(pageIdToShow);
        if (pageToShow) {
            pageToShow.style.display = 'block';
        }
    }

    // --- 4. EVENT LISTENER UNTUK TOMBOL ---
    
    // Tombol "Mulai" (Fase 1 -> Fase 2)
    btnMulai.addEventListener('click', () => {
        showPage('page-pilih-gejala');
        // Panggil fungsi hanya jika belum dimuat
        if (allGejala.length === 0) {
            loadGejala(); 
        }
    });

    // Tombol "Lanjut" (Fase 2 -> Fase 3)
    btnLanjutKeyakinan.addEventListener('click', () => {
        // 1. Kumpulkan gejala yang dicentang
        const checkedGejalaIds = [];
        gejalaContainer.querySelectorAll('input[type="checkbox"]:checked').forEach(cb => {
            checkedGejalaIds.push(cb.dataset.id);
        });

        // 2. Validasi: Cek apakah user memilih setidaknya 1 gejala
        if (checkedGejalaIds.length === 0) {
            gejalaError.style.display = 'block';
            return;
        } else {
            gejalaError.style.display = 'none';
        }

        // 3. Simpan objek gejala yang dipilih ke variabel global
        selectedGejalaObjects = allGejala.filter(gejala => 
            checkedGejalaIds.includes(String(gejala.id)) 
        );

        // 4. Render halaman keyakinan berdasarkan gejala yang dipilih
        renderKeyakinan();
        
        // 5. Pindah ke halaman keyakinan
        showPage('page-tingkat-keyakinan');
    });

    // Tombol "Kembali" (Fase 3 -> Fase 2)
    btnKembaliGejala.addEventListener('click', () => {
        // Cukup kembali ke halaman pilih gejala
        // Pilihan centang masih tersimpan di sana
        showPage('page-pilih-gejala');
    });

    // Tombol "Mulai Diagnosis" (Fase 3 -> Fase 4)
    btnDiagnosis.addEventListener('click', () => {
        // 1. Kumpulkan input CF dari user
        finalUserInput = []; // Kosongkan dulu
        let semuaCfTerisi = true;

        selectedGejalaObjects.forEach(gejala => {
            const cfUser = parseFloat(document.getElementById(`cf-${gejala.id}`).value);
            
            if (cfUser === 0) { // Jika user memilih "Pilih Keyakinan" (value 0)
                semuaCfTerisi = false;
            } else {
                finalUserInput.push({ 
                    id: gejala.id, 
                    cf_pakar: gejala.cf_pakar, // <-- Data dari symptoms.json
                    cf_user: cfUser             // <-- Data dari dropdown
                });
            }
        });

        // 2. Validasi: Cek apakah semua dropdown sudah diisi
        if (!semuaCfTerisi) {
            keyakinanError.style.display = 'block';
            return;
        } else {
            keyakinanError.style.display = 'none';
        }

        // 3. Tampilkan UI loading
        hasilLoading.style.display = 'block';
        hasilList.innerHTML = ''; // Kosongkan hasil lama
        hasilPlaceholder.style.display = 'none';

        // 4. Pindah ke halaman hasil
        showPage('page-hasil'); 
        
        // 5. Panggil fungsi diagnosis
        setTimeout(runDiagnosis, 500); 
    });

    // Tombol "Diagnosis Ulang" (Fase 4 -> Fase 2)
    btnDiagnosisLagi.addEventListener('click', () => {
        // Reset UI
        gejalaContainer.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = false);
        keyakinanContainer.innerHTML = ''; // Kosongkan dropdown
        hasilList.innerHTML = '';
        hasilPlaceholder.style.display = 'block';

        // Reset Umpan Balik Visual
        gejalaContainer.querySelectorAll('.gejala-item.terpilih').forEach(item => {
            item.classList.remove('terpilih');
        });
        
        // Reset State
        selectedGejalaObjects = [];
        finalUserInput = [];

        // Kembali ke halaman pilih gejala
        showPage('page-pilih-gejala');
    });


    // --- 5. LOGIKA APLIKASI INTI (MEMUAT, MERENDER, MENGHITUNG) ---
    
    /**
     * Memuat daftar gejala dari symptoms.json
     */
    async function loadGejala() {
        gejalaLoading.style.display = 'block'; // Tampilkan "Memuat..."
        try {
            const response = await fetch('../rules/symptoms.json'); 
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            allGejala = await response.json();
            
            // Sembunyikan loading, tampilkan gejala
            gejalaLoading.style.display = 'none';
            renderGejala();

        } catch (error) {
            console.error('Error memuat gejala:', error);
            gejalaLoading.textContent = 'Gagal memuat daftar gejala. Cek console (F12) untuk detail.';
        }
    }

    /**
     * Memuat Aturan & Penyakit saat aplikasi pertama kali dibuka
     */
    async function loadCoreData() {
        try {
            const rulesResponse = await fetch('../rules/rules.json');
            allRules = await rulesResponse.json();

            const diseasesResponse = await fetch('../rules/diseases.json');
            allDiseases = await diseasesResponse.json();
            
            console.log("Data Aturan & Penyakit siap.");
        } catch (error) {
            console.error('Error memuat data inti (aturan/penyakit):', error);
            // Nonaktifkan aplikasi jika data inti gagal dimuat
            pageSelamatDatang.innerHTML = '<h1>Error</h1><p>Gagal memuat data inti (rules.json / diseases.json). Aplikasi tidak dapat berjalan. Cek path file di F12 Console.</p>';
        }
    }


    /**
     * Menampilkan gejala ke HTML
     */
    function renderGejala() {
        gejalaContainer.innerHTML = ''; // Hapus pesan "Memuat..."
        
        allGejala.forEach(gejala => {
            const item = document.createElement('div');
            item.className = 'gejala-item';

            // 'for' dihapus dari tag <label>
            item.innerHTML = `
                <input type="checkbox" id="${gejala.id}" data-id="${gejala.id}">
                <label>${gejala.name} (${gejala.id})</label>
            `;
            // =============================

            // Logika Umpan Balik Visual
            const checkbox = item.querySelector('input[type="checkbox"]');
            
            checkbox.addEventListener('change', () => {
                item.classList.toggle('terpilih', checkbox.checked);
            });

            item.addEventListener('click', (e) => {
                // Tidak jalankan jika yang diklik adalah checkbox-nya sendiri
                if (e.target.tagName !== 'INPUT') { 
                    checkbox.checked = !checkbox.checked;
                    checkbox.dispatchEvent(new Event('change')); 
                }
            });

            gejalaContainer.appendChild(item);
        });
    }

    /**
     * Menampilkan dropdown keyakinan berdasarkan gejala yang dipilih
     */
    function renderKeyakinan() {
        keyakinanContainer.innerHTML = ''; // Hapus isi lama
        keyakinanError.style.display = 'none'; // Sembunyikan pesan error

        selectedGejalaObjects.forEach(gejala => {
            const item = document.createElement('div');
            item.className = 'gejala-item';
            
            item.innerHTML = `
                <label for="cf-${gejala.id}">${gejala.name} (${gejala.id})</label>
                <select id="cf-${gejala.id}" data-cf-id="${gejala.id}">
                    <option value="0">Pilih Keyakinan</option>
                    <option value="0.2">Tidak Yakin (20%)</option>
                    <option value="0.4">Cukup Yakin (40%)</option>
                    <option value="0.6">Yakin (60%)</option>
                    <option value="0.8">Sangat Yakin (80%)</option>
                    <option value="1.0">Pasti (100%)</option>
                </select>
            `;
            keyakinanContainer.appendChild(item);
        });
    }


    /**
     * Menjalankan diagnosis saat tombol diklik
     */
    function runDiagnosis() {
        // Cek jika engine.js sudah dimuat dan menyediakan fungsinya
        if (typeof jalankanInferenceEngine === 'undefined') {
            console.error('fungsi jalankanInferenceEngine tidak ditemukan! Pastikan engine.js dimuat SEBELUM app.js');
            hasilList.innerHTML = '<p style="color: red;">Error: Gagal memuat inference engine. Cek console (F12).</p>';
            hasilLoading.style.display = 'none';
            return;
        }

        try {
            // Panggil fungsi global dari engine.js
            const hasil = jalankanInferenceEngine(finalUserInput, allRules); 
            
            renderHasil(hasil);

        } catch (error) {
            console.error('Error saat diagnosis:', error);
            hasilLoading.style.display = 'none';
            hasilList.innerHTML = '<p style="color: red;">Terjadi error saat menghitung diagnosis. Cek console (F12).</p>';
        }
    }

    /**
     * Menampilkan hasil diagnosis ke HTML
     */
    function renderHasil(hasil) {
        hasilLoading.style.display = 'none';
        hasilList.innerHTML = ''; 

        if (!hasil || hasil.length === 0) {
            hasilList.innerHTML = '<p>Tidak ada penyakit yang terdeteksi berdasarkan kombinasi gejala yang dipilih.</p>';
            return;
        }

        // Urutkan hasil dari CF tertinggi
        hasil.sort((a, b) => b.cf - a.cf);

        hasil.forEach(penyakitHasil => {
           const item = document.createElement('div');
             item.className = 'hasil-item';

             // Cari nama penyakit di 'allDiseases' berdasarkan ID
            const penyakitInfo = allDiseases.find(p => String(p.id) === String(penyakitHasil.id));
             const namaPenyakit = penyakitInfo ? penyakitInfo.name : penyakitHasil.id;

            const persentase = (penyakitHasil.cf * 100).toFixed(2);
            // --- MODIFIKASI DISINI ---
            const nilaiCF = penyakitHasil.cf.toFixed(2); // Ubah dari toFixed(3) menjadi toFixed(2)
            
            // Tambahkan teks "Nilai CF:"
            item.innerHTML = `
              ${namaPenyakit} 
              <span>: ${persentase}% (Nilai CF: ${nilaiCF})</span> 
              `;
            // -------------------------
           hasilList.appendChild(item);
        });
    }

    // --- 6. INISIALISASI ---
    loadCoreData(); // Muat data aturan & penyakit
    showPage('page-selamat-datang'); // Tampilkan halaman pertama

});
