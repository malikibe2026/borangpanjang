# Video laporan 30 saat — Laporan MKO & Penghantaran Borang BE2026

Merakam dashboard `REPORT-BORANG/index.html` dan menjadikannya video MP4 1920×1080, 30 saat:

| Masa | Kandungan |
|---|---|
| 0–3s | Kad pembuka: tajuk + masa status data |
| 3–27s | Skrol dashboard, henti ~4s di setiap bahagian (KPI → Komposisi → Kod Respon → Daerah → Tarikh/Operasi/Penyelia) |
| 27–30s | Rumusan: Siap MKO, Belum Respon, Hantar Kawalan, Baki ke sasaran |

## Cara guna

```bash
./buat_video.sh data.csv    # data sebenar (CSV tab sumber dashboard, gid 998975185)
./buat_video.sh             # data Demo — video bertanda "DATA DEMO"
```

Output: `out/laporan_mko_YYYYMMDD_HHMM.mp4`.

## Nota
- Dashboard biasanya ambil CSV terus dari Google Sheet yang diterbitkan. Skrip ini gantikan permintaan itu dengan fail CSV tempatan, jadi angka dalam video = angka dalam CSV yang diberi.
- Chart.js dan fon (Plus Jakarta Sans, DM Mono) dihidangkan dari pakej npm tempatan — tidak perlu akses internet semasa merakam.
- "Status setakat" = masa rakaman (zon waktu Asia/Kuala_Lumpur), sama seperti label "Kemaskini" pada dashboard.
- CSV dan video diabaikan oleh git (`.gitignore`) kerana mengandungi data operasi.
