# Asset Game Museum

## Masthead principale

`museum_style_reference.jpg` viene adottato come scenario della sala monumentale. La composizione contiene archi, portale, fuoco laterale e ampio spazio scuro a sinistra: è adatta a ricevere in sovrapposizione l’insegna centrale del Companion Hub e a restare leggibile su schermi ampi e mobili.

| Asset | Ruolo | Caricamento |
|---|---|---|
| `museum_style_reference.jpg` | Sfondo del masthead e della sala d’ingresso. | `fetchpriority="high"` soltanto come background CSS dell’header. |
| `poe1-museum-hero.jpg` | Portale Build e capitolo Path of Exile 1. | Lazy, quando il capitolo o il portale è visibile. |
| `poe2-museum-hero.jpg` | Portale Build e capitolo Path of Exile 2. | Lazy. |
| `last-epoch-museum-hero.jpg` | Portale Build e capitolo Last Epoch. | Lazy. |
| `d2-museum-hero.jpg` | Portale Build e capitolo Diablo II: Resurrected. | Lazy. |
| `d4-museum-hero.jpg` | Portale Build e capitolo Diablo 4. | Lazy. |

## Medaglioni e cornici

I cinque loghi già disponibili nei pulsanti di gioco saranno mantenuti come segni identificativi, ingranditi e incastonati in medaglioni CSS con anelli concentrici, riflessi metallici e una cornice in rilievo. Questa scelta conserva le identità ufficiali, elimina ulteriori richieste di rete e non introduce immagini con testo non verificabile.

Le grandi cornici, placche, separatori e sigilli saranno disegnati in CSS. Non veicolano informazioni testuali e restano nitidi a qualsiasi risoluzione, con un peso inferiore a texture aggiuntive.
