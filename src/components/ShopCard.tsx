import { Star, MapPin, Phone, Clock, ChevronRight, Award, ExternalLink, Navigation } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { ShopWithStats } from '@/types/mechanic';

interface ShopCardProps {
  shop: ShopWithStats & { distance?: number };
  isFeatured?: boolean;
  onClick: () => void;
}

export const ShopCard = ({ shop, isFeatured, onClick }: ShopCardProps) => {
  const formatDistance = (km: number) => {
    if (km < 1) {
      return `${Math.round(km * 1000)} m`;
    }
    return `${km.toFixed(1)} km`;
  };
  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${
          i < Math.floor(rating)
            ? 'fill-orange text-orange'
            : 'fill-gray-200 text-gray-200'
        }`}
      />
    ));
  };

  return (
    <article 
      className="group relative bg-card rounded-xl border border-border p-6 hover:shadow-lg hover:border-orange/30 transition-all duration-300 cursor-pointer"
      onClick={onClick}
    >
      {isFeatured && (
        <div className="absolute -top-3 right-4">
          <div className="flex items-center gap-1.5 bg-orange text-white px-3 py-1 rounded-full text-xs font-semibold shadow-lg">
            <Award className="h-3 w-3" />
            Destacado
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-start gap-4">
        {/* Main Content */}
        <div className="flex-1 space-y-3">
          {/* Header */}
          <div>
            <h3 className="text-lg font-bold text-foreground uppercase tracking-wide">
              {shop.shop_name}
            </h3>
          </div>

          {/* Rating */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-0.5">{renderStars(shop.average_rating)}</div>
            <span className="font-semibold text-foreground">
              {shop.average_rating > 0 ? shop.average_rating.toFixed(1) : 'Sin calificación'}
            </span>
            <span className="text-muted-foreground text-sm">
              ({shop.review_count} {shop.review_count === 1 ? 'reseña' : 'reseñas'})
            </span>
          </div>

          {/* Info Row */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <MapPin className="h-4 w-4 text-orange" />
              <span>{shop.city}</span>
            </div>
            {shop.distance !== undefined && (
              <div className="flex items-center gap-1.5">
                <Navigation className="h-4 w-4 text-orange" />
                <span className="font-medium text-orange">{formatDistance(shop.distance)}</span>
              </div>
            )}
            {shop.google_maps_url && (
              <a
                href={shop.google_maps_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-orange hover:underline"
                onClick={(e) => e.stopPropagation()}
              >
                <ExternalLink className="h-4 w-4" />
                Ver en Maps
              </a>
            )}
          </div>

          {/* Address */}
          <p className="text-sm text-muted-foreground">{shop.address}</p>
        </div>

        {/* Action */}
        <div className="flex items-center md:self-center">
          <span className="flex items-center gap-1 text-orange hover:text-orange-light font-semibold text-sm transition-colors group-hover:gap-2">
            Ver más
            <ChevronRight className="h-4 w-4" />
          </span>
        </div>
      </div>
    </article>
  );
};
