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
} catch(e) {
    console.warn("Firebase offline.", e);
}

let currentUser = null;
let userBuilds = { poe1: [], poe2: [], d2: [], le: [], d4: [] }; 
window.editingIndex = { poe1: null, poe2: null, d2: null, le: null, d4: null };

window.openAuthModal = () => document.getElementById('auth-modal').style.display = 'flex';
window.closeAuthModal = () => document.getElementById('auth-modal').style.display = 'none';

window.loginWithGoogle = async () => {
    if(!auth) return alert("Firebase non configurato.");
    try { await signInWithPopup(auth, new GoogleAuthProvider()); } catch(e) { console.error(e); }
};

window.registerWithEmail = async () => {
    if(!auth) return alert("Firebase non configurato.");
    try {
        await createUserWithEmailAndPassword(auth, document.getElementById('auth-email').value, document.getElementById('auth-password').value);
        window.closeAuthModal();
    } catch(e) { alert(e.message); }
};

window.loginWithEmail = async () => {
    if(!auth) return alert("Firebase non configurato.");
    try {
        await signInWithEmailAndPassword(auth, document.getElementById('auth-email').value, document.getElementById('auth-password').value);
        window.closeAuthModal();
    } catch(e) { alert(e.message); }
};

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
    if (currentUser && db) {
        try { await setDoc(doc(db, "users", currentUser.uid), { builds: userBuilds }, { merge: true }); } catch(e) {}
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
        if (!userBuilds[game] || userBuilds[game].length === 0) {
            ul.innerHTML = '<li><span style="color: var(--text-muted); font-style:italic;">Nessuna build salvata.</span></li>';
            return;
        }
        userBuilds[game].forEach((build, index) => {
            ul.innerHTML += `<li><div class="dash-list-item-content"><a href="${build.link}" class="saved-link" target="_blank">${build.name}</a><span class="build-version">v. ${build.version || 'N/A'}</span><span class="build-note">- ${build.note || ''}</span></div><div class="dash-list-actions"><button class="edit-btn" onclick="window.editBuild('${game}', ${index})">✏️</button><button class="delete-btn" onclick="window.deleteBuild('${game}', ${index})">❌</button></div></li>`;
        });
    });
};

window.filterSavedBuilds = function(game) {
    let filter = document.getElementById(`filter-saved-${game}`)?.value.toLowerCase();
    let li = document.getElementById(`my-builds-${game}`)?.getElementsByTagName("li");
    if(!li || !filter) return;
    for (let i=0; i<li.length; i++) {
        if(!li[i].innerText.includes("Nessuna build")) {
            li[i].style.display = (li[i].innerText.toLowerCase().indexOf(filter) > -1) ? "" : "none";
        }
    }
};

window.editBuild = function(game, index) {
    const build = userBuilds[game][index];
    document.getElementById(`name-${game}`).value = build.name;
    document.getElementById(`link-${game}`).value = build.link;
    document.getElementById(`version-${game}`).value = build.version;
    document.getElementById(`note-${game}`).value = build.note;
    window.editingIndex[game] = index;
    document.getElementById(`submit-btn-${game}`).textContent = "Aggiorna";
    document.getElementById(`cancel-btn-${game}`).style.display = "inline-block";
};

window.cancelEdit = function(game) {
    window.editingIndex[game] = null;
    document.getElementById(`form-${game}`).reset();
    document.getElementById(`submit-btn-${game}`).textContent = "Salva";
    document.getElementById(`cancel-btn-${game}`).style.display = "none";
};

window.saveBuild = async function(event, game) {
    event.preventDefault();
    const b = {
        name: document.getElementById(`name-${game}`).value,
        link: document.getElementById(`link-${game}`).value,
        version: document.getElementById(`version-${game}`).value,
        note: document.getElementById(`note-${game}`).value
    };
    if (!userBuilds[game]) userBuilds[game] = [];
    if (window.editingIndex[game] !== null) userBuilds[game][window.editingIndex[game]] = b;
    else userBuilds[game].push(b);
    await syncToFirebase();
    window.cancelEdit(game);
};

window.deleteBuild = async function(game, index) {
    if(!confirm("Eliminare la build?")) return;
    userBuilds[game].splice(index, 1);
    await syncToFirebase();
};

window.quickSave = async function(game, name, version, link) {
    if(!userBuilds[game]) userBuilds[game] = [];
    userBuilds[game].push({ name, link, version, note: "Salvata dal Catalogo" });
    await syncToFirebase();
    alert("Build salvata nelle tue build personali!");
};

window.setTheme = function(themeName) {
    document.documentElement.setAttribute('data-theme', themeName);
    localStorage.setItem('arpgTheme', themeName);
};

window.setTheme(localStorage.getItem('arpgTheme') || 'dark');

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

window.openOverlay = function(url, title) {
    document.getElementById('modal-iframe').src = url;
    document.getElementById('modal-title').innerText = title;
    document.getElementById('iframe-modal').style.display = 'flex';
};

window.closeOverlay = function() {
    document.getElementById('modal-iframe').src = '';
    document.getElementById('iframe-modal').style.display = 'none';
};

window.closeEssentialPanel = function(panelId, triggerId) {
    document.getElementById(panelId).hidden = true;
};

window.toggleAppearancePanel = function() {
    const p = document.getElementById('appearance-panel');
    p.hidden = !p.hidden;
};

// NAVIGAZIONE SCHEDE E CARICAMENTO DINAMICO HTML
window.openMainTab = async function(evt, gameId, accentColor) {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active-btn');
        btn.style.borderBottomColor = "transparent";
        btn.style.color = "var(--text-main)";
    });
    
    if(evt && evt.currentTarget) {
        evt.currentTarget.classList.add('active-btn');
        if (accentColor) {
            evt.currentTarget.style.borderBottomColor = accentColor;
            evt.currentTarget.style.color = accentColor;
        }
    }

    const container = document.getElementById('game-content-container');
    container.innerHTML = `<div style="text-align:center; padding: 50px; color: var(--text-muted);">Caricamento dati...</div>`;

    try {
        const res = await fetch(`pages/${gameId}.html`);
        if (!res.ok) throw new Error(`Impossibile trovare pages/${gameId}.html`);
        container.innerHTML = await res.text();
        document.body.dataset.activeGame = gameId;

        await window.initializeTabContent(gameId);

        const firstSubBtn = container.querySelector(`.sub-tab-btn`);
        if(firstSubBtn) firstSubBtn.click();
    } catch (error) {
        container.innerHTML = `<div style="text-align:center; padding: 50px; color: var(--danger); font-weight:bold;">Errore di caricamento per ${gameId}. Verifica che il file pages/${gameId}.html esista su GitHub.</div>`;
    }
};

window.openSubTab = function(evt, subTabId, gamePrefix) {
    document.querySelectorAll(`.${gamePrefix}-sub-content`).forEach(el => {
        el.style.display = "none";
        el.classList.remove('active-sub-content');
    });
    document.querySelectorAll(`.${gamePrefix}-sub-btn`).forEach(btn => btn.classList.remove('active-sub'));
    
    if(evt && evt.currentTarget) evt.currentTarget.classList.add('active-sub');
    
    const target = document.getElementById(subTabId);
    if(target) {
        target.style.display = "block";
        target.classList.add('active-sub-content');
    }

    if (subTabId === 'poe1-encyclopedia' && window.initializePoe1Encyclopedia) {
        window.initializePoe1Encyclopedia();
    }
};

window.multiSearch = function(event, inputId, selectId) {
    event.preventDefault();
    let input = document.getElementById(inputId).value;
    let site = document.getElementById(selectId).value;
    if(input.trim() !== "") {
        if (site === 'all') {
            let allSites = Array.from(document.getElementById(selectId).options).map(opt => opt.value).filter(val => val !== 'all').map(val => `site:${val}`).join(' OR ');
            window.open(`https://www.google.com/search?q=${encodeURIComponent(input)}+(${allSites})`, '_blank');
        } else {
            window.open(`https://www.google.com/search?q=site:${site}+${encodeURIComponent(input)}`, '_blank');
        }
    }
};

// JSON E DATA RENDERING
const HUB_GAMES = { poe1: 'Path of Exile 1', poe2: 'Path of Exile 2', le: 'Last Epoch', d2: 'Diablo II: Resurrected', d4: 'Diablo 4' };
let hubBuildCatalog = null, hubPatchRegistry = null, hubRankingData = null, hubSearchEntries = [];

async function loadAllJSON() {
    try {
        const [cat, pat, rank] = await Promise.allSettled([
            fetch('assets/builds.json', {cache:'no-store'}).then(r => r.ok?r.json():Promise.reject()),
            fetch('assets/patches.json', {cache:'no-store'}).then(r => r.ok?r.json():Promise.reject()),
            fetch('assets/rankings.json', {cache:'no-store'}).then(r => r.ok?r.json():Promise.reject())
        ]);
        hubBuildCatalog = cat.status === 'fulfilled' ? cat.value : null;
        hubPatchRegistry = pat.status === 'fulfilled' ? pat.value : null;
        hubRankingData = rank.status === 'fulfilled' ? rank.value : null;
    } catch (e) {}
}

window.initializeTabContent = async function(gameId) {
    if (!hubBuildCatalog) await loadAllJSON();
    const gameData = hubBuildCatalog?.games[gameId];
    if (!gameData) return;

    const metaTarget = document.getElementById(`build-meta-${gameId}`);
    if(metaTarget) {
        metaTarget.innerHTML = `<div class="build-meta-heading"><span class="build-meta-eyebrow">Aggiornamento meta</span><strong class="build-meta-title">${HUB_GAMES[gameId]}</strong><span class="build-meta-status">Verificato</span></div>
        <div class="build-meta-details"><div class="build-meta-detail"><span class="build-meta-label">Patch / Stagione</span><strong class="build-meta-value">${gameData.patch}</strong></div></div>`;
    }

    const discTarget = document.getElementById(`build-discovery-${gameId}`);
    if(discTarget && gameData.discovery) {
        let html = `<div class="build-discovery-heading"><span class="build-discovery-eyebrow">Community discovery</span><strong class="build-discovery-title">Build da esplorare</strong></div><div class="build-discovery-sources">`;
        gameData.discovery.sources.forEach(s => html += `<a href="${s[1]}" target="_blank" class="tool-link" style="background:#555;">↗ ${s[0]}</a>`);
        html += `</div><div class="build-discovery-grid">`;
        gameData.discovery.prompts.forEach(p => {
            let q = encodeURIComponent(`${HUB_GAMES[gameId]} ${gameData.patch.split('(')[0]} ${p[2]}`);
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
            ul.innerHTML += `<li>
                <div class="dash-list-item-content">
                    <div><span class="build-catalog-title">${b.title}</span> <span class="tag" style="background:${b.tierColor}">${b.tier}</span></div>
                    <div class="build-class-info">(${b.class} - ${b.specialization})</div>
                    <div class="smart-links-container"><a href="${b.sourceUrl}" target="_blank" class="tool-link" style="background:#555;">🔗 Guida</a></div>
                </div>
                <div class="dash-list-actions"><button type="button" class="quick-save-btn" onclick="window.quickSave('${gameId}', '${b.title} (${b.specialization})', '${gameData.patch}', '${b.sourceUrl}')">💾</button></div>
            </li>`;
        });
    };
    renderList('endgame', `top-builds-${gameId}`);
    renderList('leveling', `top-leveling-${gameId}`);

    if (gameId === 'd2' && window.renderD2Runewords) window.renderD2Runewords();
    window.loadMyBuildsUI();
};

window.initializePoe1Encyclopedia = function() {
    const root = document.getElementById('poe1-encyclopedia');
    if (!root) return;

    window.poe1Encyclopedia = {
        openLightbox(imgSrc) {
            const lightbox = root.querySelector('#poe1-encyclopedia-lightbox');
            const image = root.querySelector('#poe1-encyclopedia-lightbox-img');
            if(lightbox && image) {
                lightbox.classList.add('active'); 
                image.src = imgSrc; 
                document.body.style.overflow = 'hidden';
            }
        },
        closeLightbox(event) {
            const lightbox = root.querySelector('#poe1-encyclopedia-lightbox');
            if (lightbox && (!event || event.target === lightbox)) {
                lightbox.classList.remove('active'); 
                document.body.style.overflow = 'auto';
            }
        },
        filterSelection(event, category) {
            const cards = root.querySelectorAll('.card');
            const buttons = root.querySelectorAll('.filter-btn');
            buttons.forEach(button => button.classList.remove('active'));
            if (event && event.currentTarget) event.currentTarget.classList.add('active');
            const classToMatch = category === 'all' ? '' : category;
            cards.forEach(card => { card.style.display = card.className.includes(classToMatch) ? 'flex' : 'none'; });
        },
        openModal(id) {
            const modal = root.querySelector(`#${id}`);
            if (modal) { modal.style.display = 'flex'; document.body.style.overflow = 'hidden'; }
        },
        closeModalById(id) {
            const modal = root.querySelector(`#${id}`);
            if (modal) { modal.style.display = 'none'; document.body.style.overflow = 'auto'; }
        },
        closeModal(event) {
            if (event && event.target.classList.contains('modal-overlay')) { 
                event.target.style.display = 'none'; 
                document.body.style.overflow = 'auto'; 
            }
        }
    };
    window.poe1Encyclopedia.filterSelection(null, 'all');
};

// BOTTONI TOOLBELT
document.getElementById('hub-ranking-btn').onclick = () => {
    let m = document.getElementById('hub-ranking-dialog');
    if(!m) {
        m = document.createElement('div'); m.className = 'modal'; m.id = 'hub-ranking-dialog';
        m.innerHTML = `<div class="modal-content auth-box"><div class="modal-header"><span class="modal-title">Classifica ARPG</span><span class="close-btn" onclick="document.getElementById('hub-ranking-dialog').style.display='none'">×</span></div><div id="hub-ranking-grid" style="padding:20px; overflow-y:auto;"></div></div>`;
        document.body.appendChild(m);
    }
    m.style.display = 'flex';
    const target = document.getElementById('hub-ranking-grid');
    target.innerHTML = '';
    if(!hubRankingData?.rankings) { target.innerHTML = '<p>Dati non disponibili.</p>'; return; }
    hubRankingData.rankings.forEach((s, i) => {
        const formatNum = n => n >= 1000 ? (n/1000).toFixed(1) + 'k' : n;
        target.innerHTML += `<div style="display:flex; justify-content:space-between; margin-bottom:10px; border-bottom:1px solid var(--border-color); padding-bottom:5px;"><span>${i+1}. ${s.name}</span> <strong style="color:${s.color};">~${formatNum(s.players)}</strong></div>`;
    });
};

document.getElementById('hub-patch-btn').onclick = () => {
    let m = document.getElementById('hub-patch-dialog');
    if(!m) {
        m = document.createElement('div'); m.className = 'modal'; m.id = 'hub-patch-dialog';
        m.innerHTML = `<div class="modal-content auth-box" style="width:600px;"><div class="modal-header"><span class="modal-title">Registro Patch & Stagioni</span><span class="close-btn" onclick="document.getElementById('hub-patch-dialog').style.display='none'">×</span></div><div id="hub-patch-grid" style="padding:20px; overflow-y:auto; display:grid; grid-template-columns:1fr; gap:15px;"></div></div>`;
        document.body.appendChild(m);
    }
    m.style.display = 'flex';
    const target = document.getElementById('hub-patch-grid');
    target.innerHTML = '';
    if(!hubPatchRegistry?.games) return;
    Object.entries(HUB_GAMES).forEach(([id, name]) => {
        const p = hubPatchRegistry.games[id];
        target.innerHTML += `<div style="border:1px solid var(--border-color); padding:10px; border-radius:8px; background:var(--bg-card);"><h3>${name}</h3><div class="season-highlight" style="margin-bottom:10px;">${p?.currentPatch || 'N/D'}</div><br><a href="${p?.sourceUrl}" target="_blank" style="color:var(--accent-primary);">Consulta Fonte</a></div>`;
    });
};

document.getElementById('hub-share-btn').onclick = () => {
    if (navigator.clipboard?.writeText) { navigator.clipboard.writeText(window.location.href).then(() => alert('Link copiato!')); }
    else window.prompt('Copia questo link:', window.location.href);
};

document.addEventListener("DOMContentLoaded", async () => {
    await loadAllJSON();
    const firstTab = document.querySelector('.tab-btn');
    if(firstTab) firstTab.click();
});