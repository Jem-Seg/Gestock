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
    const dateDebut = searchParams.get('dateDebut');
    const dateFin = searchParams.get('dateFin');

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

    // Récupérer les alimentations de la structure
    const whereAlim: any = {
      structureId,
      statut: 'VALIDE_ORDONNATEUR',
    };
    if (Object.keys(dateFilter).length > 0) {
      whereAlim.createdAt = dateFilter;
    }

    const alimentations = await prisma.alimentation.findMany({
      where: whereAlim,
      include: {
        produit: {
          include: {
            category: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Récupérer les octrois de la structure
    const whereOctroi: any = {
      structureId,
      statut: 'VALIDE_ORDONNATEUR',
    };
    if (Object.keys(dateFilter).length > 0) {
      whereOctroi.createdAt = dateFilter;
    }

    const octrois = await prisma.octroi.findMany({
      where: whereOctroi,
      include: {
        produit: {
          include: {
            category: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Construire l'historique des mouvements
    const mouvements = [
      ...alimentations.map(a => ({
        id: a.id,
        type: 'ENTREE' as const,
        numero: a.numero,
        date: a.createdAt,
        produit: {
          id: a.produit.id,
          nom: a.produit.name,
          categorie: a.produit.category.name,
        },
        quantite: a.quantite,
        prixUnitaire: a.prixUnitaire,
        valeur: a.quantite * a.prixUnitaire,
        reference: a.fournisseurNom,
        nif: a.fournisseurNIF,
        statut: a.statut,
      })),
      ...octrois.map(o => ({
        id: o.id,
        type: 'SORTIE' as const,
        numero: o.numero,
        date: o.createdAt,
        produit: {
          id: o.produit.id,
          nom: o.produit.name,
          categorie: o.produit.category.name,
        },
        quantite: o.quantite,
        prixUnitaire: o.produit.price || 0,
        valeur: o.quantite * (o.produit.price || 0),
        reference: o.beneficiaireNom,
        telephone: o.beneficiaireTelephone,
        motif: o.motif,
        statut: o.statut,
      })),
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Statistiques globales
    const stats = {
      totalEntrees: alimentations.reduce((sum, a) => sum + a.quantite, 0),
      totalSorties: octrois.reduce((sum, o) => sum + o.quantite, 0),
      nombreEntrees: alimentations.length,
      nombreSorties: octrois.length,
      valeurTotaleEntrees: alimentations.reduce((sum, a) => sum + (a.quantite * a.prixUnitaire), 0),
      valeurTotaleSorties: octrois.reduce((sum, o) => sum + (o.quantite * (o.produit.price || 0)), 0),
    };

    // Grouper par produit
    const parProduit: Record<string, any> = {};
    
    alimentations.forEach(a => {
      const key = a.produit.id;
      if (!parProduit[key]) {
        parProduit[key] = {
          produitId: a.produit.id,
          produitNom: a.produit.name,
          categorie: a.produit.category.name,
          entrees: 0,
          sorties: 0,
          valeurEntrees: 0,
          valeurSorties: 0,
        };
      }
      parProduit[key].entrees += a.quantite;
      parProduit[key].valeurEntrees += a.quantite * a.prixUnitaire;
    });

    octrois.forEach(o => {
      const key = o.produit.id;
      if (!parProduit[key]) {
        parProduit[key] = {
          produitId: o.produit.id,
          produitNom: o.produit.name,
          categorie: o.produit.category.name,
          entrees: 0,
          sorties: 0,
          valeurEntrees: 0,
          valeurSorties: 0,
        };
      }
      parProduit[key].sorties += o.quantite;
      parProduit[key].valeurSorties += o.quantite * (o.produit.price || 0);
    });

    // Grouper par mois
    const parMois: Record<string, any> = {};
    
    mouvements.forEach(m => {
      const date = new Date(m.date);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!parMois[key]) {
        parMois[key] = {
          mois: key,
          entrees: 0,
          sorties: 0,
          valeurEntrees: 0,
          valeurSorties: 0,
        };
      }
      
      if (m.type === 'ENTREE') {
        parMois[key].entrees += m.quantite;
        parMois[key].valeurEntrees += m.valeur;
      } else {
        parMois[key].sorties += m.quantite;
        parMois[key].valeurSorties += m.valeur;
      }
    });

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
      mouvements,
      statistiques: stats,
      parProduit: Object.values(parProduit),
      parMois: Object.values(parMois).sort((a: any, b: any) => b.mois.localeCompare(a.mois)),
      filtres: {
        dateDebut: dateDebut || null,
        dateFin: dateFin || null,
      },
      dateGeneration: new Date().toISOString(),
    });
  } catch (error) {
    console.error('❌ Erreur historique par structure:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la génération de l\'historique' },
      { status: 500 }
    );
  }
}
