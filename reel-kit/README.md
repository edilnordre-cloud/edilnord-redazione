# Reel Kit — reel infografici faceless (gratis)

Genera un **reel verticale 1080×1920** (mp4) da un **template HTML** + un file **dati JSON**.
Niente montaggio a mano, niente AI a pagamento: un browser headless "riprende" il template
animato e `ffmpeg` produce l'mp4. Palette bloccata: **bianco · #9dc0aa · #152319**.

## Cosa contiene
- `template.html` — il reel (5 momenti: hook → mappa zone → barre → trend → CTA in DM). Legge i dati da `window.REEL`.
- `render.mjs` — apre il template, inietta i dati, registra il video, converte in mp4.
- `data.example.json` — esempio (reel "prezzi per zona di Brugherio").
- `.github/workflows/reel.yml` — Action gratuita: rende il reel su GitHub e lo dà come file scaricabile.

## Uso locale
```bash
cd reel-kit
npm install
npx playwright install chromium
node render.mjs --data data.example.json --out out/reel.mp4
```
Serve `ffmpeg` nel PATH per l'mp4; senza, resta un `.webm` (comunque riproducibile).

## Uso automatico (gratis, consigliato)
GitHub → scheda **Actions** → workflow **Reel** → **Run workflow**.
Produce l'mp4 come *artifact* scaricabile. I dati settimanali li mette l'agente in `data.json`
(oppure incolli il JSON nell'input del workflow).

## Dati (schema `data.json`)
Campi principali: `hook`, `hookSub`, `zones[3]{name,value}`, `bars[]{icon,name,value,w,cls}`,
`trendPct`, `trendNote`, `ctaQ`, `ctaSub`, `audio`, `bg` (URL foto di sfondo; se `null` usa la mappa disegnata).
`w` = larghezza barra (es. `"100%"`); `cls` = colore barra (`a` sage, `b` sage chiaro, `c` sage scuro).

## Nota
L'audio di tendenza si aggiunge **su Instagram** al momento della pubblicazione (libreria gratuita IG).
Questo kit produce il video; la musica trend si sceglie lì.
