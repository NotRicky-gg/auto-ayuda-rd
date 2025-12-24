import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { StarRating } from '@/components/StarRating';
import { ShopCard } from '@/components/ShopCard';
import { ShopDetailModal } from '@/components/ShopDetailModal';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { fetchUserReviews, fetchUserFavorites, updateReview } from '@/services/mechanicService';
import type { Review, ShopRating, ShopWithStats } from '@/types/mechanic';
import { User, MessageSquare, Star, MapPin, Calendar, Heart, Pencil, X, Check, KeyRound, Loader2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';

const UserProfile = () => {
  const { user, loading: authLoading } = useAuth();
  const [selectedShop, setSelectedShop] = useState<ShopWithStats | null>(null);
  const [editingReviewId, setEditingReviewId] = useState<string | null>(null);
  const [editRating, setEditRating] = useState(0);
  const [editComment, setEditComment] = useState('');
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch user's reviews
  const { data: reviews = [], isLoading: reviewsLoading } = useQuery({
    queryKey: ['userReviews', user?.id],
    queryFn: () => fetchUserReviews(user!.id),
    enabled: !!user?.id,
  });

  // Fetch user's favorites
  const { data: favorites = [], isLoading: favoritesLoading } = useQuery({
    queryKey: ['userFavorites', user?.id],
    queryFn: () => fetchUserFavorites(user!.id),
    enabled: !!user?.id,
  });

  // Mutation for updating reviews
  const updateReviewMutation = useMutation({
    mutationFn: ({ reviewId, rating, comment }: { reviewId: string; rating: number; comment: string }) =>
      updateReview(reviewId, rating, comment),
    onSuccess: () => {
      toast({
        title: '¡Reseña actualizada!',
        description: 'Tu reseña ha sido modificada exitosamente.',
      });
      setEditingReviewId(null);
      queryClient.invalidateQueries({ queryKey: ['userReviews', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['shopRatings'] });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'No se pudo actualizar la reseña. Intenta de nuevo.',
        variant: 'destructive',
      });
    },
  });

  const handleStartEdit = (review: Review) => {
    setEditingReviewId(review.id);
    setEditRating(review.rating);
    setEditComment(review.comment);
  };

  const handleCancelEdit = () => {
    setEditingReviewId(null);
    setEditRating(0);
    setEditComment('');
  };

  const handleSaveEdit = (reviewId: string) => {
    if (editRating === 0) {
      toast({
        title: 'Selecciona una calificación',
        description: 'Por favor selecciona al menos una estrella.',
        variant: 'destructive',
      });
      return;
    }
    if (!editComment.trim()) {
      toast({
        title: 'Escribe un comentario',
        description: 'Por favor comparte tu experiencia.',
        variant: 'destructive',
      });
      return;
    }
    updateReviewMutation.mutate({ reviewId, rating: editRating, comment: editComment });
  };

  const handleResetPassword = async () => {
    if (!user?.email) return;
    
    setIsResettingPassword(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: `${window.location.origin}/auth`,
      });
      
      if (error) throw error;
      
      toast({
        title: 'Correo enviado',
        description: 'Revisa tu bandeja de entrada para restablecer tu contraseña.',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'No se pudo enviar el correo de restablecimiento.',
        variant: 'destructive',
      });
    } finally {
      setIsResettingPassword(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-DO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Calculate stats
  const totalReviews = reviews.length;
  const averageRatingGiven = totalReviews > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
    : 0;

  // Loading state
  if (authLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <div className="animate-pulse text-muted-foreground">Cargando...</div>
        </main>
        <Footer />
      </div>
    );
  }

  // Not logged in
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  const userName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Usuario';
  const userInitial = userName.charAt(0).toUpperCase();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <main className="flex-1">
        <div className="container py-8">
          {/* Profile Header */}
          <Card className="mb-8">
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
                {/* Avatar */}
                <Avatar className="h-24 w-24">
                  <AvatarImage src={user.user_metadata?.avatar_url} alt={userName} />
                  <AvatarFallback className="bg-orange text-white text-3xl">
                    {userInitial}
                  </AvatarFallback>
                </Avatar>

                {/* User Info */}
                <div className="flex-1 text-center md:text-left">
                  <h1 className="text-2xl font-bold text-foreground mb-1">{userName}</h1>
                  <p className="text-muted-foreground mb-4">{user.email}</p>
                  
                  <div className="flex flex-wrap justify-center md:justify-start gap-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      Miembro desde {formatDate(user.created_at || new Date().toISOString())}
                    </div>
                  </div>

                  {/* Reset Password Button */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleResetPassword}
                    disabled={isResettingPassword}
                    className="mt-4 gap-2"
                  >
                    {isResettingPassword ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <KeyRound className="h-4 w-4" />
                    )}
                    {isResettingPassword ? 'Enviando...' : 'Cambiar contraseña'}
                  </Button>
                </div>

                <div className="flex gap-6">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-foreground">{favorites.length}</p>
                    <p className="text-sm text-muted-foreground">Favoritos</p>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-foreground">{totalReviews}</p>
                    <p className="text-sm text-muted-foreground">Reseñas</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Star className="h-5 w-5 fill-orange text-orange" />
                      <span className="text-3xl font-bold text-foreground">
                        {averageRatingGiven > 0 ? averageRatingGiven.toFixed(1) : '-'}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">Promedio</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tabs for Reviews and Favorites */}
          <Tabs defaultValue="reviews" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="reviews" className="gap-2">
                <MessageSquare className="h-4 w-4" />
                Reseñas ({reviews.length})
              </TabsTrigger>
              <TabsTrigger value="favorites" className="gap-2">
                <Heart className="h-4 w-4" />
                Favoritos ({favorites.length})
              </TabsTrigger>
            </TabsList>

            {/* Favorites Tab */}
            <TabsContent value="favorites">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Heart className="h-5 w-5 text-red-500" />
                    Mis Favoritos
                  </CardTitle>
                  <CardDescription>
                    Talleres que has guardado
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {favoritesLoading ? (
                    <div className="space-y-4">
                      {[1, 2].map(i => (
                        <div key={i} className="border border-border rounded-lg p-4 animate-pulse">
                          <div className="h-5 bg-muted rounded w-1/3 mb-2" />
                          <div className="h-4 bg-muted rounded w-full" />
                        </div>
                      ))}
                    </div>
                  ) : favorites.length === 0 ? (
                    <div className="text-center py-12">
                      <Heart className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-foreground mb-2">
                        No tienes favoritos aún
                      </h3>
                      <p className="text-muted-foreground">
                        Guarda talleres que te gusten para encontrarlos fácilmente.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {favorites.map((shop) => (
                        <ShopCard
                          key={shop.shop_id}
                          shop={shop}
                          onClick={() => setSelectedShop(shop)}
                        />
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Reviews Tab */}
            <TabsContent value="reviews">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5 text-orange" />
                    Mis Reseñas
                  </CardTitle>
                  <CardDescription>
                    Todas las reseñas que has dejado en talleres
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {reviewsLoading ? (
                    <div className="space-y-4">
                      {[1, 2, 3].map(i => (
                        <div key={i} className="border border-border rounded-lg p-4 animate-pulse">
                          <div className="h-5 bg-muted rounded w-1/3 mb-2" />
                          <div className="h-4 bg-muted rounded w-full mb-2" />
                          <div className="h-4 bg-muted rounded w-2/3" />
                        </div>
                      ))}
                    </div>
                  ) : reviews.length === 0 ? (
                    <div className="text-center py-12">
                      <MessageSquare className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-foreground mb-2">
                        Aún no has dejado reseñas
                      </h3>
                      <p className="text-muted-foreground">
                        Visita talleres y comparte tu experiencia con otros usuarios.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {reviews.map((review: Review & { shop?: ShopRating }) => (
                        <div key={review.id} className="border border-border rounded-lg p-5 hover:border-orange/30 transition-colors">
                          {/* Shop Info */}
                          {review.shop && (
                            <div className="flex items-center gap-3 mb-3 pb-3 border-b border-border">
                              <div className="h-10 w-10 rounded-lg bg-navy flex items-center justify-center">
                                <MapPin className="h-5 w-5 text-orange" />
                              </div>
                              <div className="flex-1">
                                <h4 className="font-semibold text-foreground uppercase">
                                  {review.shop.shop_name}
                                </h4>
                                <p className="text-sm text-muted-foreground">
                                  {review.shop.city}
                                </p>
                              </div>
                              {/* Edit button - only show if not already edited */}
                              {!review.has_been_edited && editingReviewId !== review.id && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleStartEdit(review)}
                                  className="gap-1 text-muted-foreground hover:text-orange"
                                >
                                  <Pencil className="h-4 w-4" />
                                  Editar
                                </Button>
                              )}
                              {review.has_been_edited && (
                                <span className="text-xs text-muted-foreground italic">
                                  Editada
                                </span>
                              )}
                            </div>
                          )}

                          {/* Edit Mode */}
                          {editingReviewId === review.id ? (
                            <div className="space-y-4">
                              <div>
                                <label className="block text-sm font-medium text-foreground mb-2">
                                  Calificación
                                </label>
                                <StarRating value={editRating} onChange={setEditRating} size="md" />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-foreground mb-2">
                                  Comentario
                                </label>
                                <Textarea
                                  value={editComment}
                                  onChange={(e) => setEditComment(e.target.value)}
                                  placeholder="Cuéntanos tu experiencia..."
                                  rows={4}
                                  maxLength={500}
                                  className="resize-none"
                                />
                                <p className="text-xs text-muted-foreground mt-1 text-right">
                                  {editComment.length}/500 caracteres
                                </p>
                              </div>
                              <div className="flex gap-2 justify-end">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={handleCancelEdit}
                                  disabled={updateReviewMutation.isPending}
                                >
                                  <X className="h-4 w-4 mr-1" />
                                  Cancelar
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() => handleSaveEdit(review.id)}
                                  disabled={updateReviewMutation.isPending}
                                  className="bg-orange hover:bg-orange-light text-white"
                                >
                                  <Check className="h-4 w-4 mr-1" />
                                  {updateReviewMutation.isPending ? 'Guardando...' : 'Guardar'}
                                </Button>
                              </div>
                              <p className="text-xs text-amber-600 dark:text-amber-400">
                                ⚠️ Solo puedes editar tu reseña una vez. Asegúrate de que esté correcta antes de guardar.
                              </p>
                            </div>
                          ) : (
                            <>
                              {/* Review Content */}
                              <div className="flex items-start justify-between mb-3">
                                <div>
                                  <StarRating value={review.rating} readonly size="sm" />
                                  <p className="text-sm text-muted-foreground mt-1">
                                    {formatDate(review.created_at)}
                                    {review.updated_at && (
                                      <span className="ml-2 italic">
                                        (editada el {formatDate(review.updated_at)})
                                      </span>
                                    )}
                                  </p>
                                </div>
                              </div>
                              <p className="text-foreground leading-relaxed">{review.comment}</p>
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
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

export default UserProfile;