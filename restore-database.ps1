# ============================================
# Script de Restauration PostgreSQL
# GeStock - Restauration depuis sauvegarde
# ============================================

param(
    [string]$BackupFile,
    [string]$BackupDir = "C:\gestock\backups",
    [string]$DatabaseName = "gestock_prod",
    [string]$DatabaseUser = "gestock_user",
    [switch]$Latest,
    [switch]$ListBackups,
    [switch]$Force,
    [switch]$CreateNew
)

# ============================================
# Configuration
# ============================================

$ErrorActionPreference = "Stop"
$LogFile = Join-Path $BackupDir "restore.log"

function Write-Log {
    param(
        [string]$Message,
        [string]$Level = "INFO"
    )
    
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logMessage = "[$timestamp] [$Level] $Message"
    
    Add-Content -Path $LogFile -Value $logMessage
    
    switch ($Level) {
        "ERROR" { Write-Host $logMessage -ForegroundColor Red }
        "WARNING" { Write-Host $logMessage -ForegroundColor Yellow }
        "SUCCESS" { Write-Host $logMessage -ForegroundColor Green }
        default { Write-Host $logMessage -ForegroundColor Cyan }
    }
}

# ============================================
# Lister Sauvegardes Disponibles
# ============================================

function Get-AvailableBackups {
    $backups = Get-ChildItem -Path $BackupDir -Recurse -File | Where-Object {
        $_.Name -like "*.sql" -or $_.Name -like "*.sql.zip"
    } | Sort-Object LastWriteTime -Descending
    
    return $backups
}

if ($ListBackups) {
    Write-Host "`n╔═══════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
    Write-Host "║         Sauvegardes Disponibles - GeStock                    ║" -ForegroundColor Cyan
    Write-Host "╚═══════════════════════════════════════════════════════════════╝`n" -ForegroundColor Cyan
    
    $backups = Get-AvailableBackups
    
    if ($backups.Count -eq 0) {
        Write-Host "Aucune sauvegarde trouvée dans: $BackupDir" -ForegroundColor Yellow
        exit 0
    }
    
    $index = 1
    foreach ($backup in $backups) {
        $size = $backup.Length / 1MB
        $age = (Get-Date) - $backup.LastWriteTime
        
        Write-Host "$index. " -NoNewline -ForegroundColor White
        Write-Host "$($backup.Name)" -ForegroundColor Green
        Write-Host "   Taille: $([math]::Round($size, 2)) MB" -ForegroundColor Gray
        Write-Host "   Date: $($backup.LastWriteTime.ToString('yyyy-MM-dd HH:mm:ss'))" -ForegroundColor Gray
        Write-Host "   Age: $([math]::Round($age.TotalHours, 1)) heures" -ForegroundColor Gray
        Write-Host "   Chemin: $($backup.FullName)" -ForegroundColor DarkGray
        Write-Host ""
        $index++
    }
    
    Write-Host "Total: $($backups.Count) sauvegardes" -ForegroundColor Cyan
    exit 0
}

# ============================================
# Sélection Sauvegarde
# ============================================

Write-Log "╔═══════════════════════════════════════════════════════════════╗"
Write-Log "║         Restauration Base de Données - GeStock               ║"
Write-Log "╚═══════════════════════════════════════════════════════════════╝"

if ($Latest) {
    Write-Log "Recherche dernière sauvegarde..."
    $backups = Get-AvailableBackups
    
    if ($backups.Count -eq 0) {
        Write-Log "ERREUR: Aucune sauvegarde disponible" "ERROR"
        exit 1
    }
    
    $BackupFile = $backups[0].FullName
    Write-Log "Dernière sauvegarde trouvée: $($backups[0].Name)" "SUCCESS"
    Write-Log "Date: $($backups[0].LastWriteTime)"
}

if (-not $BackupFile) {
    Write-Log "ERREUR: Aucun fichier de sauvegarde spécifié" "ERROR"
    Write-Host "`nUtilisation:" -ForegroundColor Yellow
    Write-Host "  .\restore-database.ps1 -Latest                    # Dernière sauvegarde" -ForegroundColor White
    Write-Host "  .\restore-database.ps1 -BackupFile 'chemin.sql'   # Fichier spécifique" -ForegroundColor White
    Write-Host "  .\restore-database.ps1 -ListBackups               # Lister sauvegardes" -ForegroundColor White
    exit 1
}

if (-not (Test-Path $BackupFile)) {
    Write-Log "ERREUR: Fichier non trouvé: $BackupFile" "ERROR"
    exit 1
}

# ============================================
# Décompression si nécessaire
# ============================================

$workingBackupFile = $BackupFile

if ($BackupFile -like "*.zip") {
    Write-Log "Décompression archive..."
    
    try {
        $tempDir = Join-Path $env:TEMP "gestock_restore_$(Get-Date -Format 'yyyyMMdd_HHmmss')"
        New-Item -ItemType Directory -Path $tempDir -Force | Out-Null
        
        Expand-Archive -Path $BackupFile -DestinationPath $tempDir -Force
        
        $extractedFile = Get-ChildItem -Path $tempDir -Filter "*.sql" | Select-Object -First 1
        if ($extractedFile) {
            $workingBackupFile = $extractedFile.FullName
            Write-Log "Archive décompressée: $($extractedFile.Name)" "SUCCESS"
        } else {
            Write-Log "ERREUR: Aucun fichier .sql dans l'archive" "ERROR"
            exit 1
        }
    } catch {
        Write-Log "Erreur décompression: $_" "ERROR"
        exit 1
    }
}

# ============================================
# Vérifications Préalables
# ============================================

# Vérifier pg_restore
try {
    $pgRestoreVersion = & pg_restore --version 2>&1
    Write-Log "pg_restore trouvé: $pgRestoreVersion"
} catch {
    Write-Log "ERREUR: pg_restore non trouvé dans PATH" "ERROR"
    exit 1
}

# Vérifier service PostgreSQL
$postgresService = Get-Service -Name "postgresql*" -ErrorAction SilentlyContinue
if (-not $postgresService -or $postgresService.Status -ne "Running") {
    Write-Log "ERREUR: Service PostgreSQL non actif" "ERROR"
    Write-Log "Démarrez le service: net start postgresql-x64-14" "ERROR"
    exit 1
}

# ============================================
# Avertissement & Confirmation
# ============================================

if (-not $Force) {
    Write-Host "`n⚠️  ATTENTION: Cette opération va:" -ForegroundColor Red
    Write-Host "   - Arrêter l'application GeStock" -ForegroundColor Yellow
    Write-Host "   - Supprimer toutes les données actuelles de $DatabaseName" -ForegroundColor Yellow
    Write-Host "   - Restaurer depuis: $BackupFile" -ForegroundColor Yellow
    Write-Host ""
    
    $confirmation = Read-Host "Tapez 'RESTAURER' pour confirmer"
    
    if ($confirmation -ne "RESTAURER") {
        Write-Log "Restauration annulée par l'utilisateur" "WARNING"
        exit 0
    }
}

# ============================================
# Arrêter Application
# ============================================

Write-Log "Arrêt application GeStock..."

try {
    # Arrêter PM2
    & pm2 stop gestock 2>&1 | Out-Null
    Start-Sleep -Seconds 3
    Write-Log "PM2 arrêté" "SUCCESS"
} catch {
    Write-Log "Avertissement: PM2 non arrêté: $_" "WARNING"
}

try {
    # Arrêter service Windows
    Stop-Service -Name "GeStock" -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 2
    Write-Log "Service Windows arrêté" "SUCCESS"
} catch {
    Write-Log "Avertissement: Service non arrêté: $_" "WARNING"
}

# ============================================
# Sauvegarde de Sécurité
# ============================================

Write-Log "Création sauvegarde de sécurité avant restauration..."

try {
    $preRestoreBackup = Join-Path $BackupDir "pre-restore_$(Get-Date -Format 'yyyy-MM-dd_HH-mm-ss').sql"
    
    & pg_dump -U $DatabaseUser -h localhost -d $DatabaseName --format=custom --file=$preRestoreBackup 2>&1 | Out-Null
    
    if ($LASTEXITCODE -eq 0) {
        Write-Log "Sauvegarde sécurité créée: $preRestoreBackup" "SUCCESS"
    }
} catch {
    Write-Log "Impossible de créer sauvegarde sécurité: $_" "WARNING"
}

# ============================================
# Restauration Base de Données
# ============================================

Write-Log "╔═══════════════════════════════════════════════════════════════╗"
Write-Log "║              RESTAURATION EN COURS...                         ║"
Write-Log "╚═══════════════════════════════════════════════════════════════╝"

try {
    $env:PGPASSWORD = $env:PGPASSWORD
    
    if ($CreateNew) {
        # Créer nouvelle base
        Write-Log "Création nouvelle base de données: ${DatabaseName}_restore"
        
        & psql -U postgres -h localhost -c "CREATE DATABASE ${DatabaseName}_restore OWNER $DatabaseUser" 2>&1 | Out-Null
        $targetDb = "${DatabaseName}_restore"
    } else {
        # Supprimer connexions existantes
        Write-Log "Fermeture connexions existantes..."
        
        $killConnectionsSQL = @"
SELECT pg_terminate_backend(pg_stat_activity.pid)
FROM pg_stat_activity
WHERE pg_stat_activity.datname = '$DatabaseName'
  AND pid <> pg_backend_pid();
"@
        
        & psql -U postgres -h localhost -c $killConnectionsSQL 2>&1 | Out-Null
        
        # Supprimer et recréer base
        Write-Log "Suppression base existante..."
        & psql -U postgres -h localhost -c "DROP DATABASE IF EXISTS $DatabaseName" 2>&1 | Out-Null
        
        Write-Log "Création base vierge..."
        & psql -U postgres -h localhost -c "CREATE DATABASE $DatabaseName OWNER $DatabaseUser" 2>&1 | Out-Null
        
        $targetDb = $DatabaseName
    }
    
    # Restaurer depuis backup
    Write-Log "Restauration données depuis sauvegarde..."
    $startTime = Get-Date
    
    & pg_restore -U $DatabaseUser -h localhost -d $targetDb --verbose --clean --if-exists $workingBackupFile 2>&1 | Out-Null
    
    if ($LASTEXITCODE -eq 0 -or $LASTEXITCODE -eq 1) {  # 1 = warnings OK
        $duration = (Get-Date) - $startTime
        Write-Log "Restauration réussie - Durée: $($duration.TotalSeconds)s" "SUCCESS"
    } else {
        Write-Log "ERREUR pg_restore - Code: $LASTEXITCODE" "ERROR"
        exit 1
    }
    
} catch {
    Write-Log "ERREUR restauration: $_" "ERROR"
    
    # Tenter restauration backup sécurité
    if (Test-Path $preRestoreBackup) {
        Write-Log "Tentative restauration sauvegarde sécurité..." "WARNING"
        & pg_restore -U $DatabaseUser -h localhost -d $DatabaseName $preRestoreBackup 2>&1 | Out-Null
    }
    
    exit 1
}

# ============================================
# Vérifications Post-Restauration
# ============================================

Write-Log "Vérification restauration..."

try {
    # Compter tables
    $tableCountSQL = "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public'"
    $tableCount = & psql -U $DatabaseUser -h localhost -d $targetDb -t -c $tableCountSQL 2>&1
    
    Write-Log "Tables restaurées: $($tableCount.Trim())"
    
    # Compter enregistrements (exemples)
    $tables = @("User", "Product", "Alimentation", "Octroi")
    foreach ($table in $tables) {
        try {
            $count = & psql -U $DatabaseUser -h localhost -d $targetDb -t -c "SELECT COUNT(*) FROM `"$table`"" 2>&1
            Write-Log "  - $table : $($count.Trim()) enregistrements"
        } catch {
            # Table peut ne pas exister
        }
    }
    
    Write-Log "Vérifications terminées" "SUCCESS"
    
} catch {
    Write-Log "Impossible de vérifier données: $_" "WARNING"
}

# ============================================
# Nettoyage Temporaire
# ============================================

if ($BackupFile -like "*.zip" -and (Test-Path $tempDir)) {
    Remove-Item $tempDir -Recurse -Force -ErrorAction SilentlyContinue
    Write-Log "Fichiers temporaires nettoyés"
}

# ============================================
# Redémarrer Application
# ============================================

Write-Log "Redémarrage application GeStock..."

try {
    # Régénérer Prisma Client (important!)
    Write-Log "Régénération Prisma Client..."
    Set-Location "C:\gestock"
    & npx prisma generate 2>&1 | Out-Null
    
    # Redémarrer PM2
    & pm2 restart gestock 2>&1 | Out-Null
    Write-Log "PM2 redémarré" "SUCCESS"
    
    # Redémarrer service
    Start-Service -Name "GeStock" -ErrorAction SilentlyContinue
    Write-Log "Service Windows redémarré" "SUCCESS"
    
} catch {
    Write-Log "Erreur redémarrage: $_" "WARNING"
    Write-Log "Redémarrez manuellement: pm2 restart gestock" "WARNING"
}

# ============================================
# Résumé Final
# ============================================

Write-Log "╔═══════════════════════════════════════════════════════════════╗"
Write-Log "║         RESTAURATION TERMINÉE AVEC SUCCÈS                    ║"
Write-Log "╚═══════════════════════════════════════════════════════════════╝"
Write-Log ""
Write-Log "Base de données restaurée: $targetDb"
Write-Log "Depuis: $BackupFile"
Write-Log "Sauvegarde sécurité: $preRestoreBackup"
Write-Log ""
Write-Log "Testez l'application: http://localhost:3000"
Write-Log ""

exit 0
