import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// =========================================================
// 1. FIREBASE SETUP
// =========================================================
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
} catch(e) { console.warn("Firebase non configurato."); }

let currentUser = null;
let userBuilds = { poe1: [], poe2: [], d2: [], le: [], d4: [] }; 
window.editingIndex = { poe1: null, poe2: null, d2: null, le: null, d4: null };

window.openAuthModal = () => document.getElementById('auth-modal').style.display = 'flex';
window.closeAuthModal = () => document.getElementById('auth-modal').style.display = 'none';
window.loginWithGoogle = async () => { if(auth) { try { await signInWithPopup(auth, new GoogleAuthProvider()); } catch(e) {} } };
window.registerWithEmail = async () => { if(auth) { try { await createUserWithEmailAndPassword(auth, document.getElementById('auth-email').value, document.getElementById('auth-password').value); window.closeAuthModal(); } catch(e) { alert("Errore: " + e.message); } } };
window.loginWithEmail = async () => { if(auth) { try { await signInWithEmailAndPassword(auth, document.getElementById('auth-email').value, document.getElementById('auth-password').value); window.closeAuthModal(); } catch(e) { alert("Errore: " + e.message); } } };
window.logoutFirebase = async () => { if(auth) await signOut(auth); };

if(auth) {
    onAuthStateChanged(auth, async (user) => {
        const authBtn = document.getElementById('auth-btn');
        if (user) {
            currentUser = user;
            authBtn.innerHTML = `👤 Esci (${user.displayName || user.email})`;
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
        if (docSnap.exists()) userBuilds = docSnap.data().builds || { poe1: [], poe2: [], d2: [], le: [], d4: [] };
        else await setDoc(doc(db, "users", currentUser.uid), { builds: userBuilds });
        window.loadMyBuildsUI();
    } catch(e) {}
}

async function syncToFirebase() {
    if (currentUser && db) await setDoc(doc(db, "users", currentUser.uid), { builds: userBuilds }, { merge: true });
    else localStorage.setItem('arpgBuildHub', JSON.stringify(userBuilds));
    window.loadMyBuildsUI();
}

// =========================================================
// 2. FUNZIONI BUILD PERSONALI
// =========================================================
window.loadMyBuildsUI = function() {
    ['poe1', 'poe2', 'd2', 'le', 'd4'].forEach(game => {
        const ul = document.getElementById(`my-builds-${game}`);
        if(!ul) return;
        ul.innerHTML = '';
        if (!userBuilds[game] || userBuilds[game].length === 0) {
            ul.innerHTML = '<li><span style="color: var(--text-muted); font-style:italic; font-size:0.9em;">Nessuna build salvata.</span></li>';
            return;
        }
        userBuilds[game].forEach((build, index) => {
            ul.innerHTML += `<li><div class="dash-list-item-content"><a href="${build.link}" class="saved-link" target="_blank">${build.name}</a><span class="build-version">v. ${build.version || 'N/A'}</span><span class="build-note">- ${build.note || 'Nessuna nota'}</span></div><div class="dash-list-actions"><button class="edit-btn" onclick="window.editBuild('${game}', ${index})">✏️</button><button class="delete-btn" onclick="window.deleteBuild('${game}', ${index})">❌</button></div></li>`;
        });
    });
};

window.filterSavedBuilds = function(game) {
    let filter = document.getElementById(`filter-saved-${game}`).value.toLowerCase();
    let li = document.getElementById(`my-builds-${game}`).getElementsByTagName("li");
    for (let i = 0; i < li.length; i++) {
        if (li[i].innerText.includes("Nessuna build salvata")) continue; 
        li[i].style.display = (li[i].innerText.toLowerCase().indexOf(filter) > -1) ? "" : "none";
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
};

window.cancelEdit = function(game) {
    window.editingIndex[game] = null;
    document.getElementById(`form-${game}`).reset();
    let btn = document.getElementById(`submit-btn-${game}`);
    btn.textContent = "Salva";
    if(game === 'le') btn.style.background = "var(--accent-le)";
    else if(game === 'd2') btn.style.background = "var(--danger)";
    else if(game === 'd4') btn.style.background = "#c0392b";
    else btn.style.background = "var(--accent-secondary)";
    document.getElementById(`cancel-btn-${game}`).style.display = "none";
};

window.saveBuild = async function(event, game) {
    event.preventDefault();
    const name = document.getElementById(`name-${game}`).value;
    const link = document.getElementById(`link-${game}`).value;
    const version = document.getElementById(`version-${game}`).value;
    const note = document.getElementById(`note-${game}`).value || "Senza note";

    if (!userBuilds[game]) userBuilds[game] = [];
    if (window.editingIndex[game] !== null) userBuilds[game][window.editingIndex[game]] = { name, link, version, note };
    else userBuilds[game].push({ name, link, version, note });
    
    await syncToFirebase();
    window.cancelEdit(game);
    const filterInput = document.getElementById(`filter-saved-${game}`);
    if(filterInput) { filterInput.value = ""; window.filterSavedBuilds(game); }
};

window.deleteBuild = async function(game, index) {
    if(!confirm("Eliminare questa build?")) return;
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

// =========================================================
// 3. UI, THEME, OVERLAYS & SEARCH
// =========================================================
window.setTheme = function(theme) { document.documentElement.setAttribute('data-theme', theme); localStorage.setItem('arpgTheme', theme); };
window.setTheme(localStorage.getItem('arpgTheme') || 'dark');

let currentFontSize = parseInt(localStorage.getItem('arpgFontSize')) || 16;
window.setFontSize = function(size) { currentFontSize = size; document.documentElement.style.setProperty('--base-font-size', currentFontSize + 'px'); localStorage.setItem('arpgFontSize', currentFontSize); };
window.changeFontSize = function(step) { let ns = currentFontSize + (step * 2); if(ns >= 12 && ns <= 24) window.setFontSize(ns); };
window.setFontSize(currentFontSize);

window.openOverlay = function(url, title = "Overlay") { document.getElementById('modal-title').innerText = title; document.getElementById('modal-iframe').src = url; document.getElementById('iframe-modal').style.display = 'flex'; };
window.closeOverlay = function() { document.getElementById('iframe-modal').style.display = 'none'; document.getElementById('modal-iframe').src = ''; };

function setEssentialPanel(panelId, triggerId, open) {
    const p = document.getElementById(panelId); const t = document.getElementById(triggerId);
    if (!p || !t) return; p.hidden = !open; t.setAttribute('aria-expanded', String(open));
}
window.toggleAppearancePanel = function() { const p = document.getElementById('appearance-panel'); if(p) setEssentialPanel('appearance-panel', 'appearance-toggle', p.hidden); };
window.closeEssentialPanel = function(pId, tId) { setEssentialPanel(pId, tId, false); };
document.addEventListener('click', e => { const shell = document.querySelector('.essential-header-shell'); if (shell && !shell.contains(e.target)) setEssentialPanel('appearance-panel', 'appearance-toggle', false); });

window.multiSearch = function(event, inputId, selectId) {
    event.preventDefault();
    const input = document.getElementById(inputId).value.trim();
    const site = document.getElementById(selectId).value;
    if(input !== "") {
        if (site === 'all') {
            const allSites = Array.from(document.getElementById(selectId).options).map(o => o.value).filter(v => v !== 'all').map(v => `site:${v}`).join(' OR ');
            window.open(`https://www.google.com/search?q=${encodeURIComponent(input)}+(${allSites})`, '_blank');
        } else window.open(`https://www.google.com/search?q=site:${site}+${encodeURIComponent(input)}`, '_blank');
    }
};

// =========================================================
// 4. NAVIGAZIONE DINAMICA E CARICAMENTO PAGINE (RIPRISTINATO)
// =========================================================
const initializedTabs = new Set();
const tabBuildTargets = { poe1: [['endgame', 'top-builds-poe1'], ['leveling', 'top-leveling-poe1']], poe2: [['endgame', 'top-builds-poe2'], ['leveling', 'top-leveling-poe2']], le: [['endgame', 'top-builds-le'], ['leveling', 'top-leveling-le']], d2: [['endgame', 'top-builds-d2'], ['leveling', 'top-leveling-d2']], d4: [['endgame', 'top-builds-d4'], ['leveling', 'top-leveling-d4']] };

window.initializeTabContent = function(gameId) {
    if (initializedTabs.has(gameId)) return;
    if (tabBuildTargets[gameId]) tabBuildTargets[gameId].forEach(([lType, elId]) => { window.fetchAndDisplayBuilds(gameId, lType, elId); });
    window.initializeBuildDiscovery(gameId);
    if (gameId === 'd2' && window.renderD2Runewords) window.renderD2Runewords();
    if (gameId === 'poe1' && window.initializePoe1Encyclopedia) window.initializePoe1Encyclopedia();
    initializedTabs.add(gameId);
};

// LA FUNZIONE CORRETTA CON FETCH
window.openMainTab = async function(evt, gameId, accentColor) {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active-btn');
        btn.style.borderBottomColor = "transparent";
        btn.style.color = "var(--text-main)";
    });
    evt.currentTarget.classList.add('active-btn');
    if (accentColor) {
        evt.currentTarget.style.borderBottomColor = accentColor;
        evt.currentTarget.style.color = accentColor;
    }

    const container = document.getElementById('game-content-container');
    if(!container) return;
    container.innerHTML = `<div style="text-align:center; padding: 50px; color: var(--text-muted);">Caricamento dati in corso...</div>`;

    try {
        const response = await fetch(`pages/${gameId}.html`);
        if (!response.ok) throw new Error("Pagina non trovata");
        container.innerHTML = await response.text();

        // Eliminiamo dal set per forzare l'inizializzazione del JS del nuovo HTML inserito
        initializedTabs.delete(gameId);
        
        if (window.initializeTabContent) window.initializeTabContent(gameId);
        if (window.hubSetGameIdentity) window.hubSetGameIdentity(gameId);
        
        const firstSubBtn = container.querySelector(`.${gameId}-sub-btn`);
        if(firstSubBtn) firstSubBtn.click();
    } catch (error) {
        container.innerHTML = `<div style="text-align:center; padding: 50px; color: var(--danger);">Errore nel caricamento della sezione. Impossibile trovare pages/${gameId}.html</div>`;
    }
};

window.openSubTab = function(evt, subTabId, gamePrefix) {
    document.querySelectorAll(`.${gamePrefix}-sub-content`).forEach(el => { el.style.display = "none"; el.classList.remove('active-sub-content'); });
    document.querySelectorAll(`.${gamePrefix}-sub-btn`).forEach(btn => btn.classList.remove('active-sub'));
    evt.currentTarget.classList.add('active-sub');
    const target = document.getElementById(subTabId);
    if(target) { target.style.display = "block"; target.classList.add('active-sub-content'); }
    if (subTabId === 'poe1-encyclopedia' && window.initializePoe1Encyclopedia) window.initializePoe1Encyclopedia();
};

window.filterItemsStatic = function(sectionId, filterId, dataAttr) {
    const selectedClass = document.getElementById(filterId).value;
    const section = document.getElementById(sectionId);
    if(!section) return;
    section.querySelectorAll(`li[${dataAttr}]`).forEach(item => {
        const itemClasses = item.getAttribute(dataAttr).split(',');
        item.style.display = (selectedClass === 'all' || itemClasses.includes('all') || itemClasses.includes(selectedClass)) ? '' : 'none';
    });
    section.querySelectorAll('.category-title').forEach(cat => {
        const ul = cat.nextElementSibling;
        if (ul && ul.tagName === 'UL') {
            const hasVisible = Array.from(ul.querySelectorAll('li')).some(li => li.style.display !== 'none');
            cat.style.display = hasVisible ? 'block' : 'none';
            ul.style.display = hasVisible ? 'block' : 'none';
        }
    });
};

// =========================================================
// 5. SMART LINKS (CATALOGO BUILDS JSON)
// =========================================================
const BUILD_CATALOG_URL = 'assets/builds.json';
const buildCatalogState = { data: null, promise: null };
const buildGameTitles = { poe1: 'Path of Exile 1', poe2: 'Path of Exile 2', le: 'Last Epoch', d2: 'Diablo II: Resurrected', d4: 'Diablo 4' };

function buildText(val, fallback = '') { return typeof val === 'string' && val.trim() ? val.trim() : fallback; }
function buildSafeUrl(val) { try { const url = new URL(buildText(val)); return /^https?:$/.test(url.protocol) ? url.href : ''; } catch (e) { return ''; } }
function buildElement(tag, className, text) { const el = document.createElement(tag); if (className) el.className = className; if (text !== undefined) el.textContent = text; return el; }
function buildExternalLink(label, url, className = '') { const safeUrl = buildSafeUrl(url); if (!safeUrl) return null; const link = buildElement('a', className, label); link.href = safeUrl; link.target = '_blank'; return link; }

async function loadBuildCatalog() {
    if (buildCatalogState.data) return buildCatalogState.data;
    if (!buildCatalogState.promise) {
        buildCatalogState.promise = fetch(BUILD_CATALOG_URL, { cache: 'no-store' }).then(r => { if(!r.ok) throw new Error(); return r.json(); }).then(data => { buildCatalogState.data = data; return data; }).catch(e => { buildCatalogState.promise = null; throw e; });
    }
    return buildCatalogState.promise;
}

function renderBuildMeta(gameId, gameData, errorMessage = '') {
    const target = document.getElementById(`build-meta-${gameId}`);
    if (!target) return;
    target.replaceChildren();
    if (errorMessage) {
        target.classList.add('is-unavailable');
        const heading = buildElement('div', 'build-meta-heading');
        heading.append(buildElement('span', 'build-meta-eyebrow', 'Stato meta'));
        heading.append(buildElement('strong', 'build-meta-title', buildGameTitles[gameId]));
        target.append(heading, buildElement('p', 'build-meta-unavailable', errorMessage));
        return;
    }
    target.classList.remove('is-unavailable');
    const heading = buildElement('div', 'build-meta-heading');
    heading.append(buildElement('span', 'build-meta-eyebrow', 'Stato Stagione & Meta'));
    heading.append(buildElement('strong', 'build-meta-title', buildText(gameData.patch, buildGameTitles[gameId])));
    heading.append(buildElement('span', 'build-meta-status is-current', 'Aggiornato'));

    const details = buildElement('div', 'build-meta-details');
    const rev = buildElement('div', 'build-meta-detail');
    rev.append(buildElement('span', 'build-meta-label', 'Sincronizzazione API'));
    rev.append(buildElement('strong', 'build-meta-value', 'Attiva (aRPG Timeline)'));
    details.append(rev);

    const sources = buildElement('div', 'build-meta-detail build-meta-sources');
    sources.append(buildElement('span', 'build-meta-label', 'Fonti Database'));
    const sourceLinks = buildElement('span', 'build-meta-source-links');
    const sourcesList = Array.isArray(gameData.sources) ? gameData.sources : [];
    sourcesList.forEach(src => {
        const link = buildExternalLink(buildText(src && src.label, 'Fonte'), src && src.url, 'build-meta-source-link');
        if (link) sourceLinks.append(link);
    });
    sources.append(sourceLinks);
    details.append(sources);
    target.append(heading, details);
}

function renderBuildList(ul, gameId, listType, gameData) {
    ul.replaceChildren();
    const builds = gameData && gameData.builds && Array.isArray(gameData.builds[listType]) ? gameData.builds[listType] : [];
    if (!builds.length) { ul.append(buildElement('li', 'build-catalog-empty', 'Nessuna build caricata.')); return; }

    builds.forEach(build => {
        const title = buildText(build && build.title, 'Build senza titolo');
        const className = buildText(build && build.class, 'Classe');
        const specialization = buildText(build && build.specialization, 'Specializzazione');
        const tier = buildText(build && build.tier, 'Tier');
        const directUrl = buildSafeUrl(build && build.sourceUrl);
        
        const li = buildElement('li');
        const content = buildElement('div', 'dash-list-item-content');
        const titleLine = buildElement('div');
        titleLine.append(buildElement('span', 'build-catalog-title', title));
        const tierEl = buildElement('span', 'tag build-catalog-tier', tier);
        tierEl.style.background = /^#[0-9a-f]{3,8}$/i.test(build.tierColor) ? build.tierColor : 'var(--accent-primary)';
        titleLine.append(tierEl);
        content.append(titleLine);
        content.append(buildElement('div', 'build-class-info', `(${className} – ${specialization})`));

        const links = buildElement('div', 'smart-links-container');
        const guideLink = buildExternalLink('🔗 Guida', directUrl, 'tool-link build-catalog-guide');
        if (guideLink) links.append(guideLink);
        const searchQuery = encodeURIComponent(`${buildGameTitles[gameId] || ''} ${title} build`);
        const youtube = buildExternalLink('📺 YouTube', `https://www.youtube.com/results?search_query=${searchQuery}`, 'tool-link build-catalog-youtube');
        if (youtube) links.append(youtube);
        content.append(links);

        const actions = buildElement('div', 'dash-list-actions');
        if (directUrl) {
            const save = buildElement('button', 'quick-save-btn', '💾');
            save.type = 'button';
            save.setAttribute('aria-label', `Salva ${title}`);
            save.addEventListener('click', () => { window.quickSave(gameId, `${title} (${specialization})`, buildText(gameData.patch, 'N/D'), directUrl); });
            actions.append(save);
        }
        li.append(content, actions);
        ul.append(li);
    });
}

window.fetchAndDisplayBuilds = async function(gameId, listType, elementId) {
    const ul = document.getElementById(elementId);
    if (!ul) return;
    try {
        const catalog = await loadBuildCatalog();
        const gameData = catalog.games[gameId];
        if (!gameData) throw new Error('Dati mancanti');
        renderBuildMeta(gameId, gameData);
        renderBuildList(ul, gameId, listType, gameData);
        document.querySelectorAll(`.season-highlight`).forEach(el => { if(el.closest(`#${gameId}-dash`)) el.textContent = gameData.patch || "Stagione Corrente"; });
    } catch (error) {
        renderBuildMeta(gameId, null, 'Catalogo build temporaneamente non disponibile.');
        ul.replaceChildren(buildElement('li', 'build-catalog-empty', 'Errore caricamento.'));
    }
};

function renderBuildDiscovery(gameId, gameData) {
    const target = document.getElementById(`build-discovery-${gameId}`);
    const config = gameData && gameData.discovery ? gameData.discovery : null;
    if (!target || !config) return;
    target.replaceChildren();

    const heading = buildElement('div', 'build-discovery-heading');
    heading.append(buildElement('span', 'build-discovery-eyebrow', 'Community discovery'));
    heading.append(buildElement('strong', 'build-discovery-title', 'Siti suggeriti e Ricerca'));
    heading.append(buildElement('span', 'build-discovery-badge', 'Consigliati'));
    target.append(heading);
    target.append(buildElement('p', 'build-discovery-notice', 'Esplora le build partendo da queste risorse affidabili per la community.'));

    const sources = buildElement('div', 'build-discovery-sources');
    (config.sources || []).forEach(([label, url]) => {
        const link = buildExternalLink(`↗ ${label}`, url, 'build-discovery-source');
        if (link) sources.append(link);
    });
    target.append(sources);

    const grid = buildElement('div', 'build-discovery-grid');
    (config.prompts || []).forEach(([title, description, suffix]) => {
        const query = `${buildGameTitles[gameId] || ''} ${suffix}`;
        const encoded = encodeURIComponent(query);
        const card = buildElement('article', 'build-discovery-card');
        card.append(buildElement('h4', '', title));
        card.append(buildElement('p', '', description));
        const actions = buildElement('div', 'build-discovery-actions');
        const youtube = buildExternalLink('📺 YouTube', `https://www.youtube.com/results?search_query=${encoded}`, 'tool-link build-discovery-youtube');
        const google = buildExternalLink('🔍 Cerca', `https://www.google.com/search?q=${encoded}`, 'tool-link build-discovery-search');
        if (youtube) actions.append(youtube);
        if (google) actions.append(google);
        card.append(actions);
        grid.append(card);
    });
    target.append(grid);
}

window.initializeBuildDiscovery = async function(gameId) {
    try {
        const catalog = await loadBuildCatalog();
        renderBuildDiscovery(gameId, catalog.games[gameId]);
    } catch (error) {}
};

// =========================================================
// 6. ENCICLOPEDIA E RUNEWORDS D2
// =========================================================
window.initializePoe1Encyclopedia = function() {
    const root = document.getElementById('poe1-encyclopedia');
    if (!root || root.dataset.initialized === 'true') return;
    const api = {
        openLightbox(imgSrc) { const l = root.querySelector('#poe1-encyclopedia-lightbox'); const img = root.querySelector('#poe1-encyclopedia-lightbox-img'); l.classList.add('active'); img.src = imgSrc; document.body.style.overflow = 'hidden'; },
        closeLightbox(evt) { const l = root.querySelector('#poe1-encyclopedia-lightbox'); if (evt && evt.target !== l) return; l.classList.remove('active'); document.body.style.overflow = 'auto'; },
        filterSelection(evt, category) { root.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active')); if (evt) evt.currentTarget.classList.add('active'); const classToMatch = category === 'all' ? '' : category; root.querySelectorAll('.card').forEach(card => { card.style.display = card.className.includes(classToMatch) ? 'flex' : 'none'; }); },
        openModal(id) { const modal = root.querySelector(`#${id}`); if (modal) { modal.style.display = 'flex'; document.body.style.overflow = 'hidden'; } },
        closeModalById(id) { const modal = root.querySelector(`#${id}`); if (modal) { modal.style.display = 'none'; document.body.style.overflow = 'auto'; } },
        closeModal(evt) { if (evt.target.classList.contains('modal-overlay')) { evt.target.style.display = 'none'; document.body.style.overflow = 'auto'; } }
    };
    window.poe1Encyclopedia = api;
    document.addEventListener('keydown', e => { if (e.key === 'Escape') { root.querySelector('#poe1-encyclopedia-lightbox')?.classList.remove('active'); root.querySelectorAll('.modal-overlay').forEach(m => m.style.display = 'none'); document.body.style.overflow = 'auto'; } });
    root.dataset.initialized = 'true';
    api.filterSelection(null, 'all');
};

const runewordsData = [
    { name: "Stealth", type: "armatura", emoji: "👕", level: 17, sockets: 2, runes: ["Tal", "Eth"], base: "Qualsiasi Armatura Torso", desc: "Eccellente per il leveling.", stats: ["+25% Velocità di Lancio (FCR)", "+25% Velocità di Movimento"] },
    { name: "Enigma", type: "armatura", emoji: "👕", level: 65, sockets: 3, runes: ["Jah", "Ith", "Ber"], base: "Mage Plate, Dusk Shroud", desc: "Abilità Teletrasporto per tutti.", stats: ["+1 a Teletrasporto", "+2 a Tutte le Abilità"] },
    { name: "Spirit (Arma)", type: "arma", emoji: "🗡️", level: 25, sockets: 4, runes: ["Tal", "Thul", "Ort", "Amn"], base: "Spade (es. Crystal Sword)", desc: "Miglior qualità/prezzo per Caster.", stats: ["+2 a Tutte le Abilità", "+25-35% Velocità di Lancio"] },
    { name: "Insight", type: "arma", emoji: "🔱", level: 27, sockets: 4, runes: ["Ral", "Tir", "Tal", "Sol"], base: "Armi Inastate / Archi", desc: "Equipaggiata dal Mercenario risolve il mana.", stats: ["Aura di Meditazione attiva", "+200-260% Danno Aumentato"] },
    { name: "Spirit (Scudo)", type: "scudo", emoji: "🛡️", level: 25, sockets: 4, runes: ["Tal", "Thul", "Ort", "Amn"], base: "Monarch", desc: "La versione Scudo di Spirit.", stats: ["+2 a Tutte le Abilità", "+25-35% Velocità di Lancio"] },
    { name: "Lore", type: "elmo", emoji: "🪖", level: 27, sockets: 2, runes: ["Ort", "Sol"], base: "Elmo a 2 incavi", desc: "L'elmo standard per finire la difficoltà Normale.", stats: ["+1 a Tutte le Abilità", "+30% Resistenza al Fulmine"] }
];
window.renderD2Runewords = function() {
    const selType = document.getElementById('type-filter-d2')?.value || 'all';
    const c = document.getElementById('runewords-container');
    if(!c) return;
    c.innerHTML = ''; 
    const types = selType === 'all' ? [...new Set(runewordsData.map(r => r.type))] : [selType];
    types.forEach(t => {
        const items = runewordsData.filter(r => r.type === t);
        if (items.length === 0) return;
        const h2 = document.createElement('h2'); h2.className = 'guide-title category-title';
        h2.textContent = t === 'armatura' ? '👕 Armature' : t === 'arma' ? '⚔️ Armi' : t === 'scudo' ? '🛡️ Scudi' : '🪖 Elmi';
        c.appendChild(h2);
        const ul = document.createElement('ul'); ul.className = 'guide-list';
        items.forEach(item => {
            const li = document.createElement('li'); li.className = 'runeword-card';
            const sHtml = item.stats.map(s => `<div class="stat-line">${s}</div>`).join('');
            let rHtml = '<div class="rune-images-container">';
            item.runes.forEach(r => rHtml += `<div class="rune-block"><img src="https://d2runewizard.com/assets/runes/${r.toLowerCase()}.webp" width="28" height="28" alt="${r}"><span>${r}</span></div>`);
            rHtml += '</div>';
            li.innerHTML = `<div class="item-image-container">${item.emoji}</div><div class="item-details"><span class="unique-item">${item.name}</span><div class="badges"><span class="level-req">📈 Liv. Req: ${item.level}</span><span class="item-sockets">🕳️ ${item.sockets} Incavi</span></div>${rHtml}<span class="desc">${item.desc}</span></div><div class="item-stats"><strong>Bonus</strong>${sHtml}</div>`;
            ul.appendChild(li);
        });
        c.appendChild(ul);
    });
};

// =========================================================
// 7. HUB EVOLUTO E TOOLBELT
// =========================================================
const HUB_GAMES = { poe1: 'Path of Exile 1', poe2: 'Path of Exile 2', le: 'Last Epoch', d2: 'Diablo II: Resurrected', d4: 'Diablo 4' };
let hubBuildCatalog = null; let hubPatchRegistry = null; let hubRankingData = null; let hubSearchEntries = []; let hubToastTimer = null;

function hubElement(tag, options = {}, children = []) {
    const el = document.createElement(tag);
    Object.entries(options).forEach(([k, v]) => { if (k === 'className') el.className = v; else if (k === 'text') el.textContent = v; else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2).toLowerCase(), v); else if (v !== undefined && v !== null) el.setAttribute(k, String(v)); });
    children.flat().filter(Boolean).forEach(c => el.appendChild(typeof c === 'string' ? document.createTextNode(c) : c));
    return el;
}
function hubToast(msg) { const t = document.getElementById('hub-toast'); if (!t) return; t.textContent = msg; t.hidden = false; clearTimeout(hubToastTimer); hubToastTimer = setTimeout(() => { t.hidden = true; }, 3200); }
function hubSetGameIdentity(gameId) { if (!HUB_GAMES[gameId]) return; document.body.dataset.activeGame = gameId; const tb = document.querySelector('.hub-toolbelt'); if (tb) tb.setAttribute('data-game', gameId); }
window.hubSetGameIdentity = hubSetGameIdentity;
function hubCurrentGame() { return document.body.dataset.activeGame || 'poe1'; }
function hubCurrentSection(gId = hubCurrentGame()) { const a = document.querySelector(`#${gId} .${gId}-sub-content.active-sub-content`); return a ? a.id : `${gId}-dash`; }

async function hubLoadData() {
    const [cRes, pRes, rRes] = await Promise.allSettled([ fetch('assets/builds.json').then(r=>r.ok?r.json():Promise.reject()), fetch('assets/patches.json').then(r=>r.ok?r.json():Promise.reject()), fetch('assets/rankings.json').then(r=>r.ok?r.json():Promise.reject()) ]);
    hubBuildCatalog = cRes.status === 'fulfilled' ? cRes.value : null; hubPatchRegistry = pRes.status === 'fulfilled' ? pRes.value : null; hubRankingData = rRes.status === 'fulfilled' ? rRes.value : null;
    const entries = [];
    document.querySelectorAll('.sub-tab-btn').forEach(btn => {
        const m = (btn.getAttribute('onclick')||'').match(/openSubTab\(event,\s*'([^']+)',\s*'([^']+)'\)/);
        if (m && HUB_GAMES[m[2]]) entries.push({ id: `sec-${m[1]}`, kind: 'Sezione', title: btn.textContent.trim(), gameId: m[2], targetId: m[1], meta: HUB_GAMES[m[2]] });
    });
    if (hubBuildCatalog?.games) {
        Object.entries(hubBuildCatalog.games).forEach(([gId, game]) => {
            Object.entries(game.builds || {}).forEach(([cat, builds]) => { (builds || []).forEach(b => entries.push({ ...b, id: b.title, kind: 'Build', gameId: gId, targetId: `${gId}-dash`, category: cat, meta: `${HUB_GAMES[gId]} · ${b.class}` })); });
        });
    }
    hubSearchEntries = entries;
}

function hubCreateDialog(id, kicker, title, subtitle) {
    const backdrop = hubElement('div', { id, className: 'hub-dialog-backdrop', hidden: 'hidden' });
    const dialog = hubElement('section', { className: 'hub-dialog' });
    const heading = hubElement('div', { className: 'hub-dialog-header' }, [ hubElement('div', {}, [hubElement('span', { className: 'hub-dialog-kicker', text: kicker }), hubElement('h2', { text: title }), hubElement('p', { className: 'hub-dialog-subtitle', text: subtitle })]), hubElement('button', { className: 'hub-dialog-close', type: 'button', text: '×', onclick: () => { backdrop.hidden = true; } }) ]);
    const body = hubElement('div', { className: 'hub-dialog-body' });
    dialog.append(heading, body); backdrop.appendChild(dialog);
    backdrop.addEventListener('click', e => { if (e.target === backdrop) backdrop.hidden = true; });
    document.body.appendChild(backdrop); return body;
}

function hubOpenDialog(id) { const b = document.getElementById(id); if (b) b.hidden = false; }
function hubCloseDialog(id) { const b = document.getElementById(id); if (b) b.hidden = true; }

function hubRenderSearchResults(query) {
    const target = document.getElementById('hub-search-results');
    const norm = String(query || '').trim().toLowerCase();
    const sel = norm ? hubSearchEntries.filter(e => `${e.title} ${e.meta} ${e.kind}`.toLowerCase().includes(norm)) : hubSearchEntries.slice(0, 16);
    target.replaceChildren();
    if (!sel.length) { target.appendChild(hubElement('p', { className: 'hub-empty', text: 'Nessun risultato.' })); return; }
    sel.slice(0, 36).forEach(e => {
        const btn = hubElement('button', { className: 'hub-search-result-main', type: 'button', onclick: () => { hubCloseDialog('hub-search-dialog'); document.querySelector(`.tab-btn[onclick*="'${e.gameId}'"]`)?.click(); setTimeout(() => document.querySelector(`.${e.gameId}-sub-btn[onclick*="'${e.targetId}'"]`)?.click(), 100); } }, [ hubElement('span', { className: 'hub-search-result-title', text: e.title }), hubElement('span', { className: 'hub-search-result-meta', text: `${e.kind} · ${e.meta}` }) ]);
        target.appendChild(hubElement('article', { className: 'hub-search-result' }, [btn]));
    });
}

function hubRenderPatchRegistry() {
    const t = document.getElementById('hub-patch-grid'); if (!t) return; t.replaceChildren();
    const games = hubPatchRegistry?.games || {};
    Object.entries(HUB_GAMES).forEach(([gId, name]) => {
        const p = games[gId];
        const card = hubElement('article', { className: 'hub-patch-card' }, [hubElement('h3', { text: name }), hubElement('span', { className: 'hub-patch-patch', text: p?.currentPatch || 'Non disponibile' })]);
        const list = hubElement('ul'); (p?.changes || []).forEach(c => list.appendChild(hubElement('li', { text: c }))); card.appendChild(list);
        if (p?.sourceUrl) card.appendChild(hubElement('a', { href: p.sourceUrl, target: '_blank', text: 'Visita Timeline' }));
        t.appendChild(card);
    });
}

function hubRenderRanking() {
    const t = document.getElementById('hub-ranking-grid'); if (!t) return; t.replaceChildren();
    if (!hubRankingData || !hubRankingData.rankings) { t.appendChild(hubElement('p', { className: 'hub-empty', text: 'Dati classifica non disponibili.' })); return; }
    const list = hubElement('div', { className: 'arpg-stats', style: 'max-width:100%; box-shadow:none; border:none; padding:0;' });
    hubRankingData.rankings.forEach((s, i) => {
        const formatNum = n => n >= 1000 ? (n/1000).toFixed(1) + 'k' : n;
        const row = hubElement('div', { style: 'display:flex; justify-content:space-between; margin-bottom:8px; border-bottom:1px dotted rgba(255,255,255,0.1); padding-bottom:6px;' });
        row.appendChild(hubElement('span', { text: `${i+1}. ${s.name}`, style: 'font-size: 1.1em;' }));
        row.appendChild(hubElement('strong', { style: `color: ${s.color}; font-size: 1.1em;`, text: `~${formatNum(s.players)} Giocatori` }));
        list.appendChild(row);
    });
    t.appendChild(list);
}

function hubWrapNavigation() {
    const oMain = window.openMainTab; const oSub = window.openSubTab;
    if (typeof oMain === 'function' && !oMain.__hubWrapped) {
        window.openMainTab = function(e, gId, color) { oMain.call(this, e, gId, color); hubSetGameIdentity(gId); }; window.openMainTab.__hubWrapped = true;
    }
    if (typeof oSub === 'function' && !oSub.__hubWrapped) {
        window.openSubTab = function(e, sId, gPref) { oSub.call(this, e, sId, gPref); hubSetGameIdentity(gPref); }; window.openSubTab.__hubWrapped = true;
    }
}

function hubCreateInterface() {
    const sBody = hubCreateDialog('hub-search-dialog', 'Ricerca globale', 'Trova nel Companion Hub', 'Cerca build, guide e sezioni.');
    const sInput = hubElement('input', { id: 'hub-search-input', className: 'hub-search-input', type: 'search', placeholder: 'Cerca build, guida o gioco…' });
    sInput.addEventListener('input', () => hubRenderSearchResults(sInput.value));
    sBody.append(sInput, hubElement('div', { id: 'hub-search-results', className: 'hub-search-results' }));
    
    hubCreateDialog('hub-season-dialog', 'Spazio personale', 'La mia stagione', 'Le preferenze sono salvate sul dispositivo.');
    hubCreateDialog('hub-compare-dialog', 'Confronto', 'Confronta due build', 'Scegli dal catalogo per il confronto.');
    
    const pBody = hubCreateDialog('hub-patch-dialog', 'Aggiornamenti Meta', 'Registro Stagioni', 'Gestito tramite aRPG Timeline.');
    pBody.appendChild(hubElement('div', { id: 'hub-patch-grid', className: 'hub-patch-grid' }));

    const rBody = hubCreateDialog('hub-ranking-dialog', 'Trend in tempo reale', 'Classifica ARPG', 'Giocatori su Steam (Top 15 aggiornata automaticamente).');
    rBody.appendChild(hubElement('div', { id: 'hub-ranking-grid', className: 'hub-ranking-grid' }));

    document.body.appendChild(hubElement('div', { id: 'hub-toast', className: 'hub-toast', hidden: 'hidden' }));

    document.getElementById('hub-search-btn')?.addEventListener('click', () => hubOpenDialog('hub-search-dialog'));
    document.getElementById('hub-season-btn')?.addEventListener('click', () => hubOpenDialog('hub-season-dialog'));
    document.getElementById('hub-compare-btn')?.addEventListener('click', () => hubOpenDialog('hub-compare-dialog'));
    document.getElementById('hub-patch-btn')?.addEventListener('click', () => { hubRenderPatchRegistry(); hubOpenDialog('hub-patch-dialog'); });
    document.getElementById('hub-ranking-btn')?.addEventListener('click', () => { hubRenderRanking(); hubOpenDialog('hub-ranking-dialog'); });
    document.getElementById('hub-share-btn')?.addEventListener('click', () => { navigator.clipboard?.writeText(window.location.href); hubToast("Link copiato!"); });
}

document.addEventListener('DOMContentLoaded', () => {
    hubSetGameIdentity('poe1');
    hubWrapNavigation();
    hubCreateInterface();
    hubLoadData().then(() => {
        window.loadMyBuildsUI();
        const fTab = document.querySelector('.tab-btn');
        if(fTab) fTab.click();
    });
});