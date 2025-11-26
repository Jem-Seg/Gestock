# Script de déploiement GeStock sur Windows Server
# Auteur: Automatisation GeStock
# Date: 26 novembre 2025
# Description: Automatise la mise à jour de l'application GeStock via NSSM

# Configuration
$APP_NAME = "GeStockApp"
$APP_DIR = "C:\gema"
$LOG_DIR = "$APP_DIR\logs"
$BACKUP_DIR = "C:\gema_backups"
$TIMESTAMP = Get-Date -Format "yyyyMMdd_HHmmss"

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  Déploiement GeStock - $TIMESTAMP" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Fonction de journalisation
function Write-Log {
    param($Message, $Type = "INFO")
    $LogMessage = "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] [$Type] $Message"
    Write-Host $LogMessage
    Add-Content -Path "$LOG_DIR\deployment_$TIMESTAMP.log" -Value $LogMessage
}

# Vérifier que le script est exécuté en tant qu'administrateur
$currentPrincipal = New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent())
$isAdmin = $currentPrincipal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "ERREUR: Ce script doit être exécuté en tant qu'administrateur!" -ForegroundColor Red
    Write-Host "Faites un clic droit sur PowerShell et sélectionnez 'Exécuter en tant qu'administrateur'" -ForegroundColor Yellow
    pause
    exit 1
}

# Créer les répertoires nécessaires
if (-not (Test-Path $LOG_DIR)) {
    New-Item -ItemType Directory -Path $LOG_DIR -Force | Out-Null
}

if (-not (Test-Path $BACKUP_DIR)) {
    New-Item -ItemType Directory -Path $BACKUP_DIR -Force | Out-Null
}

Write-Log "Début du déploiement" "INFO"

# Étape 1: Vérifier que NSSM est installé
Write-Host "Étape 1: Vérification de NSSM..." -ForegroundColor Yellow
$nssmPath = Get-Command nssm -ErrorAction SilentlyContinue

if (-not $nssmPath) {
    Write-Log "NSSM n'est pas installé ou pas dans le PATH" "ERROR"
    Write-Host "ERREUR: NSSM n'est pas trouvé!" -ForegroundColor Red
    Write-Host "Installez NSSM depuis https://nssm.cc/download" -ForegroundColor Yellow
    pause
    exit 1
}

Write-Log "NSSM trouvé: $($nssmPath.Source)" "SUCCESS"
Write-Host "✓ NSSM trouvé" -ForegroundColor Green

# Étape 2: Arrêter le service
Write-Host "Étape 2: Arrêt du service $APP_NAME..." -ForegroundColor Yellow
Write-Log "Arrêt du service $APP_NAME" "INFO"

$serviceStatus = nssm status $APP_NAME 2>&1
if ($serviceStatus -like "*SERVICE_RUNNING*") {
    nssm stop $APP_NAME
    Start-Sleep -Seconds 5
    Write-Log "Service arrêté avec succès" "SUCCESS"
    Write-Host "✓ Service arrêté" -ForegroundColor Green
} else {
    Write-Log "Service déjà arrêté ou non trouvé" "WARNING"
    Write-Host "⚠ Service déjà arrêté" -ForegroundColor Yellow
}

# Étape 3: Sauvegarder l'ancienne version
Write-Host "Étape 3: Sauvegarde de l'ancienne version..." -ForegroundColor Yellow
Write-Log "Création de la sauvegarde" "INFO"

$backupPath = "$BACKUP_DIR\gema_backup_$TIMESTAMP"
if (Test-Path $APP_DIR) {
    # Exclure node_modules et .next du backup pour gagner du temps
    $excludeDirs = @("node_modules", ".next", ".git")
    
    New-Item -ItemType Directory -Path $backupPath -Force | Out-Null
    
    Get-ChildItem -Path $APP_DIR -Exclude $excludeDirs | ForEach-Object {
        Copy-Item -Path $_.FullName -Destination $backupPath -Recurse -Force
    }
    
    Write-Log "Sauvegarde créée: $backupPath" "SUCCESS"
    Write-Host "✓ Sauvegarde créée" -ForegroundColor Green
} else {
    Write-Log "Répertoire $APP_DIR non trouvé, pas de sauvegarde nécessaire" "WARNING"
    Write-Host "⚠ Pas de version précédente à sauvegarder" -ForegroundColor Yellow
}

# Étape 4: Mise à jour du code (Git ou copie manuelle)
Write-Host "Étape 4: Mise à jour du code source..." -ForegroundColor Yellow

Set-Location $APP_DIR

# Vérifier si c'est un dépôt Git
if (Test-Path ".git") {
    Write-Log "Dépôt Git détecté, pull des dernières modifications" "INFO"
    
    # Sauvegarder les modifications locales si nécessaire
    git stash
    
    # Pull les dernières modifications
    git pull origin main
    
    if ($LASTEXITCODE -eq 0) {
        Write-Log "Code mis à jour via Git" "SUCCESS"
        Write-Host "✓ Code mis à jour (Git)" -ForegroundColor Green
    } else {
        Write-Log "Erreur lors du pull Git" "ERROR"
        Write-Host "✗ Erreur Git - Continuez manuellement" -ForegroundColor Red
    }
} else {
    Write-Log "Pas de dépôt Git - Mise à jour manuelle requise" "WARNING"
    Write-Host "⚠ Mise à jour manuelle requise (pas de Git)" -ForegroundColor Yellow
    Write-Host "Copiez les nouveaux fichiers dans $APP_DIR puis appuyez sur Entrée" -ForegroundColor Cyan
    pause
}

# Étape 5: Installer les dépendances
Write-Host "Étape 5: Installation des dépendances NPM..." -ForegroundColor Yellow
Write-Log "npm install" "INFO"

npm install

if ($LASTEXITCODE -eq 0) {
    Write-Log "Dépendances installées" "SUCCESS"
    Write-Host "✓ Dépendances installées" -ForegroundColor Green
} else {
    Write-Log "Erreur lors de l'installation des dépendances" "ERROR"
    Write-Host "✗ Erreur npm install" -ForegroundColor Red
    pause
    exit 1
}

# Étape 6: Build de l'application
Write-Host "Étape 6: Build de l'application Next.js..." -ForegroundColor Yellow
Write-Log "npm run build" "INFO"

npm run build

if ($LASTEXITCODE -eq 0) {
    Write-Log "Build réussi" "SUCCESS"
    Write-Host "✓ Build réussi" -ForegroundColor Green
} else {
    Write-Log "Erreur lors du build" "ERROR"
    Write-Host "✗ Erreur build" -ForegroundColor Red
    Write-Host "Voulez-vous restaurer la sauvegarde? (O/N)" -ForegroundColor Yellow
    $restore = Read-Host
    
    if ($restore -eq "O" -or $restore -eq "o") {
        Write-Host "Restauration de la sauvegarde..." -ForegroundColor Yellow
        Copy-Item -Path "$backupPath\*" -Destination $APP_DIR -Recurse -Force
        Write-Host "✓ Sauvegarde restaurée" -ForegroundColor Green
    }
    
    pause
    exit 1
}

# Étape 7: Redémarrer le service
Write-Host "Étape 7: Redémarrage du service $APP_NAME..." -ForegroundColor Yellow
Write-Log "Redémarrage du service" "INFO"

nssm start $APP_NAME
Start-Sleep -Seconds 5

$serviceStatus = nssm status $APP_NAME 2>&1
if ($serviceStatus -like "*SERVICE_RUNNING*") {
    Write-Log "Service redémarré avec succès" "SUCCESS"
    Write-Host "✓ Service redémarré" -ForegroundColor Green
} else {
    Write-Log "Erreur lors du redémarrage du service" "ERROR"
    Write-Host "✗ Erreur redémarrage service" -ForegroundColor Red
    Write-Host "Vérifiez les logs: $LOG_DIR" -ForegroundColor Yellow
    pause
    exit 1
}

# Étape 8: Vérification du déploiement
Write-Host "Étape 8: Vérification du déploiement..." -ForegroundColor Yellow
Write-Log "Vérification santé application" "INFO"

Start-Sleep -Seconds 10

# Test HTTP (adapter le port si nécessaire)
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000" -TimeoutSec 10 -ErrorAction Stop
    
    if ($response.StatusCode -eq 200) {
        Write-Log "Application répond correctement" "SUCCESS"
        Write-Host "✓ Application accessible" -ForegroundColor Green
    }
} catch {
    Write-Log "L'application ne répond pas encore" "WARNING"
    Write-Host "⚠ Application en cours de démarrage..." -ForegroundColor Yellow
    Write-Host "Vérifiez manuellement: http://localhost:3000" -ForegroundColor Cyan
}

# Résumé
Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  Déploiement terminé!" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Résumé:" -ForegroundColor Yellow
Write-Host "  - Sauvegarde: $backupPath" -ForegroundColor White
Write-Host "  - Log: $LOG_DIR\deployment_$TIMESTAMP.log" -ForegroundColor White
Write-Host "  - Service: $(nssm status $APP_NAME)" -ForegroundColor White
Write-Host ""
Write-Host "Accédez à l'application:" -ForegroundColor Yellow
Write-Host "  http://localhost:3000" -ForegroundColor Cyan
Write-Host ""

Write-Log "Déploiement terminé avec succès" "SUCCESS"

# Nettoyer les anciennes sauvegardes (garder les 5 dernières)
Write-Host "Nettoyage des anciennes sauvegardes..." -ForegroundColor Yellow
$backups = Get-ChildItem -Path $BACKUP_DIR -Directory | Sort-Object CreationTime -Descending
if ($backups.Count -gt 5) {
    $backups | Select-Object -Skip 5 | ForEach-Object {
        Remove-Item -Path $_.FullName -Recurse -Force
        Write-Log "Sauvegarde supprimée: $($_.Name)" "INFO"
    }
    Write-Host "✓ Anciennes sauvegardes nettoyées" -ForegroundColor Green
}

Write-Host ""
Write-Host "Appuyez sur une touche pour quitter..." -ForegroundColor Cyan
pause
