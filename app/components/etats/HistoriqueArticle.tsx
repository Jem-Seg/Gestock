'use client';

import { useState, useEffect } from 'react';
import EtatImprimable from './EtatImprimable';
import EnteteDocument from './EnteteDocument';
import PiedPage from './PiedPage';
import { TrendingUp, TrendingDown, Package } from 'lucide-react';

interface HistoriqueArticleProps {
  produitId: string;
  dateDebut?: string;
  dateFin?: string;
}

export default function HistoriqueArticle({ 
  produitId, 
  dateDebut, 
  dateFin 
}: HistoriqueArticleProps) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const params = new URLSearchParams();
        params.append('produitId', produitId);
        if (dateDebut) params.append('dateDebut', dateDebut);
        if (dateFin) params.append('dateFin', dateFin);

        const response = await fetch(`/api/etats/mouvements/historique-article?${params}`);
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
  }, [produitId, dateDebut, dateFin]);

  if (loading || !data) {
    return <div className="loading loading-spinner loading-lg"></div>;
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
    } else if (dateDebut) {
      return `À partir du ${formatDate(dateDebut)}`;
    } else if (dateFin) {
      return `Jusqu'au ${formatDate(dateFin)}`;
    }
    return 'Historique complet';
  };

  return (
    <EtatImprimable titre={`Historique - ${data.produit.nom}`}>
      <EnteteDocument
        titre="HISTORIQUE DES MOUVEMENTS PAR ARTICLE"
        sousTitre={getPeriodeLabel()}
        ministere={data.entete?.ministere}
        structure={data.entete?.structure}
      />

      {/* Informations produit */}
      <div className="mb-6 bg-gray-50 p-4 rounded border-2 border-gray-300">
        <div className="flex items-center gap-3 mb-3">
          <Package className="w-6 h-6 text-primary" />
          <h2 className="text-xl font-bold">{data.produit.nom}</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          <div>
            <span className="font-semibold">Catégorie:</span> {data.produit.categorie}
          </div>
          <div>
            <span className="font-semibold">Unité:</span> {data.produit.unite}
          </div>
          <div>
            <span className="font-semibold">Prix unitaire:</span> {data.produit.prixUnitaire?.toLocaleString('fr-FR') || '-'} MRU
          </div>
          <div>
            <span className="font-semibold">Stock actuel:</span> {data.statistiques.stockFinal}
          </div>
        </div>
        {data.produit.description && (
          <div className="mt-2 text-sm">
            <span className="font-semibold">Description:</span> {data.produit.description}
          </div>
        )}
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-green-50 p-4 rounded text-center border border-green-200">
          <div className="text-sm text-gray-600">Total Entrées</div>
          <div className="text-3xl font-bold text-green-600">
            {data.statistiques.totalEntrees}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {data.statistiques.nombreEntrees} mouvements
          </div>
        </div>
        <div className="bg-red-50 p-4 rounded text-center border border-red-200">
          <div className="text-sm text-gray-600">Total Sorties</div>
          <div className="text-3xl font-bold text-red-600">
            {data.statistiques.totalSorties}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {data.statistiques.nombreSorties} mouvements
          </div>
        </div>
        <div className="bg-blue-50 p-4 rounded text-center border border-blue-200">
          <div className="text-sm text-gray-600">Stock Initial</div>
          <div className="text-3xl font-bold text-blue-600">
            {data.statistiques.stockInitial}
          </div>
        </div>
        <div className="bg-purple-50 p-4 rounded text-center border border-purple-200">
          <div className="text-sm text-gray-600">Stock Final</div>
          <div className="text-3xl font-bold text-purple-600">
            {data.statistiques.stockFinal}
          </div>
        </div>
      </div>

      {/* Valeurs */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-teal-50 p-3 rounded border border-teal-200">
          <div className="text-sm text-gray-600">Valeur Totale Entrées</div>
          <div className="text-xl font-bold text-teal-600">
            {data.statistiques.valeurTotaleEntrees.toLocaleString('fr-FR')} MRU
          </div>
        </div>
        <div className="bg-rose-50 p-3 rounded border border-rose-200">
          <div className="text-sm text-gray-600">Valeur Totale Sorties</div>
          <div className="text-xl font-bold text-rose-600">
            {data.statistiques.valeurTotaleSorties.toLocaleString('fr-FR')} MRU
          </div>
        </div>
      </div>

      {/* Tableau historique */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-3">Détail des Mouvements</h2>
        <table className="w-full border-collapse border border-gray-300 text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 p-2">Date</th>
              <th className="border border-gray-300 p-2">Type</th>
              <th className="border border-gray-300 p-2">N°</th>
              <th className="border border-gray-300 p-2">Référence</th>
              <th className="border border-gray-300 p-2">Quantité</th>
              <th className="border border-gray-300 p-2">Prix Unit.</th>
              <th className="border border-gray-300 p-2">Valeur</th>
              <th className="border border-gray-300 p-2">Stock Avant</th>
              <th className="border border-gray-300 p-2">Stock Après</th>
            </tr>
          </thead>
          <tbody>
            {data.historique.length === 0 ? (
              <tr>
                <td colSpan={9} className="border border-gray-300 p-4 text-center text-gray-500">
                  Aucun mouvement enregistré pour cette période
                </td>
              </tr>
            ) : (
              data.historique.map((mvt: any, idx: number) => (
                <tr 
                  key={idx}
                  className={mvt.type === 'ENTREE' ? 'bg-green-50' : 'bg-red-50'}
                >
                  <td className="border border-gray-300 p-2">
                    {formatDate(mvt.date)}
                  </td>
                  <td className="border border-gray-300 p-2 text-center">
                    {mvt.type === 'ENTREE' ? (
                      <span className="badge badge-success gap-1">
                        <TrendingUp className="w-3 h-3" />
                        Entrée
                      </span>
                    ) : (
                      <span className="badge badge-error gap-1">
                        <TrendingDown className="w-3 h-3" />
                        Sortie
                      </span>
                    )}
                  </td>
                  <td className="border border-gray-300 p-2 font-mono text-xs">
                    {mvt.numero}
                  </td>
                  <td className="border border-gray-300 p-2 text-xs">
                    {mvt.reference}
                    {mvt.nif && <div className="text-gray-500">NIF: {mvt.nif}</div>}
                    {mvt.motif && <div className="text-gray-500">{mvt.motif}</div>}
                  </td>
                  <td className="border border-gray-300 p-2 text-right font-semibold">
                    {mvt.type === 'ENTREE' ? '+' : '-'}{mvt.quantite}
                  </td>
                  <td className="border border-gray-300 p-2 text-right">
                    {mvt.prixUnitaire.toLocaleString('fr-FR')}
                  </td>
                  <td className="border border-gray-300 p-2 text-right">
                    {mvt.valeur.toLocaleString('fr-FR')}
                  </td>
                  <td className="border border-gray-300 p-2 text-right bg-white">
                    {mvt.stockAvant}
                  </td>
                  <td className="border border-gray-300 p-2 text-right bg-white font-bold">
                    {mvt.stockApres}
                  </td>
                </tr>
              ))
            )}
          </tbody>
          <tfoot>
            <tr className="bg-gray-200 font-bold">
              <td colSpan={4} className="border border-gray-300 p-2">TOTAUX</td>
              <td className="border border-gray-300 p-2 text-right">
                <div className="text-green-600">+{data.statistiques.totalEntrees}</div>
                <div className="text-red-600">-{data.statistiques.totalSorties}</div>
              </td>
              <td className="border border-gray-300 p-2"></td>
              <td className="border border-gray-300 p-2 text-right">
                <div className="text-green-600">{data.statistiques.valeurTotaleEntrees.toLocaleString('fr-FR')}</div>
                <div className="text-red-600">{data.statistiques.valeurTotaleSorties.toLocaleString('fr-FR')}</div>
              </td>
              <td className="border border-gray-300 p-2 text-right">
                {data.statistiques.stockInitial}
              </td>
              <td className="border border-gray-300 p-2 text-right">
                {data.statistiques.stockFinal}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Résumé */}
      <div className="bg-blue-50 p-4 rounded border-2 border-blue-300 mb-6">
        <h3 className="font-semibold mb-2">Résumé</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
          <div>
            <span className="font-semibold">Variation nette:</span>{' '}
            <span className={data.statistiques.totalEntrees - data.statistiques.totalSorties >= 0 ? 'text-green-600' : 'text-red-600'}>
              {data.statistiques.totalEntrees - data.statistiques.totalSorties > 0 ? '+' : ''}
              {data.statistiques.totalEntrees - data.statistiques.totalSorties}
            </span>
          </div>
          <div>
            <span className="font-semibold">Total mouvements:</span> {data.statistiques.nombreEntrees + data.statistiques.nombreSorties}
          </div>
          <div>
            <span className="font-semibold">Taux de rotation:</span>{' '}
            {data.statistiques.stockInitial > 0 
              ? ((data.statistiques.totalSorties / data.statistiques.stockInitial) * 100).toFixed(1)
              : 0}%
          </div>
        </div>
      </div>

      <PiedPage dateGeneration={data.dateGeneration} />
    </EtatImprimable>
  );
}
