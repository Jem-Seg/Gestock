'use client';

import { useState, useEffect } from 'react';
import EtatImprimable from './EtatImprimable';
import EnteteDocument from './EnteteDocument';
import PiedPage from './PiedPage';
import { AlertTriangle, XCircle } from 'lucide-react';

interface EtatAlertesProps {
  structureId?: string;
  ministereId?: string;
  type?: 'tous' | 'alerte' | 'epuise';
}

export default function EtatAlertes({ structureId, ministereId, type = 'tous' }: EtatAlertesProps) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const params = new URLSearchParams();
        if (structureId) params.append('structureId', structureId);
        if (ministereId) params.append('ministereId', ministereId);
        if (type) params.append('type', type);

        const response = await fetch(`/api/etats/stock/alertes?${params}`);
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
  }, [structureId, ministereId, type]);

  if (loading || !data) {
    return <div className="loading loading-spinner"></div>;
  }

  const getCriticiteBadge = (statut: string) => {
    if (statut === 'EPUISE') return <span className="badge badge-error">ÉPUISÉ</span>;
    if (statut === 'CRITIQUE') return <span className="badge badge-warning">CRITIQUE</span>;
    return <span className="badge badge-info">ATTENTION</span>;
  };

  return (
    <EtatImprimable titre="État des Alertes de Stock">
      <EnteteDocument
        titre="ÉTAT DES ALERTES DE STOCK"
        sousTitre={`Articles nécessitant une attention - ${new Date().toLocaleDateString('fr-FR')}`}
        ministere={data.entete?.ministere}
        structure={data.entete?.structure}
      />

      {/* Statistiques */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-red-50 p-4 rounded text-center">
          <div className="text-3xl font-bold text-red-600">
            {data.statistiques.produitsEpuises}
          </div>
          <div className="text-sm text-gray-600">Produits Épuisés</div>
        </div>
        <div className="bg-orange-50 p-4 rounded text-center">
          <div className="text-3xl font-bold text-orange-600">
            {data.statistiques.produitsEnAlerte}
          </div>
          <div className="text-sm text-gray-600">En Alerte</div>
        </div>
        <div className="bg-blue-50 p-4 rounded text-center">
          <div className="text-3xl font-bold text-blue-600">
            {data.statistiques.valeurStockAlerte.toLocaleString('fr-FR')} MRU
          </div>
          <div className="text-sm text-gray-600">Valeur Stock Alerte</div>
        </div>
      </div>

      {/* Produits critiques (épuisés) */}
      {data.parCriticite.critique.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-3 text-red-600 flex items-center gap-2">
            <XCircle className="w-5 h-5" />
            Produits Épuisés ({data.parCriticite.critique.length})
          </h2>
          <table className="w-full border-collapse border border-gray-300 text-sm">
            <thead>
              <tr className="bg-red-100">
                <th className="border border-gray-300 p-2">Article</th>
                <th className="border border-gray-300 p-2">Catégorie</th>
                <th className="border border-gray-300 p-2">Structure</th>
              </tr>
            </thead>
            <tbody>
              {data.parCriticite.critique.map((p: any, idx: number) => (
                <tr key={idx} className="bg-red-50">
                  <td className="border border-gray-300 p-2">{p.nom}</td>
                  <td className="border border-gray-300 p-2">{p.categorie}</td>
                  <td className="border border-gray-300 p-2">{p.structure}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Produits en alerte urgente */}
      {data.parCriticite.urgent.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-3 text-orange-600 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Alerte Urgente - Stock ≤ 10% ({data.parCriticite.urgent.length})
          </h2>
          <table className="w-full border-collapse border border-gray-300 text-sm">
            <thead>
              <tr className="bg-orange-100">
                <th className="border border-gray-300 p-2">Article</th>
                <th className="border border-gray-300 p-2">Catégorie</th>
                <th className="border border-gray-300 p-2">Quantité</th>
                <th className="border border-gray-300 p-2">% Stock</th>
                <th className="border border-gray-300 p-2">Structure</th>
              </tr>
            </thead>
            <tbody>
              {data.parCriticite.urgent.map((p: any, idx: number) => (
                <tr key={idx} className="bg-orange-50">
                  <td className="border border-gray-300 p-2">{p.nom}</td>
                  <td className="border border-gray-300 p-2">{p.categorie}</td>
                  <td className="border border-gray-300 p-2 text-right">{p.quantite}</td>
                  <td className="border border-gray-300 p-2 text-right">
                    {p.pourcentage.toFixed(1)}%
                  </td>
                  <td className="border border-gray-300 p-2">{p.structure}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Produits à surveiller */}
      {data.parCriticite.attention.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-3 text-yellow-600 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            À Surveiller - Stock ≤ 20% ({data.parCriticite.attention.length})
          </h2>
          <table className="w-full border-collapse border border-gray-300 text-sm">
            <thead>
              <tr className="bg-yellow-100">
                <th className="border border-gray-300 p-2">Article</th>
                <th className="border border-gray-300 p-2">Catégorie</th>
                <th className="border border-gray-300 p-2">Quantité</th>
                <th className="border border-gray-300 p-2">% Stock</th>
                <th className="border border-gray-300 p-2">Structure</th>
              </tr>
            </thead>
            <tbody>
              {data.parCriticite.attention.map((p: any, idx: number) => (
                <tr key={idx} className="bg-yellow-50">
                  <td className="border border-gray-300 p-2">{p.nom}</td>
                  <td className="border border-gray-300 p-2">{p.categorie}</td>
                  <td className="border border-gray-300 p-2 text-right">{p.quantite}</td>
                  <td className="border border-gray-300 p-2 text-right">
                    {p.pourcentage.toFixed(1)}%
                  </td>
                  <td className="border border-gray-300 p-2">{p.structure}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Liste détaillée complète */}
      <div className="page-break"></div>
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-3">Détail Complet des Alertes</h2>
        <table className="w-full border-collapse border border-gray-300 text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 p-2">Article</th>
              <th className="border border-gray-300 p-2">Catégorie</th>
              <th className="border border-gray-300 p-2">Qté Actuelle</th>
              <th className="border border-gray-300 p-2">Qté Initiale</th>
              <th className="border border-gray-300 p-2">Seuil</th>
              <th className="border border-gray-300 p-2">% Stock</th>
              <th className="border border-gray-300 p-2">Valeur</th>
              <th className="border border-gray-300 p-2">Statut</th>
            </tr>
          </thead>
          <tbody>
            {data.produits.map((produit: any) => (
              <tr 
                key={produit.id}
                className={
                  produit.epuise ? 'bg-red-50' : 
                  produit.pourcentageStock <= 10 ? 'bg-orange-50' : 
                  'bg-yellow-50'
                }
              >
                <td className="border border-gray-300 p-2">{produit.nom}</td>
                <td className="border border-gray-300 p-2">{produit.categorie}</td>
                <td className="border border-gray-300 p-2 text-right font-bold">
                  {produit.quantiteActuelle} {produit.unite}
                </td>
                <td className="border border-gray-300 p-2 text-right">
                  {produit.quantiteInitiale}
                </td>
                <td className="border border-gray-300 p-2 text-right">
                  {produit.seuilAlerte}
                </td>
                <td className="border border-gray-300 p-2 text-right">
                  {produit.pourcentageStock.toFixed(1)}%
                </td>
                <td className="border border-gray-300 p-2 text-right">
                  {produit.valeurStock.toLocaleString('fr-FR')} MRU
                </td>
                <td className="border border-gray-300 p-2 text-center">
                  {getCriticiteBadge(produit.statut)}
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
