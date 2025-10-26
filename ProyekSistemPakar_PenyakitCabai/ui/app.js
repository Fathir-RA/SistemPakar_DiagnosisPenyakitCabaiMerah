// Menunggu sampai seluruh konten HTML dimuat
document.addEventListener('DOMContentLoaded', () => {

    // --- 1. DEFINISI ELEMEN UI & PATH DATA ---
    
    // Path ke file JSON Anda (sesuai struktur folder 'rules/')
    const SYMPTOMS_PATH = '../rules/symptoms.json';
    const RULES_PATH = '../rules/rules.json';
    const DISEASES_PATH = '../rules/diseases.json';

    // Ambil elemen dari HTML
    const gejalaContainer = document.getElementById('gejala-container');
    const gejalaLoading = document.getElementById('gejala-loading');
    const btnDiagnosis = document.getElementById('btn-diagnosis');
    const hasilPlaceholder = document.getElementById('hasil-placeholder');
    const hasilLoading = document.getElementById('hasil-loading');
    const hasilList = document.getElementById('hasil-list');
    
    // Variabel untuk menyimpan data yang dimuat
    let allSymptoms = [];
    let allRules = [];
    let allDiseases = [];

    // --- 2. FUNGSI UNTUK MEMUAT DATA GEJALA ---

    /**
     * Memuat daftar gejala dari symptoms.json dan menampilkannya di UI
     */
    async function loadGejala() {
        try {
            const response = await fetch(SYMPTOMS_PATH);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            allSymptoms = await response.json();
            
            // Sembunyikan pesan "loading"
            gejalaLoading.style.display = 'none';
            
            // Tampilkan setiap gejala ke UI
            allSymptoms.forEach(symptom => {
                const item = document.createElement('div');
                item.className = 'gejala-item';
                
                // HTML untuk satu item gejala
                item.innerHTML = `
                    <input type="checkbox" id="${symptom.id}" value="${symptom.id}" data-cf-pakar="${symptom.cf_pakar}">
                    <label for="${symptom.id}">${symptom.name} (${symptom.id})</label>
                    <select id="cf_user_${symptom.id}">
                        <option value="0.0">Pilih Keyakinan</option>
                        <option value="0.2">Tidak Yakin</option>
                        <option value="0.4">Cukup Yakin</option>
                        <option value="0.6">Yakin</option>
                        <option value="0.8">Sangat Yakin</option>
                        <option value="1.0">Pasti</option>
                    </select>
                `;
                gejalaContainer.appendChild(item);
            });

        } catch (error) {
            gejalaLoading.textContent = 'Gagal memuat daftar gejala. Cek file symptoms.json dan path-nya.';
            console.error('Error memuat gejala:', error);
        }
    }

    /**
     * Fungsi untuk memuat data (aturan dan penyakit)
     * Kita memuatnya saat startup agar siap digunakan saat diagnosis
     */
    async function loadDataLain() {
        try {
            const rulesResponse = await fetch(RULES_PATH);
            allRules = await rulesResponse.json();
            
            const diseasesResponse = await fetch(DISEASES_PATH);
            allDiseases = await diseasesResponse.json();

            console.log("Aturan dan Penyakit berhasil dimuat.");
        } catch (error) {
            console.error('Error memuat data aturan/penyakit:', error);
            hasilPlaceholder.textContent = 'Gagal memuat data sistem. Tidak dapat melakukan diagnosis.';
            btnDiagnosis.disabled = true;
        }
    }

    // --- 3. FUNGSI UNTUK PROSES DIAGNOSIS ---

    /**
     * Fungsi ini akan dipanggil ketika tombol "Mulai Diagnosis" diklik
     */
    function mulaiDiagnosis() {
        console.log("Diagnosis dimulai...");
        hasilPlaceholder.style.display = 'none';
        hasilList.innerHTML = ''; // Kosongkan hasil sebelumnya
        hasilLoading.style.display = 'block'; // Tampilkan "Menghitung hasil..."

        // 1. Kumpulkan input pengguna (gejala yang dipilih dan nilai CF User-nya)
        const inputPengguna = [];
        const checkboxes = gejalaContainer.querySelectorAll('input[type="checkbox"]:checked');
        
        checkboxes.forEach(checkbox => {
            const id = checkbox.value;
            const cfUserSelect = document.getElementById(`cf_user_${id}`);
            const cfUser = parseFloat(cfUserSelect.value);
            
            if (cfUser > 0) { // Hanya proses jika pengguna memilih keyakinan
                const cfPakar = parseFloat(checkbox.getAttribute('data-cf-pakar'));
                inputPengguna.push({
                    id: id,
                    cf_pakar: cfPakar,
                    cf_user: cfUser
                });
            }
        });

        if (inputPengguna.length === 0) {
            hasilLoading.style.display = 'none';
            hasilList.innerHTML = '<p>Anda belum memilih gejala atau menentukan tingkat keyakinan.</p>';
            return;
        }

        console.log("Input Pengguna:", inputPengguna);

        // 2. Panggil Inference Engine (yang akan kita buat di engine.js)
        // Kita akan membuat fungsi ini di langkah berikutnya.
        // Untuk sekarang, kita buat tiruannya dulu.
        const hasilDiagnosis = jalankanInferenceEngine(inputPengguna, allRules);

        // 3. Tampilkan hasil
        hasilLoading.style.display = 'none';
        
        if (hasilDiagnosis.length === 0) {
            hasilList.innerHTML = '<p>Tidak ada penyakit yang terdeteksi berdasarkan gejala yang dipilih.</p>';
            return;
        }

        // Urutkan hasil dari CF tertinggi
        hasilDiagnosis.sort((a, b) => b.cf - a.cf);

        hasilDiagnosis.forEach(hasil => {
            // Cari nama penyakit dari allDiseases
            const penyakit = allDiseases.find(p => p.id === hasil.id);
            const namaPenyakit = penyakit ? penyakit.name : hasil.id;
            const persentase = (hasil.cf * 100).toFixed(2); // Ubah ke persen

            const item = document.createElement('div');
            item.className = 'hasil-item';
            item.innerHTML = `${namaPenyakit}: <span>${persentase}%</span>`;
            hasilList.appendChild(item);
        });

    }

    // --- 4. EVENT LISTENER ---
    
    // Panggil fungsi untuk memuat gejala dan data lain saat halaman dibuka
    loadGejala();
    loadDataLain();
    
    // Tambahkan event listener ke tombol diagnosis
    btnDiagnosis.addEventListener('click', mulaiDiagnosis);

});