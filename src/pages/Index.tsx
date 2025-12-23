import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { SearchBar } from '@/components/SearchBar';
import { ShopCard } from '@/components/ShopCard';
import { LoadingState } from '@/components/LoadingState';
import { EmptyState } from '@/components/EmptyState';
import { fetchMechanicShops, searchMechanicShops, getFeaturedShops, isFeaturedShop } from '@/services/mechanicService';
import type { MechanicShop } from '@/types/mechanic';

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

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1">
        {/* Search Section */}
        <section className="bg-card border-b border-border py-8 -mt-6 relative z-10">
          <div className="container">
            <SearchBar value={searchQuery} onChange={setSearchQuery} />
          </div>
        </section>

        {/* Results Section */}
        <section className="container py-12">
          {/* Stats */}
          {!isLoading && shops.length > 0 && (
            <div className="mb-8 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-foreground">
                {searchQuery ? 'Resultados de búsqueda' : 'Todos los Talleres'}
              </h2>
              <p className="text-muted-foreground">
                {filteredShops.length} {filteredShops.length === 1 ? 'taller encontrado' : 'talleres encontrados'}
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

          {/* Shop Grid */}
          {!isLoading && !error && filteredShops.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredShops.map((shop, index) => (
                <div
                  key={shop.id}
                  className="animate-fade-in"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <ShopCard
                    shop={shop}
                    isFeatured={isFeaturedShop(shop, featuredIds)}
                  />
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Index;
