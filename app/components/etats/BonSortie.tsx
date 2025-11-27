'use client';

import { useState, useEffect } from 'react';
import EtatImprimable from './EtatImprimable';
import EnteteDocument from './EnteteDocument';
import PiedPage from './PiedPage';

interface BonSortieProps {
  octroiId: string;
}

export default function BonSortie({ octroiId }: BonSortieProps) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`/api/etats/mouvements/bon-sortie?octroiId=${octroiId}`);
        if (!response.ok) throw new Error('Erreur de chargement');
        
        const result = await response.json();
        setData(result);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [octroiId]);

  if (loading || !data) {
    return <div className="loading loading-spinner"></div>;
  }

  return (
    <EtatImprimable titre="Bon de Sortie">
      <EnteteDocument
        titre="BON DE SORTIE"
        ministere={data.entete?.ministere || data.structure.ministere}
        structure={data.entete?.structure || data.structure.nom}
        sousTitre={`N° ${data.bonSortie.numero}`}
      />

      {/* Informations générales */}
      <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
        <div>
          <div className="font-semibold">Date d&apos;octroi:</div>
          <div>{new Date(data.bonSortie.date).toLocaleDateString('fr-FR')}</div>
        </div>
        <div>
          <div className="font-semibold">Référence:</div>
          <div>{data.bonSortie.reference || '-'}</div>
        </div>
      </div>

      {/* Bénéficiaire */}
      <div className="mb-6 border border-gray-300 p-4 rounded">
        <h3 className="font-semibold mb-2">Bénéficiaire</h3>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <span className="text-gray-600">Nom:</span> {data.beneficiaire.nom}
          </div>
          {data.beneficiaire.telephone && (
            <div>
              <span className="text-gray-600">Téléphone:</span> {data.beneficiaire.telephone}
            </div>
          )}
        </div>
        {data.motif && (
          <div className="mt-2">
            <span className="text-gray-600">Motif:</span> {data.motif}
          </div>
        )}
      </div>

      {/* Produit */}
      <div className="mb-6">
        <h3 className="font-semibold mb-3">Détails de la Sortie</h3>
        <table className="w-full border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 p-2">Désignation</th>
              <th className="border border-gray-300 p-2">Catégorie</th>
              <th className="border border-gray-300 p-2">Quantité</th>
              <th className="border border-gray-300 p-2">Prix Unitaire</th>
              <th className="border border-gray-300 p-2">Montant Total</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border border-gray-300 p-2">{data.produit.nom}</td>
              <td className="border border-gray-300 p-2">{data.produit.categorie}</td>
              <td className="border border-gray-300 p-2 text-right">
                {data.quantite.quantite} {data.produit.unite}
              </td>
              <td className="border border-gray-300 p-2 text-right">
                {data.quantite.prixUnitaire.toLocaleString('fr-FR')} MRU
              </td>
              <td className="border border-gray-300 p-2 text-right font-bold">
                {data.quantite.montantTotal.toLocaleString('fr-FR')} MRU
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Documents joints */}
      {data.documents && data.documents.length > 0 && (
        <div className="mb-6">
          <h3 className="font-semibold mb-2">Documents Joints</h3>
          <ul className="list-disc list-inside text-sm">
            {data.documents.map((doc: any) => (
              <li key={doc.id}>{doc.type}: {doc.nom}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Observations */}
      {data.observations && (
        <div className="mb-6">
          <h3 className="font-semibold mb-2">Observations</h3>
          <div className="text-sm bg-gray-50 p-3 rounded">
            {data.observations}
          </div>
        </div>
      )}

      {/* Signatures */}
      <div className="grid grid-cols-3 gap-4 mt-12 text-sm">
        <div className="text-center">
          <div className="mb-12 border-b border-gray-400 pb-1">Délivré par</div>
          <div className="text-xs text-gray-600">Nom et signature</div>
        </div>
        <div className="text-center">
          <div className="mb-12 border-b border-gray-400 pb-1">Reçu par</div>
          <div className="text-xs text-gray-600">Nom et signature</div>
        </div>
        <div className="text-center">
          <div className="mb-12 border-b border-gray-400 pb-1">Approuvé par</div>
          <div className="text-xs text-gray-600">Nom et signature</div>
        </div>
      </div>

      <PiedPage dateGeneration={data.dateGeneration} />
    </EtatImprimable>
  );
}
