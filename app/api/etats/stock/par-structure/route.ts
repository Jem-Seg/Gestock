import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const structureId = searchParams.get('structureId');

    if (!structureId) {
      return NextResponse.json({ error: 'ID structure requis' }, { status: 400 });
    }

    // Récupérer la structure
    const structure = await prisma.structure.findUnique({
      where: { id: structureId },
      include: {
        ministere: true,
      },
    });

    if (!structure) {
      return NextResponse.json({ error: 'Structure non trouvée' }, { status: 404 });
    }

    // Récupérer tous les produits de la structure
    const produits = await prisma.produit.findMany({
      where: { structureId },
      include: {
        category: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    // Récupérer les alimentations de la structure
    const alimentations = await prisma.alimentation.findMany({
      where: {
        structureId,
        statut: 'VALIDE_ORDONNATEUR',
      },
    });

    // Récupérer les octrois de la structure
    const octrois = await prisma.octroi.findMany({
      where: {
        structureId,
        statut: 'VALIDE_ORDONNATEUR',
      },
    });

    // Calculer les statistiques
    const stats = produits.reduce(
      (acc, produit) => {
        const valeurStock = (produit.price || 0) * produit.quantity;
        acc.totalArticles += 1;
        acc.totalQuantite += produit.quantity;
        acc.valeurTotale += valeurStock;
        
        const seuilAlerte = Math.ceil(produit.initialQuantity * 0.2);
        if (produit.quantity <= seuilAlerte && produit.quantity > 0) {
          acc.articlesAlerte += 1;
        }
        if (produit.quantity === 0) {
          acc.articlesEpuises += 1;
        }
        
        return acc;
      },
      { totalArticles: 0, totalQuantite: 0, valeurTotale: 0, articlesAlerte: 0, articlesEpuises: 0 }
    );

    // Grouper par catégorie
    const parCategorie = produits.reduce((acc: any, produit) => {
      const categoryName = produit.category.name;
      if (!acc[categoryName]) {
        acc[categoryName] = {
          nom: categoryName,
          articles: 0,
          quantite: 0,
          valeur: 0,
          produitsAlerte: 0,
          produitsEpuises: 0,
        };
      }
      const seuilAlerte = Math.ceil(produit.initialQuantity * 0.2);
      acc[categoryName].articles += 1;
      acc[categoryName].quantite += produit.quantity;
      acc[categoryName].valeur += (produit.price || 0) * produit.quantity;
      if (produit.quantity <= seuilAlerte && produit.quantity > 0) {
        acc[categoryName].produitsAlerte += 1;
      }
      if (produit.quantity === 0) {
        acc[categoryName].produitsEpuises += 1;
      }
      return acc;
    }, {});

    const totalEntrees = alimentations.reduce((sum, a) => sum + a.quantite, 0);
    const totalSorties = octrois.reduce((sum, o) => sum + o.quantite, 0);

    return NextResponse.json({
      entete: {
        ministere: structure.ministere.name,
        structure: structure.name,
      },
      structure: {
        id: structure.id,
        nom: structure.name,
        abreviation: structure.abreviation,
        ministere: structure.ministere.name,
        miniAbreviation: structure.ministere.abreviation,
      },
      produits: produits.map(p => ({
        id: p.id,
        nom: p.name,
        categorie: p.category.name,
        quantite: p.quantity,
        quantiteInitiale: p.initialQuantity,
        unite: p.unit,
        prixUnitaire: p.price,
        valeurStock: (p.price || 0) * p.quantity,
        seuilAlerte: Math.ceil(p.initialQuantity * 0.2),
        enAlerte: p.quantity <= Math.ceil(p.initialQuantity * 0.2) && p.quantity > 0,
        epuise: p.quantity === 0,
      })),
      statistiques: {
        ...stats,
        totalEntrees,
        totalSorties,
        nombreAlimentations: alimentations.length,
        nombreOctrois: octrois.length,
      },
      parCategorie: Object.values(parCategorie),
      dateGeneration: new Date().toISOString(),
    });
  } catch (error) {
    console.error('❌ Erreur état par structure:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la génération de l\'état' },
      { status: 500 }
    );
  }
}
