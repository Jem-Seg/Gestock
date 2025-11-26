'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Wrapper from '@/app/components/Wrapper';
import { FileText, Download, Calendar, Building, TrendingUp, TrendingDown } from 'lucide-react';
import { PDFReportGenerator } from '@/lib/pdf-generator';
import { StructureStatistics } from '@/type';
import toast from 'react-hot-toast';

interface Structure {
  id: string;
  name: string;
  abreviation?: string;
  ministere: {
    name: string;
    abreviation: string;
  };
}

interface Ministere {
  id: string;
  name: string;
  abreviation: string;
  structures: Structure[];
}

export default function EtatsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userStructures, setUserStructures] = useState<Ministere[]>([]);
  const [selectedStructure, setSelectedStructure] = useState<string>('');
  const [generating, setGenerating] = useState(false);
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setMonth(date.getMonth() - 1);
    return date.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);

  // Charger les structures accessibles par l'utilisateur
  useEffect(() => {
    const loadUserStructures = async () => {
      if (status !== 'authenticated' || !session?.user?.id) {
        return;
      }

      try {
        const response = await fetch(`/api/user/${session.user.id}`);
        
        if (!response.ok) {
          if (response.status === 403) {
            router.push('/admin/verify');
            return;
          }
          throw new Error('Erreur lors du chargement des structures');
        }

        const data = await response.json();
        const structures = data.structures || [];
        
        setUserStructures(structures);
        
        // Sélectionner automatiquement la première structure si une seule disponible
        if (structures.length === 1 && structures[0].structures?.length === 1) {
          setSelectedStructure(structures[0].structures[0].id);
        }
      } catch (error) {
        console.error('Erreur chargement structures:', error);
      } finally {
        setLoading(false);
      }
    };

    loadUserStructures();
  }, [status, session, router]);

  const handleGenerateReport = async (reportType: 'alimentations' | 'octrois' | 'global') => {
    if (!selectedStructure) {
      toast.error('Veuillez sélectionner une structure');
      return;
    }

    try {
      setGenerating(true);
      toast.loading('Génération du rapport en cours...');

      // Récupérer les statistiques
      const url = `/api/structures/${selectedStructure}/statistics?startDate=${startDate}&endDate=${endDate}`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error('Erreur lors de la récupération des statistiques');
      }

      const statistics: StructureStatistics = await response.json();
      
      // Générer le PDF
      const generator = new PDFReportGenerator();
      const selectedStructureData = userStructures
        .flatMap(m => m.structures)
        .find(s => s.id === selectedStructure);

      const config = {
        structureName: selectedStructureData?.name || 'Structure',
        ministereName: selectedStructureData?.ministere.name || 'Ministère',
        startDate,
        endDate,
      };

      if (reportType === 'alimentations') {
        generator.generateAlimentationsReport(statistics, config);
        generator.save(`Rapport_Alimentations_${config.structureName}_${new Date().toISOString().split('T')[0]}.pdf`);
      } else if (reportType === 'octrois') {
        generator.generateOctroisReport(statistics, config);
        generator.save(`Rapport_Octrois_${config.structureName}_${new Date().toISOString().split('T')[0]}.pdf`);
      } else {
        generator.generateGlobalReport(statistics, config);
        generator.save(`Rapport_Global_${config.structureName}_${new Date().toISOString().split('T')[0]}.pdf`);
      }

      toast.dismiss();
      toast.success('Rapport généré avec succès !');
    } catch (error) {
      console.error('Erreur génération rapport:', error);
      toast.dismiss();
      toast.error('Erreur lors de la génération du rapport');
    } finally {
      setGenerating(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <Wrapper>
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="loading loading-spinner loading-lg"></div>
        </div>
      </Wrapper>
    );
  }

  if (status !== 'authenticated') {
    router.push('/sign-in');
    return null;
  }

  const selectedStructureData = userStructures
    .flatMap(m => m.structures)
    .find(s => s.id === selectedStructure);

  return (
    <Wrapper>
      <div className="space-y-6">
        {/* En-tête */}
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h1 className="card-title text-3xl mb-2">
              <FileText className="w-8 h-8 text-primary" />
              États et Rapports
            </h1>
            <p className="text-base-content/70">
              Générez et consultez les états et rapports d&apos;alimentation et d&apos;octroi
            </p>
          </div>
        </div>

        {/* Sélection structure et période */}
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title">Configuration du rapport</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Sélection structure */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold">Structure</span>
                </label>
                <select
                  className="select select-bordered w-full"
                  value={selectedStructure}
                  onChange={(e) => setSelectedStructure(e.target.value)}
                  title="Sélectionner une structure"
                >
                  <option value="">-- Sélectionner une structure --</option>
                  {userStructures.map((ministere) =>
                    ministere.structures?.map((structure) => (
                      <option key={structure.id} value={structure.id}>
                        {structure.name} ({ministere.abreviation})
                      </option>
                    ))
                  )}
                </select>
              </div>

              {/* Période */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold">Période</span>
                </label>
                <div className="flex gap-2">
                  <input 
                    type="date" 
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="input input-bordered flex-1"
                    aria-label="Date de début"
                  />
                  <input 
                    type="date" 
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="input input-bordered flex-1"
                    aria-label="Date de fin"
                  />
                </div>
              </div>
            </div>

            {/* Informations structure sélectionnée */}
            {selectedStructureData && (
              <div className="alert alert-info mt-4">
                <Building className="w-5 h-5" />
                <div>
                  <h3 className="font-semibold">{selectedStructureData.name}</h3>
                  <p className="text-sm">
                    {selectedStructureData.ministere.name} - Période: {new Date(startDate).toLocaleDateString()} au {new Date(endDate).toLocaleDateString()}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Types de rapports */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Rapport Alimentations */}
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <h2 className="card-title text-lg">
                <TrendingUp className="w-5 h-5 text-success" />
                Rapport Alimentations
              </h2>
              <p className="text-sm text-base-content/70">
                État détaillé de toutes les alimentations de la période
              </p>
              <div className="card-actions justify-end mt-4">
                <button 
                  className="btn btn-success btn-sm gap-2"
                  onClick={() => handleGenerateReport('alimentations')}
                  disabled={!selectedStructure || generating}
                >
                  {generating ? (
                    <span className="loading loading-spinner loading-xs"></span>
                  ) : (
                    <Download className="w-4 h-4" />
                  )}
                  Générer
                </button>
              </div>
            </div>
          </div>

          {/* Rapport Octrois */}
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <h2 className="card-title text-lg">
                <TrendingDown className="w-5 h-5 text-warning" />
                Rapport Octrois
              </h2>
              <p className="text-sm text-base-content/70">
                État détaillé de tous les octrois de la période
              </p>
              <div className="card-actions justify-end mt-4">
                <button 
                  className="btn btn-warning btn-sm gap-2"
                  onClick={() => handleGenerateReport('octrois')}
                  disabled={!selectedStructure || generating}
                >
                  {generating ? (
                    <span className="loading loading-spinner loading-xs"></span>
                  ) : (
                    <Download className="w-4 h-4" />
                  )}
                  Générer
                </button>
              </div>
            </div>
          </div>

          {/* Rapport Global */}
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <h2 className="card-title text-lg">
                <Calendar className="w-5 h-5 text-primary" />
                Rapport Global
              </h2>
              <p className="text-sm text-base-content/70">
                Synthèse complète avec statistiques et tableaux
              </p>
              <div className="card-actions justify-end mt-4">
                <button 
                  className="btn btn-primary btn-sm gap-2"
                  onClick={() => handleGenerateReport('global')}
                  disabled={!selectedStructure || generating}
                >
                  {generating ? (
                    <span className="loading loading-spinner loading-xs"></span>
                  ) : (
                    <Download className="w-4 h-4" />
                  )}
                  Générer
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Information */}
        <div className="alert">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-info shrink-0 w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          <span>
            Les rapports sont générés au format PDF et incluent les données validées de la période sélectionnée.
          </span>
        </div>
      </div>
    </Wrapper>
  );
}
