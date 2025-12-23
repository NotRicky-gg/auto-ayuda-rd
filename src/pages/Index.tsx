import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Navbar } from '@/components/Navbar';
import { SidebarHero } from '@/components/SidebarHero';
import { Footer } from '@/components/Footer';
import { ShopCard } from '@/components/ShopCard';
import { LoadingState } from '@/components/LoadingState';
import { EmptyState } from '@/components/EmptyState';
import { fetchMechanicShops, searchMechanicShops, getFeaturedShops, isFeaturedShop } from '@/services/mechanicService';

const Index = () => {
  const [searchQuery, setSearchQuery] = useState('');

  const { data: shops = [], isLoading, error } = useQuery({
    queryKey: ['mechanicShops'],
    queryFn: fetchMechanicShops,
  });

  const featuredIds = useMemo(() => {
    if (!shops.length) return [];
    return getFeaturedShops(shops);
  }, [shops]);

  const filteredShops = useMemo(() => {
    const searched = searchMechanicShops(shops, searchQuery);
    // Sort: featured first, then by rating
    return searched.sort((a, b) => {
      const aFeatured = isFeaturedShop(a, featuredIds);
      const bFeatured = isFeaturedShop(b, featuredIds);
      if (aFeatured && !bFeatured) return -1;
      if (!aFeatured && bFeatured) return 1;
      return b.rating - a.rating;
    });
  }, [shops, searchQuery, featuredIds]);

  // Calculate unique neighborhoods
  const totalNeighborhoods = useMemo(() => {
    const neighborhoods = new Set(shops.map(shop => shop.neighborhood));
    return neighborhoods.size;
  }, [shops]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <main className="flex-1">
        <div className="container py-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Sidebar */}
            <div className="lg:col-span-4">
              <SidebarHero
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                totalShops={shops.length}
                totalNeighborhoods={totalNeighborhoods}
              />
            </div>

            {/* Main Content */}
            <div className="lg:col-span-8">
              {/* Header */}
              {!isLoading && shops.length > 0 && (
                <div className="mb-6 flex items-center justify-between">
                  <h2 className="text-xl font-bold text-foreground">
                    {searchQuery ? 'Resultados de búsqueda' : 'Talleres Disponibles'}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {filteredShops.length} {filteredShops.length === 1 ? 'resultado' : 'resultados'}
                  </p>
                </div>
              )}

              {/* Loading */}
              {isLoading && <LoadingState />}

              {/* Error */}
              {error && (
                <div className="text-center py-10">
                  <p className="text-destructive">Error al cargar los talleres. Por favor, intenta de nuevo.</p>
                </div>
              )}

              {/* Empty State */}
              {!isLoading && !error && filteredShops.length === 0 && (
                <EmptyState searchQuery={searchQuery} />
              )}

              {/* Shop List */}
              {!isLoading && !error && filteredShops.length > 0 && (
                <div className="space-y-4">
                  {filteredShops.map((shop, index) => (
                    <div
                      key={shop.id}
                      className="animate-fade-in"
                      style={{ animationDelay: `${index * 0.05}s` }}
                    >
                      <ShopCard
                        shop={shop}
                        isFeatured={isFeaturedShop(shop, featuredIds)}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Index;
