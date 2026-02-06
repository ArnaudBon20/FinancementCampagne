# 💰 Financement des Campagnes - Widget iOS

Widget iOS (Scriptable) affichant les budgets des campagnes de votations suisses.

## 📱 Aperçu

Ce widget affiche pour chaque votation fédérale à venir :
- Le titre de l'objet
- Le total des recettes budgétées pour les soutiens (Pour/Ja/Sì)
- Le total des recettes budgétées pour les opposants (Contre/Nein/No)

**Source des données** : [EFK/CDF - Politikfinanzierung](https://politikfinanzierung.efk.admin.ch)

## 🌍 Langues supportées

Le widget s'adapte automatiquement à la langue du système :
- 🇫🇷 Français
- 🇩🇪 Deutsch
- 🇮🇹 Italiano

## 📥 Installation

### Prérequis
- iPhone avec iOS 14+
- Application [Scriptable](https://apps.apple.com/app/scriptable/id1405459188) installée

### Étapes

1. **Télécharger le script**
   - Ouvrez ce lien dans Safari sur votre iPhone :
   ```
   https://raw.githubusercontent.com/ArnaudBon20/FinancementCampagne/main/FinancementCampagne.js
   ```
   - Copiez tout le contenu

2. **Ajouter à Scriptable**
   - Ouvrez l'app Scriptable
   - Appuyez sur "+" pour créer un nouveau script
   - Collez le code
   - Nommez-le "Financement Campagne"
   - Appuyez sur "Done"

3. **Ajouter le widget**
   - Allez sur l'écran d'accueil
   - Appuyez longuement > "+" en haut à gauche
   - Cherchez "Scriptable"
   - Choisissez la taille (Small, Medium ou Large)
   - Appuyez longuement sur le widget > "Modifier le widget"
   - Sélectionnez "Financement Campagne" dans Script

> 💡 **Notification de mise à jour** : Le widget affichera un indicateur orange "⚠️ Mise à jour dispo" quand une nouvelle version est disponible sur GitHub

## 📊 Tailles disponibles

| Taille | Description |
|--------|-------------|
| **Small** | 2 votations, montants abrégés |
| **Medium** | 4 votations en 2 colonnes |
| **Large** | Toutes les votations avec détails et pourcentages |

## 🔄 Mise à jour des données

Les données sont automatiquement mises à jour **tous les 2 jours à 23h00** via GitHub Actions.

## 🛠️ Développement

### Structure du projet

```
├── scraper.py              # Script de récupération des données
├── data.json               # Données JSON (généré automatiquement)
├── FinancementCampagne.js  # Widget Scriptable
├── requirements.txt        # Dépendances Python
├── README.md
└── .github/
    └── workflows/
        └── update-data.yml # GitHub Action pour mise à jour auto
```

### Lancer le scraper manuellement

```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python scraper.py
```

## 📄 Licence

MIT License

## 🙏 Crédits

- Données : [Contrôle fédéral des finances (CDF)](https://www.efk.admin.ch)
- Widget : Développé avec [Scriptable](https://scriptable.app)
