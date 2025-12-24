import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Building2, FileEdit, Check, X, Loader2, User, Mail, Phone, Clock, AlertCircle } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  checkIsAdmin,
  fetchAllClaimRequests,
  fetchAllUpdateRequests,
  approveClaimRequest,
  rejectClaimRequest,
  approveUpdateRequest,
  rejectUpdateRequest,
} from '@/services/claimService';
import type { ShopClaimRequest, ShopUpdateRequest } from '@/types/claimRequest';
import type { ShopRating } from '@/types/mechanic';

const AdminDashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [rejectNotes, setRejectNotes] = useState<Record<string, string>>({});
  const [showRejectForm, setShowRejectForm] = useState<Record<string, boolean>>({});

  // Check admin status
  const { data: isAdmin, isLoading: adminLoading } = useQuery({
    queryKey: ['isAdmin', user?.id],
    queryFn: () => checkIsAdmin(user!.id),
    enabled: !!user?.id,
  });

  // Fetch claim requests
  const { data: claimRequests = [], isLoading: claimsLoading } = useQuery({
    queryKey: ['allClaimRequests'],
    queryFn: fetchAllClaimRequests,
    enabled: isAdmin === true,
  });

  // Fetch update requests
  const { data: updateRequests = [], isLoading: updatesLoading } = useQuery({
    queryKey: ['allUpdateRequests'],
    queryFn: fetchAllUpdateRequests,
    enabled: isAdmin === true,
  });

  // Approve claim mutation
  const approveClaimMutation = useMutation({
    mutationFn: approveClaimRequest,
    onSuccess: () => {
      toast({ title: 'Solicitud aprobada', description: 'El taller ha sido reclamado exitosamente.' });
      queryClient.invalidateQueries({ queryKey: ['allClaimRequests'] });
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message || 'No se pudo aprobar la solicitud.', variant: 'destructive' });
    },
  });

  // Reject claim mutation
  const rejectClaimMutation = useMutation({
    mutationFn: ({ id, notes }: { id: string; notes?: string }) => rejectClaimRequest(id, notes),
    onSuccess: () => {
      toast({ title: 'Solicitud rechazada', description: 'La solicitud ha sido rechazada.' });
      queryClient.invalidateQueries({ queryKey: ['allClaimRequests'] });
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message || 'No se pudo rechazar la solicitud.', variant: 'destructive' });
    },
  });

  // Approve update mutation
  const approveUpdateMutation = useMutation({
    mutationFn: approveUpdateRequest,
    onSuccess: () => {
      toast({ title: 'Cambios aprobados', description: 'Los cambios han sido aplicados al taller.' });
      queryClient.invalidateQueries({ queryKey: ['allUpdateRequests'] });
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message || 'No se pudo aprobar los cambios.', variant: 'destructive' });
    },
  });

  // Reject update mutation
  const rejectUpdateMutation = useMutation({
    mutationFn: ({ id, notes }: { id: string; notes?: string }) => rejectUpdateRequest(id, notes),
    onSuccess: () => {
      toast({ title: 'Cambios rechazados', description: 'Los cambios propuestos han sido rechazados.' });
      queryClient.invalidateQueries({ queryKey: ['allUpdateRequests'] });
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message || 'No se pudo rechazar los cambios.', variant: 'destructive' });
    },
  });

  // Redirect if not admin
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    } else if (!adminLoading && isAdmin === false) {
      navigate('/');
      toast({ title: 'Acceso denegado', description: 'No tienes permisos de administrador.', variant: 'destructive' });
    }
  }, [authLoading, adminLoading, user, isAdmin, navigate, toast]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-DO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="border-amber-500 text-amber-600">Pendiente</Badge>;
      case 'approved':
        return <Badge className="bg-green-500">Aprobado</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rechazado</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const pendingClaims = claimRequests.filter(r => r.status === 'pending');
  const pendingUpdates = updateRequests.filter(r => r.status === 'pending');

  if (authLoading || adminLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-orange" />
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-3 mb-8">
            <div className="h-12 w-12 rounded-xl bg-orange/10 flex items-center justify-center">
              <Shield className="h-6 w-6 text-orange" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Panel de Administración</h1>
              <p className="text-muted-foreground">Gestiona solicitudes de reclamación y cambios</p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-blue-500/10 flex items-center justify-center">
                    <Building2 className="h-6 w-6 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{pendingClaims.length}</p>
                    <p className="text-muted-foreground">Reclamaciones pendientes</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-purple-500/10 flex items-center justify-center">
                    <FileEdit className="h-6 w-6 text-purple-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{pendingUpdates.length}</p>
                    <p className="text-muted-foreground">Cambios pendientes</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="claims" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2 max-w-md">
              <TabsTrigger value="claims" className="gap-2">
                <Building2 className="h-4 w-4" />
                Reclamaciones
                {pendingClaims.length > 0 && (
                  <Badge variant="destructive" className="ml-1 h-5 w-5 p-0 text-xs flex items-center justify-center">
                    {pendingClaims.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="updates" className="gap-2">
                <FileEdit className="h-4 w-4" />
                Cambios
                {pendingUpdates.length > 0 && (
                  <Badge variant="destructive" className="ml-1 h-5 w-5 p-0 text-xs flex items-center justify-center">
                    {pendingUpdates.length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            {/* Claims Tab */}
            <TabsContent value="claims" className="space-y-4">
              {claimsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-orange" />
                </div>
              ) : claimRequests.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No hay solicitudes de reclamación.</p>
                  </CardContent>
                </Card>
              ) : (
                claimRequests.map((request: ShopClaimRequest & { shop?: ShopRating }) => (
                  <Card key={request.id} className={request.status === 'pending' ? 'border-amber-500/50' : ''}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">{request.shop?.shop_name || 'Taller desconocido'}</CardTitle>
                          <CardDescription>{request.shop?.city} - {request.shop?.address}</CardDescription>
                        </div>
                        {getStatusBadge(request.status)}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{request.owner_name}</span>
                          <Badge variant="outline" className="text-xs">{request.role_type}</Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <span>{request.email}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <span>{request.phone}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span>{formatDate(request.created_at)}</span>
                        </div>
                      </div>

                      {request.verification_proof && (
                        <div className="bg-muted rounded-lg p-3">
                          <p className="text-sm font-medium mb-1">Prueba de verificación:</p>
                          <p className="text-sm text-muted-foreground">{request.verification_proof}</p>
                        </div>
                      )}

                      {request.admin_notes && (
                        <div className="bg-red-50 dark:bg-red-950/30 rounded-lg p-3 border border-red-200 dark:border-red-800">
                          <p className="text-sm font-medium text-red-600 dark:text-red-400 mb-1">Notas del admin:</p>
                          <p className="text-sm text-red-600 dark:text-red-400">{request.admin_notes}</p>
                        </div>
                      )}

                      {request.status === 'pending' && (
                        <>
                          {showRejectForm[request.id] ? (
                            <div className="space-y-3 pt-2">
                              <Textarea
                                placeholder="Razón del rechazo (opcional)"
                                value={rejectNotes[request.id] || ''}
                                onChange={(e) => setRejectNotes({ ...rejectNotes, [request.id]: e.target.value })}
                                rows={2}
                              />
                              <div className="flex gap-2">
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => {
                                    rejectClaimMutation.mutate({ id: request.id, notes: rejectNotes[request.id] });
                                    setShowRejectForm({ ...showRejectForm, [request.id]: false });
                                  }}
                                  disabled={rejectClaimMutation.isPending}
                                >
                                  Confirmar rechazo
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setShowRejectForm({ ...showRejectForm, [request.id]: false })}
                                >
                                  Cancelar
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex gap-2 pt-2">
                              <Button
                                size="sm"
                                className="bg-green-600 hover:bg-green-700 gap-1"
                                onClick={() => approveClaimMutation.mutate(request.id)}
                                disabled={approveClaimMutation.isPending}
                              >
                                <Check className="h-4 w-4" />
                                Aprobar
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                className="gap-1"
                                onClick={() => setShowRejectForm({ ...showRejectForm, [request.id]: true })}
                              >
                                <X className="h-4 w-4" />
                                Rechazar
                              </Button>
                            </div>
                          )}
                        </>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>

            {/* Updates Tab */}
            <TabsContent value="updates" className="space-y-4">
              {updatesLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-orange" />
                </div>
              ) : updateRequests.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <FileEdit className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No hay solicitudes de cambio.</p>
                  </CardContent>
                </Card>
              ) : (
                updateRequests.map((request: ShopUpdateRequest & { shop?: ShopRating }) => (
                  <Card key={request.id} className={request.status === 'pending' ? 'border-amber-500/50' : ''}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">{request.shop?.shop_name || 'Taller desconocido'}</CardTitle>
                          <CardDescription>{formatDate(request.created_at)}</CardDescription>
                        </div>
                        {getStatusBadge(request.status)}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="bg-muted rounded-lg p-4">
                        <p className="text-sm font-medium mb-3">Cambios propuestos:</p>
                        <div className="space-y-2 text-sm">
                          {Object.entries(request.proposed_changes).map(([key, value]) => (
                            value && (
                              <div key={key} className="flex gap-2">
                                <span className="font-medium text-muted-foreground capitalize">{key.replace('_', ' ')}:</span>
                                <span className="text-foreground">{value}</span>
                              </div>
                            )
                          ))}
                        </div>
                      </div>

                      {request.admin_notes && (
                        <div className="bg-red-50 dark:bg-red-950/30 rounded-lg p-3 border border-red-200 dark:border-red-800">
                          <p className="text-sm font-medium text-red-600 dark:text-red-400 mb-1">Notas del admin:</p>
                          <p className="text-sm text-red-600 dark:text-red-400">{request.admin_notes}</p>
                        </div>
                      )}

                      {request.status === 'pending' && (
                        <>
                          {showRejectForm[request.id] ? (
                            <div className="space-y-3 pt-2">
                              <Textarea
                                placeholder="Razón del rechazo (opcional)"
                                value={rejectNotes[request.id] || ''}
                                onChange={(e) => setRejectNotes({ ...rejectNotes, [request.id]: e.target.value })}
                                rows={2}
                              />
                              <div className="flex gap-2">
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => {
                                    rejectUpdateMutation.mutate({ id: request.id, notes: rejectNotes[request.id] });
                                    setShowRejectForm({ ...showRejectForm, [request.id]: false });
                                  }}
                                  disabled={rejectUpdateMutation.isPending}
                                >
                                  Confirmar rechazo
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setShowRejectForm({ ...showRejectForm, [request.id]: false })}
                                >
                                  Cancelar
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex gap-2 pt-2">
                              <Button
                                size="sm"
                                className="bg-green-600 hover:bg-green-700 gap-1"
                                onClick={() => approveUpdateMutation.mutate(request.id)}
                                disabled={approveUpdateMutation.isPending}
                              >
                                <Check className="h-4 w-4" />
                                Aprobar
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                className="gap-1"
                                onClick={() => setShowRejectForm({ ...showRejectForm, [request.id]: true })}
                              >
                                <X className="h-4 w-4" />
                                Rechazar
                              </Button>
                            </div>
                          )}
                        </>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default AdminDashboard;
