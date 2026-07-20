# Redazione Edilnord

Centro editoriale statico per comporre in anticipo i contenuti **blog + Instagram + Facebook** di
Edilnord RE (consulenza immobiliare, Brugherio MB), approvarli e lasciare che un motore **n8n** li
pubblichi da solo alle date programmate.

> **Scopo strategico.** Non pubblicare per pubblicare: costruire *leadership percepita* a Brugherio e
> dintorni per essere il primo nome in mente a un **proprietario** quando decide di vendere casa.
> Ogni contenuto rafforza una percezione — *conosce il paese · sa i numeri · vende davvero* — e
> converge sul valutatore online. Il cliente-obiettivo è sempre il **venditore**, mai il compratore.

Costo zero: **GitHub Pages** (questa app) + **Google Sheets** (database) + **Cloudinary** (media) +
**n8n self-hosted** (motore). Nessun build step: si deploya con un `git push`.

---

## Architettura

```
App statica (GitHub Pages)  ──HTTPS + X-Redazione-Key──►  Webhook n8n  ──►  Google Sheet "Redazione Edilnord"
     index.html (vanilla)                                  (5 workflow)      Cloudinary · WordPress · IG/FB Graph
```

- **Frontend**: un solo `index.html`, HTML+CSS+JS vanilla. Nessun framework, nessuna build.
- **Database**: Google Sheet `Redazione Edilnord` — tab `Calendario`, `Idee`, `Interviste`, `Config`, `Metriche`.
- **Sicurezza**: ogni webhook verifica l'header `X-Redazione-Key`. La chiave è chiesta una volta e vive
  **solo in memoria JS di sessione** (mai `localStorage`/`sessionStorage`). Chiave errata → n8n risponde 401.

## Le sezioni

| Sezione | Cosa fa |
|---|---|
| 🗓️ **Calendario** | Vista mese + lista fino a fine settembre 2026. Slot fissi: Lun Territorio · Mer Dati · Ven Vetrina · Sab Reel + blog ogni 2 settimane. Drag&drop desktop per spostare. Martedì Immobiliare mostrato come "gestito esternamente". |
| 💡 **Idee** | Schede dell'agente-giornalista (lun 7:00 o on-demand). ✓ Sviluppa → crea bozza nello slot giusto e apre il Composer. ✕ Scarta con annulla. |
| ✍️ **Composer** | Percorso a 6 step: Idea → Intervista → Testo → Media → Anteprima → Programma. Intervista Mistral (la tua opinione è la tesi), anteprima IG realistica, vincolo foto+intervista per lo stato "pronto". |
| 🗂️ **Batch** | Un tema madre + una intervista → 3-6 contenuti diversi in tabella. Upload multiplo, distribuzione automatica sugli slot, azioni di massa. Serve per riempire agosto/chiusure. |
| 🛒 **Lista spesa** | Tutti i contenuti in bozza senza media, raggruppati per luogo. Spuntabile da telefono, esportabile su Telegram, upload diretto che aggancia il media al contenuto. |
| ⚙️ **Impostazioni** | Modalità Vacanza (con preset Agosto/Natale/Pasqua/Ponte + cadenza ridotta), stato DRY-RUN, uscita sessione. |

## Workflow n8n

| Workflow | Trigger / webhook | Funzione |
|---|---|---|
| **Redazione – API Dati** | `redazione-carica-dati`, `-salva-contenuto`, `-salva-idea`, `-salva-intervista`, `-salva-config` | Legge/scrive Sheet (Calendario, Idee, Interviste, Config) + Immobili dal CRM. |
| **Redazione – API AI** | `redazione-intervista`, `-genera`, `-genera-batch` | Domande d'intervista, generazione contenuto (CTA soft 1-su-3, hashtag a rotazione), batch. |
| **Redazione – Publisher** | Schedule ogni 30 min + `redazione-telegram-cmd` | Anteprima Telegram T-2h (opt-out `STOP-{id}`/`MOD-{id}`, `OK-{id}` esplicito opzionale), Modalità Vacanza, rinvii automatici, pubblicazione WP/IG/Reel con geotag Brugherio, `DRY_RUN`. |
| **Redazione – Monta Reel** | `redazione-monta-reel` | Slideshow ffmpeg 1080×1920 con overlay drawtext → Cloudinary. Cleanup `/tmp` garantito, 1 job alla volta. |
| **Redazione – Agente Idee** | Schedule lun 7:00 + `redazione-genera-idee` | Fonti gratuite (Reddit, RSS locali, Google autocomplete) → Mistral → schede-idea per pilastro, dedup via hash. |

Riusa i workflow esistenti: **Upload Foto** (`edilnord-upload-foto`, Cloudinary), **Suggerisci Orario**
(`edilnord-suggerisci-orario`, Windsor.ai, suggerimento non vincolante).

## Logica di pubblicazione (opt-out)

Il default è **opt-out**: 2 ore prima dell'orario arriva l'anteprima su Telegram; se non rispondi, il
contenuto esce comunque (era già stato scritto e approvato in composizione).
- `STOP-{id}` → bloccato · `MOD-{id}` → torna in bozza · nessuna risposta → pubblica.
- Flag **OK esplicito** per contenuti delicati: senza `OK-{id}` viene riprogrammato (max 2 rinvii, poi bozza).
- **Modalità Vacanza**: niente finestra di blocco, i pronti escono da soli; i flaggati "OK esplicito"
  restano in attesa (l'app avvisa se ne programmi uno dentro un periodo di chiusura).

## Reel — audio

Via Graph API **non** è possibile usare l'audio *trending* di Instagram: per i Reel importanti conviene
la pubblicazione manuale dall'app IG. Il montaggio automatico usa una traccia silenziosa o un mp3
royalty-free: metti 2-3 file in `assets/audio/` e passa `audio_url` al workflow *Monta Reel* (Cloudinary),
oppure carica in Canva Pro un mp4 già montato (strada consigliata per la qualità).

## Deploy

Pubblicato via **GitHub Pages** sul branch `main` (cartella root). Ogni `git push` aggiorna l'app.
Nessuna variabile d'ambiente: la sola configurazione runtime è la `X-Redazione-Key`, inserita a mano.

## Uso in 5 righe

1. Apri l'app, incolla la **X-Redazione-Key** (una volta per sessione).
2. **Idee** → *Sviluppa* un'idea, oppure **Calendario** → *Nuovo contenuto*.
3. Nel **Composer**: rispondi all'intervista, genera testo, carica **foto reali**, programma → *Pronto*.
4. 2h prima ricevi l'anteprima su **Telegram**: `STOP-`/`MOD-` o non fare nulla.
5. Per le chiusure: **Batch** (produci in blocco) + **Lista spesa** (esci a fotografare) + **Modalità Vacanza**.
