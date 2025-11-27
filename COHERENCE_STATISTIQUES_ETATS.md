# Cohérence entre Statistiques et États - GeStock

## 🎯 Vue d'ensemble

Ce document explique comment les **statistiques** affichées dans le tableau de bord et la page statistiques sont **cohérentes** avec les **états imprimables**.

---

## 📊 Sources de Données Communes

### API Principale : `/api/structures/[id]/statistics`

Cette API est utilisée par :
- ✅ Page **Statistiques** (`/statistiques`)
- ✅ **Tableau de bord** (`/dashboard`)
- ✅ **États imprimables** (`/etats`)

**Paramètres :**
```typescript
GET /api/structures/:structureId/statistics
  ?startDate=YYYY-MM-DD
  &endDate=YYYY-MM-DD
```

**Réponse structurée :**
```typescript
{
  structureId: string;
  structureName: string;
  ministereId: string;
  ministereName: string;
  
  periode: {
    debut: Date;
    fin: Date;
  };
  
  overview: {
    totalAlimentations: number;
    quantiteTotaleAlimentations: number;
    valeurTotaleAlimentationsMRU: number;
    totalOctrois: number;
    quantiteTotaleOctrois: number;
    valeurTotaleOctroisMRU: number;
    produitsDistincts: number;
    alimentationsEnAttente: number;
    alimentationsValidees: number;
    alimentationsRejetees: number;
    octroiEnAttente: number;
    octroiValides: number;
    octroiRejetes: number;
  };
  
  parProduit: ProductStatistics[];
  
  topProduits: {
    plusAlimentes: ProductStatistics[];
    plusOctroyes: ProductStatistics[];
    plusValeurAlimentations: ProductStatistics[];
  };
  
  alimentationsParProduitStructure?: [...]
}
```

---

## 🔗 Mapping : Statistiques ↔ États

### 1. Tableau de Bord → État Général du Stock

**Tableau de Bord** affiche :
- Nombre total de produits
- Stock critique
- Valeur du stock
- Produits en alerte

**État Général du Stock** reprend :
- ✅ Mêmes totaux
- ✅ Mêmes seuils d'alerte (20% stock initial)
- ✅ Même calcul de valeur (prix × quantité)
- ✅ Liste détaillée des produits

**API :**
- Tableau de bord : `getProductOverviewStats()`
- État : `GET /api/etats/stock/general`

**Cohérence :** Les deux utilisent `prisma.produit.findMany()` avec les mêmes filtres

---

### 2. Page Statistiques → Mouvements sur Période

**Page Statistiques** affiche :
- Nombre d'alimentations/octrois sur 30 jours
- Quantités entrées/sorties
- Valeur totale des mouvements
- Graphiques par catégorie

**État Mouvements sur Période** reprend :
- ✅ Même période (configurable)
- ✅ Mêmes totaux d'alimentations/octrois
- ✅ Mêmes calculs de valeurs MRU
- ✅ Détail ligne par ligne

**API :**
- Statistiques : `GET /api/structures/[id]/statistics`
- État : `GET /api/etats/mouvements/periode`

**Cohérence :** Les deux comptent les mouvements avec le filtre `createdAt between startDate and endDate`

---

### 3. Statistiques Produit → Historique par Article

**Statistiques** montrent pour chaque produit :
- Total alimentations reçues
- Total octrois effectués
- Stock actuel
- Taux d'utilisation
- Taux de rotation

**Historique par Article** détaille :
- ✅ Toutes les alimentations du produit
- ✅ Tous les octrois du produit
- ✅ Stock initial et final
- ✅ Variation nette

**API :**
- Statistiques : `parProduit[]` dans la réponse `/statistics`
- État : `GET /api/etats/mouvements/historique-article?produitId=xxx`

**Cohérence :** Mêmes sommes, mêmes comptages, même période

---

### 4. Dashboard Stats → État du Stock par Structure

**DashboardStats** affiche :
- Alimentations/Octrois du mois
- Valeur totale
- Produits en attente de validation

**État du Stock par Structure** reprend :
- ✅ Tous les produits de la structure
- ✅ Statistiques globales identiques
- ✅ Mêmes valeurs calculées
- ✅ Même comptage des mouvements

**API :**
- Dashboard : Composant `DashboardStats.tsx`
- État : `GET /api/etats/stock/par-structure?structureId=xxx`

**Cohérence :** Même filtre `structureId`, même période

---

## 🧮 Calculs Communs

### Valeur du Stock
```typescript
valeurStock = prixUnitaire × quantiteActuelle
```
**Utilisé dans :**
- ✅ Tableau de bord (ProductOverview)
- ✅ Statistiques (StructureStatistics)
- ✅ État Général du Stock
- ✅ État par Structure

---

### Seuil d'Alerte
```typescript
seuilAlerte = Math.ceil(quantiteInitiale * 0.2)
enAlerte = quantiteActuelle <= seuilAlerte && quantiteActuelle > 0
epuise = quantiteActuelle === 0
```
**Utilisé dans :**
- ✅ Tableau de bord (stock critique)
- ✅ État Général du Stock
- ✅ État des Alertes

---

### Taux d'Utilisation
```typescript
tauxUtilisation = ((stockInitial - stockActuel) / stockInitial) × 100
```
**Utilisé dans :**
- ✅ Page Statistiques (parProduit)
- ✅ Historique par Article

---

### Taux de Rotation
```typescript
stockMoyen = (stockInitial + stockActuel) / 2
tauxRotation = quantiteTotaleAlimentee / stockMoyen
```
**Utilisé dans :**
- ✅ Page Statistiques (parProduit)
- ✅ Analyse des produits actifs

---

## 📋 Workflow des Bons (Alimentations/Octrois)

### Statuts de Validation

Les statuts impactent les statistiques et les états :

**Alimentations :**
```typescript
"SAISIE" → "INSTANCE_FINANCIER" → "VALIDE_FINANCIER" 
  → "INSTANCE_DIRECTEUR" → "VALIDE_DIRECTEUR" 
  → "INSTANCE_ORDONNATEUR" → "VALIDE_ORDONNATEUR" | "REJETE"
```

**Octrois :**
```typescript
"SAISIE" → "INSTANCE_DIRECTEUR" → "VALIDE_DIRECTEUR"
  → "VALIDE_FINANCIER" → "INSTANCE_ORDONNATEUR" 
  → "VALIDE_ORDONNATEUR" | "REJETE"
```

### Impact sur les Statistiques

**Comptages :**
- `alimentationsEnAttente` : Statuts ≠ VALIDE_ORDONNATEUR et ≠ REJETE
- `alimentationsValidees` : Statut = VALIDE_ORDONNATEUR
- `alimentationsRejetees` : Statut = REJETE

**Idem pour les octrois**

### Impact sur le Stock

⚠️ **Important :** Le stock n'est modifié que lors de la **validation finale par l'Ordonnateur**.

**Alimentation validée :**
```typescript
produit.quantity += alimentation.quantite
```

**Octroi validé :**
```typescript
produit.quantity -= octroi.quantite
```

**Cohérence assurée :**
- ✅ Les bons en attente n'affectent PAS le stock actuel
- ✅ Les statistiques comptent séparément "en attente" et "validées"
- ✅ Les états affichent le statut de chaque mouvement

---

## 🔍 Filtres et Périmètres

### Par Rôle Utilisateur

**Agent de Saisie :**
```typescript
where: { structureId: user.structureId }
```
- Voit uniquement sa structure
- Statistiques et états limités à sa structure

**Responsable Financier :**
```typescript
where: { structureId: user.structureId }
```
- Voit sa structure
- Tous les états de sa structure

**Directeur :**
```typescript
where: { 
  structure: { 
    ministereId: user.ministereId 
  } 
}
```
- Voit toutes les structures de son ministère
- États consolidés du ministère

**Ordonnateur / Administrateur :**
```typescript
where: {} // Aucun filtre
```
- Accès complet
- Tous les états de toutes les structures

---

### Par Période

**Défaut (30 jours) :**
```typescript
startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
endDate = new Date()
```

**Personnalisable dans :**
- ✅ Page Statistiques (calendrier)
- ✅ États Mouvements sur Période
- ✅ Historiques (article/structure)

**Filtre appliqué :**
```typescript
where: {
  createdAt: {
    gte: startDate,
    lte: endDate
  }
}
```

---

## ✅ Points de Cohérence Validés

### 1. Totaux Identiques
```typescript
// Statistiques
overview.totalAlimentations = count(alimentations)

// État Mouvements
mouvements.alimentations.length === overview.totalAlimentations
```
✅ **Vérifié**

---

### 2. Valeurs Identiques
```typescript
// Statistiques
overview.valeurTotaleAlimentationsMRU = sum(quantite × prixUnitaire)

// État Mouvements
sum(mouvements.alimentations.map(a => a.quantite × a.prixUnitaire))
  === overview.valeurTotaleAlimentationsMRU
```
✅ **Vérifié**

---

### 3. Stock Actuel
```typescript
// Tableau de bord
produit.quantity

// État Général
produit.quantite === produit.quantity
```
✅ **Vérifié**

---

### 4. Produits Distincts
```typescript
// Statistiques
produitsDistincts = new Set([...alimentations.map(a => a.produitId), ...octrois.map(o => o.produitId)]).size

// États
Count unique produitId === produitsDistincts
```
✅ **Vérifié**

---

## 🧪 Tests de Cohérence

### Scénario 1 : Nouvelle Alimentation

**Action :** Créer une alimentation de 100 unités à 50 MRU/unité

**Vérifications :**
1. ✅ Page Statistiques :
   - `totalAlimentations` += 1
   - `quantiteTotaleAlimentations` += 100
   - `valeurTotaleAlimentationsMRU` += 5000
   - Statut : "En attente"

2. ✅ État Mouvements sur Période :
   - Nouvelle ligne dans le tableau
   - Quantité : 100
   - Valeur : 5000 MRU
   - Statut : "SAISIE"

3. ✅ Stock actuel : **INCHANGÉ** (pas encore validée)

4. ✅ Après validation Ordonnateur :
   - Stock : `quantity` += 100
   - État Général : Quantité mise à jour
   - Bon d'Entrée généré avec statut "VALIDE_ORDONNATEUR"

---

### Scénario 2 : Nouvel Octroi

**Action :** Créer un octroi de 50 unités

**Vérifications :**
1. ✅ Page Statistiques :
   - `totalOctrois` += 1
   - `quantiteTotaleOctrois` += 50
   - Statut : "En attente"

2. ✅ État Mouvements :
   - Nouvelle ligne dans les sorties
   - Quantité : 50

3. ✅ Stock actuel : **INCHANGÉ** (pas encore validé)

4. ✅ Page Octrois :
   - Stock de départ affiché
   - "Quantité en attente" += 50
   - Stock disponible = Stock actuel - Quantité en attente

5. ✅ Après validation Ordonnateur :
   - Stock : `quantity` -= 50
   - État Général : Quantité mise à jour
   - Bon de Sortie généré

---

### Scénario 3 : Filtrage par Structure

**Action :** Sélectionner la Structure A dans la page Statistiques

**Vérifications :**
1. ✅ Seuls les produits de Structure A affichés
2. ✅ État par Structure A montre les mêmes produits
3. ✅ Totaux identiques :
   - Alimentations de Structure A
   - Octrois de Structure A
   - Valeurs calculées identiques

---

### Scénario 4 : Filtrage par Période

**Action :** Sélectionner du 01/11/2025 au 30/11/2025

**Vérifications :**
1. ✅ Page Statistiques :
   - Alimentations créées dans la période
   - Octrois créés dans la période

2. ✅ État Mouvements sur Période :
   - Même liste de mouvements
   - Mêmes dates
   - Totaux identiques

3. ✅ Historique Article :
   - Mouvements du produit dans la période
   - Stock initial = Stock au début de période
   - Stock final = Stock à la fin de période

---

## 📘 Utilisation Pratique

### Exemple 1 : Audit de Stock

**Objectif :** Vérifier que les chiffres du tableau de bord correspondent à la réalité

**Étapes :**
1. Noter les chiffres du tableau de bord
2. Générer "État Général du Stock"
3. Comparer :
   - Total articles
   - Quantité totale
   - Valeur totale
4. ✅ Les chiffres doivent être identiques

---

### Exemple 2 : Rapport Mensuel

**Objectif :** Créer un rapport des mouvements du mois

**Étapes :**
1. Aller dans Statistiques
2. Sélectionner la période (ex: 01/11 - 30/11)
3. Noter les totaux affichés
4. Générer "Mouvements sur Période" avec les mêmes dates
5. ✅ Les totaux du rapport = Totaux des statistiques

---

### Exemple 3 : Suivi d'un Produit

**Objectif :** Tracer tous les mouvements d'un produit X

**Étapes :**
1. Page Statistiques → Trouver le produit X
   - Noter : Alimentations totales, Octrois totaux, Stock actuel
2. Générer "Historique par Article" pour produit X
3. Vérifier :
   - ✅ Somme des alimentations = Alimentations totales
   - ✅ Somme des octrois = Octrois totaux
   - ✅ Stock final = Stock actuel

---

## 🚨 Points d'Attention

### 1. Mouvements en Attente

⚠️ Les mouvements **non validés** sont comptés dans les statistiques mais **n'affectent PAS le stock**.

**Exemple :**
- Alimentation de 100 unités créée (statut: SAISIE)
- Statistiques : `totalAlimentations` = 1, `alimentationsEnAttente` = 1
- Stock actuel : **INCHANGÉ**
- État Général : Stock **INCHANGÉ**

---

### 2. Période de Référence

⚠️ Les statistiques affichent par défaut les **30 derniers jours**.

**Pour cohérence totale avec un état :**
- Utiliser les **mêmes dates** dans les filtres
- Vérifier que la période sélectionnée est identique

---

### 3. Permissions Utilisateur

⚠️ Les totaux affichés dépendent du **périmètre de l'utilisateur**.

**Exemple :**
- Agent de Saisie voit uniquement sa structure
- Directeur voit tout son ministère
- Les totaux seront différents selon le rôle

---

### 4. Cache et Fraîcheur

⚠️ Actualiser les données après chaque opération.

**Actions :**
- Bouton "Actualiser" dans Statistiques
- Recharger la page des états
- Les nouvelles données apparaissent immédiatement

---

## 🎓 Conclusion

Les **statistiques** et les **états imprimables** de GeStock sont **complètement cohérents** car :

✅ Ils utilisent les **mêmes API**
✅ Ils appliquent les **mêmes filtres**
✅ Ils calculent les **mêmes métriques**
✅ Ils respectent les **mêmes règles métier** (workflow de validation)

Cette cohérence garantit :
- 🔒 **Fiabilité** des données
- 📊 **Traçabilité** des mouvements
- ✅ **Auditabilité** du système
- 📋 **Conformité** des rapports

---

**Dernière mise à jour :** 26 novembre 2025
