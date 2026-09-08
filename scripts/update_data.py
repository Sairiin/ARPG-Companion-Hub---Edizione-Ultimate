import json
import requests
from bs4 import BeautifulSoup
from datetime import datetime
import os

BUILDS_FILE = 'assets/builds.json'
today_str = datetime.utcnow().strftime('%Y-%m-%d')

# =====================================================================
# 1. API ARPG TIMELINE (RECUPERO AUTOMATICO NOME STAGIONE)
# =====================================================================
def fetch_arpg_timeline_season(game_key, fallback_name):
    """
    Recupera il nome della stagione corrente da aRPG Timeline.
    game_key accettate: 'poe1', 'poe2', 'd4', 'd2', 'le'
    """
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
        headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}
        res = requests.get(url, headers=headers, timeout=5)
        
        if res.status_code == 200:
            data = res.json()
            current_season = data.get("current_season", {}).get("name")
            if current_season:
                print(f"[+] aRPG Timeline ({game_key}): Trovata stagione '{current_season}'")
                return current_season
    except Exception as e:
        print(f"[-] Impossibile recuperare da aRPG Timeline per {game_key}: {e}")
    
    print(f"[*] Usa nome fallback per {game_key}: '{fallback_name}'")
    return fallback_name

# =====================================================================
# 2. FUNZIONI DI ESTRAZIONE AUTOMATICA BUILD (API & SCRAPING)
# =====================================================================
def fetch_poe1_endgame():
    """Estrae le 3 skill assolute più giocate in endgame da PoE Ninja (API Ufficiale)"""
    builds = []
    try:
        url = "https://poe.ninja/api/data/getbuildoverview?overview=settlers&type=exp&language=en"
        headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}
        res = requests.get(url, headers=headers, timeout=10)
        if res.status_code == 200:
            top_skills = res.json().get("skillTreeData", [])[:3]
            for skill in top_skills:
                name = skill.get("name", "Meta Skill")
                builds.append({
                    "title": f"{name} (Auto-Meta)",
                    "class": "Top Meta",
                    "specialization": "Endgame",
                    "tier": "S+",
                    "tierColor": "#ff9800",
                    "sourceUrl": f"https://poe.ninja/builds/settlers?skills={name.replace(' ', '+')}"
                })
    except Exception as e:
        print(f"Errore API PoE Ninja: {e}")
    return builds

def scrape_icyveins_d4():
    """Esegue lo Scraping su Icy Veins per cercare guide D4"""
    builds = []
    try:
        url = "https://www.icy-veins.com/d4/"
        headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}
        res = requests.get(url, headers=headers, timeout=10)
        if res.status_code == 200:
            soup = BeautifulSoup(res.text, 'html.parser')
            links = soup.find_all('a', href=True)
            for a in links:
                href = a['href']
                title = a.get_text(strip=True)
                if '/d4/guides/' in href and 'build' in title.lower() and len(builds) < 2:
                    builds.append({
                        "title": title.replace("Build", "").replace("Guide", "").strip()[:25] + "...",
                        "class": "Meta Aggiornato",
                        "specialization": "Live",
                        "tier": "A",
                        "tierColor": "#4caf50",
                        "sourceUrl": f"https://www.icy-veins.com{href}" if href.startswith('/') else href
                    })
    except Exception as e:
        print(f"Errore Scraping D4: {e}")
    return builds

# =====================================================================
# 3. GENERATORE DI DISCOVERY
# =====================================================================
def generate_discovery(game_id):
    """Genera le query dinamiche di ricerca per la community"""
    return {
        "sources": [
            ["Maxroll", f"https://maxroll.gg/{game_id}"],
            ["Icy Veins", f"https://www.icy-veins.com/{game_id}"],
            ["Mobalytics", f"https://mobalytics.gg/{game_id}"]
        ],
        "prompts": [
            ["Starter / Leveling", "Punti di partenza per la progressione iniziale.", f"{game_id} leveling build"],
            ["Endgame & Boss", "Build avanzate per i contenuti più difficili.", f"{game_id} endgame boss build"],
            ["Speedfarming", "Per pulire le mappe alla massima velocità.", f"{game_id} speedfarm build"]
        ]
    }

# =====================================================================
# 4. MOTORE PRINCIPALE
# =====================================================================
def main():
    catalog = {"games": {}}
    if os.path.exists(BUILDS_FILE):
        try:
            with open(BUILDS_FILE, 'r', encoding='utf-8') as f:
                catalog = json.load(f)
        except Exception:
            pass

    def update_game_data(game_id, patch_name, new_endgame, new_leveling, fallback_static_endgame):
        current_data = catalog.get("games", {}).get(game_id, {})
        old_endgame = current_data.get("builds", {}).get("endgame", [])
        
        final_endgame = new_endgame if new_endgame else (old_endgame if old_endgame else fallback_static_endgame)

        if "games" not in catalog:
            catalog["games"] = {}
            
        catalog["games"][game_id] = {
            "patch": patch_name,
            "reviewCycleDays": 1,
            "reviewedAt": today_str,
            "sources": [{"label": "Auto-Scanner", "url": "#"}],
            "discovery": generate_discovery(game_id),
            "builds": {
                "endgame": final_endgame,
                "leveling": new_leveling
            }
        }

    print("Avvio scansione robot con integrazione aRPG Timeline...")

    # --- POE 1 ---
    poe1_season = fetch_arpg_timeline_season("poe1", "Lega 3.29 Curse of the Allflame")
    print(f"- Aggiorno PoE 1 ({poe1_season})...")
    update_game_data("poe1", poe1_season, fetch_poe1_endgame(), [{"title": "Rolling Magma", "class": "Templar", "specialization": "Inquisitor", "tier": "Start", "tierColor": "#2196F3", "sourceUrl": "https://maxroll.gg/poe"}], [{"title": "Lightning Arrow", "class": "Ranger", "specialization": "Deadeye", "tier": "S", "tierColor": "#ff9800", "sourceUrl": "https://maxroll.gg/poe"}])

    # --- DIABLO 4 ---
    d4_season = fetch_arpg_timeline_season("d4", "Stagione 7")
    print(f"- Aggiorno Diablo 4 ({d4_season})...")
    update_game_data("d4", d4_season, scrape_icyveins_d4(), [{"title": "Chain Lightning", "class": "Sorcerer", "specialization": "Leveling", "tier": "Start", "tierColor": "#2196F3", "sourceUrl": "https://maxroll.gg/d4"}], [{"title": "Lightning Spear", "class": "Sorcerer", "specialization": "Evocation", "tier": "S", "tierColor": "#ff9800", "sourceUrl": "https://maxroll.gg/d4"}])

    # --- LAST EPOCH ---
    le_season = fetch_arpg_timeline_season("le", "Cycle 1.1")
    print(f"- Aggiorno Last Epoch ({le_season})...")
    update_game_data("le", le_season, [], [], [{"title": "Falconer Dive Bomb", "class": "Rogue", "specialization": "Falconer", "tier": "S", "tierColor": "#ff9800", "sourceUrl": "https://maxroll.gg/last-epoch"}])

    # --- DIABLO 2 ---
    d2_season = fetch_arpg_timeline_season("d2", "Ladder Stagione 14")
    print(f"- Aggiorno Diablo 2 ({d2_season})...")
    update_game_data("d2", d2_season, [], [], [{"title": "Hammerdin", "class": "Paladin", "specialization": "Caster", "tier": "S", "tierColor": "#ff9800", "sourceUrl": "https://maxroll.gg/d2"}])

    # --- POE 2 ---
    poe2_season = fetch_arpg_timeline_season("poe2", "Early Access")
    print(f"- Aggiorno PoE 2 ({poe2_season})...")
    update_game_data("poe2", poe2_season, [], [], [])

    # Salva il file
    os.makedirs('assets', exist_ok=True)
    with open(BUILDS_FILE, 'w', encoding='utf-8') as f:
        json.dump(catalog, f, ensure_ascii=False, indent=2)
    
    print(f"Completato! File {BUILDS_FILE} salvato e pronto per il sito.")

if __name__ == '__main__':
    main()
