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

    if (!produitId) {
      return NextResponse.json({ error: 'ID produit requis' }, { status: 400 });
    }

    // Récupérer le produit avec ses détails
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

    // Récupérer toutes les alimentations du produit
    const alimentations = await prisma.alimentation.findMany({
      where: {
        produitId,
        statut: 'VALIDE_ORDONNATEUR',
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Récupérer tous les octrois du produit
    const octrois = await prisma.octroi.findMany({
      where: {
        produitId,
        statut: 'VALIDE_ORDONNATEUR',
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Calculer les totaux
    const totalEntrees = alimentations.reduce((sum, a) => sum + a.quantite, 0);
    const totalSorties = octrois.reduce((sum, o) => sum + o.quantite, 0);

    // Historique des mouvements (entrées et sorties combinées)
    const mouvements = [
      ...alimentations.map(a => ({
        id: a.id,
        type: 'ENTREE',
        numero: a.numero,
        date: a.createdAt,
        quantite: a.quantite,
        prixUnitaire: a.prixUnitaire,
        valeur: a.quantite * a.prixUnitaire,
        reference: `${a.fournisseurNom}`,
        statut: a.statut,
      })),
      ...octrois.map(o => ({
        id: o.id,
        type: 'SORTIE',
        numero: o.numero,
        date: o.createdAt,
        quantite: o.quantite,
        prixUnitaire: produit.price || 0,
        valeur: o.quantite * (produit.price || 0),
        reference: `${o.beneficiaireNom}`,
        statut: o.statut,
      })),
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return NextResponse.json({
      produit: {
        id: produit.id,
        nom: produit.name,
        description: produit.description,
        categorie: produit.category.name,
        quantiteActuelle: produit.quantity,
        quantiteInitiale: produit.initialQuantity,
        unite: produit.unit,
        prixUnitaire: produit.price,
        valeurStock: (produit.price || 0) * produit.quantity,
        structure: produit.structure.name,
        ministere: produit.structure.ministere.name,
        seuilAlerte: Math.ceil(produit.initialQuantity * 0.2),
      },
      statistiques: {
        totalEntrees,
        totalSorties,
        stockActuel: produit.quantity,
        nombreAlimentations: alimentations.length,
        nombreOctrois: octrois.length,
        valeurTotaleEntrees: alimentations.reduce((sum, a) => sum + (a.quantite * a.prixUnitaire), 0),
        valeurTotaleSorties: octrois.reduce((sum, o) => sum + (o.quantite * (produit.price || 0)), 0),
      },
      mouvements,
      dateGeneration: new Date().toISOString(),
    });
  } catch (error) {
    console.error('❌ Erreur état par article:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la génération de l\'état' },
      { status: 500 }
    );
  }
}
