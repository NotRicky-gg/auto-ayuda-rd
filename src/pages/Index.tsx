import { useState, useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Navbar } from '@/components/Navbar';
import { SidebarHero } from '@/components/SidebarHero';
import { Footer } from '@/components/Footer';
import { ShopCard } from '@/components/ShopCard';
import { ShopDetailModal } from '@/components/ShopDetailModal';
import { LoadingState } from '@/components/LoadingState';
import { EmptyState } from '@/components/EmptyState';
import { fetchShopRatings, searchShops, getFeaturedShopIds } from '@/services/mechanicService';
import type { ShopWithStats } from '@/types/mechanic';
import { useToast } from '@/hooks/use-toast';

interface ShopWithDistance extends ShopWithStats {
  distance?: number;
}

// Extract coordinates from Google Maps URL
const extractCoordsFromUrl = (url: string | null): { lat: number; lng: number } | null => {
  if (!url) return null;
  
  // Try to match @lat,lng pattern (most common)
  const atMatch = url.match(/@(-?\d+\.?\d*),(-?\d+\.?\d*)/);
  if (atMatch) {
    return { lat: parseFloat(atMatch[1]), lng: parseFloat(atMatch[2]) };
  }
  
  // Try to match place/ pattern with coordinates
  const placeMatch = url.match(/place\/[^/]+\/@(-?\d+\.?\d*),(-?\d+\.?\d*)/);
  if (placeMatch) {
    return { lat: parseFloat(placeMatch[1]), lng: parseFloat(placeMatch[2]) };
  }
  
  // Try to match q= parameter
  const qMatch = url.match(/[?&]q=(-?\d+\.?\d*),(-?\d+\.?\d*)/);
  if (qMatch) {
    return { lat: parseFloat(qMatch[1]), lng: parseFloat(qMatch[2]) };
  }
  
  // Try to match ll= parameter
  const llMatch = url.match(/[?&]ll=(-?\d+\.?\d*),(-?\d+\.?\d*)/);
  if (llMatch) {
    return { lat: parseFloat(llMatch[1]), lng: parseFloat(llMatch[2]) };
  }
  
  return null;
};

// Haversine formula to calculate distance between two coordinates in km
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const Index = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedShop, setSelectedShop] = useState<ShopWithStats | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const { toast } = useToast();

  const { data: shops = [], isLoading, error } = useQuery({
    queryKey: ['shopRatings'],
    queryFn: fetchShopRatings,
  });

  const featuredIds = useMemo(() => {
    if (!shops.length) return [];
    return getFeaturedShopIds(shops);
  }, [shops]);

  const handleNearMeClick = useCallback(async () => {
    if (!navigator.geolocation) {
      toast({
        title: 'Error',
        description: 'Tu navegador no soporta geolocalización',
        variant: 'destructive',
      });
      return;
    }

    setIsLocating(true);

    // Check permission state first if available
    if (navigator.permissions) {
      try {
        const permissionStatus = await navigator.permissions.query({ name: 'geolocation' });
        
        if (permissionStatus.state === 'denied') {
          setIsLocating(false);
          toast({
            title: 'Ubicación bloqueada',
            description: 'Activa el permiso de ubicación en la configuración de tu navegador.',
            variant: 'destructive',
          });
          return;
        }
      } catch {
        // Permission API not supported, continue with geolocation request
      }
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setIsLocating(false);
        toast({
          title: 'Ubicación encontrada',
          description: 'Mostrando talleres más cercanos',
        });
      },
      (error) => {
        setIsLocating(false);
        let message = 'No se pudo obtener tu ubicación. Intenta de nuevo.';
        if (error.code === error.PERMISSION_DENIED) {
          message = 'Permite el acceso a tu ubicación cuando el navegador te lo solicite.';
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          message = 'No se pudo determinar tu ubicación. Verifica que el GPS esté activado.';
        } else if (error.code === error.TIMEOUT) {
          message = 'La solicitud de ubicación tardó demasiado. Intenta de nuevo.';
        }
        toast({
          title: 'No se pudo obtener ubicación',
          description: message,
          variant: 'destructive',
        });
      },
      {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 300000, // Cache location for 5 minutes
      }
    );
  }, [toast]);

  const handleClearNearMe = useCallback(() => {
    setUserLocation(null);
  }, []);

  // Calculate distances and sort by proximity when user location is available
  const shopsWithDistance = useMemo((): ShopWithDistance[] | null => {
    if (!userLocation) return null;
    
    return shops
      .map(shop => {
        // Try to get coordinates from Google Maps URL first (more accurate)
        // Fall back to stored lat/lng
        const urlCoords = extractCoordsFromUrl(shop.google_maps_url);
        const lat = urlCoords?.lat ?? shop.latitude;
        const lng = urlCoords?.lng ?? shop.longitude;
        
        if (lat === null || lng === null) {
          return null; // Skip shops without coordinates
        }
        
        return {
          ...shop,
          distance: calculateDistance(userLocation.lat, userLocation.lng, lat, lng),
        };
      })
      .filter((shop): shop is NonNullable<typeof shop> => shop !== null)
      .sort((a, b) => (a.distance ?? 0) - (b.distance ?? 0));
  }, [shops, userLocation]);

  const filteredShops = useMemo((): ShopWithDistance[] => {
    // If near me is active, use distance-sorted shops
    if (shopsWithDistance) {
      const searched = searchShops(shopsWithDistance, searchQuery) as ShopWithDistance[];
      return searched.sort((a, b) => (a.distance ?? 0) - (b.distance ?? 0));
    }

    const searched = searchShops(shops, searchQuery);
    // Sort: featured first, then by rating
    return searched.sort((a, b) => {
      const aFeatured = featuredIds.includes(a.shop_id);
      const bFeatured = featuredIds.includes(b.shop_id);
      if (aFeatured && !bFeatured) return -1;
      if (!aFeatured && bFeatured) return 1;
      return b.average_rating - a.average_rating;
    });
  }, [shops, searchQuery, featuredIds, shopsWithDistance]);

  // Calculate unique cities
  const totalCities = useMemo(() => {
    const cities = new Set(shops.map(shop => shop.city));
    return cities.size;
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
                totalNeighborhoods={totalCities}
                onNearMeClick={handleNearMeClick}
                isNearMeActive={!!userLocation}
                isLocating={isLocating}
                onClearNearMe={handleClearNearMe}
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
                      key={shop.shop_id}
                      className="animate-fade-in"
                      style={{ animationDelay: `${index * 0.05}s` }}
                    >
                      <ShopCard
                        shop={shop}
                        isFeatured={featuredIds.includes(shop.shop_id)}
                        onClick={() => setSelectedShop(shop)}
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

      {/* Shop Detail Modal */}
      <ShopDetailModal
        shop={selectedShop}
        isOpen={!!selectedShop}
        onClose={() => setSelectedShop(null)}
      />
    </div>
  );
};

export default Index;
