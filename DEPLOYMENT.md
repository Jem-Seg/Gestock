# Guide de Déploiement - GeStock

## Prérequis

- Node.js 20+ installé
- Base de données compatible Prisma (PostgreSQL recommandé pour la production)
- Serveur web ou plateforme de déploiement (Vercel, Railway, etc.)

## Configuration de l'environnement

### 1. Variables d'environnement

Créez un fichier `.env` à la racine du projet avec les variables suivantes :

```env
# Base de données
# Pour PostgreSQL en production
DATABASE_URL="postgresql://user:password@host:5432/gestock?schema=public"

# NextAuth Configuration
NEXTAUTH_SECRET="générer-avec-openssl-rand-base64-32"
NEXTAUTH_URL="https://votre-domaine.com"

# Clé secrète pour la création du premier compte admin
ADMIN_SECRET_KEY="votre-cle-secrete-admin-unique"

# Environment
NODE_ENV="production"
```

### 2. Génération des secrets

```bash
# Générer NEXTAUTH_SECRET
openssl rand -base64 32

# Générer ADMIN_SECRET_KEY
openssl rand -base64 32
```

## Installation

### 1. Cloner le projet et installer les dépendances

```bash
git clone <votre-repo>
cd gestock-vf
npm install
```

### 2. Configuration de la base de données

```bash
# Générer le client Prisma
npx prisma generate

# Exécuter les migrations
npx prisma migrate deploy

# (Optionnel) Visualiser la base de données
npx prisma studio
```

### 3. Initialiser les données de base

Après le déploiement initial, vous devez créer :

#### a. Le premier utilisateur admin

1. Accédez à `/sign-up`
2. Créez un compte avec l'email souhaité
3. Lors de l'inscription, fournissez la clé `ADMIN_SECRET_KEY` définie dans votre `.env`
4. Ce premier utilisateur aura automatiquement le rôle Admin

#### b. Créer les rôles

Exécutez le script de configuration des rôles disponible dans `scripts-dev/setup-roles.mjs` :

```bash
node scripts-dev/setup-roles.mjs
```

Cela créera les rôles suivants :
- Admin
- Responsable Achats
- Responsable Financier
- Directeur financier
- Ordonnateur
- Agent de saisie

#### c. Créer les ministères et structures

Via l'interface admin (`/admin/ministeres` et `/admin/structures`), créez :
1. Les ministères
2. Les structures rattachées à chaque ministère

## Build et Déploiement

### Build local

```bash
# Build de production
npm run build

# Tester le build localement
npm start
```

### Déploiement sur Vercel

1. Installez la CLI Vercel :
```bash
npm i -g vercel
```

2. Déployez :
```bash
vercel
```

3. Configurez les variables d'environnement dans le dashboard Vercel

### Déploiement sur Railway

1. Connectez votre repository GitHub à Railway
2. Configurez les variables d'environnement dans les settings
3. Railway détectera automatiquement Next.js et déploiera

### Déploiement sur serveur VPS (Ubuntu/Debian)

#### 1. Installation de Node.js et PM2

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
sudo npm install -g pm2
```

#### 2. Déploiement de l'application

```bash
# Cloner et installer
git clone <votre-repo>
cd gestock-vf
npm install
npm run build

# Configurer PM2
pm2 start npm --name "gestock" -- start
pm2 save
pm2 startup
```

#### 3. Configuration Nginx (optionnel)

```nginx
server {
    listen 80;
    server_name votre-domaine.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Migration de base de données SQLite vers PostgreSQL

### 1. Exporter les données SQLite

```bash
sqlite3 prisma/dev.db .dump > backup.sql
```

### 2. Modifier schema.prisma

Changez le provider de `sqlite` à `postgresql` :

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

### 3. Créer la base PostgreSQL

```bash
# Créer les tables
npx prisma migrate deploy

# Importer les données (adapter selon votre structure)
psql -U user -d gestock < backup.sql
```

## Scripts utiles

### Scripts de production

- `npm run build` - Build de l'application
- `npm start` - Démarrer en mode production
- `npx prisma migrate deploy` - Exécuter les migrations
- `npx prisma generate` - Générer le client Prisma

### Scripts de développement (dans scripts-dev/)

Ces scripts sont **uniquement pour le développement** :
- `generate-reset-link.mjs` - Générer un lien de réinitialisation de mot de passe
- `reset-password.mjs` - Réinitialiser un mot de passe
- `set-initial-quantities.mjs` - Définir les quantités initiales des produits

## Sécurité

### Points critiques

1. **Ne jamais committer le fichier `.env`** avec les secrets réels
2. **Utiliser des secrets forts** générés avec `openssl rand -base64 32`
3. **Activer HTTPS** en production (Let's Encrypt avec Certbot)
4. **Limiter l'accès à la base de données** (firewall, VPN)
5. **Sauvegardes régulières** de la base de données

### Sauvegardes

#### PostgreSQL

```bash
# Sauvegarde complète
pg_dump -U user -d gestock > backup-$(date +%Y%m%d).sql

# Restauration
psql -U user -d gestock < backup-20250120.sql
```

#### SQLite

```bash
# Sauvegarde
cp prisma/dev.db backup/dev-$(date +%Y%m%d).db

# Restauration
cp backup/dev-20250120.db prisma/dev.db
```

## Monitoring

### Logs avec PM2

```bash
pm2 logs gestock
pm2 monit
```

### Santé de l'application

- Vérifier que l'application répond : `curl http://localhost:3000`
- Vérifier les logs d'erreurs
- Surveiller l'utilisation CPU/mémoire

## Mise à jour de l'application

```bash
# Pull des dernières modifications
git pull origin main

# Installer les nouvelles dépendances
npm install

# Exécuter les migrations
npx prisma migrate deploy

# Rebuild
npm run build

# Redémarrer avec PM2
pm2 restart gestock
```

## Problèmes courants

### Erreur Prisma P2025

Si vous obtenez une erreur "Record not found", vérifiez :
- Les migrations sont bien appliquées
- Les données existent dans la base
- Les IDs utilisés sont corrects

### Build qui échoue

```bash
# Nettoyer le cache
rm -rf .next
rm -rf node_modules
npm install
npm run build
```

### Variables d'environnement non chargées

Vérifiez :
- Le fichier `.env` est à la racine
- Les noms des variables sont corrects
- Redémarrez l'application après modification

## Support

Pour tout problème, consultez :
- `README.md` - Documentation générale
- `PREMIER_DEMARRAGE.md` - Guide de premier démarrage
- Logs de l'application
- Issues GitHub
