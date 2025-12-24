import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { StarRating } from '@/components/StarRating';
import { EditShopModal } from '@/components/EditShopModal';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { 
  fetchOwnedShops, 
  fetchShopReviewsWithReplies, 
  submitReviewReply,
  updateReviewReply,
  checkIsShopOwner
} from '@/services/mechanicService';
import type { ShopWithStats, Review, ReviewReply } from '@/types/mechanic';
import { Building2, MessageSquare, Send, Edit2, X, Check, Star, MapPin, FileEdit } from 'lucide-react';
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

const OwnerDashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedShopId, setSelectedShopId] = useState<string | null>(null);
  const [replyingToReview, setReplyingToReview] = useState<string | null>(null);
  const [editingReply, setEditingReply] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [editShopModalOpen, setEditShopModalOpen] = useState(false);

  // Check if user is a shop owner
  const { data: isOwner, isLoading: ownerCheckLoading } = useQuery({
    queryKey: ['isShopOwner', user?.id],
    queryFn: () => checkIsShopOwner(user!.id),
    enabled: !!user?.id,
  });

  // Fetch owned shops
  const { data: ownedShops = [], isLoading: shopsLoading } = useQuery({
    queryKey: ['ownedShops', user?.id],
    queryFn: () => fetchOwnedShops(user!.id),
    enabled: !!user?.id && isOwner === true,
  });

  // Set initial selected shop when ownedShops loads
  useEffect(() => {
    if (ownedShops.length > 0 && !selectedShopId) {
      setSelectedShopId(ownedShops[0].shop_id);
    }
  }, [ownedShops, selectedShopId]);

  // Fetch reviews for selected shop
  const { data: reviews = [], isLoading: reviewsLoading } = useQuery({
    queryKey: ['shopReviewsWithReplies', selectedShopId],
    queryFn: () => fetchShopReviewsWithReplies(selectedShopId!),
    enabled: !!selectedShopId,
  });

  // Submit reply mutation
  const submitReplyMutation = useMutation({
    mutationFn: ({ reviewId, shopId }: { reviewId: string; shopId: string }) =>
      submitReviewReply(reviewId, shopId, user!.id, replyText),
    onSuccess: () => {
      toast({
        title: '¡Respuesta enviada!',
        description: 'Tu respuesta ha sido publicada.',
      });
      setReplyingToReview(null);
      setReplyText('');
      queryClient.invalidateQueries({ queryKey: ['shopReviewsWithReplies', selectedShopId] });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'No se pudo enviar la respuesta.',
        variant: 'destructive',
      });
    },
  });

  // Update reply mutation
  const updateReplyMutation = useMutation({
    mutationFn: (replyId: string) => updateReviewReply(replyId, replyText),
    onSuccess: () => {
      toast({
        title: '¡Respuesta actualizada!',
        description: 'Tu respuesta ha sido modificada.',
      });
      setEditingReply(null);
      setReplyText('');
      queryClient.invalidateQueries({ queryKey: ['shopReviewsWithReplies', selectedShopId] });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'No se pudo actualizar la respuesta.',
        variant: 'destructive',
      });
    },
  });

  const handleStartReply = (reviewId: string) => {
    setReplyingToReview(reviewId);
    setEditingReply(null);
    setReplyText('');
  };

  const handleStartEdit = (reply: ReviewReply) => {
    setEditingReply(reply.id);
    setReplyingToReview(null);
    setReplyText(reply.reply_text);
  };

  const handleCancelReply = () => {
    setReplyingToReview(null);
    setEditingReply(null);
    setReplyText('');
  };

  const handleSubmitReply = (reviewId: string, shopId: string) => {
    if (!replyText.trim()) {
      toast({
        title: 'Escribe una respuesta',
        description: 'La respuesta no puede estar vacía.',
        variant: 'destructive',
      });
      return;
    }
    submitReplyMutation.mutate({ reviewId, shopId });
  };

  const handleUpdateReply = (replyId: string) => {
    if (!replyText.trim()) {
      toast({
        title: 'Escribe una respuesta',
        description: 'La respuesta no puede estar vacía.',
        variant: 'destructive',
      });
      return;
    }
    updateReplyMutation.mutate(replyId);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-DO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Loading state
  if (authLoading || ownerCheckLoading) {
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

  // Not a shop owner
  if (isOwner === false) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <Card className="max-w-md mx-4">
            <CardHeader className="text-center">
              <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                <Building2 className="h-8 w-8 text-muted-foreground" />
              </div>
              <CardTitle>No tienes talleres registrados</CardTitle>
              <CardDescription>
                Esta sección es exclusiva para propietarios de talleres.
                Si eres dueño de un taller y deseas gestionarlo, contacta al administrador.
              </CardDescription>
            </CardHeader>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  const selectedShop = ownedShops.find(s => s.shop_id === selectedShopId);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <main className="flex-1">
        <div className="container py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">Panel de Propietario</h1>
            <p className="text-muted-foreground">
              Gestiona tus talleres y responde a las reseñas de tus clientes
            </p>
          </div>

          {shopsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2].map(i => (
                <Card key={i} className="animate-pulse">
                  <CardHeader>
                    <div className="h-6 bg-muted rounded w-3/4" />
                    <div className="h-4 bg-muted rounded w-1/2 mt-2" />
                  </CardHeader>
                </Card>
              ))}
            </div>
          ) : ownedShops.length === 0 ? (
            <Card>
              <CardHeader className="text-center">
                <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <CardTitle>No tienes talleres asignados</CardTitle>
                <CardDescription>
                  Contacta al administrador para vincular tu cuenta con tu taller.
                </CardDescription>
              </CardHeader>
            </Card>
          ) : (
            <Tabs 
              value={selectedShopId || ownedShops[0]?.shop_id} 
              onValueChange={setSelectedShopId}
              className="space-y-6"
            >
              <TabsList className="w-full justify-start flex-wrap h-auto gap-2 bg-transparent p-0">
                {ownedShops.map(shop => (
                  <TabsTrigger
                    key={shop.shop_id}
                    value={shop.shop_id}
                    className="data-[state=active]:bg-orange data-[state=active]:text-white px-4 py-2 rounded-lg border border-border"
                  >
                    <Building2 className="h-4 w-4 mr-2" />
                    {shop.shop_name}
                  </TabsTrigger>
                ))}
              </TabsList>

              {ownedShops.map(shop => (
                <TabsContent key={shop.shop_id} value={shop.shop_id} className="space-y-6">
                  {/* Edit Shop Button */}
                  <div className="flex justify-end">
                    <Button
                      variant="outline"
                      className="gap-2 border-orange text-orange hover:bg-orange hover:text-white"
                      onClick={() => setEditShopModalOpen(true)}
                    >
                      <FileEdit className="h-4 w-4" />
                      Solicitar cambios
                    </Button>
                  </div>

                  {/* Shop Stats */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardDescription>Calificación promedio</CardDescription>
                        <CardTitle className="text-3xl flex items-center gap-2">
                          <Star className="h-6 w-6 fill-orange text-orange" />
                          {shop.average_rating > 0 ? shop.average_rating.toFixed(1) : 'N/A'}
                        </CardTitle>
                      </CardHeader>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardDescription>Total de reseñas</CardDescription>
                        <CardTitle className="text-3xl flex items-center gap-2">
                          <MessageSquare className="h-6 w-6 text-orange" />
                          {shop.review_count}
                        </CardTitle>
                      </CardHeader>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardDescription>Ubicación</CardDescription>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <MapPin className="h-5 w-5 text-orange" />
                          {shop.city}
                        </CardTitle>
                      </CardHeader>
                    </Card>
                  </div>

                  {/* Reviews Section */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <MessageSquare className="h-5 w-5 text-orange" />
                        Reseñas de clientes
                      </CardTitle>
                      <CardDescription>
                        Responde a las reseñas para interactuar con tus clientes
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {reviewsLoading ? (
                        <div className="space-y-4">
                          {[1, 2].map(i => (
                            <div key={i} className="border border-border rounded-lg p-4 animate-pulse">
                              <div className="h-4 bg-muted rounded w-1/4 mb-2" />
                              <div className="h-4 bg-muted rounded w-3/4" />
                            </div>
                          ))}
                        </div>
                      ) : reviews.length === 0 ? (
                        <div className="text-center py-10">
                          <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                          <p className="text-muted-foreground">
                            Aún no hay reseñas para este taller.
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {reviews.map((review: Review & { reply?: ReviewReply }) => (
                            <div key={review.id} className="border border-border rounded-lg p-4">
                              {/* Review Header */}
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-3">
                                  <div className="h-10 w-10 rounded-full bg-orange/10 flex items-center justify-center text-orange font-bold">
                                    {(review.reviewer_name || 'A').charAt(0).toUpperCase()}
                                  </div>
                                  <div>
                                    <p className="font-semibold text-foreground">
                                      {review.reviewer_name || 'Anónimo'}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                      {formatDate(review.created_at)}
                                    </p>
                                  </div>
                                </div>
                                <StarRating value={review.rating} readonly size="sm" />
                              </div>

                              {/* Review Content */}
                              <p className="text-foreground mb-4">{review.comment}</p>

                              {/* Existing Reply */}
                              {review.reply && editingReply !== review.reply.id && (
                                <div className="bg-muted rounded-lg p-4 ml-6 border-l-4 border-orange">
                                  <div className="flex items-center justify-between mb-2">
                                    <p className="text-sm font-semibold text-orange">
                                      Tu respuesta
                                    </p>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleStartEdit(review.reply!)}
                                      className="h-8 px-2"
                                    >
                                      <Edit2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                  <p className="text-foreground text-sm">{review.reply.reply_text}</p>
                                  <p className="text-xs text-muted-foreground mt-2">
                                    {formatDate(review.reply.updated_at || review.reply.created_at)}
                                  </p>
                                </div>
                              )}

                              {/* Edit Reply Form */}
                              {editingReply === review.reply?.id && (
                                <div className="ml-6 space-y-3">
                                  <Textarea
                                    value={replyText}
                                    onChange={(e) => setReplyText(e.target.value)}
                                    placeholder="Edita tu respuesta..."
                                    rows={3}
                                    className="resize-none"
                                  />
                                  <div className="flex gap-2">
                                    <Button
                                      size="sm"
                                      onClick={() => handleUpdateReply(review.reply!.id)}
                                      disabled={updateReplyMutation.isPending}
                                      className="bg-orange hover:bg-orange-light"
                                    >
                                      <Check className="h-4 w-4 mr-1" />
                                      {updateReplyMutation.isPending ? 'Guardando...' : 'Guardar'}
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={handleCancelReply}
                                    >
                                      <X className="h-4 w-4 mr-1" />
                                      Cancelar
                                    </Button>
                                  </div>
                                </div>
                              )}

                              {/* Reply Form */}
                              {!review.reply && replyingToReview === review.id && (
                                <div className="ml-6 space-y-3">
                                  <Textarea
                                    value={replyText}
                                    onChange={(e) => setReplyText(e.target.value)}
                                    placeholder="Escribe tu respuesta al cliente..."
                                    rows={3}
                                    className="resize-none"
                                  />
                                  <div className="flex gap-2">
                                    <Button
                                      size="sm"
                                      onClick={() => handleSubmitReply(review.id, shop.shop_id)}
                                      disabled={submitReplyMutation.isPending}
                                      className="bg-orange hover:bg-orange-light"
                                    >
                                      <Send className="h-4 w-4 mr-1" />
                                      {submitReplyMutation.isPending ? 'Enviando...' : 'Responder'}
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={handleCancelReply}
                                    >
                                      <X className="h-4 w-4 mr-1" />
                                      Cancelar
                                    </Button>
                                  </div>
                                </div>
                              )}

                              {/* Reply Button */}
                              {!review.reply && replyingToReview !== review.id && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleStartReply(review.id)}
                                  className="ml-6"
                                >
                                  <MessageSquare className="h-4 w-4 mr-1" />
                                  Responder
                                </Button>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              ))}
            </Tabs>
          )}
        </div>
      </main>

      <Footer />

      {/* Edit Shop Modal */}
      {selectedShop && (
        <EditShopModal
          shop={selectedShop}
          isOpen={editShopModalOpen}
          onClose={() => setEditShopModalOpen(false)}
        />
      )}
    </div>
  );
};

export default OwnerDashboard;
