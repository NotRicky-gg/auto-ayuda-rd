import { Star, MapPin, Phone, Clock, ChevronRight, Award } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { MechanicShop } from '@/types/mechanic';

interface ShopCardProps {
  shop: MechanicShop;
  isFeatured?: boolean;
}

export const ShopCard = ({ shop, isFeatured }: ShopCardProps) => {
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
    <article className="group relative bg-card rounded-xl border border-border p-6 hover:shadow-lg hover:border-orange/30 transition-all duration-300">
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
              {shop.name}
            </h3>
            <p className="text-sm text-muted-foreground">{shop.category}</p>
          </div>

          {/* Rating */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-0.5">{renderStars(shop.rating)}</div>
            <span className="font-semibold text-foreground">{shop.rating.toFixed(1)}</span>
            <span className="text-muted-foreground text-sm">({shop.review_count} reseñas)</span>
          </div>

          {/* Info Row */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <MapPin className="h-4 w-4 text-orange" />
              <span>{shop.neighborhood}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Phone className="h-4 w-4 text-orange" />
              <span>{shop.phone}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-orange" />
              <span>{shop.hours}</span>
            </div>
          </div>

          {/* Services */}
          <div className="flex flex-wrap gap-2">
            {shop.services.slice(0, 4).map((service, index) => (
              <Badge
                key={index}
                variant="secondary"
                className="text-xs font-medium bg-muted text-muted-foreground"
              >
                {service}
              </Badge>
            ))}
            {shop.services.length > 4 && (
              <Badge variant="outline" className="text-xs text-muted-foreground">
                +{shop.services.length - 4} más
              </Badge>
            )}
          </div>
        </div>

        {/* Action */}
        <div className="flex items-center md:self-center">
          <button className="flex items-center gap-1 text-orange hover:text-orange-light font-semibold text-sm transition-colors group-hover:gap-2">
            Ver más
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </article>
  );
};
