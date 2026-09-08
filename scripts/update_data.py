import json
import requests
from bs4 import BeautifulSoup
from datetime import datetime
import os

BUILDS_FILE = 'assets/builds.json'
today_str = datetime.utcnow().strftime('%Y-%m-%d')

# =====================================================================
# 1. FUNZIONI DI ESTRAZIONE AUTOMATICA (API & SCRAPING)
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
    """Esempio di Web Scraping: legge la pagina di Icy Veins per cercare guide D4"""
    builds = []
    try:
        url = "https://www.icy-veins.com/d4/"
        headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}
        res = requests.get(url, headers=headers, timeout=10)
        if res.status_code == 200:
            soup = BeautifulSoup(res.text, 'html.parser')
            # Cerca i link che contengono '/d4/guides/' e la parola 'build'
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
# 2. GENERATORE DI BLOCCHI E DISCOVERY
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
# 3. MOTORE PRINCIPALE E SISTEMA DI FALLBACK
# =====================================================================

def main():
    # 3a. Carica il JSON esistente per usarlo come "Paracadute" se lo scraping fallisce
    catalog = {"games": {}}
    if os.path.exists(BUILDS_FILE):
        try:
            with open(BUILDS_FILE, 'r', encoding='utf-8') as f:
                catalog = json.load(f)
        except Exception:
            pass

    # Funzione di supporto per unire i dati vecchi con quelli nuovi (se disponibili)
    def update_game_data(game_id, patch_name, new_endgame, new_leveling, fallback_static_endgame):
        # Se il robot non trova nulla, usa le build precedenti. Se è vuoto, usa un fallback statico.
        current_data = catalog.get("games", {}).get(game_id, {})
        old_endgame = current_data.get("builds", {}).get("endgame", [])
        
        final_endgame = new_endgame if new_endgame else (old_endgame if old_endgame else fallback_static_endgame)

        if "games" not in catalog:
            catalog["games"] = {}
            
        catalog["games"][game_id] = {
            "patch": patch_name,
            "reviewCycleDays": 1,
            "reviewedAt": today_str, # Aggiorna sempre la data così il sito mostra "Verificato"
            "sources": [{"label": "Auto-Scanner", "url": "#"}],
            "discovery": generate_discovery(game_id),
            "builds": {
                "endgame": final_endgame,
                "leveling": new_leveling # Qui puoi aggiungere scraper simili per il leveling
            }
        }

    print("Avvio scansione robot...")

    # --- POE 1 (Aggiornamento API) ---
    print("- Aggiorno PoE 1...")
    update_game_data("poe1", "Lega 3.25 Settlers", fetch_poe1_endgame(), [{"title": "Rolling Magma", "class": "Templar", "specialization": "Inquisitor", "tier": "Start", "tierColor": "#2196F3", "sourceUrl": "https://maxroll.gg/poe"}], [{"title": "Lightning Arrow", "class": "Ranger", "specialization": "Deadeye", "tier": "S", "tierColor": "#ff9800", "sourceUrl": "https://maxroll.gg/poe"}])

    # --- DIABLO 4 (Aggiornamento Scraping) ---
    print("- Aggiorno Diablo 4...")
    update_game_data("d4", "Stagione 7", scrape_icyveins_d4(), [{"title": "Chain Lightning", "class": "Sorcerer", "specialization": "Leveling", "tier": "Start", "tierColor": "#2196F3", "sourceUrl": "https://maxroll.gg/d4"}], [{"title": "Lightning Spear", "class": "Sorcerer", "specialization": "Evocation", "tier": "S", "tierColor": "#ff9800", "sourceUrl": "https://maxroll.gg/d4"}])

    # --- LAST EPOCH (Dati Statici di Fallback) ---
    print("- Aggiorno Last Epoch...")
    update_game_data("le", "Cycle 1.1", [], [], [{"title": "Falconer Dive Bomb", "class": "Rogue", "specialization": "Falconer", "tier": "S", "tierColor": "#ff9800", "sourceUrl": "https://maxroll.gg/last-epoch"}])

    # --- DIABLO 2 (Dati Statici di Fallback) ---
    print("- Aggiorno Diablo 2...")
    update_game_data("d2", "Ladder Stagione 14", [], [], [{"title": "Hammerdin", "class": "Paladin", "specialization": "Caster", "tier": "S", "tierColor": "#ff9800", "sourceUrl": "https://maxroll.gg/d2"}])

    # --- POE 2 ---
    print("- Aggiorno PoE 2...")
    update_game_data("poe2", "Early Access", [], [], [])

    # Salva il file definitivo
    os.makedirs('assets', exist_ok=True)
    with open(BUILDS_FILE, 'w', encoding='utf-8') as f:
        json.dump(catalog, f, ensure_ascii=False, indent=2)
    
    print(f"Completato! File {BUILDS_FILE} salvato e pronto per il sito.")

if __name__ == '__main__':
    main()
