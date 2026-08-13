export const newsData = {
    poe1: "📰 Patch 3.29 in arrivo: Nuovi bilanciamenti confermati per le skill Melee e modifiche all'endgame! | 🤫 Rumors: Possibile ritorno della meccanica Ultimatum nel core game. | 🏆 Prossima Race Evento (Gauntlet) confermata per il weekend: preparati a morire. | 🛠️ Ricordati di controllare Path of Building per gli ultimi aggiornamenti dei nodi passivi. | 💎 L'economia è stabile, il Chaos Orb mantiene il suo valore.",
    poe2: "📰 Early Access Beta in corso: GGG sta raccogliendo i feedback! | 🏹 Rivelati nuovi dettagli sull'Ascendancy del Mercenary. | 🤫 Rumors: Il crafting system potrebbe subire pesanti modifiche nella prossima build per favorire i drop a terra. | 🛡️ Il sistema di 'Spirito' rimpiazzerà interamente la riserva di mana per le Aure. | ⚔️ Prova il nuovo sistema di schivata (Dodge Roll) contro i boss!",
    le: "📰 Patch 1.1 In Arrivo: preparati ad affrontare il nuovo Pinnacle Boss! | 🦅 Falconer e Warlock si confermano stabilmente le classi Meta attuali. | 🤫 Rumors: Nuove Maestrie segrete in sviluppo per il 2027! | 🛠️ Aggiorna i tuoi Loot Filter su LE Tools per non perdere i nuovi oggetti unici. | 🔄 EHG promette miglioramenti sul netcode per ridurre il desync in multiplayer.",
    d2: "📰 Diablo 2 Resurrected: Ladder Season 14 in pieno svolgimento! | ⚔️ Terror Zones rotanti ogni ora: ottima occasione per pushare al 99. | 🤫 Rumors: La community chiede a gran voce la Patch 2.7, arriverà mai un nuovo update da Blizzard? | 🛡️ I Drop Rate delle Rune Alte restano invariati, continua a farmare le Mucche e Travincal. | 💎 Mosaic Assassin e Hammerdin dominano incontrastati le classifiche correnti."
};

export const colorsData = { poe1: 'var(--accent-primary)', poe2: 'var(--accent-primary)', le: 'var(--accent-le)', d2: 'var(--danger)' };

export const smartLinksDB = {
    poe1: {
        version: "3.29",
        endgame: [
            { name: "Lightning Strike", className: "Duelist", ascendancy: "Champion", tier: "S-Tier", color: "#f44336", url: "https://maxroll.gg/poe/category/build-guides" },
            { name: "Hexblast Mines", className: "Shadow", ascendancy: "Saboteur", tier: "S-Tier", color: "#f44336", url: "https://maxroll.gg/poe/category/build-guides" },
            { name: "Detonate Dead", className: "Witch", ascendancy: "Elementalist", tier: "OP", color: "#9c27b0", url: "https://www.icy-veins.com/poe/builds" },
            { name: "Boneshatter", className: "Marauder", ascendancy: "Juggernaut", tier: "Top Meta", color: "#2196F3", url: "https://maxroll.gg/poe/category/build-guides" },
            { name: "Righteous Fire", className: "Templar", ascendancy: "Inquisitor", tier: "A-Tier", color: "#ff9800", url: "https://mobalytics.gg/poe/builds" },
            { name: "Toxic Rain", className: "Ranger", ascendancy: "Pathfinder", tier: "A-Tier", color: "#ff9800", url: "https://www.icy-veins.com/poe/builds" }
        ],
        leveling: [
            { name: "Rolling Magma", className: "Witch", ascendancy: "Elementalist", tier: "S-Tier", color: "#f44336", url: "https://maxroll.gg/poe/category/build-guides" },
            { name: "Splitting Steel", className: "Duelist", ascendancy: "Champion", tier: "S-Tier", color: "#f44336", url: "https://maxroll.gg/poe/category/build-guides" },
            { name: "Toxic Rain", className: "Ranger", ascendancy: "Raider", tier: "A-Tier", color: "#ff9800", url: "https://www.icy-veins.com/poe/builds" },
            { name: "Summon Raging Spirit (SRS)", className: "Witch", ascendancy: "Necromancer", tier: "Top Meta", color: "#2196F3", url: "https://mobalytics.gg/poe/builds" },
            { name: "Frostblink / Fire Trap", className: "Witch", ascendancy: "Elementalist", tier: "OP", color: "#9c27b0", url: "https://maxroll.gg/poe/category/build-guides" },
            { name: "Sunder", className: "Marauder", ascendancy: "Juggernaut", tier: "A-Tier", color: "#ff9800", url: "https://maxroll.gg/poe/category/build-guides" }
        ]
    },
    poe2: {
        version: "0.5.0",
        endgame: [
            { name: "Armor Break Slam", className: "Warrior", ascendancy: "N/A", tier: "S-Tier", color: "#f44336", url: "https://mobalytics.gg/poe2/builds" },
            { name: "Ice Nova", className: "Sorceress", ascendancy: "N/A", tier: "Top Meta", color: "#2196F3", url: "https://www.icy-veins.com/poe2/build-guides" },
            { name: "Spear Spin", className: "Huntress", ascendancy: "N/A", tier: "S-Tier", color: "#f44336", url: "https://mobalytics.gg/poe2/builds" },
            { name: "Crossbow Burst", className: "Mercenary", ascendancy: "N/A", tier: "A-Tier", color: "#ff9800", url: "https://maxroll.gg/poe2/category/build-guides" },
            { name: "Shapeshifter Bear", className: "Druid", ascendancy: "N/A", tier: "A-Tier", color: "#ff9800", url: "https://www.icy-veins.com/poe2/build-guides" },
            { name: "Lightning Strike", className: "Monk", ascendancy: "N/A", tier: "Top Meta", color: "#2196F3", url: "https://mobalytics.gg/poe2/builds" }
        ],
        leveling: [
            { name: "Spark / Nova", className: "Sorceress", ascendancy: "N/A", tier: "S-Tier", color: "#f44336", url: "https://www.icy-veins.com/poe2/build-guides" },
            { name: "Slam Starter", className: "Warrior", ascendancy: "N/A", tier: "Top Meta", color: "#2196F3", url: "https://mobalytics.gg/poe2/builds" },
            { name: "Rapid Fire", className: "Mercenary", ascendancy: "N/A", tier: "S-Tier", color: "#f44336", url: "https://maxroll.gg/poe2/category/build-guides" },
            { name: "Quarterstaff", className: "Monk", ascendancy: "N/A", tier: "A-Tier", color: "#ff9800", url: "https://www.icy-veins.com/poe2/build-guides" },
            { name: "Spear Starter", className: "Huntress", ascendancy: "N/A", tier: "A-Tier", color: "#ff9800", url: "https://mobalytics.gg/poe2/builds" },
            { name: "Summoner Starter", className: "Witch", ascendancy: "N/A", tier: "B-Tier", color: "#4caf50", url: "https://www.icy-veins.com/poe2/build-guides" }
        ]
    },
    d2: {
        version: "S14",
        endgame: [
            { name: "Blizzard", className: "Sorceress", ascendancy: "Cold", tier: "S-Tier", color: "#f44336", url: "https://www.icy-veins.com/d2/classes-and-builds" },
            { name: "Mosaic", className: "Assassin", ascendancy: "Martial Arts", tier: "OP", color: "#9c27b0", url: "https://maxroll.gg/d2/category/guides" },
            { name: "Hammerdin", className: "Paladin", ascendancy: "Combat", tier: "S-Tier", color: "#f44336", url: "https://mobalytics.gg/diablo-2/builds" },
            { name: "Lightning Fury", className: "Amazon", ascendancy: "Javazon", tier: "S-Tier", color: "#f44336", url: "https://www.icy-veins.com/d2/classes-and-builds" },
            { name: "Nova", className: "Sorceress", ascendancy: "Lightning", tier: "Top Meta", color: "#2196F3", url: "https://maxroll.gg/d2/category/guides" },
            { name: "Smiter Uber Killer", className: "Paladin", ascendancy: "Combat", tier: "Boss Killer", color: "#607d8b", url: "https://www.icy-veins.com/d2/classes-and-builds" }
        ],
        leveling: [
            { name: "Holy Fire", className: "Paladin", ascendancy: "Offensive Auras", tier: "S-Tier", color: "#f44336", url: "https://maxroll.gg/d2/category/guides" },
            { name: "Wake of Fire", className: "Assassin", ascendancy: "Traps", tier: "S-Tier", color: "#f44336", url: "https://www.icy-veins.com/d2/classes-and-builds" },
            { name: "Fissure", className: "Druid", ascendancy: "Elemental", tier: "Top Meta", color: "#2196F3", url: "https://maxroll.gg/d2/category/guides" },
            { name: "Nova / Static", className: "Sorceress", ascendancy: "Lightning", tier: "OP", color: "#9c27b0", url: "https://www.icy-veins.com/d2/classes-and-builds" },
            { name: "Bone Spear", className: "Necromancer", ascendancy: "Poison & Bone", tier: "Top Meta", color: "#2196F3", url: "https://www.icy-veins.com/d2/classes-and-builds" },
            { name: "Singer (Warcry)", className: "Barbarian", ascendancy: "Warcries", tier: "A-Tier", color: "#ff9800", url: "https://maxroll.gg/d2/category/guides" }
        ]
    },
    le: {
        version: "1.0",
        endgame: [
            { name: "Dive Bomb", className: "Rogue", ascendancy: "Falconer", tier: "S-Tier", color: "#f44336", url: "https://maxroll.gg/last-epoch/build-guides" },
            { name: "Chthonic Fissure", className: "Acolyte", ascendancy: "Warlock", tier: "S-Tier", color: "#f44336", url: "https://www.lastepochtools.com/builds/" },
            { name: "Frost Claw", className: "Mage", ascendancy: "Runemaster", tier: "OP", color: "#9c27b0", url: "https://maxroll.gg/last-epoch/build-guides" },
            { name: "Healing Hands", className: "Sentinel", ascendancy: "Paladin", tier: "Top Meta", color: "#2196F3", url: "https://www.icy-veins.com/last-epoch/builds" },
            { name: "Wraithlord", className: "Acolyte", ascendancy: "Necromancer", tier: "A-Tier", color: "#ff9800", url: "https://www.lastepochtools.com/builds/" },
            { name: "Shadow Daggers", className: "Rogue", ascendancy: "Bladedancer", tier: "A-Tier", color: "#ff9800", url: "https://maxroll.gg/last-epoch/build-guides" }
        ],
        leveling: [
            { name: "Void Cleave", className: "Sentinel", ascendancy: "Void Knight", tier: "S-Tier", color: "#f44336", url: "https://maxroll.gg/last-epoch/build-guides" },
            { name: "Glacier", className: "Mage", ascendancy: "Sorcerer", tier: "S-Tier", color: "#f44336", url: "https://www.lastepochtools.com/builds/" },
            { name: "Bone Curse", className: "Acolyte", ascendancy: "Warlock", tier: "Top Meta", color: "#2196F3", url: "https://maxroll.gg/last-epoch/build-guides" },
            { name: "Thorn Totem", className: "Primalist", ascendancy: "Shaman", tier: "A-Tier", color: "#ff9800", url: "https://www.icy-veins.com/last-epoch/builds" },
            { name: "Flurry", className: "Rogue", ascendancy: "Bladedancer", tier: "A-Tier", color: "#ff9800", url: "https://www.lastepochtools.com/builds/" },
            { name: "Elemental Nova", className: "Mage", ascendancy: "Runemaster", tier: "Top Meta", color: "#2196F3", url: "https://maxroll.gg/last-epoch/build-guides" }
        ]
    }
};

export const runewordsData = [
    { name: "Stealth (Furtività)", type: "armatura", emoji: "👕", level: 17, sockets: 2, runes: ["Tal", "Eth"], base: "Qualsiasi Armatura Torso", desc: "L'armatura per eccellenza per il leveling. Offre velocità di movimento e di lancio magie fenomenali fin dai primissimi livelli.", stats: ["+25% Velocità di Lancio (FCR)", "+25% Velocità di Movimento (FRW)", "+25% Recupero dai Colpi (FHR)", "Rigenerazione Mana +15%"] },
    { name: "Treachery (Tradimento)", type: "armatura", emoji: "👕", level: 43, sockets: 3, runes: ["Shael", "Thul", "Lem"], base: "Armatura Torso", desc: "Eccellente per il Mercenario Atto 2 o personaggi Melee. Può far 'proccare' Fade, aumentando massicciamente le resistenze e la riduzione danni.", stats: ["5% probabilità di lanciare Dissolvenza (Fade) liv. 15", "+45% Velocità d'Attacco Aumentata (IAS)", "+20% Recupero dai Colpi (FHR)", "+30% Resistenza al Freddo"] },
    { name: "Fortitude (Fortezza)", type: "armatura", emoji: "👕", level: 59, sockets: 4, runes: ["El", "Sol", "Dol", "Lo"], base: "Armatura Torso (Anche Armi)", desc: "La migliore armatura per Mercenari e personaggi fisici (Melee/Archi). Dona un danno pazzesco e difese impenetrabili.", stats: ["<span style='color:#ff3333'>+300% Danno Aumentato</span>", "+200% Difesa", "+ (1-1.5 per Livello) a Vita", "+25-30% a Tutte le Resistenze"] },
    { name: "Enigma", type: "armatura", emoji: "👕", level: 65, sockets: 3, runes: ["Jah", "Ith", "Ber"], base: "Mage Plate, Dusk Shroud, Archon Plate", desc: "La runeword più desiderata del gioco. Conferisce l'abilità 'Teletrasporto' a QUALSIASI classe, rivoluzionando il farming.", stats: ["<span style='color:var(--item-unique)'>+1 a Teletrasporto (Teleport)</span>", "+2 a Tutte le Abilità", "+ (0.75 per Livello) a Forza", "+ (1 per Livello) % prob. di trovare Oggetti Magici"] },
    { name: "Chains of Honor (Catene dell'Onore)", type: "armatura", emoji: "👕", level: 63, sockets: 4, runes: ["Dol", "Um", "Ber", "Ist"], base: "Armatura Torso", desc: "Un'alternativa eccezionale a Enigma se hai bisogno di sopravvivenza. Offre enormi resistenze e danni extra contro demoni/non-morti.", stats: ["+2 a Tutte le Abilità", "<span style='color:#4da6ff'>+65% a Tutte le Resistenze Elementali</span>", "+200% Danno ai Demoni / +100% ai Non-Morti", "Ruba l'8% di Vita per Colpo"] },
    { name: "Hustle", type: "armatura", emoji: "👕", level: 39, sockets: 3, runes: ["Shael", "Ko", "Eld"], base: "Armatura Torso (Anche Armi)", desc: "Nuova Runeword della patch 2.6. Ottima per correre e attaccare velocemente a metà gioco.", stats: ["+50% Velocità di Movimento (FRW)", "+20% Velocità d'Attacco Aumentata (IAS)", "+20% Recupero dai Colpi (FHR)", "Consumo Vigore ridotto del 50%"] },
    { name: "Spirit (Spirito - Arma)", type: "arma", emoji: "🗡️", level: 25, sockets: 4, runes: ["Tal", "Thul", "Ort", "Amn"], base: "Spade (es. Crystal Sword, Broad Sword)", desc: "Il miglior oggetto qualità/prezzo per tutti gli Incantatori (Caster). Statistiche assurde per rune così economiche.", stats: ["+2 a Tutte le Abilità", "+25-35% Velocità di Lancio (FCR)", "+55% Recupero dai Colpi (FHR)", "+22 a Vitalità / +89-112 a Mana"] },
    { name: "Insight (Intuizione)", type: "arma", emoji: "🔱", level: 27, sockets: 4, runes: ["Ral", "Tir", "Tal", "Sol"], base: "Armi Inastate (Polearms) o Archi (Patch 2.4+)", desc: "Equipaggiata dal Mercenario dell'Atto 2, risolve permanentemente qualsiasi problema di Mana per il tuo personaggio.", stats: ["<span style='color:#4da6ff'>Aura di Meditazione liv. 12-17 attiva</span>", "+200-260% Danno Aumentato", "+35% Velocità di Lancio (FCR)", "Bonus del 23% al Ritrovamento di Oggetti Magici"] },
    { name: "Grief (Dolore)", type: "arma", emoji: "⚔️", level: 59, sockets: 5, runes: ["Eth", "Tir", "Lo", "Mal", "Ral"], base: "Spade, Asce (Phase Blade, Berserker Axe)", desc: "L'arma corpo a corpo più forte del gioco. Il suo bonus al danno 'piatto' distrugge completamente i calcoli matematici del gioco.", stats: ["<span style='color:#ff3333'>Danno +340-400 (Danno base Puro!)</span>", "+30-40% Velocità d'Attacco (IAS)", "Ignora la Difesa del Bersaglio", "20% Colpo Mortale (Deadly Strike)"] },
    { name: "Call to Arms (Chiamata alle Armi)", type: "arma", emoji: "📯", level: 57, sockets: 5, runes: ["Amn", "Ral", "Mal", "Ist", "Ohm"], base: "Spade, Mazze (Crystal Sword, Flail)", desc: "La runeword definitiva per lo switch dell'arma (W). Permette a chiunque di lanciare gli urli del Barbaro per aumentare Vita e Mana.", stats: ["+1 a Tutte le Abilità", "+1-6 a Comando di Battaglia", "<span style='color:var(--item-unique)'>+1-6 a Ordini di Battaglia (Battle Orders)</span>", "+1-4 a Grido di Battaglia"] },
    { name: "Heart of the Oak (HOTO)", type: "arma", emoji: "🧙‍♂️", level: 55, sockets: 4, runes: ["Ko", "Vex", "Pul", "Thul"], base: "Mazze, Bastoni (Flail)", desc: "L'arma perfetta per gli Incantatori a fine gioco. FCR eccezionale e massicce resistenze.", stats: ["+3 a Tutte le Abilità", "+40% Velocità di Lancio (FCR)", "<span style='color:#4da6ff'>+30-40% a Tutte le Resistenze Elementali</span>", "+15% Mana Massimo"] },
    { name: "Infinity (Infinito)", type: "arma", emoji: "🔱", level: 63, sockets: 4, runes: ["Ber", "Mal", "Ber", "Ist"], base: "Armi Inastate (Mancatcher, Thresher) o Lance", desc: "L'arma 'Endgame' per i mercenari delle build Elementali. Rompe le immunità dei mostri in modalità Inferno.", stats: ["<span style='color:#ffaa00'>Aura Convinzione (Conviction) liv. 12 attiva</span>", "-45-55% alla Resistenza al Fulmine del Nemico", "40% Prob. di Colpo Frantumante (Crushing Blow)", "Aggiunge Danno da Fulmine"] },
    { name: "Mosaic", type: "arma", emoji: "🥋", level: 53, sockets: 3, runes: ["Mal", "Gul", "Amn"], base: "Armi corpo a corpo da Assassina (Claws)", desc: "Introdotta nella 2.6, ha reso l'Assassina Martial Arts una delle classi più potenti e visivamente caotiche del gioco.", stats: ["<span style='color:#4da6ff'>50% Prob. di non consumare cariche (100% con 2 armi)</span>", "+2 ad Abilità Arti Marziali (Assassina)", "+20% IAS / Danni da freddo/fuoco/fulmine aggiunti", "Ruba 7% di Vita per colpo"] },
    { name: "White (Bianco)", type: "arma", emoji: "💀", level: 35, sockets: 2, runes: ["Dol", "Io"], base: "Bacchette (Wands) - Solo Negromante", desc: "Se creata in una bacchetta che ha già +3 a Lancia d'Osso, trasforma il tuo Negromante in una mitragliatrice di danni.", stats: ["+3 ad Abilità Veleno e Osso (Necromante)", "+2 a Lancia d'Osso / +3 ad Armatura d'Osso", "+20% Velocità di Lancio (FCR)", "+13 a Mana"] },
    { name: "Spirit (Spirito - Scudo)", type: "scudo", emoji: "🛡️", level: 25, sockets: 4, runes: ["Tal", "Thul", "Ort", "Amn"], base: "Monarch (Paladini: Qualsiasi scudo base con +Res)", desc: "La versione Scudo di Spirit. È il motivo per cui quasi tutti i Caster mettono almeno 156 di Forza (per indossare il Monarch).", stats: ["+2 a Tutte le Abilità", "+25-35% Velocità di Lancio (FCR)", "+55% Recupero dai Colpi (FHR)", "+35% Res Freddo, Fulmine, Veleno (Manca Fuoco!)"] },
    { name: "Rhyme (Rima)", type: "scudo", emoji: "🛡️", level: 29, sockets: 2, runes: ["Shael", "Eth"], base: "Bone Shield, Grim Shield", desc: "Uno scudo eccellente per metà gioco o Magic Find. Impedisce di essere congelati.", stats: ["<span style='color:#4da6ff'>Impossibile essere Congelati (Cannot Be Frozen)</span>", "+25% a Tutte le Resistenze Elementali", "+20% Possibilità di Blocco / +40% Velocità di Blocco", "25% Ritrovamento Oggetti Magici (MF)"] },
    { name: "Ancient's Pledge (Promessa degli Antichi)", type: "scudo", emoji: "🛡️", level: 21, sockets: 3, runes: ["Ral", "Ort", "Tal"], base: "Kite Shield, Large Shield", desc: "Le rune ti vengono donate completando la quest dell'Atto 5 Normale. Fixa le tue resistenze in un colpo solo.", stats: ["+48% Resistenza al Freddo", "+48% Resistenza al Fuoco", "+48% Resistenza al Fulmine", "+48% Resistenza al Veleno"] },
    { name: "Exile (Esilio)", type: "scudo", emoji: "🛡️", level: 57, sockets: 4, runes: ["Vex", "Ohm", "Ist", "Dol"], base: "Scudi del Paladino (Ideale: Eterei con bug/auto-riparazione)", desc: "Il miglior scudo per Paladini 'Smiter' o Zealer. Dona Aura Sfida e ricarica vita castando 'Life Tap'.", stats: ["<span style='color:#ff3333'>15% prob. di lanciare Life Tap (Ruba Vita) liv. 5 su attacco</span>", "Aura di Sfida (Defiance) liv. 13-16 attiva", "+2 ad Aure Offensive (Paladino)", "Ripara 1 Durabilità ogni 4 secondi"] },
    { name: "Lore (Conoscenza)", type: "elmo", emoji: "🪖", level: 27, sockets: 2, runes: ["Ort", "Sol"], base: "Qualsiasi Elmo a 2 incavi (es. Cap, Bone Helm)", desc: "L'elmo standard per finire la difficoltà Normale e affrontare Incubo. Dona un utilissimo +1 a Tutte le Abilità.", stats: ["<span style='color:var(--item-unique)'>+1 a Tutte le Abilità</span>", "+30% Resistenza al Fulmine", "Danno Ridotto di 7", "+2 al Mana per ogni uccisione"] },
    { name: "Flickering Flame", type: "elmo", emoji: "🪖", level: 55, sockets: 3, runes: ["Nef", "Pul", "Vex"], base: "Elmi (Ideale: Elmi del Druido con +Abilità)", desc: "Introdotto nella 2.4, è il sogno di ogni build fuoco. Abbassa le difese nemiche e fornisce Aura Resistenza al Fuoco per contrastare Sunder Charms.", stats: ["<span style='color:#ff3333'>Aura Resistenza al Fuoco liv. 4-8 attiva</span>", "-10-15% alla Resistenza al Fuoco dei Nemici", "+3 ad Abilità di Fuoco", "+5% alle Resistenze Massime al Fuoco"] },
    { name: "Bulwark (Baluardo)", type: "elmo", emoji: "🪖", level: 35, sockets: 3, runes: ["Shael", "Io", "Sol"], base: "Qualsiasi Elmo a 3 incavi", desc: "Nuovo elmo economico della patch 2.6 per Mercenari. Riduce drasticamente i danni subiti e fornisce Life Leech.", stats: ["Ruba 4-6% di Vita per Colpo", "Riduce il Danno Fisico Subito del 10-15%", "+20% Recupero dai Colpi (FHR)", "Aumenta la Vita Massima del 5%"] },
    { name: "Cure (Cura)", type: "elmo", emoji: "🪖", level: 35, sockets: 3, runes: ["Shael", "Io", "Tal"], base: "Qualsiasi Elmo a 3 incavi", desc: "Nuovo elmo 2.6. Insieme a Insight su un Mercenario (con aura Preghiera) crea una sinergia mostruosa di cura continua e pulizia veleni.", stats: ["<span style='color:#52d164'>Aura Purificazione (Cleansing) liv. 1 attiva</span>", "+20% Recupero dai Colpi (FHR)", "Aumenta la Vita Massima del 5%", "+40-60% Resistenza al Veleno"] }
];

export const RUNE_IMG_BASE_URL = "https://d2runewizard.com/assets/runes/";
export const RUNE_IMG_EXT = ".webp";
