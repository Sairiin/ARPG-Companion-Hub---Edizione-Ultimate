# ARPG Companion Hub — Game Museum completo

## Redesign visivo completato

Questa release completa il redesign **Game Museum** eliminando le miniature esterne e le superfici visive provvisorie. L’ingresso del sito è ora una sala monumentale con architettura gotica, statue, bracieri, insegna centrale e un selettore a cinque medaglioni illustrati. I tre portali principali dispongono di scene narrative autonome per Build, Registro patch e Guide.

> Tutti i testi, i nomi dei giochi e i comandi restano in HTML: sono nitidi, accessibili e traducibili. Le nuove immagini svolgono esclusivamente una funzione decorativa e narrativa.

| Elemento | Implementazione finale |
|---|---|
| Sala monumentale | `assets/museum/game-museum-grand-hall.jpg`, panorama locale con statue, archi e asse centrale per l’insegna. |
| Medaglioni gioco | Cinque asset locali in `assets/museum/medallions/`, senza dipendenza da favicon o miniature esterne. |
| Diablo 4 | Medaglione locale accompagnato dal logo locale originale già presente nel progetto. |
| Portale Build | Scenario di un viaggiatore davanti a una fortezza, con area scura per la tipografia. |
| Portale Registro patch | Archivio gotico con pergamene e leggio. |
| Portale Guida | Tomo, mappa, bussola e candela in uno studio monumentale. |
| Mobile | Medaglioni in griglia 3+2, etichette complete, sala e comandi compressi per 390×844 px. |

## Funzioni preservate

Il redesign cambia la presentazione, non le funzionalità. Rimangono disponibili il catalogo locale di **56 build**, pannelli meta, Registro patch, ricerca globale, La mia stagione, confronto build, condivisione, build personali nel browser, PWA, temi, lingua, Radar ARPG, Discord, autenticazione, tutte le guide e l’Enciclopedia Meccaniche PoE1. Il ticker RSS resta rimosso.

| Area | File o comportamento mantenuto |
|---|---|
| Catalogo build | `assets/builds.json`, caricamento asincrono e fallback editoriale. |
| Registro patch | `assets/patches.json` e dialogo Hub, raggiungibile anche dal portale. |
| Build personali | `localStorage` con chiave `arpgBuildHub`. |
| PWA | `manifest.webmanifest`, `sw.js` e pulsante di installazione. |
| Guide e Enciclopedia | Contenuti, filtri, modali e immagini già esistenti sono inalterati. |

## Pubblicazione su GitHub Pages

Aprire `release_game_museum` oppure estrarre `ARPG_Companion_Hub_Game_Museum_Visual_Complete_GitHub_Pages.zip` nella root del repository GitHub Pages. Caricare o sostituire tutti i file mantenendo la struttura delle cartelle e pubblicare il branch configurato in **Settings → Pages**.

Per test locale, avviare un server HTTP dalla cartella della release:

```bash
python3 -m http.server 8765
```

Poi aprire `http://localhost:8765/`. Non usare `file://`, poiché dati JSON e service worker PWA richiedono un server HTTP/HTTPS.

## Verifiche finali

| Suite | Esito |
|---|---:|
| Game Museum con asset locali | 43/43 |
| Redesign precedente e regressioni | 22/22 |
| Hub evoluto | 33/33 |
| Catalogo build | 34/34 |
| Regressione catalogo | 13/13 |
| Discovery build | 15/15 |
| Header essenziale | 18/18 |
| Mobile | 17/17 |

La resa grafica è stata inoltre controllata su desktop e a **390×844 px**; non sono emersi errori console al caricamento.

## File principali

| Percorso | Scopo |
|---|---|
| `index.html` | Sito completo, stili e logica della sala Game Museum. |
| `assets/museum/game-museum-grand-hall.jpg` | Sfondo panoramico monumentale dell’ingresso. |
| `assets/museum/medallions/` | Cinque icone/medaglioni locali. |
| `assets/museum/portals/` | Tre scene narrative dei portali. |
| `assets/builds.json` | Catalogo editoriale delle 56 build. |
| `assets/patches.json` | Registro patch locale. |
| `verify_game_museum.py` | Regressione dedicata alla struttura e agli asset Museum. |
| `GAME_MUSEUM_VISUAL_BRIEF.md` | Brief visivo e registro dei controlli. |
