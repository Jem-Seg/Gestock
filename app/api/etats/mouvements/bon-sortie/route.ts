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
    const octroiId = searchParams.get('octroiId');

    if (!octroiId) {
      return NextResponse.json({ error: 'ID octroi requis' }, { status: 400 });
    }

    // Récupérer l'octroi avec tous ses détails
    const octroi = await prisma.octroi.findUnique({
      where: { id: octroiId },
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

    if (!octroi) {
      return NextResponse.json({ error: 'Octroi non trouvé' }, { status: 404 });
    }

    return NextResponse.json({
      entete: {
        ministere: octroi.structure.ministere.name,
        structure: octroi.structure.name,
      },
      bonSortie: {
        id: octroi.id,
        numero: octroi.numero,
        reference: octroi.reference,
        date: octroi.dateOctroi,
        dateValidation: octroi.updatedAt,
        statut: octroi.statut,
        isLocked: octroi.isLocked,
      },
      produit: {
        nom: octroi.produit.name,
        description: octroi.produit.description,
        categorie: octroi.produit.category.name,
        unite: octroi.produit.unit,
        prixUnitaire: octroi.produit.price,
      },
      quantite: {
        quantite: octroi.quantite,
        prixUnitaire: octroi.produit.price || 0,
        montantTotal: octroi.quantite * (octroi.produit.price || 0),
      },
      beneficiaire: {
        nom: octroi.beneficiaireNom,
        telephone: octroi.beneficiaireTelephone,
      },
      motif: octroi.motif,
      structure: {
        nom: octroi.structure.name,
        abreviation: octroi.structure.abreviation,
        ministere: octroi.structure.ministere.name,
        miniAbreviation: octroi.structure.ministere.abreviation,
      },
      documents: octroi.documents.map(doc => ({
        id: doc.id,
        type: doc.type,
        nom: doc.nom,
        url: doc.url,
      })),
      observations: octroi.observations,
      dateGeneration: new Date().toISOString(),
    });
  } catch (error) {
    console.error('❌ Erreur bon de sortie:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la génération du bon de sortie' },
      { status: 500 }
    );
  }
}
