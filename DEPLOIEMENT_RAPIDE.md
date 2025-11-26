# 🚀 Déploiement Rapide - GeStock v1.1.0

## ✅ Checklist Pré-Déploiement

- [ ] Connexion au serveur Windows établie
- [ ] Accès administrateur confirmé
- [ ] Sauvegarde base de données effectuée
- [ ] Utilisateurs notifiés de la maintenance

---

## 📦 Déploiement en 5 Minutes

### Option 1: Script Automatique (RECOMMANDÉ)

```powershell
# 1. Se connecter au serveur Windows
# 2. Ouvrir PowerShell en tant qu'administrateur
# 3. Exécuter :

cd C:\gema
git pull origin main
.\deploy-windows.ps1
```

**C'est tout !** Le script gère automatiquement :
- ✅ Arrêt service
- ✅ Sauvegarde
- ✅ Installation dépendances
- ✅ Build
- ✅ Redémarrage
- ✅ Vérification

---

### Option 2: Manuel (si problème avec script)

```powershell
# 1. Arrêter le service
nssm stop GeStockApp

# 2. Mettre à jour le code
cd C:\gema
git pull origin main

# 3. Installer nouvelles dépendances
npm install

# 4. Builder
npm run build

# 5. Redémarrer
nssm start GeStockApp

# 6. Vérifier
nssm status GeStockApp
```

---

## 🧪 Tests Post-Déploiement (2 minutes)

### 1. Service OK
```powershell
nssm status GeStockApp
# Attendu: SERVICE_RUNNING
```

### 2. Application accessible
Ouvrir navigateur : **http://localhost:3000**
- ✅ Page de connexion s'affiche
- ✅ Pas d'erreur console (F12)

### 3. Menu mobile
Sur smartphone ou F12 → Mode mobile :
- ✅ Ouvrir menu hamburger (☰)
- ✅ Scroll en bas
- ✅ **Bouton déconnexion visible** 🎯

### 4. Documents
Se connecter → Alimentations → Cliquer icône document 📄 :
- ✅ **Document s'ouvre (pas 404)** 🎯

### 5. Validation
Sélectionner alimentation → Cliquer ❌ Rejeter sans observation :
- ✅ **Message erreur "observation obligatoire"** 🎯

### 6. Dashboard
Menu → Tableau de bord :
- ✅ **Statistiques 30 jours affichées** 🎯

### 7. États/Rapports
Menu → **États/Rapports** (nouveau lien 🎯) :
- ✅ Page s'affiche
- ✅ Sélection structure fonctionne
- ✅ Bouton "Générer" actif

---

## 📊 Vérification Logs

```powershell
# Logs application
Get-Content C:\gema\logs\stdout.log -Tail 50

# Logs déploiement
Get-Content C:\gema\logs\deployment_*.log | Select-Object -Last 1 -Wait
```

**Rechercher** :
- ✅ "Server started on port 3000"
- ✅ "Build réussi"
- ✅ Pas d'erreur critique

---

## 🆘 Rollback (si problème)

### Restauration automatique

```powershell
# 1. Arrêter service actuel
nssm stop GeStockApp

# 2. Identifier sauvegarde
Get-ChildItem C:\gema_backups | Sort-Object CreationTime -Descending | Select-Object -First 1

# 3. Restaurer (remplacer TIMESTAMP)
$backup = "gema_backup_YYYYMMDD_HHMMSS"
Copy-Item -Path "C:\gema_backups\$backup\*" -Destination C:\gema -Recurse -Force

# 4. Redémarrer
nssm start GeStockApp
```

---

## 📞 Support Urgence

### Problème service ne démarre pas
```powershell
# Voir erreur exacte
Get-Content C:\gema\logs\stderr.log -Tail 100

# Tester manuellement
cd C:\gema
npm run start
```

### Problème base de données
```powershell
# Vérifier connexion
Test-NetConnection -ComputerName localhost -Port 5432
```

### Problème build
```powershell
# Nettoyer et reconstruire
Remove-Item -Recurse -Force .next
npm run build
```

---

## 🎉 Notification Utilisateurs

**Template email** :

```
Objet: GeStock - Mise à jour v1.1.0 déployée

Bonjour,

La mise à jour GeStock v1.1.0 est maintenant en ligne.

Nouvelles fonctionnalités :
✨ Menu mobile amélioré (déconnexion disponible)
✨ Consultation documents corrigée
✨ Validation avec observation obligatoire pour rejet
✨ Nouveau menu "États/Rapports" pour générer des PDF

Corrections :
✅ Statistiques dashboard affichées correctement
✅ Documents ne donnent plus d'erreur 404

Aucune action requise de votre part.

Pour toute question, consultez le guide utilisateur ou contactez le support.

Cordialement,
Équipe GeStock
```

---

## 📋 Checklist Finale

- [ ] Service démarré
- [ ] Application accessible (http://localhost:3000)
- [ ] Menu mobile testé
- [ ] Documents testés
- [ ] Validation testée
- [ ] Dashboard vérifié
- [ ] États/Rapports visible
- [ ] Logs vérifiés (pas d'erreur)
- [ ] Utilisateurs notifiés
- [ ] Documentation mise à jour

---

## 📚 Documentation Disponible

| Document | Contenu |
|----------|---------|
| `CHANGELOG.md` | Toutes les modifications v1.1.0 |
| `GUIDE_UTILISATEUR.md` | Manuel utilisateur complet |
| `DEPLOIEMENT_WINDOWS.md` | Guide déploiement détaillé |
| `deploy-windows.ps1` | Script automatisé |

---

## ⏱️ Durée Estimée

- **Script automatique** : 5-7 minutes
- **Déploiement manuel** : 8-10 minutes
- **Tests post-déploiement** : 2-3 minutes
- **Total** : ~10-15 minutes

---

**Bonne chance ! 🚀**

*En cas de problème, consultez DEPLOIEMENT_WINDOWS.md section Dépannage*
