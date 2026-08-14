# ARPG Companion Hub — Hub evoluto

## Panoramica

Questa versione estende il sito senza eliminare dashboard, guide, enciclopedia, catalogo build, Build da esplorare, login Cloud, Discord, cambio lingua, pannello Aspetto o Radar ARPG. Il ticker news resta rimosso come richiesto; al suo posto è presente un **Registro patch e meta** locale, più ordinato e controllabile.

| Nuova funzione | Dove si trova | Dati utilizzati | Persistenza |
|---|---|---|---|
| **Ricerca globale** | Pulsante `Cerca` o `Ctrl/Cmd + K` | Guide, sottosezioni e 56 build del catalogo | Nessun dato personale obbligatorio |
| **Link condivisibili** | Pulsante `Condividi` | Gioco e sottosezione correnti | URL con hash `#game=…&section=…` |
| **La mia stagione** | Pulsante dedicato | Gioco, classe/archetipo, checklist e preferiti | Solo `localStorage` del browser |
| **Confronta build** | Pulsante dedicato | Campi già presenti in `assets/builds.json` | Nessuna scrittura sul catalogo |
| **Registro patch** | Pulsante dedicato | `assets/patches.json` | File locale versionato su GitHub |
| **Accessibilità** | Pannello `Aspetto` | Contrasto e riduzione movimento | Solo `localStorage` del browser |
| **PWA installabile** | Pulsante `Installa app`, se proposto dal browser | HTML, catalogo e asset locali | Cache offline con fallback locale |

> **Principio editoriale.** Il confronto mostra solamente dati presenti nel catalogo e non inventa punteggi di costo, difesa, boss o mapping. Questi campi potranno comparire nel confronto quando verranno aggiunti dopo una revisione editoriale reale.

## Ricerca globale e preferiti

La ricerca indicizza automaticamente le sottosezioni esistenti, le guide con titolo e le build contenute nel catalogo locale. Digita il nome di una build, una classe, un gioco o una guida. Ogni risultato possiede una stella: la stella salva o rimuove quel contenuto da **La mia stagione**.

I preferiti salvano soltanto titolo, gioco, destinazione e data locale; non vengono inviati a servizi esterni e non modificano le build personali già esistenti.

## Link condivisibili

Ogni cambio di gioco o sottosezione aggiorna l’indirizzo della pagina, ad esempio:

```text
https://TUO-UTENTE.github.io/TUO-REPOSITORY/#game=poe1&section=poe1-guide
```

Il pulsante **Condividi** copia l’URL della posizione corrente. Chi riceve il link aprirà direttamente gioco e sottosezione corrispondenti; la navigazione rimane compatibile con le tab esistenti.

## La mia stagione

L’area personale è volutamente leggera e non richiede un database. Puoi impostare gioco, classe o archetipo, quindi seguire quattro obiettivi rapidi: scegliere una build, sistemare difese, completare una progressione chiave e preparare il primo boss. Puoi cancellare queste informazioni dal browser cancellando i dati del sito.

| Chiave locale | Contenuto |
|---|---|
| `arpgHubSeasonV1` | Profilo di stagione e checklist |
| `arpgHubFavoritesV1` | Preferiti provenienti dalla ricerca globale |
| `arpgHubAccessibilityV1` | Preferenze di contrasto e riduzione movimento |

Le chiavi sopra sono separate da `arpgBuildHub`, usata dalle build personali già presenti nel sito.

## Confronto build

Il pannello **Confronta build** consente di selezionare due voci tra le 56 del catalogo. Il confronto visualizza gioco, categoria, classe, specializzazione, tier catalogo, stato di revisione e fonte. È un confronto descrittivo, non un simulatore di danno né una classifica automatica.

Quando vorrai arricchirlo, puoi aggiungere facoltativamente a una build in `assets/builds.json` campi editoriali come `cost`, `mapping`, `bossing`, `defense` e `complexity`. Inseriscili soltanto quando sono realmente verificati; il pannello attuale non li presume.

## Registro patch e meta

Il file `assets/patches.json` contiene la situazione per ciascun gioco. Modifica il registro dopo una patch o stagione, insieme al normale aggiornamento di `assets/builds.json`.

| Campo | Uso |
|---|---|
| `currentPatch` | Nome della lega, stagione, ciclo o patch attiva |
| `status` | Stato editoriale, ad esempio `Verificato` o `Da revisionare` |
| `updatedAt` | Data di controllo nel formato `AAAA-MM-GG` |
| `sourceLabel` e `sourceUrl` | Fonte ufficiale o editoriale consultata |
| `changes` | Due o più note concise su cosa richiede attenzione |

La procedura resta gratuita: aggiorni i file locali, esegui commit e push. GitHub Pages pubblica le modifiche senza servizi a pagamento.

## Accessibilità e identità visiva

Nel pannello **Aspetto** sono disponibili i temi esistenti, A− e A+; ora sono disponibili anche **Contrasto** e **Meno movimento**. La prima migliora separazione dei bordi e leggibilità, mentre la seconda annulla le animazioni non essenziali. Le preferenze restano solo sul dispositivo.

Il colore d’accento della nuova barra strumenti e dei pannelli cambia in modo sottile con il gioco aperto, conservando il linguaggio visivo attuale: ambra per Path of Exile, viola per Last Epoch, freddo metallico per Diablo II: Resurrected e rosso per Diablo 4.

## Installazione PWA e offline

La consegna include `manifest.webmanifest`, `sw.js` e due icone locali PWA. Su GitHub Pages il sito è servito in HTTPS e potrà quindi essere riconosciuto dal browser come installabile; il pulsante **Installa app** appare soltanto quando il browser offre effettivamente l’installazione.

La cache è **rete-prima**: quando la connessione è disponibile, il sito cerca sempre la versione appena pubblicata su GitHub Pages; quando non è disponibile, usa l’ultima copia locale di HTML, cataloghi e asset essenziali. Questo evita che un aggiornamento del catalogo venga nascosto da una cache offline datata.

## Pubblicazione su GitHub Pages

Sostituisci o rinomina l’HTML consegnato in `index.html`, poi carica nella stessa cartella tutti i file inclusi nella consegna:

```text
index.html
manifest.webmanifest
sw.js
assets/
  builds.json
  patches.json
  diablo4-logo.png
  pwa-icon-192.png
  pwa-icon-512.png
  guides/
```

Dopo il commit, attendi il completamento della pubblicazione GitHub Pages. Se un browser mantiene una versione precedente, aggiorna la pagina forzatamente; la nuova strategia di cache PWA recupererà online la versione aggiornata quando la connessione è disponibile.

## Verifiche eseguite

| Area | Esito |
|---|---:|
| Nuovo Hub, PWA, accessibilità e regressioni mirate | **33/33** |
| Header essenziale e Radar ARPG | **18/18** |
| Rimozione ticker | **5/5** |
| Pacchetto mobile | **17/17** |
| Build da esplorare | **15/15** |
| Catalogo build locale | **34/34** |
| Regressione globale | **13/13** |

Sono stati inoltre verificati nel browser ricerca filtrata, area La mia stagione, confronto build, registro patch, contrasto, manifest, registrazione del service worker e link diretti a sottosezioni.

## Osservazioni estetiche per un futuro redesign

La revisione visiva evidenzia una base solida e coerente, ma anche una concentrazione di bordi, pulsanti e contenitori nella parte alta della pagina. Un prossimo redesign può migliorare profondità, ritmo e riconoscibilità senza ridurre contenuti: servono una tipografia editoriale più marcata, superfici con gerarchie meno uniformi, immagini o texture discrete per gioco e una barra strumenti ancora più integrata nell’identità del sito.

## Verifica redesign ibrido

Il controllo browser iniziale conferma che le dashboard PoE 1 e PoE 2 caricano i rispettivi capitoli Museum, aggiornano l’URL condivisibile e applicano accenti distinti senza modificare liste build, pannelli meta o sezioni Community Discovery.
La gestione del tema è stata riesaminata dopo gli override ibridi. Sono state aggiunte superfici chiare dedicate per i moduli operativi, mentre header e capitoli Museum mantengono volutamente l’atmosfera dark. Il ricaricamento conferma il ripristino corretto del tema dark predefinito e della dashboard PoE 1.
Le acquisizioni a 390 e 1365 pixel confermano che il sistema ibrido conserva la densità informativa: su desktop la hero Museum apre il capitolo gioco con una gerarchia editoriale chiara; su smartphone la stessa hero si riduce a un banner leggibile e le toolbar restano accessibili in scorrimento orizzontale. Le barre Google Translate visibili nelle acquisizioni appartengono al servizio di traduzione preesistente e non al redesign.
La dashboard Diablo 4 conferma la corretta palette rossa contestuale, il caricamento della hero Museum a 1920 px e l’aggiornamento dell’URL a `#game=d4&section=d4-dash`. Durante i controlli non è stato creato né modificato alcun dato nelle build personali locali.
