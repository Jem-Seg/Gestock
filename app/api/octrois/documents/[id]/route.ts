import { NextRequest, NextResponse } from 'next/server';
import { unlink, readFile } from 'fs/promises';
import path from 'path';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();

    try {
      // Récupérer le document
      const document = await prisma.documentOctroi.findUnique({
        where: { id },
      });

      if (!document) {
        return NextResponse.json({
          success: false,
          message: 'Document introuvable'
        }, { status: 404 });
      }

      // Lire le fichier depuis le système de fichiers
      const filePath = path.join(process.cwd(), 'public', document.url);
      try {
        const fileBuffer = await readFile(filePath);
        
        // Retourner le fichier avec les bons headers
        return new NextResponse(fileBuffer, {
          headers: {
            'Content-Type': document.mimeType,
            'Content-Disposition': `inline; filename="${document.nom}"`,
            'Cache-Control': 'public, max-age=31536000',
          },
        });
      } catch (error) {
        console.error('Erreur lors de la lecture du fichier:', error);
        return NextResponse.json({
          success: false,
          message: 'Fichier introuvable'
        }, { status: 404 });
      }
    } finally {
      await prisma.$disconnect();
    }
  } catch (error) {
    console.error('Erreur lors de la récupération du document:', error);
    return NextResponse.json({
      success: false,
      message: 'Erreur lors de la récupération du document'
    }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();

    try {
      // Récupérer le document
      const document = await prisma.documentOctroi.findUnique({
        where: { id },
      });

      if (!document) {
        return NextResponse.json({
          success: false,
          message: 'Document introuvable'
        }, { status: 404 });
      }

      // Supprimer le fichier physique
      const filePath = path.join(process.cwd(), 'public', document.url);
      try {
        await unlink(filePath);
      } catch (error) {
        console.error('Erreur lors de la suppression du fichier:', error);
        // Continuer même si le fichier n'existe pas
      }

      // Supprimer de la base de données
      await prisma.documentOctroi.delete({
        where: { id },
      });

      return NextResponse.json({
        success: true,
        message: 'Document supprimé avec succès'
      });
    } finally {
      await prisma.$disconnect();
    }
  } catch (error) {
    console.error('Erreur lors de la suppression:', error);
    return NextResponse.json({
      success: false,
      message: 'Erreur lors de la suppression du document'
    }, { status: 500 });
  }
}
