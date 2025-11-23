# ============================================
# Script de Sauvegarde Automatique PostgreSQL
# GeStock - Backup toutes les 5 heures
# ============================================

param(
    [string]$BackupDir = "C:\gestock\backups",
    [string]$DatabaseName = "gestock_prod",
    [string]$DatabaseUser = "gestock_user",
    [int]$RetentionDays = 30,
    [switch]$Compress,
    [switch]$Verbose
)

# ============================================
# Configuration
# ============================================

$ErrorActionPreference = "Stop"
$LogFile = Join-Path $BackupDir "backup.log"
$MaxBackupsPerDay = 5  # 24h / 5h = ~5 backups par jour

# Couleurs
function Write-Log {
    param(
        [string]$Message,
        [string]$Level = "INFO"
    )
    
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logMessage = "[$timestamp] [$Level] $Message"
    
    # Écrire dans fichier log
    Add-Content -Path $LogFile -Value $logMessage
    
    # Afficher dans console si Verbose
    if ($Verbose) {
        switch ($Level) {
            "ERROR" { Write-Host $logMessage -ForegroundColor Red }
            "WARNING" { Write-Host $logMessage -ForegroundColor Yellow }
            "SUCCESS" { Write-Host $logMessage -ForegroundColor Green }
            default { Write-Host $logMessage -ForegroundColor Cyan }
        }
    }
}

# ============================================
# Créer Structure Dossiers
# ============================================

Write-Log "Démarrage sauvegarde PostgreSQL..."

if (-not (Test-Path $BackupDir)) {
    New-Item -ItemType Directory -Path $BackupDir -Force | Out-Null
    Write-Log "Dossier backups créé: $BackupDir" "SUCCESS"
}

# Sous-dossiers par date
$dateFolder = Get-Date -Format "yyyy-MM"
$monthBackupDir = Join-Path $BackupDir $dateFolder
if (-not (Test-Path $monthBackupDir)) {
    New-Item -ItemType Directory -Path $monthBackupDir -Force | Out-Null
}

# ============================================
# Vérifications Préalables
# ============================================

# Vérifier pg_dump
try {
    $pgDumpVersion = & pg_dump --version 2>&1
    Write-Log "pg_dump trouvé: $pgDumpVersion"
} catch {
    Write-Log "ERREUR: pg_dump non trouvé dans PATH" "ERROR"
    Write-Log "Ajoutez PostgreSQL bin au PATH: C:\Program Files\PostgreSQL\14\bin" "ERROR"
    exit 1
}

# Vérifier service PostgreSQL
$postgresService = Get-Service -Name "postgresql*" -ErrorAction SilentlyContinue
if (-not $postgresService -or $postgresService.Status -ne "Running") {
    Write-Log "ERREUR: Service PostgreSQL non actif" "ERROR"
    exit 1
}

# ============================================
# Créer Sauvegarde
# ============================================

$timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$backupFileName = "${DatabaseName}_${timestamp}.sql"
$backupFilePath = Join-Path $monthBackupDir $backupFileName

Write-Log "Création sauvegarde: $backupFileName"

try {
    # Utiliser pg_dump avec options avancées
    $env:PGPASSWORD = $env:PGPASSWORD  # Utiliser variable d'environnement
    
    $pgDumpArgs = @(
        "-U", $DatabaseUser,
        "-h", "localhost",
        "-d", $DatabaseName,
        "--format=custom",  # Format custom (compressé et flexible)
        "--verbose",
        "--file=$backupFilePath"
    )
    
    # Si compression demandée (pour format plain)
    if ($Compress) {
        $pgDumpArgs += "--compress=9"
    }
    
    # Exécuter pg_dump
    $startTime = Get-Date
    & pg_dump @pgDumpArgs 2>&1 | Out-Null
    
    if ($LASTEXITCODE -eq 0) {
        $duration = (Get-Date) - $startTime
        $fileSize = (Get-Item $backupFilePath).Length / 1MB
        Write-Log "Sauvegarde réussie - Taille: $([math]::Round($fileSize, 2)) MB - Durée: $($duration.TotalSeconds)s" "SUCCESS"
    } else {
        Write-Log "ERREUR pg_dump - Code: $LASTEXITCODE" "ERROR"
        exit 1
    }
    
} catch {
    Write-Log "ERREUR création sauvegarde: $_" "ERROR"
    exit 1
}

# ============================================
# Vérifier Intégrité
# ============================================

Write-Log "Vérification intégrité sauvegarde..."

try {
    # Lister contenu backup
    & pg_restore --list $backupFilePath | Out-Null
    
    if ($LASTEXITCODE -eq 0) {
        Write-Log "Intégrité validée" "SUCCESS"
    } else {
        Write-Log "AVERTISSEMENT: Intégrité non vérifiable" "WARNING"
    }
} catch {
    Write-Log "Impossible de vérifier intégrité: $_" "WARNING"
}

# ============================================
# Compression Supplémentaire (optionnel)
# ============================================

if ($Compress) {
    Write-Log "Compression archive..."
    
    try {
        $zipFile = "$backupFilePath.zip"
        Compress-Archive -Path $backupFilePath -DestinationPath $zipFile -Force
        
        # Supprimer fichier non compressé
        Remove-Item $backupFilePath -Force
        $backupFilePath = $zipFile
        
        $zipSize = (Get-Item $zipFile).Length / 1MB
        Write-Log "Compression réussie - Taille finale: $([math]::Round($zipSize, 2)) MB" "SUCCESS"
    } catch {
        Write-Log "Erreur compression: $_" "WARNING"
    }
}

# ============================================
# Nettoyage Anciennes Sauvegardes
# ============================================

Write-Log "Nettoyage sauvegardes anciennes (> $RetentionDays jours)..."

try {
    $cutoffDate = (Get-Date).AddDays(-$RetentionDays)
    $oldBackups = Get-ChildItem -Path $BackupDir -Recurse -File | Where-Object {
        $_.Name -like "*.sql*" -and $_.LastWriteTime -lt $cutoffDate
    }
    
    $deletedCount = 0
    $freedSpace = 0
    
    foreach ($backup in $oldBackups) {
        $freedSpace += $backup.Length
        Remove-Item $backup.FullName -Force
        $deletedCount++
        Write-Log "Supprimé: $($backup.Name)"
    }
    
    if ($deletedCount -gt 0) {
        $freedSpaceMB = $freedSpace / 1MB
        Write-Log "Nettoyage terminé - $deletedCount fichiers supprimés - $([math]::Round($freedSpaceMB, 2)) MB libérés" "SUCCESS"
    } else {
        Write-Log "Aucune sauvegarde à nettoyer"
    }
    
} catch {
    Write-Log "Erreur nettoyage: $_" "WARNING"
}

# ============================================
# Statistiques Finales
# ============================================

$totalBackups = (Get-ChildItem -Path $BackupDir -Recurse -File | Where-Object { $_.Name -like "*.sql*" }).Count
$totalSize = (Get-ChildItem -Path $BackupDir -Recurse -File | Where-Object { $_.Name -like "*.sql*" } | Measure-Object -Property Length -Sum).Sum / 1GB

Write-Log "============================================"
Write-Log "Sauvegarde terminée avec succès"
Write-Log "Fichier: $backupFilePath"
Write-Log "Total sauvegardes: $totalBackups"
Write-Log "Espace total: $([math]::Round($totalSize, 2)) GB"
Write-Log "============================================"

# ============================================
# Copie vers Emplacement Externe (optionnel)
# ============================================

# Décommenter et configurer pour copie réseau/cloud
# $networkBackupPath = "\\NAS\Backups\GeStock"
# if (Test-Path $networkBackupPath) {
#     Copy-Item $backupFilePath $networkBackupPath -Force
#     Write-Log "Sauvegarde copiée vers: $networkBackupPath" "SUCCESS"
# }

exit 0
