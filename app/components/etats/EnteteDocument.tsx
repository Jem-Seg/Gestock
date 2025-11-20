'use client';

interface EnteteProprietary {
  logo?: string;
  ministere?: string;
  structure?: string;
  titre: string;
  sousTitre?: string;
}

export default function EnteteDocument({ 
  logo, 
  ministere, 
  structure, 
  titre, 
  sousTitre 
}: EnteteProprietary) {
  return (
    <div className="mb-8 border-b-2 border-gray-800 pb-4">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          {ministere && (
            <div className="text-sm font-semibold text-gray-700 uppercase">
              {ministere}
            </div>
          )}
          {structure && (
            <div className="text-sm text-gray-600">
              {structure}
            </div>
          )}
        </div>
        
        {logo && (
          <div className="w-16 h-16">
            <img src={logo} alt="Logo" className="w-full h-full object-contain" />
          </div>
        )}
      </div>
      
      <div className="mt-4 text-center">
        <h1 className="text-2xl font-bold text-gray-900 uppercase">
          {titre}
        </h1>
        {sousTitre && (
          <p className="text-sm text-gray-600 mt-1">
            {sousTitre}
          </p>
        )}
      </div>
    </div>
  );
}
