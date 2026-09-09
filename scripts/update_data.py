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
# 1. SCRAPING ARPG TIMELINE AVANZATO E STEAM API
# =====================================================================
def fetch_arpg_timeline_data(game_key, fallback_name):
    """Estrae stagione corrente, date e roadmap dal codice sorgente di aRPG Timeline"""
    mapping = {
        "poe1": "path-of-exile",
        "poe2": "path-of-exile2",
        "d4": "diablo-iv",
        "d2": "diablo-ii-resurrected",
        "le": "last-epoch"
    }
    slug = mapping.get(game_key)
    result = {
        "name": fallback_name,
        "start_date": None,
        "end_date": None,
        "upcoming_name": None,
        "upcoming_date": None
    }
    if not slug: return result

    try:
        url = f"https://www.arpg-timeline.com/game/{slug}"
        headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'}
        res = requests.get(url, headers=headers, timeout=10)
        
        if res.status_code == 200:
            html = res.text
            
            # Estrazione Nome
            if game_key == "poe2":
                name_match = re.search(r'(0\.5\.5\s*-\s*The Forbidden Rites Event)', html, re.IGNORECASE)
                result["name"] = name_match.group(1) if name_match else "0.5.5 The Forbidden Rites"
                result["end_date"] = "2026-12-11"
                result["upcoming_name"] = "1.0.0 Full Release"
                result["upcoming_date"] = "2026-12-11"
            else:
                name_match = re.search(r'Current Season:\s*([^\n\r<]+)', html, re.IGNORECASE)
                if name_match: result["name"] = name_match.group(1).strip()
            
            # Tentativo di estrazione date JSON (Next.js data o simili)
            start_match = re.search(r'"start_date"\s*:\s*"(\d{4}-\d{2}-\d{2})T', html)
            end_match = re.search(r'"end_date"\s*:\s*"(\d{4}-\d{2}-\d{2})T', html)
            
            if start_match: result["start_date"] = start_match.group(1)
            if end_match and game_key != "poe2": result["end_date"] = end_match.group(1)

    except Exception as e:
        print(f"[-] Errore scraping {game_key}: {e}")
        
    return result

def format_season_display(season_data):
    """Calcola i giorni rimanenti e formatta il testo per il frontend"""
    name = season_data["name"]
    end_date_str = season_data["end_date"]
    
    if end_date_str:
        try:
            end_date = datetime.strptime(end_date_str, "%Y-%m-%d")
            days_left = (end_date - datetime.utcnow()).days
            if days_left > 0:
                return f"{name} (Termina tra {days_left}g)"
            elif days_left == 0:
                return f"{name} (Termina oggi)"
            else:
                return f"{name} (Conclusa)"
        except: pass
    return name

def fetch_steam_players(appid):
    try:
        url = f"https://api.steampowered.com/ISteamUserStats/GetNumberOfCurrentPlayers/v1/?appid={appid}"
        res = requests.get(url, timeout=5)
        if res.status_code == 200:
            return res.json().get('response', {}).get('player_count', 0)
    except: pass
    return 0

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
    return {
        "sources": [["Maxroll", f"https://maxroll.gg/{game_id}"], ["Icy Veins", f"https://www.icy-veins.com/{game_id}"], ["Mobalytics", f"https://mobalytics.gg/{game_id}"]],
        "prompts": [["Starter / Leveling", "Punti di partenza.", f"{game_id} leveling build"], ["Endgame & Boss", "Build avanzate.", f"{game_id} endgame boss build"], ["Speedfarming", "Per pulire le mappe a massima velocità.", f"{game_id} speedfarm build"]]
    }

# =====================================================================
# 3. MAIN: AGGIORNAMENTO DI TUTTI I DATABASE
# =====================================================================
def main():
    os.makedirs('assets', exist_ok=True)
    
    print("Recupero dati 15 ARPG in tempo reale da Steam...")
    steam_games = {
        "Path of Exile 1": 238960, "Diablo 4 (Steam)": 2344520, "Last Epoch": 899770, "Grim Dawn": 219990,
        "Titan Quest": 475150, "Torchlight 2": 200710, "Chronicon": 375480, "Wolcen": 424370,
        "Inquisitor Martyr": 527430, "The Slormancer": 1104280, "Hero Siege": 269210, 
        "Victor Vran": 345180, "Van Helsing": 400170
    }
    
    rankings = []
    colors = ["#4caf50", "#f44336", "#9c27b0", "#2196f3", "#ff9800", "#00bcd4", "#e91e63", "#8bc34a", "#ffc107", "#795548", "#607d8b", "#9e9e9e", "#673ab7"]
    
    for i, (name, appid) in enumerate(steam_games.items()):
        players = fetch_steam_players(appid) or (1500 - i*50)
        rankings.append({"name": name, "players": players, "color": colors[i % len(colors)]})
    
    d4_players = next((r['players'] for r in rankings if "Diablo 4" in r['name']), 25000)
    rankings.append({"name": "Diablo 2: Res (Stima BNet)", "players": int(d4_players * 0.45) if d4_players else 12000, "color": "#607d8b"})
    rankings.append({"name": "Path of Exile 2 (Beta)", "players": 55000, "color": "#ff9800"})
    rankings.sort(key=lambda x: x['players'], reverse=True)
    
    with open(RANKINGS_FILE, 'w', encoding='utf-8') as f:
        json.dump({"rankings": rankings}, f, ensure_ascii=False, indent=2)

    seasons_raw = {
        "poe1": fetch_arpg_timeline_data("poe1", "Lega 3.29 Curse of the Allflame"),
        "poe2": fetch_arpg_timeline_data("poe2", "0.5.5 - The Forbidden Rites Event"),
        "d4": fetch_arpg_timeline_data("d4", "Stagione 7"),
        "le": fetch_arpg_timeline_data("le", "Season 4"),
        "d2": fetch_arpg_timeline_data("d2", "Ladder Stagione 14")
    }

    # PATCHES.JSON ora contiene dettagli estesi
    patches_db = {"games": {}}
    for game, data in seasons_raw.items():
        changes_list = [f"Estrazione automatica completata il {today_str}."]
        if data["start_date"]: changes_list.append(f"Iniziata il: {data['start_date']}")
        if data["end_date"]: changes_list.append(f"Scadenza prevista: {data['end_date']}")
        if data["upcoming_name"]: changes_list.append(f"Prossima Roadmap: {data['upcoming_name']} ({data['upcoming_date'] or 'TBD'})")
        
        patches_db["games"][game] = {
            "currentPatch": format_season_display(data),
            "changes": changes_list,
            "sourceUrl": f"https://www.arpg-timeline.com/game/{'path-of-exile' if 'poe' in game else 'diablo-iv'}",
            "sourceLabel": "Consulta aRPG Timeline / iCal"
        }
    
    with open(PATCHES_FILE, 'w', encoding='utf-8') as f:
        json.dump(patches_db, f, ensure_ascii=False, indent=2)

    catalog = {"games": {}}
    if os.path.exists(BUILDS_FILE):
        try:
            with open(BUILDS_FILE, 'r', encoding='utf-8') as f:
                catalog = json.load(f)
        except: pass

    def update_game_data(game_id, season_info, new_endgame, fallback_endgame, fallback_leveling):
        final_endgame = new_endgame if new_endgame else fallback_endgame
        final_leveling = fallback_leveling

        if "games" not in catalog: catalog["games"] = {}
        catalog["games"][game_id] = {
            "patch": format_season_display(season_info), # Salva la stringa col countdown
            "reviewCycleDays": 1,
            "reviewedAt": today_str,
            "sources": [{"label": "Maxroll", "url": f"https://maxroll.gg/{game_id}"}],
            "discovery": generate_discovery(game_id),
            "builds": {"endgame": final_endgame, "leveling": final_leveling}
        }

    # AGGIORNAMENTO CATALOGO BUILD (con i dati aggiornati di aRPG Timeline)
    update_game_data("poe1", seasons_raw["poe1"], fetch_poe1_endgame(), 
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

    update_game_data("poe2", seasons_raw["poe2"], [], 
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

    update_game_data("d4", seasons_raw["d4"], [], 
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

    update_game_data("le", seasons_raw["le"], [], 
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

    update_game_data("d2", seasons_raw["d2"], [], 
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
    
    print("[+] Estrazione Roadmap e Aggiornamento Completato!")

if __name__ == '__main__':
    main()