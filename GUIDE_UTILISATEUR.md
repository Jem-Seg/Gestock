# Guide Utilisateur - GeStock

## Table des matières
1. [Workflow de Validation](#workflow-de-validation)
2. [Gestion des Alimentations](#gestion-des-alimentations)
3. [Gestion des Octrois](#gestion-des-octrois)
4. [États et Rapports](#états-et-rapports)
5. [Statistiques](#statistiques)
6. [FAQ](#faq)

---

## Workflow de Validation

GeStock implémente un système de validation à trois niveaux pour garantir la conformité et la traçabilité de toutes les opérations de stock.

### Les 3 étapes de validation

```
┌──────────────────┐       ┌──────────────────┐       ┌──────────────────┐
│   1. Financier   │  ───→ │  2. Directeur    │  ───→ │  3. Ordonnateur  │
│                  │       │                  │       │                  │
│ Vérifie budget   │       │ Approuve besoin  │       │ Valide définit.  │
└──────────────────┘       └──────────────────┘       └──────────────────┘
```

### Rôles et Permissions

#### 1. Responsable Achats / Agent de Saisie
- **Peut** : Créer, modifier, supprimer alimentations/octrois en brouillon
- **Ne peut pas** : Valider ou rejeter
- **Statut** : EN_ATTENTE

#### 2. Financier
- **Peut** : Valider → VALIDE_FINANCIER, Rejeter, Mettre en instance
- **Doit** : Consulter observations avant toute action
- **Doit** : Saisir observation obligatoire en cas de rejet

#### 3. Directeur
- **Peut** : Valider → VALIDE_DIRECTEUR, Rejeter, Mettre en instance
- **Reçoit** : Uniquement les dossiers validés par le Financier
- **Doit** : Consulter observations + saisir observation si rejet

#### 4. Ordonnateur
- **Peut** : Validation finale → VALIDE_ORDONNATEUR, Rejeter
- **Reçoit** : Uniquement les dossiers validés par le Directeur
- **Doit** : Consulter observations + saisir observation si rejet

### États possibles

| Statut | Description | Action suivante |
|--------|-------------|-----------------|
| `EN_ATTENTE` | Nouvellement créé | Validation Financier |
| `EN_INSTANCE` | Besoin d'info complémentaire | Peut rester en attente |
| `VALIDE_FINANCIER` | Approuvé par Financier | Validation Directeur |
| `VALIDE_DIRECTEUR` | Approuvé par Directeur | Validation Ordonnateur |
| `VALIDE_ORDONNATEUR` | Validation finale | Impact sur stock |
| `REJETE` | Refusé à une étape | Fin du processus |

---

## Gestion des Alimentations

### Créer une alimentation

1. **Accéder** : Menu → Alimentations → "Nouvelle Alimentation"
2. **Remplir** les champs obligatoires :
   - Structure
   - Produit
   - Quantité
   - Prix unitaire
   - Fournisseur
   - Date d'alimentation
3. **Joindre documents** :
   - Facture (obligatoire)
   - PV de réception (recommandé)
   - Autres documents
4. **Sauvegarder** → Statut : EN_ATTENTE

### Consulter les documents

- **Icônes** : 📄 Facture | 📋 PV | 📎 Autre
- **Clic** → Ouvre le document dans un nouvel onglet
- **Téléchargement** automatique possible

### Valider par lot

1. **Cocher** les alimentations à traiter
2. **Consulter observations** (🔍 icon) - **OBLIGATOIRE**
3. **Saisir observation** (optionnel sauf rejet)
4. **Cliquer** : ⏳ Instance | ✅ Valider | ❌ Rejeter

⚠️ **Important** : 
- Vous devez consulter les observations de TOUTES les alimentations sélectionnées
- L'observation est OBLIGATOIRE en cas de rejet

---

## Gestion des Octrois

### Créer un octroi

1. **Vérifier stock** : Bouton "État du stock" en haut à droite
2. **Nouvelle octroi** :
   - Structure
   - Produit (stock disponible)
   - Quantité (≤ stock actuel)
   - Bénéficiaire
   - Date
3. **Documents** :
   - PV d'octroi
   - Autorisation
4. **Impact** : Stock réduit après validation finale

### Workflow identique

Les octrois suivent le même workflow de validation que les alimentations :
- Financier → Directeur → Ordonnateur
- Consultation observations obligatoire
- Observation obligatoire si rejet

---

## États et Rapports

### Accès
Menu → **États/Rapports**

### Types de rapports disponibles

#### 1. Rapport Alimentations (PDF)
**Contenu** :
- Vue d'ensemble (nombre, quantités, valeurs)
- Détails par produit
- Top 5 produits alimentés
- Statuts de validation

**Format** : Tableau avec en-tête officiel République Islamique de Mauritanie

#### 2. Rapport Octrois (PDF)
**Contenu** :
- Vue d'ensemble octrois
- Détails par produit
- Top 5 produits octroyés
- État des stocks actuels

#### 3. Rapport Global (PDF)
**Contenu** :
- Synthèse générale (alimentations + octrois)
- État des validations
- État des stocks par produit
- Classement top produits
- Analyse complète

### Génération d'un rapport

1. **Sélectionner** structure
2. **Choisir** période (date début/fin)
3. **Cliquer** sur le type souhaité
4. **Téléchargement** automatique du PDF

**Nom fichier** : `Rapport_[Type]_[Structure]_[Date].pdf`

---

## Statistiques

### Page Statistiques

**Accès** : Menu → Statistiques

**Fonctionnalités** :
- Sélection de structure
- Choix de période
- Actualisation données
- Export CSV

**Données affichées** :
- Vue d'ensemble 30 jours
- Graphiques par catégorie
- Top produits
- Transactions récentes
- État du stock

### Tableau de bord

**Accès** : Menu → Tableau de bord

**Widgets** :
- **Statistiques 30 jours** : Alimentations, Octrois, Valeurs, En attente
- **Aperçu produits** : Stocks critiques
- **Graphique catégories** : Répartition visuelle
- **Transactions récentes** : 10 dernières opérations
- **Tendances** : Évolution sur période

---

## FAQ

### Q1 : Je ne peux pas valider une alimentation, pourquoi ?
**R** : Vérifiez que vous avez consulté les observations (icône 💬). Sans consultation, la validation est bloquée.

### Q2 : Le rejet ne fonctionne pas
**R** : L'observation est OBLIGATOIRE pour rejeter. Saisissez une explication dans le champ "Observations".

### Q3 : Je clique sur un document mais j'ai une erreur 404
**R** : Ce bug a été corrigé. Assurez-vous que l'application est à jour (voir version dans footer).

### Q4 : Les statistiques du dashboard affichent 0
**R** : Ce bug a été corrigé. Rechargez la page. Si le problème persiste, vérifiez que votre structure a des données pour les 30 derniers jours.

### Q5 : Comment télécharger un rapport PDF ?
**R** : Menu → États/Rapports → Sélectionner structure + période → Cliquer "Générer". Le PDF se télécharge automatiquement.

### Q6 : Je ne vois pas le menu sur mobile
**R** : Cliquez sur l'icône hamburger (☰) en haut à gauche. Pour vous déconnecter, faites défiler le menu jusqu'en bas.

### Q7 : Quelle est la différence entre "En instance" et "Rejeter" ?
**R** : 
- **En instance** : Dossier incomplet, besoin d'informations complémentaires. Peut être revalidé plus tard.
- **Rejeter** : Refus définitif. Le dossier est terminé et ne peut plus progresser.

### Q8 : Puis-je modifier une alimentation après création ?
**R** : Oui, mais uniquement si vous êtes Responsable Achats/Agent de Saisie ET que le statut est EN_ATTENTE. Après validation, seul un rejet permet de recréer.

### Q9 : Comment voir l'historique des actions ?
**R** : Cliquez sur l'icône 💬 à côté de chaque alimentation/octroi pour voir toutes les actions et observations.

### Q10 : Le stock ne se met pas à jour après validation
**R** : Seule la validation FINALE par l'Ordonnateur (statut VALIDE_ORDONNATEUR) impacte le stock. Les validations intermédiaires ne modifient pas les quantités.

---

## Support

**Contact** : Administrateur système
**Version** : 1.0.0
**Dernière mise à jour** : 26 novembre 2025

---

*Ce guide est fourni à titre informatif. Les procédures peuvent évoluer selon les besoins de l'organisation.*
