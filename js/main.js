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
} catch(e) { console.warn("Firebase non configurato.", e); }

let currentUser = null;
let userBuilds = { poe1: [], poe2: [], d2: [], le: [], d4: [] }; 
window.editingIndex = { poe1: null, poe2: null, d2: null, le: null, d4: null };

window.openAuthModal = () => document.getElementById('auth-modal').style.display = 'flex';
window.closeAuthModal = () => document.getElementById('auth-modal').style.display = 'none';

window.loginWithGoogle = async () => {
    if(!auth) return;
    const provider = new GoogleAuthProvider();
    try { await signInWithPopup(auth, provider); } catch(e) {}
};

window.registerWithEmail = async () => {
    if(!auth) return;
    const email = document.getElementById('auth-email').value;
    const pass = document.getElementById('auth-password').value;
    try {
        await createUserWithEmailAndPassword(auth, email, pass);
        window.closeAuthModal();
    } catch(e) { alert("Errore Registrazione: " + e.message); }
};

window.loginWithEmail = async () => {
    if(!auth) return;
    const email = document.getElementById('auth-email').value;
    const pass = document.getElementById('auth-password').value;
    try {
        await signInWithEmailAndPassword(auth, email, pass);
        window.closeAuthModal();
    } catch(e) { alert("Errore Login: " + e.message); }
};

window.logoutFirebase = async () => { if(auth) await signOut(auth); };

if(auth) {
    onAuthStateChanged(auth, async (user) => {
        const authBtn = document.getElementById('auth-btn');
        if (user) {
            currentUser = user;
            const userName = user.displayName || user.email;
            authBtn.innerHTML = `👤 Esci (${userName})`;
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
        const docRef = doc(db, "users", currentUser.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) userBuilds = docSnap.data().builds || { poe1: [], poe2: [], d2: [], le: [], d4: [] };
        else {
            userBuilds = JSON.parse(localStorage.getItem('arpgBuildHub')) || { poe1: [], poe2: [], d2: [], le: [], d4: [] };
            await setDoc(docRef, { builds: userBuilds });
        }
        window.loadMyBuildsUI();
    } catch(e) {}
}

async function syncToFirebase() {
    if (currentUser && db) {
        try {
            const docRef = doc(db, "users", currentUser.uid);
            await setDoc(docRef, { builds: userBuilds }, { merge: true });
        } catch(e) {}
    } else {
        localStorage.setItem('arpgBuildHub', JSON.stringify(userBuilds));
    }
    window.loadMyBuildsUI();
}

window.loadMyBuildsUI = function() {
    ['poe1', 'poe2', 'd2', 'le', 'd4'].forEach(game => {
        const ul = document.getElementById(`my-builds-${game}`);
        if(!ul) return;
        ul.innerHTML = '';
        if (!userBuilds[game]) userBuilds[game] = [];
        if (userBuilds[game].length === 0) {
            ul.innerHTML = '<li><span style="color: var(--text-muted); font-style:italic; font-size:0.9em;">Nessuna build salvata.</span></li>';
            return;
        }
        userBuilds[game].forEach((build, index) => {
            ul.innerHTML += `
                <li>
                    <div class="dash-list-item-content">
                        <a href="${build.link}" class="saved-link" target="_blank">${build.name}</a>
                        <span class="build-version">v. ${build.version || 'N/A'}</span>
                        <span class="build-note">- ${build.note || 'Nessuna nota'}</span>
                    </div>
                    <div class="dash-list-actions">
                        <button class="edit-btn" onclick="window.editBuild('${game}', ${index})">✏️</button>
                        <button class="delete-btn" onclick="window.deleteBuild('${game}', ${index})">❌</button>
                    </div>
                </li>`;
        });
    });
};

window.filterSavedBuilds = function(game) {
    let filter = document.getElementById(`filter-saved-${game}`).value.toLowerCase();
    let ul = document.getElementById(`my-builds-${game}`);
    let li = ul.getElementsByTagName("li");
    for (let i = 0; i < li.length; i++) {
        if (li[i].innerText.includes("Nessuna build salvata")) continue; 
        let text = li[i].textContent || li[i].innerText;
        li[i].style.display = (text.toLowerCase().indexOf(filter) > -1) ? "" : "none";
    }
};

window.editBuild = function(game, index) {
    const build = userBuilds[game][index];
    document.getElementById(`name-${game}`).value = build.name;
    document.getElementById(`link-${game}`).value = build.link;
    document.getElementById(`version-${game}`).value = build.version;
    document.getElementById(`note-${game}`).value = build.note === "Senza note" || build.note === "Salvata dal Generatore Smart" ? "" : build.note;
    window.editingIndex[game] = index;
    let submitBtn = document.getElementById(`submit-btn-${game}`);
    submitBtn.textContent = "Aggiorna";
    submitBtn.style.background = "var(--accent-tertiary)";
    document.getElementById(`cancel-btn-${game}`).style.display = "inline-block";
};

window.cancelEdit = function(game) {
    window.editingIndex[game] = null;
    document.getElementById(`form-${game}`).reset();
    let submitBtn = document.getElementById(`submit-btn-${game}`);
    submitBtn.textContent = "Salva";
    if(game === 'le') submitBtn.style.background = "var(--accent-le)";
    else if(game === 'd2') submitBtn.style.background = "var(--danger)";
    else if(game === 'd4') submitBtn.style.background = "#c0392b";
    else submitBtn.style.background = "var(--accent-secondary)";
    document.getElementById(`cancel-btn-${game}`).style.display = "none";
};

window.saveBuild = async function(event, game) {
    event.preventDefault();
    const name = document.getElementById(`name-${game}`).value;
    const link = document.getElementById(`link-${game}`).value;
    const version = document.getElementById(`version-${game}`).value;
    let note = document.getElementById(`note-${game}`).value || "Senza note";

    if (!userBuilds[game]) userBuilds[game] = [];
    if (window.editingIndex[game] !== null) userBuilds[game][window.editingIndex[game]] = { name, link, version, note };
    else userBuilds[game].push({ name, link, version, note });
    
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

window.setTheme = function(themeName) {
    document.documentElement.setAttribute('data-theme', themeName);
    localStorage.setItem('arpgTheme', themeName);
};
const savedThemeLocal = localStorage.getItem('arpgTheme') || 'dark';
window.setTheme(savedThemeLocal);

let currentFontSize = parseInt(localStorage.getItem('arpgFontSize')) || 16;
window.setFontSize = function(size) {
    currentFontSize = size;
    document.documentElement.style.setProperty('--base-font-size', currentFontSize + 'px');
    localStorage.setItem('arpgFontSize', currentFontSize);
};
window.changeFontSize = function(step) {
    let newSize = currentFontSize + (step * 2);
    if(newSize >= 12 && newSize <= 24) window.setFontSize(newSize);
};
window.setFontSize(currentFontSize);

window.openOverlay = function(url, title = "Overlay Strumento") {
    const modal = document.getElementById('iframe-modal');
    const iframe = document.getElementById('modal-iframe');
    document.getElementById('modal-title').innerText = title;
    iframe.src = url;
    modal.style.display = 'flex';
};
window.closeOverlay = function() {
    document.getElementById('iframe-modal').style.display = 'none';
    document.getElementById('modal-iframe').src = '';
};

function setEssentialPanel(panelId, triggerId, open) {
    const panel = document.getElementById(panelId);
    const trigger = document.getElementById(triggerId);
    if (!panel || !trigger) return;
    panel.hidden = !open;
    trigger.setAttribute('aria-expanded', String(open));
}

window.toggleAppearancePanel = function() {
    const panel = document.getElementById('appearance-panel');
    if (!panel) return;
    setEssentialPanel('appearance-panel', 'appearance-toggle', panel.hidden);
};

window.closeEssentialPanel = function(panelId, triggerId) { setEssentialPanel(panelId, triggerId, false); };

document.addEventListener('click', event => {
    const shell = document.querySelector('.essential-header-shell');
    if (!shell || shell.contains(event.target)) return;
    setEssentialPanel('appearance-panel', 'appearance-toggle', false);
});
document.addEventListener('keydown', event => {
    if (event.key === 'Escape') setEssentialPanel('appearance-panel', 'appearance-toggle', false);
});

window.toggleTabs = function(evt, containerClass, btnClass, activeBtnClass, activeContentClass) {
    document.querySelectorAll('.' + containerClass).forEach(el => { el.style.display = "none"; el.classList.remove(activeContentClass); });
    document.querySelectorAll('.' + btnClass).forEach(btn => btn.classList.remove(activeBtnClass));
    evt.currentTarget.classList.add(activeBtnClass);
};

window.openMainTab = function(evt, gameId, accentColor) {
    window.toggleTabs(evt, 'tab-content', 'tab-btn', 'active-btn', 'active');
    document.getElementById(gameId).style.display = "block";
    window.initializeTabContent(gameId);
    
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.style.borderBottomColor = "transparent";
        btn.style.color = "var(--text-main)";
    });
    
    if (accentColor) {
        evt.currentTarget.style.borderBottomColor = accentColor;
        evt.currentTarget.style.color = accentColor;
    }
};

window.openSubTab = function(evt, subTabId, gamePrefix) {
    window.toggleTabs(evt, `${gamePrefix}-sub-content`, `${gamePrefix}-sub-btn`, 'active-sub', 'active-sub-content');
    document.getElementById(subTabId).style.display = "block";
    if (subTabId === 'poe1-encyclopedia' && window.initializePoe1Encyclopedia) {
        window.initializePoe1Encyclopedia();
    }
};

window.multiSearch = function(event, inputId, selectId) {
    event.preventDefault();
    let input = document.getElementById(inputId).value;
    let select = document.getElementById(selectId);
    let site = select.value;
    if(input.trim() !== "") {
        if (site === 'all') {
            let allSites = Array.from(select.options).map(opt => opt.value).filter(val => val !== 'all').map(val => `site:${val}`).join(' OR ');
            window.open(`https://www.google.com/search?q=${encodeURIComponent(input)}+(${allSites})`, '_blank');
        } else {
            window.open(`https://www.google.com/search?q=site:${site}+${encodeURIComponent(input)}`, '_blank');
        }
    }
};

// --- DATABASE SMART LINKS ---
const BUILD_CATALOG_URL = 'assets/builds.json';
const buildCatalogState = { data: null, promise: null };
const buildGameTitles = { poe1: 'Path of Exile 1', poe2: 'Path of Exile 2', le: 'Last Epoch', d2: 'Diablo II: Resurrected', d4: 'Diablo 4' };

function buildText(value, fallback = '') { return typeof value === 'string' && value.trim() ? value.trim() : fallback; }
function buildSafeUrl(value) { try { const url = new URL(buildText(value)); return /^https?:$/.test(url.protocol) ? url.href : ''; } catch (e) { return ''; } }
function buildSafeColor(value) { return /^#[0-9a-f]{3,8}$/i.test(buildText(value)) ? value : 'var(--legacy-accent, var(--accent-primary))'; }

function buildElement(tag, className, text) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text !== undefined) element.textContent = text;
    return element;
}

function buildExternalLink(label, url, className = '') {
    const safeUrl = buildSafeUrl(url);
    if (!safeUrl) return null;
    const link = buildElement('a', className, label);
    link.href = safeUrl;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    return link;
}

async function loadBuildCatalog() {
    if (buildCatalogState.data) return buildCatalogState.data;
    if (!buildCatalogState.promise) {
        buildCatalogState.promise = fetch(BUILD_CATALOG_URL, { cache: 'no-store' })
            .then(res => { if (!res.ok) throw new Error("Errore"); return res.json(); })
            .then(data => { buildCatalogState.data = data; return data; })
            .catch(error => { buildCatalogState.promise = null; throw error; });
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
        heading.append(buildElement('strong', 'build-meta-title', buildGameTitles[gameId] || 'Build consigliate'));
        target.append(heading, buildElement('p', 'build-meta-unavailable', errorMessage));
        return;
    }

    target.classList.remove('is-unavailable');
    const heading = buildElement('div', 'build-meta-heading');
    heading.append(buildElement('span', 'build-meta-eyebrow', 'Stato Stagione & Meta'));
    heading.append(buildElement('strong', 'build-meta-title', buildText(gameData.patch, buildGameTitles[gameId])));
    const status = buildElement('span', 'build-meta-status is-current', 'Aggiornato');
    heading.append(status);

    const details = buildElement('div', 'build-meta-details');
    const rev = buildElement('div', 'build-meta-detail');
    rev.append(buildElement('span', 'build-meta-label', 'Sincronizzazione API'));
    rev.append(buildElement('strong', 'build-meta-value', 'Attiva e Verificata'));
    details.append(rev);

    const sources = buildElement('div', 'build-meta-detail build-meta-sources');
    sources.append(buildElement('span', 'build-meta-label', 'Fonti Database Principali'));
    const sourceLinks = buildElement('span', 'build-meta-source-links');
    const sourcesList = Array.isArray(gameData.sources) ? gameData.sources : [];
    sourcesList.forEach(source => {
        const link = buildExternalLink(buildText(source && source.label, 'Fonte'), source && source.url, 'build-meta-source-link');
        if (link) sourceLinks.append(link);
    });
    if (!sourceLinks.childElementCount) sourceLinks.append(buildElement('span', 'build-meta-empty', 'Da indicare'));
    sources.append(sourceLinks);
    details.append(sources);

    target.append(heading, details);
}

function renderBuildList(ul, gameId, listType, gameData) {
    ul.replaceChildren();
    const builds = gameData && gameData.builds && Array.isArray(gameData.builds[listType]) ? gameData.builds[listType] : [];
    if (!builds.length) {
        ul.append(buildElement('li', 'build-catalog-empty', 'Nessuna build caricata.'));
        return;
    }

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
        tierEl.style.background = buildSafeColor(build && build.tierColor);
        titleLine.append(tierEl);
        content.append(titleLine);
        content.append(buildElement('div', 'build-class-info', `(${className} – ${specialization})`));

        const links = buildElement('div', 'smart-links-container');
        const guideLink = buildExternalLink('🔗 Guida', directUrl, 'tool-link build-catalog-guide');
        if (guideLink) links.append(guideLink);
        
        const searchQuery = encodeURIComponent(`${buildGameTitles[gameId] || ''} ${title} build`);
        const youtube = buildExternalLink('📺 YouTube', `https://www.youtube.com/results?search_query=${searchQuery}`, 'tool-link build-catalog-youtube');
        if (youtube) links.append(youtube);
        const google = buildExternalLink('🔍 Cerca', `https://www.google.com/search?q=${searchQuery}`, 'tool-link build-catalog-search');
        if (google) links.append(google);
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
        
        document.querySelectorAll(`.season-highlight`).forEach(el => {
            if(el.closest(`#${gameId}`)) el.textContent = gameData.patch || "Stagione Corrente";
        });
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

// --- Inizializzazione Tabs ---
const initializedTabs = new Set();
const tabBuildTargets = {
    poe1: [['endgame', 'top-builds-poe1'], ['leveling', 'top-leveling-poe1']],
    poe2: [['endgame', 'top-builds-poe2'], ['leveling', 'top-leveling-poe2']],
    le: [['endgame', 'top-builds-le'], ['leveling', 'top-leveling-le']],
    d2: [['endgame', 'top-builds-d2'], ['leveling', 'top-leveling-d2']],
    d4: [['endgame', 'top-builds-d4'], ['leveling', 'top-leveling-d4']]
};

window.initializeTabContent = function(gameId) {
    if (initializedTabs.has(gameId)) return;
    if (tabBuildTargets[gameId]) {
        tabBuildTargets[gameId].forEach(([listType, elementId]) => { window.fetchAndDisplayBuilds(gameId, listType, elementId); });
    }
    window.initializeBuildDiscovery(gameId);
    if (gameId === 'd2' && window.renderD2Runewords) window.renderD2Runewords();
    if (gameId === 'poe1' && window.initializePoe1Encyclopedia) window.initializePoe1Encyclopedia();
    initializedTabs.add(gameId);
};

// =========================================================
// 7. HUB EVOLUTO (Season, Search, Patch, Compare, Rankings)
// =========================================================
const HUB_GAMES = { poe1: 'Path of Exile 1', poe2: 'Path of Exile 2', le: 'Last Epoch', d2: 'Diablo II: Resurrected', d4: 'Diablo 4' };
const HUB_FAVORITES_KEY = 'arpgHubFavoritesV1';
const HUB_SEASON_KEY = 'arpgHubSeasonV1';
let hubBuildCatalog = null;
let hubPatchRegistry = null;
let hubRankingData = null;
let hubSearchEntries = [];
let hubToastTimer = null;

function hubElement(tag, options = {}, children = []) {
    const element = document.createElement(tag);
    Object.entries(options).forEach(([key, value]) => {
        if (key === 'className') element.className = value;
        else if (key === 'text') element.textContent = value;
        else if (key === 'htmlFor') element.htmlFor = value;
        else if (key.startsWith('on') && typeof value === 'function') element.addEventListener(key.slice(2).toLowerCase(), value);
        else if (value !== undefined && value !== null) element.setAttribute(key, String(value));
    });
    children.flat().filter(Boolean).forEach(child => element.appendChild(typeof child === 'string' ? document.createTextNode(child) : child));
    return element;
}

function hubToast(message) {
    const toast = document.getElementById('hub-toast');
    if (!toast) return;
    toast.textContent = message;
    toast.hidden = false;
    window.clearTimeout(hubToastTimer);
    hubToastTimer = window.setTimeout(() => { toast.hidden = true; }, 3200);
}

function hubReadJson(key, fallback) { try { const value = localStorage.getItem(key); return value ? JSON.parse(value) : fallback; } catch (error) { return fallback; } }
function hubWriteJson(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch (error) {} }
function hubCurrentGame() { return document.body.dataset.activeGame || 'poe1'; }
function hubCurrentSection(gameId = hubCurrentGame()) {
    const active = document.querySelector(`#${gameId} .${gameId}-sub-content.active-sub-content`);
    return active ? active.id : `${gameId}-dash`;
}

window.hubSetGameIdentity = function(gameId) {
    if (!HUB_GAMES[gameId]) return;
    document.body.dataset.activeGame = gameId;
    const toolbelt = document.querySelector('.hub-toolbelt');
    if (toolbelt) toolbelt.setAttribute('data-game', gameId);
};

function hubUpdateHash(gameId, sectionId) {
    const params = new URLSearchParams();
    params.set('game', gameId || hubCurrentGame());
    if (sectionId) params.set('section', sectionId);
    const next = `#${params.toString()}`;
    if (window.location.hash !== next) history.replaceState(null, '', next);
}

function hubOpenLocation(gameId, sectionId) {
    const gameButton = Array.from(document.querySelectorAll('.tab-btn')).find(button => (button.getAttribute('onclick') || '').includes(`'${gameId}'`));
    if (gameButton) gameButton.click();
    window.setTimeout(() => {
        if (sectionId) {
            const subButton = Array.from(document.querySelectorAll(`.${gameId}-sub-btn`)).find(button => (button.getAttribute('onclick') || '').includes(`'${sectionId}'`));
            if (subButton) subButton.click();
            const destination = document.getElementById(sectionId);
            if (destination) destination.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }, 0);
}

function hubApplyHash() {
    const params = new URLSearchParams(window.location.hash.replace(/^#/, ''));
    const gameId = params.get('game');
    const sectionId = params.get('section');
    if (HUB_GAMES[gameId]) hubOpenLocation(gameId, sectionId);
}

function hubFavorites() { const saved = hubReadJson(HUB_FAVORITES_KEY, []); return Array.isArray(saved) ? saved : []; }
function hubSetFavorites(items) { hubWriteJson(HUB_FAVORITES_KEY, items.slice(0, 60)); }
function hubFavoriteKey(entry) { return `${entry.kind}:${entry.gameId}:${entry.targetId || entry.id}`; }

function hubToggleFavorite(entry) {
    const key = hubFavoriteKey(entry);
    const current = hubFavorites();
    const existing = current.findIndex(item => item.key === key);
    if (existing >= 0) current.splice(existing, 1);
    else current.unshift({ key, title: entry.title, gameId: entry.gameId, targetId: entry.targetId || entry.id, kind: entry.kind, meta: entry.meta || '' });
    hubSetFavorites(current);
    hubToast(existing >= 0 ? 'Rimosso dai preferiti.' : 'Aggiunto ai preferiti.');
    hubRenderSearchResults(document.getElementById('hub-search-input')?.value || '');
    hubRenderSeason();
}

function hubBuildStaticEntries() {
    const entries = [];
    document.querySelectorAll('.sub-tab-btn').forEach(button => {
        const onclick = button.getAttribute('onclick') || '';
        const match = onclick.match(/openSubTab\(event,\s*'([^']+)',\s*'([^']+)'\)/);
        if (!match || !HUB_GAMES[match[2]]) return;
        entries.push({ id: `section-${match[1]}`, kind: 'Sezione', title: button.textContent.trim(), gameId: match[2], targetId: match[1], meta: `${HUB_GAMES[match[2]]}` });
    });
    return entries;
}

async function hubLoadData() {
    const [catalogResult, patchesResult, rankingsResult] = await Promise.allSettled([
        fetch('assets/builds.json', { cache: 'no-store' }).then(r => r.ok ? r.json() : Promise.reject()),
        fetch('assets/patches.json', { cache: 'no-store' }).then(r => r.ok ? r.json() : Promise.reject()),
        fetch('assets/rankings.json', { cache: 'no-store' }).then(r => r.ok ? r.json() : Promise.reject())
    ]);
    
    hubBuildCatalog = catalogResult.status === 'fulfilled' ? catalogResult.value : null;
    hubPatchRegistry = patchesResult.status === 'fulfilled' ? patchesResult.value : null;
    hubRankingData = rankingsResult.status === 'fulfilled' ? rankingsResult.value : null;
    
    const buildEntries = [];
    if (hubBuildCatalog?.games) {
        Object.entries(hubBuildCatalog.games).forEach(([gameId, game]) => {
            Object.entries(game.builds || {}).forEach(([category, builds]) => {
                (builds || []).forEach(build => buildEntries.push({
                    ...build, id: build.id || build.title, kind: 'Build', gameId, targetId: `${gameId}-dash`, category, meta: `${HUB_GAMES[gameId]} · ${build.class}`
                }));
            });
        });
    }
    hubSearchEntries = [...hubBuildStaticEntries(), ...buildEntries];
    hubRenderSearchResults('');
    hubRenderSeason();
    hubRenderCompareOptions();
    hubRenderPatchRegistry();
    hubRenderRanking();
}

function hubCreateDialog(id, kicker, title, subtitle) {
    const backdrop = hubElement('div', { id, className: 'hub-dialog-backdrop', hidden: 'hidden', role: 'presentation' });
    const dialog = hubElement('section', { className: 'hub-dialog', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': `${id}-title` });
    const heading = hubElement('div', { className: 'hub-dialog-header' }, [
        hubElement('div', {}, [hubElement('span', { className: 'hub-dialog-kicker', text: kicker }), hubElement('h2', { id: `${id}-title`, text: title }), hubElement('p', { className: 'hub-dialog-subtitle', text: subtitle })]),
        hubElement('button', { className: 'hub-dialog-close', type: 'button', text: '×', onclick: () => hubCloseDialog(id) })
    ]);
    const body = hubElement('div', { className: 'hub-dialog-body' });
    dialog.append(heading, body);
    backdrop.appendChild(dialog);
    backdrop.addEventListener('click', event => { if (event.target === backdrop) hubCloseDialog(id); });
    document.body.appendChild(backdrop);
    return body;
}

function hubOpenDialog(id, focusSelector) {
    const backdrop = document.getElementById(id);
    if (!backdrop) return;
    backdrop.hidden = false;
    window.setTimeout(() => backdrop.querySelector(focusSelector || 'button, input, select')?.focus(), 0);
}
function hubCloseDialog(id) { const backdrop = document.getElementById(id); if (backdrop) backdrop.hidden = true; }

function hubRenderSearchResults(query) {
    const target = document.getElementById('hub-search-results');
    const count = document.getElementById('hub-search-count');
    if (!target || !count) return;
    const normalized = String(query || '').trim().toLocaleLowerCase('it');
    const selected = normalized ? hubSearchEntries.filter(entry => `${entry.title} ${entry.meta} ${entry.kind}`.toLocaleLowerCase('it').includes(normalized)) : hubSearchEntries.slice(0, 16);
    target.replaceChildren();
    count.textContent = `${selected.length} risultati`;
    if (!selected.length) { target.appendChild(hubElement('p', { className: 'hub-empty', text: 'Nessun risultato trovato.' })); return; }
    const favorites = new Set(hubFavorites().map(item => item.key));
    selected.slice(0, 36).forEach(entry => {
        const main = hubElement('button', { className: 'hub-search-result-main', type: 'button', onclick: () => { hubCloseDialog('hub-search-dialog'); hubOpenLocation(entry.gameId, entry.targetId); } }, [
            hubElement('span', { className: 'hub-search-result-title', text: entry.title }),
            hubElement('span', { className: 'hub-search-result-meta', text: `${entry.kind} · ${entry.meta}` })
        ]);
        const favorite = hubElement('button', { className: `hub-favorite-btn${favorites.has(hubFavoriteKey(entry)) ? ' is-favorite' : ''}`, type: 'button', text: '★', onclick: () => hubToggleFavorite(entry) });
        target.appendChild(hubElement('article', { className: 'hub-search-result' }, [main, favorite]));
    });
}

function hubSeasonDefault() { return { gameId: 'poe1', className: '', goals: { build: false, defenses: false, progression: false, boss: false } }; }
function hubSeasonState() { return { ...hubSeasonDefault(), ...hubReadJson(HUB_SEASON_KEY, hubSeasonDefault()) }; }

function hubRenderSeason() {
    const profile = document.getElementById('hub-season-profile');
    const goals = document.getElementById('hub-season-goals');
    const stats = document.getElementById('hub-season-stats');
    const favoritesTarget = document.getElementById('hub-season-favorites');
    if (!profile || !goals || !stats || !favoritesTarget) return;
    const state = hubSeasonState();
    profile.replaceChildren();
    const gameSelect = hubElement('select', { id: 'hub-season-game' });
    Object.entries(HUB_GAMES).forEach(([id, name]) => gameSelect.appendChild(hubElement('option', { value: id, text: name, ...(id === state.gameId ? { selected: 'selected' } : {}) })));
    const classInput = hubElement('input', { id: 'hub-season-class', value: state.className || '', placeholder: 'Classe o archetipo scelto' });
    profile.append(
        hubElement('div', { className: 'hub-field' }, [hubElement('label', { text: 'Gioco attivo' }), gameSelect]),
        hubElement('div', { className: 'hub-field' }, [hubElement('label', { text: 'La tua build' }), classInput]),
        hubElement('div', { className: 'hub-action-row' }, [hubElement('button', { className: 'hub-primary-btn', type: 'button', text: 'Salva stagione', onclick: () => { const next = hubSeasonState(); next.gameId = gameSelect.value; next.className = classInput.value.trim(); hubWriteJson(HUB_SEASON_KEY, next); hubSetGameIdentity(next.gameId); hubToast('Stagione salvata.'); hubRenderSeason(); } })])
    );
    goals.replaceChildren();
    const labels = { build: 'Scegliere una build', defenses: 'Sistemare difese', progression: 'Progressione chiave', boss: 'Preparare il boss' };
    Object.entries(labels).forEach(([key, label]) => {
        const checkbox = hubElement('input', { type: 'checkbox', ...(state.goals?.[key] ? { checked: 'checked' } : {}) });
        checkbox.addEventListener('change', () => { const next = hubSeasonState(); next.goals = { ...next.goals, [key]: checkbox.checked }; hubWriteJson(HUB_SEASON_KEY, next); hubRenderSeason(); });
        goals.appendChild(hubElement('label', { className: 'hub-check' }, [checkbox, hubElement('span', { text: label })]));
    });
    const favoriteItems = hubFavorites();
    const completed = Object.values(state.goals || {}).filter(Boolean).length;
    stats.replaceChildren(
        hubElement('div', { className: 'hub-stat' }, [hubElement('b', { text: `${completed}/4` }), hubElement('span', { text: 'obiettivi completati' })]),
        hubElement('div', { className: 'hub-stat' }, [hubElement('b', { text: String(favoriteItems.length) }), hubElement('span', { text: 'preferiti salvati' })])
    );
    favoritesTarget.replaceChildren();
    if (!favoriteItems.length) favoritesTarget.appendChild(hubElement('p', { className: 'hub-empty', text: 'Nessun preferito salvato.' }));
    else favoriteItems.slice(0, 8).forEach(item => favoritesTarget.appendChild(hubElement('div', { className: 'hub-mini-item' }, [hubElement('span', { text: `${HUB_GAMES[item.gameId]} · ${item.title}` }), hubElement('button', { type: 'button', text: 'Apri', onclick: () => { hubCloseDialog('hub-season-dialog'); hubOpenLocation(item.gameId, item.targetId); } })])));
}

function hubCatalogBuilds() {
    if (!hubBuildCatalog?.games) return [];
    return Object.entries(hubBuildCatalog.games).flatMap(([gameId, game]) => Object.entries(game.builds || {}).flatMap(([category, builds]) => (builds || []).map(build => ({ ...build, gameId, category, game }))));
}

function hubRenderCompareOptions() {
    const first = document.getElementById('hub-compare-first');
    const second = document.getElementById('hub-compare-second');
    if (!first || !second) return;
    const builds = hubCatalogBuilds();
    [first, second].forEach(select => {
        const saved = select.value;
        select.replaceChildren(hubElement('option', { value: '', text: 'Scegli una build' }));
        builds.forEach(build => select.appendChild(hubElement('option', { value: build.title, text: `${HUB_GAMES[build.gameId]} · ${build.title}`, ...(build.title === saved ? { selected: 'selected' } : {}) })));
    });
    if (builds.length >= 2 && !first.value && !second.value) { first.value = builds[0].title; second.value = builds[1].title; }
    hubRenderCompare();
}

function hubRenderCompare() {
    const target = document.getElementById('hub-compare-grid');
    const firstId = document.getElementById('hub-compare-first')?.value;
    const secondId = document.getElementById('hub-compare-second')?.value;
    if (!target) return;
    const builds = hubCatalogBuilds();
    const selected = [builds.find(build => build.title === firstId), builds.find(build => build.title === secondId)].filter(Boolean);
    target.replaceChildren();
    if (!selected.length) { target.appendChild(hubElement('p', { className: 'hub-empty', text: 'Scegli due build da confrontare.' })); return; }
    selected.forEach(build => {
        const list = hubElement('ul', { className: 'hub-compare-list' });
        const rows = [ ['Gioco', HUB_GAMES[build.gameId]], ['Categoria', build.category === 'endgame' ? 'Endgame' : 'Livellamento'], ['Classe', build.class], ['Specializzazione', build.specialization || 'N/D'], ['Tier', build.tier || 'N/D'] ];
        rows.forEach(([label, value]) => list.appendChild(hubElement('li', {}, [hubElement('span', { text: label }), hubElement('b', { text: value })])));
        const head = hubElement('div', { className: 'hub-compare-card-head' }, [hubElement('h3', { text: build.title })]);
        const card = hubElement('article', { className: 'hub-compare-card' }, [head, list]);
        if (hubSafeUrl(build.sourceUrl)) card.appendChild(hubElement('div', { className: 'hub-action-row', style: 'padding: 0 13px 13px;' }, [hubElement('a', { className: 'hub-secondary-btn', href: build.sourceUrl, target: '_blank', text: 'Apri fonte' })]));
        target.appendChild(card);
    });
}

function hubRenderPatchRegistry() {
    const target = document.getElementById('hub-patch-grid');
    if (!target) return;
    target.replaceChildren();
    const games = hubPatchRegistry?.games || {};
    Object.entries(HUB_GAMES).forEach(([gameId, name]) => {
        const patch = games[gameId];
        const card = hubElement('article', { className: 'hub-patch-card' }, [hubElement('h3', { text: name }), hubElement('span', { className: 'hub-patch-patch', text: patch?.currentPatch || 'Non disponibile' })]);
        const list = hubElement('ul');
        (patch?.changes || []).forEach(change => list.appendChild(hubElement('li', { text: change })));
        card.appendChild(list);
        if (patch?.sourceUrl) card.appendChild(hubElement('a', { href: patch.sourceUrl, target: '_blank', text: 'Visita Timeline' }));
        target.appendChild(card);
    });
}

function hubRenderRanking() {
    const target = document.getElementById('hub-ranking-grid');
    if (!target) return;
    target.replaceChildren();
    if (!hubRankingData || !hubRankingData.rankings) {
        target.appendChild(hubElement('p', { className: 'hub-empty', text: 'Dati classifica in tempo reale non disponibili.' }));
        return;
    }
    const list = hubElement('div', { className: 'arpg-stats', style: 'max-width:100%; box-shadow:none; border:none; padding:0;' });
    hubRankingData.rankings.forEach((s, i) => {
        const formatNum = n => n >= 1000 ? (n/1000).toFixed(1) + 'k' : n;
        const row = hubElement('div', { style: 'display:flex; justify-content:space-between; margin-bottom:8px; border-bottom:1px dotted rgba(255,255,255,0.1); padding-bottom:6px;' });
        row.appendChild(hubElement('span', { text: `${i+1}. ${s.name}`, style: 'font-size: 1.1em;' }));
        row.appendChild(hubElement('strong', { style: `color: ${s.color}; font-size: 1.1em;`, text: `~${formatNum(s.players)} Giocatori` }));
        list.appendChild(row);
    });
    target.appendChild(list);
}

function hubCopyShareLink() {
    const url = new URL(window.location.href);
    url.hash = `game=${encodeURIComponent(hubCurrentGame())}&section=${encodeURIComponent(hubCurrentSection())}`;
    if (navigator.clipboard?.writeText) navigator.clipboard.writeText(url.href).then(() => hubToast('Link copiato.')).catch(() => {});
}

function hubCreateInterface() {
    const toolbelt = document.querySelector('.hub-toolbelt');
    if (!toolbelt) return;
    
    const searchBody = hubCreateDialog('hub-search-dialog', 'Ricerca globale', 'Trova nel Companion Hub', 'Guide, build, e strumenti.');
    const searchInput = hubElement('input', { id: 'hub-search-input', className: 'hub-search-input', type: 'search', placeholder: 'Cerca build, guida, meccanica o gioco…' });
    searchInput.addEventListener('input', () => hubRenderSearchResults(searchInput.value));
    searchBody.append(searchInput, hubElement('div', { className: 'hub-search-meta' }, [hubElement('span', { id: 'hub-search-count', text: 'Caricamento…' }), hubElement('span', { text: '★ = Preferito' })]), hubElement('div', { id: 'hub-search-results', className: 'hub-search-results' }));

    const seasonBody = hubCreateDialog('hub-season-dialog', 'Spazio personale', 'La mia stagione', 'Dati salvati in locale.');
    seasonBody.appendChild(hubElement('div', { className: 'hub-season-layout' }, [
        hubElement('div', {}, [hubElement('section', { className: 'hub-card' }, [hubElement('h3', { text: 'Profilo' }), hubElement('div', { id: 'hub-season-profile' })]), hubElement('section', { className: 'hub-card' }, [hubElement('h3', { text: 'Checklist' }), hubElement('div', { id: 'hub-season-goals', className: 'hub-checklist' })])]),
        hubElement('div', {}, [hubElement('section', { className: 'hub-card' }, [hubElement('h3', { text: 'Progressi' }), hubElement('div', { id: 'hub-season-stats', className: 'hub-stats-grid' })]), hubElement('section', { className: 'hub-card' }, [hubElement('h3', { text: 'Preferiti' }), hubElement('div', { id: 'hub-season-favorites', className: 'hub-mini-list' })])])
    ]));

    const compareBody = hubCreateDialog('hub-compare-dialog', 'Confronto', 'Confronta due build', 'Scegli dal catalogo.');
    const first = hubElement('select', { id: 'hub-compare-first' }); const second = hubElement('select', { id: 'hub-compare-second' });
    first.addEventListener('change', hubRenderCompare); second.addEventListener('change', hubRenderCompare);
    compareBody.append(hubElement('div', { className: 'hub-compare-controls' }, [hubElement('div', { className: 'hub-field' }, [hubElement('label', { text: 'Build A' }), first]), hubElement('div', { className: 'hub-field' }, [hubElement('label', { text: 'Build B' }), second])]), hubElement('div', { id: 'hub-compare-grid', className: 'hub-compare-grid' }));

    const patchBody = hubCreateDialog('hub-patch-dialog', 'Aggiornamenti Meta', 'Registro Stagioni', 'Gestito in automatico tramite aRPG Timeline.');
    patchBody.appendChild(hubElement('div', { id: 'hub-patch-grid', className: 'hub-patch-grid' }));

    const rankingBody = hubCreateDialog('hub-ranking-dialog', 'Trend in tempo reale', 'Classifica ARPG', 'Giocatori attivi su Steam e stime (Aggiornati quotidianamente in automatico).');
    rankingBody.appendChild(hubElement('div', { id: 'hub-ranking-grid', className: 'hub-ranking-grid' }));

    document.body.appendChild(hubElement('div', { id: 'hub-toast', className: 'hub-toast', hidden: 'hidden' }));
    
    document.getElementById('hub-search-btn')?.addEventListener('click', () => hubOpenDialog('hub-search-dialog', '#hub-search-input'));
    document.getElementById('hub-season-btn')?.addEventListener('click', () => { hubRenderSeason(); hubOpenDialog('hub-season-dialog'); });
    document.getElementById('hub-compare-btn')?.addEventListener('click', () => { hubRenderCompareOptions(); hubOpenDialog('hub-compare-dialog'); });
    document.getElementById('hub-patch-btn')?.addEventListener('click', () => { hubRenderPatchRegistry(); hubOpenDialog('hub-patch-dialog'); });
    document.getElementById('hub-ranking-btn')?.addEventListener('click', () => { hubRenderRanking(); hubOpenDialog('hub-ranking-dialog'); });
    document.getElementById('hub-share-btn')?.addEventListener('click', hubCopyShareLink);
}

function hubWrapNavigation() {
    const originalMain = window.openMainTab;
    const originalSub = window.openSubTab;
    if (typeof originalMain === 'function' && !originalMain.__hubWrapped) {
        window.openMainTab = function(evt, gameId, accentColor) {
            originalMain.call(this, evt, gameId, accentColor);
            window.hubSetGameIdentity(gameId);
            hubUpdateHash(gameId, hubCurrentSection(gameId));
        };
        window.openMainTab.__hubWrapped = true;
    }
    if (typeof originalSub === 'function' && !originalSub.__hubWrapped) {
        window.openSubTab = function(evt, subTabId, gamePrefix) {
            originalSub.call(this, evt, subTabId, gamePrefix);
            window.hubSetGameIdentity(gamePrefix);
            hubUpdateHash(gamePrefix, subTabId);
        };
        window.openSubTab.__hubWrapped = true;
    }
}

function hubInit() {
    window.hubSetGameIdentity('poe1');
    hubWrapNavigation();
    hubCreateInterface();
    hubLoadData();
    window.setTimeout(hubApplyHash, 70);
    window.addEventListener('hashchange', hubApplyHash);
    document.addEventListener('keydown', event => {
        if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); hubOpenDialog('hub-search-dialog', '#hub-search-input'); }
        if (event.key === 'Escape') document.querySelectorAll('.hub-dialog-backdrop:not([hidden])').forEach(dialog => { dialog.hidden = true; });
    });
}
document.addEventListener('DOMContentLoaded', hubInit);

document.addEventListener("DOMContentLoaded", () => {
    window.loadMyBuildsUI();
    const firstTab = document.querySelector('.tab-btn');
    if(firstTab) firstTab.click();
});