import { useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, ExternalLink, Send, LogIn, MessageSquare, UserPlus, Phone, Clock } from 'lucide-react';
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

  // Generate Google Maps embed URL from coordinates or address
  const getMapEmbedUrl = () => {
    if (shop?.latitude && shop?.longitude) {
      return `https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3000!2d${shop.longitude}!3d${shop.latitude}!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zM!5e0!3m2!1ses!2sdo!4v1234567890`;
    }
    if (shop?.address && shop?.city) {
      const query = encodeURIComponent(`${shop.address}, ${shop.city}, República Dominicana`);
      return `https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3000!2d0!3d0!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s${query}!5e0!3m2!1ses!2sdo`;
    }
    return null;
  };

  if (!shop) return null;

  const mapEmbedUrl = getMapEmbedUrl();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-card">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold uppercase tracking-wide text-foreground pr-8">
            {shop.shop_name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Rating Summary */}
          <div className="flex items-center gap-3">
            <StarRating value={shop.average_rating} readonly size="md" />
            <span className="font-semibold text-lg text-foreground">
              {shop.average_rating > 0 ? shop.average_rating.toFixed(1) : 'Sin calificación'}
            </span>
            <span className="text-muted-foreground text-sm">
              ({shop.review_count} {shop.review_count === 1 ? 'reseña' : 'reseñas'})
            </span>
          </div>

          {/* Shop Info Card */}
          <div className="bg-navy rounded-xl p-6 text-white space-y-4">
            {/* Address */}
            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 text-orange shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-gray-400 mb-1">Dirección</p>
                <p>{shop.address}</p>
                <p className="font-medium">{shop.city}</p>
              </div>
            </div>

            {/* Phone */}
            {shop.phone && (
              <div className="flex items-start gap-3">
                <Phone className="h-5 w-5 text-orange shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-gray-400 mb-1">Teléfono</p>
                  <div className="flex items-center gap-3">
                    <a 
                      href={`tel:${shop.phone}`} 
                      className="hover:text-orange transition-colors"
                    >
                      {shop.phone}
                    </a>
                    <a
                      href={`https://wa.me/${shop.phone.replace(/[^0-9]/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-green-500 hover:bg-green-600 transition-colors"
                      title="Enviar mensaje por WhatsApp"
                    >
                      <svg 
                        viewBox="0 0 24 24" 
                        className="h-4 w-4 text-white" 
                        fill="currentColor"
                      >
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                      </svg>
                    </a>
                  </div>
                </div>
              </div>
            )}

            {/* Schedule */}
            {shop.schedule && (
              <div className="flex items-start gap-3">
                <Clock className="h-5 w-5 text-orange shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-400 mb-1">Horario</p>
                  <p className="whitespace-pre-line">{shop.schedule}</p>
                </div>
              </div>
            )}

            {/* Google Maps Link */}
            {shop.google_maps_url && (
              <a
                href={shop.google_maps_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-orange hover:text-orange-light font-medium transition-colors"
              >
                <ExternalLink className="h-4 w-4" />
                Ver en Google Maps
              </a>
            )}
          </div>

          {/* Map Embed */}
          {(shop.latitude && shop.longitude) || (shop.address && shop.city) ? (
            <div className="rounded-xl overflow-hidden border border-border h-[200px]">
              <iframe
                src={`https://maps.google.com/maps?q=${
                  shop.latitude && shop.longitude 
                    ? `${shop.latitude},${shop.longitude}` 
                    : encodeURIComponent(`${shop.address}, ${shop.city}, República Dominicana`)
                }&t=&z=15&ie=UTF8&iwloc=&output=embed`}
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title={`Ubicación de ${shop.shop_name}`}
              />
            </div>
          ) : null}

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
