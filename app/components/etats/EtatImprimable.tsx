'use client';

import { useRef } from 'react';
import { Printer, Download } from 'lucide-react';

interface EtatImprimableProps {
  titre: string;
  children: React.ReactNode;
  nomFichier?: string;
}

export default function EtatImprimable({ titre, children, nomFichier }: EtatImprimableProps) {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    window.print();
  };

  const handleExportPDF = () => {
    // Utiliser window.print() qui permettra de sauvegarder en PDF
    window.print();
  };

  return (
    <div>
      {/* Boutons d'action - cachés à l'impression */}
      <div className="no-print mb-4 flex gap-2 justify-end">
        <button
          onClick={handlePrint}
          className="btn btn-primary gap-2"
        >
          <Printer className="w-4 h-4" />
          Imprimer
        </button>
        <button
          onClick={handleExportPDF}
          className="btn btn-secondary gap-2"
        >
          <Download className="w-4 h-4" />
          Exporter PDF
        </button>
      </div>

      {/* Contenu imprimable */}
      <div ref={printRef} className="printable-content bg-white p-8">
        {children}
      </div>

      {/* Styles d'impression */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .printable-content,
          .printable-content * {
            visibility: visible;
          }
          .printable-content {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            background: white !important;
          }
          .no-print {
            display: none !important;
          }
          @page {
            size: A4;
            margin: 1cm;
          }
          .page-break {
            page-break-before: always;
          }
          table {
            border-collapse: collapse;
            width: 100%;
          }
          th, td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: left;
          }
          th {
            background-color: #f3f4f6 !important;
            font-weight: bold;
          }
        }
      `}</style>
    </div>
  );
}
