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
await page.goto('file://' + join(__dirname, 'template.html'), { waitUntil: 'load' });
try { await page.evaluate(() => document.fonts && document.fonts.ready); } catch {}
await page.waitForTimeout(400);
const total = await page.evaluate(() => (window.__start && window.__start(), window.__dur || 18600));
await page.waitForTimeout(total + 700);
const video = page.video();
await ctx.close();
await browser.close();
const webm = video ? await video.path() : readdirSync(tmpDir).filter(f => f.endsWith('.webm')).map(f => join(tmpDir, f))[0];
console.log('WEBM:', webm);

// Conversione mp4 se ffmpeg è disponibile
try {
  execFileSync('ffmpeg', ['-y', '-i', webm, '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', '-r', '30', outPath], { stdio: 'inherit' });
  console.log('MP4:', outPath);
} catch (e) {
  const fallback = outPath.replace(/\.mp4$/, '.webm');
  renameSync(webm, fallback);
  console.log('ffmpeg non disponibile: salvato', fallback);
}
