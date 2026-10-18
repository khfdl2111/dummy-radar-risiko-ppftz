(function () {
  "use strict";
  const RR = window.RR, { dok, DIM, DIM_DOK, PI, HS, PROSES, BOBOT_AWAL, PORSI_AWAL, AMBANG, NAMA_NEGARA, SISIP } = RR;
  const { f1, fn, pct, usd } = RR.fmt;
  const $ = id => document.getElementById(id);
  function h(tag, attrs, ...kids) {
    const e = document.createElement(tag);
    for (const k in attrs || {}) {
      const v = attrs[k];
      if (v === false || v == null) continue;
      if (k === "class") e.className = v; else if (k.startsWith("on")) e.addEventListener(k.slice(2), v); else if (k === "style") e.style.cssText = v; else e.setAttribute(k, v === true ? "" : v);
    }
    for (const c of kids.flat(3)) if (c != null && c !== false) e.append(c.nodeType ? c : document.createTextNode(c));
    return e;
  }
  const nilaiUsd = v => v >= 1e6 ? "USD " + f1(v / 1e6) + " juta" : "USD " + fn(v);
  const tgl = d => d.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
  const GLIF = { Tinggi: "▲", Sedang: "◆", Rendah: "●" };
  const KEP = { ya: "Tindak lanjuti", tidak: "Tidak perlu tindak lanjut", data: "Minta data tambahan" };
  const TAHAP = ["Penelitian dokumen", "Permintaan data atau konfirmasi", "Pemeriksaan fisik", "Penetapan hasil"];
  const HASIL = { temuan: "Terbukti, ada temuan", nihil: "Tidak terbukti", tanpa: "Tanpa tindak lanjut" };
  const SUB = { semua: "Semua dokumen", proses: "On Progress Tindak Lanjut", selesai: "Selesai" };
  const KEP_PENDEK = { ya: "Tindak lanjuti", tidak: "Tidak perlu", data: "Minta data" }, HASIL_PENDEK = { temuan: "Terbukti", nihil: "Tidak terbukti", tanpa: "Tanpa tindak lanjut" };
  const tglPendek = t => t ? new Date(t).toLocaleDateString("id-ID", { day: "numeric", month: "short" }) : "–";
  const isiLagi = a => { const el = $("lagi"); if (a.length > st.tampil) el.replaceChildren(h("button", { class: "btn", type: "button", onclick: () => { st.tampil += 25; gambarTabel(); } }, "Tampilkan 25 lagi")); else el.replaceChildren(); el.hidden = a.length <= st.tampil; };
  const tglLokal = t => t ? new Date(t).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }) : "–";
  const DK = Object.fromEntries(DIM.map(m => [m.k, m]));
  const pil = p => h("span", { class: "pil " + p }, GLIF[p], " ", p);

  // ---------- isi tetap: definisi dan indikator tiap dimensi ----------
  const ISI = {
    sK: { def: "Kemungkinan pelarian HS: barang diberitahukan pada kode HS lain yang tarifnya lebih rendah atau tidak kena lartas.",
      data: "Uraian barang, kode HS, tabel tarif, daftar lartas.",
      cara: "Model teks (Naive Bayes) membaca uraian barang dan menilai kode HS mana yang paling cocok. Bila HS lain jauh lebih cocok, poin diberikan. Poin bertambah bila pindah HS itu menguntungkan.",
      ind: [["Uraian lebih cocok dengan HS lain", 60, "Penuh bila model hampir pasti HS lain yang benar."], ["HS yang lebih cocok bertarif lebih tinggi", 25, "Penuh bila selisih tarifnya 15 poin persen atau lebih."], ["HS yang lebih cocok kena lartas", 15, "HS yang lebih cocok kena lartas, HS yang diberitahukan tidak."]],
      cat: "Dua indikator terakhir dikalikan dengan tingkat ketidakcocokan uraian. Kalau uraian sesuai, semuanya 0." },
    sT: { def: "Kemungkinan salah penetapan tarif, termasuk pemakaian tarif preferensi FTA yang tidak sesuai.",
      data: "Tarif yang diberitahukan, tarif acuan per HS, skema FTA yang diklaim, negara asal, negara muat.",
      cara: "Tarif yang diberitahukan dibandingkan dengan tabel acuan. Bila ada klaim FTA, dicek tiga hal: negara asal berhak atas skema itu, tarifnya sesuai skema, dan barang dikirim langsung.",
      ind: [["Tarif di bawah tarif acuan HS", 70, "Sebanding dengan selisihnya. Penuh bila diberitahukan 0% padahal ada tarif."], ["Skema FTA tidak sesuai negara asal", 85, "Misalnya memakai Form E, padahal barang bukan dari Tiongkok."], ["Tarif preferensi di bawah tarif skema", 50, "Memakai 0%, padahal tarif preferensi untuk HS itu 5%."], ["Pengiriman tidak langsung dari negara asal", 25, "Dimuat di negara ketiga, sehingga ketentuan pengiriman langsung perlu dicek."]],
      cat: "Jumlah poin dibatasi 100. Hanya dinilai untuk pengeluaran ke TLDDP, karena di situ bea masuk dipungut. Untuk proses lain skornya 0." },
    sN: { def: "Kewajaran nilai pabean, dilihat bersama jumlah dan jenis barangnya.",
      data: "Harga satuan, jumlah, satuan, berat, uraian barang, dan harga dokumen lain dengan HS yang sama.",
      cara: "Harga satuan dibandingkan dengan harga pembanding, yaitu median harga barang ber-HS sama. Jumlah diuji lewat berat per satuan. Uraian yang terlalu umum menambah sedikit poin karena jenis barang jadi sulit dibandingkan.",
      ind: [["Harga satuan menyimpang dari harga pembanding", 80, "Untuk barang masuk, harga yang terlalu rendah paling dinilai. Untuk ekspor, simpangan ke dua arah."], ["Jumlah tidak sebanding dengan berat", 50, "Berat per satuan jauh dari yang lazim untuk barang itu."], ["Jenis barang tidak jelas dari uraian", 10, "Uraian hanya berisi kata umum seperti komponen atau bagian."]],
      cat: "Jumlah poin dibatasi 100." },
    sP: { def: "Riwayat perusahaan: pernah melanggar atau tidak, dan seberapa patuh selama ini.",
      data: "Pelanggaran yang tercatat, koreksi dokumen, lama aktif, validitas NPWP.",
      cara: "Regresi logistik belajar dari riwayat: pelaku dengan ciri seperti apa yang kemudian terbukti bermasalah. Hasilnya peluang 0 sampai 100%, dan angka itu langsung menjadi skor.",
      cat: "Semua dokumen milik satu pelaku mendapat skor profil yang sama. Pelaku berisiko tinggi membuat dokumennya naik prioritas." },
    sA: { def: "Transaksi menyimpang dari kebiasaan pelaku sendiri. Contoh: biasanya ekspor ke negara X, tiba-tiba ke negara Y.",
      data: "Seluruh dokumen lain milik pelaku yang sama: negara mitra, komoditas, nilai. Ditambah data dokumen itu sendiri.",
      cara: "Tiap dokumen dibandingkan dengan dokumen lain milik pelaku yang sama. Semakin jarang negara, komoditas, atau besaran nilai itu muncul dalam riwayatnya, semakin banyak poin. Isolation Forest menambah poin bila kombinasi data dokumennya tidak lazim.",
      ind: [["Negara mitra tidak biasa bagi pelaku", 50, "Penuh bila pelaku belum pernah bertransaksi dengan negara itu."], ["Komoditas tidak biasa bagi pelaku", 20, "HS yang belum pernah atau jarang dipakai pelaku itu."], ["Nilai melonjak dibanding biasanya", 25, "Mulai dihitung bila nilainya di atas 8 kali nilai lazim pelaku itu, penuh pada 80 kali."], ["Kombinasi data dokumen tidak lazim", 20, "Dinilai Isolation Forest dari nilai, jumlah, berat, selisih tanggal manifes, dan jam pengajuan."]],
      cat: "Jumlah poin dibatasi 100. Tiga indikator pertama baru dinilai bila pelaku punya minimal 5 dokumen lain sebagai pembanding." },
  };

  // ---------- keadaan ----------
  const KUNCI = "radar-risiko-ppftz-v2";
  const st = { bobot: { ...BOBOT_AWAL }, porsi: PORSI_AWAL, proses: "", prio: "", risiko: "", status: "", urut: "skor", cari: "", kunci: false, tampil: 25, pilih: null, kep: {}, nEval: 30, sub: "semua", benih: false, kabar: "",
    kalk: { sK: 0, sT: 85, sN: 10, sP: 40, sA: 20 } };
  try { const t = JSON.parse(localStorage.getItem(KUNCI) || "null"); if (t) { if (t.bobot) Object.assign(st.bobot, t.bobot); if (typeof t.porsi === "number") st.porsi = t.porsi; if (t.kep) st.kep = t.kep; st.benih = !!t.benih; } } catch (e) { /* tanpa penyimpanan pun halaman tetap jalan */ }
  const simpan = () => { try { localStorage.setItem(KUNCI, JSON.stringify({ bobot: st.bobot, porsi: st.porsi, kep: st.kep, benih: st.benih })); } catch (e) { /* abaikan */ } };
  let urut = RR.gabung(st.bobot, st.porsi);
  const byId = Object.fromEntries(dok.map(d => [d.id, d]));
  st.pilih = urut[0].id;
  const statusDok = id => { const k = st.kep[id]; return !k ? "antre" : (k.k === "tidak" || k.selesai) ? "selesai" : "proses"; };
  const hasilDok = k => k.k === "tidak" ? "tanpa" : (k.hasil || "nihil");
  const pilStatus = id => { const k = st.kep[id], s = statusDok(id);
    if (s === "antre") return h("span", { class: "kecil" }, "Belum diputuskan");
    if (s === "proses") return h("span", { class: "pil proses" }, "On progress · tahap ", String((k.tahap || 0) + 1), "/", String(TAHAP.length));
    const hs = hasilDok(k); return h("span", { class: "pil " + hs }, "Selesai · ", HASIL[hs].toLowerCase()); };
  // Contoh isian awal, supaya alur tindak lanjut langsung terlihat. Hanya sekali, dan bisa dihapus dari log.
  if (!st.benih && !Object.keys(st.kep).length) {
    const TEMUAN = { sK: "Barang tidak sesuai uraian. HS ditetapkan ulang.", sT: "Klaim tarif preferensi ditolak. Tarif ditetapkan ulang.", sN: "Nilai pabean ditetapkan ulang memakai data pembanding.", sP: "Jumlah barang tidak sesuai saat pemeriksaan fisik.", sA: "Tujuan transaksi tidak sesuai dokumen." };
    const hari = n => Date.UTC(2026, 9, n, 3);
    const isi = (i, k, tahap, hasil, catatan, mulai, lama) => { const d = urut[i]; if (!d) return; st.kep[d.id] = { k, catatan: catatan || "", tahap, selesai: !!hasil, hasil: hasil || null, tMulai: hari(mulai), tSelesai: hasil ? hari(mulai + lama) : null }; };
    isi(0, "ya", 3, "temuan", TEMUAN[urut[0].kunci], 1, 5);
    isi(1, "ya", 3, "temuan", TEMUAN[urut[1].kunci], 1, 6);
    isi(2, "ya", 2, null, "Form D dan dokumen pengangkutan sedang diteliti. Pemeriksaan fisik dijadwalkan.", 6, 0);
    isi(3, "ya", 0, null, "", 9, 0);
    isi(4, "data", 1, null, "Menunggu SKA dan bill of lading dari pelaku usaha.", 7, 0);
    isi(5, "ya", 3, "nihil", "Dokumen dan barang sesuai. Harga rendah karena barang sisa stok.", 2, 4);
    isi(7, "ya", 3, null, "Hasil pemeriksaan sedang dituangkan dalam penetapan.", 5, 0);
    isi(9, "data", 1, null, "Menunggu kontrak penjualan dan bukti pembayaran.", 8, 0);
    isi(11, "ya", 1, null, "", 8, 0);
    const wajar = urut.find(d => d.prioritas === "Tinggi" && d.kunci === "sP" && Math.max(d.sK, d.sT, d.sN, d.sA) === 0 && !st.kep[d.id]);
    if (wajar) st.kep[wajar.id] = { k: "tidak", catatan: "Skor tinggi hanya karena profil pelaku. Dokumen ini wajar.", tahap: 0, selesai: true, hasil: null, tMulai: hari(4), tSelesai: hari(4) };
    st.benih = true; simpan();
  }
  const risikoUtama = d => d.tertinggi >= 15 ? DK[d.kunci].nama : "–";
  const rata5 = () => DIM.every(m => st.bobot[m.k] === st.bobot.sK);

  // ---------- langkah hitung (dipakai kartu risiko dan kalkulator) ----------
  function langkah(skor, r) {
    const a = st.porsi / 100 * r.tertinggi, b = (1 - st.porsi / 100) * r.rata, sisa = 100 - st.porsi;
    const urai = rata5() ? `(${DIM.map(m => skor[m.k]).join(" + ")}) ÷ 5` : "rata-rata tertimbang menurut bobot";
    const sebab = r.prioritas === "Tinggi" ? `${AMBANG.tinggi} atau lebih` : r.prioritas === "Sedang" ? `${AMBANG.sedang} sampai ${AMBANG.tinggi - 1}` : `di bawah ${AMBANG.sedang}`;
    return [
      h("div", {}, h("div", { class: "l" }, h("b", {}, "1. Dimensi tertinggi"), ` di antara lima dimensi: ${DK[r.kunci].nama} = ${r.tertinggi}`), h("div", { class: "r num" }, `${st.porsi}% × ${r.tertinggi} = ${f1(a)}`)),
      h("div", {}, h("div", { class: "l" }, h("b", {}, "2. Rata-rata lima dimensi"), `: ${urai} = ${f1(r.rata)}`), h("div", { class: "r num" }, `${sisa}% × ${f1(r.rata)} = ${f1(b)}`)),
      h("div", { class: "hasil" }, h("div", { class: "l" }, h("b", {}, "3. Skor terintegrasi"), ` = ${f1(a)} + ${f1(b)}, dibulatkan. Prioritas ${r.prioritas.toLowerCase()} karena ${sebab}.`), h("div", { class: "r num" }, String(r.skor))),
    ];
  }

  // ---------- tab kerangka ----------
  function gambarKerangka() {
    const kg = (cls, hd, ...isi) => h("div", { class: "kg " + cls }, h("div", { class: "kg-h" }, hd), ...isi);
    $("diagram").replaceChildren(
      kg("", "1 · Data", h("div", { class: "kg-t" }, "Dokumen dan riwayat"), h("ul", {}, h("li", {}, "Dokumen PPFTZ: HS, uraian, nilai, jumlah, negara, tarif"), h("li", {}, "Riwayat pelaku usaha"), h("li", {}, "Tabel acuan: tarif, FTA, lartas"))),
      kg("kg-dim", "2 · Lima dimensi, masing-masing 0 sampai 100", DIM.map(m => h("div", { class: "kg-baris" }, h("b", {}, m.nama), h("span", {}, m.risiko)))),
      kg("", "3 · Penggabungan", h("div", { class: "kg-t" }, "Skor terintegrasi"), h("div", { class: "kg-rumus" }, `${st.porsi}% × dimensi tertinggi`, h("br"), `+ ${100 - st.porsi}% × rata-rata lima dimensi`, h("small", {}, "Hasil 0 sampai 100")), h("p", {}, "Dimensi tertinggi dipilih dari kelima dimensi, termasuk profil pelaku.")),
      kg("", "4 · Prioritas", h("div", { class: "kg-prio" }, h("span", { class: "pil Tinggi" }, GLIF.Tinggi, ` Tinggi: ${AMBANG.tinggi} atau lebih`), h("span", { class: "pil Sedang" }, GLIF.Sedang, ` Sedang: ${AMBANG.sedang} sampai ${AMBANG.tinggi - 1}`), h("span", { class: "pil Rendah" }, GLIF.Rendah, ` Rendah: di bawah ${AMBANG.sedang}`))),
      kg("kg-manusia", "5 · Petugas", h("div", { class: "kg-t" }, "Validasi dan tindak lanjut"), h("p", {}, "Petugas menelaah dan memutuskan, lalu menindaklanjuti sampai selesai. Skor hanya indikasi.")),
      h("div", { class: "kg-balik" }, h("b", {}, "6 · Umpan balik. "), "Hasil tindak lanjut, terbukti atau tidak, menjadi label untuk melatih model dan menyesuaikan bobot."));
  }
  function gambarDimensi() {
    const maks = Math.max(...RR.w4.map(Math.abs));
    $("dimkartu").replaceChildren(...DIM.map((m, i) => {
      const x = ISI[m.k], top = [...dok].sort((a, b) => (b[m.k] - a[m.k]) || (b.skor - a.skor))[0];
      let tabel;
      if (m.k === "sP") {
        tabel = h("table", { class: "indtab" }, h("thead", {}, h("tr", {}, h("th", {}, "Ciri pelaku yang dipakai model"), h("th", { class: "p" }, "Bobot hasil latihan"))),
          h("tbody", {}, RR.FITUR4.map((n, j) => h("tr", {}, h("td", {}, n), h("td", { class: "p num" }, h("span", { class: "meter", style: "width:60px;margin-right:8px" }, h("i", { style: `width:${Math.round(Math.abs(RR.w4[j]) / maks * 100)}%` })), (RR.w4[j] >= 0 ? "+" : "−") + RR.fmt.f2(Math.abs(RR.w4[j])))))));
      } else {
        tabel = h("table", { class: "indtab" }, h("thead", {}, h("tr", {}, h("th", {}, "Indikator"), h("th", { class: "p" }, "Poin maksimum"))),
          h("tbody", {}, x.ind.map(r => h("tr", {}, h("td", {}, r[0], h("span", { class: "ket" }, r[2])), h("td", { class: "p num" }, String(r[1]))))));
      }
      const utama = m.k === "sP" ? `peluang temuan ${pct(top.pelaku.peluang)}` : [...top.ind[m.i]].sort((a, b) => b.poin - a.poin)[0].ket;
      return h("article", {},
        h("div", {}, h("h3", {}, h("span", { class: "no" }, "Dimensi " + (i + 1)), m.nama), h("p", { class: "def" }, x.def),
          h("dl", {}, h("dt", {}, "Pertanyaan"), h("dd", {}, m.tanya), h("dt", {}, "Data yang dipakai"), h("dd", {}, x.data), h("dt", {}, "Cara menilai"), h("dd", {}, x.cara))),
        h("div", { class: "kanan" }, h("div", { class: "gulir" }, tabel), h("p", { class: "ket", style: "margin:0" }, m.k === "sP" ? "Skor = peluang temuan menurut model × 100. " + x.cat : x.cat),
          h("div", { class: "contoh" }, h("span", {}, h("b", {}, `Contoh: ${top.id}, skor ${m.nama.toLowerCase()} ${top[m.k]}. `), utama), h("button", { class: "btn", type: "button", onclick: () => bukaDokumen(top.id) }, "Buka dokumen ini"))));
    }));
  }

  // ---------- ringkasan dan tabel ----------
  function hitungStatus() { const c = { antre: 0, proses: 0, selesai: 0, temuan: 0, nihil: 0, tanpa: 0 }; dok.forEach(d => { const s = statusDok(d.id); c[s]++; if (s === "selesai") c[hasilDok(st.kep[d.id])]++; }); return c; }
  function gambarRingkas() {
    const c = { Tinggi: 0, Sedang: 0, Rendah: 0 }; dok.forEach(d => c[d.prioritas]++);
    const tunggu = dok.filter(d => d.prioritas === "Tinggi" && !st.kep[d.id]).length, n = hitungStatus();
    const kotak = (l, v, sub) => h("div", {}, h("div", { class: "l" }, l), h("div", { class: "v num" }, v), h("div", { class: "s" }, sub));
    $("ringkas").replaceChildren(
      kotak("Dokumen dinilai", fn(dok.length), `${RR.N_PELAKU} pelaku usaha, Agustus sampai September 2026`),
      kotak("Prioritas tinggi", String(c.Tinggi), `${c.Sedang} sedang, ${c.Rendah} rendah`),
      kotak("Menunggu keputusan", String(tunggu), "dari daftar prioritas tinggi"),
      kotak("On progress tindak lanjut", String(n.proses), n.proses ? "sedang ditangani petugas" : "belum ada"),
      kotak("Selesai", String(n.selesai), n.selesai ? `${n.temuan} terbukti, ${n.nihil} tidak terbukti, ${n.tanpa} tanpa tindak lanjut` : "belum ada"));
  }
  function gambarSub() {
    const n = hitungStatus(), jml = { semua: dok.length, proses: n.proses, selesai: n.selesai };
    $("submenu").replaceChildren(...Object.keys(SUB).map(k => h("button", { type: "button", role: "tab", id: "sub-" + k, "aria-selected": st.sub === k ? "true" : "false", onclick: () => bukaSub(k) }, SUB[k], h("span", { class: "n num" }, String(jml[k])))));
    $("sub-ket").textContent = st.sub === "proses" ? "Dokumen yang diputuskan untuk ditindaklanjuti atau dimintai data tambahan, dan belum selesai."
      : st.sub === "selesai" ? "Dokumen yang tindak lanjutnya sudah ditutup, beserta hasilnya. Hasil inilah yang menjadi label umpan balik." : "";
    $("sub-ket").hidden = st.sub === "semua";
    $("kabar").textContent = st.kabar; $("kabar").hidden = !st.kabar;
    $("l-status").hidden = st.sub !== "semua";
  }
  function bukaSub(k, diam) { st.sub = k; st.tampil = 25; if (!diam) st.kabar = ""; try { history.replaceState(null, "", "#" + (k === "semua" ? "daftar" : k)); } catch (e) { /* abaikan */ } segarkan(); }
  const meter = v => h("span", { class: "meter" }, h("i", { style: `width:${v}%` }));
  const sel = (v, tak) => tak ? h("span", { class: "sel nol", title: "Tidak dinilai untuk proses ini" }, h("b", {}, "–")) : h("span", { class: "sel num" + (v < 5 ? " nol" : "") }, h("b", {}, String(v)), meter(v));
  function saring() {
    const q = st.cari.trim().toLowerCase();
    let a = urut.filter(d => (st.sub === "semua" || statusDok(d.id) === st.sub) && (!st.proses || d.proses === st.proses) && (!st.prio || d.prioritas === st.prio) && (!st.risiko || (d.kunci === st.risiko && d.tertinggi >= 15))
      && (st.sub !== "semua" || !st.status || (st.status === "sudah") === !!st.kep[d.id])
      && (!q || d.id.toLowerCase().includes(q) || d.pelaku.id.toLowerCase().includes(q) || HS[d.hs].kode.includes(q) || HS[d.hs].nama.toLowerCase().includes(q)));
    if (st.urut !== "skor") a = [...a].sort((x, y) => (y[st.urut] - x[st.urut]) || (y.skor - x.skor));
    return a;
  }
  const KOSONG = { semua: "Tidak ada dokumen yang cocok dengan saringan ini.", proses: "Belum ada dokumen yang sedang ditindaklanjuti. Buka Semua dokumen, pilih dokumen, lalu tekan Tindak lanjuti.", selesai: "Belum ada tindak lanjut yang selesai." };
  function barisLanjut(d) {
    const k = st.kep[d.id], sel = st.sub === "selesai", t = k.tahap || 0;
    return h("tr", { tabindex: "0", "aria-selected": d.id === st.pilih ? "true" : "false", "data-id": d.id },
      h("td", {}, h("span", { class: "mono" }, d.id), h("span", { class: "kecil" }, PI[d.proses].nama)),
      h("td", {}, h("span", { class: "sel skor num" }, h("b", {}, String(d.skor)), meter(d.skor))),
      h("td", {}, pil(d.prioritas)),
      h("td", {}, risikoUtama(d)),
      h("td", {}, h("span", { class: "pil " + k.k, title: KEP[k.k] }, KEP_PENDEK[k.k])),
      sel ? h("td", {}, h("span", { class: "pil " + hasilDok(k), title: HASIL[hasilDok(k)] }, HASIL_PENDEK[hasilDok(k)]))
        : h("td", { class: "tahapsel" }, h("span", { class: "tahapkecil", title: `Tahap ${t + 1} dari ${TAHAP.length}` }, TAHAP.map((_, i) => h("i", { class: i < t ? "sudah" : i === t ? "kini" : "" }))), h("span", { class: "kecil" }, `${t + 1}/${TAHAP.length} · ${TAHAP[t]}`)),
      h("td", { class: "num" }, tglPendek(sel ? k.tSelesai : k.tMulai)));
  }
  function gambarTabel() {
    const lanjut = st.sub !== "semua";
    const kol = lanjut ? ["Dokumen", "Skor", "Prioritas", "Risiko utama", "Keputusan", st.sub === "selesai" ? "Hasil" : "Tahap", st.sub === "selesai" ? "Selesai" : "Mulai"]
      : ["#", "Dokumen", "Skor", "Prioritas", ...DIM.map(m => m.singkat), "Risiko utama", "Status"]; if (st.kunci && !lanjut) kol.push("Kunci simulasi");
    $("thead").replaceChildren(h("tr", {}, kol.map((k, i) => h("th", { scope: "col", title: !lanjut && i >= 4 && i <= 8 ? DIM[i - 4].nama : null }, k))));
    const a = saring(), tampil = a.slice(0, st.tampil);
    $("jml").textContent = `Menampilkan ${tampil.length} dari ${a.length} dokumen`;
    if (!a.length) { $("tbody").replaceChildren(h("tr", {}, h("td", { colspan: kol.length, class: "kosong" }, KOSONG[st.sub]))); isiLagi(a); return; }
    $("thead").closest("table").className = lanjut ? "ramping" : "";
    if (lanjut) { $("tbody").replaceChildren(...tampil.map(barisLanjut)); isiLagi(a); return; }
    $("tbody").replaceChildren(...tampil.map(d => { return h("tr", { tabindex: "0", "aria-selected": d.id === st.pilih ? "true" : "false", "data-id": d.id },
      h("td", { class: "num" }, String(d.peringkat)),
      h("td", {}, h("span", { class: "mono" }, d.id), h("span", { class: "kecil" }, PI[d.proses].nama)),
      h("td", {}, h("span", { class: "sel skor num" }, h("b", {}, String(d.skor)), meter(d.skor))),
      h("td", {}, pil(d.prioritas)),
      DIM.map(m => h("td", {}, sel(d[m.k], m.k === "sT" && !d.tarifBerlaku))),
      h("td", {}, risikoUtama(d)),
      h("td", {}, pilStatus(d.id)),
      st.kunci ? h("td", {}, d.sisip.length ? h("span", { class: "pil kunci" }, "Sisipan: " + SISIP[d.sisip[0]].toLowerCase()) : h("span", { class: "kecil" }, "Wajar")) : null); }));
    isiLagi(a);
  }
  function pilih(id, gulir) {
    st.pilih = id;
    document.querySelectorAll("#tbody tr").forEach(tr => tr.setAttribute("aria-selected", tr.dataset.id === id ? "true" : "false"));
    gambarKartu();
    if (gulir && window.matchMedia("(max-width: 1080px)").matches) $("kartu").scrollIntoView({ behavior: "smooth", block: "start" });
  }
  function bukaDokumen(id) { bukaTab("daftar"); st.sub = "semua"; st.kabar = ""; st.proses = st.prio = st.risiko = st.status = st.cari = ""; st.urut = "skor"; st.tampil = Math.max(25, Math.ceil(byId[id].peringkat / 25) * 25); sinkronFilter(); gambarSub(); gambarTabel(); pilih(id, true); const tr = document.querySelector(`#tbody tr[data-id="${id}"]`); if (tr) tr.scrollIntoView({ block: "nearest" }); window.scrollTo({ top: 0 }); }
  $("tbody").addEventListener("click", e => { const tr = e.target.closest("tr[data-id]"); if (tr) pilih(tr.dataset.id, true); });
  $("tbody").addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { const tr = e.target.closest("tr[data-id]"); if (tr) { e.preventDefault(); pilih(tr.dataset.id, true); } } });

  // ---------- kartu risiko ----------
  function rincianDimensi(d, m) {
    const v = d[m.k], tak = m.k === "sT" && !d.tarifBerlaku, puncak = m.k === d.kunci && d.tertinggi > 0;
    let isi;
    if (tak) isi = h("p", { class: "cat" }, "Tidak dinilai. Tarif hanya dinilai untuk pengeluaran ke TLDDP, karena di situ bea masuk dipungut. Skor 0.");
    else if (m.k === "sP") isi = [h("div", { class: "gulir" }, h("table", { class: "indtab" }, h("thead", {}, h("tr", {}, h("th", {}, "Ciri pelaku"), h("th", {}, "Nilai"), h("th", { class: "p" }, "Pengaruh"))),
      h("tbody", {}, d.ind.P.map(r => h("tr", {}, h("td", {}, r.nama), h("td", {}, r.nilai), h("td", { class: "p" + (r.arah === "Netral" ? " nol" : "") }, r.arah)))))),
      h("p", { class: "cat" }, `Peluang temuan menurut model ${pct(d.pelaku.peluang)}, sehingga skor ${v}. Pelaku punya ${d.pelaku.dok.length} dokumen dalam data ini.`)];
    else isi = h("div", { class: "gulir" }, h("table", { class: "indtab" }, h("thead", {}, h("tr", {}, h("th", {}, "Indikator"), h("th", { class: "p" }, "Poin"))),
      h("tbody", {}, d.ind[m.i].map(r => h("tr", {}, h("td", {}, r.nama, h("span", { class: "ket" }, r.ket)), h("td", { class: "p num" + (r.poin ? "" : " nol") }, `${r.poin} / ${r.maks}`))))));
    return h("details", { class: "d", open: puncak || (m.k !== "sP" && v >= 15) },
      h("summary", {}, h("span", { class: "n" }, m.nama, puncak ? h("span", { class: "tertinggi" }, "tertinggi") : null), h("span", { class: "a num" }, tak ? "–" : String(v), h("small", {}, tak ? "" : " / 100")), h("span", { class: "bar" }, h("i", { style: `width:${v}%` }))),
      h("div", { class: "isi" }, isi));
  }
  function gambarKartu() {
    const d = byId[st.pilih], el = $("kartu");
    if (el.dataset.id !== String(st.pilih)) { el.scrollTop = 0; el.dataset.id = String(st.pilih); }
    if (!d) { el.replaceChildren(h("div", { class: "kosong" }, st.sub === "semua" ? "Pilih satu dokumen untuk melihat kartu risikonya." : "Belum ada dokumen di submenu ini.")); return; }
    const p = d.pelaku, pr = PI[d.proses], k = st.kep[d.id];
    const butir = (dt, dd, lebar) => h("div", { class: lebar ? "lebar" : "" }, h("dt", {}, dt), h("dd", {}, dd));
    const status = statusDok(d.id);
    const catatan = h("textarea", { id: "catatan", placeholder: status === "proses" ? "Catatan perkembangan tindak lanjut" : "Catatan petugas (opsional)", "aria-label": "Catatan petugas" }); catatan.value = k ? k.catatan || "" : "";
    if (k) catatan.addEventListener("change", () => { k.catatan = catatan.value.trim(); simpan(); gambarLog(); });
    const pindah = (ke, pesan) => { st.kabar = pesan; simpan(); if (st.sub !== "semua" && st.sub !== ke) { const sisa = saring(); st.pilih = sisa.length ? sisa[0].id : null; } segarkan(); };
    const putus = jenis => { st.kep[d.id] = { k: jenis, catatan: catatan.value.trim(), tahap: 0, selesai: jenis === "tidak", hasil: null, tMulai: Date.now(), tSelesai: jenis === "tidak" ? Date.now() : null };
      pindah(jenis === "tidak" ? "selesai" : "proses", jenis === "tidak" ? `${d.id} ditutup tanpa tindak lanjut dan masuk ke Selesai.` : `${d.id} masuk ke On Progress Tindak Lanjut.`); };
    const batal = () => { delete st.kep[d.id]; pindah("semua", `Keputusan untuk ${d.id} dibatalkan. Dokumen kembali menunggu keputusan.`); };
    const tutup = hasil => { Object.assign(k, { selesai: true, hasil, catatan: catatan.value.trim(), tSelesai: Date.now() }); pindah("selesai", `${d.id} selesai (${HASIL[hasil].toLowerCase()}) dan masuk ke Selesai.`); };
    const bukaLagi = () => { if (k.k === "tidak") { batal(); return; } Object.assign(k, { selesai: false, hasil: null, tSelesai: null }); pindah("proses", `${d.id} dibuka kembali dan masuk ke On Progress Tindak Lanjut.`); };
    const kecil = (teks, aksi) => h("button", { class: "btn kecilbtn", type: "button", onclick: aksi }, teks);
    let bagianKep;
    if (status === "antre") bagianKep = h("section", {}, h("h3", {}, "Keputusan petugas"),
      h("div", { class: "putus" }, Object.keys(KEP).map(j => h("button", { class: "btn", type: "button", onclick: () => putus(j) }, KEP[j]))), catatan,
      h("div", { class: "ket" }, "Skor adalah indikasi. Petugas yang menentukan tindak lanjutnya. Tindak lanjuti dan Minta data tambahan memasukkan dokumen ke On Progress Tindak Lanjut."));
    else if (status === "proses") bagianKep = h("section", {}, h("h3", {}, "Tindak lanjut · on progress"),
      h("div", { class: "barisstatus" }, h("span", { class: "pil " + k.k }, KEP[k.k]), h("span", { class: "ket", style: "margin:0" }, "Mulai " + tglLokal(k.tMulai)), kecil("Batalkan keputusan", batal)),
      h("ol", { class: "tahap" }, TAHAP.map((t, i) => h("li", { class: i < (k.tahap || 0) ? "sudah" : i === (k.tahap || 0) ? "kini" : "" },
        h("button", { type: "button", "aria-current": i === (k.tahap || 0) ? "step" : null, onclick: () => { k.tahap = i; k.catatan = catatan.value.trim(); simpan(); segarkan(); } }, h("span", { class: "no num" }, i < (k.tahap || 0) ? "✓" : String(i + 1)), t)))),
      catatan,
      h("div", { class: "ket" }, "Klik tahap untuk memperbarui posisi. Bila sudah ada hasilnya, tutup tindak lanjut:"),
      h("div", { class: "putus", style: "margin-top:8px" }, h("button", { class: "btn utama", type: "button", onclick: () => tutup("temuan") }, "Selesai: terbukti, ada temuan"), h("button", { class: "btn", type: "button", onclick: () => tutup("nihil") }, "Selesai: tidak terbukti")));
    else bagianKep = h("section", {}, h("h3", {}, "Tindak lanjut · selesai"),
      h("div", { class: "barisstatus" }, h("span", { class: "pil " + hasilDok(k) }, HASIL[hasilDok(k)]), h("span", { class: "pil " + k.k }, KEP[k.k])),
      h("dl", { class: "rinci", style: "margin-top:10px" }, butir("Diputuskan", tglLokal(k.tMulai)), butir("Selesai", tglLokal(k.tSelesai)), butir("Catatan", k.catatan || "Tidak ada catatan.", true)),
      h("div", { class: "ket" }, "Hasil ini tersimpan sebagai label umpan balik untuk melatih model."),
      h("div", { class: "putus", style: "margin-top:8px" }, kecil(k.k === "tidak" ? "Batalkan keputusan" : "Buka kembali", bukaLagi)));
    el.replaceChildren(...[
      h("section", {}, h("div", { class: "kepala" }, h("h2", {}, "Dokumen ", h("span", { class: "mono" }, d.id)), h("span", { class: "pil " + d.prioritas }, GLIF[d.prioritas], " Prioritas ", d.prioritas.toLowerCase()),
        h("span", { class: "sub" }, `Peringkat ${d.peringkat} dari ${dok.length}. ${pr.dok}, ${pr.nama.toLowerCase().replace("tlddp", "TLDDP").replace("kawasan bebas", "Kawasan Bebas")}, ${tgl(d.tgl)}.`))),
      status === "antre" ? null : bagianKep,
      h("section", {}, h("h3", {}, "Cara skor ini dihitung"),
        h("div", { class: "skorbesar" }, h("span", { class: "besar num" }, String(d.skor)), h("span", { class: "dari" }, "dari 100")),
        h("div", { class: "hitung" }, langkah(d, d))),
      h("section", {}, h("h3", {}, "Lima dimensi dan poinnya"), DIM.map(m => rincianDimensi(d, m))),
      h("section", {}, h("h3", {}, "Data dokumen"), h("dl", { class: "rinci" },
        butir(pr.peran, h("span", { class: "mono" }, p.id)), butir("Jalur (aturan yang ada)", d.jalur),
        butir("HS diberitahukan", `${HS[d.hs].kode} ${HS[d.hs].nama}`), pr.lintas ? butir("Negara " + pr.arah, NAMA_NEGARA[d.negara]) : butir("Lingkup", "Dalam negeri"),
        butir("Uraian barang", d.uraian, true), butir("Jumlah", `${fn(d.qty)} ${HS[d.hs].satuan}`), butir("Berat", `${fn(d.berat)} kg`), butir("Harga satuan", usd(d.harga)), butir("Nilai", nilaiUsd(d.nilai)),
        d.tarifBerlaku ? butir("Fasilitas", d.skema ? `${d.skema.id} (${d.skema.form})` : "Tanpa FTA") : null, d.tarifBerlaku ? butir("BM diberitahukan", f1(d.bmDecl) + "%") : null,
        d.tarifBerlaku && d.skema ? butir("Negara muat", NAMA_NEGARA[d.negaraMuat]) : null,
        st.kunci ? butir("Kunci simulasi", d.sisip.length ? "Dokumen ini disisipi kasus: " + SISIP[d.sisip[0]].toLowerCase() + "." : "Tidak disisipi kasus.", true) : null)),
      status === "antre" ? bagianKep : null,
      h("section", {},
        h("div", { style: "margin-top:10px" }, h("button", { class: "btn", type: "button", onclick: () => { DIM.forEach(m => st.kalk[m.k] = d[m.k]); gambarKalk(true); bukaTab("coba"); window.scrollTo({ top: 0 }); } }, "Coba ubah skornya di kalkulator")))].filter(Boolean));
  }

  // ---------- kalkulator ----------
  function gambarKalk(bangun) {
    if (bangun) $("k-geser").replaceChildren(...DIM.map(m => h("div", { class: "geser" }, h("label", { for: "k-" + m.k }, m.nama, h("span", {}, m.risiko)),
      h("input", { type: "range", id: "k-" + m.k, min: "0", max: "100", step: "1", value: String(st.kalk[m.k]), oninput: e => { st.kalk[m.k] = +e.target.value; gambarKalk(false); } }), h("output", { class: "num", id: "ko-" + m.k, for: "k-" + m.k }, String(st.kalk[m.k])))));
    DIM.forEach(m => { const o = $("ko-" + m.k); if (o) o.textContent = String(st.kalk[m.k]); });
    const r = RR.hitung(st.kalk, st.bobot, st.porsi);
    $("k-besar").replaceChildren(h("span", { class: "besar num" }, String(r.skor)), h("span", { class: "dari" }, "dari 100"), pil(r.prioritas));
    $("k-hitung").replaceChildren(...langkah(st.kalk, r));
  }

  // ---------- pengaturan ----------
  function gambarBobot() {
    $("geser").replaceChildren(...DIM.map(m => h("div", { class: "geser" }, h("label", { for: "w-" + m.k }, "Bobot " + m.nama.toLowerCase()),
      h("input", { type: "range", id: "w-" + m.k, min: "0", max: "50", step: "5", value: String(st.bobot[m.k]), oninput: e => { st.bobot[m.k] = +e.target.value; simpan(); hitungUlang(); } }), h("output", { class: "num", id: "o-" + m.k, for: "w-" + m.k }))));
    $("b-porsi").value = st.porsi;
  }
  function gambarSebar() {
    const total = DIM.reduce((a, m) => a + st.bobot[m.k], 0) || 1;
    DIM.forEach(m => { const o = $("o-" + m.k); if (o) o.textContent = pct(st.bobot[m.k] / total); });
    $("b-porsi-out").textContent = st.porsi + "%";
    const c = { Tinggi: 0, Sedang: 0, Rendah: 0 }; dok.forEach(d => c[d.prioritas]++);
    $("sebar").replaceChildren(...Object.keys(c).map(k => h("span", { class: "pil " + k }, GLIF[k], ` ${k}: ${c[k]} dokumen`)));
  }
  function hitungUlang() { urut = RR.gabung(st.bobot, st.porsi); gambarKerangka(); gambarSebar(); gambarKalk(false); gambarEval(); segarkan(); }
  $("b-porsi").addEventListener("input", e => { st.porsi = +e.target.value; simpan(); hitungUlang(); });
  $("b-reset").addEventListener("click", () => { st.bobot = { ...BOBOT_AWAL }; st.porsi = PORSI_AWAL; simpan(); gambarBobot(); hitungUlang(); });

  // ---------- tooltip dan simulasi ----------
  const tip = $("tip");
  function tampilTip(x, y, judul, isi) { tip.replaceChildren(h("b", {}, judul), isi); tip.hidden = false; const r = tip.getBoundingClientRect(); tip.style.left = Math.max(8, Math.min(x + 12, window.innerWidth - r.width - 8)) + "px"; tip.style.top = Math.max(8, y - r.height - 10) + "px"; }
  const sembunyiTip = () => { tip.hidden = true; };
  function gambarEval() {
    const n = st.nEval, e = RR.evaluasi(urut, n);
    $("e-n").value = n; $("e-n-out").textContent = String(n);
    $("eval-ket").textContent = `Ke dalam data dummy disisipkan ${e.total} kasus. Bila hanya ${n} dokumen yang sempat diperiksa, berapa kasus yang tertangkap menurut cara memilihnya?`;
    const baris = [["Peringkat skor terintegrasi", e.ml, `${e.ml} dari ${n} yang diperiksa`, `${n} dokumen teratas di Daftar prioritas`],
      ["Jalur merah (aturan)", e.merah, `sekitar ${f1(e.merah)} dari ${n}`, `Rata-rata bila ${n} dokumen dipilih dari ${e.nMerah} dokumen jalur merah`],
      ["Pilih acak", e.acak, `sekitar ${f1(e.acak)} dari ${n}`, `Rata-rata bila ${n} dokumen dipilih acak dari ${dok.length} dokumen`]];
    $("batang").replaceChildren(...baris.map(b => {
      const rel = h("div", { class: "rel", tabindex: "0", role: "img", "aria-label": `${b[0]}: ${b[2]}` }, h("i", { style: `width:${(b[1] / n * 100).toFixed(1)}%` }));
      const buka = ev => { const r = rel.getBoundingClientRect(); tampilTip(ev.clientX || r.left + 20, ev.clientY || r.top, b[2], b[3]); };
      rel.addEventListener("pointermove", buka); rel.addEventListener("focus", buka); rel.addEventListener("pointerleave", sembunyiTip); rel.addEventListener("blur", sembunyiTip);
      return h("div", {}, h("div", { class: "nm" }, b[0]), rel, h("div", { class: "nl num" }, b[2]));
    }));
  }
  $("e-n").addEventListener("input", e => { st.nEval = +e.target.value; gambarEval(); });

  // ---------- log umpan balik ----------
  let yakinHapus = false;
  function gambarLog() {
    const ids = Object.keys(st.kep).filter(id => byId[id]);
    $("log").replaceChildren(...(ids.length ? ids.map(id => { const k = st.kep[id], d = byId[id]; return h("tr", { "data-id": id, tabindex: "0" }, h("td", { class: "mono" }, id), h("td", {}, pil(d.prioritas)), h("td", {}, risikoUtama(d)), h("td", {}, h("span", { class: "pil " + k.k }, KEP[k.k])), h("td", {}, pilStatus(id)), h("td", { style: "white-space:normal" }, k.catatan || "")); })
      : [h("tr", {}, h("td", { colspan: "6", class: "kosong" }, "Belum ada keputusan. Buka Daftar prioritas, pilih dokumen, lalu beri keputusan pada kartu risikonya."))]));
    $("log-aksi").replaceChildren(...(ids.length ? [h("button", { class: "btn", type: "button", onclick: () => { if (!yakinHapus) { yakinHapus = true; gambarLog(); return; } yakinHapus = false; st.kep = {}; st.kabar = ""; simpan(); segarkan(); } }, yakinHapus ? "Klik sekali lagi untuk menghapus semua keputusan" : "Hapus semua keputusan")] : []));
  }
  $("log").addEventListener("click", e => { const tr = e.target.closest("tr[data-id]"); if (tr) bukaDokumen(tr.dataset.id); });

  // ---------- tab dan filter ----------
  const TAB = ["kerangka", "daftar", "coba"];
  function bukaTab(t) { TAB.forEach(k => { $("tab-" + k).setAttribute("aria-selected", k === t ? "true" : "false"); $("panel-" + k).hidden = k !== t; }); try { history.replaceState(null, "", "#" + t); } catch (e) { /* abaikan */ } }
  TAB.forEach(k => $("tab-" + k).addEventListener("click", () => { bukaTab(k); if (k === "daftar" && st.sub !== "semua") bukaSub(st.sub, true); }));
  $("f-proses").replaceChildren(h("option", { value: "" }, "Semua"), ...PROSES.map(p => h("option", { value: p.id }, `${p.nama} (${p.dok})`)));
  $("f-risiko").replaceChildren(h("option", { value: "" }, "Semua"), ...DIM_DOK.map(k => h("option", { value: k }, DK[k].nama)));
  $("f-urut").replaceChildren(h("option", { value: "skor" }, "Skor terintegrasi"), ...DIM.map(m => h("option", { value: m.k }, "Skor " + m.nama.toLowerCase())));
  function sinkronFilter() { $("f-proses").value = st.proses; $("f-prio").value = st.prio; $("f-risiko").value = st.risiko; $("f-status").value = st.status; $("f-urut").value = st.urut; $("f-cari").value = st.cari; $("f-kunci").checked = st.kunci; }
  const ubah = (id, k, ev) => $(id).addEventListener(ev || "change", e => { st[k] = e.target.type === "checkbox" ? e.target.checked : e.target.value; st.tampil = 25; gambarTabel(); if (k === "kunci") gambarKartu(); });
  ubah("f-proses", "proses"); ubah("f-prio", "prio"); ubah("f-risiko", "risiko"); ubah("f-status", "status"); ubah("f-urut", "urut"); ubah("f-cari", "cari", "input"); ubah("f-kunci", "kunci");

  function segarkan() {
    if (st.sub !== "semua") { const a = saring(); if (!a.some(d => d.id === st.pilih)) st.pilih = a.length ? a[0].id : null; } else if (!st.pilih) st.pilih = urut[0].id;
    gambarSub(); gambarRingkas(); gambarTabel(); gambarKartu(); gambarLog();
  }
  gambarKerangka(); gambarDimensi(); gambarBobot(); gambarSebar(); gambarKalk(true); gambarEval(); sinkronFilter(); segarkan();
  const awal = (location.hash || "").slice(1); if (TAB.includes(awal)) bukaTab(awal); else if (awal === "proses" || awal === "selesai") { bukaTab("daftar"); bukaSub(awal); }
})();
