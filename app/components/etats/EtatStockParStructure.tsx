'use client';

import { useState, useEffect } from 'react';
import EtatImprimable from './EtatImprimable';
import EnteteDocument from './EnteteDocument';
import PiedPage from './PiedPage';
import { AlertTriangle, XCircle } from 'lucide-react';

interface EtatStockParStructureProps {
  structureId: string;
}

export default function EtatStockParStructure({ structureId }: EtatStockParStructureProps) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`/api/etats/stock/par-structure?structureId=${structureId}`);
        if (!response.ok) throw new Error('Erreur de chargement');
        
        const result = await response.json();
        setData(result);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [structureId]);

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="alert alert-error">
        <XCircle className="w-6 h-6" />
        <span>Erreur: {error || 'Données non disponibles'}</span>
      </div>
    );
  }

  return (
    <EtatImprimable titre={`État du Stock - ${data.structure.nom}`}>
      <EnteteDocument
        titre={`ÉTAT DU STOCK PAR STRUCTURE`}
        sousTitre={`${data.structure.nom} - Au ${new Date().toLocaleDateString('fr-FR')}`}
        ministere={data.entete?.ministere}
        structure={data.entete?.structure}
      />

      {/* Informations structure */}
      <div className="mb-6 bg-gray-50 p-4 rounded">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-semibold">Structure:</span> {data.structure.nom}
          </div>
          <div>
            <span className="font-semibold">Ministère:</span> {data.structure.ministere}
          </div>
          <div>
            <span className="font-semibold">Abréviation:</span> {data.structure.abreviation || '-'}
          </div>
        </div>
      </div>

      {/* Statistiques globales */}
      <div className="mb-6 grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-blue-50 p-4 rounded">
          <div className="text-sm text-gray-600">Total Articles</div>
          <div className="text-2xl font-bold text-blue-600">
            {data.statistiques.totalArticles}
          </div>
        </div>
        <div className="bg-green-50 p-4 rounded">
          <div className="text-sm text-gray-600">Quantité Totale</div>
          <div className="text-2xl font-bold text-green-600">
            {data.statistiques.totalQuantite}
          </div>
        </div>
        <div className="bg-purple-50 p-4 rounded">
          <div className="text-sm text-gray-600">Valeur Stock</div>
          <div className="text-lg font-bold text-purple-600">
            {data.statistiques.valeurTotale.toLocaleString('fr-FR')} MRU
          </div>
        </div>
        <div className="bg-orange-50 p-4 rounded">
          <div className="text-sm text-gray-600">En Alerte</div>
          <div className="text-2xl font-bold text-orange-600">
            {data.statistiques.articlesAlerte}
          </div>
        </div>
        <div className="bg-red-50 p-4 rounded">
          <div className="text-sm text-gray-600">Épuisés</div>
          <div className="text-2xl font-bold text-red-600">
            {data.statistiques.articlesEpuises}
          </div>
        </div>
      </div>

      {/* Statistiques mouvements */}
      <div className="mb-6 grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-teal-50 p-4 rounded">
          <div className="text-sm text-gray-600">Total Entrées</div>
          <div className="text-2xl font-bold text-teal-600">
            {data.statistiques.totalEntrees}
          </div>
          <div className="text-xs text-gray-500">
            {data.statistiques.nombreAlimentations} alimentations
          </div>
        </div>
        <div className="bg-rose-50 p-4 rounded">
          <div className="text-sm text-gray-600">Total Sorties</div>
          <div className="text-2xl font-bold text-rose-600">
            {data.statistiques.totalSorties}
          </div>
          <div className="text-xs text-gray-500">
            {data.statistiques.nombreOctrois} octrois
          </div>
        </div>
      </div>

      {/* Tableau par catégorie */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-3">Résumé par Catégorie</h2>
        <table className="w-full border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 p-2">Catégorie</th>
              <th className="border border-gray-300 p-2">Articles</th>
              <th className="border border-gray-300 p-2">Quantité</th>
              <th className="border border-gray-300 p-2">Valeur (MRU)</th>
              <th className="border border-gray-300 p-2">Alertes</th>
              <th className="border border-gray-300 p-2">Épuisés</th>
            </tr>
          </thead>
          <tbody>
            {data.parCategorie.map((cat: any, idx: number) => (
              <tr key={idx}>
                <td className="border border-gray-300 p-2">{cat.nom}</td>
                <td className="border border-gray-300 p-2 text-center">{cat.articles}</td>
                <td className="border border-gray-300 p-2 text-right">{cat.quantite}</td>
                <td className="border border-gray-300 p-2 text-right">
                  {cat.valeur.toLocaleString('fr-FR')}
                </td>
                <td className="border border-gray-300 p-2 text-center">
                  {cat.produitsAlerte > 0 && (
                    <span className="badge badge-warning badge-sm">{cat.produitsAlerte}</span>
                  )}
                </td>
                <td className="border border-gray-300 p-2 text-center">
                  {cat.produitsEpuises > 0 && (
                    <span className="badge badge-error badge-sm">{cat.produitsEpuises}</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-gray-50 font-bold">
              <td className="border border-gray-300 p-2">TOTAL</td>
              <td className="border border-gray-300 p-2 text-center">
                {data.statistiques.totalArticles}
              </td>
              <td className="border border-gray-300 p-2 text-right">
                {data.statistiques.totalQuantite}
              </td>
              <td className="border border-gray-300 p-2 text-right">
                {data.statistiques.valeurTotale.toLocaleString('fr-FR')}
              </td>
              <td className="border border-gray-300 p-2 text-center">
                {data.statistiques.articlesAlerte}
              </td>
              <td className="border border-gray-300 p-2 text-center">
                {data.statistiques.articlesEpuises}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Liste détaillée des produits */}
      <div className="mb-6 page-break">
        <h2 className="text-lg font-semibold mb-3">Détail des Articles</h2>
        <table className="w-full border-collapse border border-gray-300 text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 p-2">Article</th>
              <th className="border border-gray-300 p-2">Catégorie</th>
              <th className="border border-gray-300 p-2">Quantité</th>
              <th className="border border-gray-300 p-2">Qté Init.</th>
              <th className="border border-gray-300 p-2">Unité</th>
              <th className="border border-gray-300 p-2">Prix Unit.</th>
              <th className="border border-gray-300 p-2">Valeur</th>
              <th className="border border-gray-300 p-2">Statut</th>
            </tr>
          </thead>
          <tbody>
            {data.produits.map((produit: any) => (
              <tr key={produit.id} className={produit.epuise ? 'bg-red-50' : produit.enAlerte ? 'bg-orange-50' : ''}>
                <td className="border border-gray-300 p-2">{produit.nom}</td>
                <td className="border border-gray-300 p-2">{produit.categorie}</td>
                <td className="border border-gray-300 p-2 text-right">
                  {produit.quantite}
                  {produit.enAlerte && <AlertTriangle className="inline w-4 h-4 ml-1 text-orange-600" />}
                  {produit.epuise && <XCircle className="inline w-4 h-4 ml-1 text-red-600" />}
                </td>
                <td className="border border-gray-300 p-2 text-right">
                  {produit.quantiteInitiale}
                </td>
                <td className="border border-gray-300 p-2">{produit.unite}</td>
                <td className="border border-gray-300 p-2 text-right">
                  {produit.prixUnitaire?.toLocaleString('fr-FR') || '-'}
                </td>
                <td className="border border-gray-300 p-2 text-right">
                  {produit.valeurStock.toLocaleString('fr-FR')}
                </td>
                <td className="border border-gray-300 p-2 text-center">
                  {produit.epuise ? (
                    <span className="badge badge-error badge-sm">Épuisé</span>
                  ) : produit.enAlerte ? (
                    <span className="badge badge-warning badge-sm">Alerte</span>
                  ) : (
                    <span className="badge badge-success badge-sm">Normal</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <PiedPage dateGeneration={data.dateGeneration} />
    </EtatImprimable>
  );
}
