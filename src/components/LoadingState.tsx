import { Loader2 } from 'lucide-react';

export const LoadingState = () => {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <Loader2 className="h-10 w-10 text-orange animate-spin" />
      <p className="text-muted-foreground">Cargando talleres...</p>
    </div>
  );
};
