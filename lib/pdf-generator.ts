import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { StructureStatistics } from '@/type';

interface ReportConfig {
  structureName: string;
  ministereName: string;
  startDate: string;
  endDate: string;
}

export class PDFReportGenerator {
  private doc: jsPDF;
  private pageWidth: number;
  private pageHeight: number;
  private margin: number = 20;

  constructor() {
    this.doc = new jsPDF();
    this.pageWidth = this.doc.internal.pageSize.getWidth();
    this.pageHeight = this.doc.internal.pageSize.getHeight();
  }

  private addHeader(title: string, config: ReportConfig) {
    // Logo/En-tête République Islamique de Mauritanie
    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('République Islamique de Mauritanie', this.pageWidth / 2, 15, { align: 'center' });
    
    this.doc.setFontSize(8);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text('Honneur - Fraternité - Justice', this.pageWidth / 2, 20, { align: 'center' });
    
    // Ligne de séparation
    this.doc.setLineWidth(0.5);
    this.doc.line(this.margin, 25, this.pageWidth - this.margin, 25);
    
    // Titre du rapport
    this.doc.setFontSize(16);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(title, this.pageWidth / 2, 35, { align: 'center' });
    
    // Informations structure et période
    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text(`Structure: ${config.structureName}`, this.margin, 45);
    this.doc.text(`Ministère: ${config.ministereName}`, this.margin, 50);
    this.doc.text(`Période: ${new Date(config.startDate).toLocaleDateString('fr-FR')} au ${new Date(config.endDate).toLocaleDateString('fr-FR')}`, this.margin, 55);
    
    return 65; // Position Y après l'en-tête
  }

  private addFooter() {
    const pageCount = this.doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      this.doc.setPage(i);
      this.doc.setFontSize(8);
      this.doc.setFont('helvetica', 'italic');
      this.doc.text(
        `Page ${i} sur ${pageCount} - Généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}`,
        this.pageWidth / 2,
        this.pageHeight - 10,
        { align: 'center' }
      );
    }
  }

  generateAlimentationsReport(statistics: StructureStatistics, config: ReportConfig): void {
    let yPos = this.addHeader('RAPPORT DES ALIMENTATIONS', config);
    
    // Vue d'ensemble
    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('Vue d\'ensemble', this.margin, yPos);
    yPos += 10;
    
    autoTable(this.doc, {
      startY: yPos,
      head: [['Indicateur', 'Valeur']],
      body: [
        ['Nombre total d\'alimentations', statistics.overview.totalAlimentations.toString()],
        ['Quantité totale', `${statistics.overview.quantiteTotaleAlimentations} unités`],
        ['Valeur totale', `${statistics.overview.valeurTotaleAlimentationsMRU.toFixed(2)} MRU`],
        ['Alimentations validées', statistics.overview.alimentationsValidees.toString()],
        ['En attente', statistics.overview.alimentationsEnAttente.toString()],
        ['Rejetées', statistics.overview.alimentationsRejetees.toString()],
      ],
      theme: 'grid',
      headStyles: { fillColor: [121, 50, 5] },
      margin: { left: this.margin, right: this.margin },
    });
    
    yPos = (this.doc as any).lastAutoTable.finalY + 15;
    
    // Détails par produit
    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('Détails par produit', this.margin, yPos);
    yPos += 10;
    
    const produitsData = statistics.parProduit
      .filter(p => p.alimentations.count > 0)
      .map(p => [
        p.produitName,
        p.categoryName,
        p.alimentations.count.toString(),
        `${p.alimentations.quantiteTotale} ${p.produitUnit}`,
        `${p.alimentations.valeurTotaleMRU.toFixed(2)} MRU`,
        p.alimentations.prixMoyenUnitaire ? `${p.alimentations.prixMoyenUnitaire.toFixed(2)} MRU` : 'N/A',
      ]);
    
    autoTable(this.doc, {
      startY: yPos,
      head: [['Produit', 'Catégorie', 'Nb', 'Quantité', 'Valeur Totale', 'Prix Moyen']],
      body: produitsData,
      theme: 'striped',
      headStyles: { fillColor: [121, 50, 5] },
      margin: { left: this.margin, right: this.margin },
      styles: { fontSize: 8 },
    });
    
    // Top 5 produits
    if (statistics.topProduits.plusAlimentes.length > 0) {
      const newPage = (this.doc as any).lastAutoTable.finalY > this.pageHeight - 80;
      if (newPage) this.doc.addPage();
      
      yPos = newPage ? 20 : (this.doc as any).lastAutoTable.finalY + 15;
      
      this.doc.setFontSize(12);
      this.doc.setFont('helvetica', 'bold');
      this.doc.text('Top 5 produits les plus alimentés', this.margin, yPos);
      yPos += 10;
      
      const topData = statistics.topProduits.plusAlimentes.slice(0, 5).map((p, idx) => [
        (idx + 1).toString(),
        p.produitName,
        `${p.alimentations.quantiteTotale} ${p.produitUnit}`,
        `${p.alimentations.valeurTotaleMRU.toFixed(2)} MRU`,
      ]);
      
      autoTable(this.doc, {
        startY: yPos,
        head: [['#', 'Produit', 'Quantité', 'Valeur']],
        body: topData,
        theme: 'grid',
        headStyles: { fillColor: [34, 139, 34] },
        margin: { left: this.margin, right: this.margin },
      });
    }
    
    this.addFooter();
  }

  generateOctroisReport(statistics: StructureStatistics, config: ReportConfig): void {
    let yPos = this.addHeader('RAPPORT DES OCTROIS', config);
    
    // Vue d'ensemble
    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('Vue d\'ensemble', this.margin, yPos);
    yPos += 10;
    
    autoTable(this.doc, {
      startY: yPos,
      head: [['Indicateur', 'Valeur']],
      body: [
        ['Nombre total d\'octrois', statistics.overview.totalOctrois.toString()],
        ['Quantité totale', `${statistics.overview.quantiteTotaleOctrois} unités`],
        ['Valeur totale estimée', `${statistics.overview.valeurTotaleOctroisMRU.toFixed(2)} MRU`],
        ['Octrois validés', statistics.overview.octroiValides.toString()],
        ['En attente', statistics.overview.octroiEnAttente.toString()],
        ['Rejetés', statistics.overview.octroiRejetes.toString()],
      ],
      theme: 'grid',
      headStyles: { fillColor: [121, 50, 5] },
      margin: { left: this.margin, right: this.margin },
    });
    
    yPos = (this.doc as any).lastAutoTable.finalY + 15;
    
    // Détails par produit
    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('Détails par produit', this.margin, yPos);
    yPos += 10;
    
    const produitsData = statistics.parProduit
      .filter(p => p.octrois.count > 0)
      .map(p => [
        p.produitName,
        p.categoryName,
        p.octrois.count.toString(),
        `${p.octrois.quantiteTotale} ${p.produitUnit}`,
        `${p.octrois.valeurTotaleMRU.toFixed(2)} MRU`,
        `${p.stock.actuel} ${p.produitUnit}`,
      ]);
    
    autoTable(this.doc, {
      startY: yPos,
      head: [['Produit', 'Catégorie', 'Nb', 'Quantité', 'Valeur Totale', 'Stock Actuel']],
      body: produitsData,
      theme: 'striped',
      headStyles: { fillColor: [121, 50, 5] },
      margin: { left: this.margin, right: this.margin },
      styles: { fontSize: 8 },
    });
    
    // Top 5 produits
    if (statistics.topProduits.plusOctroyes.length > 0) {
      const newPage = (this.doc as any).lastAutoTable.finalY > this.pageHeight - 80;
      if (newPage) this.doc.addPage();
      
      yPos = newPage ? 20 : (this.doc as any).lastAutoTable.finalY + 15;
      
      this.doc.setFontSize(12);
      this.doc.setFont('helvetica', 'bold');
      this.doc.text('Top 5 produits les plus octroyés', this.margin, yPos);
      yPos += 10;
      
      const topData = statistics.topProduits.plusOctroyes.slice(0, 5).map((p, idx) => [
        (idx + 1).toString(),
        p.produitName,
        `${p.octrois.quantiteTotale} ${p.produitUnit}`,
        `${p.octrois.valeurTotaleMRU.toFixed(2)} MRU`,
      ]);
      
      autoTable(this.doc, {
        startY: yPos,
        head: [['#', 'Produit', 'Quantité', 'Valeur']],
        body: topData,
        theme: 'grid',
        headStyles: { fillColor: [255, 140, 0] },
        margin: { left: this.margin, right: this.margin },
      });
    }
    
    this.addFooter();
  }

  generateGlobalReport(statistics: StructureStatistics, config: ReportConfig): void {
    let yPos = this.addHeader('RAPPORT GLOBAL DE GESTION DES STOCKS', config);
    
    // Section 1: Synthèse générale
    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('1. Synthèse Générale', this.margin, yPos);
    yPos += 10;
    
    autoTable(this.doc, {
      startY: yPos,
      head: [['Type', 'Nombre', 'Quantité', 'Valeur (MRU)']],
      body: [
        [
          'Alimentations',
          statistics.overview.totalAlimentations.toString(),
          `${statistics.overview.quantiteTotaleAlimentations} unités`,
          statistics.overview.valeurTotaleAlimentationsMRU.toFixed(2),
        ],
        [
          'Octrois',
          statistics.overview.totalOctrois.toString(),
          `${statistics.overview.quantiteTotaleOctrois} unités`,
          statistics.overview.valeurTotaleOctroisMRU.toFixed(2),
        ],
      ],
      theme: 'grid',
      headStyles: { fillColor: [121, 50, 5] },
      margin: { left: this.margin, right: this.margin },
    });
    
    yPos = (this.doc as any).lastAutoTable.finalY + 15;
    
    // Section 2: Statuts workflow
    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('2. État des Validations', this.margin, yPos);
    yPos += 10;
    
    autoTable(this.doc, {
      startY: yPos,
      head: [['Statut', 'Alimentations', 'Octrois']],
      body: [
        ['Validées', statistics.overview.alimentationsValidees.toString(), statistics.overview.octroiValides.toString()],
        ['En attente', statistics.overview.alimentationsEnAttente.toString(), statistics.overview.octroiEnAttente.toString()],
        ['Rejetées', statistics.overview.alimentationsRejetees.toString(), statistics.overview.octroiRejetes.toString()],
      ],
      theme: 'striped',
      headStyles: { fillColor: [121, 50, 5] },
      margin: { left: this.margin, right: this.margin },
    });
    
    yPos = (this.doc as any).lastAutoTable.finalY + 15;
    
    // Section 3: État des stocks
    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('3. État des Stocks par Produit', this.margin, yPos);
    yPos += 10;
    
    const stockData = statistics.parProduit.map(p => [
      p.produitName,
      p.categoryName,
      `${p.stock.actuel} ${p.produitUnit}`,
      `${p.stock.tauxUtilisation.toFixed(1)}%`,
      p.stock.tauxRotation.toFixed(2),
    ]);
    
    autoTable(this.doc, {
      startY: yPos,
      head: [['Produit', 'Catégorie', 'Stock Actuel', 'Taux Utilisation', 'Taux Rotation']],
      body: stockData,
      theme: 'grid',
      headStyles: { fillColor: [121, 50, 5] },
      margin: { left: this.margin, right: this.margin },
      styles: { fontSize: 8 },
    });
    
    // Nouvelle page pour les tops
    this.doc.addPage();
    yPos = 20;
    
    // Section 4: Top produits
    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('4. Classement des Produits', this.margin, yPos);
    yPos += 15;
    
    // Top alimentés
    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('Top 5 Produits Alimentés', this.margin, yPos);
    yPos += 7;
    
    if (statistics.topProduits.plusAlimentes.length > 0) {
      const topAlimData = statistics.topProduits.plusAlimentes.slice(0, 5).map((p, idx) => [
        (idx + 1).toString(),
        p.produitName,
        `${p.alimentations.quantiteTotale} ${p.produitUnit}`,
        `${p.alimentations.valeurTotaleMRU.toFixed(2)} MRU`,
      ]);
      
      autoTable(this.doc, {
        startY: yPos,
        head: [['#', 'Produit', 'Quantité', 'Valeur']],
        body: topAlimData,
        theme: 'grid',
        headStyles: { fillColor: [34, 139, 34] },
        margin: { left: this.margin, right: this.margin },
      });
      
      yPos = (this.doc as any).lastAutoTable.finalY + 15;
    }
    
    // Top octroyés
    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('Top 5 Produits Octroyés', this.margin, yPos);
    yPos += 7;
    
    if (statistics.topProduits.plusOctroyes.length > 0) {
      const topOctData = statistics.topProduits.plusOctroyes.slice(0, 5).map((p, idx) => [
        (idx + 1).toString(),
        p.produitName,
        `${p.octrois.quantiteTotale} ${p.produitUnit}`,
        `${p.octrois.valeurTotaleMRU.toFixed(2)} MRU`,
      ]);
      
      autoTable(this.doc, {
        startY: yPos,
        head: [['#', 'Produit', 'Quantité', 'Valeur']],
        body: topOctData,
        theme: 'grid',
        headStyles: { fillColor: [255, 140, 0] },
        margin: { left: this.margin, right: this.margin },
      });
    }
    
    this.addFooter();
  }

  save(filename: string): void {
    this.doc.save(filename);
  }

  getBlob(): Blob {
    return this.doc.output('blob');
  }
}
