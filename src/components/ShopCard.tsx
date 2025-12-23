import { Star, MapPin, Phone, Clock, Award } from 'lucide-react';
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
            ? 'fill-accent text-accent'
            : i < rating
            ? 'fill-accent/50 text-accent'
            : 'fill-muted text-muted'
        }`}
      />
    ));
  };

  return (
    <article
      className={`group relative bg-card rounded-xl p-6 transition-all duration-300 hover:-translate-y-1 ${
        isFeatured
          ? 'gradient-card-featured shadow-featured ring-2 ring-accent/20 animate-pulse-glow'
          : 'shadow-card hover:shadow-card-hover'
      }`}
      style={{ animationDelay: `${Math.random() * 0.5}s` }}
    >
      {isFeatured && (
        <div className="absolute -top-3 -right-3">
          <div className="flex items-center gap-1.5 bg-accent text-accent-foreground px-3 py-1.5 rounded-full text-sm font-semibold shadow-lg">
            <Award className="h-4 w-4" />
            Destacado
          </div>
        </div>
      )}

      <div className="space-y-4">
        {/* Header */}
        <div>
          <h3 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors">
            {shop.name}
          </h3>
          <p className="text-sm text-muted-foreground mt-1">{shop.category}</p>
        </div>

        {/* Rating */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-0.5">{renderStars(shop.rating)}</div>
          <span className="font-semibold text-foreground">{shop.rating.toFixed(1)}</span>
          <span className="text-muted-foreground text-sm">({shop.review_count} reseñas)</span>
        </div>

        {/* Info */}
        <div className="space-y-2 text-sm">
          <div className="flex items-start gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
            <div>
              <p className="text-foreground">{shop.address}</p>
              <p className="text-muted-foreground">{shop.neighborhood}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
            <a
              href={`tel:${shop.phone}`}
              className="text-primary hover:text-accent transition-colors font-medium"
            >
              {shop.phone}
            </a>
          </div>

          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="text-foreground">{shop.hours}</span>
          </div>
        </div>

        {/* Services */}
        <div className="flex flex-wrap gap-2 pt-2">
          {shop.services.slice(0, 4).map((service, index) => (
            <Badge
              key={index}
              variant="secondary"
              className="text-xs font-medium"
            >
              {service}
            </Badge>
          ))}
          {shop.services.length > 4 && (
            <Badge variant="outline" className="text-xs">
              +{shop.services.length - 4} más
            </Badge>
          )}
        </div>
      </div>
    </article>
  );
};
