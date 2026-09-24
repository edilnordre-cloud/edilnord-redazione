# Reel Kit — reel infografici faceless (gratis)

Genera un **reel verticale 1080×1920** (mp4) da un **template HTML** + un file **dati JSON**.
Niente montaggio a mano, niente AI a pagamento: un browser headless "riprende" il template
animato e `ffmpeg` produce l'mp4. Palette bloccata: **bianco · #9dc0aa · #152319**.

## Cosa contiene
- `template.html` — il reel (hook → mappa zone → barre → trend → CTA in DM). Legge i dati da `window.REEL` (render) o da `__apply` (anteprima nell'app). Aperto da solo mostra l'esempio Brugherio; render e anteprima partono vuoti, quindi nessun testo d'esempio finisce in un reel vero. Niente finta interfaccia Instagram dentro al video: like, handle e audio li mette IG.
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

## Dall'app (automatico)
Anteprima reel → scegli **Solo infografica**, **Infografica + media** (foto che cambiano a ogni scena, o un video) o **Solo media** (slideshow n8n / MP4 pronto).
Con i primi due, "Segna come pronto" chiama n8n (`redazione-render-reel`) → questa Action rende l'mp4 → Cloudinary →
`redazione-reel-renderizzato` scrive `url_video` sul Calendario e avvisa su Telegram. Il ritorno è autenticato da un
gettone monouso che n8n genera a ogni render (`job_token`): su GitHub non serve nessun secret.
Serve solo, in n8n, un token GitHub fine-grained con *Actions: read & write* su questo repo (nodo *Avvia GitHub Action*).

## Uso manuale (gratis)
GitHub → scheda **Actions** → workflow **Reel** → **Run workflow**.
Produce l'mp4 come *artifact* scaricabile. I dati settimanali li mette l'agente in `data.json`
(oppure incolli il JSON nell'input del workflow).

## Dati (schema `data.json`)
Campi principali: `modo` (`video` hook+CTA · `dati` +barre · `dati_trend` +trend · `full` tutto · `media` slideshow · `mp4`),
`hook`, `hookSub`, `zones[3]{name,value}`, `bars[]{icon,name,value,w,cls}`, `trendPct`, `trendNote`, `ctaQ`, `ctaSub`,
`bgList` (foto di sfondo, una per scena), `bgVideo` (video di sfondo), `bgStyle` (`plain` sfondo brand · `mappa`), `overlay[]` (righe per `modo: media`).
`w` = larghezza barra (es. `"100%"`); `cls` = colore barra (`a` sage, `b` sage chiaro, `c` sage scuro).

## Nota
L'audio di tendenza si aggiunge **su Instagram** al momento della pubblicazione (libreria gratuita IG).
Questo kit produce il video; la musica trend si sceglie lì.
