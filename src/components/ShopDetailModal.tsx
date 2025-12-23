import { useState } from 'react';
import { Star, X, MapPin, ExternalLink, Send } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import type { ShopWithStats, Review } from '@/types/mechanic';
import { submitReview, fetchShopReviews } from '@/services/mechanicService';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface ShopDetailModalProps {
  shop: ShopWithStats | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ShopDetailModal = ({ shop, isOpen, onClose }: ShopDetailModalProps) => {
  const [reviewerName, setReviewerName] = useState('');
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: reviews = [], isLoading: reviewsLoading } = useQuery({
    queryKey: ['reviews', shop?.shop_id],
    queryFn: () => fetchShopReviews(shop!.shop_id),
    enabled: !!shop?.shop_id,
  });

  const mutation = useMutation({
    mutationFn: () => submitReview(shop!.shop_id, reviewerName, rating, comment),
    onSuccess: () => {
      toast({
        title: '¡Reseña enviada!',
        description: 'Gracias por tu opinión.',
      });
      setReviewerName('');
      setRating(0);
      setComment('');
      queryClient.invalidateQueries({ queryKey: ['reviews', shop?.shop_id] });
      queryClient.invalidateQueries({ queryKey: ['shopRatings'] });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'No se pudo enviar la reseña. Intenta de nuevo.',
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewerName.trim() || rating === 0 || !comment.trim()) {
      toast({
        title: 'Campos requeridos',
        description: 'Por favor completa todos los campos.',
        variant: 'destructive',
      });
      return;
    }
    mutation.mutate();
  };

  if (!shop) return null;

  const renderStars = (value: number, interactive = false) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-5 w-5 cursor-pointer transition-colors ${
          i < (interactive ? (hoverRating || rating) : value)
            ? 'fill-orange text-orange'
            : 'fill-gray-200 text-gray-200'
        }`}
        onClick={interactive ? () => setRating(i + 1) : undefined}
        onMouseEnter={interactive ? () => setHoverRating(i + 1) : undefined}
        onMouseLeave={interactive ? () => setHoverRating(0) : undefined}
      />
    ));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-DO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold uppercase tracking-wide pr-8">
            {shop.shop_name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Shop Info */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-0.5">{renderStars(shop.average_rating)}</div>
              <span className="font-semibold">
                {shop.average_rating > 0 ? shop.average_rating.toFixed(1) : 'Sin calificación'}
              </span>
              <span className="text-muted-foreground text-sm">
                ({shop.review_count} {shop.review_count === 1 ? 'reseña' : 'reseñas'})
              </span>
            </div>

            <div className="flex items-start gap-2 text-muted-foreground">
              <MapPin className="h-5 w-5 text-orange shrink-0 mt-0.5" />
              <div>
                <p>{shop.address}</p>
                <p className="font-medium text-foreground">{shop.city}</p>
              </div>
            </div>

            {shop.google_maps_url && (
              <a
                href={shop.google_maps_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-orange hover:underline font-medium"
              >
                <ExternalLink className="h-4 w-4" />
                Ver en Google Maps
              </a>
            )}
          </div>

          {/* Review Form */}
          <div className="bg-muted rounded-xl p-6">
            <h3 className="text-lg font-semibold mb-4">Deja tu reseña</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Tu nombre</label>
                <Input
                  value={reviewerName}
                  onChange={(e) => setReviewerName(e.target.value)}
                  placeholder="Ingresa tu nombre"
                  maxLength={100}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Calificación</label>
                <div className="flex items-center gap-1">
                  {renderStars(rating, true)}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Comentario</label>
                <Textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Comparte tu experiencia..."
                  rows={3}
                  maxLength={500}
                />
              </div>

              <Button 
                type="submit" 
                className="w-full bg-orange hover:bg-orange-light text-white font-semibold gap-2"
                disabled={mutation.isPending}
              >
                <Send className="h-4 w-4" />
                {mutation.isPending ? 'Enviando...' : 'Enviar Reseña'}
              </Button>
            </form>
          </div>

          {/* Reviews List */}
          <div>
            <h3 className="text-lg font-semibold mb-4">
              Reseñas ({reviews.length})
            </h3>

            {reviewsLoading ? (
              <p className="text-muted-foreground text-center py-4">Cargando reseñas...</p>
            ) : reviews.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                Aún no hay reseñas. ¡Sé el primero en opinar!
              </p>
            ) : (
              <div className="space-y-4">
                {reviews.map((review: Review) => (
                  <div key={review.id} className="bg-card border border-border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold">{review.reviewer_name}</span>
                      <span className="text-sm text-muted-foreground">
                        {formatDate(review.created_at)}
                      </span>
                    </div>
                    <div className="flex items-center gap-0.5 mb-2">
                      {renderStars(review.rating)}
                    </div>
                    <p className="text-muted-foreground">{review.comment}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
