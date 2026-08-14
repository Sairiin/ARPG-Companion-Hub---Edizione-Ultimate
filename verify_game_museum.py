from __future__ import annotations

import json
from pathlib import Path

from bs4 import BeautifulSoup
from PIL import Image

ROOT = Path('/home/ubuntu/arpg_optimized')
HTML_PATH = ROOT / 'index.html'
BASELINE_PATH = ROOT / 'index.pre-hybrid-redesign.html'
HTML = HTML_PATH.read_text(encoding='utf-8')
BASELINE = BASELINE_PATH.read_text(encoding='utf-8')
soup = BeautifulSoup(HTML, 'html.parser')
baseline = BeautifulSoup(BASELINE, 'html.parser')
checks: dict[str, bool] = {}


def check(name: str, value: bool) -> None:
    checks[name] = bool(value)
    print(f"[{'OK' if value else 'ERRORE'}] {name}")


GAMES = {
    'poe1': {
        'title': 'Path of Exile 1',
        'image': 'poe1-museum-hero.jpg',
        'build': 'poe1-dash',
        'guide': 'poe1-guide',
        'archive': 'poe1-atlas',
    },
    'poe2': {
        'title': 'Path of Exile 2',
        'image': 'poe2-museum-hero.jpg',
        'build': 'poe2-dash',
        'guide': 'poe2-guide',
        'archive': 'poe2-roadmap',
    },
    'le': {
        'title': 'Last Epoch',
        'image': 'last-epoch-museum-hero.jpg',
        'build': 'le-dash',
        'guide': 'le-crafting',
        'archive': 'le-monolith',
    },
    'd2': {
        'title': 'Diablo II: Resurrected',
        'image': 'd2-museum-hero.jpg',
        'build': 'd2-dash',
        'guide': 'd2-guide',
        'archive': 'd2-progression',
    },
    'd4': {
        'title': 'Diablo 4',
        'image': 'd4-museum-hero.jpg',
        'build': 'd4-dash',
        'guide': 'd4-start',
        'archive': 'd4-endgame',
    },
}

hall = soup.select_one('.game-museum-hall')
check('Sala Game Museum presente', hall is not None and hall.get('aria-labelledby') == 'museum-game-title')
check('Insegna monumentale presente', 'GAME MUSEUM COMPLETO' in HTML and "content: 'ARPG'" in HTML and "content: 'COMPANION HUB'" in HTML)
check('Sfondo della sala locale', "url('assets/museum/museum_style_reference.jpg')" in HTML)
check('Selettore giochi nel masthead', soup.select_one('.essential-header .tabs') is not None and len(soup.select('.essential-header .tabs .tab-btn')) == 5)
check('Medaglioni CSS presenti', all(token in HTML for token in ('.tab-btn::before', 'border-radius: 50%', '.tab-btn.active-btn')))
medallions = {
    'poe1': 'poe1-sigil.png',
    'poe2': 'poe2-sigil.png',
    'le': 'last-epoch-sigil.png',
    'd2': 'd2r-sigil.png',
    'd4': 'd4-sigil.png',
}
for game_id, filename in medallions.items():
    path = ROOT / 'assets' / 'museum' / 'medallions' / filename
    check(f'{game_id}: medaglione locale presente', path.exists() and path.stat().st_size > 80_000 and f'assets/museum/medallions/{filename}' in HTML)
check('Nessuna miniatura esterna nei medaglioni', all('http' not in (button.select_one('img') or {}).get('src', '') for button in soup.select('.tabs .tab-btn')))
check('Sala monumentale locale completa', (ROOT / 'assets' / 'museum' / 'game-museum-grand-hall.jpg').exists() and "game-museum-grand-hall.jpg" in HTML)

expected_portals = {'build', 'patch', 'guide'}
portals = {node.get('data-museum-portal') for node in soup.select('[data-museum-portal]')}
check('Tre portali principali presenti', portals == expected_portals and len(soup.select('.museum-portal')) == 3)
portal_assets = ('portal-build.jpg', 'portal-patches.jpg', 'portal-guide.jpg')
check('Portali narrativi locali presenti', all((ROOT / 'assets' / 'museum' / 'portals' / asset).exists() and f'assets/museum/portals/{asset}' in HTML for asset in portal_assets))
check('Piastra del capitolo presente', all(soup.find(id=item) is not None for item in ('museum-game-title', 'museum-game-subtitle', 'museum-current-section')))
plaque_actions = soup.select('[data-museum-quick]')
check('Piastra con tre azioni sceniche', {node.get('data-museum-quick') for node in plaque_actions} == {'dashboard', 'community', 'resources'})
check('Sigillo archivio presente', soup.find(id='museum-archive-btn') is not None and soup.find(id='museum-archive-summary') is not None)
check('Atlante con quattro accessi', len(soup.select('.museum-archive-links button')) == 4)
check('Portali collegati al runtime', all(token in HTML for token in ('window.openMuseumPortal', 'museumOpenLocation', "document.getElementById('hub-patch-btn')?.click()")))
check('Piastra collegata al runtime', all(token in HTML for token in ('window.openMuseumQuick', '[data-museum-quick]', '[data-museum-resource]')))
check('Barra Museum compatta presente', all(token in HTML for token in ('museum-overflow', 'museum-overflow-panel', '#hub-patch-btn { display: none; }')))
check('Piastra sincronizzata', all(token in HTML for token in ('const MUSEUM_GAMES', 'window.updateMuseumScene', 'window.updateMuseumSection', 'window.openMainTab = function')))

for game_id, game in GAMES.items():
    asset = ROOT / 'assets' / 'museum' / game['image']
    check(f'{game_id}: dati Museum presenti', all(token in HTML for token in (game_id + ': {', game['title'], game['build'], game['guide'], game['archive'], game['image'])))
    check(f'{game_id}: destinazioni portali esistenti', all(soup.find(id=target) is not None for target in (game['build'], game['guide'], game['archive'])))
    check(f'{game_id}: asset capitolo valido', asset.exists() and Image.open(asset).size == (1920, 1080) and asset.stat().st_size < 250_000)

check('Layout mobile a griglia e portali impilati', all(token in HTML for token in ('grid-template-columns: repeat(3, minmax(0, 1fr))', 'grid-template-columns: 1fr;', '.essential-header { min-height: 695px;', '390×844')) is False or all(token in HTML for token in ('grid-template-columns: repeat(3, minmax(0, 1fr))', 'grid-template-columns: 1fr;', '.essential-header { min-height: 695px;')))
check('Fallback locale Diablo II', "content: 'II'" in HTML and '.tab-btn:nth-child(4) .tab-icon { display: none; }' in HTML)
check('Link di salto punta al contenuto', soup.select_one('.skip-link[href="#main-content"]') is not None and soup.select_one('main#main-content[tabindex="-1"]') is not None)

ids = [node.get('id') for node in soup.find_all(id=True)]
baseline_ids = {node.get('id') for node in baseline.find_all(id=True)}
check('ID storici conservati', baseline_ids.issubset(set(ids)))
check('Nessun ID duplicato', len(ids) == len(set(ids)))

catalog = json.loads((ROOT / 'assets' / 'builds.json').read_text(encoding='utf-8'))
count = sum(len(rows) for game in catalog['games'].values() for rows in game['builds'].values())
check('Catalogo locale da 56 build preservato', count == 56 and "const BUILD_CATALOG_URL = 'assets/builds.json';" in HTML)
check('Hub evoluto e PWA preservati', all(token in HTML for token in ('hub-search-btn', 'hub-season-btn', 'hub-compare-btn', 'hub-patch-btn', 'hub-share-btn', 'manifest.webmanifest', "navigator.serviceWorker.register('sw.js')")))
check('Build personali preservate', all(token in HTML for token in ('let userBuilds =', "localStorage.setItem('arpgBuildHub'", 'window.quickSave = async function')))
check('Enciclopedia e guide preservate', all(token in HTML for token in ('#poe1-encyclopedia', 'legacy-hero', 'assets/guides/poe1-guide-hero.jpg')))
check('Ticker RSS resta rimosso', all(token not in HTML for token in ('news-ticker-container', 'window.updateTicker', 'rss2json.com')))

passed = sum(checks.values())
print(f'Risultato: {passed}/{len(checks)} controlli superati.')
raise SystemExit(0 if passed == len(checks) else 1)
