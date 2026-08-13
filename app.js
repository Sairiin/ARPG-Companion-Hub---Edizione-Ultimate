import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyBBb-T8EEAGk203ANzajLkNvyoo17STTus",
    authDomain: "arpg-companion-hub.firebaseapp.com",
    projectId: "arpg-companion-hub",
    storageBucket: "arpg-companion-hub.firebasestorage.app",
    messagingSenderId: "992359528045",
    appId: "1:992359528045:web:f1776114a695399237b164",
    measurementId: "G-R7EDZCSZN2"
};

let app, auth, db;
try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    console.log("Firebase Inizializzato con successo!");
} catch(e) {
    console.warn("Firebase offline. L'app funzionerà in modalità locale.", e);
}

let currentUser = null;
let userBuilds = { poe1: [], poe2: [], d4: [], d2: [], le: [] }; 
window.editingIndex = { poe1: null, poe2: null, d4: null, d2: null, le: null }; 

window.openAuthModal = () => document.getElementById('auth-modal').style.display = 'flex';
window.closeAuthModal = () => document.getElementById('auth-modal').style.display = 'none';

window.loginWithGoogle = async () => { if(!auth) return; const provider = new GoogleAuthProvider(); try { await signInWithPopup(auth, provider); } catch(e) { console.error(e); } };
window.registerWithEmail = async () => { if(!auth) return; try { await createUserWithEmailAndPassword(auth, document.getElementById('auth-email').value, document.getElementById('auth-password').value); window.closeAuthModal(); } catch(e) { alert(e.message); } };
window.loginWithEmail = async () => { if(!auth) return; try { await signInWithEmailAndPassword(auth, document.getElementById('auth-email').value, document.getElementById('auth-password').value); window.closeAuthModal(); } catch(e) { alert(e.message); } };
window.logoutFirebase = async () => { if(auth) await signOut(auth); };

if(auth) {
    onAuthStateChanged(auth, async (user) => {
        const authBtn = document.getElementById('auth-btn');
        if (user) {
            currentUser = user;
            authBtn.innerHTML = `Esci (${user.displayName || user.email})`;
            authBtn.onclick = window.logoutFirebase;
            window.closeAuthModal();
            await syncFromFirebase();
        } else {
            currentUser = null;
            authBtn.innerHTML = `👤 Accedi al Cloud`;
            authBtn.onclick = window.openAuthModal;
            userBuilds = JSON.parse(localStorage.getItem('arpgBuildHub')) || { poe1: [], poe2: [], d4: [], d2: [], le: [] };
            window.loadMyBuildsUI();
        }
    });
}

async function syncFromFirebase() {
    if (!currentUser || !db) return;
    try {
        const docSnap = await getDoc(doc(db, "users", currentUser.uid));
        if (docSnap.exists()) { userBuilds = docSnap.data().builds || { poe1: [], poe2: [], d4: [], d2: [], le: [] }; } 
        else { userBuilds = JSON.parse(localStorage.getItem('arpgBuildHub')) || { poe1: [], poe2: [], d4: [], d2: [], le: [] }; await setDoc(doc(db, "users", currentUser.uid), { builds: userBuilds }); }
        window.loadMyBuildsUI();
    } catch(e) { console.error(e); }
}

async function syncToFirebase() {
    if (currentUser && db) { try { await setDoc(doc(db, "users", currentUser.uid), { builds: userBuilds }, { merge: true }); } catch(e) {} } 
    else { localStorage.setItem('arpgBuildHub', JSON.stringify(userBuilds)); }
    window.loadMyBuildsUI();
}

window.loadMyBuildsUI = function() {
    ['poe1', 'poe2', 'd4', 'd2', 'le'].forEach(game => {
        const ul = document.getElementById(`my-builds-${game}`);
        if(!ul) return;
        ul.innerHTML = '';
        if (!userBuilds[game]) userBuilds[game] = [];
        if (userBuilds[game].length === 0) { ul.innerHTML = '<li><span style="color: var(--text-muted); font-style:italic; font-size:0.9em;">Nessuna build salvata. Usa il form per aggiungerne una.</span></li>'; return; }
        userBuilds[game].forEach((build, index) => {
            ul.innerHTML += `<li><div class="dash-list-item-content"><a href="${build.link}" class="saved-link" target="_blank">${build.name}</a><span class="build-version">v. ${build.version || 'N/A'}</span><span class="build-note">- ${build.note || ''}</span></div><div class="dash-list-actions"><button class="edit-btn" onclick="window.editBuild('${game}', ${index})">✏️</button><button class="delete-btn" onclick="window.deleteBuild('${game}', ${index})">❌</button></div></li>`;
        });
    });
};

window.filterSavedBuilds = function(game) {
    let filter = document.getElementById(`filter-saved-${game}`).value.toLowerCase();
    let li = document.getElementById(`my-builds-${game}`).getElementsByTagName("li");
    for (let i = 0; i < li.length; i++) {
        if (li[i].innerText.includes("Nessuna build salvata")) continue; 
        li[i].style.display = (li[i].textContent || li[i].innerText).toLowerCase().indexOf(filter) > -1 ? "" : "none";
    }
};

window.editBuild = function(game, index) {
    const build = userBuilds[game][index];
    document.getElementById(`name-${game}`).value = build.name;
    document.getElementById(`link-${game}`).value = build.link;
    document.getElementById(`version-${game}`).value = build.version;
    document.getElementById(`note-${game}`).value = build.note === "Senza note" || build.note === "Salvata dal Generatore Smart" ? "" : build.note;
    window.editingIndex[game] = index;
    let btn = document.getElementById(`submit-btn-${game}`);
    btn.textContent = "Aggiorna"; btn.style.background = "var(--accent-tertiary)";
    document.getElementById(`cancel-btn-${game}`).style.display = "inline-block";
    document.getElementById(`name-${game}`).focus();
};

window.cancelEdit = function(game) {
    window.editingIndex[game] = null;
    document.getElementById(`form-${game}`).reset();
    let btn = document.getElementById(`submit-btn-${game}`);
    btn.textContent = "Salva";
    btn.style.background = game === 'le' ? "var(--accent-le)" : game === 'd2' ? "var(--danger)" : game === 'd4' ? "var(--accent-d4)" : "var(--accent-secondary)";
    document.getElementById(`cancel-btn-${game}`).style.display = "none";
};

window.saveBuild = async function(event, game) {
    event.preventDefault();
    const name = document.getElementById(`name-${game}`).value, link = document.getElementById(`link-${game}`).value, version = document.getElementById(`version-${game}`).value, note = document.getElementById(`note-${game}`).value || "Senza note";
    if (!userBuilds[game]) userBuilds[game] = [];
    if (window.editingIndex[game] !== null) { userBuilds[game][window.editingIndex[game]] = { name, link, version, note }; } else { userBuilds[game].push({ name, link, version, note }); }
    await syncToFirebase();
    window.cancelEdit(game);
    const filterInput = document.getElementById(`filter-saved-${game}`);
    if(filterInput) { filterInput.value = ""; window.filterSavedBuilds(game); }
};

window.deleteBuild = async function(game, index) {
    if(!confirm("Sicuro di voler eliminare questa build?")) return;
    userBuilds[game].splice(index, 1);
    await syncToFirebase();
    window.filterSavedBuilds(game);
};

window.quickSave = async function(game, buildName, defaultVersion, buildUrl) {
    if (!userBuilds[game]) userBuilds[game] = [];
    userBuilds[game].push({ name: buildName, link: buildUrl, version: defaultVersion, note: "Salvata dal Generatore Smart" });
    await syncToFirebase();
    alert("Build Salvata in: Le Mie Build Personali!");
};

window.setTheme = function(themeName) { document.documentElement.setAttribute('data-theme', themeName); localStorage.setItem('arpgTheme', themeName); };
window.setTheme(localStorage.getItem('arpgTheme') || 'dark');

let currentFontSize = parseInt(localStorage.getItem('arpgFontSize')) || 16;
window.setFontSize = function(size) { currentFontSize = size; document.documentElement.style.setProperty('--base-font-size', currentFontSize + 'px'); localStorage.setItem('arpgFontSize', currentFontSize); };
window.changeFontSize = function(step) { let newSize = currentFontSize + (step * 2); if(newSize >= 12 && newSize <= 24) window.setFontSize(newSize); };
window.setFontSize(currentFontSize);

window.openOverlay = function(url, title = "Overlay Strumento") { document.getElementById('modal-title').innerText = title; document.getElementById('modal-iframe').src = url; document.getElementById('iframe-modal').style.display = 'flex'; };
window.closeOverlay = function() { document.getElementById('modal-iframe').src = ''; document.getElementById('iframe-modal').style.display = 'none'; };

const newsData = {
    poe1: "📰 Patch 3.29 in arrivo: Nuovi bilanciamenti confermati per le skill Melee e modifiche all'endgame! | 🤫 Rumors: Possibile ritorno della meccanica Ultimatum nel core game. | 🏆 Prossima Race Evento (Gauntlet) confermata.",
    poe2: "📰 Early Access Beta in corso: GGG sta raccogliendo i feedback! | 🏹 Rivelati nuovi dettagli sull'Ascendancy del Mercenary. | 🛡️ Il sistema di 'Spirito' rimpiazzerà interamente la riserva di mana per le Aure.",
    le: "📰 Patch 1.1 In Arrivo: preparati ad affrontare il nuovo Pinnacle Boss! | 🦅 Falconer e Warlock si confermano stabilmente le classi Meta attuali.",
    d2: "📰 Diablo 2 Resurrected: Ladder Season 14 in pieno svolgimento! | ⚔️ Terror Zones rotanti ogni ora. | 💎 Mosaic Assassin e Hammerdin dominano le classifiche correnti.",
    d4: "📰 Diablo 4 Stagione 5: Infernal Hordes dominano l'endgame! | 🔥 Nuovi oggetti unici per il Barbaro stanno stravolgendo il meta. | 🏹 Rogue Heartseeker rimane top tier assoluto."
};
const colorsData = { poe1: 'var(--accent-primary)', poe2: 'var(--accent-primary)', le: 'var(--accent-le)', d4: 'var(--accent-d4)', d2: 'var(--danger)' };

window.updateTicker = function(gameId) {
    const tickerEl = document.getElementById('news-ticker-content');
    if(tickerEl && newsData[gameId]) { tickerEl.innerHTML = newsData[gameId]; document.documentElement.style.setProperty('--ticker-color', colorsData[gameId]); }
};

window.updateARPGStats = function() {
    let html = `<strong style="color: var(--accent-primary); display: block; margin-bottom: 8px; font-size: 1.1em; border-bottom: 1px dashed var(--border-color); padding-bottom: 4px; font-family: var(--font-titles);">📊 Top ARPG Trend</strong>`;
    html += `<div><span>1. Diablo 4</span> <strong style="color: var(--accent-d4);">~85.2k</strong></div><div><span>2. Path of Exile</span> <strong style="color: #4caf50;">~41.5k</strong></div><div><span>3. Diablo 2: Res</span> <strong style="color: var(--danger);">~15.1k</strong></div><div><span>4. Diablo 3</span> <strong style="color: #607d8b;">~10.3k</strong></div><div><span>5. Last Epoch</span> <strong style="color: var(--accent-le);">~1.5k</strong></div><div><span>6. PoE 2</span> <strong style="color: #ffaa00;">Beta</strong></div>`;
    const statsContainer = document.getElementById('arpg-live-stats');
    if(statsContainer) statsContainer.innerHTML = html;
};

window.toggleTabs = function(evt, containerClass, btnClass, activeBtnClass, activeContentClass) {
    document.querySelectorAll('.' + containerClass).forEach(el => { el.style.display = "none"; el.classList.remove(activeContentClass); });
    document.querySelectorAll('.' + btnClass).forEach(btn => btn.classList.remove(activeBtnClass));
    evt.currentTarget.classList.add(activeBtnClass);
};
window.openMainTab = function(evt, gameId, accentColor) {
    window.toggleTabs(evt, 'tab-content', 'tab-btn', 'active-btn', 'active');
    document.getElementById(gameId).style.display = "block";
    document.querySelectorAll('.tab-btn').forEach(btn => { btn.style.borderBottomColor = "transparent"; btn.style.color = "var(--text-main)"; });
    if (accentColor) { evt.currentTarget.style.borderBottomColor = accentColor; evt.currentTarget.style.color = accentColor; }
    window.updateTicker(gameId);
};
window.openSubTab = function(evt, subTabId, gamePrefix) {
    window.toggleTabs(evt, `${gamePrefix}-sub-content`, `${gamePrefix}-sub-btn`, 'active-sub', 'active-sub-content');
    document.getElementById(subTabId).style.display = "block";
};

window.multiSearch = function(event, inputId, selectId) {
    event.preventDefault(); let input = document.getElementById(inputId).value; let site = document.getElementById(selectId).value;
    if(input.trim() !== "") {
        if (site === 'all') {
            let allSites = Array.from(document.getElementById(selectId).options).map(opt => opt.value).filter(val => val !== 'all').map(val => `site:${val}`).join(' OR ');
            window.open(`https://www.google.com/search?q=${encodeURIComponent(input)}+(${allSites})`, '_blank');
        } else { window.open(`https://www.google.com/search?q=site:${site}+${encodeURIComponent(input)}`, '_blank'); }
    }
};

const smartLinksDB = {
    poe1: { version: "3.29", endgame: [{ name: "Lightning Strike", className: "Duelist", ascendancy: "Champion", tier: "S-Tier", color: "#f44336", url: "https://maxroll.gg/poe/category/build-guides" }, { name: "Hexblast Mines", className: "Shadow", ascendancy: "Saboteur", tier: "S-Tier", color: "#f44336", url: "https://maxroll.gg/poe/category/build-guides" }, { name: "Detonate Dead", className: "Witch", ascendancy: "Elementalist", tier: "OP", color: "#9c27b0", url: "https://www.icy-veins.com/poe/builds" }, { name: "Boneshatter", className: "Marauder", ascendancy: "Juggernaut", tier: "Top Meta", color: "#2196F3", url: "https://maxroll.gg/poe/category/build-guides" }, { name: "Righteous Fire", className: "Templar", ascendancy: "Inquisitor", tier: "A-Tier", color: "#ff9800", url: "https://mobalytics.gg/poe/builds" }, { name: "Toxic Rain", className: "Ranger", ascendancy: "Pathfinder", tier: "A-Tier", color: "#ff9800", url: "https://www.icy-veins.com/poe/builds" }], leveling: [{ name: "Rolling Magma", className: "Witch", ascendancy: "Elementalist", tier: "S-Tier", color: "#f44336", url: "https://maxroll.gg/poe/category/build-guides" }, { name: "Splitting Steel", className: "Duelist", ascendancy: "Champion", tier: "S-Tier", color: "#f44336", url: "https://maxroll.gg/poe/category/build-guides" }, { name: "Toxic Rain", className: "Ranger", ascendancy: "Raider", tier: "A-Tier", color: "#ff9800", url: "https://www.icy-veins.com/poe/builds" }, { name: "Summon Raging Spirit (SRS)", className: "Witch", ascendancy: "Necromancer", tier: "Top Meta", color: "#2196F3", url: "https://mobalytics.gg/poe/builds" }, { name: "Frostblink / Fire Trap", className: "Witch", ascendancy: "Elementalist", tier: "OP", color: "#9c27b0", url: "https://maxroll.gg/poe/category/build-guides" }, { name: "Sunder", className: "Marauder", ascendancy: "Juggernaut", tier: "A-Tier", color: "#ff9800", url: "https://maxroll.gg/poe/category/build-guides" }] },
    poe2: { version: "0.5.0", endgame: [{ name: "Armor Break Slam", className: "Warrior", ascendancy: "N/A", tier: "S-Tier", color: "#f44336", url: "https://mobalytics.gg/poe2/builds" }, { name: "Ice Nova", className: "Sorceress", ascendancy: "N/A", tier: "Top Meta", color: "#2196F3", url: "https://www.icy-veins.com/poe2/build-guides" }, { name: "Spear Spin", className: "Huntress", ascendancy: "N/A", tier: "S-Tier", color: "#f44336", url: "https://mobalytics.gg/poe2/builds" }, { name: "Crossbow Burst", className: "Mercenary", ascendancy: "N/A", tier: "A-Tier", color: "#ff9800", url: "https://maxroll.gg/poe2/category/build-guides" }, { name: "Shapeshifter Bear", className: "Druid", ascendancy: "N/A", tier: "A-Tier", color: "#ff9800", url: "https://www.icy-veins.com/poe2/build-guides" }, { name: "Lightning Strike", className: "Monk", ascendancy: "N/A", tier: "Top Meta", color: "#2196F3", url: "https://mobalytics.gg/poe2/builds" }], leveling: [{ name: "Spark / Nova", className: "Sorceress", ascendancy: "N/A", tier: "S-Tier", color: "#f44336", url: "https://www.icy-veins.com/poe2/build-guides" }, { name: "Slam Starter", className: "Warrior", ascendancy: "N/A", tier: "Top Meta", color: "#2196F3", url: "https://mobalytics.gg/poe2/builds" }, { name: "Rapid Fire", className: "Mercenary", ascendancy: "N/A", tier: "S-Tier", color: "#f44336", url: "https://maxroll.gg/poe2/category/build-guides" }, { name: "Quarterstaff", className: "Monk", ascendancy: "N/A", tier: "A-Tier", color: "#ff9800", url: "https://www.icy-veins.com/poe2/build-guides" }, { name: "Spear Starter", className: "Huntress", ascendancy: "N/A", tier: "A-Tier", color: "#ff9800", url: "https://mobalytics.gg/poe2/builds" }, { name: "Summoner Starter", className: "Witch", ascendancy: "N/A", tier: "B-Tier", color: "#4caf50", url: "https://www.icy-veins.com/poe2/build-guides" }] },
    d4: { version: "S5", endgame: [{ name: "Bash Cleave", className: "Barbarian", ascendancy: "Melee", tier: "S-Tier", color: "#f44336", url: "https://maxroll.gg/d4/build-guides" }, { name: "Heartseeker", className: "Rogue", ascendancy: "Ranged", tier: "S-Tier", color: "#f44336", url: "https://maxroll.gg/d4/build-guides" }, { name: "Minion Golem", className: "Necromancer", ascendancy: "Summoner", tier: "Top Meta", color: "#2196F3", url: "https://d4builds.gg" }, { name: "Lightning Spear", className: "Sorcerer", ascendancy: "Shock", tier: "S-Tier", color: "#f44336", url: "https://maxroll.gg/d4/build-guides" }], leveling: [{ name: "Upheaval", className: "Druid", ascendancy: "Werebear", tier: "A-Tier", color: "#ff9800", url: "https://maxroll.gg/d4/build-guides" }, { name: "Firewall", className: "Sorcerer", ascendancy: "Pyromancy", tier: "S-Tier", color: "#f44336", url: "https://maxroll.gg/d4/build-guides" }, { name: "Penetrating Strike", className: "Rogue", ascendancy: "Marksman", tier: "A-Tier", color: "#ff9800", url: "https://d4builds.gg" }] },
    le: { version: "1.0", endgame: [{ name: "Dive Bomb", className: "Rogue", ascendancy: "Falconer", tier: "S-Tier", color: "#f44336", url: "https://maxroll.gg/last-epoch/build-guides" }, { name: "Chthonic Fissure", className: "Acolyte", ascendancy: "Warlock", tier: "S-Tier", color: "#f44336", url: "https://www.lastepochtools.com/builds/" }, { name: "Frost Claw", className: "Mage", ascendancy: "Runemaster", tier: "OP", color: "#9c27b0", url: "https://maxroll.gg/last-epoch/build-guides" }, { name: "Healing Hands", className: "Sentinel", ascendancy: "Paladin", tier: "Top Meta", color: "#2196F3", url: "https://www.icy-veins.com/last-epoch/builds" }, { name: "Wraithlord", className: "Acolyte", ascendancy: "Necromancer", tier: "A-Tier", color: "#ff9800", url: "https://www.lastepochtools.com/builds/" }, { name: "Shadow Daggers", className: "Rogue", ascendancy: "Bladedancer", tier: "A-Tier", color: "#ff9800", url: "https://maxroll.gg/last-epoch/build-guides" }], leveling: [{ name: "Void Cleave", className: "Sentinel", ascendancy: "Void Knight", tier: "S-Tier", color: "#f44336", url: "https://maxroll.gg/last-epoch/build-guides" }, { name: "Glacier", className: "Mage", ascendancy: "Sorcerer", tier: "S-Tier", color: "#f44336", url: "https://www.lastepochtools.com/builds/" }, { name: "Bone Curse", className: "Acolyte", ascendancy: "Warlock", tier: "Top Meta", color: "#2196F3", url: "https://maxroll.gg/last-epoch/build-guides" }, { name: "Thorn Totem", className: "Primalist", ascendancy: "Shaman", tier: "A-Tier", color: "#ff9800", url: "https://www.icy-veins.com/last-epoch/builds" }, { name: "Flurry", className: "Rogue", ascendancy: "Bladedancer", tier: "A-Tier", color: "#ff9800", url: "https://www.lastepochtools.com/builds/" }, { name: "Elemental Nova", className: "Mage", ascendancy: "Runemaster", tier: "Top Meta", color: "#2196F3", url: "https://maxroll.gg/last-epoch/build-guides" }] },
    d2: { version: "S14", endgame: [{ name: "Blizzard", className: "Sorceress", ascendancy: "Cold", tier: "S-Tier", color: "#f44336", url: "https://www.icy-veins.com/d2/classes-and-builds" }, { name: "Mosaic", className: "Assassin", ascendancy: "Martial Arts", tier: "OP", color: "#9c27b0", url: "https://maxroll.gg/d2/category/guides" }, { name: "Hammerdin", className: "Paladin", ascendancy: "Combat", tier: "S-Tier", color: "#f44336", url: "https://mobalytics.gg/diablo-2/builds" }, { name: "Lightning Fury", className: "Amazon", ascendancy: "Javazon", tier: "S-Tier", color: "#f44336", url: "https://www.icy-veins.com/d2/classes-and-builds" }, { name: "Nova", className: "Sorceress", ascendancy: "Lightning", tier: "Top Meta", color: "#2196F3", url: "https://maxroll.gg/d2/category/guides" }, { name: "Smiter Uber Killer", className: "Paladin", ascendancy: "Combat", tier: "Boss Killer", color: "#607d8b", url: "https://www.icy-veins.com/d2/classes-and-builds" }], leveling: [{ name: "Holy Fire", className: "Paladin", ascendancy: "Offensive Auras", tier: "S-Tier", color: "#f44336", url: "https://maxroll.gg/d2/category/guides" }, { name: "Wake of Fire", className: "Assassin", ascendancy: "Traps", tier: "S-Tier", color: "#f44336", url: "https://www.icy-veins.com/d2/classes-and-builds" }, { name: "Fissure", className: "Druid", ascendancy: "Elemental", tier: "Top Meta", color: "#2196F3", url: "https://maxroll.gg/d2/category/guides" }, { name: "Nova / Static", className: "Sorceress", ascendancy: "Lightning", tier: "OP", color: "#9c27b0", url: "https://www.icy-veins.com/d2/classes-and-builds" }, { name: "Bone Spear", className: "Necromancer", ascendancy: "Poison & Bone", tier: "Top Meta", color: "#2196F3", url: "https://www.icy-veins.com/d2/classes-and-builds" }, { name: "Singer (Warcry)", className: "Barbarian", ascendancy: "Warcries", tier: "A-Tier", color: "#ff9800", url: "https://maxroll.gg/d2/category/guides" }] }
};

window.fetchAndDisplayBuilds = async function(game, listType, elementId) {
    const ul = document.getElementById(elementId);
    if(!ul || !smartLinksDB[game] || !smartLinksDB[game][listType]) return;
    const data = { version: smartLinksDB[game].version, builds: smartLinksDB[game][listType] };
    ul.innerHTML = '';
    const gameTitle = game === 'poe1' ? 'Path of Exile' : game === 'poe2' ? 'Path of Exile 2' : game === 'd4' ? 'Diablo 4' : game === 'le' ? 'Last Epoch' : 'Diablo 2 Resurrected';
    data.builds.forEach(b => {
        const baseQuery = encodeURIComponent(`${gameTitle} ${data.version} ${b.name} ${b.className} build`);
        const ytSearch = `https://www.youtube.com/results?search_query=${baseQuery}`;
        let searchSites = "maxroll OR mobalytics OR icy veins";
        if(game === 'poe1' || game === 'poe2') searchSites += " OR poebuilds";
        if(game === 'le') searchSites += " OR lastepochtools";
        if(game === 'd4') searchSites += " OR d4builds.gg";
        const googleSearch = `https://www.google.com/search?q=${baseQuery}+${searchSites}`;
        ul.innerHTML += `<li><div class="dash-list-item-content"><div><span style="font-weight: bold; color: var(--text-main); font-size: 1.1em;">${b.name}</span><span class="tag" style="background:${b.color}; margin-left: 5px;">${b.tier}</span></div><div class="build-class-info">(${b.className} - ${b.ascendancy})</div><div class="smart-links-container"><a href="${ytSearch}" class="tool-link" style="background: var(--color-yt);" target="_blank" rel="noopener noreferrer">📺 YouTube</a><a href="${googleSearch}" class="tool-link" style="background: var(--color-google);" target="_blank" rel="noopener noreferrer">🔍 Google Meta</a><a href="${b.url}" class="tool-link" style="background: var(--color-site);" target="_blank" rel="noopener noreferrer">🔗 Sito (Root)</a></div></div><div class="dash-list-actions"><button class="quick-save-btn" aria-label="Salva" onclick="window.quickSave('${game}', '${b.name} (${b.ascendancy})', '${data.version}', '${ytSearch}')">💾</button></div></li>`;
    });
};

window.filterItemsStatic = function(sectionId, filterId, dataAttr) {
    const selectedClass = document.getElementById(filterId).value;
    const section = document.getElementById(sectionId);
    const items = section.querySelectorAll(`li[${dataAttr}]`);
    items.forEach(item => { const itemClasses = item.getAttribute(dataAttr).split(','); item.style.display = (selectedClass === 'all' || itemClasses.includes('all') || itemClasses.includes(selectedClass)) ? '' : 'none'; });
    section.querySelectorAll('.category-title').forEach(category => {
        const ul = category.nextElementSibling;
        if (ul && ul.tagName === 'UL') {
            const hasVisibleItems = Array.from(ul.querySelectorAll('li')).some(li => li.style.display !== 'none');
            category.style.display = hasVisibleItems ? 'block' : 'none'; ul.style.display = hasVisibleItems ? 'block' : 'none';
        }
    });
};

// === DATABASE RUNEWORDS D2 (LE 22 RUNEWORDS COMPLETE) ===
const RUNE_IMG_BASE_URL = "https://d2runewizard.com/assets/runes/";
const runewordsData = [
    { name: "Stealth (Furtività)", type: "armatura", emoji: "👕", level: 17, sockets: 2, runes: ["Tal", "Eth"], base: "Qualsiasi Armatura Torso", desc: "L'armatura per eccellenza per il leveling. Offre velocità di movimento e di lancio magie fenomenali fin dai primissimi livelli.", stats: ["+25% Velocità di Lancio (FCR)", "+25% Velocità di Movimento (FRW)", "+25% Recupero dai Colpi (FHR)", "Rigenerazione Mana +15%"] },
    { name: "Treachery (Tradimento)", type: "armatura", emoji: "👕", level: 43, sockets: 3, runes: ["Shael", "Thul", "Lem"], base: "Armatura Torso", desc: "Eccellente per il Mercenario Atto 2 o personaggi Melee. Può far 'proccare' Fade, aumentando massicciamente le resistenze e la riduzione danni.", stats: ["5% probabilità di lanciare Dissolvenza (Fade) liv. 15", "+45% Velocità d'Attacco Aumentata (IAS)", "+20% Recupero dai Colpi (FHR)", "+30% Resistenza al Freddo"] },
    { name: "Fortitude (Fortezza)", type: "armatura", emoji: "👕", level: 59, sockets: 4, runes: ["El", "Sol", "Dol", "Lo"], base: "Armatura Torso (Anche Armi)", desc: "La migliore armatura per Mercenari e personaggi fisici (Melee/Archi). Dona un danno pazzesco e difese impenetrabili.", stats: ["<span style='color:#ff3333'>+300% Danno Aumentato</span>", "+200% Difesa", "+ (1-1.5 per Livello) a Vita", "+25-30% a Tutte le Resistenze"] },
    { name: "Enigma", type: "armatura", emoji: "👕", level: 65, sockets: 3, runes: ["Jah", "Ith", "Ber"], base: "Mage Plate, Dusk Shroud, Archon Plate", desc: "La runeword più desiderata del gioco. Conferisce l'abilità 'Teletrasporto' a QUALSIASI classe, rivoluzionando il farming.", stats: ["<span style='color:var(--item-unique)'>+1 a Teletrasporto (Teleport)</span>", "+2 a Tutte le Abilità", "+ (0.75 per Livello) a Forza", "+ (1 per Livello) % prob. di trovare Oggetti Magici"] },
    { name: "Chains of Honor (Catene dell'Onore)", type: "armatura", emoji: "👕", level: 63, sockets: 4, runes: ["Dol", "Um", "Ber", "Ist"], base: "Armatura Torso", desc: "Un'alternativa eccezionale a Enigma se hai bisogno di sopravvivenza. Offre enormi resistenze e danni extra contro demoni/non-morti.", stats: ["+2 a Tutte le Abilità", "<span style='color:#4da6ff'>+65% a Tutte le Resistenze Elementali</span>", "+200% Danno ai Demoni / +100% ai Non-Morti", "Ruba l'8% di Vita per Colpo"] },
    { name: "Hustle", type: "armatura", emoji: "👕", level: 39, sockets: 3, runes: ["Shael", "Ko", "Eld"], base: "Armatura Torso (Anche Armi)", desc: "Nuova Runeword della patch 2.6. Ottima per correre e attaccare velocemente a metà gioco.", stats: ["+50% Velocità di Movimento (FRW)", "+20% Velocità d'Attacco Aumentata (IAS)", "+20% Recupero dai Colpi (FHR)", "Consumo Vigore ridotto del 50%"] },
    { name: "Spirit (Spirito - Arma)", type: "arma", emoji: "🗡️", level: 25, sockets: 4, runes: ["Tal", "Thul", "Ort", "Amn"], base: "Spade (es. Crystal Sword, Broad Sword)", desc: "Il miglior oggetto qualità/prezzo per tutti gli Incantatori (Caster). Statistiche assurde per rune così economiche.", stats: ["+2 a Tutte le Abilità", "+25-35% Velocità di Lancio (FCR)", "+55% Recupero dai Colpi (FHR)", "+22 a Vitalità / +89-112 a Mana"] },
    { name: "Insight (Intuizione)", type: "arma", emoji: "🔱", level: 27, sockets: 4, runes: ["Ral", "Tir", "Tal", "Sol"], base: "Armi Inastate (Polearms) o Archi", desc: "Equipaggiata dal Mercenario dell'Atto 2, risolve permanentemente qualsiasi problema di Mana per il tuo personaggio.", stats: ["<span style='color:#4da6ff'>Aura di Meditazione liv. 12-17 attiva</span>", "+200-260% Danno Aumentato", "+35% Velocità di Lancio (FCR)", "Bonus del 23% al Ritrovamento di Oggetti Magici"] },
    { name: "Grief (Dolore)", type: "arma", emoji: "⚔️", level: 59, sockets: 5, runes: ["Eth", "Tir", "Lo", "Mal", "Ral"], base: "Spade, Asce (Phase Blade, Berserker Axe)", desc: "L'arma corpo a corpo più forte del gioco. Il suo bonus al danno 'piatto' distrugge completamente i calcoli matematici del gioco.", stats: ["<span style='color:#ff3333'>Danno +340-400 (Danno base Puro!)</span>", "+30-40% Velocità d'Attacco (IAS)", "Ignora la Difesa del Bersaglio", "20% Colpo Mortale (Deadly Strike)"] },
    { name: "Call to Arms (Chiamata alle Armi)", type: "arma", emoji: "📯", level: 57, sockets: 5, runes: ["Amn", "Ral", "Mal", "Ist", "Ohm"], base: "Spade, Mazze (Crystal Sword, Flail)", desc: "La runeword definitiva per lo switch dell'arma (W). Permette a chiunque di lanciare gli urli del Barbaro per aumentare Vita e Mana.", stats: ["+1 a Tutte le Abilità", "+1-6 a Comando di Battaglia", "<span style='color:var(--item-unique)'>+1-6 a Ordini di Battaglia (Battle Orders)</span>", "+1-4 a Grido di Battaglia"] },
    { name: "Heart of the Oak (HOTO)", type: "arma", emoji: "🧙‍♂️", level: 55, sockets: 4, runes: ["Ko", "Vex", "Pul", "Thul"], base: "Mazze, Bastoni (Flail)", desc: "L'arma perfetta per gli Incantatori a fine gioco. FCR eccezionale e massicce resistenze.", stats: ["+3 a Tutte le Abilità", "+40% Velocità di Lancio (FCR)", "<span style='color:#4da6ff'>+30-40% a Tutte le Resistenze Elementali</span>", "+15% Mana Massimo"] },
    { name: "Infinity (Infinito)", type: "arma", emoji: "🔱", level: 63, sockets: 4, runes: ["Ber", "Mal", "Ber", "Ist"], base: "Armi Inastate (Mancatcher, Thresher) o Lance", desc: "L'arma 'Endgame' per i mercenari delle build Elementali. Rompe le immunità dei mostri in modalità Inferno.", stats: ["<span style='color:#ffaa00'>Aura Convinzione (Conviction) liv. 12 attiva</span>", "-45-55% alla Resistenza al Fulmine del Nemico", "40% Prob. di Colpo Frantumante (Crushing Blow)", "Aggiunge Danno da Fulmine"] },
    { name: "Mosaic", type: "arma", emoji: "🥋", level: 53, sockets: 3, runes: ["Mal", "Gul", "Amn"], base: "Armi corpo a corpo da Assassina (Claws)", desc: "Introdotta nella 2.6, ha reso l'Assassina Martial Arts una delle classi più potenti e visivamente caotiche del gioco.", stats: ["<span style='color:#4da6ff'>50% Prob. di non consumare cariche (100% con 2 armi)</span>", "+2 ad Abilità Arti Marziali (Assassina)", "+20% IAS / Danni da freddo/fuoco/fulmine aggiunti", "Ruba 7% di Vita per colpo"] },
    { name: "White (Bianco)", type: "arma", emoji: "💀", level: 35, sockets: 2, runes: ["Dol", "Io"], base: "Bacchette (Wands) - Solo Negromante", desc: "Se creata in una bacchetta che ha già +3 a Lancia d'Osso, trasforma il tuo Negromante in una mitragliatrice di danni.", stats: ["+3 ad Abilità Veleno e Osso (Necromante)", "+2 a Lancia d'Osso / +3 ad Armatura d'Osso", "+20% Velocità di Lancio (FCR)", "+13 a Mana"] },
    { name: "Spirit (Spirito - Scudo)", type: "scudo", emoji: "🛡️", level: 25, sockets: 4, runes: ["Tal", "Thul", "Ort", "Amn"], base: "Monarch (Paladini: Qualsiasi scudo base con +Res)", desc: "La versione Scudo di Spirit. È il motivo per cui quasi tutti i Caster mettono almeno 156 di Forza (per indossare il Monarch).", stats: ["+2 a Tutte le Abilità", "+25-35% Velocità di Lancio (FCR)", "+55% Recupero dai Colpi (FHR)", "+35% Res Freddo, Fulmine, Veleno (Manca Fuoco!)"] },
    { name: "Rhyme (Rima)", type: "scudo", emoji: "🛡️", level: 29, sockets: 2, runes: ["Shael", "Eth"], base: "Bone Shield, Grim Shield", desc: "Uno scudo eccellente per metà gioco o Magic Find. Impedisce di essere congelati.", stats: ["<span style='color:#4da6ff'>Impossibile essere Congelati (Cannot Be Frozen)</span>", "+25% a Tutte le Resistenze Elementali", "+20% Possibilità di Blocco / +40% Velocità di Blocco", "25% Ritrovamento Oggetti Magici (MF)"] },
    { name: "Ancient's Pledge (Promessa degli Antichi)", type: "scudo", emoji: "🛡️", level: 21, sockets: 3, runes: ["Ral", "Ort", "Tal"], base: "Kite Shield, Large Shield", desc: "Le rune ti vengono donate completando la quest dell'Atto 5 Normale. Fixa le tue resistenze in un colpo solo.", stats: ["+48% Resistenza al Freddo", "+48% Resistenza al Fuoco", "+48% Resistenza al Fulmine", "+48% Resistenza al Veleno"] },
    { name: "Exile (Esilio)", type: "scudo", emoji: "🛡️", level: 57, sockets: 4, runes: ["Vex", "Ohm", "Ist", "Dol"], base: "Scudi del Paladino (Ideale: Eterei con auto-riparazione)", desc: "Il miglior scudo per Paladini 'Smiter' o Zealer. Dona Aura Sfida e ricarica vita castando 'Life Tap'.", stats: ["<span style='color:#ff3333'>15% prob. di lanciare Life Tap (Ruba Vita) liv. 5 su attacco</span>", "Aura di Sfida (Defiance) liv. 13-16 attiva", "+2 ad Aure Offensive (Paladino)", "Ripara 1 Durabilità ogni 4 secondi"] },
    { name: "Lore (Conoscenza)", type: "elmo", emoji: "🪖", level: 27, sockets: 2, runes: ["Ort", "Sol"], base: "Qualsiasi Elmo a 2 incavi (es. Cap, Bone Helm)", desc: "L'elmo standard per finire la difficoltà Normale e affrontare Incubo. Dona un utilissimo +1 a Tutte le Abilità.", stats: ["<span style='color:var(--item-unique)'>+1 a Tutte le Abilità</span>", "+30% Resistenza al Fulmine", "Danno Ridotto di 7", "+2 al Mana per ogni uccisione"] },
    { name: "Flickering Flame", type: "elmo", emoji: "🪖", level: 55, sockets: 3, runes: ["Nef", "Pul", "Vex"], base: "Elmi (Ideale: Elmi del Druido con +Abilità)", desc: "Introdotto nella 2.4, è il sogno di ogni build fuoco. Abbassa le difese nemiche e fornisce Aura.", stats: ["<span style='color:#ff3333'>Aura Resistenza al Fuoco liv. 4-8 attiva</span>", "-10-15% alla Resistenza al Fuoco dei Nemici", "+3 ad Abilità di Fuoco", "+5% alle Resistenze Massime al Fuoco"] },
    { name: "Bulwark (Baluardo)", type: "elmo", emoji: "🪖", level: 35, sockets: 3, runes: ["Shael", "Io", "Sol"], base: "Qualsiasi Elmo a 3 incavi", desc: "Nuovo elmo economico della patch 2.6 per Mercenari. Riduce drasticamente i danni subiti e fornisce Life Leech.", stats: ["Ruba 4-6% di Vita per Colpo", "Riduce il Danno Fisico Subito del 10-15%", "+20% Recupero dai Colpi (FHR)", "Aumenta la Vita Massima del 5%"] },
    { name: "Cure (Cura)", type: "elmo", emoji: "🪖", level: 35, sockets: 3, runes: ["Shael", "Io", "Tal"], base: "Qualsiasi Elmo a 3 incavi", desc: "Nuovo elmo 2.6. Insieme a Insight su un Mercenario (con aura Preghiera) crea una sinergia mostruosa di cura.", stats: ["<span style='color:#52d164'>Aura Purificazione (Cleansing) liv. 1 attiva</span>", "+20% Recupero dai Colpi (FHR)", "Aumenta la Vita Massima del 5%", "+40-60% Resistenza al Veleno"] }
];

window.renderD2Runewords = function() {
    const selectedType = document.getElementById('type-filter-d2').value;
    const container = document.getElementById('runewords-container');
    if(!container) return;
    container.innerHTML = ''; 
    let typesToRender = selectedType === 'all' ? [...new Set(runewordsData.map(rw => rw.type))] : [selectedType];
    typesToRender.forEach(type => {
        const items = runewordsData.filter(rw => rw.type === type);
        if (items.length === 0) return;
        const h2 = document.createElement('h2'); h2.className = 'guide-title category-title';
        h2.textContent = type === 'armatura' ? '👕 Armature (Body Armor)' : type === 'arma' ? '⚔️ Armi (Weapons)' : type === 'scudo' ? '🛡️ Scudi (Shields)' : '🪖 Elmi (Helms)';
        container.appendChild(h2);
        const ul = document.createElement('ul'); ul.className = 'guide-list';
        items.forEach(item => {
            const li = document.createElement('li'); li.className = 'runeword-card';
            const statsHtml = item.stats.map(stat => `<div class="stat-line">${stat}</div>`).join('');
            let runeImagesHtml = '<div class="rune-images-container">';
            item.runes.forEach(rune => { let imgUrl = `${RUNE_IMG_BASE_URL}${rune.trim().toLowerCase()}.webp`; runeImagesHtml += `<div class="rune-block"><img src="${imgUrl}" alt="${rune}"><span>${rune}</span></div>`; });
            runeImagesHtml += '</div>';
            li.innerHTML = `<div class="item-image-container">${item.emoji}</div><div class="item-details"><span class="unique-item">${item.name}</span><div class="badges"><span class="level-req">📈 Liv. Req: ${item.level}</span><span class="item-sockets">🕳️ ${item.sockets} Incavi</span><span class="item-runes">🪨 ${item.runes.join(' + ')}</span></div>${runeImagesHtml}<span class="desc">${item.desc}</span><span class="class-rec">🎯 Base Ideale: ${item.base}</span></div><div class="item-stats"><strong>Bonus e Statistiche</strong>${statsHtml}</div>`;
            ul.appendChild(li);
        });
        container.appendChild(ul);
    });
};

// Modals e Lightbox Enciclopedia
window.openMechModal = function(id) { document.getElementById(id).style.display = 'flex'; document.body.style.overflow = 'hidden'; };
window.closeMechModalById = function(id) { document.getElementById(id).style.display = 'none'; document.body.style.overflow = 'auto'; };
window.closeMechModal = function(event) { if (event.target.classList.contains('mech-modal-overlay')) { event.target.style.display = 'none'; document.body.style.overflow = 'auto'; } };
window.openLightbox = function(imgSrc) { document.getElementById('lightbox').classList.add('active'); document.getElementById('lightbox-img').src = imgSrc; document.body.style.overflow = 'hidden'; };
window.closeLightbox = function(event) { if (event && event.target.id !== 'lightbox') return; document.getElementById('lightbox').classList.remove('active'); document.body.style.overflow = 'auto'; };
document.addEventListener('keydown', function(e) { if (e.key === 'Escape') { const lb = document.getElementById('lightbox'); if(lb && lb.classList.contains('active')) { lb.classList.remove('active'); document.body.style.overflow = 'auto'; } } });

document.addEventListener("DOMContentLoaded", () => {
    window.loadMyBuildsUI();
    window.renderD2Runewords();
    window.updateARPGStats();
    window.updateTicker('poe1'); 
    window.filterMechanics('all');
    ['poe1', 'poe2', 'd4', 'le', 'd2'].forEach(game => {
        window.fetchAndDisplayBuilds(game, 'endgame', `top-builds-${game}`);
        window.fetchAndDisplayBuilds(game, 'leveling', `top-leveling-${game}`);
    });
});