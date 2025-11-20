'use client';

interface PiedPageProps {
  dateGeneration: string;
  nomGenerateur?: string;
  pageInfo?: string;
}

export default function PiedPage({ dateGeneration, nomGenerateur, pageInfo }: PiedPageProps) {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat('fr-FR', {
      dateStyle: 'full',
      timeStyle: 'short',
    }).format(date);
  };

  return (
    <div className="mt-8 pt-4 border-t border-gray-300 text-xs text-gray-600">
      <div className="flex justify-between items-center">
        <div>
          {nomGenerateur && (
            <div>Généré par: {nomGenerateur}</div>
          )}
          <div>Date d&apos;édition: {formatDate(dateGeneration)}</div>
        </div>
        {pageInfo && (
          <div>{pageInfo}</div>
        )}
      </div>
    </div>
  );
}
