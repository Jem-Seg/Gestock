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
    const alimentationId = searchParams.get('alimentationId');

    if (!alimentationId) {
      return NextResponse.json({ error: 'ID alimentation requis' }, { status: 400 });
    }

    // Récupérer l'alimentation avec tous ses détails
    const alimentation = await prisma.alimentation.findUnique({
      where: { id: alimentationId },
      include: {
        produit: {
          include: {
            category: true,
          },
        },
        structure: {
          include: {
            ministere: true,
          },
        },
        documents: true,
      },
    });

    if (!alimentation) {
      return NextResponse.json({ error: 'Alimentation non trouvée' }, { status: 404 });
    }

    return NextResponse.json({
      entete: {
        ministere: alimentation.structure.ministere.name,
        structure: alimentation.structure.name,
      },
      bonEntree: {
        id: alimentation.id,
        numero: alimentation.numero,
        date: alimentation.createdAt,
        dateValidation: alimentation.updatedAt,
        statut: alimentation.statut,
        isLocked: alimentation.isLocked,
      },
      produit: {
        nom: alimentation.produit.name,
        description: alimentation.produit.description,
        categorie: alimentation.produit.category.name,
        unite: alimentation.produit.unit,
      },
      quantite: {
        quantite: alimentation.quantite,
        prixUnitaire: alimentation.prixUnitaire,
        montantTotal: alimentation.quantite * alimentation.prixUnitaire,
      },
      fournisseur: {
        nom: alimentation.fournisseurNom,
        nif: alimentation.fournisseurNIF,
      },
      structure: {
        nom: alimentation.structure.name,
        abreviation: alimentation.structure.abreviation,
        ministere: alimentation.structure.ministere.name,
        miniAbreviation: alimentation.structure.ministere.abreviation,
      },
      documents: alimentation.documents.map(doc => ({
        id: doc.id,
        type: doc.type,
        nom: doc.nom,
        url: doc.url,
      })),
      observations: alimentation.observations,
      dateGeneration: new Date().toISOString(),
    });
  } catch (error) {
    console.error('❌ Erreur bon d\'entrée:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la génération du bon d\'entrée' },
      { status: 500 }
    );
  }
}
