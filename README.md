# 🏨 HotelDiscount Platform

Plateforme de réservation hôtelière avec codes de réduction pour clients partenaires.

## 📋 Description

Site web permettant aux clients partenaires d'accéder à des offres hôtelières avec des prix réduits selon des conventions préalablement définies. L'accès se fait via un code de réduction fourni par l'administrateur.

## ✨ Fonctionnalités

### Pour les clients
- ✅ Accès par code de réduction
- ✅ Consultation des offres hôtelières avec prix réduits
- ✅ Application automatique des réductions selon la convention
- ✅ Interface responsive (desktop, tablette, mobile)

### Pour les administrateurs
- 🔐 Connexion sécurisée
- 📋 Gestion des conventions (création, modification, suppression)
- 🎫 Gestion des codes de réduction (génération, activation, désactivation)
- 💰 Gestion des marges (globale, par hôtel, par type de chambre)
- 📊 Tableau de bord avec statistiques

## 🚀 Installation

### Prérequis
- Node.js (version 14 ou supérieure)
- npm

### Étapes d'installation

1. **Installer les dépendances**
```bash
npm install
```

2. **Initialiser la base de données**
```bash
npm run init-db
```

3. **Démarrer le serveur**
```bash
npm start
```

Le site sera accessible à : `http://localhost:3000`

## 🔑 Accès par défaut

### Administration
- URL: `http://localhost:3000/admin/login`
- Username: `admin`
- Password: `admin123`

### Codes de réduction de démonstration
- `SANTE2024` - Ministère de la Santé (20% de réduction)
- `PARTNER15` - Entreprise partenaire A (15% de réduction)
- `PUBLIC25` - Organisme public B (25% de réduction)

## 📁 Structure du projet

```
hotel-booking-platform/
│
├── server.js                 # Serveur Express principal
├── init-db.js               # Script d'initialisation de la base de données
├── package.json             # Dépendances du projet
├── .env                     # Configuration (à ne pas partager)
│
├── routes/
│   ├── public.js           # Routes publiques (codes, offres)
│   └── admin.js            # Routes admin (gestion)
│
├── services/
│   └── hotelService.js     # Service API hôtelière
│
├── views/
│   ├── enter-code.ejs      # Page d'entrée du code
│   ├── offers.ejs          # Page des offres
│   └── admin/
│       ├── login.ejs       # Connexion admin
│       ├── dashboard.ejs   # Tableau de bord
│       ├── conventions.ejs # Gestion des conventions
│       ├── codes.ejs       # Gestion des codes
│       └── margins.ejs     # Gestion des marges
│
└── database.db             # Base de données SQLite (créé automatiquement)
```

## 🗄️ Base de données

Le projet utilise SQLite avec les tables suivantes :

### Tables principales
1. **admins** - Comptes administrateurs
2. **conventions** - Conventions avec taux de réduction
3. **discount_codes** - Codes de réduction
4. **margins** - Marges appliquées aux prix

## 🔧 Configuration

Modifiez le fichier `.env` pour personnaliser :

```env
PORT=3000
SESSION_SECRET=votre_secret_session_tres_securise_changez_moi
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
DB_PATH=./database.db
```

⚠️ **Important** : Changez le mot de passe admin en production !

## 📡 API Hôtelière

Le projet utilise actuellement des données simulées pour la démonstration. Pour intégrer une vraie API :

1. Ouvrez `services/hotelService.js`
2. Remplacez la méthode `getHotels()` par votre appel API
3. Exemple :

```javascript
async getHotels() {
  const response = await axios.get('https://votre-api.com/hotels', {
    headers: {
      'Authorization': 'Bearer VOTRE_CLE_API',
      'Content-Type': 'application/json'
    }
  });
  return response.data;
}
```

## 🎯 Workflow utilisateur

1. **Client** : Entre un code de réduction sur `/enter-code`
2. **Système** : Vérifie le code dans la base de données
3. **Système** : Identifie la convention associée
4. **Système** : Récupère les offres depuis l'API
5. **Système** : Applique les marges puis les réductions
6. **Client** : Consulte les offres avec prix réduits sur `/offers`

## 🔐 Sécurité

- ✅ Mots de passe hashés avec bcrypt
- ✅ Sessions sécurisées
- ✅ Validation côté serveur des codes
- ✅ Protection des routes admin
- ✅ Aucun accès aux offres sans code valide

## 📱 Responsive Design

Le site est entièrement responsive et s'adapte à :
- 💻 Desktop
- 📱 Tablettes
- 📱 Mobiles

## 🛠️ Scripts disponibles

```bash
# Démarrer le serveur
npm start

# Démarrer en mode développement (avec nodemon)
npm run dev

# Réinitialiser la base de données
npm run init-db
```

## 📊 Gestion administrative

### Créer une convention
1. Connectez-vous à l'admin
2. Allez dans "Conventions"
3. Cliquez sur "+ Nouvelle convention"
4. Remplissez les informations
5. Enregistrez

### Créer un code de réduction
1. Allez dans "Codes"
2. Cliquez sur "+ Nouveau code"
3. Générez un code ou entrez-le manuellement
4. Sélectionnez la convention
5. Définissez les dates de validité (optionnel)
6. Enregistrez

### Configurer les marges
1. Allez dans "Marges"
2. Choisissez le type de marge (globale, par hôtel, par chambre)
3. Entrez la valeur
4. Sélectionnez l'unité (% ou montant fixe)
5. Enregistrez

## 💰 Calcul des prix

Le prix final est calculé ainsi :

1. **Prix de base** (depuis l'API)
2. **+ Marge** (globale ou spécifique)
3. **- Réduction** (selon la convention)
4. **= Prix final**

Exemple :
- Prix de base : 100€
- Marge globale : +10% = 110€
- Réduction convention : -20% = 88€
- **Prix final : 88€**

## 🐛 Dépannage

### Le serveur ne démarre pas
```bash
# Vérifiez que Node.js est installé
node --version

# Réinstallez les dépendances
rm -rf node_modules
npm install
```

### Erreur de base de données
```bash
# Réinitialisez la base de données
npm run init-db
```

### Problème de connexion admin
Vérifiez le fichier `.env` et assurez-vous que les identifiants sont corrects.

## 📝 Support

Pour toute question ou problème :
1. Vérifiez la documentation
2. Consultez les logs du serveur
3. Contactez l'équipe de développement

## 📄 Licence

Ce projet est développé pour un usage interne.

## 🎉 Fait avec

- Node.js
- Express.js
- SQLite (better-sqlite3)
- EJS (templates)
- Bcrypt (sécurité)
- Axios (API calls)

---

Développé avec ❤️ pour HotelDiscount Platform
