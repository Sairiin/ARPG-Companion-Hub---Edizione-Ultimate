# Brief visivo — Game Museum completo

## Problema rilevato

La schermata attuale riproduce correttamente la struttura Museum, ma non la sua densità artistica. Il masthead usa troppo spazio scuro, tre giochi dipendono da miniature esterne poco affidabili e i portali riciclano le hero di capitolo anziché avere immagini narrative dedicate. Il risultato è una composizione funzionale ma non ancora fedele al mockup B.

## Sistema di asset locale

| Asset | Quantità | Funzione | Direzione artistica |
|---|---:|---|---|
| Sala monumentale | 1 | Sfondo del masthead | Grande galleria gotica, archi, bracieri, statue, profondità laterale e asse centrale libero per l’insegna CSS. |
| Medaglioni di gioco | 5 | Identificazione stabile dei cinque capitoli | Sigilli originali senza testo: esilio e ruote dentate per PoE1, monolite d’ambra per PoE2, clessidra arcana per Last Epoch, runa infernale per D2R, sigillo cremisi per D4. |
| Portali narrativi | 3 | Immagine distinta per Build, Registro patch e Guida | Paesaggio d’avventura, archivio con pergamene e libro/mappe con candela; soggetti leggibili e zona scura a sinistra per il testo HTML. |
| Ornamenti CSS | Nessun file | Cornici, vertici, piastre e luci | Metallo brunito, oro antico, pietra nera e accent color contestuale per gioco. |

## Criteri di accettazione

Il risultato deve usare solo asset locali per i cinque medaglioni, non mostrare immagini rotte o icone generiche, distinguere visivamente i tre portali e dare al masthead una sala riconoscibile anche prima della prima interazione. Le immagini non devono contenere titoli o loghi generati: testi e nomi restano in HTML, nitidi e accessibili.

## Validazione asset

Il medaglione PoE1 mantiene silhouette, incisioni e trasparenza a 320×320 px; il fondale Build conserva una zona scura a sinistra per la tipografia HTML e un soggetto narrativo leggibile a destra. I nuovi JPEG sono stati compressi per la pubblicazione web e i medaglioni sono stati ridotti senza sacrificare il contrasto dei dettagli principali.

## Controllo desktop integrato

Il masthead ora mostra una sala monumentale completa con statue, architettura e illuminazione; i cinque selettori usano medaglioni locali distinti e leggibili. I portali Build, Registro patch e Guida essenziale hanno scene autonome e differenziate con area sicura per la tipografia. La console non presenta errori dopo il caricamento degli asset.

## Controllo mobile conclusivo

A 390×844 px i cinque medaglioni locali sono tutti visibili in una griglia 3+2, inclusa l’etichetta completa “Diablo 2: Resurrected”. La sala conserva targa, comandi essenziali, immagini decorative e una transizione leggibile verso il capitolo attuale.

## Analisi geometrica: mockup vs implementazione attuale

Il problema non è più la qualità degli asset: è la **composizione**. Nel mockup B il masthead occupa circa metà della prima schermata, la targa del titolo è più compatta e il selettore dei cinque giochi è un podio centrale largo circa metà viewport. La pagina attuale, invece, ha un masthead troppo alto, targa e medaglioni sovradimensionati, selettore troppo esteso e una barra comandi superiore troppo affollata.

| Area | Mockup B | Stato attuale | Correzione necessaria |
|---|---|---|---|
| Barra superiore | Cinque comandi sintetici a sinistra; accesso e pochi controlli a destra. | Tutti i controlli funzionali sono esposti nella stessa riga. | Creare una vera barra Museum; spostare patch, lingua, tema e Radar in un menu “altro”, senza perdere le funzioni. |
| Insegna | Targa centrale compatta, decorata, con spazio scenico attorno. | Targa larga e alta, dominante. | Ridurre la targa e inserirla nell’asse architettonico del fondale. |
| Selettore giochi | Podio centrale stretto, cinque celle compatte e incorniciate. | Fascia quasi a tutta larghezza, celle e icone molto alte. | Ridurre larghezza e altezza del podio; impostare cinque porte/medaglioni realmente centrali. |
| Piastra capitolo | Fascia unica: identità a sinistra, tre azioni sceniche a destra. | Fascia ampia con il solo stato Dashboard. | Aggiungere Dashboard, Comunità e Risorse nel blocco destro. |
| Portali | Tre card orizzontali basse con bordo monumentale e sigillo inferiore. | Card troppo profonde e contenitore generico. | Impostare altezza, cornici, spazi e sigilli come una galleria unica. |

La prossima ricostruzione riduce il masthead desktop a una scena più compatta, sostituisce la barra comandi con una nav Museum e ricompone piastra e portali nella griglia effettiva del mockup.

## Esito ricostruzione masthead

Il masthead è stato riportato alla scala del mockup: targa più compatta, podio centrale ristretto e cinque porte più basse. La barra superiore espone ora solo Cerca, Stagione, Build, Condividi e App sulla sinistra, mentre Accesso, Discord e il menu “•••” si trovano a destra. Il menu secondario è stato corretto affinché non occupi spazio scenico quando è chiuso.

## Esito ricostruzione piastra e galleria

La fascia Capitolo attuale ora separa correttamente identità del gioco e tre azioni a destra. La galleria usa tre portali orizzontali con cornice comune e sigillo inferiore centrale, mentre l’Atlante è stato trasformato in una fascia con quattro pulsanti coerenti con il mockup. La pagina conserva sotto questa scena l’area operativa originale, senza rimuovere dashboard o sottosezioni.

## Verifica dei collegamenti

Il cambio di capitolo a Diablo 4 aggiorna correttamente medaglione attivo, titolo, sottotitolo, etichetta Endgame e dashboard. Le azioni della piastra e gli accessi della fascia risorse rimangono collegati ai moduli preesistenti; il percorso Comunità indirizza alla dashboard build, dove sono raccolte le fonti e le build da esplorare.

## Verifica mobile

A 390×844 px il masthead resta compatto, i cinque medaglioni sono leggibili nella griglia 3+2 e la piastra conserva titolo, stato e gerarchia. I portali diventano una sequenza verticale, evitando card troppo strette e mantenendo i rispettivi asset narrativi.

## Controllo desktop conclusivo

La composizione finale presenta il podio centrale, la piastra con azioni sul lato destro, la galleria di tre portali e la fascia risorse nella successione del mockup. Il controllo della console dopo il rendering mostra solo l’inizializzazione Firebase prevista, senza errori introdotti dalla ricostruzione.
