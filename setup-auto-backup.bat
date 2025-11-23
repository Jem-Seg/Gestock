@echo off
REM ============================================
REM Configuration Tâche Planifiée Windows
REM Sauvegarde automatique toutes les 5 heures
REM ============================================

echo ========================================
echo Configuration Sauvegarde Automatique
echo GeStock - Toutes les 5 heures
echo ========================================
echo.

REM Vérifier privilèges admin
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo ERREUR: Doit etre execute en tant qu'Administrateur
    pause
    exit /b 1
)

REM Variables
set TASK_NAME=GeStock-Backup-Auto
set SCRIPT_PATH=%~dp0backup-database.ps1
set BACKUP_DIR=C:\gestock\backups
set POSTGRES_BIN=C:\Program Files\PostgreSQL\14\bin

echo Configuration:
echo   Nom tache: %TASK_NAME%
echo   Script: %SCRIPT_PATH%
echo   Dossier backups: %BACKUP_DIR%
echo   Intervalle: Toutes les 5 heures
echo.

REM Vérifier script existe
if not exist "%SCRIPT_PATH%" (
    echo ERREUR: Script backup-database.ps1 non trouve
    echo Placez ce fichier dans le meme dossier
    pause
    exit /b 1
)

REM Créer dossier backups
if not exist "%BACKUP_DIR%" (
    echo Creation dossier backups...
    mkdir "%BACKUP_DIR%"
)

REM Configurer mot de passe PostgreSQL (variable environnement)
echo.
echo Configuration mot de passe PostgreSQL...
echo Important: Definir variable PGPASSWORD pour eviter saisie manuelle
echo.
set /p PGPASS="Entrez mot de passe utilisateur gestock_user: "

REM Créer variable environnement système
setx PGPASSWORD "%PGPASS%" /M

echo.
echo Variable PGPASSWORD configuree (systeme)
echo.

REM Ajouter PostgreSQL au PATH si absent
echo Ajout PostgreSQL au PATH...
setx PATH "%PATH%;%POSTGRES_BIN%" /M

echo.
echo ========================================
echo Creation Tache Planifiee Windows
echo ========================================
echo.

REM Supprimer tâche existante
schtasks /Query /TN "%TASK_NAME%" >nul 2>&1
if %errorLevel% equ 0 (
    echo Suppression tache existante...
    schtasks /Delete /TN "%TASK_NAME%" /F
)

REM Créer tâche - Démarrage toutes les 5 heures
echo Creation nouvelle tache planifiee...

schtasks /Create ^
    /TN "%TASK_NAME%" ^
    /TR "powershell.exe -ExecutionPolicy Bypass -File \"%SCRIPT_PATH%\" -Verbose" ^
    /SC HOURLY ^
    /MO 5 ^
    /ST 00:00 ^
    /RU SYSTEM ^
    /RL HIGHEST ^
    /F

if %errorLevel% neq 0 (
    echo ERREUR: Creation tache echouee
    pause
    exit /b 1
)

echo.
echo ========================================
echo Configuration Reussie!
echo ========================================
echo.
echo Tache planifiee creee: %TASK_NAME%
echo Frequence: Toutes les 5 heures (24h/24)
echo Prochaine execution: Prochaine heure multiple de 5
echo.
echo Heures execution quotidiennes:
echo   00:00, 05:00, 10:00, 15:00, 20:00
echo.
echo Commandes utiles:
echo   schtasks /Query /TN "%TASK_NAME%"           - Voir details
echo   schtasks /Run /TN "%TASK_NAME%"             - Executer maintenant
echo   schtasks /End /TN "%TASK_NAME%"             - Arreter
echo   schtasks /Delete /TN "%TASK_NAME%" /F       - Supprimer
echo.
echo Logs disponibles dans: %BACKUP_DIR%\backup.log
echo.

REM Test exécution immédiate (optionnel)
echo Voulez-vous executer une sauvegarde test maintenant? (O/N)
set /p RUN_NOW=

if /i "%RUN_NOW%"=="O" (
    echo.
    echo Execution sauvegarde test...
    powershell.exe -ExecutionPolicy Bypass -File "%SCRIPT_PATH%" -Verbose
    
    echo.
    echo Verification fichiers backups...
    dir "%BACKUP_DIR%" /S
)

echo.
echo ========================================
echo Configuration Terminee!
echo ========================================
echo.
echo IMPORTANT:
echo - Verifiez logs: %BACKUP_DIR%\backup.log
echo - Testez restauration: .\restore-database.ps1 -Latest
echo - Configurez copie vers NAS/Cloud (optionnel)
echo.
pause
