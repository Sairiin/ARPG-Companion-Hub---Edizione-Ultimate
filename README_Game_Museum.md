# ARPG Companion Hub — Game Museum

## Riepilogo del redesign

Questa versione ricostruisce l’accesso al sito come un’esperienza **Game Museum**: una sala monumentale con insegna centrale, selettore dei cinque giochi a medaglioni, piastra del capitolo attuale e tre portali esplorativi. La trasformazione è grafica e di navigazione; i contenuti, i dati locali e gli strumenti già presenti restano disponibili.

> Il redesign non rimuove dashboard, guide, catalogo build, build personali, Enciclopedia Meccaniche, PWA o strumenti Hub. Li rende raggiungibili attraverso una home più scenografica.

| Elemento | Comportamento |
|---|---|
| **Insegna monumentale** | Usa lo scenario locale `assets/museum/museum_style_reference.jpg` e una targa tipografica CSS. |
| **Medaglioni di gioco** | Selezionano Path of Exile 1, Path of Exile 2, Last Epoch, Diablo II: Resurrected e Diablo 4, aggiornando accento, hash condivisibile, capitolo e contenuto. |
| **Build da esplorare** | Raggiunge la dashboard del gioco attivo, con meta, catalogo locale, fonti e build personali. |
| **Registro patch** | Apre il registro patch locale già presente, senza ripristinare il ticker RSS rimosso. |
| **Guida essenziale** | Porta alla prima guida utile del gioco attivo. |
| **Atlante / Risorse** | Apre la sezione di progressione, boss, Monolith, roadmap o endgame coerente con il gioco selezionato. |

## Funzioni preservate

Il progetto mantiene il catalogo editoriale locale di **56 build** in `assets/builds.json`, il registro locale in `assets/patches.json`, la ricerca globale, la condivisione via hash, La mia stagione, confronto build, build personali in `localStorage`, PWA, Radar ARPG, scelta tema, lingua, Discord, autenticazione e le guide/enciclopedia già disponibili.

| Area | File o comportamento conservato |
|---|---|
| Catalogo build | `assets/builds.json` e caricamento asincrono con fallback. |
| Registro patch | `assets/patches.json` e dialogo dell’Hub. |
| Build personali | Chiave browser `arpgBuildHub`; nessun dato viene cancellato dal redesign. |
| PWA | `manifest.webmanifest`, `sw.js` e pulsante d’installazione quando disponibile. |
| Enciclopedia PoE1 | `#poe1-encyclopedia`, filtri e modali restano inclusi. |
| Ticker RSS | Rimane definitivamente assente. |

## Pubblicazione su GitHub Pages

Apri la cartella `release_game_museum` oppure estrai `ARPG_Companion_Hub_Game_Museum_GitHub_Pages.zip` nella root del repository GitHub Pages. Carica o sostituisci tutti i file mantenendo questa struttura, poi pubblica il branch configurato in **Settings → Pages**.

Il sito richiede una pubblicazione HTTP/HTTPS. Per testarlo localmente, dalla cartella della release è sufficiente eseguire:

```bash
python3 -m http.server 8765
```

e aprire `http://localhost:8765/`. Non usare `file://`: il caricamento JSON e il service worker PWA richiedono un server web.

## Manutenzione editoriale

Le build e le patch si aggiornano modificando i due JSON locali. Il portale **Registro patch** centralizza le fonti e lo stato di revisione, mentre le card dashboard mostrano lo stato meta e le fonti disponibili. Dopo ogni aggiornamento, eseguire le verifiche indicate sotto prima del deploy.

## Verifiche eseguite

| Suite | Esito |
|---|---:|
| Game Museum | 35/35 |
| Redesign precedente e regressioni | 22/22 |
| Hub evoluto | 33/33 |
| Catalogo build | 34/34 |
| Regressione catalogo | 13/13 |
| Discovery build | 15/15 |
| Header essenziale | 18/18 |
| Mobile | 17/17 |

La schermata mobile è stata verificata a **390×844 px**. Il masthead usa medaglioni in griglia 3+2, portali impilati, azioni compatte e un fallback CSS locale per il sigillo Diablo II.

## File principali

| Percorso | Scopo |
|---|---|
| `index.html` | Sito completo a file singolo con stili e logica Game Museum. |
| `assets/museum/` | Scena principale e cinque hero locali dei capitoli. |
| `assets/builds.json` | Catalogo delle 56 build. |
| `assets/patches.json` | Registro patch locale. |
| `manifest.webmanifest` e `sw.js` | Installazione e supporto PWA. |
| `verify_game_museum.py` | Nuova regressione specifica per il redesign Game Museum. |
| `GAME_MUSEUM_ARCHITECTURE.md` | Mappa tecnica di portali, capitoli e verifiche. |
