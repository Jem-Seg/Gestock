# 🚀 GeStock - Guide de Déploiement Production

## ✅ Application auditée et prête pour la production

**Dernière vérification :** 21 novembre 2025  
**Status Build :** ✅ Réussi sans erreurs  
**TypeScript :** ✅ 0 erreur  
**Sécurité :** ✅ Headers configurés  
**Performance :** ✅ Optimisé

---

## 📋 Prérequis

- **Node.js** >= 18.0.0
- **npm** >= 9.0.0
- **Base de données** : SQLite (dev) ou PostgreSQL (prod recommandé)

---

## 🔧 Configuration Production

### 1. Variables d'environnement

Copiez `.env.example` vers `.env` et configurez :

```bash
cp .env.example .env
```

**Variables critiques à modifier :**

```env
# URL de l'application (IMPORTANT!)
NEXTAUTH_URL=https://votre-domaine.com  # ou http://IP_SERVEUR:3000

# Générer un nouveau secret (OBLIGATOIRE)
NEXTAUTH_SECRET=$(openssl rand -base64 32)

# Clé admin (OBLIGATOIRE)
ADMIN_SECRET_KEY=$(openssl rand -base64 32)

# Base de données production (PostgreSQL recommandé)
DATABASE_URL="postgresql://user:password@localhost:5432/gestock"
```

### 2. Installation

```bash
# Installer les dépendances
npm install

# Générer le client Prisma
npx prisma generate

# Exécuter les migrations
npx prisma migrate deploy
```

### 3. Build Production

```bash
# Build optimisé avec standalone
npm run build

# Le build génère :
# - .next/standalone (serveur optimisé)
# - .next/static (assets statiques)
# - public (fichiers publics)
```

### 4. Démarrage Production

```bash
# Méthode 1 : Next.js standalone
cd .next/standalone
node server.js

# Méthode 2 : npm start
npm run start

# L'application démarre sur le port 3000 par défaut
```

---

## 🐳 Déploiement Docker

### Dockerfile

```dockerfile
FROM node:18-alpine AS base

# 1. Dependencies
FROM base AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

# 2. Builder
FROM base AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx prisma generate
RUN npm run build

# 3. Runner
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma

USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]
```

### docker-compose.yml

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://postgres:password@db:5432/gestock
      - NEXTAUTH_URL=http://localhost:3000
      - NEXTAUTH_SECRET=your-secret-here
    depends_on:
      - db

  db:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=gestock
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

---

## 📱 Configuration Mobile

Pour accéder depuis mobile sur réseau local :

1. **Trouver l'IP du serveur**
   ```bash
   # Windows
   ipconfig
   
   # Linux/Mac
   ifconfig
   ```

2. **Modifier .env**
   ```env
   NEXTAUTH_URL=http://192.168.X.X:3000
   ```

3. **Rebuild**
   ```bash
   npm run build
   npm run start
   ```

4. **Accès mobile**
   ```
   http://192.168.X.X:3000
   http://192.168.X.X:3000/mobile-test  # Page diagnostic
   ```

---

## 🔒 Sécurité

### Headers HTTP configurés

- ✅ **Strict-Transport-Security** (HSTS)
- ✅ **X-Frame-Options** (SAMEORIGIN)
- ✅ **X-Content-Type-Options** (nosniff)
- ✅ **X-XSS-Protection**
- ✅ **Referrer-Policy**

### Rate Limiting

Intégré dans `lib/security.ts` :
- **Login** : 5 tentatives / 15 minutes
- **API** : 100 requêtes / minute

### Bonnes pratiques

- ✅ Secrets générés aléatoirement
- ✅ Mots de passe hashés (bcrypt)
- ✅ Validation des entrées
- ✅ Headers de sécurité
- ✅ PoweredByHeader désactivé

---

## 🎯 Performance

### Optimisations activées

- ✅ **Standalone output** : Build optimisé
- ✅ **Image optimization** : AVIF + WebP
- ✅ **Compression** : gzip/brotli
- ✅ **Cache headers** : API no-cache, static assets cached
- ✅ **React Strict Mode** : Détection bugs

### Monitoring recommandé

```bash
# Vérifier la taille du build
du -sh .next

# Analyser le bundle
npm run build -- --profile
```

---

## 🧪 Tests

### Avant déploiement

```bash
# 1. Build
npm run build

# 2. Vérifier les erreurs TypeScript
npm run lint

# 3. Test local
npm run start

# 4. Tester les endpoints critiques
curl http://localhost:3000/api/health
```

### Checklist pré-production

- [ ] Variables `.env` configurées
- [ ] Secrets générés aléatoirement
- [ ] Base de données migrée
- [ ] Build réussi sans erreurs
- [ ] Tests de connexion OK
- [ ] Mobile testé (si applicable)
- [ ] Backups configurés

---

## 🐛 Troubleshooting

### Build échoue

```bash
# Nettoyer et rebuilder
rm -rf .next node_modules
npm install
npm run build
```

### Erreurs Prisma

```bash
# Régénérer le client
npx prisma generate

# Réinitialiser la DB (⚠️ DEV SEULEMENT)
npx prisma migrate reset
```

### Problèmes mobile

1. Vérifier `/mobile-test` pour diagnostics
2. S'assurer que `NEXTAUTH_URL` = IP serveur
3. Vérifier pare-feu (port 3000 ouvert)

---

## 📊 Monitoring Production

### Logs

```bash
# Suivre les logs
tail -f logs/app.log

# Logs Docker
docker-compose logs -f app
```

### Health Check

```bash
# Vérifier l'application
curl http://localhost:3000

# Vérifier la base de données
npx prisma db pull
```

---

## 🔄 Mises à jour

```bash
# 1. Backup DB
pg_dump gestock > backup.sql

# 2. Pull code
git pull origin main

# 3. Install
npm install

# 4. Migrate
npx prisma migrate deploy

# 5. Build
npm run build

# 6. Restart
pm2 restart gestock
# ou
docker-compose restart
```

---

## 📞 Support

- **Documentation** : `/docs`
- **Diagnostic mobile** : `/mobile-test`
- **Guide déploiement** : `MOBILE_DEPLOYMENT_GUIDE.md`

---

**Application vérifiée et sécurisée pour production** ✅
