import { useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, ExternalLink, Send, LogIn, MessageSquare, UserPlus } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { StarRating } from '@/components/StarRating';
import type { ShopWithStats, Review } from '@/types/mechanic';
import { submitReview, fetchShopReviews, checkExistingReview } from '@/services/mechanicService';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface ShopDetailModalProps {
  shop: ShopWithStats | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ShopDetailModal = ({ shop, isOpen, onClose }: ShopDetailModalProps) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: reviews = [], isLoading: reviewsLoading } = useQuery({
    queryKey: ['reviews', shop?.shop_id],
    queryFn: () => fetchShopReviews(shop!.shop_id),
    enabled: !!shop?.shop_id,
  });

  const { data: hasExistingReview } = useQuery({
    queryKey: ['existingReview', shop?.shop_id, user?.id],
    queryFn: () => checkExistingReview(shop!.shop_id, user!.id),
    enabled: !!shop?.shop_id && !!user?.id,
  });

  const mutation = useMutation({
    mutationFn: () => {
      const reviewerName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Anónimo';
      return submitReview(shop!.shop_id, user!.id, reviewerName, rating, comment);
    },
    onSuccess: () => {
      toast({
        title: '¡Reseña enviada!',
        description: 'Gracias por compartir tu experiencia.',
      });
      setRating(0);
      setComment('');
      queryClient.invalidateQueries({ queryKey: ['reviews', shop?.shop_id] });
      queryClient.invalidateQueries({ queryKey: ['existingReview', shop?.shop_id, user?.id] });
      queryClient.invalidateQueries({ queryKey: ['shopRatings'] });
    },
    onError: (error: any) => {
      if (error.code === '23505') {
        toast({
          title: 'Ya dejaste una reseña',
          description: 'Solo puedes dejar una reseña por taller.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Error',
          description: 'No se pudo enviar la reseña. Intenta de nuevo.',
          variant: 'destructive',
        });
      }
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      toast({
        title: 'Selecciona una calificación',
        description: 'Por favor selecciona al menos una estrella.',
        variant: 'destructive',
      });
      return;
    }
    if (!comment.trim()) {
      toast({
        title: 'Escribe un comentario',
        description: 'Por favor comparte tu experiencia.',
        variant: 'destructive',
      });
      return;
    }
    mutation.mutate();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-DO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (!shop) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-card">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold uppercase tracking-wide text-foreground pr-8">
            {shop.shop_name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Shop Info */}
          <div className="bg-navy rounded-xl p-6 text-white">
            <div className="flex items-center gap-3 mb-4">
              <StarRating value={shop.average_rating} readonly size="md" />
              <span className="font-semibold text-lg">
                {shop.average_rating > 0 ? shop.average_rating.toFixed(1) : 'Sin calificación'}
              </span>
              <span className="text-gray-400 text-sm">
                ({shop.review_count} {shop.review_count === 1 ? 'reseña' : 'reseñas'})
              </span>
            </div>

            <div className="flex items-start gap-3 text-gray-300">
              <MapPin className="h-5 w-5 text-orange shrink-0 mt-0.5" />
              <div>
                <p>{shop.address}</p>
                <p className="font-medium text-white">{shop.city}</p>
              </div>
            </div>

            {shop.google_maps_url && (
              <a
                href={shop.google_maps_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-orange hover:text-orange-light font-medium mt-4 transition-colors"
              >
                <ExternalLink className="h-4 w-4" />
                Ver en Google Maps
              </a>
            )}
          </div>

          {/* Review Form */}
          <div className="bg-muted rounded-xl p-6">
            <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-orange" />
              Deja tu reseña
            </h3>

            {user ? (
              hasExistingReview ? (
                <div className="text-center py-8">
                  <div className="h-16 w-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
                    <MessageSquare className="h-8 w-8 text-green-500" />
                  </div>
                  <h4 className="text-lg font-semibold text-foreground mb-2">
                    Ya dejaste tu reseña
                  </h4>
                  <p className="text-muted-foreground">
                    Solo puedes dejar una reseña por taller. ¡Gracias por compartir tu experiencia!
                  </p>
                </div>
              ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* User Info */}
                <div className="flex items-center gap-3 pb-4 border-b border-border">
                  <div className="h-10 w-10 rounded-full bg-orange flex items-center justify-center text-white font-bold">
                    {user.user_metadata?.full_name?.charAt(0) || user.email?.charAt(0)?.toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium text-foreground">
                      {user.user_metadata?.full_name || user.email?.split('@')[0]}
                    </p>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                  </div>
                </div>

                {/* Star Rating */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-3">
                    ¿Cómo calificarías este taller?
                  </label>
                  <div className="flex items-center gap-4">
                    <StarRating value={rating} onChange={setRating} size="lg" />
                    {rating > 0 && (
                      <span className="text-sm text-muted-foreground">
                        {rating === 1 && 'Malo'}
                        {rating === 2 && 'Regular'}
                        {rating === 3 && 'Bueno'}
                        {rating === 4 && 'Muy bueno'}
                        {rating === 5 && 'Excelente'}
                      </span>
                    )}
                  </div>
                </div>

                {/* Comment */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Cuéntanos tu experiencia
                  </label>
                  <Textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="¿Cómo fue el servicio? ¿Lo recomendarías?"
                    rows={4}
                    maxLength={500}
                    className="resize-none bg-card border-border"
                  />
                  <p className="text-xs text-muted-foreground mt-1 text-right">
                    {comment.length}/500 caracteres
                  </p>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-orange hover:bg-orange-light text-white font-semibold h-12 text-base gap-2"
                  disabled={mutation.isPending}
                >
                  <Send className="h-5 w-5" />
                  {mutation.isPending ? 'Enviando...' : 'Publicar Reseña'}
                </Button>
              </form>
              )
            ) : (
              <div className="text-center py-8">
                <div className="h-16 w-16 rounded-full bg-orange/10 flex items-center justify-center mx-auto mb-4">
                  <LogIn className="h-8 w-8 text-orange" />
                </div>
                <h4 className="text-lg font-semibold text-foreground mb-2">
                  Inicia sesión para dejar tu reseña
                </h4>
                <p className="text-muted-foreground mb-6">
                  Comparte tu experiencia con otros usuarios
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button
                    asChild
                    variant="outline"
                    className="gap-2"
                  >
                    <Link to="/auth">
                      <LogIn className="h-4 w-4" />
                      Iniciar Sesión
                    </Link>
                  </Button>
                  <Button
                    asChild
                    className="bg-orange hover:bg-orange-light text-white gap-2"
                  >
                    <Link to="/auth">
                      <UserPlus className="h-4 w-4" />
                      Crear Cuenta
                    </Link>
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Reviews List */}
          <div>
            <h3 className="text-lg font-bold text-foreground mb-4">
              Reseñas ({reviews.length})
            </h3>

            {reviewsLoading ? (
              <div className="space-y-4">
                {[1, 2].map((i) => (
                  <div key={i} className="bg-card border border-border rounded-xl p-4 animate-pulse">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="h-10 w-10 rounded-full bg-muted" />
                      <div className="space-y-2">
                        <div className="h-4 w-24 bg-muted rounded" />
                        <div className="h-3 w-16 bg-muted rounded" />
                      </div>
                    </div>
                    <div className="h-4 w-full bg-muted rounded mb-2" />
                    <div className="h-4 w-2/3 bg-muted rounded" />
                  </div>
                ))}
              </div>
            ) : reviews.length === 0 ? (
              <div className="text-center py-10 bg-card border border-border rounded-xl">
                <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">
                  Aún no hay reseñas. ¡Sé el primero en opinar!
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {reviews.map((review: Review) => (
                  <div key={review.id} className="bg-card border border-border rounded-xl p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-orange/10 flex items-center justify-center text-orange font-bold">
                          {review.reviewer_name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">{review.reviewer_name}</p>
                          <p className="text-sm text-muted-foreground">
                            {formatDate(review.created_at)}
                          </p>
                        </div>
                      </div>
                      <StarRating value={review.rating} readonly size="sm" />
                    </div>
                    <p className="text-foreground leading-relaxed">{review.comment}</p>
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
