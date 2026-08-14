# ARPG Companion Hub — Redesign ibrido Dark Editorial + Game Museum

## Obiettivo del redesign

Il redesign combina due livelli complementari. **Dark Editorial ARPG** organizza l’interfaccia: superfici più profonde, meno bordi ripetuti, tipografia display per le gerarchie e accenti cromatici che cambiano con il gioco aperto. **Game Museum** aggiunge atmosfera soltanto nei punti narrativi: masthead e apertura delle cinque dashboard.

> Il sito resta uno strumento di consultazione rapido. Le scene Museum non sostituiscono dati, build, guide o navigazione: li introducono con maggiore identità visiva.

| Area | Intervento applicato | Comportamento |
|---|---|---|
| Masthead | Archivio dark con fondale Museum e tagline editoriale. | Conserva login, Discord, lingua, Aspetto e Radar ARPG. |
| Toolbar e navigazione | Pillole compatte, superfici scure e accento contestuale. | Ricerca, stagione, confronto, patch, condivisione e PWA restano inalterati. |
| Dashboard | Capitolo Museum sopra Stato meta e Build da esplorare. | Ogni gioco usa un’immagine e una breve introduzione originale. |
| Card e pannelli | Ombre leggere, separatori metallici e bordi meno invasivi. | Catalogo build, fonti e build personali mantengono logica e dati. |
| Guide ed Enciclopedia | Tipografia editoriale e cornici più raffinate. | Le hero e tutti gli asset guida preesistenti restano disponibili. |
| Mobile | Hero più corta, comandi a scorrimento e superfici compatte. | Nessuna sezione è nascosta o rimossa. |

## Asset Museum

Gli asset sono originali, senza loghi, testo o riferimenti di franchising. Tutti i file hanno dimensione **1920 × 1080 px**, JPEG progressivo e peso individuale inferiore a 200 KB.

| File | Destinazione |
|---|---|
| `assets/museum/museum_style_reference.jpg` | Fondale del masthead globale. |
| `assets/museum/poe1-museum-hero.jpg` | Dashboard Path of Exile 1. |
| `assets/museum/poe2-museum-hero.jpg` | Dashboard Path of Exile 2. |
| `assets/museum/last-epoch-museum-hero.jpg` | Dashboard Last Epoch. |
| `assets/museum/d2-museum-hero.jpg` | Dashboard Diablo II: Resurrected. |
| `assets/museum/d4-museum-hero.jpg` | Dashboard Diablo 4. |

Le cinque hero di gioco hanno `loading="lazy"`. Il masthead è un singolo fondale compresso e non richiede richieste verso servizi esterni.

## Palette e temi

L’accento dell’Hub cambia in base alla tab attiva: ambra per PoE 1, blu freddo per PoE 2, viola per Last Epoch, rosso ferro per Diablo II: Resurrected e rosso cenere per Diablo 4. Il cambio non altera le palette di guida già esistenti.

Il tema chiaro conserva il masthead e le hero Museum scure per garantire atmosfera, mentre toolbar, pannelli operativi, card e dialoghi passano a superfici avorio ad alto contrasto. I temi Scuro e AMOLED mantengono la resa Dark Editorial completa.

## Pubblicazione GitHub Pages

Sostituisci il tuo `index.html` con quello della consegna e carica la cartella `assets` completa, inclusa la sottocartella `assets/museum`. Mantieni anche `manifest.webmanifest` e `sw.js` nella stessa cartella di `index.html`, come nelle precedenti consegne PWA.

```text
index.html
manifest.webmanifest
sw.js
assets/
  museum/
    museum_style_reference.jpg
    poe1-museum-hero.jpg
    poe2-museum-hero.jpg
    last-epoch-museum-hero.jpg
    d2-museum-hero.jpg
    d4-museum-hero.jpg
  builds.json
  patches.json
  ...altri asset esistenti
```

Dopo il commit GitHub Pages pubblica la nuova versione. Il service worker già presente usa una strategia rete-prima: online il browser riceve il nuovo HTML e i nuovi asset, mentre offline utilizza la cache locale disponibile.

## Verifiche eseguite

| Area | Risultato |
|---|---:|
| Redesign ibrido, asset e preservazione funzioni | **23/23** |
| Hub evoluto, PWA, accessibilità e regressioni | **33/33** |
| Header essenziale e Radar ARPG | **18/18** |
| Rimozione ticker | **5/5** |
| Pacchetto mobile | **17/17** |
| Build da esplorare | **15/15** |
| Catalogo build locale | **34/34** |
| Regressione globale | **13/13** |

Sono state controllate inoltre dashboard PoE 1, PoE 2 e Diablo 4 nel browser, le hero narrative a 390 e 1365 px, tema chiaro, link condivisibili e isolamento delle build personali.
