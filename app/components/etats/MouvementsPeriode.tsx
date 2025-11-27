'use client';

import { useState, useEffect } from 'react';
import EtatImprimable from './EtatImprimable';
import EnteteDocument from './EnteteDocument';
import PiedPage from './PiedPage';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface MouvementsPeriodeProps {
  structureId?: string;
  ministereId?: string;
  dateDebut?: string;
  dateFin?: string;
  type?: 'tous' | 'entree' | 'sortie';
}

export default function MouvementsPeriode({ 
  structureId, 
  ministereId, 
  dateDebut, 
  dateFin, 
  type = 'tous' 
}: MouvementsPeriodeProps) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const params = new URLSearchParams();
        if (structureId) params.append('structureId', structureId);
        if (ministereId) params.append('ministereId', ministereId);
        if (dateDebut) params.append('dateDebut', dateDebut);
        if (dateFin) params.append('dateFin', dateFin);
        if (type) params.append('type', type);

        const response = await fetch(`/api/etats/mouvements/periode?${params}`);
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
  }, [structureId, ministereId, dateDebut, dateFin, type]);

  if (loading || !data) {
    return <div className="loading loading-spinner"></div>;
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const getPeriodeLabel = () => {
    if (dateDebut && dateFin) {
      return `Du ${formatDate(dateDebut)} au ${formatDate(dateFin)}`;
    }
    if (dateDebut) {
      return `À partir du ${formatDate(dateDebut)}`;
    }
    if (dateFin) {
      return `Jusqu'au ${formatDate(dateFin)}`;
    }
    return 'Tous les mouvements';
  };

  return (
    <EtatImprimable titre="Mouvements de Stock">
      <EnteteDocument
        titre="ÉTAT DES MOUVEMENTS DE STOCK"
        sousTitre={getPeriodeLabel()}
        ministere={data.entete?.ministere}
        structure={data.entete?.structure}
      />

      {/* Statistiques */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-green-50 p-4 rounded text-center">
          <div className="text-sm text-gray-600">Entrées</div>
          <div className="text-2xl font-bold text-green-600">
            {data.statistiques.totalEntrees}
          </div>
          <div className="text-xs text-gray-500">
            Qté: {data.statistiques.quantiteEntree}
          </div>
        </div>
        <div className="bg-red-50 p-4 rounded text-center">
          <div className="text-sm text-gray-600">Sorties</div>
          <div className="text-2xl font-bold text-red-600">
            {data.statistiques.totalSorties}
          </div>
          <div className="text-xs text-gray-500">
            Qté: {data.statistiques.quantiteSortie}
          </div>
        </div>
        <div className="bg-blue-50 p-4 rounded text-center">
          <div className="text-sm text-gray-600">Valeur Entrées</div>
          <div className="text-xl font-bold text-blue-600">
            {data.statistiques.valeurEntree.toLocaleString('fr-FR')}
          </div>
          <div className="text-xs text-gray-500">MRU</div>
        </div>
        <div className="bg-orange-50 p-4 rounded text-center">
          <div className="text-sm text-gray-600">Valeur Sorties</div>
          <div className="text-xl font-bold text-orange-600">
            {data.statistiques.valeurSortie.toLocaleString('fr-FR')}
          </div>
          <div className="text-xs text-gray-500">MRU</div>
        </div>
      </div>

      {/* Mouvements par période */}
      {data.parPeriode && data.parPeriode.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-3">Synthèse par Période</h2>
          <table className="w-full border-collapse border border-gray-300">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 p-2">Période</th>
                <th className="border border-gray-300 p-2">Entrées</th>
                <th className="border border-gray-300 p-2">Sorties</th>
                <th className="border border-gray-300 p-2">Valeur Entrées</th>
                <th className="border border-gray-300 p-2">Valeur Sorties</th>
                <th className="border border-gray-300 p-2">Solde</th>
              </tr>
            </thead>
            <tbody>
              {data.parPeriode.map((periode: any, idx: number) => (
                <tr key={idx}>
                  <td className="border border-gray-300 p-2">{periode.periode}</td>
                  <td className="border border-gray-300 p-2 text-right text-green-600">
                    +{periode.entrees}
                  </td>
                  <td className="border border-gray-300 p-2 text-right text-red-600">
                    -{periode.sorties}
                  </td>
                  <td className="border border-gray-300 p-2 text-right">
                    {periode.valeurEntrees.toLocaleString('fr-FR')}
                  </td>
                  <td className="border border-gray-300 p-2 text-right">
                    {periode.valeurSorties.toLocaleString('fr-FR')}
                  </td>
                  <td className="border border-gray-300 p-2 text-right font-bold">
                    {(periode.entrees - periode.sorties).toLocaleString('fr-FR')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Détail des mouvements */}
      <div className="page-break"></div>
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-3">Détail des Mouvements</h2>
        <table className="w-full border-collapse border border-gray-300 text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 p-2">Date</th>
              <th className="border border-gray-300 p-2">Type</th>
              <th className="border border-gray-300 p-2">N°</th>
              <th className="border border-gray-300 p-2">Produit</th>
              <th className="border border-gray-300 p-2">Qté</th>
              <th className="border border-gray-300 p-2">P.U.</th>
              <th className="border border-gray-300 p-2">Valeur</th>
              <th className="border border-gray-300 p-2">Référence</th>
            </tr>
          </thead>
          <tbody>
            {data.mouvements.map((mvt: any) => (
              <tr 
                key={mvt.id}
                className={mvt.type === 'ENTREE' ? 'bg-green-50' : 'bg-red-50'}
              >
                <td className="border border-gray-300 p-2">
                  {formatDate(mvt.date)}
                </td>
                <td className="border border-gray-300 p-2">
                  <div className="flex items-center gap-1">
                    {mvt.type === 'ENTREE' ? (
                      <>
                        <TrendingUp className="w-4 h-4 text-green-600" />
                        <span className="text-green-600">Entrée</span>
                      </>
                    ) : (
                      <>
                        <TrendingDown className="w-4 h-4 text-red-600" />
                        <span className="text-red-600">Sortie</span>
                      </>
                    )}
                  </div>
                </td>
                <td className="border border-gray-300 p-2 text-xs">{mvt.numero}</td>
                <td className="border border-gray-300 p-2">{mvt.produit.nom}</td>
                <td className="border border-gray-300 p-2 text-right font-bold">
                  {mvt.type === 'ENTREE' ? '+' : '-'}{mvt.quantite}
                </td>
                <td className="border border-gray-300 p-2 text-right">
                  {mvt.prixUnitaire.toLocaleString('fr-FR')}
                </td>
                <td className="border border-gray-300 p-2 text-right">
                  {mvt.valeur.toLocaleString('fr-FR')}
                </td>
                <td className="border border-gray-300 p-2 text-xs">{mvt.reference}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <PiedPage dateGeneration={data.dateGeneration} />
    </EtatImprimable>
  );
}
