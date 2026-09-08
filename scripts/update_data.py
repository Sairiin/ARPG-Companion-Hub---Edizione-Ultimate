import json
import requests
from datetime import datetime
import os

BUILDS_FILE = 'assets/builds.json'
today_str = datetime.utcnow().strftime('%Y-%m-%d')

# =====================================================================
# 1. DATABASE STATICO (Aggiorna qui i link per i giochi senza API)
# =====================================================================
STATIC_BUILDS = {
    "d4": {
        "patch": "Stagione 7",
        "endgame": [
            { "title": "Lightning Spear", "class": "Sorcerer", "specialization": "Evocation", "tier": "S", "tierColor": "#ff9800", "sourceUrl": "https://maxroll.gg/d4/build-guides/lightning-spear-sorcerer-guide" },
            { "title": "Bone Spirit", "class": "Necromancer", "specialization": "Bone", "tier": "S", "tierColor": "#ff9800", "sourceUrl": "https://maxroll.gg/d4/build-guides/bone-spirit-necromancer-guide" }
        ],
        "leveling": [
            { "title": "Chain Lightning", "class": "Sorcerer", "specialization": "Leveling", "tier": "Start", "tierColor": "#2196F3", "sourceUrl": "https://maxroll.gg/d4/build-guides/chain-lightning-sorcerer-leveling-guide" }
        ]
    },
    "le": {
        "patch": "Cycle 1.1",
        "endgame": [
            { "title": "Falconer Dive Bomb", "class": "Rogue", "specialization": "Falconer", "tier": "S", "tierColor": "#ff9800", "sourceUrl": "https://maxroll.gg/last-epoch/build-guides/falconer" }
        ],
        "leveling": []
    },
    "d2": {
        "patch": "Ladder Stagione 14",
        "endgame": [
            { "title": "Hammerdin", "class": "Paladin", "specialization": "Caster", "tier": "S", "tierColor": "#ff9800", "sourceUrl": "https://maxroll.gg/d2/guides/blessed-hammer-paladin" }
        ],
        "leveling": []
    },
    "poe2": {
        "patch": "Early Access",
        "endgame": [],
        "leveling": []
    }
}

# =====================================================================
# 2. FUNZIONE AUTOMATICA PER POE NINJA (API APERTA)
# =====================================================================
def fetch_poe_ninja_auto():
    """Scarica in automatico le top 3 skill di PoE Ninja"""
    builds = []
    try:
        url = "https://poe.ninja/api/data/getbuildoverview?overview=settlers&type=exp&language=en"
        headers = {'User-Agent': 'Mozilla/5.0'}
        res = requests.get(url, headers=headers, timeout=10)
        if res.status_code == 200:
            data = res.json()
            # Prendiamo le 3 skill più giocate in assoluto
            top_skills = data.get("skillTreeData", [])[:3] 
            for skill in top_skills:
                name = skill.get("name", "Meta Skill")
                builds.append({
                    "title": f"{name} (Auto-Update)",
                    "class": "Meta",
                    "specialization": "Endgame",
                    "tier": "Top Meta",
                    "tierColor": "#ff9800",
                    "sourceUrl": f"https://poe.ninja/builds/settlers?skills={name.replace(' ', '+')}"
                })
    except Exception as e:
        print(f"Errore PoE Ninja: {e}")
    
    # Se fallisce o è vuoto, mettiamo un fallback
    if not builds:
        builds = [{"title": "Lightning Arrow", "class": "Ranger", "specialization": "Deadeye", "tier": "S", "tierColor": "#ff9800", "sourceUrl": "https://maxroll.gg/poe"}]
    return builds

# =====================================================================
# 3. GENERAZIONE DELLA DISCOVERY
# =====================================================================
def generate_discovery_block(game_id):
    """Genera i link di ricerca dinamici (YouTube/Google) e i bottoni fonti"""
    discovery = {
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
    return discovery

# =====================================================================
# 4. COSTRUZIONE DEL JSON FINALE
# =====================================================================
def main():
    catalog = {"games": {}}

    # 4a. Processa Path of Exile 1 (Ibrido: API + Statico)
    catalog["games"]["poe1"] = {
        "patch": "Lega 3.25 Settlers",
        "reviewCycleDays": 1,
        "reviewedAt": today_str,
        "sources": [{"label": "PoE Ninja", "url": "https://poe.ninja"}],
        "discovery": generate_discovery_block("poe"),
        "builds": {
            "endgame": fetch_poe_ninja_auto(),
            "leveling": [{"title": "Rolling Magma", "class": "Templar", "specialization": "Inquisitor", "tier": "Start", "tierColor": "#2196F3", "sourceUrl": "https://maxroll.gg/poe"}]
        }
    }

    # 4b. Processa gli altri giochi (Statici da dizionario)
    for game_id, data in STATIC_BUILDS.items():
        catalog["games"][game_id] = {
            "patch": data["patch"],
            "reviewCycleDays": 7,
            "reviewedAt": today_str,
            "sources": [{"label": "Maxroll", "url": f"https://maxroll.gg/{game_id}"}],
            "discovery": generate_discovery_block(game_id),
            "builds": {
                "endgame": data["endgame"],
                "leveling": data["leveling"]
            }
        }

    # Salva il file
    os.makedirs('assets', exist_ok=True)
    with open(BUILDS_FILE, 'w', encoding='utf-8') as f:
        json.dump(catalog, f, ensure_ascii=False, indent=2)
    
    print(f"File {BUILDS_FILE} generato con successo! (Discovery e Build integrate)")

if __name__ == '__main__':
    main()
