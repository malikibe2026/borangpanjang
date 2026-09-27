// Tangkap dashboard REPORT-BORANG/index.html sebagai imej untuk video.
// Guna: node capture.mjs <laluan index.html> [data.csv]
// Tanpa data.csv → guna data Demo terbina dalam dashboard.
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const [htmlPath, csvPath] = process.argv.slice(2);
if (!htmlPath) { console.error('Guna: node capture.mjs <index.html> [data.csv]'); process.exit(1); }
const OUT = path.resolve('out'); fs.mkdirSync(OUT, { recursive: true });
const chartJs = fs.readFileSync(new URL('./node_modules/chart.js/dist/chart.umd.js', import.meta.url));
const W = 1920, H = 1080;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1,
  locale: 'ms-MY', timezoneId: 'Asia/Kuala_Lumpur' });

// Chart.js dari pakej npm tempatan; CSV dari fail tempatan (atau gagal → Demo).
await page.route('**/cdn.jsdelivr.net/**', r => r.fulfill({ body: chartJs, contentType: 'application/javascript' }));
// Chromium di sini tiada akses Google Fonts → hidangkan fon dari pakej @fontsource tempatan.
const fontCss = () => {
  const face = (fam, dir, w) => {
    const f = new URL(`./node_modules/@fontsource/${dir}/files/${dir}-latin-${w}-normal.woff2`, import.meta.url);
    return fs.existsSync(f) ? `@font-face{font-family:'${fam}';font-weight:${w};font-style:normal;src:url(data:font/woff2;base64,${fs.readFileSync(f).toString('base64')}) format('woff2')}` : '';
  };
  return [300, 400, 500, 600, 700, 800].map(w => face('Plus Jakarta Sans', 'plus-jakarta-sans', w)).join('\n')
    + [400, 500].map(w => face('DM Mono', 'dm-mono', w)).join('\n');
};
const FONT_CSS = fontCss();
await page.route('**/fonts.googleapis.com/**', r => r.fulfill({ body: FONT_CSS, contentType: 'text/css' }));
await page.route('**/docs.google.com/**', r => csvPath
  ? r.fulfill({ body: fs.readFileSync(csvPath), contentType: 'text/csv' })
  : r.fulfill({ status: 404, body: '' }));

await page.goto('file://' + path.resolve(htmlPath));
if (!csvPath) await page.evaluate(() => loadDemo());
await page.waitForSelector('#dashboard', { state: 'visible', timeout: 30000 });
await page.evaluate(() => document.fonts.ready);
// Lukis semula carta selepas fon dimuatkan supaya teks tengah donut guna fon betul.
await page.evaluate(() => applyFilters());
await page.waitForTimeout(1500);

// Sorok butang navigasi yang tak berguna dalam video.
await page.addStyleTag({ content: '.filterbar .btn,.filterbar a.btn{display:none!important}' });
await page.waitForTimeout(300);

const info = await page.evaluate(() => {
  const secs = [...document.querySelectorAll('#dashboard .sec-title')].map(e => ({
    title: e.querySelector('h2').textContent.trim(),
    y: Math.round(e.getBoundingClientRect().top + scrollY),
  }));
  const kpi = [...document.querySelectorAll('#kpi-grid > *')].map(c => c.innerText.split('\n').map(s => s.trim()).filter(Boolean));
  return { secs, kpi, updated: document.getElementById('last-updated').textContent,
           height: document.documentElement.scrollHeight, demo: false };
});
info.demo = !csvPath;
await page.screenshot({ path: path.join(OUT, 'page.png'), fullPage: true });
fs.writeFileSync(path.join(OUT, 'info.json'), JSON.stringify(info, null, 2));
console.log(JSON.stringify(info, null, 2));

// Kad pembuka & penutup
const k = Object.fromEntries(info.kpi.map(c => [c[1], c.slice(2)]));
const val = n => (k[n] || ['—'])[0], sub = n => (k[n] || [,''])[1] || '';
const css = `<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&family=DM+Mono:wght@500&display=swap"><style>
*{margin:0;box-sizing:border-box}body{width:${W}px;height:${H}px;font-family:'Plus Jakarta Sans';color:#fff;
background:radial-gradient(1200px 500px at 85% -10%,rgba(56,189,248,.25),transparent 70%),linear-gradient(135deg,#0a1628,#0f2044 50%,#15295e);
display:flex;flex-direction:column;justify-content:center;padding:0 140px;position:relative}
.bar{position:absolute;left:0;right:0;bottom:0;height:8px;background:linear-gradient(90deg,#2563eb,#38bdf8 45%,#8b5cf6)}
.tag{display:inline-block;border:2px solid rgba(255,255,255,.35);border-radius:40px;padding:10px 26px;font-weight:700;letter-spacing:.12em;font-size:24px;margin-bottom:36px}
.demo{background:#f59e0b;color:#0a1628;border-color:#f59e0b;margin-left:16px}
h1{font-size:76px;font-weight:800;line-height:1.1;letter-spacing:-.01em}h2{font-size:34px;font-weight:600;color:#bcd3f5;margin-top:22px}
.ts{margin-top:60px;font-size:28px;color:#94b4e0}.ts b{font-family:'DM Mono';color:#38bdf8;font-weight:500}
.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:36px;margin-top:56px}
.c{background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.14);border-radius:24px;padding:40px}
.c .l{font-size:22px;letter-spacing:.1em;color:#94b4e0;font-weight:700}.c .v{font-size:96px;font-weight:800;margin:10px 0}.c .s{font-size:26px;color:#cfe0f7}
.g{color:#34d399}.r{color:#f87171}.b{color:#38bdf8}</style>`;
// Lukis kad dalam dokumen dashboard sendiri supaya fon web yang sudah dimuatkan boleh digunakan.
const showCard = async html => {
  await page.evaluate(h => { scrollTo(0, 0); document.body.innerHTML = h; }, html);
  await page.waitForTimeout(300);
};
const demoTag = info.demo ? '<span class="tag demo">DATA DEMO</span>' : '';
await showCard(`${css}<div><span class="tag">DOSM SELANGOR · UNIT HARGA-HARGA</span>${demoTag}</div>
<h1>Laporan MKO &amp; Penghantaran<br>Borang BE2026</h1><h2>Rangka Kawalan Fasa 2 &amp; 3 · Hartanah (308) &amp; Runcit (337)</h2>
<div class="ts">Status setakat <b>${info.updated}</b></div><div class="bar"></div>`);
await page.evaluate(async () => { await document.fonts.load("800 76px 'Plus Jakarta Sans'"); await document.fonts.load("500 28px 'DM Mono'"); await document.fonts.ready; });
await page.screenshot({ path: path.join(OUT, 'intro.png') });
await showCard(`${css}<div><span class="tag">RUMUSAN</span>${demoTag}</div><h1>Pencapaian Keseluruhan</h1>
<div class="grid">
<div class="c"><div class="l">SIAP MKO</div><div class="v g">${val('SIAP MKO (11+50+LK+B)')}</div><div class="s">${sub('SIAP MKO (11+50+LK+B)')}</div></div>
<div class="c"><div class="l">BELUM RESPON</div><div class="v r">${val('BELUM RESPON')}</div><div class="s">${sub('BELUM RESPON')}</div></div>
<div class="c"><div class="l">HANTAR KAWALAN</div><div class="v b">${val('HANTAR KAWALAN')}</div><div class="s">daripada ${val('JUMLAH NO SIRI (AGIHAN)')} No. Siri agihan</div></div>
</div><div class="ts">Baki ke sasaran: <b>${val('BAKI KE SASARAN')}</b> · Dikemas kini <b>${info.updated}</b></div><div class="bar"></div>`);
await page.evaluate(async () => { await document.fonts.load("800 96px 'Plus Jakarta Sans'"); await document.fonts.ready; });
await page.screenshot({ path: path.join(OUT, 'outro.png') });
await browser.close();
