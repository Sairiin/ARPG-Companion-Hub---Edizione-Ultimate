import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = { apiKey: "AIzaSyBBb-T8EEAGk203ANzajLkNvyoo17STTus", authDomain: "arpg-companion-hub.firebaseapp.com", projectId: "arpg-companion-hub", storageBucket: "arpg-companion-hub.firebasestorage.app", messagingSenderId: "992359528045", appId: "1:992359528045:web:f1776114a695399237b164", measurementId: "G-R7EDZCSZN2" };

let app, auth, db;
try { app = initializeApp(firebaseConfig); auth = getAuth(app); db = getFirestore(app); } catch(e) { console.warn("Firebase offline.", e); }

let currentUser = null;
let userBuilds = { poe1: [], poe2: [], d2: [], le: [], d4: [] }; 
window.editingIndex = { poe1: null, poe2: null, d2: null, le: null, d4: null };

window.openAuthModal = () => document.getElementById('auth-modal').style.display = 'flex';
window.closeAuthModal = () => document.getElementById('auth-modal').style.display = 'none';
window.loginWithGoogle = async () => { const provider = new GoogleAuthProvider(); try { await signInWithPopup(auth, provider); } catch(e) {} };
window.registerWithEmail = async () => { const e=document.getElementById('auth-email').value; const p=document.getElementById('auth-password').value; try { await createUserWithEmailAndPassword(auth,e,p); window.closeAuthModal(); } catch(e){ alert(e.message); } };
window.loginWithEmail = async () => { const e=document.getElementById('auth-email').value; const p=document.getElementById('auth-password').value; try { await signInWithEmailAndPassword(auth,e,p); window.closeAuthModal(); } catch(e){ alert(e.message); } };
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
            userBuilds = JSON.parse(localStorage.getItem('arpgBuildHub')) || { poe1: [], poe2: [], d2: [], le: [], d4: [] };
            window.loadMyBuildsUI();
        }
    });
}

async function syncFromFirebase() {
    if (!currentUser || !db) return;
    try {
        const docSnap = await getDoc(doc(db, "users", currentUser.uid));
        if (docSnap.exists()) { userBuilds = docSnap.data().builds || { poe1: [], poe2: [], d2: [], le: [], d4: [] }; }
        else { await setDoc(doc(db, "users", currentUser.uid), { builds: userBuilds }); }
        window.loadMyBuildsUI();
    } catch(e) { console.error(e); }
}
async function syncToFirebase() {
    if (currentUser && db) { try { await setDoc(doc(db, "users", currentUser.uid), { builds: userBuilds }, { merge: true }); } catch(e) {} }
    else { localStorage.setItem('arpgBuildHub', JSON.stringify(userBuilds)); }
    window.loadMyBuildsUI();
}

window.loadMyBuildsUI = function() {
    ['poe1', 'poe2', 'd2', 'le', 'd4'].forEach(game => {
        const ul = document.getElementById(`my-builds-${game}`);
        if(!ul) return;
        ul.innerHTML = '';
        if (!userBuilds[game] || userBuilds[game].length === 0) { ul.innerHTML = '<li><span style="color: var(--text-muted); font-style:italic;">Nessuna build salvata.</span></li>'; return; }
        userBuilds[game].forEach((build, index) => {
            ul.innerHTML += `<li><div class="dash-list-item-content"><a href="${build.link}" class="saved-link" target="_blank">${build.name}</a><span class="build-version">v. ${build.version || 'N/A'}</span><span class="build-note">- ${build.note || ''}</span></div><div class="dash-list-actions"><button class="edit-btn" onclick="window.editBuild('${game}', ${index})">✏️</button><button class="delete-btn" onclick="window.deleteBuild('${game}', ${index})">❌</button></div></li>`;
        });
    });
};

window.filterSavedBuilds = function(game) {
    let filter = document.getElementById(`filter-saved-${game}`).value.toLowerCase();
    let li = document.getElementById(`my-builds-${game}`)?.getElementsByTagName("li");
    if(!li) return;
    for (let i=0; i<li.length; i++) { if(!li[i].innerText.includes("Nessuna build")) li[i].style.display = (li[i].innerText.toLowerCase().indexOf(filter) > -1) ? "" : "none"; }
};
window.editBuild = function(game, index) {
    const build = userBuilds[game][index];
    document.getElementById(`name-${game}`).value = build.name; document.getElementById(`link-${game}`).value = build.link; document.getElementById(`version-${game}`).value = build.version; document.getElementById(`note-${game}`).value = build.note;
    window.editingIndex[game] = index;
    document.getElementById(`submit-btn-${game}`).textContent = "Aggiorna"; document.getElementById(`cancel-btn-${game}`).style.display = "inline-block";
};
window.cancelEdit = function(game) {
    window.editingIndex[game] = null; document.getElementById(`form-${game}`).reset();
    document.getElementById(`submit-btn-${game}`).textContent = "Salva"; document.getElementById(`cancel-btn-${game}`).style.display = "none";
};
window.saveBuild = async function(event, game) {
    event.preventDefault();
    const b = { name: document.getElementById(`name-${game}`).value, link: document.getElementById(`link-${game}`).value, version: document.getElementById(`version-${game}`).value, note: document.getElementById(`note-${game}`).value };
    if (!userBuilds[game]) userBuilds[game] = [];
    if (window.editingIndex[game] !== null) userBuilds[game][window.editingIndex[game]] = b; else userBuilds[game].push(b);
    await syncToFirebase(); window.cancelEdit(game);
};
window.deleteBuild = async function(game, index) { if(!confirm("Eliminare?")) return; userBuilds[game].splice(index, 1); await syncToFirebase(); };
window.quickSave = async function(game, name, version, link) { if(!userBuilds[game]) userBuilds[game]=[]; userBuilds[game].push({name, link, version, note:"Dal Catalogo"}); await syncToFirebase(); alert("Build Salvata!"); };

window.setTheme = function(themeName) { document.documentElement.setAttribute('data-theme', themeName); localStorage.setItem('arpgTheme', themeName); };
window.setTheme(localStorage.getItem('arpgTheme') || 'dark');
let currentFontSize = parseInt(localStorage.getItem('arpgFontSize')) || 16;
window.setFontSize = function(size) { currentFontSize = size; document.documentElement.style.setProperty('--base-font-size', currentFontSize + 'px'); localStorage.setItem('arpgFontSize', currentFontSize); };
window.changeFontSize = function(step) { let newSize = currentFontSize + (step * 2); if(newSize >= 12 && newSize <= 24) window.setFontSize(newSize); };
window.setFontSize(currentFontSize);

window.openOverlay = function(url, title) { document.getElementById('modal-iframe').src = url; document.getElementById('modal-title').innerText = title; document.getElementById('iframe-modal').style.display = 'flex'; };
window.closeOverlay = function() { document.getElementById('modal-iframe').src = ''; document.getElementById('iframe-modal').style.display = 'none'; };
window.closeEssentialPanel = function(panelId, triggerId) { document.getElementById(panelId).hidden = true; };
window.toggleAppearancePanel = function() { const p = document.getElementById('appearance-panel'); p.hidden = !p.hidden; };

window.toggleTabs = function(evt, containerClass, btnClass, activeBtnClass, activeContentClass) {
    document.querySelectorAll('.' + containerClass).forEach(el => { el.style.display = "none"; el.classList.remove(activeContentClass); });
    document.querySelectorAll('.' + btnClass).forEach(btn => btn.classList.remove(activeBtnClass));
    evt.currentTarget.classList.add(activeBtnClass);
};

const initializedTabs = new Set();
window.openMainTab = async function(evt, gameId, accentColor) {
    document.querySelectorAll('.tab-btn').forEach(btn => { btn.classList.remove('active-btn'); btn.style.borderBottomColor = "transparent"; btn.style.color = "var(--text-main)"; });
    evt.currentTarget.classList.add('active-btn');
    if (accentColor) { evt.currentTarget.style.borderBottomColor = accentColor; evt.currentTarget.style.color = accentColor; }
    
    const container = document.getElementById('game-content-container');
    container.innerHTML = `<div style="text-align:center; padding: 50px; color: var(--text-muted);">Caricamento dati in corso...</div>`;
    
    try {
        const res = await fetch(`pages/${gameId}.html`);
        if (!res.ok) throw new Error("File non trovato");
        container.innerHTML = await res.text();
        initializedTabs.delete(gameId);
        window.initializeTabContent(gameId);
        document.body.dataset.activeGame = gameId;
        const firstSubBtn = container.querySelector(`.${gameId}-sub-btn`);
        if(firstSubBtn) firstSubBtn.click();
    } catch (error) { container.innerHTML = `<div style="text-align:center; padding: 50px; color: var(--danger);">Errore nel caricamento. Assicurati che i file in pages/ esistano.</div>`; }
};

window.openSubTab = function(evt, subTabId, gamePrefix) {
    window.toggleTabs(evt, `${gamePrefix}-sub-content`, `${gamePrefix}-sub-btn`, 'active-sub', 'active-sub-content');
    document.getElementById(subTabId).style.display = "block";
    if (subTabId === 'poe1-encyclopedia' && window.poe1Encyclopedia) window.poe1Encyclopedia.filterSelection(null, 'all');
};

window.multiSearch = function(event, inputId, selectId) {
    event.preventDefault(); let input = document.getElementById(inputId).value; let site = document.getElementById(selectId).value;
    if(input.trim() !== "") {
        if (site === 'all') { let allSites = Array.from(document.getElementById(selectId).options).map(opt => opt.value).filter(val => val !== 'all').map(val => `site:${val}`).join(' OR '); window.open(`https://www.google.com/search?q=${encodeURIComponent(input)}+(${allSites})`, '_blank'); }
        else { window.open(`https://www.google.com/search?q=site:${site}+${encodeURIComponent(input)}`, '_blank'); }
    }
};

const HUB_GAMES = { poe1: 'Path of Exile 1', poe2: 'Path of Exile 2', le: 'Last Epoch', d2: 'Diablo II: Resurrected', d4: 'Diablo 4' };
let hubBuildCatalog = null; let hubPatchRegistry = null; let hubRankingData = null; let hubSearchEntries = [];

function buildElement(tag, className, text) { const el = document.createElement(tag); if (className) el.className = className; if (text !== undefined) el.textContent = text; return el; }

async function loadAllJSON() {
    try {
        const [cat, pat, rank] = await Promise.allSettled([
            fetch('./assets/builds.json', {cache:'no-store'}).then(r => r.ok?r.json():Promise.reject()),
            fetch('./assets/patches.json', {cache:'no-store'}).then(r => r.ok?r.json():Promise.reject()),
            fetch('./assets/rankings.json', {cache:'no-store'}).then(r => r.ok?r.json():Promise.reject())
        ]);
        hubBuildCatalog = cat.status === 'fulfilled' ? cat.value : null;
        hubPatchRegistry = pat.status === 'fulfilled' ? pat.value : null;
        hubRankingData = rank.status === 'fulfilled' ? rank.value : null;
        
        hubSearchEntries = [];
        if (hubBuildCatalog?.games) {
            Object.entries(hubBuildCatalog.games).forEach(([gameId, game]) => {
                Object.entries(game.builds || {}).forEach(([cat, builds]) => {
                    (builds || []).forEach(b => hubSearchEntries.push({ title: b.title, kind: 'Build', gameId, meta: `${b.class} ${b.specialization}`, url: b.sourceUrl }));
                });
            });
        }
    } catch (e) { console.warn("Errore caricamento database JSON.", e); }
}

window.initializeTabContent = async function(gameId) {
    if (!hubBuildCatalog) await loadAllJSON();
    const gameData = hubBuildCatalog?.games[gameId];
    if (!gameData) return;

    const metaTarget = document.getElementById(`build-meta-${gameId}`);
    if(metaTarget) {
        metaTarget.innerHTML = `<div class="build-meta-heading"><span class="build-meta-eyebrow">Aggiornamento meta</span><strong class="build-meta-title">${HUB_GAMES[gameId]}</strong><span class="build-meta-status">Sincronizzato</span></div>
        <div class="build-meta-details"><div class="build-meta-detail"><span class="build-meta-label">Patch / Stagione / Timer</span><strong class="build-meta-value">${gameData.patch}</strong></div></div>`;
    }

    document.querySelectorAll(`#${gameId} .season-highlight`).forEach(el => { el.textContent = gameData.patch || "Stagione Corrente"; });

    const discTarget = document.getElementById(`build-discovery-${gameId}`);
    if(discTarget && gameData.discovery) {
        let html = `<div class="build-discovery-heading"><span class="build-discovery-eyebrow">Community discovery</span><strong class="build-discovery-title">Build da esplorare</strong></div><div class="build-discovery-sources">`;
        gameData.discovery.sources.forEach(s => html += `<a href="${s[1]}" target="_blank" class="tool-link" style="background:#555;">↗ ${s[0]}</a>`);
        html += `</div><div class="build-discovery-grid">`;
        gameData.discovery.prompts.forEach(p => {
            let cleanPatch = gameData.patch.split('(')[0].trim();
            let q = encodeURIComponent(`${HUB_GAMES[gameId]} ${cleanPatch} ${p[2]}`);
            html += `<article class="build-discovery-card"><h4>${p[0]}</h4><p>${p[1]}</p><div class="build-discovery-actions"><a href="https://www.youtube.com/results?search_query=${q}" target="_blank" class="tool-link" style="background:var(--color-yt);">📺 YouTube</a></div></article>`;
        });
        html += `</div>`;
        discTarget.innerHTML = html;
    }

    const renderList = (type, targetId) => {
        const ul = document.getElementById(targetId);
        if(!ul) return;
        ul.innerHTML = '';
        const builds = gameData.builds[type] || [];
        if(!builds.length) { ul.innerHTML = '<li><span style="color:var(--text-muted); font-style:italic;">Nessuna build registrata.</span></li>'; return; }
        builds.forEach(b => {
            ul.innerHTML += `<li><div class="dash-list-item-content"><div><span class="build-catalog-title">${b.title}</span> <span class="tag" style="background:${b.tierColor}">${b.tier}</span></div><div class="build-class-info">(${b.class} - ${b.specialization})</div><div class="smart-links-container"><a href="${b.sourceUrl}" target="_blank" class="tool-link" style="background:#555;">🔗 Guida</a></div></div><div class="dash-list-actions"><button type="button" class="quick-save-btn" title="Salva nelle Mie Build" onclick="window.quickSave('${gameId}', '${b.title} (${b.specialization})', '${gameData.patch}', '${b.sourceUrl}')">💾</button></div></li>`;
        });
    };
    renderList('endgame', `top-builds-${gameId}`);
    renderList('leveling', `top-leveling-${gameId}`);
    
    if (gameId === 'd2' && window.renderD2Runewords) window.renderD2Runewords();
    if (gameId === 'poe1' && window.initializePoe1Encyclopedia) window.initializePoe1Encyclopedia();
    window.loadMyBuildsUI();
};

document.getElementById('hub-ranking-btn').onclick = () => {
    const body = document.getElementById('hub-ranking-grid');
    if(!body) {
        const m = buildElement('div', 'modal'); m.id = 'hub-ranking-dialog'; m.style.display = 'flex';
        m.innerHTML = `<div class="modal-content auth-box"><div class="modal-header"><span class="modal-title">Classifica ARPG</span><span class="close-btn" onclick="document.getElementById('hub-ranking-dialog').style.display='none'">×</span></div><div id="hub-ranking-grid" style="padding:20px; overflow-y:auto; color:var(--text-main);"></div></div>`;
        document.body.appendChild(m);
    } else { document.getElementById('hub-ranking-dialog').style.display = 'flex'; }
    
    const target = document.getElementById('hub-ranking-grid');
    target.innerHTML = '';
    if(!hubRankingData?.rankings) { target.innerHTML = '<p>Dati Steam in tempo reale non disponibili.</p>'; return; }
    hubRankingData.rankings.forEach((s, i) => {
        const formatNum = n => n >= 1000 ? (n/1000).toFixed(1) + 'k' : n;
        target.innerHTML += `<div style="display:flex; justify-content:space-between; margin-bottom:10px; border-bottom:1px solid var(--border-color); padding-bottom:5px;"><span>${i+1}. ${s.name}</span> <strong style="color:${s.color};">~${formatNum(s.players)}</strong></div>`;
    });
};

document.getElementById('hub-patch-btn').onclick = () => {
    const body = document.getElementById('hub-patch-grid');
    if(!body) {
        const m = buildElement('div', 'modal'); m.id = 'hub-patch-dialog'; m.style.display = 'flex';
        m.innerHTML = `<div class="modal-content auth-box" style="width:600px;"><div class="modal-header"><span class="modal-title">Registro Patch & Stagioni</span><span class="close-btn" onclick="document.getElementById('hub-patch-dialog').style.display='none'">×</span></div><div id="hub-patch-grid" style="padding:20px; overflow-y:auto; display:grid; grid-template-columns:1fr; gap:15px; color:var(--text-main);"></div></div>`;
        document.body.appendChild(m);
    } else { document.getElementById('hub-patch-dialog').style.display = 'flex'; }
    
    const target = document.getElementById('hub-patch-grid');
    target.innerHTML = '';
    if(!hubPatchRegistry?.games) return;
    Object.entries(HUB_GAMES).forEach(([id, name]) => {
        const p = hubPatchRegistry.games[id];
        target.innerHTML += `<div style="border:1px solid var(--border-color); padding:10px; border-radius:8px; background:var(--bg-card);"><h3 style="margin-top:0; color:var(--accent-primary);">${name}</h3><div class="season-highlight" style="margin-bottom:10px;">${p?.currentPatch || 'N/D'}</div><br><a href="${p?.sourceUrl}" target="_blank" style="color:var(--accent-tertiary); text-decoration:underline;">Consulta Fonte</a></div>`;
    });
};

document.getElementById('hub-search-btn').onclick = () => {
    const p = prompt("Cerca Build nel Database (es. 'Lightning'):");
    if(p && p.trim()) {
        const res = hubSearchEntries.filter(x => x.title.toLowerCase().includes(p.toLowerCase()) || x.meta.toLowerCase().includes(p.toLowerCase()));
        if(res.length) { alert(`Trovati ${res.length} risultati! Ti porto alla prima scheda: ${HUB_GAMES[res[0].gameId]}`); document.querySelector(`.tab-btn[onclick*="'${res[0].gameId}'"]`).click(); }
        else alert("Nessun risultato trovato.");
    }
};

['hub-season-btn', 'hub-compare-btn'].forEach(id => { document.getElementById(id).onclick = () => alert("Funzionalità in fase di restyling!"); });

document.getElementById('hub-share-btn').onclick = () => {
    const url = new URL(window.location.href);
    if (navigator.clipboard?.writeText) { navigator.clipboard.writeText(url.href).then(() => alert('Link copiato!')); }
    else window.prompt('Copia questo link:', url.href);
};

// =========================================================
// 6. ENCICLOPEDIA E RUNEWORDS GLOBALI
// =========================================================
window.initializePoe1Encyclopedia = function() {
    const root = document.getElementById('poe1-encyclopedia');
    if (!root || root.dataset.initialized === 'true') return;
    window.poe1Encyclopedia = {
        openLightbox(imgSrc) { const l = root.querySelector('#poe1-encyclopedia-lightbox'); const i = root.querySelector('#poe1-encyclopedia-lightbox-img'); l.classList.add('active'); i.src = imgSrc; document.body.style.overflow = 'hidden'; },
        closeLightbox(event) { const l = root.querySelector('#poe1-encyclopedia-lightbox'); if (event && event.target !== l) return; l.classList.remove('active'); document.body.style.overflow = 'auto'; },
        filterSelection(event, category) { const cards = root.querySelectorAll('.card'); const buttons = root.querySelectorAll('.filter-btn'); buttons.forEach(b => b.classList.remove('active')); if (event && event.currentTarget) event.currentTarget.classList.add('active'); const match = category === 'all' ? '' : category; cards.forEach(c => { c.style.display = c.className.includes(match) ? 'flex' : 'none'; }); },
        openModal(id) { const m = root.querySelector(`#${id}`); if (!m) return; m.style.display = 'flex'; document.body.style.overflow = 'hidden'; },
        closeModalById(id) { const m = root.querySelector(`#${id}`); if (!m) return; m.style.display = 'none'; document.body.style.overflow = 'auto'; },
        closeModal(event) { if (event.target.classList.contains('modal-overlay')) { event.target.style.display = 'none'; document.body.style.overflow = 'auto'; } }
    };
    root.dataset.initialized = 'true';
    window.poe1Encyclopedia.filterSelection(null, 'all');
};

window.filterItemsStatic = function(sectionId, filterId, dataAttr) {
    const selectedClass = document.getElementById(filterId).value;
    const section = document.getElementById(sectionId);
    if(!section) return;
    const items = section.querySelectorAll(`li[${dataAttr}]`);
    items.forEach(item => {
        const itemClasses = item.getAttribute(dataAttr).split(',');
        item.style.display = (selectedClass === 'all' || itemClasses.includes('all') || itemClasses.includes(selectedClass)) ? '' : 'none';
    });
};

const RUNE_IMG_BASE_URL = "https://d2runewizard.com/assets/runes/";
const RUNE_IMG_EXT = ".webp";
const runewordsData = [
    { name: "Stealth", type: "armatura", emoji: "👕", level: 17, sockets: 2, runes: ["Tal", "Eth"], base: "Armatura Torso", desc: "Velocità di movimento e lancio.", stats: ["+25% Velocità di Lancio", "+25% Velocità di Movimento", "+25% Recupero dai Colpi", "Rigenerazione Mana +15%"] },
    { name: "Spirit", type: "arma", emoji: "🗡️", level: 25, sockets: 4, runes: ["Tal", "Thul", "Ort", "Amn"], base: "Spade (es. Crystal Sword)", desc: "Il miglior oggetto per Incantatori.", stats: ["+2 a Tutte le Abilità", "+25-35% Velocità di Lancio", "+55% Recupero dai Colpi", "+22 Vitalità"] },
    { name: "Insight", type: "arma", emoji: "🔱", level: 27, sockets: 4, runes: ["Ral", "Tir", "Tal", "Sol"], base: "Armi Inastate / Archi", desc: "Risolve i problemi di Mana.", stats: ["Aura di Meditazione liv. 12-17 attiva", "+200-260% Danno", "+35% Velocità di Lancio"] },
    { name: "Lore", type: "elmo", emoji: "🪖", level: 27, sockets: 2, runes: ["Ort", "Sol"], base: "Elmo a 2 incavi", desc: "Fornisce +1 Alle abilità.", stats: ["+1 a Tutte le Abilità", "+30% Resistenza al Fulmine", "+2 al Mana per uccisione"] },
    { name: "Ancient's Pledge", type: "scudo", emoji: "🛡️", level: 21, sockets: 3, runes: ["Ral", "Ort", "Tal"], base: "Kite Shield, Large Shield", desc: "Fixa le resistenze.", stats: ["+48% Res Freddo", "+48% Res Fuoco", "+48% Res Fulmine", "+48% Res Veleno"] },
    { name: "Enigma", type: "armatura", emoji: "👕", level: 65, sockets: 3, runes: ["Jah", "Ith", "Ber"], base: "Mage Plate, Archon Plate", desc: "L'armatura endgame definitiva.", stats: ["+1 a Teletrasporto", "+2 a Tutte le Abilità", "+ (0.75 per Livello) Forza"] }
];

window.renderD2Runewords = function() {
    const selectedType = document.getElementById('type-filter-d2') ? document.getElementById('type-filter-d2').value : 'all';
    const container = document.getElementById('runewords-container');
    if(!container) return;
    container.innerHTML = ''; 
    let typesToRender = selectedType === 'all' ? [...new Set(runewordsData.map(rw => rw.type))] : [selectedType];
    
    typesToRender.forEach(type => {
        const items = runewordsData.filter(rw => rw.type === type);
        if (items.length === 0) return;
        const h2 = document.createElement('h2'); h2.className = 'guide-title category-title'; h2.textContent = type === 'armatura' ? '👕 Armature' : type === 'arma' ? '⚔️ Armi' : type === 'scudo' ? '🛡️ Scudi' : '🪖 Elmi';
        container.appendChild(h2);
        
        const ul = document.createElement('ul'); ul.className = 'guide-list';
        
        items.forEach(item => {
            const li = document.createElement('li'); li.className = 'runeword-card';
            const statsHtml = item.stats.map(stat => `<div class="stat-line">${stat}</div>`).join('');
            let runeImagesHtml = '<div class="rune-images-container">';
            item.runes.forEach(rune => { let imgUrl = `${RUNE_IMG_BASE_URL}${rune.trim().toLowerCase()}${RUNE_IMG_EXT}`; runeImagesHtml += `<div class="rune-block"><img src="${imgUrl}" alt="${rune}" width="28"><span>${rune}</span></div>`; });
            runeImagesHtml += '</div>';

            li.innerHTML = `
                <div class="item-image-container">${item.emoji}</div>
                <div class="item-details">
                    <span class="unique-item">${item.name}</span>
                    <div class="badges"><span class="level-req">📈 Liv. Req: ${item.level}</span><span class="item-sockets">🕳️ ${item.sockets} Incavi</span><span class="item-runes">🪨 ${item.runes.join(' + ')}</span></div>
                    ${runeImagesHtml}
                    <span class="desc">${item.desc}</span>
                    <span class="class-rec">🎯 Base Ideale: ${item.base}</span>
                </div>
                <div class="item-stats"><strong>Bonus e Statistiche</strong>${statsHtml}</div>
            `;
            ul.appendChild(li);
        });
        container.appendChild(ul);
    });
};

document.addEventListener("DOMContentLoaded", async () => {
    window.loadMyBuildsUI();
    const firstTab = document.querySelector('.tab-btn');
    if(firstTab) firstTab.click();
});