#!/usr/bin/env python3
"""
Scraper pour récupérer les données de financement des campagnes de votations
depuis https://politikfinanzierung.efk.admin.ch via l'API officielle.
"""

import json
import re
import requests
from datetime import datetime

OUTPUT_FILE = "data.json"
HISTORY_FILE = "history.json"
MAX_HISTORY_ENTRIES = 50
BASE_API_URL = "https://politikfinanzierung.efk.admin.ch/api/frontend/v1"

# Titres multilingues
TRANSLATIONS = {
    "fr": {
        "title": "Financement des campagnes",
        "date_label": "Date",
        "supporters": "Soutiens",
        "opponents": "Opposants", 
        "update": "Mise à jour",
        "adoption": "adoption",
        "rejection": "rejet"
    },
    "de": {
        "title": "Kampagnenfinanzierung",
        "date_label": "Datum",
        "supporters": "Befürworter",
        "opponents": "Gegner",
        "update": "Aktualisierung",
        "adoption": "annahme",
        "rejection": "ablehnung"
    },
    "it": {
        "title": "Finanziamento delle campagne",
        "date_label": "Data",
        "supporters": "Sostenitori",
        "opponents": "Oppositori",
        "update": "Aggiornamento",
        "adoption": "adozione",
        "rejection": "rigetto"
    }
}


def get_campaign_financings(lang="fr"):
    """Récupère la liste des financements de campagne depuis l'API."""
    url = f"{BASE_API_URL}/{lang}/campaign_financings"
    response = requests.get(url)
    response.raise_for_status()
    return response.json()["data"]["tree_roots"]


def get_form_data(campaign_id, form_id, lang="fr"):
    """Récupère les données d'un formulaire de déclaration."""
    url = f"{BASE_API_URL}/{lang}/campaigns/{campaign_id}/forms/{form_id}"
    try:
        response = requests.get(url)
        response.raise_for_status()
        return response.json().get("data", {})
    except Exception as e:
        print(f"Erreur récupération formulaire {campaign_id}/{form_id}: {e}")
        return {}


def parse_chf_amount(amount_str):
    """Parse un montant au format 'CHF 1'386'630.00' en float."""
    if not amount_str:
        return 0
    # Enlever 'CHF', espaces, apostrophes et convertir
    cleaned = amount_str.replace("CHF", "").replace("'", "").replace(" ", "").strip()
    try:
        return float(cleaned)
    except (ValueError, TypeError):
        return 0


def extract_total_from_form(form_data):
    """Extrait le montant total des recettes d'un formulaire."""
    try:
        # Structure: form_data.form_data.totals.total
        if "form_data" in form_data:
            fd = form_data["form_data"]
            if "totals" in fd and "total" in fd["totals"]:
                return parse_chf_amount(fd["totals"]["total"])
        # Fallback: form_data.totals.total
        if "totals" in form_data:
            totals = form_data["totals"]
            if isinstance(totals, dict) and "total" in totals:
                return parse_chf_amount(totals["total"])
    except (ValueError, TypeError, KeyError):
        pass
    return 0


def is_future_votation(label):
    """Vérifie si c'est une votation (pas élection) dans le futur."""
    # Exclure les élections
    label_lower = label.lower()
    if "élection" in label_lower or "election" in label_lower or "elezione" in label_lower or "wahl" in label_lower:
        return False
    
    date_match = re.search(r'(\d{2})\.(\d{2})\.(\d{4})', label)
    if date_match:
        day, month, year = date_match.groups()
        vote_date = datetime(int(year), int(month), int(day))
        return vote_date > datetime.now()
    return False


def extract_vote_date(label):
    """Extrait la date de votation du label."""
    date_match = re.search(r'(\d{2}\.\d{2}\.\d{4})', label)
    return date_match.group(1) if date_match else ""


def extract_title(label):
    """Extrait le titre sans la date."""
    # Enlever la date au début
    title = re.sub(r'^\d{2}\.\d{2}\.\d{4}\s*', '', label)
    return title.strip()


def process_votations(tree_roots, lang="fr"):
    """Traite les votations et extrait les données financières."""
    votations = []
    
    for root in tree_roots:
        if root.get("type") != "campaign_financing":
            continue
        
        label = root.get("label", "")
        
        # Vérifier si c'est une votation future
        if not is_future_votation(label):
            continue
        
        vote_date = extract_vote_date(label)
        title = extract_title(label)
        
        votation_data = {
            "id": root.get("id"),
            "title": {
                "fr": title,
                "de": title,  # À améliorer avec l'API multilingue
                "it": title
            },
            "date": vote_date,
            "supporters_total": 0,
            "opponents_total": 0,
            "supporters_count": 0,
            "opponents_count": 0,
            "actors": []
        }
        
        # Parcourir les catégories d'acteurs
        for category in root.get("children", []):
            if category.get("type") != "actor_category":
                continue
            
            # Parcourir les acteurs
            for actor in category.get("children", []):
                if actor.get("type") != "actor":
                    continue
                
                actor_name = actor.get("label", "")
                
                # Parcourir les campagnes de l'acteur
                for campaign in actor.get("children", []):
                    if campaign.get("type") != "campaign":
                        continue
                    
                    campaign_label = campaign.get("label", "").lower()
                    campaign_id = campaign.get("id")
                    
                    # Déterminer la position (adoption = soutien, rejet = opposition)
                    is_supporter = "adoption" in campaign_label or "annahme" in campaign_label or "adozione" in campaign_label
                    is_opponent = "rejet" in campaign_label or "ablehnung" in campaign_label or "rigetto" in campaign_label
                    
                    # Chercher le formulaire de déclaration des recettes budgétées
                    for form in campaign.get("children", []):
                        if form.get("type") != "form":
                            continue
                        
                        form_label = form.get("label", "").lower()
                        
                        # On cherche "déclaration des recettes budgétées"
                        if "recettes budgét" in form_label or "budgetierte einnahmen" in form_label or "entrate preventivate" in form_label:
                            form_id = form.get("id")
                            form_data = get_form_data(campaign_id, form_id, lang)
                            total = extract_total_from_form(form_data)
                            
                            actor_info = {
                                "name": actor_name,
                                "position": "supporter" if is_supporter else "opponent" if is_opponent else "unknown",
                                "total": total,
                                "campaign_id": campaign_id
                            }
                            votation_data["actors"].append(actor_info)
                            
                            if is_supporter:
                                votation_data["supporters_total"] += total
                                votation_data["supporters_count"] += 1
                            elif is_opponent:
                                votation_data["opponents_total"] += total
                                votation_data["opponents_count"] += 1
                            
                            break  # On ne prend que le premier formulaire de recettes
        
        if votation_data["date"]:  # Seulement si on a une date valide
            votations.append(votation_data)
    
    return votations


def fetch_multilingual_titles(votation_id):
    """Récupère les titres dans les 3 langues."""
    titles = {}
    for lang in ["fr", "de", "it"]:
        try:
            tree_roots = get_campaign_financings(lang)
            for root in tree_roots:
                if root.get("id") == votation_id:
                    titles[lang] = extract_title(root.get("label", ""))
                    break
        except Exception as e:
            print(f"Erreur récupération titre {lang}: {e}")
    return titles


def load_history():
    """Charge l'historique existant ou retourne une liste vide."""
    try:
        with open(HISTORY_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        return []


def load_previous_data():
    """Charge les données précédentes depuis data.json."""
    try:
        with open(OUTPUT_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        return {}


def compute_changes(previous_data, new_votations):
    """Compare les nouvelles données avec les anciennes et retourne les deltas."""
    changes = []

    prev_votations = {v["id"]: v for v in previous_data.get("votations", [])}

    for vot in new_votations:
        vot_id = vot["id"]
        prev = prev_votations.get(vot_id)

        if prev is None:
            # Nouvelle votation apparue
            if vot["supporters_total"] > 0 or vot["opponents_total"] > 0:
                changes.append({
                    "votation_id": vot_id,
                    "title": vot["title"],
                    "date": vot["date"],
                    "supporters_before": 0,
                    "supporters_after": vot["supporters_total"],
                    "opponents_before": 0,
                    "opponents_after": vot["opponents_total"],
                    "new_entry": True
                })
        else:
            sup_diff = vot["supporters_total"] - prev["supporters_total"]
            opp_diff = vot["opponents_total"] - prev["opponents_total"]
            if sup_diff != 0 or opp_diff != 0:
                changes.append({
                    "votation_id": vot_id,
                    "title": vot["title"],
                    "date": vot["date"],
                    "supporters_before": prev["supporters_total"],
                    "supporters_after": vot["supporters_total"],
                    "opponents_before": prev["opponents_total"],
                    "opponents_after": vot["opponents_total"],
                    "new_entry": False
                })

    return changes


def update_history(changes):
    """Ajoute une entrée à history.json si des changements ont eu lieu."""
    if not changes:
        print("Aucun changement détecté, history.json non modifié.")
        return

    history = load_history()

    entry = {
        "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M"),
        "changes": changes
    }
    history.insert(0, entry)

    # Limiter la taille de l'historique
    history = history[:MAX_HISTORY_ENTRIES]

    with open(HISTORY_FILE, "w", encoding="utf-8") as f:
        json.dump(history, f, ensure_ascii=False, indent=2)

    print(f"history.json mis à jour : {len(changes)} changement(s) enregistré(s).")


def main():
    print("Démarrage de la récupération des données de financement...")

    # Charger les données précédentes avant de les écraser
    previous_data = load_previous_data()

    # Récupérer les données en français (langue de base)
    tree_roots = get_campaign_financings("fr")
    print(f"Récupéré {len(tree_roots)} entrées depuis l'API")
    
    # Traiter les votations
    votations = process_votations(tree_roots, "fr")
    print(f"Trouvé {len(votations)} votations futures")
    
    # Récupérer les titres multilingues pour chaque votation
    for votation in votations:
        titles = fetch_multilingual_titles(votation["id"])
        if titles:
            votation["title"] = titles
        print(f"  - {votation['date']}: {votation['title'].get('fr', 'N/A')}")
        print(f"    Soutiens: CHF {votation['supporters_total']:,.0f} ({votation['supporters_count']} acteurs)")
        print(f"    Opposants: CHF {votation['opponents_total']:,.0f} ({votation['opponents_count']} acteurs)")

    # Calculer les changements par rapport aux données précédentes
    changes = compute_changes(previous_data, votations)

    # Mettre à jour l'historique si des changements ont eu lieu
    update_history(changes)
    
    # Déterminer la date de la prochaine votation
    if votations:
        next_vote_date = votations[0]["date"]
    else:
        next_vote_date = ""
    
    # Créer le fichier JSON final
    data = {
        "lastUpdate": datetime.now().strftime("%Y-%m-%d %H:%M"),
        "nextVoteDate": next_vote_date,
        "translations": TRANSLATIONS,
        "votations": votations
    }
    
    # Sauvegarder
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    
    print(f"\nDonnées sauvegardées dans {OUTPUT_FILE}")


if __name__ == "__main__":
    main()
