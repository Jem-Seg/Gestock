# 🚀 Démarrage Rapide - GeStock Production Windows

Guide express pour déployer GeStock sur Windows en 10 minutes.

---

## ⚡ Installation Express (PowerShell)

### 1. Prérequis Rapides

```powershell
# Vérifier Node.js (18+)
node --version

# Vérifier PostgreSQL
pg_ctl --version

# Si manquant, installer:
# Node.js: https://nodejs.org
# PostgreSQL: https://www.postgresql.org/download/windows/
```

### 2. Créer Base de Données

```sql
-- Ouvrir pgAdmin ou psql
CREATE USER gestock_user WITH PASSWORD 'MonMotDePasse123!';
CREATE DATABASE gestock_prod OWNER gestock_user;
GRANT ALL PRIVILEGES ON DATABASE gestock_prod TO gestock_user;
```

### 3. Déploiement Automatique

```powershell
# PowerShell Administrateur
cd C:\chemin\vers\gestock-vf

# Lancer script automatique
.\deploy-production.ps1

# Ou avec options
.\deploy-production.ps1 -InstallPath "D:\gestock"
```

**Le script fait automatiquement:**
- ✅ Vérifications prérequis
- ✅ Installation PM2
- ✅ Génération `.env`
- ✅ Build production
- ✅ Configuration Prisma
- ✅ Firewall Windows
- ✅ Service Windows (NSSM)

### 4. Vérifier

```powershell
# Status PM2
pm2 list

# Status service
sc query GeStock

# Tester accès
curl http://localhost:3000
```

**✅ C'est tout ! Application accessible sur `http://localhost:3000`**

---

## 🔧 Installation Manuelle (Étape par Étape)

Si vous préférez contrôler chaque étape :

### 1. Copier Projet

```powershell
mkdir C:\gestock
cd C:\gestock
# Copier tous fichiers du projet ici
```

### 2. Configurer .env

Créer `C:\gestock\.env` :

```env
DATABASE_URL="postgresql://gestock_user:MonMotDePasse123!@localhost:5432/gestock_prod"
NEXTAUTH_URL="http://192.168.1.100:3000"
NEXTAUTH_SECRET="générer-avec-commande-ci-dessous"
NODE_ENV="production"
PORT=3000
HOSTNAME="0.0.0.0"
```

**Générer NEXTAUTH_SECRET:**

```powershell
[Convert]::ToBase64String((1..32|%{Get-Random -Minimum 0 -Maximum 255}))
```

### 3. Modifier Prisma

`prisma/schema.prisma` :

```prisma
datasource db {
  provider = "postgresql"  // Changer de "sqlite"
  url      = env("DATABASE_URL")
}
```

### 4. Installer & Build

```powershell
# Installer dépendances
npm install --production

# Prisma
npx prisma generate
npx prisma migrate deploy

# Build Next.js
npm run build
```

### 5. Installer PM2

```powershell
npm install -g pm2
npm install -g pm2-windows-startup
pm2-startup install
```

### 6. Démarrer Application

```powershell
# Démarrer avec PM2
pm2 start ecosystem.config.cjs

# Sauvegarder config
pm2 save
```

### 7. Firewall (Administrateur)

```powershell
# Exécuter script
.\configure-firewall.bat

# Ou manuellement
netsh advfirewall firewall add rule name="GeStock" dir=in action=allow protocol=TCP localport=3000
```

### 8. Service Windows (NSSM)

```powershell
# Télécharger NSSM depuis https://nssm.cc/download
# Extraire nssm.exe dans C:\gestock\

# Installer service
.\install-nssm-service.bat

# Ou manuellement
nssm install GeStock "%APPDATA%\npm\pm2.cmd" "start" "ecosystem.config.cjs"
nssm set GeStock AppDirectory "C:\gestock"
net start GeStock
```

---

## 📱 Accès Distant (Mobile + Desktop)

### Configuration Rapide

1. **Obtenir IP serveur:**
   ```powershell
   ipconfig | findstr IPv4
   # Exemple: 192.168.1.100
   ```

2. **Accès réseau local:**
   - Desktop: `http://192.168.1.100:3000`
   - Mobile (même WiFi): `http://192.168.1.100:3000`

3. **Accès Internet (optionnel):**
   - Router → Port Forwarding
   - Port externe: 80
   - IP interne: 192.168.1.100
   - Port interne: 80
   - Accès: `http://votre-ip-publique`

---

## 🌐 Reverse Proxy (Production)

### Option A: Nginx (Recommandé)

```powershell
# 1. Télécharger Nginx
# http://nginx.org/en/download.html
# Extraire dans C:\nginx

# 2. Copier config fournie
copy nginx.conf C:\nginx\conf\nginx.conf

# 3. Démarrer
cd C:\nginx
start nginx

# 4. Service Windows
nssm install Nginx "C:\nginx\nginx.exe"
net start Nginx
```

**Accès:** `http://votre-ip` (port 80)

### Option B: IIS

```powershell
# 1. Installer IIS
Install-WindowsFeature -name Web-Server -IncludeManagementTools

# 2. Installer URL Rewrite + ARR
# https://www.iis.net/downloads/microsoft/url-rewrite
# https://www.iis.net/downloads/microsoft/application-request-routing

# 3. Copier web.config
copy iis-web.config C:\inetpub\wwwroot\gestock\web.config

# 4. Créer site dans IIS Manager
```

---

## 🔍 Vérification Rapide

### Checklist Post-Installation

```powershell
# 1. Service actif?
sc query GeStock
# État: RUNNING ✅

# 2. PM2 actif?
pm2 list
# gestock | online ✅

# 3. Port écouté?
netstat -ano | findstr :3000
# TCP 0.0.0.0:3000 LISTENING ✅

# 4. Firewall OK?
netsh advfirewall firewall show rule name="GeStock - HTTP"
# Enabled: Yes ✅

# 5. Accès local?
curl http://localhost:3000
# HTTP 200 ✅

# 6. Accès réseau?
# Depuis autre PC: http://192.168.1.100:3000 ✅
```

---

## 🛠️ Commandes Essentielles

### PM2

```powershell
pm2 list              # Lister apps
pm2 logs gestock      # Logs temps réel
pm2 monit             # Monitoring
pm2 restart gestock   # Redémarrer
pm2 stop gestock      # Arrêter
pm2 delete gestock    # Supprimer
```

### Service Windows

```powershell
net start GeStock     # Démarrer
net stop GeStock      # Arrêter
sc query GeStock      # Status
sc delete GeStock     # Supprimer
```

### Nginx

```powershell
cd C:\nginx
nginx -t              # Test config
start nginx           # Démarrer
nginx -s reload       # Recharger
nginx -s stop         # Arrêter
```

### Logs

```powershell
# PM2
type C:\gestock\logs\pm2-out.log
type C:\gestock\logs\pm2-error.log

# Service
type C:\gestock\logs\service-output.log

# Nginx
type C:\nginx\logs\access.log
type C:\nginx\logs\error.log
```

---

## ❌ Problèmes Courants

### Application ne démarre pas

```powershell
# 1. Vérifier logs
pm2 logs gestock --err --lines 50

# 2. Rebuild
npm run build
pm2 restart gestock

# 3. Redémarrer service
net stop GeStock
net start GeStock
```

### Erreur PostgreSQL

```powershell
# 1. Vérifier service
net start postgresql-x64-14

# 2. Tester connexion
psql -U gestock_user -d gestock_prod

# 3. Vérifier .env
notepad C:\gestock\.env
```

### Inaccessible depuis autre PC

```powershell
# 1. Ping serveur
ping 192.168.1.100

# 2. Test firewall (temporaire)
netsh advfirewall set allprofiles state off
# Tester accès
netsh advfirewall set allprofiles state on

# 3. Vérifier HOSTNAME
# ecosystem.config.cjs: HOSTNAME: '0.0.0.0'
```

---

## 📞 Aide Rapide

### Générer Rapport Debug

```powershell
# Copier-coller et envoyer à support
pm2 list
sc query GeStock
netstat -ano | findstr :3000
pm2 logs gestock --lines 50 --nostream
```

### Redémarrage Complet

```powershell
# Tout arrêter
pm2 stop all
net stop GeStock
net stop Nginx

# Tout démarrer
net start GeStock
net start Nginx
pm2 resurrect
```

---

## 🎯 Prochaines Étapes

1. ✅ **Application fonctionne** → Tester toutes fonctionnalités
2. 🔒 **Configurer HTTPS** → Voir DEPLOYMENT_GUIDE.md
3. 🌍 **Accès Internet** → Port forwarding + DNS
4. 📊 **Monitoring** → PM2 Plus, Windows Event Viewer
5. 💾 **Sauvegardes** → PostgreSQL dumps automatiques

---

## 📚 Documentation Complète

Pour configuration avancée, voir **DEPLOYMENT_GUIDE.md** :
- SSL/HTTPS Let's Encrypt
- DNS Dynamique
- Monitoring avancé
- Performance tuning
- Sécurité hardening
- Multi-serveurs
- Clustering PM2

---

**🎉 Votre application GeStock est production-ready !**

Support: Consultez DEPLOYMENT_GUIDE.md ou générez rapport debug.
