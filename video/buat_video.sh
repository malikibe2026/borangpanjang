#!/usr/bin/env bash
# Jana video laporan 30 saat daripada dashboard REPORT-BORANG/index.html.
# Guna: ./buat_video.sh [data.csv]   (tanpa CSV → data Demo)
set -euo pipefail
cd "$(dirname "$0")"
DASH="${DASHBOARD_HTML:-../../malikibe2026/report-borang/index.html}"
[ -f "$DASH" ] || git clone --depth 1 https://github.com/malikibe2026/REPORT-BORANG "$(dirname "$DASH")"
[ -d node_modules ] || npm install --silent
python3 -c "import PIL, imageio_ffmpeg" 2>/dev/null || pip install -q pillow imageio-ffmpeg
node capture.mjs "$DASH" ${1:+"$1"}
python3 build.py "out/laporan_mko_$(date +%Y%m%d_%H%M).mp4"
