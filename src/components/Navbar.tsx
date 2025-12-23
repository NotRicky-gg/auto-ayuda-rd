import { Zap, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const Navbar = () => {
  return (
    <header className="bg-card border-b border-border sticky top-0 z-50">
      <div className="container py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-orange rounded-lg">
              <Zap className="h-5 w-5 text-white" fill="currentColor" />
            </div>
            <span className="text-xl font-bold tracking-tight text-foreground">
              CHEQUÉALO RD
            </span>
          </div>
          
          <Button className="bg-orange hover:bg-orange-light text-white font-semibold gap-2">
            <Plus className="h-4 w-4" />
            Agregar Taller
          </Button>
        </div>
      </div>
    </header>
  );
};
