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
    const produitId = searchParams.get('produitId');
    const dateDebut = searchParams.get('dateDebut');
    const dateFin = searchParams.get('dateFin');

    if (!produitId) {
      return NextResponse.json({ error: 'ID produit requis' }, { status: 400 });
    }

    // Récupérer le produit
    const produit = await prisma.produit.findUnique({
      where: { id: produitId },
      include: {
        category: true,
        structure: {
          include: {
            ministere: true,
          },
        },
      },
    });

    if (!produit) {
      return NextResponse.json({ error: 'Produit non trouvé' }, { status: 404 });
    }

    // Construction du filtre de date
    const dateFilter: any = {};
    if (dateDebut) {
      dateFilter.gte = new Date(dateDebut);
    }
    if (dateFin) {
      const endDate = new Date(dateFin);
      endDate.setHours(23, 59, 59, 999);
      dateFilter.lte = endDate;
    }

    // Récupérer les alimentations du produit
    const whereAlim: any = {
      produitId,
      statut: 'VALIDE_ORDONNATEUR',
    };
    if (Object.keys(dateFilter).length > 0) {
      whereAlim.createdAt = dateFilter;
    }

    const alimentations = await prisma.alimentation.findMany({
      where: whereAlim,
      orderBy: { createdAt: 'asc' },
    });

    // Récupérer les octrois du produit
    const whereOctroi: any = {
      produitId,
      statut: 'VALIDE_ORDONNATEUR',
    };
    if (Object.keys(dateFilter).length > 0) {
      whereOctroi.createdAt = dateFilter;
    }

    const octrois = await prisma.octroi.findMany({
      where: whereOctroi,
      orderBy: { createdAt: 'asc' },
    });

    // Construire l'historique avec calcul du stock cumulé
    let stockCumule = produit.initialQuantity;
    const historique = [
      ...alimentations.map(a => ({
        id: a.id,
        type: 'ENTREE' as const,
        numero: a.numero,
        date: a.createdAt,
        quantite: a.quantite,
        prixUnitaire: a.prixUnitaire,
        valeur: a.quantite * a.prixUnitaire,
        reference: `Fournisseur: ${a.fournisseurNom}`,
        nif: a.fournisseurNIF,
      })),
      ...octrois.map(o => ({
        id: o.id,
        type: 'SORTIE' as const,
        numero: o.numero,
        date: o.createdAt,
        quantite: o.quantite,
        prixUnitaire: produit.price || 0,
        valeur: o.quantite * (produit.price || 0),
        reference: `Bénéficiaire: ${o.beneficiaireNom}`,
        motif: o.motif,
      })),
    ]
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map(mvt => {
        const quantiteAvant = stockCumule;
        if (mvt.type === 'ENTREE') {
          stockCumule += mvt.quantite;
        } else {
          stockCumule -= mvt.quantite;
        }
        return {
          ...mvt,
          stockAvant: quantiteAvant,
          stockApres: stockCumule,
        };
      });

    // Statistiques
    const stats = {
      totalEntrees: alimentations.reduce((sum, a) => sum + a.quantite, 0),
      totalSorties: octrois.reduce((sum, o) => sum + o.quantite, 0),
      nombreEntrees: alimentations.length,
      nombreSorties: octrois.length,
      valeurTotaleEntrees: alimentations.reduce((sum, a) => sum + (a.quantite * a.prixUnitaire), 0),
      valeurTotaleSorties: octrois.reduce((sum, o) => sum + (o.quantite * (produit.price || 0)), 0),
      stockInitial: produit.initialQuantity,
      stockFinal: produit.quantity,
    };

    return NextResponse.json({
      entete: {
        ministere: produit.structure.ministere.name,
        structure: produit.structure.name,
      },
      produit: {
        id: produit.id,
        nom: produit.name,
        description: produit.description,
        categorie: produit.category.name,
        unite: produit.unit,
        prixUnitaire: produit.price,
        structure: produit.structure.name,
        ministere: produit.structure.ministere.name,
      },
      historique,
      statistiques: stats,
      filtres: {
        dateDebut: dateDebut || null,
        dateFin: dateFin || null,
      },
      dateGeneration: new Date().toISOString(),
    });
  } catch (error) {
    console.error('❌ Erreur historique par article:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la génération de l\'historique' },
      { status: 500 }
    );
  }
}
