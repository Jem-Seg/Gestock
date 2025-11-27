# Corrections du Workflow et Accès aux Documents

## Date : 27 novembre 2025

## Corrections Apportées

### 1. 📋 Obligation de Consulter les Observations

**Problème** : Les utilisateurs pouvaient valider, rejeter ou mettre en instance des alimentations/octrois sans avoir consulté les observations précédentes.

**Solution** :
- Modification de `openActionModal()` dans `app/alimentations/page.tsx` et `app/octrois/page.tsx`
- Ajout d'une vérification avant l'ouverture du modal d'action
- Si des observations existent et n'ont pas été consultées, affichage d'un message d'erreur
- Ouverture automatique du modal d'historique pour forcer la consultation

**Code ajouté** :
```typescript
// Pour les actions de workflow (valider, rejeter, mettre en instance),
// vérifier que l'utilisateur a consulté les observations s'il y en a
if (action !== 'delete' && alimentation.historiqueActions && alimentation.historiqueActions.length > 0) {
  if (!viewedObservationsIds.has(alimentation.id)) {
    toast.error('Vous devez d\'abord consulter les observations avant de procéder à cette action');
    // Ouvrir automatiquement le modal des observations
    openHistoryModal(alimentation);
    return;
  }
}
```

### 2. ✍️ Saisie Obligatoire des Observations

**Problème** : Les observations n'étaient obligatoires que pour "instance" et "reject", mais pas pour "validate".

**Solution** :
- Modification du formulaire dans les modals d'action
- Ajout de l'attribut `required` sans condition pour toutes les actions
- Ajout d'un message explicite indiquant que la saisie est obligatoire
- Amélioration visuelle avec un astérisque rouge et un message d'aide

**Modifications dans les deux pages** :
```typescript
<label className="label">
  <span className="label-text">Observations <span className="text-error">*</span></span>
</label>
<textarea
  className="textarea textarea-bordered"
  value={observations}
  onChange={(e) => setObservations(e.target.value)}
  placeholder="Saisir vos observations (obligatoire)..."
  rows={4}
  required
/>
<label className="label">
  <span className="label-text-alt text-error">La saisie d'observations est obligatoire pour toutes les actions</span>
</label>
```

### 3. 📎 Correction de l'Accès aux Documents (Erreur 404)

**Problème** : Lorsque les utilisateurs cliquaient sur les documents uploadés, ils obtenaient une erreur 404 car Next.js essayait de traiter `/uploads/...` comme une route de l'application.

**Solution** :

#### 3.1 Création d'une Route API Sécurisée
- Nouveau fichier : `app/api/documents/[...path]/route.ts`
- Route dynamique qui capture tous les chemins de documents
- Vérification de l'authentification avant de servir les fichiers
- Sécurité : vérification que le chemin ne sort pas du dossier uploads
- Support de multiples types MIME (PDF, images, Word, Excel, etc.)
- Headers appropriés pour le cache et la sécurité

**Fonctionnalités de la route API** :
```typescript
export async function GET(request: NextRequest, { params }: { params: { path: string[] } }) {
  // 1. Vérifier l'authentification
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }
  
  // 2. Construire le chemin du fichier
  const filePath = params.path.join('/');
  const fullPath = join(process.cwd(), 'public', 'uploads', filePath);
  
  // 3. Vérifications de sécurité
  // - Le fichier existe
  // - Le chemin ne sort pas du dossier uploads
  
  // 4. Servir le fichier avec le bon Content-Type
}
```

#### 3.2 Fonction de Transformation des URLs
- Ajout de `getDocumentUrl()` dans les deux pages
- Transforme `/uploads/...` en `/api/documents/...`
- Appliquée à tous les liens de documents

```typescript
const getDocumentUrl = (url: string) => {
  if (url.startsWith('/uploads/')) {
    return url.replace('/uploads/', '/api/documents/');
  }
  return url;
};
```

#### 3.3 Mise à Jour des Affichages de Documents

**Dans `app/alimentations/page.tsx`** :
- Tableau desktop : liens des documents dans la colonne "Documents"
- Vue mobile : liens des documents dans la section Documents des cartes
- Modal des documents : bouton "Ouvrir" pour chaque document

**Dans `app/octrois/page.tsx`** :
- Modal des documents : bouton "Ouvrir" pour chaque document

Tous ces liens utilisent maintenant :
```typescript
href={getDocumentUrl(doc.url)}
```

## Fichiers Modifiés

1. ✅ `app/alimentations/page.tsx`
   - Fonction `openActionModal()` : validation consultation observations
   - Fonction `getDocumentUrl()` : transformation URLs
   - Modal d'action : observations obligatoires
   - Affichage des documents : 3 emplacements mis à jour

2. ✅ `app/octrois/page.tsx`
   - Fonction `openActionModal()` : validation consultation observations
   - Fonction `getDocumentUrl()` : transformation URLs
   - Modal d'action : observations obligatoires
   - Affichage des documents : modal mis à jour

3. ✅ `app/api/documents/[...path]/route.ts` (NOUVEAU)
   - Route API sécurisée pour servir les documents
   - Authentification obligatoire
   - Support multi-formats
   - Protection contre les accès non autorisés

## Tests à Effectuer

### 1. Test Consultation des Observations
- [ ] Créer une alimentation/octroi avec observations
- [ ] Essayer de valider sans consulter les observations
- [ ] Vérifier que le message d'erreur s'affiche
- [ ] Vérifier que le modal d'historique s'ouvre automatiquement
- [ ] Consulter les observations
- [ ] Vérifier que l'action est maintenant possible

### 2. Test Saisie Obligatoire des Observations
- [ ] Ouvrir le modal de validation
- [ ] Essayer de soumettre sans saisir d'observations
- [ ] Vérifier que le formulaire ne se soumet pas
- [ ] Saisir des observations
- [ ] Vérifier que la soumission fonctionne

### 3. Test Accès aux Documents
- [ ] Uploader un document PDF sur une alimentation
- [ ] Uploader une image sur un octroi
- [ ] Cliquer sur le lien du document dans le tableau
- [ ] Vérifier que le document s'ouvre dans un nouvel onglet
- [ ] Vérifier qu'il n'y a pas d'erreur 404
- [ ] Tester en mode déconnecté (doit afficher "Non autorisé")
- [ ] Tester différents types de fichiers (PDF, JPG, PNG, DOCX)

## Sécurité

### Points de Sécurité Implémentés
1. ✅ Authentification requise pour accéder aux documents
2. ✅ Vérification que le chemin du fichier reste dans `/public/uploads`
3. ✅ Vérification de l'existence du fichier avant de le servir
4. ✅ Headers de cache appropriés (private, 1 heure)
5. ✅ Content-Type correct pour chaque type de fichier

### Points d'Amélioration Futurs (Optionnels)
- Vérifier que l'utilisateur a le droit d'accéder au document spécifique
- Logger les accès aux documents
- Limiter la taille des fichiers servis
- Ajouter un système de watermark pour les documents sensibles

## Impact sur les Utilisateurs

### Avantages
1. 🔒 **Meilleure traçabilité** : obligation de consulter et saisir des observations
2. 📄 **Accès fiable aux documents** : plus d'erreur 404
3. 🔐 **Sécurité renforcée** : documents accessibles uniquement aux utilisateurs connectés
4. ✅ **Workflow plus rigoureux** : garantit que toutes les actions sont documentées

### Changements pour les Utilisateurs
1. Les utilisateurs doivent maintenant :
   - Consulter les observations existantes avant toute action
   - Saisir obligatoirement des observations pour valider, rejeter ou mettre en instance
2. L'accès aux documents nécessite une authentification
3. Les documents s'ouvrent correctement dans un nouvel onglet

## Notes Techniques

- Les URLs des documents sont toujours stockées en base comme `/uploads/...`
- La transformation en `/api/documents/...` se fait côté client via `getDocumentUrl()`
- Cette approche évite de migrer toutes les données existantes
- Les nouveaux documents uploadés continueront d'utiliser `/uploads/...`
- La route API est compatible avec tous les formats de fichiers courants

## Conclusion

✅ Toutes les corrections demandées ont été implémentées avec succès :
1. Obligation de consulter les observations avant toute action
2. Saisie obligatoire des observations pour toutes les actions
3. Correction de l'erreur 404 lors de l'accès aux documents

Le workflow est maintenant plus rigoureux et les documents sont accessibles de manière fiable et sécurisée.
