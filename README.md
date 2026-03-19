# 💰 Financement des Campagnes

Application web et widget iOS affichant les budgets des campagnes de votations suisses.
Il s'agit des budgets annoncés par les acteurs politiques. Les décomptes finaux ne sont pas pris en compte.

## 📱 Aperçu

Cette application affiche pour chaque votation fédérale à venir :
- Le titre de l'objet
- Le total des recettes budgétées pour les soutiens (Pour/Ja/Sì)
- Le total des recettes budgétées pour les opposants (Contre/Nein/No)
- Les pourcentages de répartition des budgets

**Source des données** : [EFK/CDF - Politikfinanzierung](https://politikfinanzierung.efk.admin.ch)

<img width="516" height="539" alt="CampagneFinancement_d" src="https://github.com/user-attachments/assets/5d52ccef-9fe7-413d-8ac3-7753026590c5" />

## 🌍 Langues supportées

L'application s'adapte automatiquement à la langue du système :
- 🇫🇷 Français
- 🇩🇪 Deutsch
- 🇮🇹 Italiano

---

## 🌐 Application Web (PWA) - **Recommandé**

### ✨ Fonctionnalités
- ✅ Fonctionne sur **tous les appareils** (Android, iOS, ordinateur)
- ✅ Installable sur l'écran d'accueil
- ✅ Mode hors ligne
- ✅ Interface responsive et moderne
- ✅ Sélecteur de langue intégré

### 📥 Installation

#### Sur Android
1. Ouvrez le lien dans Chrome : `https://aexil-234.github.io/FinancementCampagne/`
2. Appuyez sur le bouton **"Installer l'application"** ou
3. Menu (⋮) > **"Installer l'application"** ou **"Ajouter à l'écran d'accueil"**

#### Sur iPhone/iPad
1. Ouvrez le lien dans Safari : `https://aexil-234.github.io/FinancementCampagne/`
2. Appuyez sur le bouton de partage (□↑)
3. Sélectionnez **"Sur l'écran d'accueil"**
4. Confirmez l'installation

#### Sur ordinateur (Chrome, Edge)
1. Ouvrez le lien : `https://aexil-234.github.io/FinancementCampagne/`
2. Cliquez sur l'icône d'installation (⊕) dans la barre d'adresse
3. Confirmez l'installation

---

## 📱 Widget iOS (Scriptable)

### Prérequis
- iPhone avec iOS 14+
- Application [Scriptable](https://apps.apple.com/app/scriptable/id1405459188) installée

### Étapes

1. **Télécharger le script**
   - Ouvrez ce lien dans Safari sur votre iPhone :
   ```
   https://raw.githubusercontent.com/aexil-234/FinancementCampagne/main/FinancementCampagne.js
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

### 📊 Tailles disponibles

| Taille | Description |
|--------|-------------|
| **Small** | 2 votations, montants abrégés |
| **Medium** | 4 votations en 2 colonnes |
| **Large** | Toutes les votations avec détails et pourcentages |

---

## 🔄 Mise à jour des données

Les données sont automatiquement mises à jour **tous les 2 jours à 23h00** via GitHub Actions.

---

## 🛠️ Développement

### Structure du projet

```
├── scraper.py              # Script de récupération des données
├── data.json               # Données JSON (généré automatiquement)
├── index.html              # Application web PWA
├── styles.css              # Styles de la PWA
├── app.js                  # JavaScript de la PWA
├── manifest.json           # Manifest PWA
├── sw.js                   # Service Worker (mode hors ligne)
├── generate-icons.html     # Générateur d'icônes
├── FinancementCampagne.js  # Widget Scriptable (iOS)
├── widget.js               # Code du widget
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

### Tester la PWA localement

1. **Générer les icônes** (première fois uniquement)
   - Ouvrez `generate-icons.html` dans votre navigateur
   - Téléchargez `icon-192.png` et `icon-512.png`
   - Placez-les dans le dossier racine

2. **Lancer un serveur local**
   ```bash
   python3 -m http.server 8000
   ```
   
3. **Ouvrir dans le navigateur**
   - Accédez à `http://localhost:8000`
   - Testez l'installation PWA

### Déployer sur GitHub Pages

1. Activez GitHub Pages dans les paramètres du repository
2. Sélectionnez la branche `main` comme source
3. L'application sera accessible à `https://[username].github.io/[repo-name]/`

## 📄 Licence

MIT License

## 🙏 Crédits

- Données : [Contrôle fédéral des finances (CDF)](https://www.efk.admin.ch)
- Widget : Développé avec [Scriptable](https://scriptable.app)
