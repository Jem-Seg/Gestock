# 📦 GeStock - Système de Gestion de Stock

Application Next.js de gestion de stock pour ministères et structures gouvernementales.

**Production-ready** | **Windows Server** | **PostgreSQL** | **Accès Distant (Desktop + Mobile)**

---

## ✨ Fonctionnalités

- 🔐 Authentification NextAuth (Email/Password)
- 👥 Gestion multi-utilisateurs avec rôles
- 📊 Dashboard temps réel avec statistiques
- 📦 Gestion produits (CRUD complet)
- ➕ Alimentations de stock
- ➖ Octrois de stock
- 📋 Historique transactions
- 🏢 Gestion ministères et structures
- 🔒 Système permissions basé rôles
- 📱 Responsive (Desktop + Mobile)
- 🌐 Accès distant sécurisé

---

## 🚀 Déploiement Rapide Windows

### Installation One-Click (Recommandé)

```powershell
# PowerShell Administrateur
cd C:\chemin\vers\gestock-vf
.\deploy-production.ps1
```

**C'est tout !** Le script automatise :
- ✅ Vérifications prérequis
- ✅ Installation PM2 + NSSM
- ✅ Configuration .env
- ✅ Build production
- ✅ Firewall Windows
- ✅ Service Windows

### Prérequis

- Windows Server 2019+ / Windows 10 Pro+
- Node.js 18+
- PostgreSQL 14+
- NSSM (fourni)

**Détails:** Voir [QUICK_START.md](QUICK_START.md)

---

## 📁 Fichiers de Configuration

### Scripts Déploiement

| Fichier | Description |
|---------|-------------|
| **deploy-production.ps1** | Script PowerShell déploiement automatique |
| **install-nssm-service.bat** | Installation service Windows (NSSM) |
| **configure-firewall.bat** | Configuration automatique firewall |

### Configuration Serveur

| Fichier | Usage |
|---------|-------|
| **ecosystem.config.cjs** | Configuration PM2 (production) |
| **nginx.conf** | Reverse proxy Nginx avec SSL |
| **iis-web.config** | Reverse proxy IIS (ARR) |

### Documentation

| Fichier | Contenu |
|---------|---------|
| **QUICK_START.md** | Installation 10 minutes |
| **DEPLOYMENT_GUIDE.md** | Guide complet 400+ lignes |
| **BUILD_FIX_GUIDE.md** | Résolution erreurs build |
| **POSTGRESQL_SETUP.md** | Migration SQLite → PostgreSQL |

---

## 🏗️ Architecture

```
GeStock
├── Next.js 16 (App Router)
├── TypeScript (Strict Mode)
├── Prisma ORM
├── PostgreSQL (Production)
├── NextAuth.js v5
├── DaisyUI + TailwindCSS
└── PM2 + NSSM (Service Windows)
```

---

## 🌐 Accès Application

| Contexte | URL |
|----------|-----|
| **Local** | `http://localhost:3000` |
| **Réseau local (LAN)** | `http://192.168.1.X:3000` |
| **Internet** | `http://[IP-PUBLIQUE]` (via reverse proxy) |
| **Domaine + SSL** | `https://gestock.votredomaine.com` |

---

## 🔧 Commandes Utiles

### PM2

```powershell
pm2 list              # Apps actives
pm2 logs gestock      # Logs temps réel
pm2 monit             # Monitoring
pm2 restart gestock   # Redémarrer
```

### Service Windows

```powershell
net start GeStock     # Démarrer
net stop GeStock      # Arrêter
sc query GeStock      # Status
```

### Développement

```powershell
npm run dev           # Dev mode (http://localhost:3000)
npm run build         # Build production
npm run start         # Start production (après build)
```

### Prisma

```powershell
npx prisma studio     # Interface GUI base de données
npx prisma generate   # Générer client
npx prisma migrate dev # Créer migration (dev)
npx prisma migrate deploy # Appliquer migrations (prod)
```

---

## 📊 Structure Projet

```
gestock-vf/
├── app/                      # Next.js App Router
│   ├── api/                  # Routes API
│   ├── components/           # Composants React
│   ├── admin/                # Pages admin
│   ├── products/             # Gestion produits
│   ├── alimentations/        # Entrées stock
│   ├── octrois/              # Sorties stock
│   └── dashboard/            # Dashboard principal
├── prisma/
│   ├── schema.prisma         # Schéma base de données
│   └── migrations/           # Migrations SQL
├── lib/                      # Utilitaires
├── hooks/                    # React hooks custom
├── public/                   # Fichiers statiques
│   └── uploads/              # Images produits
├── ecosystem.config.cjs      # Config PM2
├── nginx.conf               # Config Nginx
├── deploy-production.ps1    # Script déploiement
└── DEPLOYMENT_GUIDE.md      # Documentation complète
```

---

## 🔐 Configuration Production

### 1. Variables Environnement (.env)

```env
# PostgreSQL
DATABASE_URL="postgresql://user:password@localhost:5432/gestock_prod"

# NextAuth
NEXTAUTH_URL="http://your-server-ip:3000"
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"

# App
NODE_ENV="production"
PORT=3000
HOSTNAME="0.0.0.0"
```

### 2. Base de Données

```sql
-- Créer utilisateur
CREATE USER gestock_user WITH PASSWORD 'SecurePassword123!';

-- Créer base
CREATE DATABASE gestock_prod OWNER gestock_user;

-- Privilèges
GRANT ALL PRIVILEGES ON DATABASE gestock_prod TO gestock_user;
```

### 3. Appliquer Migrations

```powershell
npx prisma migrate deploy
```

---

## 🛡️ Sécurité

### Headers HTTP (Nginx/IIS)

- ✅ X-Frame-Options: SAMEORIGIN
- ✅ X-Content-Type-Options: nosniff
- ✅ X-XSS-Protection: 1; mode=block
- ✅ Referrer-Policy: strict-origin-when-cross-origin
- ✅ HSTS (HTTPS uniquement)

### Firewall Windows

Ports ouverts :
- **3000** : Application Next.js
- **443** : HTTPS (reverse proxy)
- **80** : HTTP → Redirect HTTPS

### Authentication

- NextAuth.js v5 (JWT Strategy)
- Sessions 30 jours
- CSRF Protection
- Secure cookies (production)

---

## 📱 Accès Mobile

L'application est **fully responsive** et accessible depuis :

1. **Navigateur mobile** (même réseau WiFi)
   ```
   http://192.168.1.X:3000
   ```

2. **Internet** (avec port forwarding)
   ```
   http://[IP-PUBLIQUE]
   ```

3. **PWA** (Progressive Web App)
   - Installable sur écran d'accueil
   - Fonctionne offline (cache)

---

## 🚦 Reverse Proxy

### Option A: Nginx (Recommandé)

✅ Compression Gzip  
✅ Cache fichiers statiques  
✅ SSL/TLS automatique  
✅ Load balancing  

**Config:** `nginx.conf` (fournie)

### Option B: IIS

✅ Intégration Windows native  
✅ URL Rewrite + ARR  
✅ Windows Authentication  

**Config:** `iis-web.config` (fournie)

---

## 📈 Monitoring & Logs

### PM2 Monitoring

```powershell
pm2 monit             # Dashboard temps réel
pm2 describe gestock  # Détails app
```

### Logs

| Type | Emplacement |
|------|-------------|
| PM2 Out | `logs/pm2-out.log` |
| PM2 Error | `logs/pm2-error.log` |
| Service | `logs/service-output.log` |
| Nginx | `C:\nginx\logs\` |

### Rotation Automatique

```powershell
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 30
```

---

## 🔄 Mises à Jour

### Déploiement Nouvelle Version

```powershell
# 1. Pull derniers changements
git pull origin main

# 2. Installer dépendances
npm install --production

# 3. Rebuild
npm run build

# 4. Migrations Prisma (si nécessaire)
npx prisma migrate deploy

# 5. Redémarrer
pm2 restart gestock

# Ou via service
net stop GeStock
net start GeStock
```

### Zero-Downtime Deployment

```powershell
# PM2 reload (graceful restart)
pm2 reload gestock

# Ou cluster mode (ecosystem.config.cjs)
# instances: 'max' ou nombre
```

---

## ❓ Dépannage

### Application ne démarre pas

```powershell
# Vérifier logs
pm2 logs gestock --err --lines 50

# Rebuild
npm run build
pm2 restart gestock
```

### Erreur connexion PostgreSQL

```powershell
# Vérifier service
net start postgresql-x64-14

# Tester connexion
psql -U gestock_user -d gestock_prod

# Vérifier .env
notepad .env
```

### Inaccessible depuis autre PC

```powershell
# Vérifier firewall
netsh advfirewall firewall show rule name="GeStock - HTTP"

# Test ping
ping 192.168.1.X

# Vérifier HOSTNAME (doit être 0.0.0.0)
# ecosystem.config.cjs
```

**Plus de détails:** Voir [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) section Dépannage

---

## 📞 Support & Documentation

### Guides Disponibles

1. **QUICK_START.md** - Installation 10 minutes
2. **DEPLOYMENT_GUIDE.md** - Guide complet 400+ lignes
3. **BUILD_FIX_GUIDE.md** - Résolution erreurs build
4. **POSTGRESQL_SETUP.md** - Migration base de données

### Générer Rapport Debug

```powershell
# Rapport complet pour support
echo "=== PM2 ===" > debug-report.txt
pm2 list >> debug-report.txt
pm2 logs gestock --lines 50 --nostream >> debug-report.txt
echo "=== Service ===" >> debug-report.txt
sc query GeStock >> debug-report.txt
echo "=== Network ===" >> debug-report.txt
netstat -ano | findstr :3000 >> debug-report.txt
```

---

## 📄 Licence

Propriétaire - Usage interne gouvernemental

---

## 🎯 Technologies

- **Framework:** Next.js 16
- **Language:** TypeScript
- **Database:** PostgreSQL 14+
- **ORM:** Prisma 6
- **Auth:** NextAuth.js v5
- **UI:** DaisyUI + TailwindCSS
- **Process Manager:** PM2
- **Service:** NSSM
- **Reverse Proxy:** Nginx / IIS

---

## ✅ Checklist Production

- [ ] PostgreSQL installé et configuré
- [ ] `.env` configuré avec DATABASE_URL
- [ ] `schema.prisma` en mode `postgresql`
- [ ] Migrations appliquées (`prisma migrate deploy`)
- [ ] Build réussi (`npm run build`)
- [ ] Service Windows créé (NSSM)
- [ ] Firewall configuré
- [ ] Reverse proxy installé (Nginx/IIS)
- [ ] SSL/HTTPS configuré (production)
- [ ] Accès local OK (`http://localhost:3000`)
- [ ] Accès réseau OK (`http://192.168.1.X`)
- [ ] Monitoring PM2 actif

---

**🎉 Application Production-Ready pour Windows Server avec accès distant Desktop + Mobile !**

**Démarrage rapide:** `.\deploy-production.ps1`  
**Documentation complète:** [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)
