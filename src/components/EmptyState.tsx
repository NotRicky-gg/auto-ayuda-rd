import { SearchX } from 'lucide-react';

interface EmptyStateProps {
  searchQuery?: string;
}

export const EmptyState = ({ searchQuery }: EmptyStateProps) => {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
      <div className="p-4 bg-muted rounded-full">
        <SearchX className="h-10 w-10 text-muted-foreground" />
      </div>
      <div className="space-y-2">
        <h3 className="text-xl font-semibold text-foreground">
          No se encontraron talleres
        </h3>
        {searchQuery && (
          <p className="text-muted-foreground">
            No hay resultados para "{searchQuery}". Intenta con otra búsqueda.
          </p>
        )}
      </div>
    </div>
  );
};
