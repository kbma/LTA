# Guide de Déploiement Vercel & Postgres

Votre application a été configurée pour être hébergée sur Vercel avec une base de données PostgreSQL (Vercel Postgres, Neon, Supabase, etc.).

## 1. Préparation de la base de données
1. Créez un projet sur Vercel.
2. Ajoutez une base de données **Storage** (Vercel Postgres) ou utilisez un fournisseur externe (Neon, Supabase).
3. Obtenez l'URL de connexion (ex: `postgres://user:password@host:port/dbname`).
4. Ajoutez les variables d'environnement suivantes dans Vercel (Settings > Environment Variables) :
   - `POSTGRES_URL`: L'URL complète de connexion.
   - `SESSION_SECRET`: Une chaîne aléatoire sécurisée.
   - `ADMIN_USERNAME`: (Optionnel) Nom d'utilisateur admin.
   - `ADMIN_PASSWORD`: (Optionnel) Mot de passe admin.

## 2. Initialisation des données
Une fois le déploiement effectué ou en local avec la variable `POSTGRES_URL` définie dans `.env` :

Exécutez le script d'initialisation pour créer les tables :
```bash
node init-db.js
```
*(Si vous êtes sur Vercel, vous pouvez exécuter cela localement en vous connectant à la base de données distante via le `.env`, ou via une fonction temporaire, mais le plus simple est de le faire depuis votre machine locale connectée à la base distante).*

## 3. Développement Local
L'application fonctionne toujours en local avec SQLite si `POSTGRES_URL` n'est pas défini.
Pour tester avec Postgres en local :
1. Renommez `.env.example` en `.env`.
2. Mettez votre `POSTGRES_URL` dans `.env`.
3. Lancez `npm run dev`.

## Notes
- Le fichier `database.js` gère automatiquement la bascule entre SQLite (fichier local) et Postgres (Cloud).
- Le fichier `vercel.json` configure le point d'entrée pour Vercel.
