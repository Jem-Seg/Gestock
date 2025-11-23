# 🔄 Guide Sauvegarde & Restauration - GeStock

Système automatique de backup PostgreSQL toutes les 5 heures avec restauration rapide.

---

## 📋 Table des Matières

1. [Vue d'ensemble](#vue-densemble)
2. [Installation Rapide](#installation-rapide)
3. [Configuration Automatique](#configuration-automatique)
4. [Sauvegarde Manuelle](#sauvegarde-manuelle)
5. [Restauration](#restauration)
6. [Scénarios de Récupération](#scénarios-de-récupération)
7. [Monitoring](#monitoring)
8. [Sauvegarde Externe](#sauvegarde-externe)
9. [Dépannage](#dépannage)

---

## 🎯 Vue d'ensemble

### Fichiers Fournis

| Fichier | Description |
|---------|-------------|
| **backup-database.ps1** | Script sauvegarde PostgreSQL (PowerShell) |
| **restore-database.ps1** | Script restauration complète |
| **setup-auto-backup.bat** | Installation tâche planifiée Windows |

### Fonctionnalités

- ✅ **Sauvegarde automatique** toutes les 5 heures
- ✅ **Format custom PostgreSQL** (compressé + flexible)
- ✅ **Vérification intégrité** automatique
- ✅ **Rétention 30 jours** (configurable)
- ✅ **Logs détaillés** pour audit
- ✅ **Restauration rapide** en 1 commande
- ✅ **Sauvegarde sécurité** avant restauration
- ✅ **Nettoyage automatique** anciennes sauvegardes
- ✅ **Support copie réseau/cloud**

### Fréquence Sauvegardes

Exécutions quotidiennes (par défaut) :
- **00:00** - Minuit
- **05:00** - Matin
- **10:00** - Matinée
- **15:00** - Après-midi
- **20:00** - Soir

= **5 sauvegardes par jour** × **30 jours** = **150 sauvegardes maximum**

---

## ⚡ Installation Rapide

### Méthode Automatique (Recommandée)

```powershell
# PowerShell Administrateur
cd C:\gestock

# Télécharger scripts (si pas déjà présents)
# Les 3 fichiers doivent être dans C:\gestock

# Exécuter installation
.\setup-auto-backup.bat
```

**Le script configure automatiquement :**
1. ✅ Dossier `C:\gestock\backups`
2. ✅ Variable environnement `PGPASSWORD`
3. ✅ PostgreSQL dans PATH
4. ✅ Tâche planifiée Windows (5 heures)
5. ✅ Test sauvegarde initial

**Durée totale : 2 minutes**

---

### Méthode Manuelle

#### 1. Créer Dossier Backups

```powershell
mkdir C:\gestock\backups
```

#### 2. Configurer Mot de Passe PostgreSQL

```powershell
# Variable environnement système
setx PGPASSWORD "VotreMotDePasseGeStockUser" /M

# Ajouter PostgreSQL au PATH
setx PATH "%PATH%;C:\Program Files\PostgreSQL\14\bin" /M
```

#### 3. Créer Tâche Planifiée

```powershell
schtasks /Create ^
    /TN "GeStock-Backup-Auto" ^
    /TR "powershell.exe -ExecutionPolicy Bypass -File \"C:\gestock\backup-database.ps1\" -Verbose" ^
    /SC HOURLY ^
    /MO 5 ^
    /ST 00:00 ^
    /RU SYSTEM ^
    /RL HIGHEST ^
    /F
```

#### 4. Tester

```powershell
# Exécuter maintenant
schtasks /Run /TN "GeStock-Backup-Auto"

# Vérifier logs
type C:\gestock\backups\backup.log
```

---

## ⚙️ Configuration Automatique

### Paramètres Personnalisables

Modifier `backup-database.ps1` :

```powershell
# Dossier backups (ligne 10)
$BackupDir = "D:\Sauvegardes\GeStock"  # Autre disque

# Rétention (ligne 13)
$RetentionDays = 60  # 60 jours au lieu de 30

# Base de données (lignes 11-12)
$DatabaseName = "gestock_prod"
$DatabaseUser = "gestock_user"
```

### Changer Fréquence

Modifier tâche planifiée :

```powershell
# Toutes les 3 heures
schtasks /Change /TN "GeStock-Backup-Auto" /SC HOURLY /MO 3

# Toutes les 12 heures
schtasks /Change /TN "GeStock-Backup-Auto" /SC HOURLY /MO 12

# Une fois par jour (2h du matin)
schtasks /Change /TN "GeStock-Backup-Auto" /SC DAILY /ST 02:00
```

### Désactiver/Activer

```powershell
# Désactiver
schtasks /Change /TN "GeStock-Backup-Auto" /DISABLE

# Réactiver
schtasks /Change /TN "GeStock-Backup-Auto" /ENABLE
```

---

## 💾 Sauvegarde Manuelle

### Commande Simple

```powershell
cd C:\gestock
.\backup-database.ps1 -Verbose
```

### Options Avancées

```powershell
# Sauvegarde avec compression supplémentaire
.\backup-database.ps1 -Compress -Verbose

# Changer dossier destination
.\backup-database.ps1 -BackupDir "D:\Backups" -Verbose

# Rétention personnalisée
.\backup-database.ps1 -RetentionDays 90 -Verbose

# Base de données différente
.\backup-database.ps1 -DatabaseName "autre_base" -DatabaseUser "autre_user" -Verbose
```

### Sortie Exemple

```
[2025-11-23 14:30:00] [INFO] Démarrage sauvegarde PostgreSQL...
[2025-11-23 14:30:01] [INFO] pg_dump trouvé: pg_dump (PostgreSQL) 14.5
[2025-11-23 14:30:02] [INFO] Création sauvegarde: gestock_prod_2025-11-23_14-30-02.sql
[2025-11-23 14:30:15] [SUCCESS] Sauvegarde réussie - Taille: 45.32 MB - Durée: 13.2s
[2025-11-23 14:30:16] [SUCCESS] Intégrité validée
[2025-11-23 14:30:17] [INFO] Nettoyage sauvegardes anciennes (> 30 jours)...
[2025-11-23 14:30:18] [SUCCESS] Nettoyage terminé - 3 fichiers supprimés - 120.45 MB libérés
[2025-11-23 14:30:18] [INFO] ============================================
[2025-11-23 14:30:18] [INFO] Sauvegarde terminée avec succès
[2025-11-23 14:30:18] [INFO] Total sauvegardes: 147
[2025-11-23 14:30:18] [INFO] Espace total: 6.58 GB
```

---

## 🔄 Restauration

### Lister Sauvegardes Disponibles

```powershell
.\restore-database.ps1 -ListBackups
```

**Sortie :**

```
╔═══════════════════════════════════════════════════════════════╗
║         Sauvegardes Disponibles - GeStock                    ║
╚═══════════════════════════════════════════════════════════════╝

1. gestock_prod_2025-11-23_14-30-02.sql
   Taille: 45.32 MB
   Date: 2025-11-23 14:30:02
   Age: 2.5 heures
   Chemin: C:\gestock\backups\2025-11\gestock_prod_2025-11-23_14-30-02.sql

2. gestock_prod_2025-11-23_09-00-01.sql
   Taille: 44.87 MB
   Date: 2025-11-23 09:00:01
   Age: 7.5 heures
   
...

Total: 147 sauvegardes
```

### Restaurer Dernière Sauvegarde

```powershell
.\restore-database.ps1 -Latest
```

**Confirmation requise :**

```
⚠️  ATTENTION: Cette opération va:
   - Arrêter l'application GeStock
   - Supprimer toutes les données actuelles de gestock_prod
   - Restaurer depuis: C:\gestock\backups\2025-11\gestock_prod_2025-11-23_14-30-02.sql

Tapez 'RESTAURER' pour confirmer: _
```

### Restaurer Fichier Spécifique

```powershell
# Par nom
.\restore-database.ps1 -BackupFile "C:\gestock\backups\2025-11\gestock_prod_2025-11-20_10-00-00.sql"

# Sans confirmation (automatique)
.\restore-database.ps1 -Latest -Force
```

### Restaurer vers Nouvelle Base

```powershell
# Créer gestock_prod_restore au lieu d'écraser
.\restore-database.ps1 -Latest -CreateNew

# Tester avant de valider
# Si OK, renommer bases:
# DROP DATABASE gestock_prod;
# ALTER DATABASE gestock_prod_restore RENAME TO gestock_prod;
```

---

## 🚨 Scénarios de Récupération

### 1. Coupure Électricité / Serveur Éteint

**Symptômes :**
- Serveur redémarré brutalement
- PostgreSQL démarré en mode recovery
- Application indisponible

**Procédure :**

```powershell
# 1. Vérifier service PostgreSQL
net start postgresql-x64-14

# 2. Vérifier intégrité base
psql -U gestock_user -d gestock_prod -c "SELECT COUNT(*) FROM \"User\";"

# Si erreur corruption:

# 3. Restaurer dernière sauvegarde
.\restore-database.ps1 -Latest

# 4. Vérifier application
curl http://localhost:3000
```

**Durée : 5-10 minutes**

---

### 2. Corruption Base de Données

**Symptômes :**
- Erreurs SQL bizarres
- Tables manquantes
- Données incohérentes

**Procédure :**

```powershell
# 1. Lister sauvegardes récentes
.\restore-database.ps1 -ListBackups

# 2. Identifier dernière bonne sauvegarde
# (avant début problème)

# 3. Restaurer
.\restore-database.ps1 -BackupFile "C:\gestock\backups\2025-11\gestock_prod_2025-11-22_15-00-00.sql"

# 4. Vérifier données
npx prisma studio
```

---

### 3. Erreur Humaine (Suppression Accidentelle)

**Symptômes :**
- Données supprimées par erreur
- Utilisateur supprimé
- Produits effacés

**Procédure :**

```powershell
# 1. Arrêter application immédiatement
pm2 stop gestock
net stop GeStock

# 2. Créer backup état actuel (au cas où)
.\backup-database.ps1 -Verbose

# 3. Restaurer sauvegarde avant suppression
.\restore-database.ps1 -ListBackups
# Sélectionner backup AVANT l'erreur

.\restore-database.ps1 -BackupFile "chemin\backup_avant_erreur.sql"

# 4. Vérifier données restaurées
npx prisma studio
```

---

### 4. Migration Ratée

**Symptômes :**
- `npx prisma migrate deploy` échoué
- Schéma cassé
- Relations manquantes

**Procédure :**

```powershell
# 1. Restaurer état avant migration
.\restore-database.ps1 -Latest

# 2. Vérifier schéma
npx prisma db pull

# 3. Corriger migration
# Modifier fichiers migrations/

# 4. Réappliquer
npx prisma migrate deploy
```

---

### 5. Mise à Jour Application Problématique

**Symptômes :**
- Nouvelle version casse données
- Incompatibilité schéma

**Procédure :**

```powershell
# 1. Revenir version précédente code
git checkout [commit-avant-update]

# 2. Restaurer backup avant update
.\restore-database.ps1 -BackupFile "backup_avant_update.sql"

# 3. Rebuild
npm run build

# 4. Redémarrer
pm2 restart gestock
```

---

## 📊 Monitoring

### Vérifier Tâche Planifiée

```powershell
# Détails tâche
schtasks /Query /TN "GeStock-Backup-Auto" /V /FO LIST

# Historique exécutions
Get-ScheduledTask -TaskName "GeStock-Backup-Auto" | Get-ScheduledTaskInfo

# Dernière exécution
schtasks /Query /TN "GeStock-Backup-Auto" /FO LIST | findstr "Last"
```

### Consulter Logs

```powershell
# Dernières 50 lignes
Get-Content C:\gestock\backups\backup.log -Tail 50

# Erreurs uniquement
Get-Content C:\gestock\backups\backup.log | Select-String "ERROR"

# Sauvegardes réussies aujourd'hui
Get-Content C:\gestock\backups\backup.log | Select-String "Sauvegarde réussie" | Select-String (Get-Date -Format "yyyy-MM-dd")
```

### Statistiques Backups

```powershell
# Nombre total sauvegardes
(Get-ChildItem C:\gestock\backups -Recurse -Filter "*.sql").Count

# Espace utilisé
$size = (Get-ChildItem C:\gestock\backups -Recurse -Filter "*.sql" | Measure-Object -Property Length -Sum).Sum / 1GB
Write-Host "Espace total: $([math]::Round($size, 2)) GB"

# Dernière sauvegarde
Get-ChildItem C:\gestock\backups -Recurse -Filter "*.sql" | Sort-Object LastWriteTime -Descending | Select-Object -First 1 Name, LastWriteTime, @{N="Size(MB)";E={[math]::Round($_.Length/1MB, 2)}}
```

### Alerte Email (Optionnel)

Ajouter à la fin de `backup-database.ps1` :

```powershell
# Configuration email
$smtpServer = "smtp.votredomaine.com"
$smtpPort = 587
$emailFrom = "backup@votredomaine.com"
$emailTo = "admin@votredomaine.com"
$emailPassword = ConvertTo-SecureString "password" -AsPlainText -Force
$credential = New-Object System.Management.Automation.PSCredential($emailFrom, $emailPassword)

# Envoyer email succès
$subject = "GeStock Backup OK - $(Get-Date -Format 'yyyy-MM-dd HH:mm')"
$body = "Sauvegarde réussie`nFichier: $backupFilePath`nTaille: $([math]::Round($fileSize, 2)) MB"

Send-MailMessage -SmtpServer $smtpServer -Port $smtpPort -UseSsl -Credential $credential -From $emailFrom -To $emailTo -Subject $subject -Body $body
```

---

## ☁️ Sauvegarde Externe

### Copie Réseau (NAS)

Décommenter dans `backup-database.ps1` (lignes finales) :

```powershell
# Copie vers NAS
$networkBackupPath = "\\NAS-SERVER\Backups\GeStock"

if (Test-Path $networkBackupPath) {
    Copy-Item $backupFilePath $networkBackupPath -Force
    Write-Log "Sauvegarde copiée vers NAS: $networkBackupPath" "SUCCESS"
} else {
    Write-Log "NAS non accessible" "WARNING"
}
```

### Synchronisation Cloud

#### OneDrive

```powershell
# Créer lien symbolique
mklink /D "C:\Users\Admin\OneDrive\GeStock-Backups" "C:\gestock\backups"
```

#### Google Drive

Installer [Google Drive Desktop](https://www.google.com/drive/download/), puis :

```powershell
# Copier vers Drive
$driveBackup = "G:\Mon Drive\GeStock-Backups"
Copy-Item $backupFilePath $driveBackup -Force
```

#### Script Robocopy

Ajouter tâche planifiée supplémentaire :

```batch
REM sync-backups-cloud.bat
@echo off
robocopy "C:\gestock\backups" "D:\Cloud\GeStock-Backups" /MIR /Z /R:3 /W:10 /LOG:"C:\gestock\backups\sync.log"
```

```powershell
# Tâche planifiée (chaque nuit 3h)
schtasks /Create /TN "GeStock-Sync-Cloud" /TR "C:\gestock\sync-backups-cloud.bat" /SC DAILY /ST 03:00 /RU SYSTEM
```

---

## 🔧 Dépannage

### Problème : pg_dump non trouvé

**Erreur :**
```
pg_dump : Le terme 'pg_dump' n'est pas reconnu
```

**Solution :**

```powershell
# Ajouter PostgreSQL au PATH
setx PATH "%PATH%;C:\Program Files\PostgreSQL\14\bin" /M

# Redémarrer PowerShell
```

---

### Problème : Erreur authentification

**Erreur :**
```
pg_dump: error: connection to server failed: FATAL: password authentication failed
```

**Solution :**

```powershell
# Vérifier variable PGPASSWORD
echo $env:PGPASSWORD

# Si vide, définir
setx PGPASSWORD "VotreMotDePasseCorrect" /M

# Ou utiliser fichier .pgpass
# C:\Users\Admin\AppData\Roaming\postgresql\pgpass.conf
# Format: localhost:5432:gestock_prod:gestock_user:password
```

---

### Problème : Espace disque insuffisant

**Erreur :**
```
No space left on device
```

**Solution :**

```powershell
# 1. Nettoyer anciennes sauvegardes manuellement
.\backup-database.ps1 -RetentionDays 7  # Garder seulement 7 jours

# 2. Compresser davantage
.\backup-database.ps1 -Compress

# 3. Déplacer vers autre disque
.\backup-database.ps1 -BackupDir "D:\Backups"
```

---

### Problème : Restauration lente

**Symptôme :**
- Restauration prend >30 minutes

**Solution :**

```powershell
# Option 1: Restaurer sans --clean (plus rapide)
# Modifier restore-database.ps1 ligne pg_restore
# Retirer: --clean --if-exists

# Option 2: Utiliser format plain + psql
pg_dump -U gestock_user -d gestock_prod --format=plain --file=backup.sql
psql -U gestock_user -d gestock_prod < backup.sql  # Plus rapide
```

---

### Problème : Tâche planifiée ne s'exécute pas

**Vérifications :**

```powershell
# 1. Vérifier tâche existe
schtasks /Query /TN "GeStock-Backup-Auto"

# 2. Vérifier statut
schtasks /Query /TN "GeStock-Backup-Auto" /V /FO LIST | findstr "Status"

# 3. Voir dernière erreur
Get-WinEvent -LogName "Microsoft-Windows-TaskScheduler/Operational" | Where-Object {$_.Message -like "*GeStock-Backup*"} | Select-Object -First 5 TimeCreated, Message

# 4. Tester manuellement
schtasks /Run /TN "GeStock-Backup-Auto"
```

---

## ✅ Checklist Sauvegarde

- [ ] Tâche planifiée créée et active
- [ ] PGPASSWORD configuré (variable système)
- [ ] PostgreSQL dans PATH
- [ ] Dossier `C:\gestock\backups` créé
- [ ] Test sauvegarde manuelle réussi
- [ ] Logs `backup.log` accessible
- [ ] Test restauration `-Latest` réussi
- [ ] Espace disque suffisant (>10 GB)
- [ ] Copie externe configurée (NAS/Cloud)
- [ ] Alerte monitoring configurée (optionnel)

---

## 📞 Résumé Commandes Rapides

```powershell
# SAUVEGARDE
.\backup-database.ps1 -Verbose                    # Backup manuel
schtasks /Run /TN "GeStock-Backup-Auto"          # Forcer backup auto

# RESTAURATION
.\restore-database.ps1 -ListBackups              # Lister backups
.\restore-database.ps1 -Latest                   # Restaurer dernier
.\restore-database.ps1 -Latest -Force            # Sans confirmation

# MONITORING
type C:\gestock\backups\backup.log               # Voir logs
schtasks /Query /TN "GeStock-Backup-Auto"        # Status tâche
pm2 logs gestock                                 # Logs application

# MAINTENANCE
schtasks /Change /TN "GeStock-Backup-Auto" /DISABLE   # Désactiver
schtasks /Change /TN "GeStock-Backup-Auto" /ENABLE    # Réactiver
```

---

🎉 **Votre système de sauvegarde automatique est opérationnel !**

- **5 backups/jour** × **30 jours** = Protection maximale
- **Restauration < 10 minutes** en cas d'incident
- **Logs complets** pour audit et monitoring
