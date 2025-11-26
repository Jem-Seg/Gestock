# GeStock - Système de Gestion des Stocks

![Version](https://img.shields.io/badge/version-1.1.0-blue.svg)
![Next.js](https://img.shields.io/badge/Next.js-16.0.1-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![License](https://img.shields.io/badge/license-MIT-green)

**Application de gestion des stocks pour la République Islamique de Mauritanie**

---

## 📋 Table des Matières

- [Fonctionnalités](#-fonctionnalités)
- [Technologies](#-technologies)
- [Installation](#-installation)
- [Déploiement](#-déploiement)
- [Documentation](#-documentation)
- [Workflow](#-workflow)
- [Support](#-support)

---

## ✨ Fonctionnalités

### Gestion des Stocks
- ✅ **Alimentations** : Enregistrement entrées stock avec documents (factures, PV)
- ✅ **Octrois** : Gestion sorties stock avec traçabilité bénéficiaires
- ✅ **Produits** : Gestion catalogue avec catégories et images
- ✅ **Structures** : Multi-structures et ministères

### Workflow de Validation
- ✅ **3 niveaux** : Financier → Directeur → Ordonnateur
- ✅ **Observations obligatoires** : Consultation et saisie forcées
- ✅ **Historique complet** : Traçabilité de toutes les actions
- ✅ **Statuts multiples** : EN_ATTENTE, EN_INSTANCE, VALIDE_*, REJETE

### Rapports et Statistiques
- ✅ **Génération PDF** : Rapports professionnels (alimentations, octrois, global)
- ✅ **Tableaux de bord** : Statistiques temps réel 30 derniers jours
- ✅ **Graphiques** : Visualisation par catégories
- ✅ **Export CSV** : Données exportables

### Sécurité et Permissions
- ✅ **Authentification** : NextAuth avec sessions sécurisées
- ✅ **Rôles** : Admin, Ordonnateur, Directeur, Financier, Responsable Achats
- ✅ **Permissions** : Contrôle accès granulaire par rôle
- ✅ **Upload sécurisé** : Documents via API routes

---

## 🛠 Technologies

### Frontend
- **Next.js 16.0.1** - Framework React avec SSR
- **TypeScript 5** - Typage statique
- **Tailwind CSS 3.4** - Styles utilitaires
- **DaisyUI 4.12** - Composants UI

### Backend
- **NextAuth 5** - Authentification
- **Prisma 6.19** - ORM
- **PostgreSQL** - Base de données
- **jsPDF** - Génération PDF

### Déploiement
- **NSSM** - Service Windows
- **PM2** - Process manager (alternative)
- **PowerShell** - Scripts automatisation

---

## 📥 Installation

### Prérequis
- Node.js 18+
- PostgreSQL 14+
- Git (recommandé)

### Développement Local

```bash
# 1. Cloner le projet
git clone <url-du-repo>
cd gema

# 2. Installer dépendances
npm install

# 3. Configurer environnement
cp .env.example .env
# Éditer .env avec vos paramètres

# 4. Initialiser base de données
npx prisma generate
npx prisma migrate deploy

# 5. Lancer serveur développement
npm run dev
```

Accéder à http://localhost:3000

---

## 🚀 Déploiement

### Windows Server (Production)

**Méthode rapide** (5 minutes) :
```powershell
cd C:\gema
git pull origin main
.\deploy-windows.ps1
```

**Voir documentation complète** :
- [📖 Guide déploiement rapide](./DEPLOIEMENT_RAPIDE.md)
- [📖 Guide déploiement détaillé](./DEPLOIEMENT_WINDOWS.md)

### Vercel (Alternative)

```bash
npm install -g vercel
vercel --prod
```

---

## 📚 Documentation

| Document | Description |
|----------|-------------|
| [GUIDE_UTILISATEUR.md](./GUIDE_UTILISATEUR.md) | Manuel utilisateur complet avec FAQ |
| [DEPLOIEMENT_WINDOWS.md](./DEPLOIEMENT_WINDOWS.md) | Guide installation Windows Server |
| [DEPLOIEMENT_RAPIDE.md](./DEPLOIEMENT_RAPIDE.md) | Checklist déploiement 5 min |
| [CHANGELOG.md](./CHANGELOG.md) | Historique des versions |

---

## 🔄 Workflow de Validation

```
┌─────────────────────────────────────────────────────────────┐
│                    CRÉATION ALIMENTATION/OCTROI             │
│              (Responsable Achats / Agent Saisie)            │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
                  ┌──────────────┐
                  │  EN_ATTENTE  │
                  └──────┬───────┘
                         │
                         ▼
        ┌────────────────────────────────┐
        │      VALIDATION FINANCIER      │
        │  - Consulter observations      │
        │  - Observation si rejet        │
        └────┬──────────────────┬────────┘
             │                  │
        Valider            Rejeter → REJETE
             │
             ▼
      VALIDE_FINANCIER
             │
             ▼
        ┌────────────────────────────────┐
        │      VALIDATION DIRECTEUR      │
        │  - Consulter observations      │
        │  - Observation si rejet        │
        └────┬──────────────────┬────────┘
             │                  │
        Valider            Rejeter → REJETE
             │
             ▼
      VALIDE_DIRECTEUR
             │
             ▼
        ┌────────────────────────────────┐
        │     VALIDATION ORDONNATEUR     │
        │  - Consulter observations      │
        │  - Observation si rejet        │
        └────┬──────────────────┬────────┘
             │                  │
        Valider            Rejeter → REJETE
             │
             ▼
      VALIDE_ORDONNATEUR
             │
             ▼
      📦 STOCK MIS À JOUR
```

---

## 🎯 Changelog v1.1.0

### 🐛 Bugs Corrigés (6/6)
1. ✅ Menu mobile - Ajout bouton déconnexion
2. ✅ Documents - Correction erreurs 404
3. ✅ Validation - Observation obligatoire pour rejet
4. ✅ Dashboard - Statistiques 30 jours affichées
5. ✅ Statistiques - Données correctement chargées
6. ✅ Navbar - Lien États/Rapports ajouté

### ✨ Nouvelles Fonctionnalités
- Génération rapports PDF professionnels
- Templates officiels République Islamique de Mauritanie
- Export automatique alimentations/octrois/global
- Documentation utilisateur complète
- Script déploiement automatisé Windows

**Voir** : [CHANGELOG.md](./CHANGELOG.md) pour détails complets

---

## 🧪 Tests

```bash
# Build production
npm run build

# Lancer tests (si configurés)
npm test

# Vérifier types TypeScript
npx tsc --noEmit

# Linter
npm run lint
```

---

## 📞 Support

### Documentation
- **Guide utilisateur** : [GUIDE_UTILISATEUR.md](./GUIDE_UTILISATEUR.md)
- **FAQ** : Voir section FAQ du guide utilisateur
- **API** : Documentation routes dans `/app/api/`

### Logs
- **Application** : `logs/stdout.log`
- **Erreurs** : `logs/stderr.log`
- **Déploiement** : `logs/deployment_*.log`

### Contact
- Administrateur système : [Votre contact]
- Support technique : [Votre email]

---

## 🤝 Contribution

1. Fork le projet
2. Créer une branche (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push (`git push origin feature/AmazingFeature`)
5. Ouvrir Pull Request

---

## 📄 License

Ce projet est sous licence MIT. Voir fichier `LICENSE` pour détails.

---

## 🙏 Remerciements

- République Islamique de Mauritanie
- Équipe de développement GeStock
- Contributeurs open-source

---

**Version actuelle** : 1.1.0  
**Dernière mise à jour** : 26 novembre 2025  
**Build** : 391c563
