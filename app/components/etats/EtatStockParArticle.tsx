'use client';

import { useEffect, useState } from 'react';
import EtatImprimable from './EtatImprimable';
import EnteteDocument from './EnteteDocument';
import PiedPage from './PiedPage';

interface EtatStockParArticleProps {
  produitId: string;
}

interface Mouvement {
  id: string;
  type: 'ENTREE' | 'SORTIE';
  numero: string;
  date: string;
  quantite: number;
  prixUnitaire: number;
  valeur: number;
  reference: string;
  statut: string;
}

interface EtatData {
  produit: {
    id: string;
    nom: string;
    description?: string;
    categorie: string;
    quantiteActuelle: number;
    quantiteInitiale: number;
    unite: string;
    prixUnitaire: number;
    valeurStock: number;
    structure: string;
    ministere: string;
    seuilAlerte: number;
  };
  statistiques: {
    totalEntrees: number;
    totalSorties: number;
    stockActuel: number;
    nombreAlimentations: number;
    nombreOctrois: number;
    valeurTotaleEntrees: number;
    valeurTotaleSorties: number;
  };
  mouvements: Mouvement[];
  dateGeneration: string;
}

export default function EtatStockParArticle({ produitId }: EtatStockParArticleProps) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<EtatData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!produitId) {
        setError('Aucun article sélectionné');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/etats/stock/par-article?produitId=${produitId}`);
        
        if (!response.ok) {
          throw new Error('Erreur lors du chargement des données');
        }

        const result = await response.json();
        setData(result);
      } catch (err) {
        console.error('Erreur:', err);
        setError(err instanceof Error ? err.message : 'Erreur inconnue');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [produitId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="loading loading-spinner loading-lg"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-error">
        <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>Erreur: {error}</span>
      </div>
    );
  }

  if (!data || !data.produit) {
    return (
      <div className="alert alert-warning">
        <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <span>Aucune donnée disponible</span>
      </div>
    );
  }

  const { produit, statistiques, mouvements } = data;

  return (
    <EtatImprimable 
      titre={`État du Stock - ${produit.nom}`}
      nomFichier={`etat-stock-${produit.nom.replace(/\s+/g, '-').toLowerCase()}`}
    >
      <EnteteDocument
        titre="ÉTAT DU STOCK PAR ARTICLE"
        sousTitre={produit.nom}
        logo="/logo.png"
      />

      <div className="space-y-6">
        {/* Informations de l'article */}
        <div className="card bg-base-200">
          <div className="card-body p-4">
            <h3 className="font-bold text-lg mb-3">Informations de l&apos;Article</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <div className="text-xs text-base-content/60">Article</div>
                <div className="font-semibold">{produit.nom}</div>
              </div>
              <div>
                <div className="text-xs text-base-content/60">Catégorie</div>
                <div className="font-semibold">{produit.categorie}</div>
              </div>
              <div>
                <div className="text-xs text-base-content/60">Unité</div>
                <div className="font-semibold">{produit.unite}</div>
              </div>
              <div>
                <div className="text-xs text-base-content/60">Stock Actuel</div>
                <div className="font-bold text-primary text-lg">{produit.quantiteActuelle} {produit.unite}</div>
              </div>
              <div>
                <div className="text-xs text-base-content/60">Structure</div>
                <div className="font-semibold">{produit.structure}</div>
              </div>
              <div>
                <div className="text-xs text-base-content/60">Ministère</div>
                <div className="font-semibold">{produit.ministere}</div>
              </div>
              <div>
                <div className="text-xs text-base-content/60">Prix Unitaire</div>
                <div className="font-semibold">{produit.prixUnitaire.toLocaleString()} MRU</div>
              </div>
              <div>
                <div className="text-xs text-base-content/60">Valeur Stock</div>
                <div className="font-bold text-success">{produit.valeurStock.toLocaleString()} MRU</div>
              </div>
            </div>
          </div>
        </div>

        {/* Statistiques */}
        <div>
          <h3 className="font-bold text-lg mb-3">Statistiques</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="card bg-success text-success-content">
              <div className="card-body p-4">
                <div className="text-xs opacity-80">Total Entrées</div>
                <div className="text-2xl font-bold">{statistiques.totalEntrees} {produit.unite}</div>
                <div className="text-xs opacity-80">{statistiques.nombreAlimentations} alimentation(s)</div>
                <div className="text-sm font-semibold mt-1">
                  {statistiques.valeurTotaleEntrees.toLocaleString()} MRU
                </div>
              </div>
            </div>
            <div className="card bg-warning text-warning-content">
              <div className="card-body p-4">
                <div className="text-xs opacity-80">Total Sorties</div>
                <div className="text-2xl font-bold">{statistiques.totalSorties} {produit.unite}</div>
                <div className="text-xs opacity-80">{statistiques.nombreOctrois} octroi(s)</div>
                <div className="text-sm font-semibold mt-1">
                  {statistiques.valeurTotaleSorties.toLocaleString()} MRU
                </div>
              </div>
            </div>
            <div className="card bg-primary text-primary-content">
              <div className="card-body p-4">
                <div className="text-xs opacity-80">Stock Actuel</div>
                <div className="text-2xl font-bold">{statistiques.stockActuel} {produit.unite}</div>
                <div className="text-xs opacity-80">
                  Seuil alerte: {produit.seuilAlerte} {produit.unite}
                </div>
                <div className={`badge badge-sm mt-1 ${statistiques.stockActuel <= produit.seuilAlerte ? 'badge-error' : 'badge-success'}`}>
                  {statistiques.stockActuel <= produit.seuilAlerte ? '⚠️ Alerte' : '✓ Normal'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Historique des mouvements */}
        <div>
          <h3 className="font-bold text-lg mb-3">Historique des Mouvements</h3>
          <div className="overflow-x-auto">
            <table className="table table-zebra table-sm">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Numéro</th>
                  <th>Référence</th>
                  <th className="text-right">Quantité</th>
                  <th className="text-right">Prix Unit.</th>
                  <th className="text-right">Valeur</th>
                  <th>Statut</th>
                </tr>
              </thead>
              <tbody>
                {mouvements && mouvements.length > 0 ? (
                  mouvements.slice(0, 20).map((mvt) => (
                    <tr key={mvt.id}>
                      <td className="text-xs">{new Date(mvt.date).toLocaleDateString('fr-FR')}</td>
                      <td>
                        <span className={`badge badge-xs ${mvt.type === 'ENTREE' ? 'badge-success' : 'badge-warning'}`}>
                          {mvt.type === 'ENTREE' ? '↑ Entrée' : '↓ Sortie'}
                        </span>
                      </td>
                      <td className="font-mono text-xs">{mvt.numero}</td>
                      <td className="text-xs">{mvt.reference}</td>
                      <td className="text-right font-semibold">
                        {mvt.type === 'ENTREE' ? '+' : '-'}{mvt.quantite} {produit.unite}
                      </td>
                      <td className="text-right text-xs">{mvt.prixUnitaire.toLocaleString()}</td>
                      <td className="text-right font-semibold text-xs">{mvt.valeur.toLocaleString()}</td>
                      <td>
                        <span className="badge badge-ghost badge-xs">{mvt.statut}</span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="text-center text-base-content/60">
                      Aucun mouvement enregistré
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {mouvements && mouvements.length > 20 && (
            <div className="text-xs text-center text-base-content/60 mt-2">
              Affichage des 20 derniers mouvements sur {mouvements.length} total
            </div>
          )}
        </div>
      </div>

      <PiedPage 
        dateGeneration={new Date().toLocaleDateString('fr-FR')}
        nomGenerateur="GeStock"
        pageInfo="Confidentiel"
      />
    </EtatImprimable>
  );
}
