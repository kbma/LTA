# 🚀 GUIDE D'INSTALLATION RAPIDE

## Installation en 3 étapes

### Étape 1 : Installer les dépendances
Ouvrez un terminal dans le dossier du projet et exécutez :
```bash
npm install
```

### Étape 2 : Initialiser la base de données
```bash
npm run init-db
```

### Étape 3 : Démarrer le serveur
```bash
npm start
```

## ✅ Accès au site

Le site sera accessible à : **http://localhost:3000**

### 🔐 Connexion Admin
- URL: http://localhost:3000/admin/login
- Username: `admin`
- Password: `admin123`

### 🎫 Codes de test disponibles
Allez sur http://localhost:3000/enter-code et utilisez :
- `SANTE2024` (20% de réduction)
- `PARTNER15` (15% de réduction)
- `PUBLIC25` (25% de réduction)

## 📋 Structure des fichiers à copier

Copiez tous les fichiers dans un nouveau dossier en respectant cette structure :

```
hotel-booking-platform/
├── package.json
├── .env
├── server.js
├── init-db.js
├── README.md
├── routes/
│   ├── public.js
│   └── admin.js
├── services/
│   └── hotelService.js
└── views/
    ├── enter-code.ejs
    ├── offers.ejs
    └── admin/
        ├── login.ejs
        ├── dashboard.ejs
        ├── conventions.ejs
        ├── codes.ejs
        └── margins.ejs
```

## ⚠️ Important

1. **Ne modifiez pas le fichier .env en production** - Changez le mot de passe admin !
2. **Créez les dossiers routes, services et views** avant de copier les fichiers
3. **Exécutez toutes les commandes dans l'ordre**

## 🐛 En cas de problème

Si le serveur ne démarre pas :
```bash
# Supprimer node_modules et réinstaller
rm -rf node_modules
npm install

# Réinitialiser la base de données
npm run init-db

# Redémarrer
npm start
```

## 📞 Besoin d'aide ?

Consultez le fichier README.md pour plus de détails.

---

Bon développement ! 🎉
