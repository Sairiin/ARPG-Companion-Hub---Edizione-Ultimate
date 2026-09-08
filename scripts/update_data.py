import json
import requests
from datetime import datetime
import os

# Percorsi dei file da aggiornare
BUILDS_FILE = 'assets/builds.json'
PATCHES_FILE = 'assets/patches.json'

# Data di oggi formattata
today_str = datetime.utcnow().strftime('%Y-%m-%d')

def fetch_poe_ninja_meta():
    """Esempio di chiamata a un'API pubblica e affidabile (PoE Ninja)"""
    try:
        # Nota: l'URL esatto dipende dalla lega corrente, questo è un esempio di struttura
        url = "https://poe.ninja/api/data/getbuildoverview?overview=settlers&type=exp&language=en"
        headers = {'User-Agent': 'Mozilla/5.0'}
        response = requests.get(url, headers=headers, timeout=10)
        
        if response.status_code == 200:
            # Qui potresti estrarre le classi o skill più usate
            # Per ora simuliamo un aggiornamento andato a buon fine
            return [
                { "title": "Top Meta Skill (PoE Ninja)", "class": "Variabile", "specialization": "Meta", "tier": "S", "tierColor": "#ff9800", "sourceUrl": "https://poe.ninja/builds" }
            ]
    except Exception as e:
        print(f"Errore PoE Ninja: {e}")
    return []

def fetch_generic_meta(game_name):
    """Placeholder per scraping di altri siti (es. Maxroll, Mobalytics). 
    Attenzione: questi siti usano Cloudflare, le chiamate dirette potrebbero essere bloccate."""
    return [
        { "title": f"Migliore Build {game_name}", "class": "N/D", "specialization": "N/A", "tier": "S", "tierColor": "#4caf50", "sourceUrl": "https://maxroll.gg" }
    ]

def main():
    # 1. Crea la struttura base del catalogo valida per TUTTI i giochi presenti e futuri
    catalog = {
        "games": {
            "poe1": { "patch": "Lega Attuale", "reviewCycleDays": 1, "reviewedAt": today_str, "sources": [{"label": "PoE Ninja", "url": "https://poe.ninja"}], "builds": { "endgame": [], "leveling": [] } },
            "poe2": { "patch": "Early Access", "reviewCycleDays": 1, "reviewedAt": today_str, "sources": [], "builds": { "endgame": [], "leveling": [] } },
            "d2": { "patch": "Stagione Corrente", "reviewCycleDays": 1, "reviewedAt": today_str, "sources": [], "builds": { "endgame": [], "leveling": [] } },
            "d4": { "patch": "Stagione Corrente", "reviewCycleDays": 1, "reviewedAt": today_str, "sources": [], "builds": { "endgame": [], "leveling": [] } },
            "le": { "patch": "Cycle Corrente", "reviewCycleDays": 1, "reviewedAt": today_str, "sources": [], "builds": { "endgame": [], "leveling": [] } }
        }
    }

    # 2. Popola i dati (Qui puoi aggiungere la logica per ogni gioco)
    print("Aggiornamento PoE 1...")
    catalog["games"]["poe1"]["builds"]["endgame"] = fetch_poe_ninja_meta()
    
    print("Aggiornamento Diablo 4...")
    catalog["games"]["d4"]["builds"]["endgame"] = fetch_generic_meta("Diablo 4")

    # (In futuro, se aggiungi Grim Dawn, basterà aggiungere la chiave "gd" al dict e chiamare la funzione qui)

    # 3. Assicurati che la cartella assets esista
    os.makedirs('assets', exist_ok=True)

    # 4. Salva il file JSON
    with open(BUILDS_FILE, 'w', encoding='utf-8') as f:
        json.dump(catalog, f, ensure_ascii=False, indent=2)
    
    print(f"File {BUILDS_FILE} aggiornato con successo!")

if __name__ == '__main__':
    main()