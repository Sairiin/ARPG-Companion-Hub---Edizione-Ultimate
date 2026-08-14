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
