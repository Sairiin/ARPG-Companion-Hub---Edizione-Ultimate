# Architettura Game Museum

## Obiettivo

Il redesign **Game Museum** trasforma l’ingresso del sito in una sala esplorativa monumentale, senza rimuovere né nascondere permanentemente contenuti già disponibili. La home diventa il punto di orientamento; i moduli attuali restano il contenuto operativo dei rispettivi capitoli di gioco.

> La nuova interfaccia non sostituisce il catalogo, le guide o gli strumenti: cambia il modo in cui l’utente li raggiunge.

## Gerarchia prevista

| Livello | Componente Game Museum | Funzione tecnica preservata |
|---|---|---|
| 1 | Navigazione superiore in pietra e metallo | Ricerca globale, stagione personale, confronto build, condivisione, installazione PWA, accesso, Discord, lingua, tema e Radar ARPG. |
| 2 | Masthead monumentale con insegna centrale | Identità dell’ARPG Companion Hub; area sicura per titolo e sottotitolo, non sostituisce la navigazione funzionale. |
| 3 | Cinque medaglioni di gioco | Riutilizzo dei cinque pulsanti `.tab-btn` e della funzione `openMainTab`, con nuova semantica visiva e focus accessibile. |
| 4 | Piastra “Capitolo attuale” | Identità dinamica del gioco attivo, aggiornata in sincronia con `body[data-active-game]`. |
| 5 | Tre portali esplorativi | Accesso diretto a Dashboard/Build, Registro patch e Guide/Risorse del gioco selezionato. |
| 6 | Navigazione del capitolo | Sottotab esistenti: dashboard, guide specialistiche, enciclopedie, crafting, Atlas, boss e progressione. |
| 7 | Contenuto operativo | Catalogo build locale, meta, fonti esterne, build personali, enciclopedia, guide, modali e strumenti già esistenti. |

## Mappa dei tre portali

| Portale | Destinazione per ogni gioco | Contenuto che resta disponibile |
|---|---|---|
| **Build da esplorare** | Apre il primo sottotab/dashboard del gioco attivo e porta all’inizio del catalogo. | Pannello meta, 56 build locali, fonti di scoperta, build personali, confronto e strumenti. |
| **Registro patch** | Apre il dialogo esistente del registro patch, filtrato sul gioco attivo. | Dati di `assets/patches.json`, stato di revisione e pulsante di condivisione. |
| **Guida essenziale** | Apre il primo sottotab guida appropriato al gioco attivo. | Tutte le guide, le risorse specialistiche, l’Enciclopedia Meccaniche PoE1 e le pagine di progressione. |

## Regole di preservazione

| Area | Decisione |
|---|---|
| Dati build e patch | I file JSON e il codice di caricamento restano invariati. |
| Ricerca globale e dialoghi | Restano disponibili dalla barra superiore; nessun flusso viene eliminato. |
| PWA | Manifest, service worker e pulsante d’installazione restano collegati. |
| Accessibilità | Skip link, bottoni nativi, focus visibile, etichette ARIA e rispetto del movimento ridotto restano obbligatori. |
| Mobile | Masthead compresso, medaglioni in griglia e portali impilati; toolbar orizzontale scorrevole con target touch ampi. |
| Tema | L’ambientazione resta leggibile anche in AMOLED e chiaro, mantenendo le scelte tema già salvate. |

## Base tecnica scelta

La versione attuale di `index.html` contiene già le integrazioni utili del precedente tentativo: identità visuale per ciascun capitolo e hero locali per i cinque giochi. Verrà quindi mantenuta come base funzionale, eliminando gli override che la limitano a un redesign ibrido e aggiungendo un layer Game Museum dichiarato alla fine del CSS. In questo modo si riduce il rischio di regressione e rimangono intatti script, dataset, modali e progressive enhancement.

## Controllo iniziale del masthead

Il primo rendering desktop conferma che l’header si presenta come un’unica sala: barra comandi in alto, insegna ARPG Companion Hub centrata, cinque selettori allineati nella base della scena, piastra del capitolo e tre portali immediatamente sotto. Il caricamento iniziale non genera errori JavaScript; l’inizializzazione Firebase esistente resta operativa. Il prossimo intervento collega i tre portali e sincronizza la piastra con ogni cambio gioco.

## Controllo di sincronizzazione

Il cambio a **Diablo 4** aggiorna correttamente hash condivisibile, capitolo attuale, sottotitolo, accento, piastra Archivio e immagini dei portali. Il catalogo, il pannello meta, le risorse esterne e le guide della dashboard Diablo 4 rimangono disponibili. Il pulsante PWA continua a comparire quando il browser lo rende disponibile.

Il portale **Guida essenziale** di Diablo 4 apre la sezione `d4-start`, aggiorna il link condivisibile e sostituisce l’indicatore della piastra con “Inizia & Livellamento”. Il contenuto guida preesistente viene raggiunto senza duplicazioni o pagine intermedie.

Il portale **Registro patch** riapre correttamente il dialogo locale dell’Hub con i cinque registri disponibili e senza alcun ticker. La chiusura del dialogo restituisce alla sala Museum mantenendo il capitolo selezionato.

## Verifica mobile

A 390×844 px il masthead conserva gerarchia e leggibilità: insegna centrale, comandi essenziali compatti, medaglioni in griglia 3+2 e piastra capitolo. I comandi accesso, Discord, aspetto e Radar ora condividono una sola riga compatta; il medaglione Diablo II usa inoltre un fallback CSS locale, evitando la dipendenza da una favicon esterna non affidabile.

## Verifica di regressione

Sono state eseguite otto suite: Game Museum (35/35), redesign precedente (22/22), Hub evoluto (33/33), catalogo build (34/34), regressione catalogo (13/13), discovery (15/15), header essenziale (18/18) e mobile (17/17). Non sono emersi errori nelle suite né nella console del browser dopo navigazione, portali, dialogo patch, PWA e cambio capitolo.
