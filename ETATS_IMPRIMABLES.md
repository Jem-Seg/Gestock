# États Imprimables - GeStock

## 📋 Vue d'ensemble

GeStock offre un système complet d'états imprimables pour le suivi et la gestion du stock. Tous les états sont accessibles depuis la page **États** (`/etats`) et peuvent être imprimés directement depuis le navigateur.

---

## 📊 États de Suivi du Stock

### 1. État Général du Stock
**Utilité :** Vue d'ensemble complète de tous les produits en stock

**Informations affichées :**
- Statistiques globales (nombre d'articles, quantité totale, valeur totale)
- Articles en alerte (< 20% stock initial)
- Articles épuisés
- Répartition par catégorie
- Liste détaillée de tous les produits avec :
  - Nom, description, catégorie
  - Quantité actuelle / quantité initiale
  - Prix unitaire, valeur du stock
  - Structure et ministère
  - Statut d'alerte

**Filtres disponibles :**
- Par structure spécifique
- Par ministère entier

**API :** `GET /api/etats/stock/general`

---

### 2. État du Stock par Structure
**Utilité :** Détail du stock d'une structure particulière

**Informations affichées :**
- Informations de la structure sélectionnée
- Statistiques spécifiques à la structure
- Tous les produits gérés par cette structure
- Alertes et niveaux de stock

**Filtres requis :**
- Structure (obligatoire)

**API :** `GET /api/etats/stock/par-structure?structureId=xxx`

---

### 3. État du Stock par Article
**Utilité :** Suivi détaillé d'un produit spécifique

**Informations affichées :**
- Fiche produit complète
- Stock actuel vs stock initial
- Historique des mouvements (entrées/sorties)
- Valeur du stock restant
- Taux d'utilisation

**Filtres requis :**
- Article (obligatoire)
- Structure (obligatoire)

**API :** `GET /api/etats/stock/par-article?produitId=xxx&structureId=xxx`

---

### 4. Seuils d'Alerte
**Utilité :** Liste des produits nécessitant une attention (stock bas ou épuisé)

**Types d'alertes :**
- **Critique :** Stock = 0 (épuisé)
- **Attention :** Stock ≤ 20% du stock initial

**Informations affichées :**
- Produits en rupture de stock
- Produits en alerte
- Niveau de stock restant
- Seuil d'alerte calculé
- Pourcentage de stock restant

**Filtres disponibles :**
- Tous les produits
- Par structure
- Par ministère

**API :** `GET /api/etats/stock/alertes`

---

## 📦 Mouvements du Stock

### 5. Bon d'Entrée (Alimentation)
**Utilité :** Document officiel d'une entrée de stock

**Informations affichées :**
- Numéro du bon d'entrée
- Date de réception
- Statut de validation
- **Fournisseur :**
  - Nom
  - NIF (si disponible)
- **Produit :**
  - Nom, description, catégorie
  - Unité de mesure
- **Quantités :**
  - Quantité reçue
  - Prix unitaire
  - Montant total
- Documents joints
- Observations

**Filtres requis :**
- Alimentation (obligatoire - sélection parmi les alimentations validées)

**Workflow :**
1. Sélectionner une structure
2. Choisir une alimentation de la liste
3. Générer le bon d'entrée

**API :** `GET /api/etats/mouvements/bon-entree?alimentationId=xxx`

---

### 6. Bon de Sortie (Octroi)
**Utilité :** Document officiel d'une sortie de stock

**Informations affichées :**
- Numéro du bon de sortie
- Date d'octroi
- Statut de validation
- **Bénéficiaire :**
  - Structure destinataire
  - Service/département
- **Produit :**
  - Nom, description, catégorie
  - Unité de mesure
- **Quantités :**
  - Quantité octroyée
  - Prix unitaire estimé
  - Valeur totale
- Motif de l'octroi
- Observations

**Filtres requis :**
- Octroi (obligatoire - sélection parmi les octrois validés)

**Workflow :**
1. Sélectionner une structure
2. Choisir un octroi de la liste
3. Générer le bon de sortie

**API :** `GET /api/etats/mouvements/bon-sortie?octroiId=xxx`

---

### 7. Mouvements sur Période
**Utilité :** Récapitulatif de tous les mouvements sur une période donnée

**Informations affichées :**
- **Entrées (Alimentations) :**
  - Date, numéro, produit
  - Quantité entrée
  - Prix unitaire, valeur totale
  - Fournisseur
  - Statut
- **Sorties (Octrois) :**
  - Date, numéro, produit
  - Quantité sortie
  - Valeur estimée
  - Bénéficiaire
  - Statut
- **Statistiques de période :**
  - Total entrées / sorties
  - Valeur totale des mouvements
  - Solde de la période

**Filtres disponibles :**
- Date début / Date fin
- Structure spécifique
- Type de mouvement (tous, entrées, sorties)

**API :** `GET /api/etats/mouvements/periode?dateDebut=xxx&dateFin=xxx&structureId=xxx&type=tous`

---

### 8. Historique par Article
**Utilité :** Traçabilité complète d'un produit sur une période

**Informations affichées :**
- Fiche produit
- Stock initial de la période
- **Tous les mouvements :**
  - Alimentations reçues
  - Octrois effectués
  - Date, quantité, type
  - Statut de validation
- Stock final de la période
- Variation nette

**Filtres requis :**
- Article (obligatoire)
- Date début / Date fin (recommandé)

**API :** `GET /api/etats/mouvements/historique-article?produitId=xxx&dateDebut=xxx&dateFin=xxx`

---

### 9. Historique par Structure
**Utilité :** Vue complète de l'activité d'une structure sur une période

**Informations affichées :**
- Informations de la structure
- **Récapitulatif par produit :**
  - Stock initial
  - Total des entrées
  - Total des sorties
  - Stock final
  - Variation
- **Détail des mouvements chronologiques**
- Statistiques globales de la période

**Filtres requis :**
- Structure (obligatoire)
- Date début / Date fin (recommandé)

**API :** `GET /api/etats/mouvements/historique-structure?structureId=xxx&dateDebut=xxx&dateFin=xxx`

---

## 🎨 Format et Mise en Page

### Caractéristiques communes

**En-tête de document :**
- Logo et nom du ministère
- Nom de la structure
- Titre de l'état
- Date de génération

**Pied de page :**
- Date d'impression
- Signature et cachet
- Page X / Y

**Format :** A4 optimisé pour impression
**Marges :** Standards pour impression professionnelle

### Bouton d'impression
Chaque état dispose d'un bouton **"Imprimer"** qui :
- Ouvre la boîte de dialogue d'impression du navigateur
- Applique une mise en page optimisée
- Masque les éléments non nécessaires (menus, boutons)

---

## 🔐 Contrôle d'Accès

### Permissions par rôle

**Agent de Saisie :**
- ✅ États de sa structure uniquement
- ✅ Bons d'entrée/sortie de sa structure
- ✅ Historiques de sa structure

**Responsable Financier :**
- ✅ États de sa structure
- ✅ Tous les états de suivi
- ✅ Tous les bons et historiques de sa structure

**Directeur :**
- ✅ États de toutes les structures de son ministère
- ✅ Tous les bons et mouvements
- ✅ Statistiques consolidées

**Ordonnateur :**
- ✅ Accès total à tous les états
- ✅ Vue transversale multi-ministères (si applicable)
- ✅ Tous les rapports et statistiques

**Administrateur :**
- ✅ Accès complet sans restriction
- ✅ Tous les états de toutes les structures

---

## 📱 Utilisation

### Workflow général

1. **Accéder à la page États**
   - Menu → États Imprimables

2. **Choisir le type d'état**
   - Sélectionner parmi les 2 catégories
   - Cliquer sur le type d'état souhaité

3. **Configurer les paramètres**
   - Sélectionner la structure (si applicable)
   - Choisir les filtres (dates, produit, etc.)
   - Sélectionner l'alimentation/octroi (pour les bons)

4. **Générer l'état**
   - Cliquer sur "Générer l'État"
   - Vérifier les données affichées

5. **Imprimer ou exporter**
   - Cliquer sur "Imprimer"
   - Choisir l'imprimante ou "Enregistrer en PDF"
   - Confirmer l'impression

---

## 🔧 API Routes Disponibles

```
/api/etats/
├── stock/
│   ├── general/              (GET) État général du stock
│   ├── par-structure/        (GET) Stock par structure
│   ├── par-article/          (GET) Stock par article
│   └── alertes/              (GET) Seuils d'alerte
└── mouvements/
    ├── bon-entree/           (GET) Bon d'entrée
    ├── bon-sortie/           (GET) Bon de sortie
    ├── periode/              (GET) Mouvements sur période
    ├── historique-article/   (GET) Historique par article
    └── historique-structure/ (GET) Historique par structure
```

### Paramètres communs

**Filtres de structure :**
- `structureId` - ID de la structure
- `ministereId` - ID du ministère

**Filtres temporels :**
- `dateDebut` - Date de début (format: YYYY-MM-DD)
- `dateFin` - Date de fin (format: YYYY-MM-DD)

**Filtres spécifiques :**
- `produitId` - ID du produit
- `alimentationId` - ID de l'alimentation
- `octroiId` - ID de l'octroi
- `type` - Type de mouvement (tous/entree/sortie)

---

## 📊 Cohérence avec les Statistiques

Les états imprimables utilisent les **mêmes sources de données** que les pages Statistiques et Tableau de bord :

### API `/api/structures/[id]/statistics`
- Fournit les statistiques détaillées pour les états
- Données cohérentes avec le tableau de bord
- Calculs identiques (valeurs, taux, métriques)

### Composant `StructureStatistics`
- Partage la logique de calcul
- Même format de données
- Assure la cohérence des chiffres

---

## ✅ Tests et Validation

### Points de contrôle

- ✅ Tous les états génèrent les données correctement
- ✅ Les filtres fonctionnent selon les permissions
- ✅ Les API routes sont sécurisées (authentification)
- ✅ La mise en page d'impression est optimale
- ✅ Les données affichées sont cohérentes avec les statistiques
- ✅ Les calculs (valeurs, totaux) sont exacts
- ✅ Les workflows de validation sont respectés

### Cas d'usage testés

1. **Agent de Saisie :**
   - Ne voit que les états de sa structure
   - Peut générer des bons d'entrée/sortie

2. **Responsable Financier :**
   - Accès aux états de suivi de sa structure
   - Génération de rapports de mouvements

3. **Directeur :**
   - Vue consolidée du ministère
   - États multi-structures

4. **Ordonnateur :**
   - Accès complet aux états
   - Rapports transversaux

---

## 🚀 Prochaines Améliorations

### Fonctionnalités futures

- [ ] Export PDF direct (sans boîte de dialogue navigateur)
- [ ] Export Excel pour les états tabulaires
- [ ] Envoi par email des états
- [ ] Programmation d'états automatiques (quotidien, hebdomadaire)
- [ ] Modèles personnalisables par structure
- [ ] Graphiques dans les états imprimés
- [ ] Signature électronique des bons
- [ ] Code QR pour traçabilité

---

## 📞 Support

Pour toute question ou problème concernant les états imprimables :
- Consulter le **Guide Utilisateur** (`GUIDE_UTILISATEUR.md`)
- Vérifier les logs dans la console navigateur
- Contacter l'administrateur système

---

**Dernière mise à jour :** 26 novembre 2025
