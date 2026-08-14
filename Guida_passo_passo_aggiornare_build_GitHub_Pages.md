# Guida passo passo: aggiornare le build su GitHub Pages

Questa procedura aggiorna il file `assets/builds.json`. **Non devi modificare `index.html`** per le normali revisioni di patch, lega, stagione o ciclo.

## Prima di iniziare

Apri il repository GitHub che pubblica il sito. Nella radice del ramo pubblicato devono rimanere insieme `index.html` e la cartella `assets`; il file da modificare è:

```text
assets/builds.json
```

> Prima di cambiare il catalogo, controlla le note della patch e le fonti che intendi usare. Il sito mostra le modifiche subito dopo la pubblicazione, quindi il badge e le build devono riflettere una revisione effettivamente completata.

## Procedura completa

| Passo | Operazione | Risultato atteso |
|---:|---|---|
| 1 | Apri il repository GitHub e seleziona il ramo da cui GitHub Pages pubblica il sito. | Sei nel ramo corretto, ad esempio `main`. |
| 2 | Apri la cartella `assets`, quindi clicca `builds.json`. | Visualizzi il catalogo delle cinque dashboard. |
| 3 | Clicca l’icona della matita **Edit this file**. | Puoi modificare il JSON dal browser. |
| 4 | Individua il blocco del gioco da aggiornare. | Vedi una delle chiavi `poe1`, `poe2`, `le`, `d2` o `d4`. |
| 5 | Quando è uscita una patch ma non hai finito la verifica, aggiorna `patch` e imposta `requiresReview` a `true`. | Il sito mostrerà **Da verificare**. |
| 6 | Controlla fonti e guide, poi aggiorna le build endgame e leveling. | Le liste rappresentano il meta che hai approvato. |
| 7 | Dopo la revisione, imposta la data, disattiva la richiesta di revisione e aggiorna la nota editoriale. | Il badge passerà a **Verificato**. |
| 8 | Scorri in basso, scrivi un messaggio di commit e clicca **Commit changes**. | GitHub salva il nuovo catalogo. |
| 9 | Attendi il deploy di GitHub Pages e ricarica il sito con `Ctrl+F5`. | Le dashboard leggono il nuovo JSON. |

## Identificatori dei giochi

| Gioco | Chiave da cercare in `builds.json` |
|---|---|
| Path of Exile 1 | `"poe1"` |
| Path of Exile 2 | `"poe2"` |
| Last Epoch | `"le"` |
| Diablo II: Resurrected | `"d2"` |
| Diablo 4 | `"d4"` |

Non rinominare queste chiavi: sono gli identificatori usati dalle dashboard del sito.

## A. Segnalare una nuova patch prima della revisione

Appena esce una patch, aggiorna il nome della patch e imposta il badge in modalità prudente. Per esempio, per Path of Exile 1:

```json
"poe1": {
  "game": "Path of Exile 1",
  "patch": "Lega 3.X",
  "reviewedAt": "2026-08-14",
  "reviewCycleDays": 30,
  "requiresReview": true,
  "reviewNote": "Nuova lega pubblicata: build in revisione editoriale.",
  "sources": [
    {
      "label": "Fonte consultata",
      "url": "https://esempio.com/guida"
    }
  ],
  "builds": {
    "endgame": [],
    "leveling": []
  }
}
```

Puoi lasciare temporaneamente le build precedenti nelle liste mentre compare **Da verificare**. Non cancellarle finché non hai deciso quali sostituire.

## B. Pubblicare una revisione completata

Quando hai verificato il meta, modifica almeno questi quattro campi:

```json
"patch": "Lega 3.X",
"reviewedAt": "2026-08-14",
"requiresReview": false,
"reviewNote": "Revisionate build starter ed endgame dopo le note della patch."
```

Usa la data reale della tua revisione nel formato `AAAA-MM-GG`. Il badge rimane **Verificato** per il numero di giorni indicato da `reviewCycleDays`, normalmente 30.

## C. Aggiungere o sostituire una build

Le build sono divise in due liste:

```text
builds → endgame
builds → leveling
```

Per aggiungere una voce, copia questo modello dentro la lista corretta. Ricorda di mettere una virgola **tra due voci**, ma non dopo l’ultima voce della lista.

```json
{
  "id": "poe1-endgame-7-nome-build",
  "title": "Nome della build",
  "class": "Classe",
  "specialization": "Ascendancy o specializzazione",
  "tier": "S-Tier",
  "tierColor": "#f44336",
  "difficulty": "Intermedia",
  "sourceName": "Nome della fonte",
  "sourceUrl": "https://esempio.com/guida-diretta"
}
```

| Campo | Cosa scrivere |
|---|---|
| `id` | Un identificatore unico, minuscolo, senza spazi. Per esempio `d4-endgame-6-chain-lightning`. |
| `title` | Il nome mostrato nella dashboard. |
| `class` | La classe del gioco. |
| `specialization` | Ascendancy, mastery, sottoclasse o ruolo. |
| `tier` | Etichetta breve, ad esempio `S-Tier`, `A-Tier`, `Starter` oppure `Guida`. |
| `tierColor` | Colore esadecimale, per esempio `#f44336`; puoi riutilizzare i colori già presenti. |
| `difficulty` | Nota interna utile per la revisione; non modifica il layout attuale. |
| `sourceName` | Nome leggibile della fonte. |
| `sourceUrl` | URL completo che inizia con `https://`. |

Per rimuovere una build, elimina l’intero blocco `{ ... }` e verifica le virgole della voce precedente e successiva.

## D. Aggiornare le fonti del pannello meta

Nel blocco del gioco, `sources` determina i link mostrati nel pannello **Aggiornamento meta**. Aggiungi o sostituisci una fonte con questo formato:

```json
{
  "label": "Maxroll · Build",
  "url": "https://esempio.com/pagina-consultata"
}
```

Indica solo le fonti che hai realmente consultato per la revisione. Puoi usare etichette specifiche, per esempio `Maxroll · Livellamento` e `Maxroll · Endgame`, quando più link dello stesso sito hanno scopi diversi.

## E. Pubblicare su GitHub Pages

Dopo la modifica, scorri alla fine della pagina GitHub. Nel campo del commit usa un messaggio descrittivo, per esempio:

```text
Aggiorna build PoE 1 per Lega 3.X
```

Se lavori direttamente sul ramo pubblicato, seleziona **Commit directly to the main branch**; se preferisci una revisione separata, crea un nuovo branch e poi apri una pull request. Attendi che GitHub Pages completi la pubblicazione.

Verifica infine che il nuovo file sia raggiungibile aprendo:

```text
https://TUO-UTENTE.github.io/TUO-REPOSITORY/assets/builds.json
```

Devi vedere un documento JSON, non una pagina 404. Poi apri il sito e fai un aggiornamento forzato con `Ctrl+F5` oppure `Ctrl+Shift+R`.

## Controllo finale

| Verifica | Cosa controllare |
|---|---|
| Pannello meta | Patch/stagione, data e badge sono corretti. |
| Fonti | Tutti i link del pannello si aprono e puntano alle pagine consultate. |
| Endgame | Sono visibili le build approvate per l’endgame. |
| Leveling | Sono visibili le build adatte al livellamento. |
| Console browser | Non compaiono errori di caricamento del file `assets/builds.json`. |
| JSON diretto | L’URL `/assets/builds.json` restituisce il file aggiornato. |

## Se il sito non mostra le modifiche

Controlla prima l’URL diretto del JSON. Se è corretto ma il sito sembra invariato, usa un aggiornamento forzato. Se l’URL restituisce 404, controlla che `assets/builds.json` sia stato salvato nel ramo e nella cartella effettivamente pubblicati da GitHub Pages. Se GitHub segnala un errore di JSON, di solito è causato da una virgola mancante, da una virgola finale oppure da una doppia virgoletta non chiusa.
