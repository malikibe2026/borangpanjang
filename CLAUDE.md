# CLAUDE.md

Panduan untuk Claude Code dalam repo ini.

## Bahasa & gaya
- Balas pengguna dalam Bahasa Malaysia. Komen kod, mesej commit dan README juga dalam BM (ikut gaya sedia ada).
- Dokumen rasmi (memo, laporan, surat) guna nada formal jabatan kerajaan Malaysia.

## Struktur repo
- `video/` — penjana video laporan 30 saat (1920×1080 MP4) daripada dashboard `REPORT-BORANG/index.html` (Laporan MKO & Penghantaran Borang BE2026, DOSM Selangor).
  - `buat_video.sh` — skrip utama: klon dashboard jika tiada, pasang kebergantungan, jalankan `capture.mjs` kemudian `build.py`.
  - `capture.mjs` — Playwright: buka dashboard, gantikan CSV Google Sheet dengan fail tempatan (atau data Demo), tangkap `out/page.png`, `out/intro.png`, `out/outro.png`, `out/info.json`.
  - `build.py` — Pillow + imageio-ffmpeg: kad pembuka 3s → skrol dashboard berhenti di setiap `.sec-title` 24s → rumusan 3s.

## Arahan
```bash
cd video
./buat_video.sh data.csv   # data sebenar (CSV tab dashboard, gid 998975185)
./buat_video.sh            # data Demo — video bertanda "DATA DEMO"
```
- Laluan dashboard boleh ditukar dengan `DASHBOARD_HTML=/laluan/index.html`. Lalai: `../../malikibe2026/report-borang/index.html`.
- Tiada ujian automatik. Untuk sahkan perubahan, jalankan `./buat_video.sh` (mod Demo) dan semak `out/*.png` serta MP4.

## Perkara penting
- Chromium dalam persekitaran ini tiada akses internet luar: Chart.js dan fon (Plus Jakarta Sans, DM Mono) dihidang dari `node_modules` melalui `page.route`. Jangan tambah aset CDN baharu tanpa laluan tempatan yang sama.
- Jangan jalankan `playwright install`; Chromium sudah dipasang (`PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers`).
- `capture.mjs` bergantung pada fungsi/elemen dashboard: `loadDemo()`, `applyFilters()`, `#dashboard`, `#kpi-grid`, `#last-updated`, `.sec-title h2`. Label KPI (cth. `SIAP MKO (11+50+LK+B)`, `BELUM RESPON`, `HANTAR KAWALAN`, `JUMLAH NO SIRI (AGIHAN)`, `BAKI KE SASARAN`) mesti sepadan tepat dengan teks dashboard — jika dashboard berubah, kemas kini di sini.
- Zon waktu rakaman `Asia/Kuala_Lumpur`, locale `ms-MY`.
- Data operasi sulit: `*.csv`, `out/` dan `node_modules/` diabaikan git. Jangan commit CSV atau video.
