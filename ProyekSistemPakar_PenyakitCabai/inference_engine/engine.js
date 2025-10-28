/**
 * inference_engine/engine.js
 */

/** MYCIN combine: menangani +, -, dan mixed */
function cfCombine(cf1, cf2) {
    if (cf1 === undefined || cf1 === null) return cf2;
    if (cf2 === undefined || cf2 === null) return cf1;

    // both positive
    if (cf1 >= 0 && cf2 >= 0) {
        return cf1 + cf2 * (1 - cf1);
    }
    // both negative
    if (cf1 <= 0 && cf2 <= 0) {
        return cf1 + cf2 * (1 + cf1);
    }
    // mixed signs
    const minAbs = Math.min(Math.abs(cf1), Math.abs(cf2));
    const denom = 1 - minAbs;
    if (denom === 0) return 0;
    return (cf1 + cf2) / denom;
}

/**
 * Jalankan inference engine:
 */
function jalankanInferenceEngine(inputPengguna, allRules, opts = {}) {
    const symptomsMap = opts.symptomsMap || {};
    const defaultRuleCF = (typeof opts.defaultRuleCF === 'number') ? opts.defaultRuleCF : 1.0; // sesuai paper asumsikan 1

    // Working memory & results
    const factBaseCF = {};      // id -> cf (gejala + derived diseases)
    const finalDiseaseCFs = {}; // diseaseId -> cf
    const firedRuleIDs = new Set();

    // 1) Inisialisasi fakta gejala dari input user
    for (const input of inputPengguna) {
        if (!input || !input.id) continue;
        const cfPakar = (typeof input.cf_pakar === 'number') ? input.cf_pakar : (symptomsMap[input.id] ? symptomsMap[input.id].cf_pakar : 0);
        const cfUser = (typeof input.cf_user === 'number') ? Math.max(0, Math.min(1, input.cf_user)) : 0;
        const cfGejala = cfPakar * cfUser; // langkah 1 paper
        factBaseCF[input.id] = cfGejala;
    }

    // 2) Forward chaining: ulangi sampai tidak ada rule baru yang fired
    let anyFired = true;
    do {
        anyFired = false;

        for (const rule of allRules) {
            if (firedRuleIDs.has(rule.id)) continue;

            const antecedents = rule.if || [];
            const allPresent = antecedents.every(a => factBaseCF[a] !== undefined);

            if (!allPresent) continue; // belum siap

            // Rule siap dieksekusi
            firedRuleIDs.add(rule.id);
            anyFired = true;

            // Ambil CF tiap premis
            const premiseCFs = antecedents.map(a => factBaseCF[a]);

            // Gabungkan premis BERURUTAN menggunakan MYCIN (sesuai paper)
            // mulai dari premiseCFs[0]
            let aggregatedAnteCF = premiseCFs[0];
            for (let i = 1; i < premiseCFs.length; i++) {
                aggregatedAnteCF = cfCombine(aggregatedAnteCF, premiseCFs[i]);
            }

            // Terapkan bobot rule jika ada; jika tidak, defaultRuleCF (biasanya 1.0 untuk mengikuti paper)
            const ruleWeight = (typeof rule.cf === 'number') ? rule.cf : defaultRuleCF;
            const cfContribution = aggregatedAnteCF * ruleWeight;

            // Gabungkan kontribusi rule (paralel) ke penyakit
            const conclusion = rule.then;
            const old = (finalDiseaseCFs[conclusion] !== undefined) ? finalDiseaseCFs[conclusion] : null;
            const combined = cfCombine(old, cfContribution);

            finalDiseaseCFs[conclusion] = combined;

            // Simpan fakta baru (untuk sekuensial)
            factBaseCF[conclusion] = combined;
        }

    } while (anyFired);

    // Format hasil: array terurut desc
    const hasil = Object.keys(finalDiseaseCFs).map(id => ({ id, cf: finalDiseaseCFs[id] }));
    hasil.sort((a,b) => b.cf - a.cf);
    return hasil;
}

/* expose function ke global agar app.js bisa memanggil */
window.jalankanInferenceEngine = jalankanInferenceEngine;

