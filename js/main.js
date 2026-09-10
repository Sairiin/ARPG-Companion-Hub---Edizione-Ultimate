// js/main.js

import { auth, db, currentUser, syncFromFirebase, syncToFirebase, getAuthModules, setOnAuthStateChangeCallback } from './firebase.js';
import { buildElement, HUB_GAMES } from './utils.js';
import { userBuilds, editingIndex, loadMyBuildsUI, filterSavedBuilds, editBuild, cancelEdit, saveBuild, deleteBuild, quickSave } from './builds.js';


window.openAuthModal = () => document.getElementById('auth-modal').style.display = 'flex';
window.closeAuthModal = () => document.getElementById('auth-modal').style.display = 'none';

const { signInWithPopup, GoogleAuthProvider, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } = getAuthModules();

window.loginWithGoogle = async () => {
  const provider = new GoogleAuthProvider();
  try { await signInWithPopup(auth, provider); } catch(e) {}
};

window.registerWithEmail = async () => {
  const e = document.getElementById('auth-email').value;
  const p = document.getElementById('auth-password').value;
  try { await createUserWithEmailAndPassword(auth, e, p); window.closeAuthModal(); } catch(e) { alert(e.message); }
};

window.loginWithEmail = async () => {
  const e = document.getElementById('auth-email').value;
  const p = document.getElementById('auth-password').value;
  try { await signInWithEmailAndPassword(auth, e, p); window.closeAuthModal(); } catch(e) { alert(e.message); }
};

window.logoutFirebase = async () => {
  if (auth) await signOut(auth);
};
setOnAuthStateChangeCallback(async (user) => {
  const authBtn = document.getElementById('auth-btn');
  if (user) {
    authBtn.innerHTML = `Esci (${user.displayName || user.email})`;
    authBtn.onclick = window.logoutFirebase;
    window.closeAuthModal();
    await syncFromFirebase(userBuilds);
    window.loadMyBuildsUI();
  } else {
    authBtn.innerHTML = `👤 Accedi al Cloud`;
    authBtn.onclick = window.openAuthModal;
    userBuilds = JSON.parse(localStorage.getItem('arpgBuildHub')) || { poe1: [], poe2: [], d2: [], le: [], d4: [] };
    window.loadMyBuildsUI();
  }
});

// Queste funzioni ora usano quelle esportate da firebase.js
// e passano userBuilds come riferimento.
async function syncFromFirebaseLocal() {
  await syncFromFirebase(userBuilds);
  window.loadMyBuildsUI();
}

async function syncToFirebaseLocal() {
  await syncToFirebase(userBuilds);
  window.loadMyBuildsUI();
}
window.setTheme = function(themeName) { document.documentElement.setAttribute('data-theme', themeName); localStorage.setItem('arpgTheme', themeName); };
window.setTheme(localStorage.getItem('arpgTheme') || 'dark');
let currentFontSize = parseInt(localStorage.getItem('arpgFontSize')) || 16;
window.setFontSize = function(size) { currentFontSize = size; document.documentElement.style.setProperty('--base-font-size', currentFontSize + 'px'); localStorage.setItem('arpgFontSize', currentFontSize); };
window.changeFontSize = function(step) { let newSize = currentFontSize + (step * 2); if(newSize >= 12 && newSize <= 24) window.setFontSize(newSize); };
window.setFontSize(currentFontSize);

window.openOverlay = function(url, title) { document.getElementById('modal-iframe').src = url; document.getElementById('modal-title').innerText = title; document.getElementById('iframe-modal').style.display = 'flex'; };
window.closeOverlay = function() { document.getElementById('modal-iframe').src = ''; document.getElementById('iframe-modal').style.display = 'none'; };

window.toggleTabs = function(evt, containerClass, btnClass, activeBtnClass, activeContentClass) {
    document.querySelectorAll('.' + containerClass).forEach(el => { el.style.display = "none"; el.classList.remove(activeContentClass); });
    document.querySelectorAll('.' + btnClass).forEach(btn => btn.classList.remove(activeBtnClass));
    evt.currentTarget.classList.add(activeBtnClass);
};

const initializedTabs = new Set();
window.openMainTab = async function(evt, gameId, accentColor) {
    document.querySelectorAll('.tab-btn').forEach(btn => { btn.classList.remove('active-btn'); });
    evt.currentTarget.classList.add('active-btn');
    
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
// Apre un gioco partendo dalla card (senza evento click sul tab)
window.openMainTabFromCard = async function(gameId) {
  const container = document.getElementById('game-content-container');
  if (!container) return;

  container.innerHTML = `<div style="text-align:center; padding: 50px; color: var(--text-muted);">Caricamento dati in corso...</div>`;

  try {
    const res = await fetch(`pages/${gameId}.html`);
    if (!res.ok) throw new Error("File non trovato");
    container.innerHTML = await res.text();
    window.initializeTabContent(gameId);
    document.body.dataset.activeGame = gameId;

    // Attiva il primo sub-tab
    const firstSubBtn = container.querySelector(`.${gameId}-sub-btn`);
    if (firstSubBtn) firstSubBtn.click();
  } catch (error) {
    container.innerHTML = `<div style="text-align:center; padding: 50px; color: var(--danger);">Errore nel caricamento. Assicurati che i file in pages/ esistano.</div>`;
  }
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


let hubBuildCatalog = null; let hubPatchRegistry = null; let hubRankingData = null; let hubSearchEntries = [];

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

    // 1. RENDERING PANNELLO META (Con Timer e Fonti)
    const metaTarget = document.getElementById(`build-meta-${gameId}`);
    if(metaTarget) {
        let sourcesHtml = (gameData.sources || []).map(s => `<a href="${s.url}" target="_blank" class="tool-link" style="background:var(--bg-hover); border-color:var(--border-color);">${s.label}</a>`).join('');
        
        metaTarget.innerHTML = `
            <div class="build-meta-heading">
                <div>
                    <span class="build-meta-eyebrow">Aggiornamento meta</span>
                    <strong class="build-meta-title">${HUB_GAMES[gameId]}</strong>
                </div>
                <span class="build-meta-status">Sincronizzato Live</span>
            </div>
            <div class="build-meta-details">
                <div class="build-meta-detail">
                    <span class="build-meta-label">Stagione Attuale / Timer</span>
                    <strong class="build-meta-value" style="color:var(--accent-primary);">${gameData.patch}</strong>
                </div>
                <div class="build-meta-detail">
                    <span class="build-meta-label">Fonti Verificate</span>
                    <div style="margin-top: 5px;">${sourcesHtml || '<span style="color:var(--text-muted)">Maxroll / Community</span>'}</div>
                </div>
            </div>`;
    }

    // Sincronizza i titoletti "Caricamento..." sulle liste build
    document.querySelectorAll(`#${gameId} .season-highlight`).forEach(el => { 
        el.textContent = gameData.patch || "Stagione Corrente"; 
    });

    // 2. RENDERING DISCOVERY COMMUNITY (Con Siti Multipli e YouTube)
    const discTarget = document.getElementById(`build-discovery-${gameId}`);
    if(discTarget && gameData.discovery) {
        let html = `
            <div class="build-discovery-heading">
                <div>
                    <span class="build-discovery-eyebrow">Community discovery</span>
                    <strong class="build-discovery-title">Build da esplorare</strong>
                </div>
                <span class="build-discovery-badge">Ricerca Automatica</span>
            </div>
            <div class="build-discovery-sources" style="margin-bottom: 15px;">
                <span style="font-size:0.85em; color:var(--text-muted); margin-right:10px;">Siti Consigliati:</span>`;
        
        gameData.discovery.sources.forEach(s => {
            html += `<a href="${s[1]}" target="_blank" class="tool-link" style="background:rgba(255,255,255,0.1);">↗ ${s[0]}</a>`;
        });
        
        html += `</div><div class="build-discovery-grid">`;
        
        gameData.discovery.prompts.forEach(p => {
            let cleanPatch = gameData.patch.split('(')[0].trim(); // Pulisce il timer dalla query
            let q = encodeURIComponent(`${HUB_GAMES[gameId]} ${cleanPatch} ${p[2]}`);
            html += `
            <article class="build-discovery-card">
                <h4 style="margin:0 0 5px 0; color:var(--accent-primary);">${p[0]}</h4>
                <p style="font-size:0.85em; color:var(--text-muted); margin:0 0 15px 0; flex-grow:1;">${p[1]}</p>
                <div class="build-discovery-actions">
                    <a href="https://www.youtube.com/results?search_query=${q}" target="_blank" class="tool-link" style="background:var(--color-yt);">📺 YouTube</a>
                    <a href="https://www.google.com/search?q=${q}" target="_blank" class="tool-link" style="background:var(--color-google);">🔍 Google</a>
                </div>
            </article>`;
        });
        html += `</div>`;
        discTarget.innerHTML = html;
    }

    // 3. RENDERING LISTE BUILD (Aggiunto YouTube Dinamico)
    const renderList = (type, targetId) => {
        const ul = document.getElementById(targetId);
        if (!ul) return;
        ul.innerHTML = '';
        const builds = gameData.builds[type] || [];
        if (!builds.length) {
            ul.innerHTML = '<li><span style="color:var(--text-muted); font-style:italic;">Nessuna build registrata.</span></li>';
            return;
        }

        builds.forEach(b => {
            let cleanPatch = gameData.patch.split('(')[0].trim();
            let ytQuery = encodeURIComponent(`${HUB_GAMES[gameId]} ${cleanPatch} ${b.title} ${b.specialization} build`);

            // Mappa tier → colore e bordo
            const tierColors = {
                'S': '#e6b46d', // Oro
                'A': '#6c82d4', // Blu
                'B': '#9b4fd4', // Viola
                'C': '#a81818', // Rosso
            };
            const tierColor = tierColors[b.tier] || b.tierColor || '#848484';
            const tierBorder = `border-left: 3px solid ${tierColor};`;

            ul.innerHTML += `
            <li class="build-card-revamp" style="${tierBorder}">
                <div class="build-card-header">
                    <span class="build-catalog-title">${b.title}</span>
                    <span class="build-tier-badge" style="background:${tierColor}; color:#000; font-weight:700;">${b.tier}</span>
                </div>
                <div class="build-card-meta">
                    <span class="build-class-badge">⚔️ ${b.class}</span>
                    <span class="build-spec-badge">🔮 ${b.specialization}</span>
                </div>
                <div class="build-card-actions">
                    <a href="${b.sourceUrl}" target="_blank" class="tool-link tool-link-guide">🔗 Guida</a>
                    <a href="https://www.youtube.com/results?search_query=${ytQuery}" target="_blank" class="tool-link tool-link-yt">📺 Video</a>
                    <button type="button" class="quick-save-btn-revamp" title="Salva nelle Mie Build" onclick="window.quickSave('${gameId}', '${b.title.replace(/'/g, "\\'")}', '${cleanPatch}', '${b.sourceUrl}')">💾</button>
                </div>
            </li>`;
        });
    };

    renderList('endgame', `top-builds-${gameId}`);
    renderList('leveling', `top-leveling-${gameId}`);
    
    if (gameId === 'd2' && window.renderD2Runewords) window.renderD2Runewords();
    if (gameId === 'poe1' && window.initializePoe1Encyclopedia) window.initializePoe1Encyclopedia();
    window.loadMyBuildsUI();
};
// Ricerca globale
const searchInput = document.getElementById('global-search-input');
const searchResults = document.getElementById('global-search-results');

if (searchInput && searchResults) {
  searchInput.addEventListener('input', () => {
    const query = searchInput.value.trim().toLowerCase();
    if (!query) {
      searchResults.classList.remove('active');
      searchResults.innerHTML = '';
      return;
    }

    const results = hubSearchEntries.filter(entry =>
      entry.title.toLowerCase().includes(query) ||
      entry.meta.toLowerCase().includes(query) ||
      entry.kind.toLowerCase().includes(query)
    ).slice(0, 10); // Max 10 risultati

    if (results.length === 0) {
      searchResults.innerHTML = '<div class="no-results">Nessun risultato trovato.</div>';
      searchResults.classList.add('active');
      return;
    }

    searchResults.innerHTML = results.map(entry => `
      <div class="search-result-item" data-game="${entry.gameId}" data-url="${entry.url}">
        <div class="search-result-title">${entry.title}</div>
        <div class="search-result-meta">${entry.meta}</div>
        <div class="search-result-game">${HUB_GAMES[entry.gameId]}</div>
      </div>
    `).join('');

    searchResults.classList.add('active');

    // Click su un risultato
    searchResults.querySelectorAll('.search-result-item').forEach(item => {
      item.addEventListener('click', () => {
        const gameId = item.dataset.game;
        const url = item.dataset.url;

        // Apri il gioco e poi la build in un overlay
        window.openMainTabFromCard(gameId).then(() => {
          setTimeout(() => {
            window.openOverlay(url, entry.title);
          }, 600);
        });

        searchResults.classList.remove('active');
        searchInput.value = '';
      });
    });
  });

  // Chiudi risultati cliccando fuori
  document.addEventListener('click', (e) => {
    if (!searchBox.contains(e.target)) {
      searchResults.classList.remove('active');
    }
  });

  const searchBox = document.querySelector('.search-box');
}
// =========================================================
// 5. HUB TOOLBELT DIALOGS (Modali di Sistema)
// =========================================================

// Modale Aspetto (Migliorata da pannello fluttuante a Modale Centrale)
document.getElementById('appearance-toggle').onclick = () => {
    let m = document.getElementById('hub-appearance-dialog');
    if(!m) {
        m = document.createElement('div'); m.className = 'modal'; m.id = 'hub-appearance-dialog'; m.style.display = 'flex';
        m.innerHTML = `<div class="modal-content auth-box" style="max-width:400px; height:auto;">
            <div class="modal-header"><span class="modal-title">⚙️ Impostazioni Aspetto</span><span class="close-btn" onclick="document.getElementById('hub-appearance-dialog').style.display='none'">×</span></div>
            <div style="padding:20px; display:flex; flex-direction:column; gap:15px;">
                <p style="margin:0; color:var(--text-muted); font-size:0.9em;">Personalizza il tema e la dimensione del testo del tuo Companion Hub.</p>
                <div style="display:grid; grid-template-columns: 1fr 1fr 1fr; gap:10px;">
                    <button class="action-btn" style="background:#16161a; color:#ff9800; border:1px solid #ff9800;" onclick="window.setTheme('dark')">🌙 Scuro</button>
                    <button class="action-btn" style="background:#000; color:#ff9800; border:1px solid #333;" onclick="window.setTheme('amoled')">🖤 AMOLED</button>
                    <button class="action-btn" style="background:#f0f2f5; color:#222; border:1px solid #ccc;" onclick="window.setTheme('light')">☀️ Chiaro</button>
                </div>
                <div style="display:flex; gap:10px; margin-top:10px;">
                    <button class="action-btn" style="flex:1; background:var(--bg-card); border:1px solid var(--border-color); color:var(--text-main);" onclick="window.changeFontSize(-1)">A− Riduci Testo</button>
                    <button class="action-btn" style="flex:1; background:var(--bg-card); border:1px solid var(--border-color); color:var(--text-main);" onclick="window.changeFontSize(1)">A+ Ingrandisci</button>
                </div>
            </div>
        </div>`;
        document.body.appendChild(m);
    } else { m.style.display = 'flex'; }
};

document.getElementById('hub-ranking-btn').onclick = () => {
    const body = document.getElementById('hub-ranking-grid');
    if(!body) {
        const m = document.createElement('div'); m.className = 'modal'; m.id = 'hub-ranking-dialog'; m.style.display = 'flex';
        m.innerHTML = `<div class="modal-content" style="max-width: 500px; height: auto; max-height: 85vh;">
            <div class="modal-header"><span class="modal-title">📊 Classifica ARPG (Live)</span><span class="close-btn" onclick="document.getElementById('hub-ranking-dialog').style.display='none'">×</span></div>
            <div id="hub-ranking-grid" style="padding:20px; overflow-y:auto; color:var(--text-main);"></div>
        </div>`;
        document.body.appendChild(m);
    } else { document.getElementById('hub-ranking-dialog').style.display = 'flex'; }
    
    const target = document.getElementById('hub-ranking-grid');
    target.innerHTML = '';
    if(!hubRankingData?.rankings) { target.innerHTML = '<p>Dati Steam in tempo reale non disponibili. Aggiorna lo script Python.</p>'; return; }
    hubRankingData.rankings.forEach((s, i) => {
        const formatNum = n => n >= 1000 ? (n/1000).toFixed(1) + 'k' : n;
        target.innerHTML += `<div style="display:flex; justify-content:space-between; align-items: center; margin-bottom:12px; border-bottom:1px solid var(--border-color); padding-bottom:8px; font-size: 1.1em;">
            <span><strong>${i+1}.</strong> ${s.name}</span> 
            <span style="color:${s.color}; font-weight: bold; background: var(--bg-card); padding: 4px 8px; border-radius: 4px; border: 1px solid var(--border-color);">~${formatNum(s.players)} <span style="font-size:0.7em; color:var(--text-muted)">giocatori</span></span>
        </div>`;
    });
};

document.getElementById('hub-patch-btn').onclick = () => {
    const body = document.getElementById('hub-patch-grid');
    if(!body) {
        const m = document.createElement('div'); m.className = 'modal'; m.id = 'hub-patch-dialog'; m.style.display = 'flex';
        m.innerHTML = `<div class="modal-content" style="max-width: 900px; height: auto; max-height: 85vh;">
            <div class="modal-header"><span class="modal-title">▤ Registro Patch & Stagioni</span><span class="close-btn" onclick="document.getElementById('hub-patch-dialog').style.display='none'">×</span></div>
            <div id="hub-patch-grid" style="padding:20px; overflow-y:auto; display:grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap:15px; color:var(--text-main);"></div>
        </div>`;
        document.body.appendChild(m);
    } else { document.getElementById('hub-patch-dialog').style.display = 'flex'; }
    
    const target = document.getElementById('hub-patch-grid');
    target.innerHTML = '';
    if(!hubPatchRegistry?.games) return;
    Object.entries(HUB_GAMES).forEach(([id, name]) => {
        const p = hubPatchRegistry.games[id];
        let listItems = (p?.changes || ['Nessuna nota automatica disponibile.']).map(c => `<li style="margin-bottom: 5px;">${c}</li>`).join('');
        target.innerHTML += `<div style="border:1px solid var(--border-color); padding:15px; border-radius:8px; background:var(--bg-card); box-shadow: 0 4px 6px rgba(0,0,0,0.2); display: flex; flex-direction: column;">
            <h3 style="margin-top:0; color:var(--accent-primary); border-bottom: 1px dashed var(--border-color); padding-bottom: 5px;">${name}</h3>
            <div class="season-highlight" style="margin-bottom:15px; align-self: flex-start;">${p?.currentPatch || 'N/D'}</div>
            <ul style="padding-left: 20px; margin-bottom: 15px; font-size: 0.9em; color: var(--text-muted); flex-grow: 1;">${listItems}</ul>
            <a href="${p?.sourceUrl}" target="_blank" class="action-btn" style="text-decoration:none; text-align:center; display:block; background: var(--accent-tertiary); padding: 8px;">Consulta Fonte Ufficiale</a>
        </div>`;
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
// 6. INSTALLAZIONE APP (PWA LOGIC)
// =========================================================
let deferredPrompt;
const installBtn = document.getElementById('hub-install-btn');

// Rilevamento iOS e PWA Status
const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
const isPWA = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;

if (!isPWA) {
    if (isIOS) {
        installBtn.hidden = false;
        installBtn.onclick = () => alert("ℹ️ Su iPhone o iPad:\n\n1. Tocca l'icona 'Condividi' (il quadrato con la freccia verso l'alto) in basso nello schermo.\n2. Scorri in giù e tocca 'Aggiungi a schermata Home'.");
    } else {
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            deferredPrompt = e;
            installBtn.hidden = false;
        });

        installBtn.onclick = async () => {
            if (deferredPrompt) {
                deferredPrompt.prompt();
                const { outcome } = await deferredPrompt.userChoice;
                if (outcome === 'accepted') { installBtn.hidden = true; }
                deferredPrompt = null;
            }
        };
    }
}

if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(err => console.log('SW registration failed', err));
}

// =========================================================
// 7. ENCICLOPEDIA E RUNEWORDS GLOBALI
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

// Esponi le funzioni builds su window per gli onclick inline
window.loadMyBuildsUI = loadMyBuildsUI;
window.filterSavedBuilds = filterSavedBuilds;
window.editBuild = editBuild;
window.cancelEdit = cancelEdit;
window.saveBuild = saveBuild;
window.deleteBuild = deleteBuild;
window.quickSave = quickSave;