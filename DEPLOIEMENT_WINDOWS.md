# Guide de Déploiement - GeStock sur Windows Server

## 📋 Prérequis

### Logiciels requis
- **Node.js** 18.x ou supérieur ([télécharger](https://nodejs.org/))
- **NSSM** (Non-Sucking Service Manager) ([télécharger](https://nssm.cc/download))
- **Git** (optionnel mais recommandé) ([télécharger](https://git-scm.com/download/win))
- **PostgreSQL** 14 ou supérieur pour la base de données

### Configuration système minimale
- **OS**: Windows Server 2016 ou supérieur
- **RAM**: 4 GB minimum (8 GB recommandé)
- **Disque**: 10 GB espace libre
- **Réseau**: Port 3000 ouvert (ou personnalisé)

---

## 🚀 Installation Initiale

### Étape 1: Cloner le projet

```powershell
# Via Git
cd C:\
git clone <url-de-votre-repo> gema
cd gema

# OU copie manuelle
# Copiez tous les fichiers dans C:\gema
```

### Étape 2: Configurer les variables d'environnement

Créez le fichier `.env` dans `C:\gema` :

```env
# Base de données
DATABASE_URL="postgresql://user:password@localhost:5432/gestock?schema=public"

# NextAuth
NEXTAUTH_SECRET="votre-secret-aleatoire-tres-long"
NEXTAUTH_URL="http://localhost:3000"

# Mode production
NODE_ENV="production"
```

**Générer NEXTAUTH_SECRET** :
```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Étape 3: Installer les dépendances

```powershell
cd C:\gema
npm install
```

### Étape 4: Configurer la base de données

```powershell
# Générer le client Prisma
npx prisma generate

# Appliquer les migrations
npx prisma migrate deploy

# (Optionnel) Peupler avec données de test
node scripts/seed.js
```

### Étape 5: Builder l'application

```powershell
npm run build
```

### Étape 6: Installer le service Windows avec NSSM

```powershell
# Ouvrir PowerShell en tant qu'administrateur
nssm install GeStockApp "C:\Program Files\nodejs\node.exe" "C:\gema\node_modules\next\dist\bin\next" start

# Configuration du service
nssm set GeStockApp AppDirectory C:\gema
nssm set GeStockApp AppEnvironmentExtra NODE_ENV=production
nssm set GeStockApp DisplayName "GeStock Application"
nssm set GeStockApp Description "Système de Gestion des Stocks - République Islamique de Mauritanie"
nssm set GeStockApp Start SERVICE_AUTO_START

# Gestion des logs
nssm set GeStockApp AppStdout C:\gema\logs\stdout.log
nssm set GeStockApp AppStderr C:\gema\logs\stderr.log
nssm set GeStockApp AppRotateFiles 1
nssm set GeStockApp AppRotateBytes 10485760

# Démarrer le service
nssm start GeStockApp
```

### Étape 7: Vérifier l'installation

```powershell
# Vérifier le statut du service
nssm status GeStockApp

# Consulter les logs
Get-Content C:\gema\logs\stdout.log -Tail 50

# Tester l'accès HTTP
Invoke-WebRequest -Uri http://localhost:3000
```

**Accéder à l'application** : http://localhost:3000

---

## 🔄 Mise à Jour (Déploiement)

### Méthode Automatique (Recommandée)

```powershell
# Exécuter le script en tant qu'administrateur
cd C:\gema
.\deploy-windows.ps1
```

Le script effectue automatiquement :
1. ✅ Vérification NSSM
2. ✅ Arrêt du service
3. ✅ Sauvegarde de l'ancienne version
4. ✅ Mise à jour du code (Git pull)
5. ✅ Installation dépendances
6. ✅ Build application
7. ✅ Redémarrage service
8. ✅ Vérification santé

### Méthode Manuelle

```powershell
# 1. Arrêter le service
nssm stop GeStockApp

# 2. Sauvegarder (optionnel)
Copy-Item C:\gema C:\gema_backup_$(Get-Date -Format 'yyyyMMdd') -Recurse

# 3. Mettre à jour le code
cd C:\gema
git pull

# 4. Installer + Builder
npm install
npm run build

# 5. Redémarrer
nssm start GeStockApp
```

---

## 🔧 Gestion du Service

### Commandes NSSM courantes

```powershell
# Statut
nssm status GeStockApp

# Démarrer
nssm start GeStockApp

# Arrêter
nssm stop GeStockApp

# Redémarrer
nssm restart GeStockApp

# Désinstaller (conserve les fichiers)
nssm remove GeStockApp confirm

# Voir la configuration
nssm get GeStockApp AppDirectory
nssm get GeStockApp AppEnvironmentExtra
```

### Logs et Diagnostic

```powershell
# Logs application
Get-Content C:\gema\logs\stdout.log -Tail 100
Get-Content C:\gema\logs\stderr.log -Tail 100

# Logs déploiement
Get-Content C:\gema\logs\deployment_*.log | Select-Object -Last 1

# Logs Windows Event Viewer
Get-EventLog -LogName Application -Source GeStockApp -Newest 20
```

---

## 🌐 Configuration Reverse Proxy (IIS)

### Installer IIS + URL Rewrite

```powershell
# Installer IIS
Install-WindowsFeature -name Web-Server -IncludeManagementTools

# Télécharger URL Rewrite Module
# https://www.iis.net/downloads/microsoft/url-rewrite
```

### Configurer web.config

Créez `C:\inetpub\wwwroot\gestock\web.config` :

```xml
<?xml version="1.0" encoding="UTF-8"?>
<configuration>
  <system.webServer>
    <rewrite>
      <rules>
        <rule name="GeStock" stopProcessing="true">
          <match url="(.*)" />
          <action type="Rewrite" url="http://localhost:3000/{R:1}" />
        </rule>
      </rules>
    </rewrite>
  </system.webServer>
</configuration>
```

---

## 🔐 Sécurité

### Pare-feu Windows

```powershell
# Autoriser port 3000
New-NetFirewallRule -DisplayName "GeStock App" -Direction Inbound -LocalPort 3000 -Protocol TCP -Action Allow
```

### SSL/HTTPS (Recommandé)

1. Obtenir certificat SSL (Let's Encrypt ou commercial)
2. Configurer reverse proxy IIS avec SSL
3. Rediriger HTTP → HTTPS
4. Mettre à jour `NEXTAUTH_URL` dans `.env`

---

## 📊 Monitoring

### Vérification Santé

```powershell
# Script de vérification (à exécuter régulièrement)
$status = nssm status GeStockApp
$response = Invoke-WebRequest -Uri http://localhost:3000 -TimeoutSec 5

if ($status -like "*RUNNING*" -and $response.StatusCode -eq 200) {
    Write-Host "✅ Application opérationnelle" -ForegroundColor Green
} else {
    Write-Host "❌ Problème détecté!" -ForegroundColor Red
    # Envoyer alerte email/SMS
}
```

### Tâche Planifiée de Surveillance

```powershell
# Créer tâche qui vérifie toutes les 5 minutes
$action = New-ScheduledTaskAction -Execute "PowerShell.exe" -Argument "-File C:\gema\scripts\health-check.ps1"
$trigger = New-ScheduledTaskTrigger -Once -At (Get-Date) -RepetitionInterval (New-TimeSpan -Minutes 5)
Register-ScheduledTask -TaskName "GeStock Health Check" -Action $action -Trigger $trigger
```

---

## 🆘 Dépannage

### Service ne démarre pas

```powershell
# Vérifier les logs
Get-Content C:\gema\logs\stderr.log

# Vérifier variables environnement
nssm get GeStockApp AppEnvironmentExtra

# Tester manuellement
cd C:\gema
npm run start
```

### Erreur de build

```powershell
# Nettoyer cache
npm cache clean --force
Remove-Item -Recurse -Force node_modules
Remove-Item -Recurse -Force .next

# Réinstaller
npm install
npm run build
```

### Base de données inaccessible

```powershell
# Tester connexion PostgreSQL
Test-NetConnection -ComputerName localhost -Port 5432

# Vérifier DATABASE_URL dans .env
Get-Content C:\gema\.env | Select-String DATABASE_URL
```

---

## 📞 Support

**Documentation** : Voir `GUIDE_UTILISATEUR.md`  
**Logs** : `C:\gema\logs\`  
**Sauvegardes** : `C:\gema_backups\`

---

## 📝 Checklist Post-Déploiement

- [ ] Service démarré : `nssm status GeStockApp`
- [ ] Application accessible : http://localhost:3000
- [ ] Connexion base de données OK
- [ ] Page de connexion s'affiche
- [ ] Création compte admin fonctionne
- [ ] Upload documents fonctionne
- [ ] Génération PDF rapports OK
- [ ] Statistiques s'affichent
- [ ] Logs configurés : `C:\gema\logs\`
- [ ] Sauvegarde automatique active
- [ ] Pare-feu configuré si externe
- [ ] SSL configuré si production
- [ ] Monitoring actif

---

**Version**: 1.0.0  
**Dernière mise à jour**: 26 novembre 2025
