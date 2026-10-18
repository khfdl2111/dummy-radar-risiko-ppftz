/* Inti prototipe v2: data dummy + skoring lima dimensi berbasis indikator berpoin (0–100).
   Tidak menyentuh DOM, sehingga bisa diuji di luar browser dan dipakai untuk contoh di dokumen. */
(function (g) {
  "use strict";
  function mulberry(seed) {
    let a = seed >>> 0;
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const R = mulberry(20261011);
  const pick = a => a[Math.floor(R() * a.length)];
  const gauss = () => { let u = 0; while (!u) u = R(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * R()); };
  const clamp = (x, lo, hi) => Math.max(lo, Math.min(hi, x));
  const sigmoid = x => 1 / (1 + Math.exp(-x));
  const median = arr => { const s = [...arr].sort((a, b) => a - b), n = s.length; return n ? (n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2) : 0; };
  const f1 = v => v.toLocaleString("id-ID", { maximumFractionDigits: 1 });
  const f2 = v => v.toLocaleString("id-ID", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const fn = v => Math.round(v).toLocaleString("id-ID");
  const pct = v => Math.round(v * 100) + "%";
  const usd = v => "USD " + (v >= 100 ? fn(v) : f2(v));

  // ---------- katalog dummy (semua angka ilustrasi) ----------
  // bm = tarif bea masuk umum, pref = tarif preferensi FTA, lartas = kena larangan/pembatasan
  const HS = [
    { kode: "8517.62", nama: "Perangkat jaringan", satuan: "PCE", harga: 46, kg: 0.9, bm: 0, pref: 0, lartas: false, kata: ["router", "modul", "jaringan", "nirkabel", "switch", "pemancar"] },
    { kode: "8542.31", nama: "Sirkuit terpadu", satuan: "PCE", harga: 3.4, kg: 0.01, bm: 0, pref: 0, lartas: false, kata: ["sirkuit", "terpadu", "prosesor", "chip", "pengendali", "semikonduktor"] },
    { kode: "8534.00", nama: "Papan sirkuit cetak", satuan: "PCE", harga: 6.2, kg: 0.08, bm: 0, pref: 0, lartas: false, kata: ["papan", "sirkuit", "cetak", "pcb", "lapis", "kosong"] },
    { kode: "8504.40", nama: "Catu daya", satuan: "PCE", harga: 12.5, kg: 0.4, bm: 5, pref: 0, lartas: false, kata: ["catu", "daya", "adaptor", "konverter", "pengisi", "listrik"] },
    { kode: "8544.42", nama: "Kabel berkonektor", satuan: "PCE", harga: 2.6, kg: 0.12, bm: 10, pref: 0, lartas: false, kata: ["kabel", "konektor", "harness", "tembaga", "isolasi", "listrik"] },
    { kode: "8481.80", nama: "Katup industri", satuan: "PCE", harga: 38, kg: 2.4, bm: 5, pref: 0, lartas: false, kata: ["katup", "keran", "bola", "kuningan", "industri", "tekanan"] },
    { kode: "7308.90", nama: "Konstruksi baja", satuan: "KGM", harga: 1.45, kg: 1, bm: 12.5, pref: 0, lartas: false, kata: ["konstruksi", "baja", "rangka", "struktur", "galangan", "las"] },
    { kode: "7208.51", nama: "Baja canai panas", satuan: "KGM", harga: 0.78, kg: 1, bm: 15, pref: 5, lartas: true, kata: ["baja", "canai", "panas", "pelat", "lembaran", "karbon"] },
    { kode: "3926.90", nama: "Komponen plastik", satuan: "PCE", harga: 0.85, kg: 0.05, bm: 15, pref: 0, lartas: false, kata: ["plastik", "komponen", "cetakan", "penutup", "rumah", "injeksi"] },
    { kode: "8708.99", nama: "Suku cadang kendaraan", satuan: "PCE", harga: 22, kg: 1.6, bm: 10, pref: 0, lartas: false, kata: ["suku", "cadang", "kendaraan", "rem", "poros", "otomotif"] },
    { kode: "9018.90", nama: "Alat kesehatan", satuan: "PCE", harga: 62, kg: 0.7, bm: 5, pref: 0, lartas: true, kata: ["alat", "kesehatan", "medis", "kateter", "steril", "diagnostik"] },
    { kode: "6109.10", nama: "Kaus katun", satuan: "PCE", harga: 4.1, kg: 0.18, bm: 25, pref: 5, lartas: true, kata: ["kaus", "katun", "rajutan", "pakaian", "lengan", "dewasa"] },
    { kode: "6403.99", nama: "Alas kaki kulit", satuan: "PRS", harga: 18.5, kg: 0.8, bm: 25, pref: 5, lartas: true, kata: ["sepatu", "kulit", "alas", "kaki", "sol", "karet"] },
    { kode: "3304.99", nama: "Kosmetik perawatan kulit", satuan: "PCE", harga: 5.2, kg: 0.15, bm: 10, pref: 0, lartas: true, kata: ["kosmetik", "krim", "perawatan", "wajah", "serum", "pelembap"] },
    { kode: "2710.19", nama: "Minyak pelumas", satuan: "LTR", harga: 1.15, kg: 0.9, bm: 5, pref: 0, lartas: false, kata: ["minyak", "pelumas", "mesin", "sintetis", "drum", "oli"] },
  ];
  HS.forEach(h => { h.sd = 0.16 + 0.3 * R(); });
  const GENERIK = ["komponen", "bagian", "unit", "bahan", "aksesori", "lainnya"];
  const NEGARA = ["CN", "SG", "MY", "JP", "KR", "US", "VN", "TH", "DE"];
  const NAMA_NEGARA = { CN: "Tiongkok", SG: "Singapura", MY: "Malaysia", JP: "Jepang", KR: "Korea Selatan", US: "Amerika Serikat", VN: "Vietnam", TH: "Thailand", DE: "Jerman", ID: "Indonesia" };
  const FTA = [
    { id: "ACFTA", form: "Form E", negara: ["CN"] },
    { id: "ATIGA", form: "Form D", negara: ["SG", "MY", "VN", "TH"] },
    { id: "AKFTA", form: "Form AK", negara: ["KR"] },
    { id: "IJEPA", form: "Form IJEPA", negara: ["JP"] },
  ];
  const ftaNegara = n => FTA.find(f => f.negara.includes(n)) || null;
  const PROSES = [
    { id: "EKS", nama: "Ekspor", dok: "PPFTZ-01", p: 0.32, peran: "Eksportir", lintas: true, arah: "tujuan" },
    { id: "TLD", nama: "Ke TLDDP", dok: "PPFTZ-01", p: 0.30, peran: "Importir", lintas: true, arah: "asal" },
    { id: "MSK", nama: "Pemasukan dari luar negeri", dok: "PPFTZ-01", p: 0.16, peran: "Importir", lintas: true, arah: "asal" },
    { id: "AKB", nama: "Antar-Kawasan Bebas", dok: "PPFTZ-02", p: 0.08, peran: "Pengirim", lintas: false },
    { id: "DTL", nama: "Dari TLDDP", dok: "PPFTZ-03", p: 0.14, peran: "Pengirim", lintas: false },
  ];
  const PI = Object.fromEntries(PROSES.map(p => [p.id, p]));

  // ---------- pelaku usaha dummy ----------
  const N_PELAKU = 84, N_DOK = 480;
  const pelaku = [];
  for (let i = 0; i < N_PELAKU; i++) {
    const bulanAktif = Math.max(1, Math.round(Math.exp(1.2 + 1.5 * Math.abs(gauss()))));
    const rasioKoreksi = clamp(0.03 + 0.07 * Math.abs(gauss()) + (R() < 0.15 ? 0.15 : 0), 0, 0.45);
    const npwpValid = R() > 0.12;
    const u = R(), pelanggaran = u < 0.55 ? 0 : u < 0.74 ? 1 : u < 0.86 ? 2 : u < 0.94 ? 3 : 4;   // pelanggaran tercatat 24 bulan terakhir
    const nHS = 2 + Math.floor(R() * 3), fokus = [];
    while (fokus.length < nHS) { const k = Math.floor(R() * HS.length); if (!fokus.includes(k)) fokus.push(k); }
    const nNeg = 1 + Math.floor(R() * 3), negaraBiasa = [];
    while (negaraBiasa.length < nNeg) { const k = pick(NEGARA); if (!negaraBiasa.includes(k)) negaraBiasa.push(k); }
    const laten = sigmoid(-2.6 + 1.25 * pelanggaran + 1.4 * (bulanAktif < 6) + 5 * rasioKoreksi + 1.1 * (!npwpValid) + 0.3 * gauss());
    pelaku.push({ id: "PU-" + String(i + 1).padStart(3, "0"), bulanAktif, rasioKoreksi, npwpValid, pelanggaran, fokus, negaraBiasa, laten,
      temuan: R() < laten ? 1 : 0, bobot: Math.pow(R(), 2.4) + 0.02, dok: [] });
  }
  const totalBobot = pelaku.reduce((s, p) => s + p.bobot, 0);
  const pilihPelaku = () => { let r = R() * totalBobot; for (const p of pelaku) { r -= p.bobot; if (r <= 0) return p; } return pelaku[0]; };
  const pilihProses = () => { let r = R(); for (const p of PROSES) { r -= p.p; if (r <= 0) return p; } return PROSES[0]; };

  // ---------- dokumen dummy ----------
  const dok = [];
  for (let i = 0; i < N_DOK; i++) {
    const pr = pilihProses(), pu = pilihPelaku();
    let hsAsli = R() < 0.93 ? pick(pu.fokus) : Math.floor(R() * HS.length);
    let negara = pr.lintas ? (R() < 0.95 ? pick(pu.negaraBiasa) : pick(NEGARA)) : "ID";
    let faktorQty = 1, faktorHarga = 1, faktorBerat = 1;
    let jam = clamp(Math.round(11 + 3 * gauss()), 7, 18);
    let selisihHari = R() < 0.03 ? 25 + Math.floor(R() * 30) : Math.floor(R() * 4);
    const sisip = [];
    let jenis = null;
    if (R() < 0.04 + 0.22 * pu.laten) {
      const opsi = ["klas", "klas", "nilai", "nilai", "jumlah", "satuan"];
      if (pr.id === "TLD") opsi.push("tarif", "tarif", "tarif", "tarif", "tarif", "tarif", "tarif");
      if (pr.lintas) opsi.push("negara", "negara", "negara");
      opsi.push("komoditas");
      jenis = pick(opsi);
    }
    if (jenis === "negara") { const lain = NEGARA.filter(n => !pu.negaraBiasa.includes(n)); negara = pick(lain); }
    if (jenis === "komoditas") { const lain = HS.map((_, k) => k).filter(k => !pu.fokus.includes(k)); hsAsli = pick(lain); faktorQty = 5 + 5 * R(); }
    const h = HS[hsAsli];
    const nKata = R() < 0.6 ? 3 : 2;
    let kata = [pick(h.kata)];
    while (kata.length < nKata) { const k = R() < 0.3 ? pick(GENERIK) : pick(h.kata); if (!kata.includes(k)) kata.push(k); }
    if (R() < 0.03) kata[kata.length - 1] = pick(pick(HS).kata);
    let hsDecl = hsAsli;
    // fasilitas FTA hanya relevan saat barang keluar ke TLDDP (ada bea masuk)
    let skema = null, bmDecl = h.bm, negaraMuat = negara;
    if (pr.id === "TLD") {
      const s = ftaNegara(negara);
      if (s && R() < 0.5) { skema = s; bmDecl = h.pref; if (R() < 0.05) negaraMuat = negara === "SG" ? "MY" : "SG"; }
    }
    if (jenis === "klas") {
      const lebihRendah = HS.map((_, k) => k).filter(k => k !== hsAsli && (HS[k].bm < h.bm || (h.lartas && !HS[k].lartas)));
      hsDecl = lebihRendah.length ? pick(lebihRendah) : (hsAsli + 1 + Math.floor(R() * (HS.length - 1))) % HS.length;
      bmDecl = skema ? HS[hsDecl].pref : HS[hsDecl].bm;
      if (R() < 0.35) kata = [pick(h.kata), pick(GENERIK), pick(HS[hsDecl].kata)];
    } else if (jenis === "nilai") {
      faktorHarga = pr.id === "EKS" ? 2 + 3 * R() : 0.15 + 0.35 * R();
    } else if (jenis === "jumlah") {
      faktorBerat = 3 + 3 * R();                               // berat jauh lebih besar dari jumlah yang diberitahukan
    } else if (jenis === "satuan") {
      faktorHarga = 1000;
    } else if (jenis === "tarif") {
      const v = R();
      if (v < 0.4 || (v < 0.7 && h.bm === 0) || (v >= 0.7 && !(h.pref > 0 && ftaNegara(negara)))) {
        const salah = FTA.filter(f => !f.negara.includes(negara)); skema = pick(salah); bmDecl = 0;
        if (R() < 0.4) negaraMuat = negara === "SG" ? "MY" : "SG";
      } else if (v < 0.7) { skema = null; bmDecl = Math.max(0, h.bm - (h.bm >= 15 ? 10 : 5)); }
      else { skema = ftaNegara(negara); bmDecl = 0; }
    }
    if (jenis) sisip.push(jenis);
    const qty = Math.max(1, Math.round(Math.exp(Math.log(h.satuan === "PCE" || h.satuan === "PRS" ? 900 : 14000) + 0.9 * gauss()) * faktorQty));
    let harga = h.harga * Math.exp(h.sd * gauss()) * faktorHarga;
    if (R() < 0.04) harga *= Math.exp((R() < 0.5 ? -1 : 1) * (0.9 + 0.9 * R()));
    const berat = qty * h.kg * Math.exp(0.12 * gauss()) * faktorBerat;
    const hari = Math.floor(R() * 37), tgl = new Date(Date.UTC(2026, 7, 1 + hari));
    const d = { id: "D-" + String(100001 + i * 7), proses: pr.id, pelaku: pu, hsAsli, hs: hsDecl, kata, uraian: kata.join(" "), negara, negaraMuat,
      qty, harga, berat, nilai: qty * harga, tgl, jam, selisihHari, skema, bmDecl, sisip };
    pu.dok.push(d); dok.push(d);
  }
  for (const d of dok) {
    const p = d.pelaku;
    d.jalur = R() < 0.08 + 0.22 * p.temuan + 0.14 * (p.bulanAktif < 6) + 0.2 * (d.sisip.length > 0) ? "Merah" : "Hijau";
  }

  // ================= DIMENSI 1: KLASIFIKASI (kemungkinan pelarian HS) =================
  // Model: Naive Bayes atas kata uraian. Poin motif hanya dihitung bila uraian memang lebih cocok ke HS lain.
  const vocab = [...new Set(HS.flatMap(h => h.kata).concat(GENERIK))];
  const VI = Object.fromEntries(vocab.map((v, i) => [v, i]));
  const cnt = HS.map(() => new Float64Array(vocab.length)), tot = new Float64Array(HS.length), prior = new Float64Array(HS.length);
  for (const d of dok) { prior[d.hs]++; for (const k of d.kata) { cnt[d.hs][VI[k]]++; tot[d.hs]++; } }
  const ALPHA = 0.3;
  const logLik = (c, k) => Math.log((cnt[c][VI[k]] + ALPHA) / (tot[c] + ALPHA * vocab.length));
  for (const d of dok) {
    const lp = HS.map((_, c) => Math.log((prior[c] + 1) / (N_DOK + HS.length)) + d.kata.reduce((s, k) => s + logLik(c, k), 0));
    const m0 = Math.max(...lp), ex = lp.map(x => Math.exp(x - m0)), z = ex.reduce((a, b) => a + b, 0), post = ex.map(x => x / z);
    let alt = 0; for (let c = 1; c < HS.length; c++) if (post[c] > post[alt]) alt = c;
    const beda = alt !== d.hs, m = beda ? clamp(post[alt] - post[d.hs], 0, 1) : 0, A = HS[alt], D = HS[d.hs];
    const selisihBm = beda ? Math.max(0, A.bm - D.bm) : 0, lartas = beda && A.lartas && !D.lartas;
    const k1 = Math.round(60 * m), k2 = Math.round(25 * m * clamp(selisihBm / 15, 0, 1)), k3 = Math.round(15 * m * (lartas ? 1 : 0));
    d.m1 = { pDecl: post[d.hs], alt, pAlt: post[alt], m };
    d.ind = { K: [
      { nama: "Uraian lebih cocok dengan HS lain", maks: 60, poin: k1,
        ket: beda && m >= 0.05 ? `Uraian "${d.uraian}" lebih cocok dengan HS ${A.kode} ${A.nama} (peluang ${pct(post[alt])}) daripada HS yang diberitahukan (${pct(post[d.hs])}).` : `Uraian "${d.uraian}" sesuai dengan HS yang diberitahukan (peluang ${pct(post[d.hs])}).` },
      { nama: "HS yang lebih cocok bertarif lebih tinggi", maks: 25, poin: k2,
        ket: k2 > 0 ? `BM HS ${A.kode} ${f1(A.bm)}%, sedangkan HS yang diberitahukan ${f1(D.bm)}%. Pindah HS menghemat bea masuk.` : (beda && m >= 0.05 ? "HS yang lebih cocok tidak bertarif lebih tinggi." : "Tidak dinilai karena uraian sesuai.") },
      { nama: "HS yang lebih cocok kena lartas", maks: 15, poin: k3,
        ket: k3 > 0 ? `HS ${A.kode} kena larangan/pembatasan, HS yang diberitahukan tidak.` : (beda && m >= 0.05 ? "Tidak ada perbedaan status lartas yang menguntungkan." : "Tidak dinilai karena uraian sesuai.") },
    ] };
    d.sK = k1 + k2 + k3;
  }

  // ================= DIMENSI 2: TARIF (salah penetapan tarif dan pemakaian FTA) =================
  for (const d of dok) {
    if (d.proses !== "TLD") { d.sT = 0; d.tarifBerlaku = false; d.ind.T = []; continue; }
    d.tarifBerlaku = true;
    const h = HS[d.hs], klaim = !!d.skema, berhak = klaim && d.skema.negara.includes(d.negara), nm = NAMA_NEGARA[d.negara];
    const t1 = !klaim && h.bm > 0 ? Math.round(70 * clamp((h.bm - d.bmDecl) / h.bm, 0, 1)) : 0;
    const t2 = klaim && !berhak ? 85 : 0;
    const t3 = klaim && d.bmDecl < h.pref ? 50 : 0;
    const t4 = klaim && d.negaraMuat !== d.negara ? 25 : 0;
    d.ind.T = [
      { nama: "Tarif di bawah tarif acuan HS", maks: 70, poin: t1,
        ket: klaim ? "Tidak dinilai karena memakai tarif preferensi (lihat indikator FTA)." : t1 > 0 ? `BM diberitahukan ${f1(d.bmDecl)}%, tarif acuan HS ${h.kode} adalah ${f1(h.bm)}%.` : `BM diberitahukan ${f1(d.bmDecl)}% sama dengan tarif acuan.` },
      { nama: "Skema FTA tidak sesuai negara asal", maks: 85, poin: t2,
        ket: !klaim ? "Tidak ada klaim FTA." : t2 > 0 ? `Mengklaim ${d.skema.id} (${d.skema.form}), padahal negara asal ${nm} tidak termasuk skema itu.` : `Klaim ${d.skema.id} (${d.skema.form}) sesuai dengan negara asal ${nm}.` },
      { nama: "Tarif preferensi di bawah tarif skema", maks: 50, poin: t3,
        ket: !klaim ? "Tidak ada klaim FTA." : t3 > 0 ? `Memakai ${f1(d.bmDecl)}%, padahal tarif preferensi untuk HS ${h.kode} adalah ${f1(h.pref)}%.` : `Tarif preferensi ${f1(d.bmDecl)}% sesuai skema.` },
      { nama: "Pengiriman tidak langsung dari negara asal", maks: 25, poin: t4,
        ket: !klaim ? "Tidak ada klaim FTA." : t4 > 0 ? `Dimuat di ${NAMA_NEGARA[d.negaraMuat]}, bukan di negara asal ${nm}. Ketentuan pengiriman langsung perlu dicek.` : "Dimuat langsung dari negara asal." },
    ];
    d.sT = Math.min(100, t1 + t2 + t3 + t4);
  }

  // ================= DIMENSI 3: NILAI PABEAN (harga, jumlah, dan jenis barang) =================
  const gHarga = HS.map(() => []), gBerat = HS.map(() => []);
  for (const d of dok) { gHarga[d.hs].push(Math.log(d.harga)); gBerat[d.hs].push(Math.log(d.berat / d.qty)); }
  const st = a => { const med = median(a), mad = median(a.map(x => Math.abs(x - med))); return { med, s: Math.max(1.4826 * mad, 0.12), n: a.length }; };
  const sHarga = gHarga.map(st), sBerat = gBerat.map(st);
  for (const d of dok) {
    const a = sHarga[d.hs], z = (Math.log(d.harga) - a.med) / a.s, masuk = d.proses === "TLD" || d.proses === "MSK";
    const zeff = masuk ? Math.max(-z, 0.6 * z) : Math.abs(z), rasio = d.harga / Math.exp(a.med);
    const n1 = Math.round(80 * (1 - Math.exp(-Math.pow(Math.max(0, zeff - 1.5), 2) / 9)));
    const b = sBerat[d.hs], zb = (Math.log(d.berat / d.qty) - b.med) / b.s, rb = (d.berat / d.qty) / Math.exp(b.med);
    const n2 = Math.round(50 * clamp((Math.abs(zb) - 3) / 4, 0, 1));
    const gen = d.kata.filter(k => GENERIK.includes(k)).length / d.kata.length;
    const n3 = gen >= 0.5 ? Math.round(10 * gen) : 0;
    const kali = rasio >= 1 ? `${f1(rasio)} kali` : `${pct(rasio)} dari`;
    d.m3 = { z, rasio, med: Math.exp(a.med), n: a.n, zb, rb };
    d.ind.N = [
      { nama: "Harga satuan menyimpang dari harga pembanding", maks: 80, poin: n1,
        ket: `Harga satuan ${usd(d.harga)}, yaitu ${kali} harga pembanding ${usd(Math.exp(a.med))} (median ${a.n} dokumen HS ${HS[d.hs].kode}).` + (n1 >= 15 ? (rasio < 1 ? " Terlalu rendah." : " Terlalu tinggi.") : " Masih wajar.") },
      { nama: "Jumlah tidak sebanding dengan berat", maks: 50, poin: n2,
        ket: n2 > 0 ? `Berat per satuan ${f2(d.berat / d.qty)} kg, yaitu ${f1(rb)} kali berat lazim barang ini. Jumlah yang diberitahukan mungkin tidak sesuai.` : `Berat per satuan ${f2(d.berat / d.qty)} kg, wajar untuk barang ini.` },
      { nama: "Jenis barang tidak jelas dari uraian", maks: 10, poin: n3,
        ket: n3 > 0 ? `Uraian "${d.uraian}" terlalu umum, sehingga jenis barang sulit dibandingkan harganya.` : "Uraian cukup spesifik." },
    ];
    d.sN = Math.min(100, n1 + n2 + n3);
  }

  // ================= DIMENSI 4: PROFIL PELAKU USAHA (riwayat dan kepatuhan) =================
  // Model: regresi logistik, dilatih pada label "ada temuan" (dummy). Skor = peluang × 100.
  const FITUR4 = ["Pelanggaran 24 bulan terakhir", "Rasio koreksi dokumen", "Pelaku baru (aktif < 6 bulan)", "Format NPWP tidak valid"];
  const X4raw = pelaku.map(p => [p.pelanggaran, p.rasioKoreksi, p.bulanAktif < 6 ? 1 : 0, p.npwpValid ? 0 : 1]);
  const mu = FITUR4.map((_, j) => X4raw.reduce((s, r) => s + r[j], 0) / N_PELAKU);
  const sd = FITUR4.map((_, j) => Math.sqrt(X4raw.reduce((s, r) => s + Math.pow(r[j] - mu[j], 2), 0) / N_PELAKU) || 1);
  const X4 = X4raw.map(r => r.map((v, j) => (v - mu[j]) / sd[j]));
  const w4 = new Array(FITUR4.length).fill(0); let b4 = 0;
  for (let it = 0; it < 4000; it++) {
    const gw = new Array(FITUR4.length).fill(0); let gb = 0;
    for (let i = 0; i < N_PELAKU; i++) {
      const e = sigmoid(b4 + X4[i].reduce((s, v, j) => s + v * w4[j], 0)) - pelaku[i].temuan;
      gb += e; for (let j = 0; j < w4.length; j++) gw[j] += e * X4[i][j];
    }
    b4 -= 0.3 * gb / N_PELAKU; for (let j = 0; j < w4.length; j++) w4[j] -= 0.3 * (gw[j] / N_PELAKU + 0.004 * w4[j]);
  }
  pelaku.forEach((p, i) => {
    p.peluang = sigmoid(b4 + X4[i].reduce((s, v, j) => s + v * w4[j], 0));
    p.skor = Math.round(100 * p.peluang);
    const nilai = [`${p.pelanggaran} kali`, pct(p.rasioKoreksi), p.bulanAktif < 6 ? `Ya, baru ${p.bulanAktif} bulan` : `Tidak, sudah ${p.bulanAktif} bulan`, p.npwpValid ? "Valid" : "Tidak valid"];
    p.ind = FITUR4.map((n, j) => { const c = X4[i][j] * w4[j]; return { nama: n, nilai: nilai[j], pengaruh: c, arah: c > 0.6 ? "Menaikkan kuat" : c > 0.15 ? "Menaikkan" : c < -0.15 ? "Menurunkan" : "Netral" }; });
  });
  for (const d of dok) { d.sP = d.pelaku.skor; d.ind.P = d.pelaku.ind; }

  // ================= DIMENSI 5: ANOMALI TRANSAKSI (menyimpang dari kebiasaan pelaku sendiri) =================
  // Isolation Forest untuk kombinasi fitur dokumen yang tidak lazim
  const FITUR5 = ["nilai transaksi", "jumlah barang", "berat per satuan", "selisih tanggal manifes", "jam pengajuan"];
  const X5 = dok.map(d => [Math.log10(d.nilai), Math.log10(d.qty), Math.log10(d.berat / d.qty / HS[d.hs].kg), Math.log10(1 + d.selisihHari), Math.abs(d.jam - 12)]);
  const cFac = n => n <= 1 ? 0 : 2 * (Math.log(n - 1) + 0.5772156649) - 2 * (n - 1) / n;
  function bangunPohon(idx, depth, maks) {
    if (depth >= maks || idx.length <= 1) return { n: idx.length };
    const f = Math.floor(R() * FITUR5.length); let lo = Infinity, hi = -Infinity;
    for (const i of idx) { const v = X5[i][f]; if (v < lo) lo = v; if (v > hi) hi = v; }
    if (lo === hi) return { n: idx.length };
    const s = lo + R() * (hi - lo), L = [], Rr = [];
    for (const i of idx) (X5[i][f] < s ? L : Rr).push(i);
    return { f, s, l: bangunPohon(L, depth + 1, maks), r: bangunPohon(Rr, depth + 1, maks) };
  }
  const panjang = (x, t, dd) => t.f === undefined ? dd + cFac(t.n) : panjang(x, x[t.f] < t.s ? t.l : t.r, dd + 1);
  const SUB = 128, N_POHON = 120, hutan = [];
  for (let t = 0; t < N_POHON; t++) { const idx = []; while (idx.length < SUB) idx.push(Math.floor(R() * N_DOK)); hutan.push(bangunPohon(idx, 0, Math.ceil(Math.log2(SUB)))); }
  const med5 = FITUR5.map((_, j) => median(X5.map(r => r[j])));
  const mad5 = FITUR5.map((_, j) => Math.max(1.4826 * median(X5.map(r => Math.abs(r[j] - med5[j]))), 0.05));
  dok.forEach((d, i) => {
    const p = d.pelaku, lain = p.dok.filter(x => x !== d), nL = lain.length, cukup = nL >= 5, pr = PI[d.proses];
    // A1: negara mitra tidak biasa bagi pelaku ini
    const lintasLain = lain.filter(x => PI[x.proses].lintas), nLin = lintasLain.length;
    let a1 = 0, k1;
    if (!pr.lintas) k1 = "Tidak dinilai: transaksi di dalam negeri.";
    else if (nLin < 5) k1 = `Tidak dinilai: riwayat lintas negara pelaku baru ${nLin} dokumen.`;
    else {
      const sama = lintasLain.filter(x => x.negara === d.negara).length, pangsa = (sama + 0.5) / (nLin + 4.5);
      a1 = Math.round(50 * clamp((0.15 - pangsa) / 0.15, 0, 1));
      const hit = {}; lintasLain.forEach(x => hit[x.negara] = (hit[x.negara] || 0) + 1);
      const biasa = Object.keys(hit).sort((x, y) => hit[y] - hit[x]).slice(0, 2).map(n => `${NAMA_NEGARA[n]} (${hit[n]})`).join(", ");
      k1 = `Negara ${pr.arah} ${NAMA_NEGARA[d.negara]}: ${sama} dari ${nLin} dokumen lain pelaku ini. Biasanya ${biasa}.`;
    }
    // A2: komoditas tidak biasa bagi pelaku ini
    let a2 = 0, k2;
    if (!cukup) k2 = `Tidak dinilai: riwayat pelaku baru ${nL} dokumen.`;
    else {
      const sama = lain.filter(x => x.hs === d.hs).length, pangsa = (sama + 0.5) / (nL + 7.5);
      a2 = Math.round(20 * clamp((0.1 - pangsa) / 0.1, 0, 1));
      k2 = `HS ${HS[d.hs].kode} ${HS[d.hs].nama}: ${sama} dari ${nL} dokumen lain pelaku ini.`;
    }
    // A3: nilai melonjak dibanding transaksi pelaku sendiri
    let a3 = 0, k3;
    if (!cukup) k3 = `Tidak dinilai: riwayat pelaku baru ${nL} dokumen.`;
    else {
      const md = median(lain.map(x => Math.log(x.nilai))), kali = d.nilai / Math.exp(md);
      a3 = Math.round(25 * clamp(Math.log10(kali / 8), 0, 1));
      k3 = `Nilai ${usd(d.nilai)}, yaitu ${kali >= 1 ? f1(kali) + " kali" : pct(kali) + " dari"} nilai lazim pelaku ini (${usd(Math.exp(md))}).`;
    }
    // A4: kombinasi fitur dokumen tidak lazim (Isolation Forest)
    const e = hutan.reduce((s, t) => s + panjang(X5[i], t, 0), 0) / N_POHON, sIso = Math.pow(2, -e / cFac(SUB));
    const a4 = Math.round(20 * clamp((sIso - 0.5) / 0.18, 0, 1));
    const eks = FITUR5.map((n, j) => ({ n, z: Math.abs((X5[i][j] - med5[j]) / mad5[j]) })).sort((x, y) => y.z - x.z).filter(x => x.z > 2.5).slice(0, 2).map(x => x.n);
    let k4 = a4 >= 4 ? `Pola dokumen ${a4 >= 12 ? "" : "agak "}tidak lazim dibanding dokumen lain (skor isolasi ${f2(sIso)}).` + (eks.length ? ` Paling menyimpang: ${eks.join(" dan ")}.` : "") : `Pola dokumen mirip dengan kebanyakan dokumen (skor isolasi ${f2(sIso)}).`;
    if (a4 >= 4 && d.selisihHari > 10) k4 += ` Selisih tanggal daftar dan manifes ${d.selisihHari} hari.`;
    d.ind.A = [
      { nama: "Negara mitra tidak biasa bagi pelaku", maks: 50, poin: a1, ket: k1 },
      { nama: "Komoditas tidak biasa bagi pelaku", maks: 20, poin: a2, ket: k2 },
      { nama: "Nilai melonjak dibanding biasanya", maks: 25, poin: a3, ket: k3 },
      { nama: "Kombinasi data dokumen tidak lazim", maks: 20, poin: a4, ket: k4 },
    ];
    d.sA = Math.min(100, a1 + a2 + a3 + a4);
  });

  // ================= PENGGABUNGAN =================
  const DIM = [
    { k: "sK", i: "K", nama: "Klasifikasi", singkat: "Klas", tanya: "Apakah kode HS dipindahkan ke pos lain supaya lebih menguntungkan?", risiko: "Pelarian HS", metode: "Naive Bayes atas uraian barang, lalu poin motif" },
    { k: "sT", i: "T", nama: "Tarif", singkat: "Tarif", tanya: "Apakah tarif yang dipakai benar, termasuk tarif preferensi FTA?", risiko: "Salah tarif atau salah pakai FTA", metode: "Aturan dan tabel acuan tarif" },
    { k: "sN", i: "N", nama: "Nilai pabean", singkat: "Nilai", tanya: "Apakah nilai, jumlah, dan jenis barang wajar?", risiko: "Nilai, jumlah, atau jenis tidak sesuai", metode: "Statistik robust terhadap harga pembanding" },
    { k: "sP", i: "P", nama: "Profil pelaku usaha", singkat: "Pelaku", tanya: "Bagaimana riwayat pelanggaran dan kepatuhan perusahaannya?", risiko: "Riwayat pelanggaran", metode: "Regresi logistik atas riwayat pelaku" },
    { k: "sA", i: "A", nama: "Anomali transaksi", singkat: "Anomali", tanya: "Apakah transaksi ini menyimpang dari kebiasaan pelaku sendiri?", risiko: "Pola berubah tiba-tiba", metode: "Profil kebiasaan pelaku dan Isolation Forest" },
  ];
  const DIM_DOK = ["sK", "sT", "sN", "sP", "sA"];   // kelima dimensi ikut dalam pemilihan dimensi tertinggi
  const BOBOT_AWAL = { sK: 20, sT: 20, sN: 20, sP: 20, sA: 20 };
  const PORSI_AWAL = 60;                        // persen untuk dimensi tertinggi
  const AMBANG = { tinggi: 50, sedang: 30 };
  function hitung(skor, bobot, porsi) {         // skor: {sK,sT,sN,sP,sA} 0–100
    let kunci = DIM_DOK[0]; for (const k of DIM_DOK) if (skor[k] > skor[kunci]) kunci = k;
    const sw = DIM.reduce((s, m) => s + bobot[m.k], 0);
    const rata = sw ? DIM.reduce((s, m) => s + bobot[m.k] * skor[m.k], 0) / sw : 0;
    const total = Math.round(porsi / 100 * skor[kunci] + (1 - porsi / 100) * rata);
    return { kunci, tertinggi: skor[kunci], rata, skor: total, prioritas: total >= AMBANG.tinggi ? "Tinggi" : total >= AMBANG.sedang ? "Sedang" : "Rendah" };
  }
  function gabung(bobot, porsi) {
    for (const d of dok) Object.assign(d, hitung(d, bobot, porsi));
    const urut = [...dok].sort((a, b) => (b.skor - a.skor) || (b.tertinggi - a.tertinggi) || (a.id < b.id ? -1 : 1));
    urut.forEach((d, i) => d.peringkat = i + 1);
    return urut;
  }
  function evaluasi(urut, n) {
    const total = dok.filter(d => d.sisip.length).length, ml = urut.slice(0, n).filter(d => d.sisip.length).length;
    const merah = dok.filter(d => d.jalur === "Merah"), laju = merah.filter(d => d.sisip.length).length / merah.length;
    return { total, ml, merah: Math.min(n, merah.length) * laju, acak: n * total / N_DOK, nMerah: merah.length };
  }
  const SISIP = { klas: "Pelarian HS", tarif: "Tarif atau FTA", nilai: "Harga tidak wajar", jumlah: "Jumlah tidak sesuai", satuan: "Salah satuan (nilai melonjak)", negara: "Negara mitra baru", komoditas: "Komoditas baru dan nilai melonjak" };
  const SISIP_DIM = { klas: "sK", tarif: "sT", nilai: "sN", jumlah: "sN", satuan: "sN", negara: "sA", komoditas: "sA" };

  g.RR = { HS, GENERIK, NEGARA, NAMA_NEGARA, FTA, PROSES, PI, DIM, DIM_DOK, FITUR4, BOBOT_AWAL, PORSI_AWAL, AMBANG, SISIP, SISIP_DIM, pelaku, dok, hitung, gabung, evaluasi, w4, b4, N_DOK, N_PELAKU, N_POHON, fmt: { f1, f2, fn, pct, usd } };
})(typeof window !== "undefined" ? window : globalThis);
