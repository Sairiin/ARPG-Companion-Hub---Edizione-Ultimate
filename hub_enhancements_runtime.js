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
