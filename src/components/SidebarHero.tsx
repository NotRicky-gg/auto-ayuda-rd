import { Search, Navigation, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Building2, MapPin } from 'lucide-react';

interface SidebarHeroProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  totalShops: number;
  totalNeighborhoods: number;
  onNearMeClick: () => void;
  isNearMeActive: boolean;
  isLocating: boolean;
  onClearNearMe: () => void;
}

export const SidebarHero = ({ 
  searchQuery, 
  onSearchChange, 
  totalShops,
  totalNeighborhoods,
  onNearMeClick,
  isNearMeActive,
  isLocating,
  onClearNearMe
}: SidebarHeroProps) => {
  return (
    <aside className="lg:sticky lg:top-24 space-y-6">
      {/* Hero Card */}
      <div className="bg-navy rounded-2xl p-8 text-white">
        <h1 className="text-4xl md:text-5xl font-black leading-tight mb-2">
          ENCUENTRA
          <br />
          <span className="text-orange">TU MECÁNICO</span>
        </h1>
        <p className="text-gray-400 mt-4 text-sm">
          Busca talleres por nombre, ubicación o servicios
        </p>

        {/* Search */}
        <div className="mt-6 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <Input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Buscar talleres..."
            className="w-full h-12 pl-12 bg-white text-foreground border-0 rounded-xl placeholder:text-gray-400"
          />
        </div>

        {/* Near Me Button */}
        <div className="mt-4">
          {isNearMeActive ? (
            <Button
              onClick={onClearNearMe}
              variant="outline"
              className="w-full h-12 bg-orange text-white border-orange hover:bg-orange/90 rounded-xl"
            >
              <Navigation className="h-5 w-5 mr-2" />
              Cerca de mí activo
              <X className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={onNearMeClick}
              disabled={isLocating}
              variant="outline"
              className="w-full h-12 bg-white/10 text-white border-white/20 hover:bg-white/20 rounded-xl"
            >
              <Navigation className="h-5 w-5 mr-2" />
              {isLocating ? 'Localizando...' : 'Buscar cerca de mí'}
            </Button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-card rounded-xl p-4 border border-border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange/10 rounded-lg">
              <Building2 className="h-5 w-5 text-orange" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{totalShops}+</p>
              <p className="text-xs text-muted-foreground">Talleres Registrados</p>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-xl p-4 border border-border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange/10 rounded-lg">
              <MapPin className="h-5 w-5 text-orange" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{totalNeighborhoods}+</p>
              <p className="text-xs text-muted-foreground">Sectores Cubiertos</p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};
