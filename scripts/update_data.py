import json
import requests
from bs4 import BeautifulSoup
from datetime import datetime
import os

BUILDS_FILE = 'assets/builds.json'
today_str = datetime.utcnow().strftime('%Y-%m-%d')

def fetch_arpg_timeline_season(game_key, fallback_name):
    mapping = {
        "poe1": "path-of-exile",
        "poe2": "path-of-exile-2",
        "d4": "diablo-iv",
        "d2": "diablo-ii-resurrected",
        "le": "last-epoch"
    }
    slug = mapping.get(game_key)
    if not slug:
        return fallback_name

    try:
        url = f"https://www.arpg-timeline.com/api/v1/games/{slug}"
        headers = {'User-Agent': 'Mozilla/5.0'}
        res = requests.get(url, headers=headers, timeout=5)
        if res.status_code == 200:
            current_season = res.json().get("current_season", {}).get("name")
            if current_season:
                return current_season
    except Exception as e:
        print(f"[-] Timeline API Error ({game_key}): {e}")
    return fallback_name

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
                builds.append({
                    "title": f"{name}",
                    "class": "Meta Class",
                    "specialization": "Endgame",
                    "tier": "S+",
                    "tierColor": "#ff9800",
                    "sourceUrl": f"https://poe.ninja/builds/settlers?skills={name.replace(' ', '+')}"
                })
    except Exception as e:
        print(f"[-] PoE Ninja Error: {e}")
    return builds

def generate_discovery(game_id):
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

def main():
    catalog = {"games": {}}
    if os.path.exists(BUILDS_FILE):
        try:
            with open(BUILDS_FILE, 'r', encoding='utf-8') as f:
                catalog = json.load(f)
        except Exception:
            pass

    def update_game_data(game_id, patch_name, new_endgame, new_leveling, fallback_endgame, fallback_leveling):
        current_data = catalog.get("games", {}).get(game_id, {})
        old_endgame = current_data.get("builds", {}).get("endgame", [])
        old_leveling = current_data.get("builds", {}).get("leveling", [])
        
        final_endgame = new_endgame if new_endgame else (old_endgame if old_endgame else fallback_endgame)
        final_leveling = new_leveling if new_leveling else (old_leveling if old_leveling else fallback_leveling)

        if "games" not in catalog:
            catalog["games"] = {}
            
        catalog["games"][game_id] = {
            "patch": patch_name,
            "reviewCycleDays": 1,
            "reviewedAt": today_str,
            "sources": [{"label": "Maxroll", "url": f"https://maxroll.gg/{game_id}"}, {"label": "Community Meta", "url": "#"}],
            "discovery": generate_discovery(game_id),
            "builds": {
                "endgame": final_endgame,
                "leveling": final_leveling
            }
        }

    print("Scansione e aggiornamento database ARPG...")

    # DATABASE BUILDS PER TUTTI I GIOCHI
    update_game_data(
        "poe1", 
        fetch_arpg_timeline_season("poe1", "Lega 3.29 Curse of the Allflame"), 
        fetch_poe1_endgame(), 
        [], 
        [{"title": "Lightning Arrow", "class": "Ranger", "specialization": "Deadeye", "tier": "S", "tierColor": "#ff9800", "sourceUrl": "https://maxroll.gg/poe/build-guides/lightning-arrow-deadeye"}, {"title": "Righteous Fire", "class": "Templar", "specialization": "Inquisitor", "tier": "S", "tierColor": "#ff9800", "sourceUrl": "https://maxroll.gg/poe/build-guides/righteous-fire-inquisitor"}], 
        [{"title": "Rolling Magma", "class": "Templar", "specialization": "Inquisitor", "tier": "Leveling", "tierColor": "#2196F3", "sourceUrl": "https://maxroll.gg/poe"}]
    )

    update_game_data(
        "poe2", 
        fetch_arpg_timeline_season("poe2", "Early Access"), 
        [], 
        [], 
        [{"title": "Monk Strike", "class": "Monk", "specialization": "Invoker", "tier": "A", "tierColor": "#4caf50", "sourceUrl": "https://poe2db.tw"}, {"title": "Warrior Heavy Slash", "class": "Warrior", "specialization": "Titan", "tier": "A", "tierColor": "#4caf50", "sourceUrl": "https://poe2db.tw"}], 
        [{"title": "Ranger Bow Starter", "class": "Ranger", "specialization": "Deadeye", "tier": "Leveling", "tierColor": "#2196F3", "sourceUrl": "https://poe2db.tw"}]
    )

    update_game_data(
        "d4", 
        fetch_arpg_timeline_season("d4", "Stagione 7"), 
        [], 
        [], 
        [{"title": "Lightning Spear", "class": "Sorcerer", "specialization": "Evocation", "tier": "S", "tierColor": "#ff9800", "sourceUrl": "https://maxroll.gg/d4/build-guides/lightning-spear-sorcerer-guide"}, {"title": "Bone Spirit", "class": "Necromancer", "specialization": "Macabre", "tier": "S", "tierColor": "#ff9800", "sourceUrl": "https://maxroll.gg/d4/build-guides/bone-spirit-necromancer-guide"}], 
        [{"title": "Chain Lightning", "class": "Sorcerer", "specialization": "Leveling", "tier": "Leveling", "tierColor": "#2196F3", "sourceUrl": "https://maxroll.gg/d4/build-guides/chain-lightning-sorcerer-leveling-guide"}]
    )

    update_game_data(
        "le", 
        fetch_arpg_timeline_season("le", "Cycle 1.1"), 
        [], 
        [], 
        [{"title": "Falconer Dive Bomb", "class": "Rogue", "specialization": "Falconer", "tier": "S", "tierColor": "#ff9800", "sourceUrl": "https://maxroll.gg/last-epoch/build-guides/falconer-build-guide"}, {"title": "Torment Warlock", "class": "Acolyte", "specialization": "Warlock", "tier": "S", "tierColor": "#ff9800", "sourceUrl": "https://maxroll.gg/last-epoch/build-guides/torment-warlock"}], 
        [{"title": "Hammerdin Sentinel", "class": "Sentinel", "specialization": "Paladin", "tier": "Leveling", "tierColor": "#2196F3", "sourceUrl": "https://maxroll.gg/last-epoch"}]
    )

    update_game_data(
        "d2", 
        fetch_arpg_timeline_season("d2", "Ladder Stagione 14"), 
        [], 
        [], 
        [{"title": "Hammerdin", "class": "Paladin", "specialization": "Blessed Aim", "tier": "S", "tierColor": "#ff9800", "sourceUrl": "https://maxroll.gg/d2/guides/blessed-hammer-paladin"}, {"title": "Blizzard Sorceress", "class": "Sorceress", "specialization": "Cold", "tier": "S", "tierColor": "#ff9800", "sourceUrl": "https://maxroll.gg/d2/guides/blizzard-sorceress"}], 
        [{"title": "Holy Fire Paladin", "class": "Paladin", "specialization": "Fire", "tier": "Leveling", "tierColor": "#2196F3", "sourceUrl": "https://maxroll.gg/d2"}]
    )

    os.makedirs('assets', exist_ok=True)
    with open(BUILDS_FILE, 'w', encoding='utf-8') as f:
        json.dump(catalog, f, ensure_ascii=False, indent=2)
    
    print(f"[+] File {BUILDS_FILE} salvato correttamente per tutti i giochi!")

if __name__ == '__main__':
    main()
