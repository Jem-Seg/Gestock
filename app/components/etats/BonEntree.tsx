'use client';

import { useState, useEffect } from 'react';
import EtatImprimable from './EtatImprimable';
import EnteteDocument from './EnteteDocument';
import PiedPage from './PiedPage';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface BonEntreeProps {
  alimentationId: string;
}

export default function BonEntree({ alimentationId }: BonEntreeProps) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`/api/etats/mouvements/bon-entree?alimentationId=${alimentationId}`);
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
  }, [alimentationId]);

  if (loading || !data) {
    return <div className="loading loading-spinner"></div>;
  }

  return (
    <EtatImprimable titre="Bon d'Entrée">
      <EnteteDocument
        titre="BON D'ENTRÉE"
        ministere={data.entete?.ministere || data.structure.ministere}
        structure={data.entete?.structure || data.structure.nom}
        sousTitre={`N° ${data.bonEntree.numero}`}
      />

      {/* Informations générales */}
      <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
        <div>
          <div className="font-semibold">Date de réception:</div>
          <div>{new Date(data.bonEntree.date).toLocaleDateString('fr-FR')}</div>
        </div>
        <div>
          <div className="font-semibold">Statut:</div>
          <div>
            <span className={`badge ${
              data.bonEntree.statut === 'VALIDE_ORDONNATEUR' ? 'badge-success' : 'badge-warning'
            }`}>
              {data.bonEntree.statut}
            </span>
          </div>
        </div>
      </div>

      {/* Fournisseur */}
      <div className="mb-6 border border-gray-300 p-4 rounded">
        <h3 className="font-semibold mb-2">Fournisseur</h3>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <span className="text-gray-600">Nom:</span> {data.fournisseur.nom}
          </div>
          {data.fournisseur.nif && (
            <div>
              <span className="text-gray-600">NIF:</span> {data.fournisseur.nif}
            </div>
          )}
        </div>
      </div>

      {/* Produit */}
      <div className="mb-6">
        <h3 className="font-semibold mb-3">Détails de la Réception</h3>
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
                {data.quantite.prixUnitaire.toLocaleString('fr-FR')} FCFA
              </td>
              <td className="border border-gray-300 p-2 text-right font-bold">
                {data.quantite.montantTotal.toLocaleString('fr-FR')} FCFA
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
          <div className="mb-12 border-b border-gray-400 pb-1">Réceptionné par</div>
          <div className="text-xs text-gray-600">Nom et signature</div>
        </div>
        <div className="text-center">
          <div className="mb-12 border-b border-gray-400 pb-1">Vérifié par</div>
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
