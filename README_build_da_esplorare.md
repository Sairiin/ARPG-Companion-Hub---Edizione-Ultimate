# Build da esplorare — Guida alla nuova sezione

## Funzione della sezione

Ogni dashboard include ora una nuova area denominata **Build da esplorare**. L’area offre agli utenti punti di partenza per cercare configurazioni esterne, senza mescolarle alle build del catalogo locale e senza dichiararle come “migliori”, aggiornate o approvate dal sito.

> **Avviso mostrato nel sito:** i collegamenti sono risorse di community e ricerche esterne; non sono una classifica, una selezione editoriale o una garanzia di compatibilità con la patch.

## Cosa trova l’utente

| Elemento | Comportamento |
|---|---|
| **Fonti dirette** | Apertura di pagine esterne utili per quel gioco. |
| **Tre card di scoperta** | Starter/livellamento, endgame e bossing/farming, adattate al gioco. |
| **YouTube live** | Ricerca YouTube generata con gioco, patch/stagione e obiettivo della card. I risultati cambiano direttamente su YouTube. |
| **Cerca sul web** | Ricerca web generata con gli stessi termini, utile per confrontare ulteriori guide. |
| **Badge esplicito** | Ricorda che il sito non verifica né classifica le risorse mostrate. |

La patch o stagione presente nel pannello **Aggiornamento meta** viene aggiunta automaticamente alle query. Quando aggiorni `assets/builds.json`, le ricerche live useranno quindi il nuovo valore senza richiedere modifiche all’HTML.

## Fonti disponibili

| Gioco | Fonti della sezione |
|---|---|
| **Path of Exile 1** | Maxroll, Icy Veins, Mobalytics, [PoEBuilds.cc](https://poebuilds.cc/) e [PoEBuilds.net](https://www.poebuilds.net/). |
| **Path of Exile 2** | Maxroll, Icy Veins, Mobalytics, [PoEBuilds.cc](https://poebuilds.cc/) e [PoEBuilds.net](https://www.poebuilds.net/). |
| **Last Epoch** | Maxroll, Last Epoch Tools, Icy Veins e Mobalytics. |
| **Diablo II: Resurrected** | Maxroll, Icy Veins e Mobalytics. |
| **Diablo 4** | Maxroll, Icy Veins, Mobalytics e Wowhead. |

Il dominio `poebuild.cc` non è stato aggiunto poiché attualmente risulta una pagina parcheggiata. La fonte utilizzata è invece **PoEBuilds.cc** (`poebuilds.cc`), insieme a `poebuilds.net`.

## Separazione dal catalogo editoriale

La sezione non modifica `assets/builds.json`, non aggiunge build alle liste **Top Build Endgame** o **Top Build Leveling** e non scrive nelle build personali dell’utente. Il catalogo editoriale conserva quindi il proprio badge di revisione e il processo di manutenzione già implementato.

| Area dashboard | Finalità | Aggiornamento |
|---|---|---|
| **Aggiornamento meta + Top Build** | Catalogo locale controllabile tramite `assets/builds.json`. | Quando aggiorni e pubblichi il JSON. |
| **Build da esplorare** | Scoperta iniziale e confronto di fonti/community. | Le query includono automaticamente patch/stagione corrente nel JSON; i risultati sono gestiti dai siti esterni. |
| **Le mie build personali** | Salvataggi dell’utente. | Resta invariato e indipendente dalle altre due aree. |

## Manutenzione facoltativa

Non devi aggiornare questa sezione dopo ogni patch: è già collegata al valore `patch` del catalogo. Se però vuoi aggiungere o rimuovere una fonte o cambiare gli obiettivi delle card, l’intervento è limitato alla configurazione JavaScript all’interno di `index.html` e non richiede di modificare le liste editoriali.

## Verifiche eseguite

L’intervento ha superato **15/15** controlli dedicati alla sezione, **34/34** controlli del catalogo locale e **13/13** controlli di regressione e ticker. Il test browser ha confermato la presenza dell’area in tutte e cinque le dashboard, con 5 fonti per PoE 1/2, 4 per Last Epoch e Diablo 4, 3 per D2R e 6 ricerche live per ciascun gioco. Il salvataggio delle build personali è rimasto invariato.
