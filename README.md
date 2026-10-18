# Radar Risiko PPFTZ (prototipe, data dummy)

Prototipe skor risiko lima dimensi (klasifikasi, tarif, nilai pabean, profil pelaku usaha, anomali transaksi) untuk dokumen PPFTZ. Semua dokumen dan pelaku usaha di dalamnya fiktif.

## Isi folder

| File | Isi |
|---|---|
| `index.html` | Halaman utama |
| `css/style.css` | Tampilan |
| `js/core.js` | Pembuatan data dummy, lima model, dan rumus skor |
| `js/ui.js` | Tampilan dan interaksi (tab, daftar prioritas, kartu risiko, On Progress Tindak Lanjut, Selesai, kalkulator) |
| `server.js` | Server lokal sederhana (Node.js, tanpa instalasi paket) |

## Cara menjalankan di localhost

Pilih salah satu.

### Cara 1: VS Code + Live Server (paling mudah)
1. Buka VS Code, pilih **File > Open Folder**, lalu pilih folder `radar-risiko-ppftz`.
2. Pasang ekstensi **Live Server** (Ritwick Dey). VS Code biasanya langsung menawarkannya.
3. Klik kanan `index.html`, pilih **Open with Live Server**.
4. Browser terbuka di `http://127.0.0.1:5500/index.html`.

### Cara 2: Node.js
1. Pasang Node.js dari https://nodejs.org (versi LTS).
2. Di VS Code buka **Terminal > New Terminal**, lalu jalankan:
   ```
   npm start
   ```
3. Buka `http://localhost:3000` di browser. Untuk berhenti, tekan `Ctrl+C`.
   Ganti port bila perlu: `PORT=8080 npm start` (Windows PowerShell: `$env:PORT=8080; npm start`).

### Cara 3: Python
Di terminal, dari dalam folder ini:
```
python -m http.server 8000
```
Lalu buka `http://localhost:8000`.

## Catatan
- Halaman ini juga bisa dibuka langsung dengan klik dua kali `index.html`, tetapi menjalankannya lewat localhost lebih disarankan.
- Font diambil dari Google Fonts. Tanpa internet, halaman tetap jalan dengan font cadangan.
- Keputusan petugas dan pengaturan bobot disimpan di browser (localStorage). Untuk mengulang dari awal, buka tab **Coba hitung** lalu tekan **Hapus semua keputusan**.
- Mengubah rumus skor: lihat fungsi `hitung` dan konstanta `PORSI_AWAL`, `BOBOT_AWAL`, `AMBANG` di `js/core.js`.
