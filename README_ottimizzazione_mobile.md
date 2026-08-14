# Ottimizzazione mobile — ARPG Companion Hub

## Obiettivo

Questa versione ottimizza l’uso del sito su smartphone stretti, in particolare alle larghezze di **320 px** e **390 px**, mantenendo intatta la composizione desktop e senza rimuovere sezioni, guide, build personali o risorse community.

> Le sezioni restano tutte aperte e ricche: l’intervento riduce lo spazio sprecato e rende la navigazione più semplice con il pollice, senza nascondere contenuti dietro pannelli richiudibili.

## Interventi applicati

| Area | Modifica mobile | Risultato |
|---|---|---|
| **Navigazione principale e secondaria** | Le tab restano su una riga scorrevole orizzontalmente, con barra di scorrimento discreta e snap. | Tutte le voci restano raggiungibili con swipe senza occupare cinque o sei righe verticali. |
| **Header e controlli** | Ridotti spazi, margini e altezze; trend, accesso, traduzione, Discord e temi restano ordinati. | La prima schermata è più compatta. |
| **Ticker news** | Etichetta e testo più piccoli, animazione leggermente più lenta e margine inferiore ridotto. | Maggiore leggibilità senza sottrarre spazio alla dashboard. |
| **Aggiornamento meta** | Patch e ultima revisione sono affiancate; fonti occupano una riga intera. | Informazioni essenziali visibili con minore altezza. |
| **Build da esplorare** | Padding e tipografia più densi; fonti orizzontali scorrevoli; azioni YouTube/web in griglia. | Card ancora ricche e più adatte al tocco. |
| **Form, liste e pulsanti** | Campi e azioni hanno altezza minima tra 38 e 42 px; azioni delle build sono distribuite in griglia. | Tocchi più affidabili, maggiore comfort con una mano. |

## Soglie responsive

| Larghezza viewport | Comportamento |
|---|---|
| **768 px e oltre** | Nessuna modifica al layout desktop esistente. |
| **381–767 px** | Pacchetto responsive principale: navigazione orizzontale, pannelli più compatti e controlli touch. |
| **320–380 px** | Rifinitura per schermi stretti: tab, badge e testo delle azioni leggermente più compatti. |

## Compatibilità e regressione

L’ottimizzazione agisce soltanto tramite CSS in media query mobile. Non modifica il catalogo `assets/builds.json`, il ticker, l’enciclopedia, le guide, i salvataggi in `localStorage` o le funzioni JavaScript delle dashboard.

| Controllo | Esito |
|---|---:|
| Verifiche pacchetto mobile | **17/17** superate |
| Verifiche Build da esplorare | **15/15** superate |
| Verifiche catalogo build | **34/34** superate |
| Regressione catalogo/versione precedente | **13/13** superate |
| Verifiche ticker RSS | **13/13** superate |
| Controllo visivo | Confermato a 320 px, 390 px e 1365 px. |

## Pubblicazione su GitHub Pages

Pubblica l’HTML aggiornato insieme alla cartella `assets` invariata. Non serve alcuna configurazione aggiuntiva: le regole mobile sono già comprese nel file HTML. Dopo il commit, esegui un aggiornamento forzato nel browser mobile oppure apri il sito in modalità anonima per evitare cache locale.
