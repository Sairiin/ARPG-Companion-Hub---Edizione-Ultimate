import { newsData, colorsData, smartLinksDB, runewordsData, RUNE_IMG_BASE_URL, RUNE_IMG_EXT } from './database.js';

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
    console.warn("Firebase non configurato o errore. L'app funzionerà in modalità Solo Locale.", e);
}

let currentUser = null;
let userBuilds = { poe1: [], poe2: [], d2: [], le: [] }; 
window.editingIndex = { poe1: null, poe2: null, d2: null, le: null }; 

window.openAuthModal = () => document.getElementById('auth-modal').style.display = 'flex';
window.closeAuthModal = () => document.getElementById('auth-modal').style.display = 'none';

window.loginWithGoogle = async () => {
    if(!auth) return alert("Firebase non è stato configurato nel codice.");
    const provider = new GoogleAuthProvider();
    try { await signInWithPopup(auth, provider); } catch(e) { console.error("Errore di Login", e); }
};

window.registerWithEmail = async () => {
    if(!auth) return alert("Firebase non configurato.");
    const email = document.getElementById('auth-email').value;
    const pass = document.getElementById('auth-password').value;
    try {
        await createUserWithEmailAndPassword(auth, email, pass);
        window.closeAuthModal();
    } catch(e) { alert("Errore Registrazione: " + e.message); }
};

window.loginWithEmail = async () => {
    if(!auth) return alert("Firebase non configurato.");
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
            const photo = user.photoURL || 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="black"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>';
            authBtn.innerHTML = `<img src="${photo}" style="width:20px; border-radius:50%; background:white;"> Esci (${userName})`;
            authBtn.onclick = window.logoutFirebase;
            window.closeAuthModal();
            await syncFromFirebase();
        } else {
            currentUser = null;
            authBtn.innerHTML = `👤 Accedi al Cloud`;
            authBtn.onclick = window.openAuthModal;
            userBuilds = JSON.parse(localStorage.getItem('arpgBuildHub')) || { poe1: [], poe2: [], d2: [], le: [] };
            window.loadMyBuildsUI();
        }
    });
}

async function syncFromFirebase() {
    if (!currentUser || !db) return;
    try {
        const docRef = doc(db, "users", currentUser.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            userBuilds = docSnap.data().builds || { poe1: [], poe2: [], d2: [], le: [] };
        } else {
            userBuilds = JSON.parse(localStorage.getItem('arpgBuildHub')) || { poe1: [], poe2: [], d2: [], le: [] };
            await setDoc(docRef, { builds: userBuilds });
        }
        window.loadMyBuildsUI();
    } catch(e) { console.error("Errore lettura database:", e); }
}

async function syncToFirebase() {
    if (currentUser && db) {
        try {
            const docRef = doc(db, "users", currentUser.uid);
            await setDoc(docRef, { builds: userBuilds }, { merge: true });
        } catch(e) { console.error("Errore salvataggio database:", e); }
    } else {
        localStorage.setItem('arpgBuildHub', JSON.stringify(userBuilds));
    }
    window.loadMyBuildsUI();
}

window.loadMyBuildsUI = function() {
    ['poe1', 'poe2', 'd2', 'le'].forEach(game => {
        const ul = document.getElementById(`my-builds-${game}`);
        if(!ul) return;
        ul.innerHTML = '';
        if (!userBuilds[game]) userBuilds[game] = [];
        if (userBuilds[game].length === 0) {
            ul.innerHTML = '<li><span style="color: var(--text-muted); font-style:italic; font-size:0.9em;">Nessuna build salvata. Usa il form o la ricerca per aggiungerne una.</span></li>';
            return;
        }
        userBuilds[game].forEach((build, index) => {
            ul.innerHTML += `
                <li>
                    <div class="dash-list-item-content">
                        <a href="${build.link}" class="saved-link" target="_blank" rel="noopener noreferrer" title="Apri Link">${build.name}</a>
                        <span class="build-version">v. ${build.version || 'N/A'}</span>
                        <span class="build-note">- ${build.note || 'Nessuna nota'}</span>
                    </div>
                    <div class="dash-list-actions">
                        <button class="edit-btn" aria-label="Modifica" onclick="window.editBuild('${game}', ${index})">✏️</button>
                        <button class="delete-btn" aria-label="Elimina" onclick="window.deleteBuild('${game}', ${index})">❌</button>
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
    document.getElementById(`name-${game}`).focus();
};

window.cancelEdit = function(game) {
    window.editingIndex[game] = null;
    document.getElementById(`form-${game}`).reset();
    let submitBtn = document.getElementById(`submit-btn-${game}`);
    submitBtn.textContent = "Salva";
    if(game === 'le') submitBtn.style.background = "var(--accent-le)";
    else if(game === 'd2') submitBtn.style.background = "var(--danger)";
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
    if (window.editingIndex[game] !== null) {
        userBuilds[game][window.editingIndex[game]] = { name, link, version, note };
    } else {
        userBuilds[game].push({ name, link, version, note });
    }
    await syncToFirebase();
    window.cancelEdit(game);
    const filterInput = document.getElementById(`filter-saved-${game}`);
    if(filterInput) {
        filterInput.value = "";
        window.filterSavedBuilds(game);
    }
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
    const modal = document.getElementById('iframe-modal');
    const iframe = document.getElementById('modal-iframe');
    iframe.src = '';
    modal.style.display = 'none';
};

window.updateTicker = function(gameId) {
    const tickerEl = document.getElementById('news-ticker-content');
    if(tickerEl && newsData[gameId]) {
        tickerEl.innerHTML = newsData[gameId];
        document.documentElement.style.setProperty('--ticker-color', colorsData[gameId]);
    }
};

window.updateARPGStats = function() {
    const baseStats = { poe1: 41000, d4: 30000, d2r: 15000, d3: 10000, gd: 2500, le: 1500, tq: 800, tl2: 600, chronicon: 300 };
    const formatNumber = num => num >= 1000 ? (num/1000).toFixed(1) + 'k' : num;
    const getVariance = base => Math.floor(base * (1 + (Math.random() * 0.15 - 0.075))); 
    
    let stats = [
        { name: 'Path of Exile', val: getVariance(baseStats.poe1), color: '#4caf50' },
        { name: 'Diablo 4', val: getVariance(baseStats.d4), color: 'var(--danger)' },
        { name: 'Diablo 2: Res', val: getVariance(baseStats.d2r), color: '#607d8b' },
        { name: 'Diablo 3', val: getVariance(baseStats.d3), color: '#607d8b' },
        { name: 'Grim Dawn', val: getVariance(baseStats.gd), color: '#a1887f' },
        { name: 'Last Epoch', val: getVariance(baseStats.le), color: 'var(--accent-le)' },
        { name: 'Titan Quest', val: getVariance(baseStats.tq), color: '#a1887f' },
        { name: 'Torchlight II', val: getVariance(baseStats.tl2), color: '#a1887f' },
        { name: 'Chronicon', val: getVariance(baseStats.chronicon), color: '#a1887f' }
    ];
    stats.sort((a,b) => b.val - a.val); 
    
    let html = `<strong style="color: var(--accent-primary); display: block; margin-bottom: 8px; font-size: 1.1em; border-bottom: 1px dashed var(--border-color); padding-bottom: 4px;">📊 Top 10 ARPG Trend</strong>`;
    stats.forEach((s, i) => { html += `<div><span>${i+1}. ${s.name}</span> <strong style="color: ${s.color};">~${formatNumber(s.val)}</strong></div>`; });
    html += `<div><span>10. PoE 2</span> <strong style="color: #ffaa00;">Beta</strong></div>`;
    
    const statsContainer = document.getElementById('arpg-live-stats');
    if(statsContainer) statsContainer.innerHTML = html;
};

window.toggleTabs = function(evt, containerClass, btnClass, activeBtnClass, activeContentClass) {
    document.querySelectorAll('.' + containerClass).forEach(el => {
        el.style.display = "none";
        el.classList.remove(activeContentClass);
    });
    document.querySelectorAll('.' + btnClass).forEach(btn => btn.classList.remove(activeBtnClass));
    evt.currentTarget.classList.add(activeBtnClass);
};

window.openMainTab = function(evt, gameId, accentColor) {
    window.toggleTabs(evt, 'tab-content', 'tab-btn', 'active-btn', 'active');
    document.getElementById(gameId).style.display = "block";
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.style.borderBottomColor = "transparent";
        btn.style.color = "var(--text-main)";
    });
    if (accentColor) {
        evt.currentTarget.style.borderBottomColor = accentColor;
        evt.currentTarget.style.color = accentColor;
    }
    window.updateTicker(gameId);
};

window.openSubTab = function(evt, subTabId, gamePrefix) {
    window.toggleTabs(evt, `${gamePrefix}-sub-content`, `${gamePrefix}-sub-btn`, 'active-sub', 'active-sub-content');
    document.getElementById(subTabId).style.display = "block";
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

window.fetchAndDisplayBuilds = async function(game, listType, elementId) {
    const ul = document.getElementById(elementId);
    if(!ul) return;
    const data = { version: smartLinksDB[game].version, builds: smartLinksDB[game][listType] };
    ul.innerHTML = '';
    const gameTitle = game === 'poe1' ? 'Path of Exile' : game === 'poe2' ? 'Path of Exile 2' : game === 'le' ? 'Last Epoch' : 'Diablo 2 Resurrected';
    
    data.builds.forEach(b => {
        const baseQuery = encodeURIComponent(`${gameTitle} ${data.version} ${b.name} ${b.ascendancy} build`);
        const ytSearch = `https://www.youtube.com/results?search_query=${baseQuery}`;
        let searchSites = "maxroll OR mobalytics OR icy veins";
        if(game === 'poe1' || game === 'poe2') searchSites += " OR poebuilds";
        if(game === 'le') searchSites += " OR lastepochtools";
        const googleSearch = `https://www.google.com/search?q=${baseQuery}+${searchSites}`;

        ul.innerHTML += `
            <li>
                <div class="dash-list-item-content">
                    <div><span style="font-weight: bold; color: var(--text-main); font-size: 1.1em;">${b.name}</span><span class="tag" style="background:${b.color}; margin-left: 5px;">${b.tier}</span></div>
                    <div class="build-class-info">(${b.className} - ${b.ascendancy})</div>
                    <div class="smart-links-container">
                        <a href="${ytSearch}" class="tool-link" style="background: var(--color-yt);" target="_blank" rel="noopener noreferrer">📺 YouTube</a>
                        <a href="${googleSearch}" class="tool-link" style="background: var(--color-google);" target="_blank" rel="noopener noreferrer">🔍 Google Meta</a>
                        <a href="${b.url}" class="tool-link" style="background: var(--color-site);" target="_blank" rel="noopener noreferrer">🔗 Sito (Root)</a>
                    </div>
                </div>
                <div class="dash-list-actions">
                    <button class="quick-save-btn" aria-label="Salva" onclick="window.quickSave('${game}', '${b.name} (${b.ascendancy})', '${data.version}', '${ytSearch}')">💾</button>
                </div>
            </li>`;
    });
};

window.filterItemsStatic = function(sectionId, filterId, dataAttr) {
    const selectedClass = document.getElementById(filterId).value;
    const section = document.getElementById(sectionId);
    const items = section.querySelectorAll(`li[${dataAttr}]`);
    items.forEach(item => {
        const itemClasses = item.getAttribute(dataAttr).split(',');
        if (selectedClass === 'all' || itemClasses.includes('all') || itemClasses.includes(selectedClass)) { item.style.display = ''; } else { item.style.display = 'none'; }
    });
    const categories = section.querySelectorAll('.category-title');
    categories.forEach(category => {
        const ul = category.nextElementSibling;
        if (ul && ul.tagName === 'UL') {
            const hasVisibleItems = Array.from(ul.querySelectorAll('li')).some(li => li.style.display !== 'none');
            category.style.display = hasVisibleItems ? 'block' : 'none';
            ul.style.display = hasVisibleItems ? 'block' : 'none';
        }
    });
};

window.renderD2Runewords = function() {
    const selectedType = document.getElementById('type-filter-d2').value;
    const container = document.getElementById('runewords-container');
    if(!container) return;
    container.innerHTML = ''; 

    let typesToRender = selectedType === 'all' ? [...new Set(runewordsData.map(rw => rw.type))] : [selectedType];

    typesToRender.forEach(type => {
        const items = runewordsData.filter(rw => rw.type === type);
        if (items.length === 0) return;

        const h2 = document.createElement('h2');
        h2.className = 'guide-title category-title';
        h2.textContent = type === 'armatura' ? '👕 Armature (Body Armor)' : type === 'arma' ? '⚔️ Armi (Weapons)' : type === 'scudo' ? '🛡️ Scudi (Shields)' : '🪖 Elmi (Helms)';
        container.appendChild(h2);

        const ul = document.createElement('ul');
        ul.className = 'guide-list';

        items.forEach(item => {
            const li = document.createElement('li');
            li.className = 'runeword-card';
            const statsHtml = item.stats.map(stat => `<div class="stat-line">${stat}</div>`).join('');
            let runeImagesHtml = '<div class="rune-images-container">';
            item.runes.forEach(rune => {
                let safeRune = rune.trim().toLowerCase();
                let imgUrl = `${RUNE_IMG_BASE_URL}${safeRune}${RUNE_IMG_EXT}`;
                runeImagesHtml += `<div class="rune-block"><img src="${imgUrl}" alt="${rune}"><span>${rune}</span></div>`;
            });
            runeImagesHtml += '</div>';

            li.innerHTML = `
                <div class="item-image-container">${item.emoji}</div>
                <div class="item-details">
                    <span class="unique-item">${item.name}</span>
                    <div class="badges">
                        <span class="level-req">📈 Liv. Req: ${item.level}</span>
                        <span class="item-sockets">🕳️ ${item.sockets} Incavi</span>
                        <span class="item-runes">🪨 ${item.runes.join(' + ')}</span>
                    </div>
                    ${runeImagesHtml}
                    <span class="desc">${item.desc}</span>
                    <span class="class-rec">🎯 Base Ideale: ${item.base}</span>
                </div>
                <div class="item-stats">
                    <strong>Bonus e Statistiche</strong>
                    ${statsHtml}
                </div>
            `;
            ul.appendChild(li);
        });
        container.appendChild(ul);
    });
};

// Funzioni Enciclopedia
window.openLightbox = function(imgSrc) {
    document.getElementById('lightbox').classList.add('active');
    document.getElementById('lightbox-img').src = imgSrc;
    document.body.style.overflow = 'hidden';
};

window.closeLightbox = function(event) {
    if (event && event.target.id !== 'lightbox' && !event.target.classList.contains('lightbox-close')) return;
    document.getElementById('lightbox').classList.remove('active');
    document.body.style.overflow = 'auto';
};

document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        const lb = document.getElementById('lightbox');
        if(lb && lb.classList.contains('active')){
            lb.classList.remove('active');
            document.body.style.overflow = 'auto';
        }
    }
});

window.filterSelection = function(c) {
    var x, i;
    x = document.getElementsByClassName("card");
    var btns = document.getElementsByClassName("filter-btn");
    for (i = 0; i < btns.length; i++) {
        btns[i].classList.remove("active");
    }
    if (event && event.target && event.target.classList.contains('filter-btn')) {
        event.target.classList.add("active");
    }
    if (c == "all") c = "";
    for (i = 0; i < x.length; i++) {
        x[i].style.display = "none";
        if (x[i].className.indexOf(c) > -1) {
            x[i].style.display = "flex";
        }
    }
};

window.openEncModal = function(id) {
    document.getElementById(id).style.display = 'flex';
    document.body.style.overflow = 'hidden'; 
};

window.closeEncModalById = function(id) {
    document.getElementById(id).style.display = 'none';
    document.body.style.overflow = 'auto'; 
};

window.closeEncModal = function(event) {
    if (event.target.classList.contains('modal-overlay')) {
        event.target.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
};

document.addEventListener("DOMContentLoaded", () => {
    window.loadMyBuildsUI();
    window.renderD2Runewords();
    window.updateARPGStats();
    window.updateTicker('poe1'); 
    
    window.fetchAndDisplayBuilds('poe1', 'endgame', 'top-builds-poe1');
    window.fetchAndDisplayBuilds('poe1', 'leveling', 'top-leveling-poe1');
    window.fetchAndDisplayBuilds('poe2', 'endgame', 'top-builds-poe2');
    window.fetchAndDisplayBuilds('poe2', 'leveling', 'top-leveling-poe2');
    window.fetchAndDisplayBuilds('le', 'endgame', 'top-builds-le');
    window.fetchAndDisplayBuilds('le', 'leveling', 'top-leveling-le');
    window.fetchAndDisplayBuilds('d2', 'endgame', 'top-builds-d2');
    window.fetchAndDisplayBuilds('d2', 'leveling', 'top-leveling-d2');
});
