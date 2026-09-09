import json
import requests
from bs4 import BeautifulSoup
from datetime import datetime
import os
import re

BUILDS_FILE = 'assets/builds.json'
PATCHES_FILE = 'assets/patches.json'
RANKINGS_FILE = 'assets/rankings.json'
today_str = datetime.utcnow().strftime('%Y-%m-%d')

# =====================================================================
# 1. SCRAPING ARPG TIMELINE E STEAM API
# =====================================================================
def fetch_arpg_timeline_season(game_key, fallback_name):
    mapping = {
        "poe1": "path-of-exile",
        "poe2": "path-of-exile2",
        "d4": "diablo-iv",
        "d2": "diablo-ii-resurrected",
        "le": "last-epoch"
    }
    slug = mapping.get(game_key)
    if not slug: return fallback_name

    try:
        url = f"https://www.arpg-timeline.com/game/{slug}"
        headers = {'User-Agent': 'Mozilla/5.0'}
        res = requests.get(url, headers=headers, timeout=8)
        if res.status_code == 200:
            soup = BeautifulSoup(res.text, 'html.parser')
            text_content = soup.get_text()
            if game_key == "poe2":
                season_match = re.search(r'(0\.5\.5\s*-\s*The Forbidden Rites Event)', text_content, re.IGNORECASE)
                season_name = season_match.group(1) if season_match else "0.5.5 The Forbidden Rites"
                days_left = (datetime(2026, 12, 11) - datetime.utcnow()).days
                if days_left > 0: return f"{season_name} (Termina tra {days_left}g)"
                return season_name

            season_match = re.search(r'Current Season:\s*([^\n\r]+)', text_content, re.IGNORECASE)
            if season_match: return season_match.group(1).strip()
    except: pass
    return fallback_name

def fetch_steam_players(appid):
    """Interroga l'API pubblica di Steam per il numero di giocatori attuali"""
    try:
        url = f"https://api.steampowered.com/ISteamUserStats/GetNumberOfCurrentPlayers/v1/?appid={appid}"
        res = requests.get(url, timeout=5)
        if res.status_code == 200:
            return res.json().get('response', {}).get('player_count', 0)
    except: pass
    return 0

# =====================================================================
# 2. ESTRAZIONE BUILD AUTOMATICHE
# =====================================================================
def fetch_poe1_endgame():
    builds = []
    try:
        url = "https://poe.ninja/api/data/getbuildoverview?overview=settlers&type=exp&language=en"
        headers = {'User-Agent': 'Mozilla/5.0'}
        res = requests.get(url, headers=headers, timeout=10)
        if res.status_code == 200:
            top_skills = res.json().get("skillTreeData", [])[:3]
            for skill in top_skills:
                name = skill.get("name", "Meta Skill")
                builds.append({"title": name, "class": "Meta", "specialization": "Endgame", "tier": "S+", "tierColor": "#ff9800", "sourceUrl": f"https://poe.ninja/builds/settlers?skills={name.replace(' ', '+')}"})
    except: pass
    return builds

def generate_discovery(game_id):
    return {
        "sources": [["Maxroll", f"https://maxroll.gg/{game_id}"], ["Mobalytics", f"https://mobalytics.gg/{game_id}"]],
        "prompts": [["Starter", "Punti di partenza.", f"{game_id} leveling"], ["Endgame", "Build avanzate.", f"{game_id} endgame"]]
    }

# =====================================================================
# 3. MAIN: AGGIORNAMENTO DI TUTTI I DATABASE
# =====================================================================
def main():
    os.makedirs('assets', exist_ok=True)
    
    # ---------------------------------------------------------
    # A. GENERAZIONE DELLE STATISTICHE LIVE (STEAM API)
    # ---------------------------------------------------------
    print("Recupero dati giocatori in tempo reale da Steam...")
    poe1_players = fetch_steam_players(238960) or 45000
    le_players = fetch_steam_players(899770) or 8000
    d4_players = fetch_steam_players(2344520) or 25000
    gd_players = fetch_steam_players(219990) or 4000
    d2_players = int(d4_players * 0.45) if d4_players else 12000 # Stima per gioco Bnet
    poe2_players = 55000 # Hype Beta Stima

    rankings = [
        {"name": "Path of Exile 1", "players": poe1_players, "color": "#4caf50"},
        {"name": "Diablo 4 (Steam)", "players": d4_players, "color": "#f44336"},
        {"name": "Last Epoch", "players": le_players, "color": "#9c27b0"},
        {"name": "Diablo 2: Res (Stima BNet)", "players": d2_players, "color": "#607d8b"},
        {"name": "Path of Exile 2 (Beta)", "players": poe2_players, "color": "#ff9800"},
        {"name": "Grim Dawn", "players": gd_players, "color": "#a1887f"}
    ]
    rankings.sort(key=lambda x: x['players'], reverse=True)
    
    with open(RANKINGS_FILE, 'w', encoding='utf-8') as f:
        json.dump({"rankings": rankings}, f, ensure_ascii=False, indent=2)

    # ---------------------------------------------------------
    # B. GESTIONE STAGIONI E PATCHES
    # ---------------------------------------------------------
    seasons = {
        "poe1": fetch_arpg_timeline_season("poe1", "Lega 3.29 Curse of the Allflame"),
        "poe2": fetch_arpg_timeline_season("poe2", "0.5.5 - The Forbidden Rites Event"),
        "d4": fetch_arpg_timeline_season("d4", "Stagione 7"),
        "le": fetch_arpg_timeline_season("le", "Season 4"),
        "d2": fetch_arpg_timeline_season("d2", "Ladder Stagione 14")
    }

    patches_db = {"games": {}}
    for game, season in seasons.items():
        patches_db["games"][game] = {
            "currentPatch": season,
            "changes": [f"Estrazione automatica stagione attiva completata il {today_str}.", "Le modifiche di bilanciamento dettagliate sono disponibili sul sito ufficiale."],
            "sourceUrl": f"https://www.arpg-timeline.com/game/{'path-of-exile' if 'poe' in game else 'diablo-iv'}",
            "sourceLabel": "Consulta aRPG Timeline"
        }
    
    with open(PATCHES_FILE, 'w', encoding='utf-8') as f:
        json.dump(patches_db, f, ensure_ascii=False, indent=2)

    # ---------------------------------------------------------
    # C. AGGIORNAMENTO BUILDS
    # ---------------------------------------------------------
    catalog = {"games": {}}
    if os.path.exists(BUILDS_FILE):
        try:
            with open(BUILDS_FILE, 'r', encoding='utf-8') as f:
                catalog = json.load(f)
        except: pass

    def update_game_data(game_id, patch_name, new_endgame, fallback_endgame, fallback_leveling):
        old_endgame = catalog.get("games", {}).get(game_id, {}).get("builds", {}).get("endgame", [])
        old_leveling = catalog.get("games", {}).get(game_id, {}).get("builds", {}).get("leveling", [])
        
        final_endgame = new_endgame if new_endgame else (old_endgame if old_endgame else fallback_endgame)
        final_leveling = old_leveling if old_leveling else fallback_leveling

        if "games" not in catalog: catalog["games"] = {}
        catalog["games"][game_id] = {
            "patch": patch_name,
            "reviewCycleDays": 1,
            "reviewedAt": today_str,
            "sources": [{"label": "Maxroll", "url": f"https://maxroll.gg/{game_id}"}],
            "discovery": generate_discovery(game_id),
            "builds": {"endgame": final_endgame, "leveling": final_leveling}
        }

    update_game_data("poe1", seasons["poe1"], fetch_poe1_endgame(), [{"title": "Lightning Arrow", "class": "Ranger", "specialization": "Deadeye", "tier": "S", "tierColor": "#ff9800", "sourceUrl": "https://maxroll.gg/poe"}], [{"title": "Rolling Magma", "class": "Templar", "specialization": "Inquisitor", "tier": "Leveling", "tierColor": "#2196F3", "sourceUrl": "https://maxroll.gg/poe"}])
    update_game_data("poe2", seasons["poe2"], [], [{"title": "Monk Invoker", "class": "Monk", "specialization": "Invoker", "tier": "S", "tierColor": "#ff9800", "sourceUrl": "https://maxroll.gg/poe2"}], [{"title": "Ranger Starter", "class": "Ranger", "specialization": "Deadeye", "tier": "Leveling", "tierColor": "#2196F3", "sourceUrl": "https://maxroll.gg/poe2"}])
    update_game_data("d4", seasons["d4"], [], [{"title": "Lightning Spear", "class": "Sorcerer", "specialization": "Evocation", "tier": "S", "tierColor": "#ff9800", "sourceUrl": "https://maxroll.gg/d4"}], [{"title": "Chain Lightning", "class": "Sorcerer", "specialization": "Leveling", "tier": "Leveling", "tierColor": "#2196F3", "sourceUrl": "https://maxroll.gg/d4"}])
    update_game_data("le", seasons["le"], [], [{"title": "Falconer Dive Bomb", "class": "Rogue", "specialization": "Falconer", "tier": "S", "tierColor": "#ff9800", "sourceUrl": "https://maxroll.gg/last-epoch"}], [{"title": "Hammerdin Sentinel", "class": "Sentinel", "specialization": "Paladin", "tier": "Leveling", "tierColor": "#2196F3", "sourceUrl": "https://maxroll.gg/last-epoch"}])
    update_game_data("d2", seasons["d2"], [], [{"title": "Hammerdin", "class": "Paladin", "specialization": "Blessed Aim", "tier": "S", "tierColor": "#ff9800", "sourceUrl": "https://maxroll.gg/d2"}], [{"title": "Holy Fire", "class": "Paladin", "specialization": "Fire", "tier": "Leveling", "tierColor": "#2196F3", "sourceUrl": "https://maxroll.gg/d2"}])

    with open(BUILDS_FILE, 'w', encoding='utf-8') as f:
        json.dump(catalog, f, ensure_ascii=False, indent=2)
    
    print("[+] File JSON multipli salvati e aggiornati con successo!")

if __name__ == '__main__':
    main()
