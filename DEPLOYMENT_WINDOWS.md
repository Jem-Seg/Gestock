# Déploiement de GeStock sur Serveur Windows

## Guide Complet de Déploiement - Windows Server

---

## 📋 Prérequis

### Logiciels à installer sur le serveur Windows

1. **Node.js 20 LTS ou supérieur**
   - Télécharger depuis : https://nodejs.org/
   - Choisir la version LTS (Long Term Support)
   - Installer avec les options par défaut

2. **Git for Windows** (optionnel mais recommandé)
   - Télécharger depuis : https://git-scm.com/download/win
   - Pour cloner le projet facilement

3. **PostgreSQL** (recommandé pour la production) ou **SQLite** (pour tests)
   - PostgreSQL : https://www.postgresql.org/download/windows/
   - Ou garder SQLite (déjà inclus avec Prisma)

4. **PM2 ou NSSM** (pour exécuter l'app comme service Windows)
   - PM2 : `npm install -g pm2`
   - NSSM : https://nssm.cc/download

---

## 🚀 Option 1 : Déploiement avec PM2 (Recommandé)

### Étape 1 : Installation de Node.js

1. Télécharger Node.js LTS depuis https://nodejs.org/
2. Exécuter l'installateur (nodejs-v20.x.x-x64.msi)
3. Suivre l'assistant d'installation
4. Vérifier l'installation :

```cmd
node --version
npm --version
```

### Étape 2 : Installation de PM2

Ouvrir PowerShell en tant qu'Administrateur :

```powershell
npm install -g pm2
npm install -g pm2-windows-startup

# Configurer PM2 pour démarrer avec Windows
pm2-startup install
```

### Étape 3 : Préparation du projet

#### Option A : Cloner depuis Git

```powershell
cd C:\
git clone https://github.com/votre-repo/gestock.git
cd gestock
```

#### Option B : Copier les fichiers manuellement

1. Créer un dossier : `C:\gestock`
2. Copier tous les fichiers du projet dans ce dossier
3. Ouvrir PowerShell dans `C:\gestock`

### Étape 4 : Configuration de l'environnement

Créer le fichier `.env` dans `C:\gestock` :

```powershell
# Créer le fichier .env
notepad .env
```

Contenu du fichier `.env` :

```env
# Base de données
# Pour SQLite (développement/test)
DATABASE_URL="file:./prod.db"

# Pour PostgreSQL (production)
# DATABASE_URL="postgresql://username:password@localhost:5432/gestock?schema=public"

# NextAuth Configuration
NEXTAUTH_SECRET="votre-secret-genere-avec-openssl"
NEXTAUTH_URL="http://votre-ip-serveur:3000"
# ou https://votre-domaine.com en production

# Clé admin
ADMIN_SECRET_KEY="votre-cle-secrete-admin"

# Environment
NODE_ENV="production"
```

### Étape 5 : Installation des dépendances

```powershell
npm install
```

### Étape 6 : Configuration de la base de données

#### Pour SQLite (simple, pour démarrer rapidement) :

```powershell
npx prisma generate
npx prisma migrate deploy
```

#### Pour PostgreSQL (recommandé pour production) :

1. Installer PostgreSQL
2. Créer une base de données :

```sql
CREATE DATABASE gestock;
CREATE USER gestock_user WITH ENCRYPTED PASSWORD 'votre_mot_de_passe';
GRANT ALL PRIVILEGES ON DATABASE gestock TO gestock_user;
```

3. Modifier le fichier `.env` avec l'URL PostgreSQL
4. Exécuter les migrations :

```powershell
npx prisma generate
npx prisma migrate deploy
```

### Étape 7 : Build de l'application

```powershell
npm run build
```

### Étape 8 : Démarrer avec PM2

```powershell
# Démarrer l'application
pm2 start npm --name "gestock" -- start

# Sauvegarder la configuration pour redémarrage automatique
pm2 save

# Configurer le démarrage automatique
pm2 startup
```

### Étape 9 : Vérifier le fonctionnement

```powershell
# Voir les logs
pm2 logs gestock

# Voir le statut
pm2 status

# Moniteur en temps réel
pm2 monit
```

Accéder à l'application : `http://localhost:3000`

---

## 🔧 Option 2 : Déploiement avec NSSM (Service Windows Natif)

### Étape 1 à 7 : Identiques à l'Option 1

### Étape 8 : Installation de NSSM

1. Télécharger NSSM depuis https://nssm.cc/download
2. Extraire le fichier ZIP
3. Copier `nssm.exe` (version 64-bit) dans `C:\Windows\System32`

### Étape 9 : Créer le service Windows

Ouvrir PowerShell en Administrateur :

```powershell
# Naviguer vers le dossier du projet
cd C:\gestock

# Créer un script de démarrage
@"
@echo off
cd C:\gestock
call npm start
"@ | Out-File -FilePath start.bat -Encoding ASCII

# Installer le service avec NSSM
nssm install GeStock "C:\gestock\start.bat"

# Configurer le service
nssm set GeStock AppDirectory "C:\gestock"
nssm set GeStock DisplayName "GeStock Application"
nssm set GeStock Description "Application de gestion de stock GeStock"
nssm set GeStock Start SERVICE_AUTO_START

# Démarrer le service
nssm start GeStock
```

### Vérifier le service

```powershell
# Voir le statut du service
nssm status GeStock

# Voir les logs (dans l'Observateur d'événements Windows)
eventvwr.msc
```

---

## 🌐 Configuration avec IIS (Internet Information Services)

### Prérequis : Installation d'IIS avec URL Rewrite et ARR

1. Installer IIS depuis "Fonctionnalités Windows"
2. Installer URL Rewrite Module : https://www.iis.net/downloads/microsoft/url-rewrite
3. Installer Application Request Routing (ARR) : https://www.iis.net/downloads/microsoft/application-request-routing

### Configuration du Reverse Proxy

1. Ouvrir IIS Manager
2. Créer un nouveau site web ou utiliser "Default Web Site"
3. Ajouter un fichier `web.config` à la racine :

```xml
<?xml version="1.0" encoding="UTF-8"?>
<configuration>
    <system.webServer>
        <rewrite>
            <rules>
                <rule name="ReverseProxyInboundRule1" stopProcessing="true">
                    <match url="(.*)" />
                    <action type="Rewrite" url="http://localhost:3000/{R:1}" />
                </rule>
            </rules>
        </rewrite>
        <security>
            <requestFiltering>
                <requestLimits maxAllowedContentLength="52428800" />
            </requestFiltering>
        </security>
    </system.webServer>
</configuration>
```

4. L'application Next.js tournera sur le port 3000, IIS fera le proxy sur le port 80/443

---

## 🔒 Configuration du Pare-feu Windows

### Ouvrir le port 3000 (si accès direct)

```powershell
# Ouvrir PowerShell en Administrateur
New-NetFirewallRule -DisplayName "GeStock App" -Direction Inbound -LocalPort 3000 -Protocol TCP -Action Allow
```

### Pour HTTPS (port 443)

```powershell
New-NetFirewallRule -DisplayName "HTTPS" -Direction Inbound -LocalPort 443 -Protocol TCP -Action Allow
```

---

## 🔐 Configuration HTTPS avec SSL

### Option 1 : Certificat auto-signé (développement/test interne)

```powershell
# Générer un certificat auto-signé
$cert = New-SelfSignedCertificate -DnsName "votre-domaine.local" -CertStoreLocation "cert:\LocalMachine\My"

# Exporter le certificat
Export-Certificate -Cert $cert -FilePath "C:\gestock\cert.cer"
```

### Option 2 : Let's Encrypt avec Win-ACME (production)

1. Télécharger Win-ACME : https://www.win-acme.com/
2. Exécuter `wacs.exe`
3. Suivre l'assistant pour obtenir un certificat SSL gratuit
4. Le certificat sera automatiquement configuré dans IIS

### Configuration dans IIS

1. Ouvrir IIS Manager
2. Sélectionner le site web
3. Cliquer sur "Bindings" dans le panneau Actions
4. Ajouter un binding HTTPS (port 443)
5. Sélectionner le certificat SSL

---

## 📊 Monitoring et Logs

### Avec PM2

```powershell
# Voir les logs en temps réel
pm2 logs gestock

# Logs des 100 dernières lignes
pm2 logs gestock --lines 100

# Monitoring
pm2 monit

# Statistiques
pm2 show gestock
```

### Logs Windows (avec NSSM)

Les logs sont dans l'Observateur d'événements Windows :
1. Ouvrir `eventvwr.msc`
2. Naviguer vers "Journaux Windows > Application"
3. Filtrer par source "GeStock"

---

## 💾 Sauvegarde de la Base de Données

### SQLite

```powershell
# Script de sauvegarde automatique
$date = Get-Date -Format "yyyy-MM-dd-HHmmss"
Copy-Item "C:\gestock\prod.db" "C:\backups\gestock-$date.db"
```

Créer une tâche planifiée Windows pour exécuter ce script quotidiennement.

### PostgreSQL

```powershell
# Créer un script de sauvegarde
$env:PGPASSWORD = "votre_mot_de_passe"
$date = Get-Date -Format "yyyy-MM-dd"
& "C:\Program Files\PostgreSQL\15\bin\pg_dump.exe" -U gestock_user -d gestock -F c -f "C:\backups\gestock-$date.backup"
```

### Tâche planifiée Windows

1. Ouvrir "Planificateur de tâches"
2. Créer une tâche de base
3. Déclencheur : Quotidiennement à 2h du matin
4. Action : Démarrer un programme
5. Programme : `powershell.exe`
6. Argument : `-File C:\gestock\backup.ps1`

---

## 🔄 Mise à jour de l'Application

```powershell
# Arrêter l'application
pm2 stop gestock

# Sauvegarder la base de données
Copy-Item "C:\gestock\prod.db" "C:\gestock\prod.db.backup"

# Mettre à jour le code (si Git)
git pull origin main

# Ou copier les nouveaux fichiers manuellement

# Installer les nouvelles dépendances
npm install

# Exécuter les migrations
npx prisma migrate deploy

# Rebuild
npm run build

# Redémarrer
pm2 restart gestock
```

---

## 🛠️ Scripts PowerShell Utiles

### Script de démarrage (`start-gestock.ps1`)

```powershell
# start-gestock.ps1
Set-Location C:\gestock
pm2 start npm --name "gestock" -- start
pm2 save
Write-Host "GeStock démarré avec succès"
```

### Script d'arrêt (`stop-gestock.ps1`)

```powershell
# stop-gestock.ps1
pm2 stop gestock
Write-Host "GeStock arrêté"
```

### Script de redémarrage (`restart-gestock.ps1`)

```powershell
# restart-gestock.ps1
pm2 restart gestock
Write-Host "GeStock redémarré"
```

### Script de logs (`logs-gestock.ps1`)

```powershell
# logs-gestock.ps1
pm2 logs gestock --lines 50
```

---

## 🔍 Dépannage

### L'application ne démarre pas

1. Vérifier que Node.js est installé : `node --version`
2. Vérifier les logs : `pm2 logs gestock`
3. Vérifier le fichier `.env` existe et est correct
4. Vérifier les permissions du dossier

### Erreur de base de données

```powershell
# Régénérer le client Prisma
npx prisma generate

# Réappliquer les migrations
npx prisma migrate deploy
```

### Port 3000 déjà utilisé

```powershell
# Trouver le processus qui utilise le port
netstat -ano | findstr :3000

# Tuer le processus (remplacer PID par l'ID du processus)
taskkill /PID <PID> /F
```

### Impossible d'accéder depuis un autre PC

1. Vérifier le pare-feu Windows
2. Vérifier que l'application écoute sur `0.0.0.0` et non `localhost`
3. Dans `.env`, utiliser l'IP du serveur : `NEXTAUTH_URL="http://192.168.x.x:3000"`

---

## 📝 Checklist de Déploiement

- [ ] Node.js installé
- [ ] PM2 ou NSSM installé
- [ ] Projet copié sur le serveur
- [ ] Fichier `.env` configuré avec les bons secrets
- [ ] Dépendances installées (`npm install`)
- [ ] Base de données configurée (Prisma migrate)
- [ ] Build réussi (`npm run build`)
- [ ] Application démarrée avec PM2/NSSM
- [ ] Pare-feu configuré
- [ ] Premier utilisateur admin créé
- [ ] Rôles initialisés (script setup-roles.mjs)
- [ ] Ministères et structures créés
- [ ] Sauvegarde automatique configurée
- [ ] Monitoring en place
- [ ] SSL/HTTPS configuré (pour production)

---

## 🎯 Accès Initial à l'Application

1. Ouvrir le navigateur
2. Accéder à `http://localhost:3000` (ou l'IP du serveur)
3. Aller sur `/sign-up`
4. Créer le premier compte admin avec la clé `ADMIN_SECRET_KEY`
5. Se connecter
6. Exécuter le script de création des rôles (depuis PowerShell) :

```powershell
cd C:\gestock
node scripts-dev/setup-roles.mjs
```

7. Créer les ministères via `/admin/ministeres`
8. Créer les structures via `/admin/structures`
9. Créer les autres utilisateurs via `/admin/users`

---

## 💡 Bonnes Pratiques

1. **Toujours faire une sauvegarde** avant une mise à jour
2. **Utiliser PostgreSQL** plutôt que SQLite en production
3. **Configurer HTTPS** pour sécuriser les connexions
4. **Mettre en place des sauvegardes automatiques** quotidiennes
5. **Surveiller les logs** régulièrement
6. **Limiter l'accès au serveur** (VPN, IP whitelisting)
7. **Garder Node.js et les dépendances à jour**
8. **Tester les mises à jour** dans un environnement de test d'abord

---

## 📞 Support

En cas de problème :
1. Consulter les logs : `pm2 logs gestock`
2. Vérifier DEPLOYMENT.md pour les problèmes courants
3. Vérifier la documentation Next.js : https://nextjs.org/docs
4. Vérifier la documentation Prisma : https://www.prisma.io/docs

---

**L'application GeStock est maintenant prête à fonctionner sur Windows Server !** 🎉
