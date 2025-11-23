# ============================================
# Script de Déploiement Automatique GeStock
# Windows Production avec PostgreSQL
# ============================================

param(
    [string]$InstallPath = "C:\gestock",
    [switch]$SkipFirewall,
    [switch]$SkipService,
    [switch]$Help
)

# Couleurs
$ErrorColor = "Red"
$SuccessColor = "Green"
$InfoColor = "Cyan"
$WarningColor = "Yellow"

function Write-Step {
    param([string]$Message)
    Write-Host "`n▶ $Message" -ForegroundColor $InfoColor
}

function Write-Success {
    param([string]$Message)
    Write-Host "✓ $Message" -ForegroundColor $SuccessColor
}

function Write-Error-Custom {
    param([string]$Message)
    Write-Host "✗ $Message" -ForegroundColor $ErrorColor
}

function Write-Warning-Custom {
    param([string]$Message)
    Write-Host "⚠ $Message" -ForegroundColor $WarningColor
}

if ($Help) {
    Write-Host @"
Usage: .\deploy-production.ps1 [OPTIONS]

Options:
  -InstallPath <path>  Chemin d'installation (défaut: C:\gestock)
  -SkipFirewall       Ignorer configuration firewall
  -SkipService        Ignorer installation service Windows
  -Help               Afficher cette aide

Exemples:
  .\deploy-production.ps1
  .\deploy-production.ps1 -InstallPath "D:\apps\gestock"
  .\deploy-production.ps1 -SkipFirewall

Prérequis:
  - Exécuter en tant qu'Administrateur
  - Node.js 18+ installé
  - PostgreSQL installé et configuré
  - NSSM.exe dans le dossier projet

"@
    exit 0
}

# ============================================
# Vérifications Préalables
# ============================================

Write-Host @"
╔═══════════════════════════════════════════╗
║   Déploiement GeStock - Production        ║
║   Windows + PostgreSQL + PM2 + NSSM       ║
╚═══════════════════════════════════════════╝
"@ -ForegroundColor $InfoColor

# Vérifier privilèges admin
Write-Step "Vérification privilèges administrateur..."
$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Error-Custom "Ce script doit être exécuté en tant qu'Administrateur"
    Write-Host "Clic droit sur PowerShell > Exécuter en tant qu'administrateur" -ForegroundColor $WarningColor
    exit 1
}
Write-Success "Privilèges administrateur confirmés"

# Vérifier Node.js
Write-Step "Vérification Node.js..."
try {
    $nodeVersion = node --version
    Write-Success "Node.js installé: $nodeVersion"
} catch {
    Write-Error-Custom "Node.js n'est pas installé"
    Write-Host "Téléchargez depuis: https://nodejs.org" -ForegroundColor $WarningColor
    exit 1
}

# Vérifier PostgreSQL
Write-Step "Vérification PostgreSQL..."
$postgresService = Get-Service -Name "postgresql*" -ErrorAction SilentlyContinue
if ($postgresService) {
    Write-Success "PostgreSQL détecté: $($postgresService.DisplayName)"
} else {
    Write-Warning-Custom "PostgreSQL non détecté - assurez-vous qu'il est installé"
}

# Vérifier PM2
Write-Step "Vérification PM2..."
try {
    $pm2Version = pm2 --version
    Write-Success "PM2 installé: v$pm2Version"
} catch {
    Write-Warning-Custom "PM2 non installé - installation en cours..."
    npm install -g pm2
    npm install -g pm2-windows-startup
    Write-Success "PM2 installé avec succès"
}

# ============================================
# Configuration Variables
# ============================================

Write-Step "Configuration des variables..."

$currentPath = Get-Location
Write-Host "Répertoire actuel: $currentPath"
Write-Host "Installation vers: $InstallPath"

$confirm = Read-Host "Continuer? (O/N)"
if ($confirm -ne "O" -and $confirm -ne "o") {
    Write-Warning-Custom "Déploiement annulé"
    exit 0
}

# ============================================
# Création Structure Dossiers
# ============================================

Write-Step "Création structure de dossiers..."

if (-not (Test-Path $InstallPath)) {
    New-Item -ItemType Directory -Path $InstallPath -Force | Out-Null
    Write-Success "Dossier créé: $InstallPath"
} else {
    Write-Warning-Custom "Dossier existe déjà: $InstallPath"
}

$logsPath = Join-Path $InstallPath "logs"
if (-not (Test-Path $logsPath)) {
    New-Item -ItemType Directory -Path $logsPath -Force | Out-Null
    Write-Success "Dossier logs créé"
}

# ============================================
# Copie Fichiers (si déploiement depuis autre répertoire)
# ============================================

if ($currentPath -ne $InstallPath) {
    Write-Step "Copie des fichiers..."
    $filesToCopy = @(
        "package.json",
        "package-lock.json",
        "next.config.ts",
        "tsconfig.json",
        "ecosystem.config.cjs",
        ".env.example"
    )
    
    $foldersToCopy = @("app", "lib", "prisma", "public", "hooks")
    
    foreach ($file in $filesToCopy) {
        if (Test-Path $file) {
            Copy-Item $file $InstallPath -Force
            Write-Success "Copié: $file"
        }
    }
    
    foreach ($folder in $foldersToCopy) {
        if (Test-Path $folder) {
            Copy-Item $folder $InstallPath -Recurse -Force
            Write-Success "Copié: $folder/"
        }
    }
}

# ============================================
# Configuration .env
# ============================================

Write-Step "Configuration .env..."

$envPath = Join-Path $InstallPath ".env"
if (-not (Test-Path $envPath)) {
    Write-Warning-Custom "Fichier .env manquant"
    
    # Générer NEXTAUTH_SECRET
    $randomBytes = New-Object byte[] 32
    ([System.Security.Cryptography.RandomNumberGenerator]::Create()).GetBytes($randomBytes)
    $nextauthSecret = [Convert]::ToBase64String($randomBytes)
    
    # Obtenir IP locale
    $ipAddress = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -notlike "127.*" } | Select-Object -First 1).IPAddress
    
    $envContent = @"
# Base de données PostgreSQL
DATABASE_URL="postgresql://gestock_user:VotreMotDePasse@localhost:5432/gestock_prod"

# NextAuth
NEXTAUTH_URL="http://${ipAddress}:3000"
NEXTAUTH_SECRET="${nextauthSecret}"

# Environment
NODE_ENV="production"
PORT=3000
HOSTNAME="0.0.0.0"
"@
    
    Set-Content -Path $envPath -Value $envContent
    Write-Success ".env créé avec NEXTAUTH_SECRET généré"
    Write-Warning-Custom "IMPORTANT: Éditez .env et configurez DATABASE_URL"
    
    # Ouvrir .env dans notepad
    $editEnv = Read-Host "Voulez-vous éditer .env maintenant? (O/N)"
    if ($editEnv -eq "O" -or $editEnv -eq "o") {
        notepad $envPath
        Write-Host "Appuyez sur Entrée quand vous avez terminé..." -ForegroundColor $WarningColor
        Read-Host
    }
} else {
    Write-Success ".env existe déjà"
}

# ============================================
# Installation Dépendances
# ============================================

Write-Step "Installation dépendances npm..."
Set-Location $InstallPath

try {
    npm install --production
    Write-Success "Dépendances installées"
} catch {
    Write-Error-Custom "Erreur installation dépendances"
    exit 1
}

# ============================================
# Prisma Setup
# ============================================

Write-Step "Configuration Prisma..."

# Vérifier schema.prisma
$schemaPath = Join-Path $InstallPath "prisma\schema.prisma"
if (Test-Path $schemaPath) {
    $schemaContent = Get-Content $schemaPath -Raw
    if ($schemaContent -match 'provider\s*=\s*"sqlite"') {
        Write-Warning-Custom "schema.prisma utilise SQLite - changer en postgresql"
        $schemaContent = $schemaContent -replace 'provider\s*=\s*"sqlite"', 'provider = "postgresql"'
        Set-Content -Path $schemaPath -Value $schemaContent
        Write-Success "schema.prisma mis à jour: postgresql"
    }
}

# Générer Prisma Client
try {
    npx prisma generate
    Write-Success "Prisma Client généré"
} catch {
    Write-Error-Custom "Erreur génération Prisma Client"
}

# Appliquer migrations
Write-Host "`nAppliquer migrations Prisma? (O/N)" -ForegroundColor $WarningColor
Write-Host "Note: PostgreSQL doit être configuré et accessible" -ForegroundColor $WarningColor
$applyMigrations = Read-Host

if ($applyMigrations -eq "O" -or $applyMigrations -eq "o") {
    try {
        npx prisma migrate deploy
        Write-Success "Migrations appliquées"
    } catch {
        Write-Error-Custom "Erreur migrations - vérifiez DATABASE_URL"
    }
}

# ============================================
# Build Production
# ============================================

Write-Step "Build Next.js production..."

try {
    npm run build
    Write-Success "Build réussi"
} catch {
    Write-Error-Custom "Erreur build"
    exit 1
}

# Vérifier standalone
$standalonePath = Join-Path $InstallPath ".next\standalone"
if (Test-Path $standalonePath) {
    Write-Success "Standalone créé: .next/standalone/"
} else {
    Write-Warning-Custom "Standalone non trouvé - vérifiez next.config.ts (output: 'standalone')"
}

# ============================================
# Configuration PM2
# ============================================

Write-Step "Configuration PM2..."

# Setup PM2 startup
try {
    pm2-startup install
    Write-Success "PM2 startup configuré"
} catch {
    Write-Warning-Custom "PM2 startup déjà configuré"
}

# Démarrer application
try {
    pm2 start ecosystem.config.cjs
    pm2 save
    Write-Success "Application démarrée avec PM2"
} catch {
    Write-Warning-Custom "Erreur démarrage PM2"
}

# ============================================
# Configuration Firewall
# ============================================

if (-not $SkipFirewall) {
    Write-Step "Configuration Firewall Windows..."
    
    # Supprimer règles existantes
    Remove-NetFirewallRule -DisplayName "GeStock*" -ErrorAction SilentlyContinue
    
    # Créer règles
    New-NetFirewallRule -DisplayName "GeStock - HTTP" -Direction Inbound -Protocol TCP -LocalPort 3000 -Action Allow -Profile Any | Out-Null
    New-NetFirewallRule -DisplayName "GeStock - HTTPS" -Direction Inbound -Protocol TCP -LocalPort 443 -Action Allow -Profile Any | Out-Null
    
    $nodePath = (Get-Command node).Source
    New-NetFirewallRule -DisplayName "GeStock - Node.js" -Direction Inbound -Program $nodePath -Action Allow -Profile Any | Out-Null
    
    Write-Success "Règles firewall créées"
} else {
    Write-Warning-Custom "Configuration firewall ignorée (SkipFirewall)"
}

# ============================================
# Installation Service NSSM
# ============================================

if (-not $SkipService) {
    Write-Step "Installation service Windows (NSSM)..."
    
    $nssmPath = Join-Path $InstallPath "nssm.exe"
    if (-not (Test-Path $nssmPath)) {
        Write-Warning-Custom "nssm.exe non trouvé dans $InstallPath"
        Write-Host "Téléchargez NSSM depuis https://nssm.cc/download" -ForegroundColor $WarningColor
        Write-Host "Extrayez nssm.exe dans: $InstallPath" -ForegroundColor $WarningColor
        $skipNSSM = $true
    } else {
        # Arrêter service existant
        & $nssmPath stop GeStock 2>$null
        Start-Sleep -Seconds 2
        & $nssmPath remove GeStock confirm 2>$null
        
        # Installer service
        $pm2Path = Join-Path $env:APPDATA "npm\pm2.cmd"
        & $nssmPath install GeStock $pm2Path "start" "ecosystem.config.cjs"
        & $nssmPath set GeStock AppDirectory $InstallPath
        & $nssmPath set GeStock DisplayName "GeStock - Gestion de Stock"
        & $nssmPath set GeStock Start SERVICE_AUTO_START
        
        # Logs
        & $nssmPath set GeStock AppStdout (Join-Path $logsPath "service-output.log")
        & $nssmPath set GeStock AppStderr (Join-Path $logsPath "service-error.log")
        
        Write-Success "Service Windows installé"
        
        # Démarrer service
        $startService = Read-Host "Démarrer le service maintenant? (O/N)"
        if ($startService -eq "O" -or $startService -eq "o") {
            Start-Service -Name GeStock
            Write-Success "Service démarré"
        }
    }
} else {
    Write-Warning-Custom "Installation service ignorée (SkipService)"
}

# ============================================
# Résumé
# ============================================

Write-Host @"

╔═══════════════════════════════════════════╗
║   Déploiement Terminé!                    ║
╚═══════════════════════════════════════════╝

"@ -ForegroundColor $SuccessColor

$ipAddress = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -notlike "127.*" } | Select-Object -First 1).IPAddress

Write-Host "📂 Installation: $InstallPath" -ForegroundColor $InfoColor
Write-Host "🌐 URLs d'accès:" -ForegroundColor $InfoColor
Write-Host "   - Local:  http://localhost:3000" -ForegroundColor White
Write-Host "   - Réseau: http://${ipAddress}:3000" -ForegroundColor White
Write-Host ""
Write-Host "📊 Commandes utiles:" -ForegroundColor $InfoColor
Write-Host "   pm2 list              - Lister applications" -ForegroundColor White
Write-Host "   pm2 logs gestock      - Voir logs" -ForegroundColor White
Write-Host "   pm2 monit             - Monitoring" -ForegroundColor White
Write-Host "   pm2 restart gestock   - Redémarrer" -ForegroundColor White
Write-Host ""
Write-Host "🔧 Service Windows:" -ForegroundColor $InfoColor
Write-Host "   net start GeStock     - Démarrer" -ForegroundColor White
Write-Host "   net stop GeStock      - Arrêter" -ForegroundColor White
Write-Host "   sc query GeStock      - Status" -ForegroundColor White
Write-Host ""
Write-Host "📖 Documentation complète: DEPLOYMENT_GUIDE.md" -ForegroundColor $InfoColor
Write-Host ""

# Test accès
Write-Host "Test de l'application..." -ForegroundColor $InfoColor
Start-Sleep -Seconds 3

try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000" -TimeoutSec 5 -UseBasicParsing
    Write-Success "Application accessible! Status: $($response.StatusCode)"
} catch {
    Write-Warning-Custom "Application non accessible - vérifiez les logs PM2"
}

Write-Host "`nAppuyez sur une touche pour quitter..." -ForegroundColor $InfoColor
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
