# Header essenziale + Radar ARPG

## Obiettivo del redesign

Questo aggiornamento trasforma la parte superiore del sito in un’area più pulita e orientata alla consultazione delle dashboard. Il ticker news viene eliminato; la classifica ARPG resta disponibile, ma viene spostata in un pannello richiamabile denominato **Radar ARPG**. Login, Discord, cambio lingua, temi e dimensione testo restano accessibili in una barra compatta.

> Il redesign non rimuove funzionalità utente: rimuove esclusivamente la barra news e le richieste esterne ad essa collegate.

## Nuova gerarchia

| Elemento precedente | Nuova posizione o comportamento |
|---|---|
| **Barra news dinamica** | Rimossa completamente, sia dal markup sia dagli script e dalle chiamate esterne. |
| **Top 10 ARPG Trend** | Disponibile nel pannello **Radar ARPG**, chiuso all’apertura per non occupare spazio. |
| **Accedi al Cloud** | Pulsante compatto **Accedi** nella barra utility. |
| **Discord** | Pulsante compatto con logo e testo abbreviato. |
| **Cambio lingua** | Capsule compatta nella barra utility. |
| **Tema e A− / A+** | Racchiusi nel pannello **Aspetto**, richiamabile con un solo pulsante. |

## Uso dei pannelli

| Controllo | Risultato |
|---|---|
| **Radar ARPG** | Mostra la classifica ARPG indicativa aggiornata al caricamento. |
| **Aspetto** | Mostra Scuro, AMOLED, Chiaro, riduzione testo e aumento testo. |
| **×** nel pannello | Chiude il pannello aperto. |
| **Esc** o clic fuori dall’header | Chiude automaticamente Radar e Aspetto. |

I due pannelli sono mutuamente esclusivi: quando ne apri uno, l’altro viene chiuso automaticamente. Sotto i 900 px i pannelli entrano nel normale flusso della pagina, così non coprono le tab di gioco o i contenuti; oltre questa soglia restano discreti come popover a destra.

## Comportamento mobile

Su smartphone, i controlli sono disposti in una griglia compatta: Accedi e Discord nella prima riga, lingua e Aspetto nella seconda, Radar ARPG sull’intera terza riga. Il pulsante Radar è più largo per risultare immediatamente riconoscibile, ma il pannello resta chiuso fino al tocco.

## Rimozione del ticker

La rimozione è completa: sono stati eliminati il markup della barra news, CSS relativo, fonti RSS/API, cache di sessione, chiamate alla rete e invocazioni al cambio tab. Il sito non esegue più richieste per recuperare notizie; questo riduce anche attività di rete e ingombro visivo nella prima schermata.

## Compatibilità e verifiche

| Controllo | Esito |
|---|---:|
| Header essenziale e Radar | **18/18** superate |
| Ticker rimosso e richieste assenti | **5/5** superate |
| Pacchetto responsive mobile | **17/17** superate |
| Build da esplorare | **15/15** superate |
| Catalogo build locale | **34/34** superate |
| Regressione funzionale | **13/13** superate |

Le build personali, il catalogo `assets/builds.json`, le cinque dashboard, l’enciclopedia, le guide e le ricerche live della sezione Build da esplorare restano invariati.

## Pubblicazione GitHub Pages

Sostituisci `index.html` con la versione aggiornata e mantieni la cartella `assets` nella stessa posizione. Non sono richieste API, chiavi o configurazioni aggiuntive. Dopo la pubblicazione, esegui un aggiornamento forzato del browser per ignorare l’eventuale cache della versione precedente.
