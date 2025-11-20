'use client';

import { useState, useEffect } from 'react';
import EtatImprimable from './EtatImprimable';
import EnteteDocument from './EnteteDocument';
import PiedPage from './PiedPage';
import { TrendingUp, TrendingDown, Building } from 'lucide-react';

interface HistoriqueStructureProps {
  structureId: string;
  dateDebut?: string;
  dateFin?: string;
}

export default function HistoriqueStructure({ 
  structureId, 
  dateDebut, 
  dateFin 
}: HistoriqueStructureProps) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const params = new URLSearchParams();
        params.append('structureId', structureId);
        if (dateDebut) params.append('dateDebut', dateDebut);
        if (dateFin) params.append('dateFin', dateFin);

        const response = await fetch(`/api/etats/mouvements/historique-structure?${params}`);
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
  }, [structureId, dateDebut, dateFin]);

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

  const formatMois = (mois: string) => {
    const [annee, moisNum] = mois.split('-');
    const moisNoms = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
    return `${moisNoms[parseInt(moisNum) - 1]} ${annee}`;
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
    <EtatImprimable titre={`Historique - ${data.structure.nom}`}>
      <EnteteDocument
        titre="HISTORIQUE DES MOUVEMENTS PAR STRUCTURE"
        sousTitre={getPeriodeLabel()}
        ministere={data.entete?.ministere}
        structure={data.entete?.structure}
      />

      {/* Informations structure */}
      <div className="mb-6 bg-gray-50 p-4 rounded border-2 border-gray-300">
        <div className="flex items-center gap-3 mb-3">
          <Building className="w-6 h-6 text-primary" />
          <h2 className="text-xl font-bold">{data.structure.nom}</h2>
        </div>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <span className="font-semibold">Ministère:</span> {data.structure.ministere}
          </div>
          <div>
            <span className="font-semibold">Abréviation:</span> {data.structure.abreviation || '-'}
          </div>
        </div>
      </div>

      {/* Statistiques globales */}
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
        <div className="bg-teal-50 p-4 rounded text-center border border-teal-200">
          <div className="text-sm text-gray-600">Valeur Entrées</div>
          <div className="text-lg font-bold text-teal-600">
            {data.statistiques.valeurTotaleEntrees.toLocaleString('fr-FR')} MRU
          </div>
        </div>
        <div className="bg-rose-50 p-4 rounded text-center border border-rose-200">
          <div className="text-sm text-gray-600">Valeur Sorties</div>
          <div className="text-lg font-bold text-rose-600">
            {data.statistiques.valeurTotaleSorties.toLocaleString('fr-FR')} MRU
          </div>
        </div>
      </div>

      {/* Résumé par produit */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-3">Résumé par Produit</h2>
        <table className="w-full border-collapse border border-gray-300 text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 p-2">Produit</th>
              <th className="border border-gray-300 p-2">Catégorie</th>
              <th className="border border-gray-300 p-2">Entrées</th>
              <th className="border border-gray-300 p-2">Sorties</th>
              <th className="border border-gray-300 p-2">Variation</th>
              <th className="border border-gray-300 p-2">Val. Entrées</th>
              <th className="border border-gray-300 p-2">Val. Sorties</th>
            </tr>
          </thead>
          <tbody>
            {data.parProduit.length === 0 ? (
              <tr>
                <td colSpan={7} className="border border-gray-300 p-4 text-center text-gray-500">
                  Aucun mouvement enregistré
                </td>
              </tr>
            ) : (
              data.parProduit.map((p: any, idx: number) => (
                <tr key={idx}>
                  <td className="border border-gray-300 p-2">{p.produitNom}</td>
                  <td className="border border-gray-300 p-2">{p.categorie}</td>
                  <td className="border border-gray-300 p-2 text-right text-green-600 font-semibold">
                    +{p.entrees}
                  </td>
                  <td className="border border-gray-300 p-2 text-right text-red-600 font-semibold">
                    -{p.sorties}
                  </td>
                  <td className="border border-gray-300 p-2 text-right font-bold">
                    <span className={p.entrees - p.sorties >= 0 ? 'text-green-600' : 'text-red-600'}>
                      {p.entrees - p.sorties > 0 ? '+' : ''}{p.entrees - p.sorties}
                    </span>
                  </td>
                  <td className="border border-gray-300 p-2 text-right">
                    {p.valeurEntrees.toLocaleString('fr-FR')}
                  </td>
                  <td className="border border-gray-300 p-2 text-right">
                    {p.valeurSorties.toLocaleString('fr-FR')}
                  </td>
                </tr>
              ))
            )}
          </tbody>
          <tfoot>
            <tr className="bg-gray-50 font-bold">
              <td colSpan={2} className="border border-gray-300 p-2">TOTAUX</td>
              <td className="border border-gray-300 p-2 text-right text-green-600">
                +{data.statistiques.totalEntrees}
              </td>
              <td className="border border-gray-300 p-2 text-right text-red-600">
                -{data.statistiques.totalSorties}
              </td>
              <td className="border border-gray-300 p-2 text-right">
                <span className={data.statistiques.totalEntrees - data.statistiques.totalSorties >= 0 ? 'text-green-600' : 'text-red-600'}>
                  {data.statistiques.totalEntrees - data.statistiques.totalSorties > 0 ? '+' : ''}
                  {data.statistiques.totalEntrees - data.statistiques.totalSorties}
                </span>
              </td>
              <td className="border border-gray-300 p-2 text-right">
                {data.statistiques.valeurTotaleEntrees.toLocaleString('fr-FR')}
              </td>
              <td className="border border-gray-300 p-2 text-right">
                {data.statistiques.valeurTotaleSorties.toLocaleString('fr-FR')}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Résumé par mois */}
      {data.parMois.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-3">Résumé par Mois</h2>
          <table className="w-full border-collapse border border-gray-300 text-sm">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 p-2">Mois</th>
                <th className="border border-gray-300 p-2">Entrées</th>
                <th className="border border-gray-300 p-2">Sorties</th>
                <th className="border border-gray-300 p-2">Variation</th>
                <th className="border border-gray-300 p-2">Val. Entrées</th>
                <th className="border border-gray-300 p-2">Val. Sorties</th>
              </tr>
            </thead>
            <tbody>
              {data.parMois.map((m: any, idx: number) => (
                <tr key={idx}>
                  <td className="border border-gray-300 p-2 font-semibold">
                    {formatMois(m.mois)}
                  </td>
                  <td className="border border-gray-300 p-2 text-right text-green-600">
                    +{m.entrees}
                  </td>
                  <td className="border border-gray-300 p-2 text-right text-red-600">
                    -{m.sorties}
                  </td>
                  <td className="border border-gray-300 p-2 text-right font-bold">
                    <span className={m.entrees - m.sorties >= 0 ? 'text-green-600' : 'text-red-600'}>
                      {m.entrees - m.sorties > 0 ? '+' : ''}{m.entrees - m.sorties}
                    </span>
                  </td>
                  <td className="border border-gray-300 p-2 text-right">
                    {m.valeurEntrees.toLocaleString('fr-FR')}
                  </td>
                  <td className="border border-gray-300 p-2 text-right">
                    {m.valeurSorties.toLocaleString('fr-FR')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Détail des mouvements */}
      <div className="mb-6 page-break">
        <h2 className="text-lg font-semibold mb-3">Détail des Mouvements</h2>
        <table className="w-full border-collapse border border-gray-300 text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 p-2">Date</th>
              <th className="border border-gray-300 p-2">Type</th>
              <th className="border border-gray-300 p-2">N°</th>
              <th className="border border-gray-300 p-2">Produit</th>
              <th className="border border-gray-300 p-2">Catégorie</th>
              <th className="border border-gray-300 p-2">Quantité</th>
              <th className="border border-gray-300 p-2">Prix Unit.</th>
              <th className="border border-gray-300 p-2">Valeur</th>
              <th className="border border-gray-300 p-2">Référence</th>
            </tr>
          </thead>
          <tbody>
            {data.mouvements.length === 0 ? (
              <tr>
                <td colSpan={9} className="border border-gray-300 p-4 text-center text-gray-500">
                  Aucun mouvement pour cette période
                </td>
              </tr>
            ) : (
              data.mouvements.map((mvt: any, idx: number) => (
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
                  <td className="border border-gray-300 p-2">
                    {mvt.produit.nom}
                  </td>
                  <td className="border border-gray-300 p-2">
                    {mvt.produit.categorie}
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
                  <td className="border border-gray-300 p-2 text-xs">
                    {mvt.reference}
                    {mvt.nif && <div className="text-gray-500">NIF: {mvt.nif}</div>}
                    {mvt.telephone && <div className="text-gray-500">Tél: {mvt.telephone}</div>}
                    {mvt.motif && <div className="text-gray-500">{mvt.motif}</div>}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Résumé */}
      <div className="bg-blue-50 p-4 rounded border-2 border-blue-300 mb-6">
        <h3 className="font-semibold mb-2">Résumé</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
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
            <span className="font-semibold">Articles différents:</span> {data.parProduit.length}
          </div>
          <div>
            <span className="font-semibold">Bilan financier:</span>{' '}
            <span className={data.statistiques.valeurTotaleEntrees - data.statistiques.valeurTotaleSorties >= 0 ? 'text-green-600' : 'text-red-600'}>
              {(data.statistiques.valeurTotaleEntrees - data.statistiques.valeurTotaleSorties).toLocaleString('fr-FR')} MRU
            </span>
          </div>
        </div>
      </div>

      <PiedPage dateGeneration={data.dateGeneration} />
    </EtatImprimable>
  );
}
