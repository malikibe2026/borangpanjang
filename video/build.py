"""Bina video MP4 30 saat daripada imej yang dihasilkan oleh capture.mjs.
Guna: python3 build.py [out/laporan.mp4]
Susunan: kad pembuka (3s) → skrol dashboard dengan henti di setiap bahagian (24s) → rumusan (3s)."""
import json, subprocess, sys
from PIL import Image, ImageDraw
import imageio_ffmpeg

W, H, FPS = 1920, 1080, 30
T_INTRO, T_SCROLL, T_OUTRO, FADE, MOVE = 3.0, 24.0, 3.0, 0.5, 1.0
out = sys.argv[1] if len(sys.argv) > 1 else 'out/laporan_mko_30s.mp4'

info = json.load(open('out/info.json'))
page = Image.open('out/page.png').convert('RGB')
intro = Image.open('out/intro.png').convert('RGB')
outro = Image.open('out/outro.png').convert('RGB')
max_y = page.height - H

# Titik henti: atas halaman + setiap tajuk bahagian (dihadkan ke hujung halaman, gabung yang terlalu rapat).
stops = [0]
for s in info['secs'][1:]:
    y = max(0, min(max_y, s['y'] - 24))
    if y - stops[-1] > 300:
        stops.append(y)
    elif y > stops[-1]:
        stops[-1] = y  # bahagian terakhir yang dihadkan: anjak henti ke hujung halaman
# Bahagian yang lebih tinggi daripada skrin: tambah henti di tengah supaya semua carta sempat dilihat.
full = []
for a, b in zip(stops, stops[1:] + [None]):
    full.append(a)
    if b is not None and b - a > H * 1.1:
        full.append(a + (b - a) // 2)
stops = full
n = len(stops)
hold = (T_SCROLL - MOVE * (n - 1)) / n

def ease(t):
    return t * t * (3 - 2 * t)

def scroll_y(t):
    for i in range(n):
        if t < hold:
            return stops[i]
        t -= hold
        if i < n - 1:
            if t < MOVE:
                return stops[i] + (stops[i + 1] - stops[i]) * ease(t / MOVE)
            t -= MOVE
    return stops[-1]

def dash_frame(t):
    y = int(round(scroll_y(t)))
    im = page.crop((0, y, W, y + H))
    d = ImageDraw.Draw(im)
    d.rectangle((0, H - 6, int(W * min(1, t / T_SCROLL)), H), fill=(56, 189, 248))  # bar kemajuan
    if info.get('demo'):
        d.rounded_rectangle((W - 250, H - 70, W - 30, H - 22), 24, fill=(245, 158, 11))
        d.text((W - 228, H - 58), 'DATA DEMO', fill=(10, 22, 40), font_size=24)
    return im

total = T_INTRO + T_SCROLL + T_OUTRO
ff = imageio_ffmpeg.get_ffmpeg_exe()
proc = subprocess.Popen([ff, '-y', '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{W}x{H}',
                         '-r', str(FPS), '-i', '-', '-c:v', 'libx264', '-preset', 'medium', '-crf', '20',
                         '-pix_fmt', 'yuv420p', '-movflags', '+faststart', out], stdin=subprocess.PIPE)
for f in range(int(total * FPS)):
    t = f / FPS
    if t < T_INTRO:
        im = intro
        if t > T_INTRO - FADE:
            im = Image.blend(intro, dash_frame(0), (t - (T_INTRO - FADE)) / FADE)
    elif t < T_INTRO + T_SCROLL:
        im = dash_frame(t - T_INTRO)
        if t > T_INTRO + T_SCROLL - FADE:
            im = Image.blend(im, outro, (t - (T_INTRO + T_SCROLL - FADE)) / FADE)
    else:
        im = outro
    proc.stdin.write(im.tobytes())
proc.stdin.close()
proc.wait()
print(f'Siap: {out} ({total:.0f}s, henti di y={stops}, tahan {hold:.1f}s setiap satu)')
