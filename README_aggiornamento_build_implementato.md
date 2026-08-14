# ARPG Companion Hub — Catalogo build locale e Stato meta

## Intervento completato

Il sito ora separa in modo netto il **catalogo editoriale delle build** dalla grafica delle dashboard. Le 56 build che erano già gestite nel codice JavaScript sono state migrate in `assets/builds.json`; l’HTML legge il file locale una volta per sessione di pagina e aggiorna le liste endgame e leveling dei cinque giochi.

Le build personali dell’utente restano indipendenti dal catalogo. Continuano a usare il sistema già presente di salvataggio locale e di sincronizzazione cloud, perciò l’aggiornamento di una patch non può sovrascrivere o cancellare build create dall’utente.

| Elemento | Posizione | Funzione |
|---|---|---|
| **Catalogo build** | `assets/builds.json` | Contiene patch/stagione, fonti, stato di revisione e liste per PoE 1, PoE 2, Last Epoch, D2R e Diablo 4. |
| **Pannello Stato meta** | Ciascuna dashboard | Comunica patch, ultima revisione, fonti e stato del catalogo. |
| **Badge** | Pannello Stato meta | Mostra “Verificato” o “Da verificare”. |
| **Fallback** | Rendering delle liste | Se il JSON non è disponibile, la dashboard resta utilizzabile e mostra un messaggio esplicito. |

## Stato iniziale del catalogo

Il catalogo iniziale è stato migrato fedelmente dalle liste che il sito già visualizzava. Per evitare di attribuire una revisione che non è ancora avvenuta, tutti i cinque giochi partono con il badge **“Da verificare”**, `reviewedAt` vuoto e una nota editoriale esplicita.

> Il badge non segnala un problema tecnico: indica correttamente che, dopo la migrazione iniziale, l’editor deve confermare che le build siano ancora appropriate per la patch o stagione riportata.

## Come aggiornare il meta dopo una patch

Apri `assets/builds.json` con un editor di testo e individua il blocco del gioco interessato nella sezione `games`. Per esempio, il blocco Diablo 4 inizia con la chiave `"d4"`; Path of Exile 1 usa `"poe1"`, Path of Exile 2 `"poe2"`, Last Epoch `"le"` e Diablo II: Resurrected `"d2"`.

| Campo | Azione da eseguire dopo la revisione | Esempio |
|---|---|---|
| `patch` | Sostituire con nome/numero della nuova patch, lega, ciclo o stagione. | `"Lega 3.30"` |
| `reviewedAt` | Scrivere la data della verifica in formato `AAAA-MM-GG`. | `"2026-08-14"` |
| `requiresReview` | Impostare `false` dopo aver approvato le build. | `false` |
| `reviewNote` | Inserire una nota sintetica su criteri, modifiche o limiti. | `"Revisionate le guide starter ed endgame dopo le note patch."` |
| `sources` | Conservare o aggiornare le fonti editoriali effettivamente consultate. | `label` e `url` |
| `builds.endgame` / `builds.leveling` | Confermare, sostituire, aggiungere o rimuovere singole build. | Vedi struttura seguente. |

La sequenza editoriale è semplice: controlla le news della patch nel ticker, confronta fonti editoriali affidabili, modifica il catalogo JSON, apri il sito tramite server HTTP locale e verifica le cinque dashboard. Non è necessario modificare `index.html` per gli aggiornamenti ordinari del meta.

## Struttura di una build

Ogni voce deve avere un URL `https:` valido e usare testo semplice nei campi descrittivi. Il sito valida gli URL prima di renderli come link esterni e crea gli elementi della pagina con API DOM, senza inserire markup del JSON direttamente nell’HTML.

```json
{
  "id": "poe1-endgame-1-lightning-strike",
  "title": "Lightning Strike",
  "class": "Duelist",
  "specialization": "Champion",
  "tier": "S-Tier",
  "tierColor": "#f44336",
  "difficulty": "Intermedia",
  "sourceName": "Maxroll",
  "sourceUrl": "https://maxroll.gg/poe/category/build-guides"
}
```

Il campo `id` deve essere unico nel catalogo. `tierColor` usa un colore esadecimale; in caso contrario il sito applica il colore di tema della dashboard. `sourceName` descrive la fonte della voce, mentre `sourceUrl` indirizza alla guida o alla pagina di riferimento che hai effettivamente verificato.

## Come funziona il badge di revisione

Il pannello usa `reviewCycleDays`, inizialmente impostato a 30 giorni. La visualizzazione è “Da verificare” se `requiresReview` è `true`, se manca `reviewedAt` o se la data supera il ciclo definito. Dopo una revisione completa, imposta `requiresReview` a `false` e registra la data: il badge passa a “Verificato”.

| Situazione | Valori chiave | Badge mostrato |
|---|---|---|
| Migrazione o nuova patch in attesa di controllo | `requiresReview: true` | **Da verificare** |
| Revisione completata da meno di 30 giorni | `requiresReview: false`, data recente | **Verificato** |
| Revisione più vecchia del ciclo | Data oltre `reviewCycleDays` | **Da verificare** |

## Apertura e consegna del sito

Poiché il browser non consente normalmente di caricare un JSON tramite richieste asincrone quando il file viene aperto direttamente con `file://`, il sito va avviato da un piccolo server HTTP locale. Nel progetto di lavoro questo è già disponibile sulla porta 8765. Per una nuova copia locale, apri una console nella cartella del sito e avvia:

```bash
python3 -m http.server 8765
```

Poi visita `http://localhost:8765/`. Mantieni sempre `index.html` e la cartella `assets` nello stesso percorso, perché il file è richiesto tramite `assets/builds.json`.

## Verifiche eseguite

L’implementazione ha superato i controlli automatici del catalogo (**34/34**), la regressione rispetto all’ultima versione consegnata (**13/13**) e la suite del ticker RSS (**13/13**). La verifica browser ha confermato la presenza dei cinque pannelli meta e il rendering delle liste: PoE 1 6/6, PoE 2 6/6, Last Epoch 6/6, D2R 6/6, Diablo 4 5/3, rispettivamente endgame/leveling. È stato inoltre verificato che il caricamento del catalogo non modifica il salvataggio delle build personali.
