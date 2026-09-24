// Render di un reel infografico: template.html + dati JSON -> video verticale 1080x1920.
// Uso:  node render.mjs --data data.example.json --out reel.mp4
// Richiede: playwright (+ chromium) e ffmpeg nel PATH (per l'mp4). Senza ffmpeg resta il .webm.
import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import { dirname, join, resolve } from 'path';
import { readFileSync, mkdirSync, existsSync, readdirSync, renameSync } from 'fs';
import { execFileSync } from 'child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
function arg(name, def) { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : def; }

const dataPath = resolve(arg('--data', join(__dirname, 'data.example.json')));
const outPath = resolve(arg('--out', join(__dirname, 'out', 'reel.mp4')));
const data = JSON.parse(readFileSync(dataPath, 'utf8'));
// Il Chromium di Playwright non decodifica H.264: per i video Cloudinary chiediamo la versione webm.
if (data.bgVideo && /res\.cloudinary\.com/.test(data.bgVideo)) data.bgVideo = data.bgVideo.replace(/\.(mp4|mov|m4v)(\?.*)?$/i, '.webm');
const tmpDir = join(__dirname, 'out');
mkdirSync(tmpDir, { recursive: true });

const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--force-color-profile=srgb'] });
const ctx = await browser.newContext({
  viewport: { width: 360, height: 640 },
  deviceScaleFactor: 3,
  recordVideo: { dir: tmpDir, size: { width: 1080, height: 1920 } },
});
await ctx.addInitScript(d => { window.REEL = d; }, data);
const page = await ctx.newPage();
const t0 = Date.now(); // la registrazione parte con la pagina: tutto ciò che precede __start è schermo vuoto
await page.goto('file://' + join(__dirname, 'template.html'), { waitUntil: 'load' });
try { await page.evaluate(() => document.fonts && document.fonts.ready); } catch {}
await page.waitForTimeout(400);
// Il template legge dati e modo da window.REEL: qui basta partire (dopo che l'eventuale video di sfondo è pronto).
await page.evaluate(() => new Promise(r => { const v = document.querySelector('#bg video'); if (!v || v.readyState >= 3) return r(); v.addEventListener('canplay', () => r(), { once: true }); setTimeout(r, 8000); }));
// +0.55 s: l'hook ha finito la sua entrata in dissolvenza, così la copertina automatica di IG è leggibile.
const skip = ((Date.now() - t0) / 1000 + 0.55).toFixed(2);
const total = await page.evaluate(() => (window.__start && window.__start(), window.__dur || 18600));
await page.waitForTimeout(total + 700);
const video = page.video();
await ctx.close();
await browser.close();
const webm = video ? await video.path() : readdirSync(tmpDir).filter(f => f.endsWith('.webm')).map(f => join(tmpDir, f))[0];
console.log('WEBM:', webm);

// Conversione mp4 se ffmpeg è disponibile
try {
  // -ss dopo -i: taglio preciso del caricamento iniziale, così il primo fotogramma (copertina IG) è già l'hook.
  execFileSync('ffmpeg', ['-y', '-i', webm, '-ss', skip, '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', '-r', '30', outPath], { stdio: 'inherit' });
  console.log('MP4:', outPath);
} catch (e) {
  const fallback = outPath.replace(/\.mp4$/, '.webm');
  renameSync(webm, fallback);
  console.log('ffmpeg non disponibile: salvato', fallback, '(Instagram non accetta webm: installa ffmpeg)');
  process.exitCode = 1;
}
