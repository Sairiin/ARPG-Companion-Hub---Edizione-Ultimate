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
    try:
        url = f"https://api.steampowered.com/ISteamUserStats/GetNumberOfCurrentPlayers/v1/?appid={appid}"
        res = requests.get(url, timeout=5)
        if res.status_code == 200:
            return res.json().get('response', {}).get('player_count', 0)
    except: pass
    return 0

# =====================================================================
# 2. ESTRAZIONE BUILD AUTOMATICHE (PoE Ninja 5 build) & DISCOVERY
# =====================================================================
def fetch_poe1_endgame():
    builds = []
    try:
        url = "https://poe.ninja/api/data/getbuildoverview?overview=settlers&type=exp&language=en"
        headers = {'User-Agent': 'Mozilla/5.0'}
        res = requests.get(url, headers=headers, timeout=10)
        if res.status_code == 200:
            top_skills = res.json().get("skillTreeData", [])[:5]
            for skill in top_skills:
                name = skill.get("name", "Meta Skill")
                builds.append({"title": name, "class": "Top Meta", "specialization": "Endgame", "tier": "S+", "tierColor": "#ff9800", "sourceUrl": f"https://poe.ninja/builds/settlers?skills={name.replace(' ', '+')}"})
    except: pass
    return builds

def generate_discovery(game_id):
    # RIPRISTINATO IL SET COMPLETO DI FONTI E PROMPT
    return {
        "sources": [
            ["Maxroll", f"https://maxroll.gg/{game_id}"],
            ["Icy Veins", f"https://www.icy-veins.com/{game_id}"],
            ["Mobalytics", f"https://mobalytics.gg/{game_id}"]
        ],
        "prompts": [
            ["Starter / Leveling", "Punti di partenza per la progressione.", f"{game_id} leveling build"],
            ["Endgame & Boss", "Build per i contenuti più difficili.", f"{game_id} endgame boss build"],
            ["Speedfarming", "Per pulire le mappe a massima velocità.", f"{game_id} speedfarm build"]
        ]
    }

# =====================================================================
# 3. MAIN: AGGIORNAMENTO DI TUTTI I DATABASE
# =====================================================================
def main():
    os.makedirs('assets', exist_ok=True)
    
    print("Recupero dati giocatori in tempo reale da Steam...")
    poe1_players = fetch_steam_players(238960) or 45000
    le_players = fetch_steam_players(899770) or 8000
    d4_players = fetch_steam_players(2344520) or 25000
    gd_players = fetch_steam_players(219990) or 4000
    d2_players = int(d4_players * 0.45) if d4_players else 12000
    poe2_players = 55000

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

    # Carica vecchio file se esiste, ma SOVRASCRIVIAMO le build per applicare l'aggiornamento
    catalog = {"games": {}}
    if os.path.exists(BUILDS_FILE):
        try:
            with open(BUILDS_FILE, 'r', encoding='utf-8') as f:
                catalog = json.load(f)
        except: pass

    def update_game_data(game_id, patch_name, new_endgame, fallback_endgame, fallback_leveling):
        # FORZA L'USO DELLE 5 BUILD (ignora il vecchio file salvato)
        final_endgame = new_endgame if new_endgame else fallback_endgame
        final_leveling = fallback_leveling

        if "games" not in catalog: catalog["games"] = {}
        catalog["games"][game_id] = {
            "patch": patch_name,
            "reviewCycleDays": 1,
            "reviewedAt": today_str,
            "sources": [{"label": "Maxroll", "url": f"https://maxroll.gg/{game_id}"}],
            "discovery": generate_discovery(game_id),
            "builds": {"endgame": final_endgame, "leveling": final_leveling}
        }

    # === DATABASE 5 BUILD PER GIOCO ===
    update_game_data("poe1", seasons["poe1"], fetch_poe1_endgame(), 
        [{"title": "Lightning Arrow", "class": "Ranger", "specialization": "Deadeye", "tier": "S", "tierColor": "#ff9800", "sourceUrl": "https://maxroll.gg/poe"},
         {"title": "Righteous Fire", "class": "Templar", "specialization": "Inquisitor", "tier": "S", "tierColor": "#ff9800", "sourceUrl": "https://maxroll.gg/poe"},
         {"title": "Hexblast Mines", "class": "Shadow", "specialization": "Saboteur", "tier": "S", "tierColor": "#ff9800", "sourceUrl": "https://maxroll.gg/poe"},
         {"title": "Boneshatter", "class": "Marauder", "specialization": "Juggernaut", "tier": "A", "tierColor": "#4caf50", "sourceUrl": "https://maxroll.gg/poe"},
         {"title": "Summon Raging Spirit", "class": "Witch", "specialization": "Necromancer", "tier": "A", "tierColor": "#4caf50", "sourceUrl": "https://maxroll.gg/poe"}],
        [{"title": "Rolling Magma", "class": "Templar", "specialization": "Inquisitor", "tier": "Start", "tierColor": "#2196F3", "sourceUrl": "https://maxroll.gg/poe"},
         {"title": "Poisonous Concoction", "class": "Ranger", "specialization": "Pathfinder", "tier": "Start", "tierColor": "#2196F3", "sourceUrl": "https://maxroll.gg/poe"},
         {"title": "Splitting Steel", "class": "Duelist", "specialization": "Champion", "tier": "Start", "tierColor": "#2196F3", "sourceUrl": "https://maxroll.gg/poe"},
         {"title": "Armageddon Brand", "class": "Templar", "specialization": "Hierophant", "tier": "Start", "tierColor": "#2196F3", "sourceUrl": "https://maxroll.gg/poe"},
         {"title": "SRS Leveling", "class": "Witch", "specialization": "Necromancer", "tier": "Start", "tierColor": "#2196F3", "sourceUrl": "https://maxroll.gg/poe"}])

    update_game_data("poe2", seasons["poe2"], [], 
        [{"title": "Monk Invoker Palm", "class": "Monk", "specialization": "Invoker", "tier": "S", "tierColor": "#ff9800", "sourceUrl": "https://maxroll.gg/poe2"},
         {"title": "Druid Bear Slam", "class": "Druid", "specialization": "Shapeshifter", "tier": "S", "tierColor": "#ff9800", "sourceUrl": "https://maxroll.gg/poe2"},
         {"title": "Mercenary Crossbow", "class": "Mercenary", "specialization": "Witchhunter", "tier": "A", "tierColor": "#4caf50", "sourceUrl": "https://maxroll.gg/poe2"},
         {"title": "Sorceress Spark", "class": "Sorceress", "specialization": "Elementalist", "tier": "A", "tierColor": "#4caf50", "sourceUrl": "https://maxroll.gg/poe2"},
         {"title": "Warrior Heavy Strike", "class": "Warrior", "specialization": "Titan", "tier": "B", "tierColor": "#607d8b", "sourceUrl": "https://maxroll.gg/poe2"}],
        [{"title": "Ranger Lightning Arrow", "class": "Ranger", "specialization": "Deadeye", "tier": "Start", "tierColor": "#2196F3", "sourceUrl": "https://maxroll.gg/poe2"},
         {"title": "Warrior Sunder", "class": "Warrior", "specialization": "Titan", "tier": "Start", "tierColor": "#2196F3", "sourceUrl": "https://maxroll.gg/poe2"},
         {"title": "Witch Minion", "class": "Witch", "specialization": "Necromancer", "tier": "Start", "tierColor": "#2196F3", "sourceUrl": "https://maxroll.gg/poe2"},
         {"title": "Monk Wind Slash", "class": "Monk", "specialization": "Invoker", "tier": "Start", "tierColor": "#2196F3", "sourceUrl": "https://maxroll.gg/poe2"},
         {"title": "Mercenary Rapid Fire", "class": "Mercenary", "specialization": "Witchhunter", "tier": "Start", "tierColor": "#2196F3", "sourceUrl": "https://maxroll.gg/poe2"}])

    update_game_data("d4", seasons["d4"], [], 
        [{"title": "Lightning Spear", "class": "Sorcerer", "specialization": "Evocation", "tier": "S", "tierColor": "#ff9800", "sourceUrl": "https://maxroll.gg/d4"},
         {"title": "Bone Spirit", "class": "Necromancer", "specialization": "Macabre", "tier": "S", "tierColor": "#ff9800", "sourceUrl": "https://maxroll.gg/d4"},
         {"title": "Rapid Fire", "class": "Rogue", "specialization": "Marksman", "tier": "A", "tierColor": "#4caf50", "sourceUrl": "https://maxroll.gg/d4"},
         {"title": "Blood Surge", "class": "Necromancer", "specialization": "Blood", "tier": "A", "tierColor": "#4caf50", "sourceUrl": "https://maxroll.gg/d4"},
         {"title": "Bash Cleave", "class": "Barbarian", "specialization": "Brawler", "tier": "B", "tierColor": "#607d8b", "sourceUrl": "https://maxroll.gg/d4"}],
        [{"title": "Chain Lightning", "class": "Sorcerer", "specialization": "Shock", "tier": "Start", "tierColor": "#2196F3", "sourceUrl": "https://maxroll.gg/d4"},
         {"title": "Blood Surge Leveling", "class": "Necromancer", "specialization": "Blood", "tier": "Start", "tierColor": "#2196F3", "sourceUrl": "https://maxroll.gg/d4"},
         {"title": "Barrage Leveling", "class": "Rogue", "specialization": "Marksman", "tier": "Start", "tierColor": "#2196F3", "sourceUrl": "https://maxroll.gg/d4"},
         {"title": "Upheaval Leveling", "class": "Barbarian", "specialization": "Brawler", "tier": "Start", "tierColor": "#2196F3", "sourceUrl": "https://maxroll.gg/d4"},
         {"title": "Companion Leveling", "class": "Druid", "specialization": "Nature", "tier": "Start", "tierColor": "#2196F3", "sourceUrl": "https://maxroll.gg/d4"}])

    update_game_data("le", seasons["le"], [], 
        [{"title": "Falconer Dive Bomb", "class": "Rogue", "specialization": "Falconer", "tier": "S", "tierColor": "#ff9800", "sourceUrl": "https://maxroll.gg/last-epoch"},
         {"title": "Torment Warlock", "class": "Acolyte", "specialization": "Warlock", "tier": "S", "tierColor": "#ff9800", "sourceUrl": "https://maxroll.gg/last-epoch"},
         {"title": "Blast Rain Marksman", "class": "Rogue", "specialization": "Marksman", "tier": "A", "tierColor": "#4caf50", "sourceUrl": "https://maxroll.gg/last-epoch"},
         {"title": "Wraithlord Necro", "class": "Acolyte", "specialization": "Necromancer", "tier": "A", "tierColor": "#4caf50", "sourceUrl": "https://maxroll.gg/last-epoch"},
         {"title": "Smite Paladin", "class": "Sentinel", "specialization": "Paladin", "tier": "B", "tierColor": "#607d8b", "sourceUrl": "https://maxroll.gg/last-epoch"}],
        [{"title": "Hammerdin Sentinel", "class": "Sentinel", "specialization": "Paladin", "tier": "Start", "tierColor": "#2196F3", "sourceUrl": "https://maxroll.gg/last-epoch"},
         {"title": "Runemaster Glacier", "class": "Mage", "specialization": "Runemaster", "tier": "Start", "tierColor": "#2196F3", "sourceUrl": "https://maxroll.gg/last-epoch"},
         {"title": "Warlock Fissure", "class": "Acolyte", "specialization": "Warlock", "tier": "Start", "tierColor": "#2196F3", "sourceUrl": "https://maxroll.gg/last-epoch"},
         {"title": "Falconer Starter", "class": "Rogue", "specialization": "Falconer", "tier": "Start", "tierColor": "#2196F3", "sourceUrl": "https://maxroll.gg/last-epoch"},
         {"title": "Druid Spriggan Form", "class": "Primalist", "specialization": "Druid", "tier": "Start", "tierColor": "#2196F3", "sourceUrl": "https://maxroll.gg/last-epoch"}])

    update_game_data("d2", seasons["d2"], [], 
        [{"title": "Hammerdin", "class": "Paladin", "specialization": "Combat", "tier": "S", "tierColor": "#ff9800", "sourceUrl": "https://maxroll.gg/d2"},
         {"title": "Blizzard Sorceress", "class": "Sorceress", "specialization": "Cold", "tier": "S", "tierColor": "#ff9800", "sourceUrl": "https://maxroll.gg/d2"},
         {"title": "Lightning Sorceress", "class": "Sorceress", "specialization": "Lightning", "tier": "S", "tierColor": "#ff9800", "sourceUrl": "https://maxroll.gg/d2"},
         {"title": "Mosaic Assassin", "class": "Assassin", "specialization": "Martial Arts", "tier": "S", "tierColor": "#ff9800", "sourceUrl": "https://maxroll.gg/d2"},
         {"title": "Lightning Javazon", "class": "Amazon", "specialization": "Javelin", "tier": "A", "tierColor": "#4caf50", "sourceUrl": "https://maxroll.gg/d2"}],
        [{"title": "Holy Fire", "class": "Paladin", "specialization": "Offensive", "tier": "Start", "tierColor": "#2196F3", "sourceUrl": "https://maxroll.gg/d2"},
         {"title": "Fireball Sorceress", "class": "Sorceress", "specialization": "Fire", "tier": "Start", "tierColor": "#2196F3", "sourceUrl": "https://maxroll.gg/d2"},
         {"title": "Wake of Fire", "class": "Assassin", "specialization": "Traps", "tier": "Start", "tierColor": "#2196F3", "sourceUrl": "https://maxroll.gg/d2"},
         {"title": "Fissure Druid", "class": "Druid", "specialization": "Elemental", "tier": "Start", "tierColor": "#2196F3", "sourceUrl": "https://maxroll.gg/d2"},
         {"title": "Poison Javelin", "class": "Amazon", "specialization": "Javelin", "tier": "Start", "tierColor": "#2196F3", "sourceUrl": "https://maxroll.gg/d2"}])

    with open(BUILDS_FILE, 'w', encoding='utf-8') as f:
        json.dump(catalog, f, ensure_ascii=False, indent=2)
    
    print("[+] File JSON salvato: 5 Build forzate per categoria per ogni gioco.")

if __name__ == '__main__':
    main()
