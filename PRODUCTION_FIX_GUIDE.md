# 🎯 Guide Rapide - Déploiement Production Windows

## 📝 Résumé des Corrections

Vous aviez **2 problèmes critiques** en production :

### **1️⃣ Tailwind CSS V4 → Build échoue / CSS non appliqué**
**Problème :** Nouvelle syntaxe V4 incompatible (`@import`, `@plugin`)  
**Solution :** Migration vers Tailwind V3.4.17 (syntaxe stable)

### **2️⃣ PM2 → Crashs fréquents Windows**
**Problème :** PM2 instable sur Windows (service non redémarré)  
**Solution :** NSSM (Service Windows natif auto-restart)

---

## ✅ Fichiers Modifiés/Créés

### **Tailwind CSS V3 Migration**

| Fichier | Type | Description |
|---------|------|-------------|
| `package.json` | ✏️ Modifié | `tailwindcss: ^3.4.17`, `daisyui: ^4.12.14`, `autoprefixer: ^10.4.20` |
| `tailwind.config.js` | ✨ Nouveau | Configuration classique CommonJS + DaisyUI plugin |
| `app/globals.css` | ✏️ Modifié | `@tailwind base/components/utilities` (syntaxe V3) |
| `postcss.config.mjs` | ✏️ Modifié | `tailwindcss` + `autoprefixer` (plugins V3) |
| `TAILWIND_V3_MIGRATION.md` | ✨ Nouveau | Guide migration complet (avant/après) |

### **NSSM Service Windows**

| Fichier | Type | Description |
|---------|------|-------------|
| `install-nssm-gestock.bat` | ✨ Nouveau | Installation automatique service Windows (2 min) |
| `start-production-nssm.bat` | ✨ Nouveau | Script démarrage rapide |
| `NSSM_DEPLOYMENT.md` | ✨ Nouveau | Documentation déploiement complète |

**Statut GitHub :**
- ✅ Commit gema : `fbe2d56` (9 files, 2006 insertions)
- ✅ Commit gestock-vf : `19a32d2` (9 files, 1407 insertions)
- ✅ Push GitHub : `dac720b..19a32d2` (12.73 KiB transférés)

---

## 🚀 Déploiement Sur Serveur Windows

### **Étape 1 : Installation Dépendances** ⏱️ 5 min

```bash
# Naviguer vers projet
cd C:\chemin\vers\gema

# Installer dépendances Tailwind V3
npm install

# Vérifier installation
npm list tailwindcss daisyui autoprefixer
```

**✅ Résultat attendu :**
```
gema@0.1.0
├── tailwindcss@3.4.17
├── daisyui@4.12.14
└── autoprefixer@10.4.20
```

### **Étape 2 : Build Production** ⏱️ 2 min

```bash
npm run build
```

**✅ Résultat attendu :**
```
✓ Compiled successfully in 10.4s
✓ Finished TypeScript in 5.0s

🌼   daisyUI 4.12.24
├─ ✔︎ 3 themes added
╰─ ★ Star daisyUI on GitHub

✓ Generating static pages (46/46) in 452.8ms
✓ Finalizing page optimization in 413.9ms
```

### **Étape 3 : Installation NSSM Service** ⏱️ 2 min

**PowerShell en Administrateur :**

```powershell
cd C:\chemin\vers\gema
.\install-nssm-gestock.bat
```

**Le script va :**
1. ✅ Télécharger NSSM automatiquement
2. ✅ Créer service Windows `GeStock`
3. ✅ Configurer auto-restart
4. ✅ Configurer logs rotation (10 MB)
5. ✅ Demander si vous voulez démarrer maintenant

**⚠️ Configuration Requise :**

Après installation, **configurer les variables d'environnement** :

```batch
nssm set GeStock AppEnvironmentExtra ^
NODE_ENV=production ^
PORT=3000 ^
HOSTNAME=0.0.0.0 ^
DATABASE_URL=postgresql://gestock_user:VotreMotDePasse@localhost:5432/gestock_prod ^
NEXTAUTH_URL=http://VotreIPServeur:3000 ^
NEXTAUTH_SECRET=VotreCleSecrete
```

**Remplacer :**
- `VotreMotDePasse` → Mot de passe PostgreSQL
- `VotreIPServeur` → IP réelle serveur (ex: `192.168.1.100`)
- `VotreCleSecrete` → Générer avec `openssl rand -base64 32`

### **Étape 4 : Démarrage Service** ⏱️ 30 sec

```batch
nssm start GeStock
```

**Ou double-clic sur :**
```
start-production-nssm.bat
```

**✅ Vérification :**
```batch
nssm status GeStock
```

**Résultat attendu :** `SERVICE_RUNNING`

### **Étape 5 : Test Application** ⏱️ 1 min

**Local :** http://localhost:3000  
**Réseau :** http://IP_SERVEUR:3000

**Vérifier :**
- ✅ Page d'accueil s'affiche
- ✅ Styles DaisyUI appliqués
- ✅ Connexion base de données fonctionne
- ✅ Authentification NextAuth opérationnelle

---

## 📊 Commandes NSSM Utiles

```batch
# Démarrer service
nssm start GeStock

# Arrêter service
nssm stop GeStock

# Redémarrer service
nssm restart GeStock

# Status service
nssm status GeStock

# Éditer configuration (GUI)
nssm edit GeStock

# Logs en temps réel
Get-Content -Path ".\logs\gestock-stdout.log" -Wait -Tail 50

# Logs erreurs
Get-Content -Path ".\logs\gestock-stderr.log" -Tail 100
```

---

## 🔥 Avantages NSSM vs PM2

| Fonctionnalité | PM2 | NSSM |
|----------------|-----|------|
| **Stabilité Windows** | ⚠️ Crashs fréquents | ✅ Stable |
| **Service Windows natif** | ❌ Non | ✅ Oui |
| **Auto-restart crashes** | ⚠️ Parfois | ✅ Toujours |
| **Démarrage au boot** | ⚠️ Complexe | ✅ Simple |
| **Logs rotation** | ✅ Oui | ✅ Oui (10 MB) |
| **Interface GUI** | ❌ Non | ✅ Oui (`nssm edit`) |
| **Variables environnement** | ⚠️ Volatiles | ✅ Persistantes |
| **Configuration** | 🔧 Fichier JS | 🔧 GUI + Commandes |

**Conclusion :** NSSM = **Service production Windows recommandé** 🚀

---

## 🎨 Avantages Tailwind V3 vs V4

| Aspect | V4 | V3 |
|--------|----|----|
| **Syntaxe CSS** | `@import "tailwindcss"` | `@tailwind base/components/utilities` |
| **DaisyUI Config** | `@plugin "daisyui" {...}` | `plugins: [require('daisyui')]` |
| **PostCSS** | `@tailwindcss/postcss` | `tailwindcss` + `autoprefixer` |
| **Stabilité** | ⚠️ Nouvelle, bugs | ✅ Stable, testée |
| **Documentation** | ⚠️ Migration en cours | ✅ Complète |
| **Compatibilité** | ⚠️ Breaking changes | ✅ Rétrocompatible |

**Conclusion :** V3 = **Syntaxe stable pour production** ✅

---

## 📚 Documentation Complète

### **TAILWIND_V3_MIGRATION.md**
Guide migration Tailwind CSS V4 → V3 :
- ✅ Comparaison avant/après
- ✅ Procédure installation
- ✅ Tests validation
- ✅ Dépannage erreurs courantes

### **NSSM_DEPLOYMENT.md**
Guide déploiement NSSM Windows :
- ✅ Installation automatique/manuelle
- ✅ Configuration variables environnement
- ✅ Commandes gestion service
- ✅ Monitoring & logs
- ✅ Gestion crashes & auto-restart
- ✅ Démarrage automatique au boot
- ✅ Sécurité & firewall
- ✅ Tests & validation
- ✅ Dépannage complet
- ✅ Checklist déploiement

---

## 🧪 Tests de Validation

### **Test 1 : Build Production**
```bash
npm run build
```
**✅ Attendu :** 46 pages générées, 0 erreur, DaisyUI chargé

### **Test 2 : Service Démarrage**
```batch
nssm start GeStock
nssm status GeStock
```
**✅ Attendu :** `SERVICE_RUNNING`

### **Test 3 : Application HTTP**
```
http://localhost:3000
```
**✅ Attendu :** Page accueil avec styles DaisyUI

### **Test 4 : Auto-Restart**
```batch
# Tuer processus Node
taskkill /F /IM node.exe

# Attendre 10 secondes
timeout /t 10

# Vérifier redémarrage
nssm status GeStock
```
**✅ Attendu :** Service redémarré automatiquement

### **Test 5 : Reboot Serveur**
```powershell
shutdown /r /t 60
```
**✅ Attendu :** Après reboot, service démarré automatiquement

---

## ⚠️ Points Importants

### **1. Variables d'Environnement**
**TOUJOURS configurer avant démarrage :**
- `DATABASE_URL` avec mot de passe PostgreSQL
- `NEXTAUTH_URL` avec IP serveur réelle
- `NEXTAUTH_SECRET` généré (32+ caractères)

### **2. PostgreSQL Doit Être Actif**
```powershell
Get-Service postgresql*
Start-Service postgresql-x64-14
```

### **3. Firewall Port 3000**
```powershell
New-NetFirewallRule -DisplayName "GeStock HTTP" -Direction Inbound -LocalPort 3000 -Protocol TCP -Action Allow
```

### **4. Logs**
Consulter régulièrement :
- `.\logs\gestock-stdout.log` (logs application)
- `.\logs\gestock-stderr.log` (erreurs)

### **5. Sauvegarde Base de Données**
Configurer sauvegardes automatiques :
```batch
.\setup-auto-backup.bat
```
Voir `BACKUP_RECOVERY_GUIDE.md` pour détails.

---

## 🔧 Dépannage Rapide

### **Problème : Build échoue**
**Solution :**
```bash
rm -rf node_modules package-lock.json .next
npm install
npm run build
```

### **Problème : Service ne démarre pas**
**Solution :**
```powershell
# Vérifier logs
Get-Content -Path ".\logs\gestock-stderr.log" -Tail 50

# Tester manuellement
cd .next\standalone
node server.js
```

### **Problème : CSS non appliqué**
**Solution :**
```bash
# Rebuild cache Next.js
rm -rf .next
npm run build
npm run dev
```

### **Problème : Port 3000 déjà utilisé**
**Solution :**
```powershell
# Trouver processus
Get-NetTCPConnection -LocalPort 3000 | Select-Object OwningProcess

# Tuer processus
Stop-Process -Id [PID] -Force
```

---

## 📋 Checklist Déploiement Complet

### **Pré-Déploiement**
- [ ] PostgreSQL installé et running
- [ ] Base de données `gestock_prod` créée
- [ ] Node.js installé (v18+)
- [ ] Projet cloné sur serveur

### **Installation**
- [ ] `npm install` (Tailwind V3)
- [ ] `npm run build` (✅ 46 pages)
- [ ] NSSM installé (`install-nssm-gestock.bat`)

### **Configuration**
- [ ] `DATABASE_URL` configuré
- [ ] `NEXTAUTH_URL` configuré (IP serveur)
- [ ] `NEXTAUTH_SECRET` généré
- [ ] Firewall port 3000 ouvert

### **Tests**
- [ ] Service démarre (`nssm start GeStock`)
- [ ] Application accessible (http://localhost:3000)
- [ ] Auto-restart fonctionne (kill node.exe)
- [ ] Reboot serveur testé

### **Production**
- [ ] Sauvegarde auto configurée
- [ ] Monitoring logs activé
- [ ] Reverse proxy configuré (optionnel)
- [ ] SSL/TLS configuré (optionnel)

---

## 🎯 Résultats Attendus

Après avoir suivi ce guide :

✅ **Tailwind CSS stable** (V3.4.17 + DaisyUI 4.12.14)  
✅ **Build production fonctionnel** (46 pages, 0 erreur)  
✅ **Service Windows stable** (NSSM auto-restart)  
✅ **Démarrage automatique** au boot système  
✅ **Logs rotation** automatique (10 MB)  
✅ **Application accessible** réseau local/distant  
✅ **Protection crashs** avec auto-restart  
✅ **Documentation complète** disponible  

**Votre application GeStock est maintenant prête pour la production ! 🚀**

---

## 📞 Support

En cas de problème, consulter :
1. `TAILWIND_V3_MIGRATION.md` → Problèmes CSS/build
2. `NSSM_DEPLOYMENT.md` → Problèmes service Windows
3. `BACKUP_RECOVERY_GUIDE.md` → Sauvegardes base de données
4. `DEPLOYMENT_GUIDE.md` → Infrastructure complète

**Bon déploiement ! 🎉**
