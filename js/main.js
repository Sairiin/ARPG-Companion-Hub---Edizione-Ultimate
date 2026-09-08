// ---------------------------------------------------------
        // 1. CONFIGURAZIONE FIREBASE
        // ---------------------------------------------------------
        import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
        import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
        import { getFirestore, doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

        // CHIAVI FIREBASE UTENTE
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
        window.editingIndex = { poe1: null, poe2: null, d2: null, le: null }; // TRACK EDIT STATE

        // ---------------------------------------------------------
        // 2. FUNZIONI DI AUTENTICAZIONE E SINCRONIZZAZIONE
        // ---------------------------------------------------------
        window.openAuthModal = () => document.getElementById('auth-modal').style.display = 'flex';
        window.closeAuthModal = () => document.getElementById('auth-modal').style.display = 'none';

        window.loginWithGoogle = async () => {
            if(!auth) return alert("Firebase non è stato configurato nel codice.");
            const provider = new GoogleAuthProvider();
            try {
                await signInWithPopup(auth, provider);
            } catch(e) { console.error("Errore di Login", e); }
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

        window.logoutFirebase = async () => {
            if(auth) await signOut(auth);
        };

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

        // ---------------------------------------------------------
        // 3. FUNZIONI GLOBALI (WINDOW) PER HTML
        // ---------------------------------------------------------
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

        // Nuova funzione per filtrare le build salvate (Miglioria consigliata)
        window.filterSavedBuilds = function(game) {
            let filter = document.getElementById(`filter-saved-${game}`).value.toLowerCase();
            let ul = document.getElementById(`my-builds-${game}`);
            let li = ul.getElementsByTagName("li");
            
            for (let i = 0; i < li.length; i++) {
                // Salta il messaggio "Nessuna build salvata"
                if (li[i].innerText.includes("Nessuna build salvata")) continue; 
                
                let text = li[i].textContent || li[i].innerText;
                if (text.toLowerCase().indexOf(filter) > -1) {
                    li[i].style.display = "";
                } else {
                    li[i].style.display = "none";
                }
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
            
            // Pulisce il filtro dopo il salvataggio
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
            
            // Mantiene il filtro se attivo
            window.filterSavedBuilds(game);
        };

        window.quickSave = async function(game, buildName, defaultVersion, buildUrl) {
            if (!userBuilds[game]) userBuilds[game] = [];
            userBuilds[game].push({ name: buildName, link: buildUrl, version: defaultVersion, note: "Salvata dal Generatore Smart" });
            await syncToFirebase();
            alert("Build Salvata in: Le Mie Build Personali!");
        };

        window.exportBackup = function() {
            let data = JSON.stringify(userBuilds);
            let blob = new Blob([data], { type: "application/json" });
            let url = URL.createObjectURL(blob);
            let a = document.createElement("a");
            a.href = url;
            a.download = "arpg_builds_backup.json";
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        };

        window.importBackup = async function(event) {
            let file = event.target.files[0];
            if (!file) return;
            let reader = new FileReader();
            reader.onload = async function(e) {
                try {
                    let json = JSON.parse(e.target.result);
                    if (json.poe1 || json.poe2 || json.d2 || json.le) {
                        userBuilds = json;
                        await syncToFirebase();
                        alert("Backup importato con successo!");
                    } else {
                        alert("File di backup non valido o danneggiato.");
                    }
                } catch (err) {
                    alert("Errore nella lettura del file.");
                }
            };
            reader.readAsText(file);
            event.target.value = '';
        };

        // --- GESTIONE TEMI E UI GLOBALI ---
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

        // --- SISTEMA AUTO-UPDATE CLASSIFICA ARPG ---
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

        // --- Header essenziale: pannelli Radar ARPG e Aspetto ---
        function setEssentialPanel(panelId, triggerId, open) {
            const panel = document.getElementById(panelId);
            const trigger = document.getElementById(triggerId);
            if (!panel || !trigger) return;
            panel.hidden = !open;
            trigger.setAttribute('aria-expanded', String(open));
        }

        window.toggleArpgRadar = function() {
            const panel = document.getElementById('arpg-radar-panel');
            if (!panel) return;
            const willOpen = panel.hidden;
            setEssentialPanel('appearance-panel', 'appearance-toggle', false);
            setEssentialPanel('arpg-radar-panel', 'arpg-radar-toggle', willOpen);
        };

        window.toggleAppearancePanel = function() {
            const panel = document.getElementById('appearance-panel');
            if (!panel) return;
            const willOpen = panel.hidden;
            setEssentialPanel('arpg-radar-panel', 'arpg-radar-toggle', false);
            setEssentialPanel('appearance-panel', 'appearance-toggle', willOpen);
        };

        window.closeEssentialPanel = function(panelId, triggerId) {
            setEssentialPanel(panelId, triggerId, false);
        };

        document.addEventListener('click', event => {
            const shell = document.querySelector('.essential-header-shell');
            if (!shell || shell.contains(event.target)) return;
            setEssentialPanel('arpg-radar-panel', 'arpg-radar-toggle', false);
            setEssentialPanel('appearance-panel', 'appearance-toggle', false);
        });

        document.addEventListener('keydown', event => {
            if (event.key !== 'Escape') return;
            setEssentialPanel('arpg-radar-panel', 'arpg-radar-toggle', false);
            setEssentialPanel('appearance-panel', 'appearance-toggle', false);
        });
        window.toggleTabs = function(evt, containerClass, btnClass, activeBtnClass, activeContentClass) {
            document.querySelectorAll('.' + containerClass).forEach(el => {
                el.style.display = "none";
                el.classList.remove(activeContentClass);
            });
            document.querySelectorAll('.' + btnClass).forEach(btn => btn.classList.remove(activeBtnClass));
            evt.currentTarget.classList.add(activeBtnClass);
        };

window.openMainTab = async function(evt, gameId, accentColor) {
            // 1. Evidenzia il tab corretto
            document.querySelectorAll('.tab-btn').forEach(btn => {
                btn.style.borderBottomColor = "transparent";
                btn.style.color = "var(--text-main)";
                btn.classList.remove('active-btn');
            });
            evt.currentTarget.classList.add('active-btn');
            if (accentColor) {
                evt.currentTarget.style.borderBottomColor = accentColor;
                evt.currentTarget.style.color = accentColor;
            }

            const container = document.getElementById('game-content-container');
            container.innerHTML = `<div style="padding: 40px; text-align: center;">Caricamento sezione...</div>`;

            // 2. Richiama il file HTML esterno
            try {
                const response = await fetch(`pages/${gameId}.html`);
                if (!response.ok) throw new Error("File non trovato");
                const html = await response.text();
                
                // 3. Inietta l'HTML
                container.innerHTML = html;
                
                // 4. Inizializza gli script del gioco specifico
                if (window.initializeTabContent) window.initializeTabContent(gameId);
                if (window.hubSetGameIdentity) window.hubSetGameIdentity(gameId);
                
                // Riapri la prima sottoscheda (dashboard) di default
                const firstSubBtn = container.querySelector(`.${gameId}-sub-btn`);
                if(firstSubBtn) firstSubBtn.click();
                
            } catch (error) {
                console.error("Errore Fetch:", error);
                container.innerHTML = `<div style="padding: 40px; text-align: center; color: red;">Errore nel caricamento del file pages/${gameId}.html</div>`;
            }
        };
            
    

        window.openSubTab = function(evt, subTabId, gamePrefix) {
            window.toggleTabs(evt, `${gamePrefix}-sub-content`, `${gamePrefix}-sub-btn`, 'active-sub', 'active-sub-content');
            document.getElementById(subTabId).style.display = "block";
            if (subTabId === 'poe1-encyclopedia') {
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
        // --- Catalogo locale delle build e stato meta ---
        // Le build consigliate sono mantenute in assets/builds.json. Questo modulo non
        // modifica le build personali salvate in localStorage/Firebase.
        const BUILD_CATALOG_URL = 'assets/builds.json';
        const buildCatalogState = { data: null, promise: null };
        const buildGameTitles = {
            poe1: 'Path of Exile 1',
            poe2: 'Path of Exile 2',
            le: 'Last Epoch',
            d2: 'Diablo II: Resurrected',
            d4: 'Diablo 4'
        };

        function buildText(value, fallback = '') {
            return typeof value === 'string' && value.trim() ? value.trim() : fallback;
        }

        function buildSafeUrl(value) {
            try {
                const url = new URL(buildText(value));
                return /^https?:$/.test(url.protocol) ? url.href : '';
            } catch (error) {
                return '';
            }
        }

        function buildSafeColor(value) {
            return /^#[0-9a-f]{3,8}$/i.test(buildText(value)) ? value : 'var(--legacy-accent, var(--accent-primary))';
        }

        function buildReviewState(gameData) {
            const cycle = Number.isFinite(Number(gameData && gameData.reviewCycleDays))
                ? Math.max(1, Number(gameData.reviewCycleDays))
                : 30;
            const reviewedAt = buildText(gameData && gameData.reviewedAt);
            const reviewedDate = /^\d{4}-\d{2}-\d{2}$/.test(reviewedAt) ? new Date(`${reviewedAt}T12:00:00`) : null;
            const ageDays = reviewedDate ? Math.floor((Date.now() - reviewedDate.getTime()) / 86400000) : null;
            const stale = Boolean(gameData && gameData.requiresReview) || !reviewedDate || ageDays === null || ageDays > cycle;
            return { stale, cycle, reviewedAt, ageDays };
        }

        function buildFormatDate(value) {
            if (!/^\d{4}-\d{2}-\d{2}$/.test(buildText(value))) return 'Non ancora registrata';
            const date = new Date(`${value}T12:00:00`);
            return new Intl.DateTimeFormat('it-IT', { day: '2-digit', month: 'long', year: 'numeric' }).format(date);
        }

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
                    .then(response => {
                        if (!response.ok) throw new Error(`Catalogo build non disponibile (${response.status})`);
                        return response.json();
                    })
                    .then(data => {
                        if (!data || typeof data !== 'object' || !data.games || typeof data.games !== 'object') {
                            throw new Error('Formato del catalogo build non valido');
                        }
                        buildCatalogState.data = data;
                        return data;
                    })
                    .catch(error => {
                        buildCatalogState.promise = null;
                        throw error;
                    });
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
            const review = buildReviewState(gameData);
            target.classList.toggle('is-stale', review.stale);
            const heading = buildElement('div', 'build-meta-heading');
            heading.append(buildElement('span', 'build-meta-eyebrow', 'Aggiornamento meta'));
            heading.append(buildElement('strong', 'build-meta-title', buildText(gameData.game, buildGameTitles[gameId])));
            const status = buildElement('span', `build-meta-status ${review.stale ? 'is-stale' : 'is-current'}`, review.stale ? 'Da verificare' : 'Verificato');
            heading.append(status);

            const details = buildElement('div', 'build-meta-details');
            const patch = buildElement('div', 'build-meta-detail');
            patch.append(buildElement('span', 'build-meta-label', 'Patch / stagione'));
            patch.append(buildElement('strong', 'build-meta-value', buildText(gameData.patch, 'Non indicata')));
            details.append(patch);

            const revised = buildElement('div', 'build-meta-detail');
            revised.append(buildElement('span', 'build-meta-label', 'Ultima revisione'));
            revised.append(buildElement('strong', 'build-meta-value', buildFormatDate(review.reviewedAt)));
            details.append(revised);

            const sources = buildElement('div', 'build-meta-detail build-meta-sources');
            sources.append(buildElement('span', 'build-meta-label', 'Fonti consultate'));
            const sourceLinks = buildElement('span', 'build-meta-source-links');
            const sourcesList = Array.isArray(gameData.sources) ? gameData.sources : [];
            sourcesList.forEach(source => {
                const link = buildExternalLink(buildText(source && source.label, 'Fonte'), source && source.url, 'build-meta-source-link');
                if (link) sourceLinks.append(link);
            });
            if (!sourceLinks.childElementCount) sourceLinks.append(buildElement('span', 'build-meta-empty', 'Da indicare'));
            sources.append(sourceLinks);
            details.append(sources);

            const note = buildElement('p', 'build-meta-note', review.stale
                ? buildText(gameData.reviewNote, `Revisione richiesta: aggiorna le build e conferma le fonti entro ${review.cycle} giorni.`)
                : `Catalogo verificato; prossima revisione consigliata entro ${review.cycle} giorni.`);
            target.append(heading, details, note);
        }

        function renderBuildList(ul, gameId, listType, gameData) {
            ul.replaceChildren();
            const builds = gameData && gameData.builds && Array.isArray(gameData.builds[listType]) ? gameData.builds[listType] : [];
            if (!builds.length) {
                const li = buildElement('li', 'build-catalog-empty', 'Nessuna build editoriale pubblicata in questa categoria. Controlla le fonti del pannello meta.');
                ul.append(li);
                return;
            }

            builds.forEach(build => {
                const title = buildText(build && build.title, 'Build senza titolo');
                const className = buildText(build && build.class, 'Classe non indicata');
                const specialization = buildText(build && build.specialization, 'Specializzazione non indicata');
                const tier = buildText(build && build.tier, 'In revisione');
                const directUrl = buildSafeUrl(build && build.sourceUrl);
                const li = buildElement('li');
                const content = buildElement('div', 'dash-list-item-content');
                const titleLine = buildElement('div');
                const titleEl = buildElement('span', 'build-catalog-title', title);
                titleLine.append(titleEl);
                const tierEl = buildElement('span', 'tag build-catalog-tier', tier);
                tierEl.style.background = buildSafeColor(build && build.tierColor);
                titleLine.append(tierEl);
                content.append(titleLine);
                content.append(buildElement('div', 'build-class-info', `(${className} – ${specialization})`));

                const links = buildElement('div', 'smart-links-container');
                const guideLink = buildExternalLink('🔗 Guida', directUrl, 'tool-link build-catalog-guide');
                if (guideLink) links.append(guideLink);
                const searchQuery = encodeURIComponent(`${buildGameTitles[gameId] || ''} ${buildText(gameData.patch)} ${title} ${specialization} build`);
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
                    save.addEventListener('click', () => {
                        if (typeof window.quickSave === 'function') {
                            window.quickSave(gameId, `${title} (${specialization})`, buildText(gameData.patch, 'N/D'), directUrl);
                        }
                    });
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
                if (!gameData || typeof gameData !== 'object') throw new Error('Dati del gioco non presenti nel catalogo');
                renderBuildMeta(gameId, gameData);
                renderBuildList(ul, gameId, listType, gameData);
            } catch (error) {
                console.warn('Catalogo build non caricato:', error);
                renderBuildMeta(gameId, null, 'Catalogo build temporaneamente non disponibile. Le risorse rapide della dashboard restano utilizzabili.');
                ul.replaceChildren(buildElement('li', 'build-catalog-empty', 'Catalogo temporaneamente non disponibile. Riprova dopo l’aggiornamento.'));
            }
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


        // --- ENCICLOPEDIA MECCANICHE POE 1 (namespace isolato) ---
        // Le 16 card e modali dell'enciclopedia sono inizializzate alla prima apertura
        // della relativa sottosezione, evitando collisioni con le altre guide.
        window.initializePoe1Encyclopedia = function() {
            const root = document.getElementById('poe1-encyclopedia');
            if (!root || root.dataset.initialized === 'true') return;

            const api = {
                openLightbox(imgSrc) {
                    const lightbox = root.querySelector('#poe1-encyclopedia-lightbox');
                    const image = root.querySelector('#poe1-encyclopedia-lightbox-img');
                    lightbox.classList.add('active');
                    image.src = imgSrc;
                    document.body.style.overflow = 'hidden';
                },
                closeLightbox(event) {
                    const lightbox = root.querySelector('#poe1-encyclopedia-lightbox');
                    if (event && event.target !== lightbox) return;
                    lightbox.classList.remove('active');
                    document.body.style.overflow = 'auto';
                },
                filterSelection(event, category) {
                    const cards = root.querySelectorAll('.card');
                    const buttons = root.querySelectorAll('.filter-btn');
                    buttons.forEach(button => button.classList.remove('active'));
                    if (event && event.currentTarget) event.currentTarget.classList.add('active');
                    const classToMatch = category === 'all' ? '' : category;
                    cards.forEach(card => {
                        card.style.display = card.className.includes(classToMatch) ? 'flex' : 'none';
                    });
                },
                openModal(id) {
                    const modal = root.querySelector(`#${id}`);
                    if (!modal) return;
                    modal.style.display = 'flex';
                    document.body.style.overflow = 'hidden';
                },
                closeModalById(id) {
                    const modal = root.querySelector(`#${id}`);
                    if (!modal) return;
                    modal.style.display = 'none';
                    document.body.style.overflow = 'auto';
                },
                closeModal(event) {
                    if (event.target.classList.contains('modal-overlay')) {
                        event.target.style.display = 'none';
                        document.body.style.overflow = 'auto';
                    }
                }
            };

            window.poe1Encyclopedia = api;
            document.addEventListener('keydown', function(event) {
                if (event.key !== 'Escape') return;
                root.querySelector('#poe1-encyclopedia-lightbox').classList.remove('active');
                root.querySelectorAll('.modal-overlay').forEach(modal => { modal.style.display = 'none'; });
                document.body.style.overflow = 'auto';
            });
            root.dataset.initialized = 'true';
            api.filterSelection(null, 'all');
        };

        // --- DATABASE RUNEWORDS D2 ---
        const RUNE_IMG_BASE_URL = "https://d2runewizard.com/assets/runes/";
        const RUNE_IMG_EXT = ".webp";
        const runewordsData = [
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
                        runeImagesHtml += `<div class="rune-block"><img src="${imgUrl}" alt="${rune}" width="28" height="28" loading="lazy" decoding="async"><span>${rune}</span></div>`;
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

        // --- Build da esplorare: collegamenti community non verificati ---
        // Questa sezione offre punti di partenza e ricerche live. Non sincronizza,
        // estrae o certifica contenuti provenienti da siti terzi.
        const buildDiscoveryConfig = {
            poe1: {
                sources: [
                    ['Maxroll', 'https://maxroll.gg/poe/category/build-guides'],
                    ['Icy Veins', 'https://www.icy-veins.com/poe/builds'],
                    ['Mobalytics', 'https://mobalytics.gg/poe/builds'],
                    ['PoEBuilds.cc', 'https://poebuilds.cc/'],
                    ['PoEBuilds.net', 'https://www.poebuilds.net/']
                ],
                prompts: [
                    ['Starter di lega', 'Un punto di partenza per la progressione iniziale e gli oggetti accessibili.', 'league starter'],
                    ['Mappe ed endgame', 'Idee per clear, progressione Atlas e investimenti dopo il livellamento.', 'endgame mapping'],
                    ['Boss e obiettivi mirati', 'Configurazioni da confrontare se il tuo obiettivo è il danno a bersaglio singolo.', 'boss killer']
                ]
            },
            poe2: {
                sources: [
                    ['Maxroll', 'https://maxroll.gg/poe2/category/build-guides'],
                    ['Icy Veins', 'https://www.icy-veins.com/poe2/build-guides'],
                    ['Mobalytics', 'https://mobalytics.gg/poe2/builds'],
                    ['PoEBuilds.cc', 'https://poebuilds.cc/'],
                    ['PoEBuilds.net', 'https://www.poebuilds.net/']
                ],
                prompts: [
                    ['Starter', 'Build da confrontare per iniziare con una classe e comprendere il loop di progressione.', 'starter build'],
                    ['Endgame', 'Spunti per confrontare clear, difese e requisiti degli oggetti nelle fasi avanzate.', 'endgame build'],
                    ['Bossing', 'Idee da verificare per danno a bersaglio singolo e incontri impegnativi.', 'boss killer']
                ]
            },
            le: {
                sources: [
                    ['Maxroll', 'https://maxroll.gg/last-epoch/build-guides'],
                    ['Last Epoch Tools', 'https://www.lastepochtools.com/builds/'],
                    ['Icy Veins', 'https://www.icy-veins.com/last-epoch/builds'],
                    ['Mobalytics', 'https://mobalytics.gg/last-epoch/builds']
                ],
                prompts: [
                    ['Cycle starter', 'Punti di partenza per il livellamento e la scelta della mastery.', 'cycle starter build'],
                    ['Monolith ed endgame', 'Spunti per build orientate a Echo, Blessing e Corruption.', 'monolith endgame build'],
                    ['Boss e arena', 'Configurazioni da confrontare per danno singolo e sopravvivenza.', 'boss arena build']
                ]
            },
            d2: {
                sources: [
                    ['Maxroll', 'https://maxroll.gg/d2/category/guides'],
                    ['Icy Veins', 'https://www.icy-veins.com/d2/classes-and-builds'],
                    ['Mobalytics', 'https://mobalytics.gg/diablo-2/builds']
                ],
                prompts: [
                    ['Ladder starter', 'Build di partenza da confrontare per arrivare rapidamente alle prime attività Ladder.', 'ladder starter build'],
                    ['Farming e Magic Find', 'Spunti dedicati a zone, velocità e ricerca oggetti.', 'magic find farming build'],
                    ['Uber e boss', 'Configurazioni da esplorare per incontri con elevato danno singolo.', 'uber boss build']
                ]
            },
            d4: {
                sources: [
                    ['Maxroll', 'https://maxroll.gg/d4/build-guides'],
                    ['Icy Veins', 'https://www.icy-veins.com/d4/'],
                    ['Mobalytics', 'https://mobalytics.gg/diablo-4/builds'],
                    ['Wowhead', 'https://www.wowhead.com/diablo-4']
                ],
                prompts: [
                    ['Livellamento stagionale', 'Idee di partenza da confrontare prima di investire risorse nella build.', 'season leveling build'],
                    ['Endgame', 'Spunti per attività avanzate, paragon, aspetti e ottimizzazione dell’equipaggiamento.', 'endgame build'],
                    ['Boss e Pit', 'Build da esplorare per danno singolo e contenuti ad alta difficoltà.', 'boss pit build']
                ]
            }
        };

        function discoveryGameQuery(gameId, gameData, suffix) {
            const normalizedSuffix = /\bbuild\s*$/i.test(suffix) ? suffix : `${suffix} build`;
            return `${buildGameTitles[gameId] || ''} ${buildText(gameData && gameData.patch)} ${normalizedSuffix}`.replace(/\s+/g, ' ').trim();
        }

        function discoveryLink(label, url, className) {
            return buildExternalLink(label, url, className);
        }

        function renderBuildDiscovery(gameId, gameData) {
            const target = document.getElementById(`build-discovery-${gameId}`);
            const config = buildDiscoveryConfig[gameId];
            if (!target || !config) return;
            target.replaceChildren();

            const heading = buildElement('div', 'build-discovery-heading');
            heading.append(buildElement('span', 'build-discovery-eyebrow', 'Community discovery'));
            heading.append(buildElement('strong', 'build-discovery-title', 'Build da esplorare'));
            heading.append(buildElement('span', 'build-discovery-badge', 'Non verificate dal sito'));
            target.append(heading);
            target.append(buildElement('p', 'build-discovery-notice', 'Punti di partenza e ricerche esterne per la patch indicata. Non sono una classifica, una selezione editoriale o una garanzia di compatibilità: verifica sempre data, requisiti e contenuto della guida prima di seguirla.'));

            const sources = buildElement('div', 'build-discovery-sources');
            config.sources.forEach(([label, url]) => {
                const link = discoveryLink(`↗ ${label}`, url, 'build-discovery-source');
                if (link) sources.append(link);
            });
            target.append(sources);

            const grid = buildElement('div', 'build-discovery-grid');
            config.prompts.forEach(([title, description, suffix]) => {
                const query = discoveryGameQuery(gameId, gameData, suffix);
                const encoded = encodeURIComponent(query);
                const card = buildElement('article', 'build-discovery-card');
                card.append(buildElement('h4', '', title));
                card.append(buildElement('p', '', description));
                const actions = buildElement('div', 'build-discovery-actions');
                const youtube = discoveryLink('📺 YouTube live', `https://www.youtube.com/results?search_query=${encoded}`, 'tool-link build-discovery-youtube');
                const google = discoveryLink('🔍 Cerca sul web', `https://www.google.com/search?q=${encoded}`, 'tool-link build-discovery-search');
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
            } catch (error) {
                const target = document.getElementById(`build-discovery-${gameId}`);
                if (!target) return;
                target.replaceChildren(buildElement('p', 'build-discovery-notice', 'Le risorse community non sono disponibili in questo momento. Puoi usare i collegamenti rapidi della dashboard.'));
            }
        };
        // --- Inizializzazione differita dei contenuti delle tab ---
        // Ogni sezione viene popolata una sola volta, alla prima apertura. I dataset,
        // i filtri e il markup finale restano identici: cambiano solo i tempi di creazione.
        const initializedTabs = new Set();
        const tabBuildTargets = {
            poe1: [
                ['endgame', 'top-builds-poe1'],
                ['leveling', 'top-leveling-poe1']
            ],
            poe2: [
                ['endgame', 'top-builds-poe2'],
                ['leveling', 'top-leveling-poe2']
            ],
            le: [
                ['endgame', 'top-builds-le'],
                ['leveling', 'top-leveling-le']
            ],
            d2: [
                ['endgame', 'top-builds-d2'],
                ['leveling', 'top-leveling-d2']
            ],
            d4: [
                ['endgame', 'top-builds-d4'],
                ['leveling', 'top-leveling-d4']
            ]
        };

        window.initializeTabContent = function(gameId) {
            if (initializedTabs.has(gameId)) return;

            tabBuildTargets[gameId].forEach(([listType, elementId]) => {
                window.fetchAndDisplayBuilds(gameId, listType, elementId);
            });
            window.initializeBuildDiscovery(gameId);

            if (gameId === 'd2') {
                window.renderD2Runewords();
            }

            initializedTabs.add(gameId);
        };


        // --- Hub evoluto: ricerca, condivisione, spazio personale, confronto e accessibilità ---
        const HUB_GAMES = {
            poe1: 'Path of Exile 1',
            poe2: 'Path of Exile 2',
            le: 'Last Epoch',
            d2: 'Diablo II: Resurrected',
            d4: 'Diablo 4'
        };
        const HUB_FAVORITES_KEY = 'arpgHubFavoritesV1';
        const HUB_SEASON_KEY = 'arpgHubSeasonV1';
        const HUB_A11Y_KEY = 'arpgHubAccessibilityV1';
        let hubBuildCatalog = null;
        let hubPatchRegistry = null;
        let hubSearchEntries = [];
        let hubInstallPrompt = null;
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

        function hubSafeUrl(value) {
            try {
                const url = new URL(value, window.location.href);
                return /^https?:$/.test(url.protocol) ? url.href : '';
            } catch (error) { return ''; }
        }

        function hubToast(message) {
            const toast = document.getElementById('hub-toast');
            if (!toast) return;
            toast.textContent = message;
            toast.hidden = false;
            window.clearTimeout(hubToastTimer);
            hubToastTimer = window.setTimeout(() => { toast.hidden = true; }, 3200);
        }

        function hubReadJson(key, fallback) {
            try {
                const value = localStorage.getItem(key);
                return value ? JSON.parse(value) : fallback;
            } catch (error) { return fallback; }
        }

        function hubWriteJson(key, value) {
            try { localStorage.setItem(key, JSON.stringify(value)); } catch (error) { hubToast('Impossibile salvare le preferenze su questo dispositivo.'); }
        }

        function hubCurrentGame() {
            return document.body.dataset.activeGame || 'poe1';
        }

        function hubCurrentSection(gameId = hubCurrentGame()) {
            const active = document.querySelector(`#${gameId} .${gameId}-sub-content.active-sub-content`) || document.querySelector(`#${gameId} .${gameId}-sub-content:not([style*="display: none"])`);
            return active ? active.id : `${gameId}-dash`;
        }

        function hubSetGameIdentity(gameId) {
            if (!HUB_GAMES[gameId]) return;
            document.body.dataset.activeGame = gameId;
            const toolbelt = document.querySelector('.hub-toolbelt');
            if (toolbelt) toolbelt.setAttribute('data-game', gameId);
        }

        function hubHashParams() {
            return new URLSearchParams(window.location.hash.replace(/^#/, ''));
        }

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
                    if (destination) destination.scrollIntoView({ behavior: document.body.classList.contains('hub-reduce-motion') ? 'auto' : 'smooth', block: 'start' });
                }
            }, 0);
        }

        function hubApplyHash() {
            const params = hubHashParams();
            const gameId = params.get('game');
            const sectionId = params.get('section');
            if (HUB_GAMES[gameId]) {
                hubOpenLocation(gameId, sectionId && sectionId.startsWith(`${gameId}-`) ? sectionId : null);
            }
        }

        function hubFavorites() {
            const saved = hubReadJson(HUB_FAVORITES_KEY, []);
            return Array.isArray(saved) ? saved : [];
        }

        function hubSetFavorites(items) {
            hubWriteJson(HUB_FAVORITES_KEY, items.slice(0, 60));
        }

        function hubFavoriteKey(entry) {
            return `${entry.kind}:${entry.gameId}:${entry.targetId || entry.id}`;
        }

        function hubToggleFavorite(entry) {
            const key = hubFavoriteKey(entry);
            const current = hubFavorites();
            const existing = current.findIndex(item => item.key === key);
            if (existing >= 0) current.splice(existing, 1);
            else current.unshift({ key, title: entry.title, gameId: entry.gameId, targetId: entry.targetId || entry.id, kind: entry.kind, meta: entry.meta || '', savedAt: new Date().toISOString() });
            hubSetFavorites(current);
            hubToast(existing >= 0 ? 'Rimosso dai preferiti.' : 'Aggiunto a La mia stagione.');
            hubRenderSearchResults(document.getElementById('hub-search-input')?.value || '');
            hubRenderSeason();
        }

        function hubBuildStaticEntries() {
            const entries = [];
            document.querySelectorAll('.sub-tab-btn').forEach(button => {
                const onclick = button.getAttribute('onclick') || '';
                const match = onclick.match(/openSubTab\(event,\s*'([^']+)',\s*'([^']+)'\)/);
                if (!match || !HUB_GAMES[match[2]]) return;
                entries.push({
                    id: `section-${match[1]}`,
                    kind: 'Sezione',
                    title: button.textContent.trim(),
                    gameId: match[2],
                    targetId: match[1],
                    meta: `${HUB_GAMES[match[2]]} · navigazione`
                });
            });
            document.querySelectorAll('.guide-section[id]').forEach(section => {
                const gameId = Object.keys(HUB_GAMES).find(game => section.id.startsWith(`${game}-`));
                const heading = section.querySelector('h1, h2, h3');
                if (!gameId || !heading) return;
                entries.push({ id: `guide-${section.id}`, kind: 'Guida', title: heading.textContent.trim(), gameId, targetId: section.id, meta: `${HUB_GAMES[gameId]} · guida` });
            });
            return entries;
        }

        async function hubLoadData() {
            const [catalogResult, patchesResult] = await Promise.allSettled([
                fetch('assets/builds.json', { cache: 'no-store' }).then(response => response.ok ? response.json() : Promise.reject(new Error('Catalogo build non disponibile'))),
                fetch('assets/patches.json', { cache: 'no-store' }).then(response => response.ok ? response.json() : Promise.reject(new Error('Registro patch non disponibile')))
            ]);
            hubBuildCatalog = catalogResult.status === 'fulfilled' ? catalogResult.value : null;
            hubPatchRegistry = patchesResult.status === 'fulfilled' ? patchesResult.value : null;
            const buildEntries = [];
            if (hubBuildCatalog?.games) {
                Object.entries(hubBuildCatalog.games).forEach(([gameId, game]) => {
                    Object.entries(game.builds || {}).forEach(([category, builds]) => {
                        (builds || []).forEach(build => buildEntries.push({
                            ...build,
                            id: build.id,
                            kind: 'Build',
                            gameId,
                            targetId: `${gameId}-dash`,
                            category,
                            meta: `${HUB_GAMES[gameId]} · ${category === 'endgame' ? 'Endgame' : 'Livellamento'} · ${build.class} ${build.specialization !== 'N/A' ? `· ${build.specialization}` : ''}`
                        }));
                    });
                });
            }
            hubSearchEntries = [...hubBuildStaticEntries(), ...buildEntries];
            hubRenderSearchResults('');
            hubRenderSeason();
            hubRenderCompareOptions();
            hubRenderPatchRegistry();
        }

        function hubCreateDialog(id, kicker, title, subtitle) {
            const backdrop = hubElement('div', { id, className: 'hub-dialog-backdrop', hidden: 'hidden', role: 'presentation' });
            const dialog = hubElement('section', { className: 'hub-dialog', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': `${id}-title` });
            const heading = hubElement('div', { className: 'hub-dialog-header' }, [
                hubElement('div', {}, [hubElement('span', { className: 'hub-dialog-kicker', text: kicker }), hubElement('h2', { id: `${id}-title`, text: title }), hubElement('p', { className: 'hub-dialog-subtitle', text: subtitle })]),
                hubElement('button', { className: 'hub-dialog-close', type: 'button', 'aria-label': `Chiudi ${title}`, text: '×', onclick: () => hubCloseDialog(id) })
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

        function hubCloseDialog(id) {
            const backdrop = document.getElementById(id);
            if (backdrop) backdrop.hidden = true;
        }

        function hubRenderSearchResults(query) {
            const target = document.getElementById('hub-search-results');
            const count = document.getElementById('hub-search-count');
            if (!target || !count) return;
            const normalized = String(query || '').trim().toLocaleLowerCase('it');
            const selected = normalized ? hubSearchEntries.filter(entry => `${entry.title} ${entry.meta} ${entry.kind}`.toLocaleLowerCase('it').includes(normalized)) : hubSearchEntries.slice(0, 16);
            target.replaceChildren();
            count.textContent = normalized ? `${selected.length} risultati` : `Cerca tra ${hubSearchEntries.length} elementi`;
            if (!selected.length) {
                target.appendChild(hubElement('p', { className: 'hub-empty', text: 'Nessun risultato. Prova con il nome di una build, un gioco o una sezione.' }));
                return;
            }
            const favorites = new Set(hubFavorites().map(item => item.key));
            selected.slice(0, 36).forEach(entry => {
                const main = hubElement('button', { className: 'hub-search-result-main', type: 'button', onclick: () => { hubCloseDialog('hub-search-dialog'); hubOpenLocation(entry.gameId, entry.targetId); } }, [
                    hubElement('span', { className: 'hub-search-result-title', text: entry.title }),
                    hubElement('span', { className: 'hub-search-result-meta', text: `${entry.kind} · ${entry.meta || HUB_GAMES[entry.gameId]}` })
                ]);
                const favorite = hubElement('button', { className: `hub-favorite-btn${favorites.has(hubFavoriteKey(entry)) ? ' is-favorite' : ''}`, type: 'button', title: 'Aggiungi o rimuovi dai preferiti', 'aria-label': `Preferito: ${entry.title}`, text: '★', onclick: () => hubToggleFavorite(entry) });
                target.appendChild(hubElement('article', { className: 'hub-search-result' }, [main, favorite]));
            });
        }

        function hubSeasonDefault() {
            return { gameId: 'poe1', className: '', favorites: true, goals: { build: false, defenses: false, progression: false, boss: false } };
        }

        function hubSeasonState() {
            return { ...hubSeasonDefault(), ...hubReadJson(HUB_SEASON_KEY, hubSeasonDefault()) };
        }

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
                hubElement('div', { className: 'hub-field' }, [hubElement('label', { htmlFor: 'hub-season-game', text: 'Gioco attivo' }), gameSelect]),
                hubElement('div', { className: 'hub-field' }, [hubElement('label', { htmlFor: 'hub-season-class', text: 'La tua build o classe' }), classInput]),
                hubElement('div', { className: 'hub-action-row' }, [hubElement('button', { className: 'hub-primary-btn', type: 'button', text: 'Salva stagione', onclick: () => { const next = hubSeasonState(); next.gameId = gameSelect.value; next.className = classInput.value.trim(); hubWriteJson(HUB_SEASON_KEY, next); hubSetGameIdentity(next.gameId); hubToast('La tua stagione è stata salvata.'); hubRenderSeason(); } })])
            );
            goals.replaceChildren();
            const labels = { build: 'Scegliere una build', defenses: 'Sistemare difese e resistenze', progression: 'Completare la progressione chiave', boss: 'Preparare il primo boss obiettivo' };
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
            if (!favoriteItems.length) favoritesTarget.appendChild(hubElement('p', { className: 'hub-empty', text: 'Nessun preferito: usa la stella nella ricerca globale.' }));
            else favoriteItems.slice(0, 8).forEach(item => favoritesTarget.appendChild(hubElement('div', { className: 'hub-mini-item' }, [hubElement('span', { text: `${HUB_GAMES[item.gameId] || item.gameId} · ${item.title}` }), hubElement('button', { type: 'button', text: 'Apri', onclick: () => { hubCloseDialog('hub-season-dialog'); hubOpenLocation(item.gameId, item.targetId); } })])));
        }

        function hubCatalogBuilds() {
            if (!hubBuildCatalog?.games) return [];
            return Object.entries(hubBuildCatalog.games).flatMap(([gameId, game]) => Object.entries(game.builds || {}).flatMap(([category, builds]) => (builds || []).map(build => ({ ...build, gameId, category, game }))));
        }

        function hubBuildLabel(build) {
            return `${HUB_GAMES[build.gameId]} · ${build.title} (${build.class}${build.specialization && build.specialization !== 'N/A' ? ` — ${build.specialization}` : ''})`;
        }

        function hubRenderCompareOptions() {
            const first = document.getElementById('hub-compare-first');
            const second = document.getElementById('hub-compare-second');
            if (!first || !second) return;
            const builds = hubCatalogBuilds();
            [first, second].forEach(select => {
                const saved = select.value;
                select.replaceChildren(hubElement('option', { value: '', text: 'Scegli una build' }));
                builds.forEach(build => select.appendChild(hubElement('option', { value: build.id, text: hubBuildLabel(build), ...(build.id === saved ? { selected: 'selected' } : {}) })));
            });
            if (builds.length >= 2 && !first.value && !second.value) { first.value = builds[0].id; second.value = builds[1].id; }
            hubRenderCompare();
        }

        function hubRenderCompare() {
            const target = document.getElementById('hub-compare-grid');
            const firstId = document.getElementById('hub-compare-first')?.value;
            const secondId = document.getElementById('hub-compare-second')?.value;
            if (!target) return;
            const builds = hubCatalogBuilds();
            const selected = [builds.find(build => build.id === firstId), builds.find(build => build.id === secondId)].filter(Boolean);
            target.replaceChildren();
            if (!selected.length) { target.appendChild(hubElement('p', { className: 'hub-empty', text: 'Carica il catalogo o scegli due build da confrontare.' })); return; }
            selected.forEach(build => {
                const list = hubElement('ul', { className: 'hub-compare-list' });
                const rows = [
                    ['Gioco', HUB_GAMES[build.gameId]], ['Categoria', build.category === 'endgame' ? 'Endgame' : 'Livellamento'], ['Classe', build.class], ['Specializzazione', build.specialization || 'N/D'], ['Tier catalogo', build.tier || 'N/D'], ['Stato revisione', build.game.requiresReview ? 'Da verificare' : 'Verificata'], ['Fonte', build.sourceName || 'N/D']
                ];
                rows.forEach(([label, value]) => list.appendChild(hubElement('li', {}, [hubElement('span', { text: label }), hubElement('b', { text: value })])));
                const source = hubSafeUrl(build.sourceUrl);
                const head = hubElement('div', { className: 'hub-compare-card-head' }, [hubElement('h3', { text: build.title }), hubElement('p', { text: `${build.class}${build.specialization && build.specialization !== 'N/A' ? ` · ${build.specialization}` : ''}` })]);
                const card = hubElement('article', { className: 'hub-compare-card' }, [head, list]);
                if (source) card.appendChild(hubElement('div', { className: 'hub-action-row', style: 'padding: 0 13px 13px;' }, [hubElement('a', { className: 'hub-secondary-btn', href: source, target: '_blank', rel: 'noopener noreferrer', text: 'Apri fonte' })]));
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
                const card = hubElement('article', { className: 'hub-patch-card' }, [hubElement('h3', { text: name }), hubElement('span', { className: 'hub-patch-patch', text: patch?.currentPatch || 'Registro non disponibile' })]);
                const list = hubElement('ul');
                (patch?.changes || ['Registro locale non ancora compilato.']).forEach(change => list.appendChild(hubElement('li', { text: change })));
                card.appendChild(list);
                const url = hubSafeUrl(patch?.sourceUrl);
                if (url) card.appendChild(hubElement('a', { href: url, target: '_blank', rel: 'noopener noreferrer', text: patch.sourceLabel || 'Apri fonte' }));
                target.appendChild(card);
            });
        }

        function hubCopyShareLink() {
            const gameId = hubCurrentGame();
            const sectionId = hubCurrentSection(gameId);
            const url = new URL(window.location.href);
            url.hash = `game=${encodeURIComponent(gameId)}&section=${encodeURIComponent(sectionId)}`;
            const text = url.href;
            const finish = () => hubToast('Link della sezione copiato.');
            if (navigator.clipboard?.writeText) navigator.clipboard.writeText(text).then(finish).catch(() => window.prompt('Copia questo link:', text));
            else window.prompt('Copia questo link:', text);
        }

        function hubSetA11y(setting, enabled) {
            const state = hubReadJson(HUB_A11Y_KEY, { contrast: false, reduceMotion: false });
            state[setting] = enabled;
            hubWriteJson(HUB_A11Y_KEY, state);
            document.body.classList.toggle('hub-high-contrast', Boolean(state.contrast));
            document.body.classList.toggle('hub-reduce-motion', Boolean(state.reduceMotion));
            document.querySelector(`#hub-a11y-${setting}`)?.classList.toggle('is-active', Boolean(state[setting]));
        }

        function hubSetupAccessibility() {
            const grid = document.querySelector('#appearance-panel .appearance-grid');
            if (!grid || document.getElementById('hub-a11y-contrast')) return;
            const row = hubElement('div', { className: 'hub-accessibility-row' });
            const contrast = hubElement('button', { id: 'hub-a11y-contrast', className: 'theme-btn', type: 'button', text: '◐ Contrasto', onclick: () => { const state = hubReadJson(HUB_A11Y_KEY, {}); hubSetA11y('contrast', !state.contrast); } });
            const motion = hubElement('button', { id: 'hub-a11y-reduceMotion', className: 'theme-btn', type: 'button', text: '◌ Meno movimento', onclick: () => { const state = hubReadJson(HUB_A11Y_KEY, {}); hubSetA11y('reduceMotion', !state.reduceMotion); } });
            row.append(contrast, motion);
            grid.appendChild(row);
            const saved = hubReadJson(HUB_A11Y_KEY, { contrast: false, reduceMotion: false });
            hubSetA11y('contrast', Boolean(saved.contrast));
            hubSetA11y('reduceMotion', Boolean(saved.reduceMotion));
        }

        function hubSetupPwa() {
            if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
                navigator.serviceWorker.register('sw.js').catch(error => console.warn('PWA: service worker non registrato.', error));
            }
            window.addEventListener('beforeinstallprompt', event => {
                event.preventDefault();
                hubInstallPrompt = event;
                document.getElementById('hub-install-btn')?.removeAttribute('hidden');
            });
            document.getElementById('hub-install-btn')?.addEventListener('click', async () => {
                if (!hubInstallPrompt) { hubToast('L’installazione sarà disponibile quando il browser riconoscerà il sito come app.'); return; }
                hubInstallPrompt.prompt();
                await hubInstallPrompt.userChoice;
                hubInstallPrompt = null;
                document.getElementById('hub-install-btn')?.setAttribute('hidden', 'hidden');
            });
        }

        function hubCreateInterface() {
            const toolbelt = document.querySelector('.hub-toolbelt');
            if (!toolbelt) return;
            const searchBody = hubCreateDialog('hub-search-dialog', 'Ricerca globale', 'Trova nel Companion Hub', 'Guide, build, strumenti e sezioni dei cinque giochi.');
            const searchInput = hubElement('input', { id: 'hub-search-input', className: 'hub-search-input', type: 'search', placeholder: 'Cerca build, guida, meccanica o gioco…', autocomplete: 'off' });
            searchInput.addEventListener('input', () => hubRenderSearchResults(searchInput.value));
            searchBody.append(searchInput, hubElement('div', { className: 'hub-search-meta' }, [hubElement('span', { id: 'hub-search-count', text: 'Caricamento…' }), hubElement('span', { text: '★ = salva in La mia stagione' })]), hubElement('div', { id: 'hub-search-results', className: 'hub-search-results' }));

            const seasonBody = hubCreateDialog('hub-season-dialog', 'Spazio personale', 'La mia stagione', 'Preferenze e obiettivi sono salvati soltanto sul tuo dispositivo.');
            const profileCard = hubElement('section', { className: 'hub-card' }, [hubElement('h3', { text: 'Profilo di stagione' }), hubElement('div', { id: 'hub-season-profile' })]);
            const goalsCard = hubElement('section', { className: 'hub-card' }, [hubElement('h3', { text: 'Checklist rapida' }), hubElement('div', { id: 'hub-season-goals', className: 'hub-checklist' })]);
            const statsCard = hubElement('section', { className: 'hub-card' }, [hubElement('h3', { text: 'I tuoi progressi' }), hubElement('div', { id: 'hub-season-stats', className: 'hub-stats-grid' })]);
            const favoritesCard = hubElement('section', { className: 'hub-card' }, [hubElement('h3', { text: 'Preferiti' }), hubElement('div', { id: 'hub-season-favorites', className: 'hub-mini-list' })]);
            seasonBody.appendChild(hubElement('div', { className: 'hub-season-layout' }, [hubElement('div', {}, [profileCard, goalsCard]), hubElement('div', {}, [statsCard, favoritesCard])]));

            const compareBody = hubCreateDialog('hub-compare-dialog', 'Confronto catalogo', 'Confronta due build', 'Confronta i dati presenti nel catalogo senza attribuire prestazioni non verificate.');
            const first = hubElement('select', { id: 'hub-compare-first' });
            const second = hubElement('select', { id: 'hub-compare-second' });
            first.addEventListener('change', hubRenderCompare); second.addEventListener('change', hubRenderCompare);
            compareBody.append(hubElement('div', { className: 'hub-compare-controls' }, [hubElement('div', { className: 'hub-field' }, [hubElement('label', { text: 'Build A', htmlFor: 'hub-compare-first' }), first]), hubElement('div', { className: 'hub-field' }, [hubElement('label', { text: 'Build B', htmlFor: 'hub-compare-second' }), second])]), hubElement('div', { id: 'hub-compare-grid', className: 'hub-compare-grid' }), hubElement('p', { className: 'hub-compare-note', text: 'Costo, difese, mapping e boss compariranno qui quando li compilerai nel catalogo editoriale; il sito non inventa punteggi per build non revisionate.' }));

            const patchBody = hubCreateDialog('hub-patch-dialog', 'Manutenzione editoriale', 'Registro patch e meta', 'Una pagina ordinata per verificare cosa aggiornare, senza ripristinare il ticker news.');
            patchBody.appendChild(hubElement('div', { id: 'hub-patch-grid', className: 'hub-patch-grid' }));

            document.body.appendChild(hubElement('div', { id: 'hub-toast', className: 'hub-toast', hidden: 'hidden', role: 'status', 'aria-live': 'polite' }));
            document.getElementById('hub-search-btn')?.addEventListener('click', () => hubOpenDialog('hub-search-dialog', '#hub-search-input'));
            document.getElementById('hub-season-btn')?.addEventListener('click', () => { hubRenderSeason(); hubOpenDialog('hub-season-dialog'); });
            document.getElementById('hub-compare-btn')?.addEventListener('click', () => { hubRenderCompareOptions(); hubOpenDialog('hub-compare-dialog'); });
            document.getElementById('hub-patch-btn')?.addEventListener('click', () => { hubRenderPatchRegistry(); hubOpenDialog('hub-patch-dialog'); });
            document.getElementById('hub-share-btn')?.addEventListener('click', hubCopyShareLink);
        }

        function hubWrapNavigation() {
            const originalMain = window.openMainTab;
            const originalSub = window.openSubTab;
            if (typeof originalMain === 'function' && !originalMain.__hubWrapped) {
                const wrappedMain = function(evt, gameId, accentColor) {
                    originalMain.call(this, evt, gameId, accentColor);
                    hubSetGameIdentity(gameId);
                    hubUpdateHash(gameId, hubCurrentSection(gameId));
                };
                wrappedMain.__hubWrapped = true;
                window.openMainTab = wrappedMain;
            }
            if (typeof originalSub === 'function' && !originalSub.__hubWrapped) {
                const wrappedSub = function(evt, subTabId, gamePrefix) {
                    originalSub.call(this, evt, subTabId, gamePrefix);
                    hubSetGameIdentity(gamePrefix);
                    hubUpdateHash(gamePrefix, subTabId);
                };
                wrappedSub.__hubWrapped = true;
                window.openSubTab = wrappedSub;
            }
        }

        function hubInit() {
            hubSetGameIdentity('poe1');
            hubWrapNavigation();
            hubCreateInterface();
            hubSetupAccessibility();
            hubSetupPwa();
            hubLoadData();
            window.setTimeout(hubApplyHash, 70);
            window.addEventListener('hashchange', hubApplyHash);
            document.addEventListener('keydown', event => {
                if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); hubOpenDialog('hub-search-dialog', '#hub-search-input'); }
                if (event.key === 'Escape') document.querySelectorAll('.hub-dialog-backdrop:not([hidden])').forEach(dialog => { dialog.hidden = true; });
            });
        }
        document.addEventListener('DOMContentLoaded', hubInit);

        // --- Avvio al caricamento ---
        document.addEventListener("DOMContentLoaded", () => {
            window.loadMyBuildsUI();
            window.updateARPGStats();
            
            // Simula il click sul primo tab per caricare Path of Exile 1 all'avvio
            const firstTab = document.querySelector('.tab-btn');
            if(firstTab) {
                firstTab.click();
            }
        });