import { useState, useEffect } from 'react';
import { FileEdit, Send, AlertCircle, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { submitUpdateRequest, fetchPendingUpdateRequestsForShop } from '@/services/claimService';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ShopWithStats } from '@/types/mechanic';

interface EditShopModalProps {
  shop: ShopWithStats;
  isOpen: boolean;
  onClose: () => void;
}

export const EditShopModal = ({ shop, isOpen, onClose }: EditShopModalProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Form state
  const [shopName, setShopName] = useState(shop.shop_name);
  const [phone, setPhone] = useState(shop.phone || '');
  const [address, setAddress] = useState(shop.address);
  const [city, setCity] = useState(shop.city);
  const [schedule, setSchedule] = useState(shop.schedule || '');
  const [whatsapp, setWhatsapp] = useState(shop.whatsapp);

  // Check for pending requests
  const { data: pendingRequests = [], isLoading: pendingLoading } = useQuery({
    queryKey: ['pendingUpdateRequests', shop.shop_id],
    queryFn: () => fetchPendingUpdateRequestsForShop(shop.shop_id),
    enabled: isOpen,
  });

  // Reset form when shop changes
  useEffect(() => {
    setShopName(shop.shop_name);
    setPhone(shop.phone || '');
    setAddress(shop.address);
    setCity(shop.city);
    setSchedule(shop.schedule || '');
    setWhatsapp(shop.whatsapp);
  }, [shop]);

  const mutation = useMutation({
    mutationFn: () => {
      const proposedChanges: Record<string, string | boolean> = {};
      
      // Only include changed fields
      if (shopName !== shop.shop_name) proposedChanges.shop_name = shopName;
      if (phone !== (shop.phone || '')) proposedChanges.phone = phone;
      if (address !== shop.address) proposedChanges.address = address;
      if (city !== shop.city) proposedChanges.city = city;
      if (schedule !== (shop.schedule || '')) proposedChanges.schedule = schedule;
      if (whatsapp !== shop.whatsapp) proposedChanges.whatsapp = whatsapp;

      return submitUpdateRequest(shop.shop_id, user!.id, proposedChanges);
    },
    onSuccess: () => {
      toast({
        title: '¡Solicitud enviada!',
        description: 'Tus cambios están pendientes de aprobación.',
      });
      queryClient.invalidateQueries({ queryKey: ['pendingUpdateRequests', shop.shop_id] });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'No se pudo enviar la solicitud.',
        variant: 'destructive',
      });
    },
  });

  const hasChanges = () => {
    return (
      shopName !== shop.shop_name ||
      phone !== (shop.phone || '') ||
      address !== shop.address ||
      city !== shop.city ||
      schedule !== (shop.schedule || '') ||
      whatsapp !== shop.whatsapp
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!hasChanges()) {
      toast({
        title: 'Sin cambios',
        description: 'No has realizado ningún cambio.',
        variant: 'destructive',
      });
      return;
    }

    if (!shopName.trim()) {
      toast({
        title: 'Nombre requerido',
        description: 'El nombre del taller no puede estar vacío.',
        variant: 'destructive',
      });
      return;
    }

    mutation.mutate();
  };

  const hasPendingRequest = pendingRequests.length > 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg bg-card max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-foreground flex items-center gap-2">
            <FileEdit className="h-5 w-5 text-orange" />
            Solicitar cambios
          </DialogTitle>
          <DialogDescription>
            {shop.shop_name}
          </DialogDescription>
        </DialogHeader>

        {pendingLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-orange" />
          </div>
        ) : hasPendingRequest ? (
          <div className="space-y-4">
            <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
              <div className="flex gap-3">
                <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div className="text-sm text-amber-800 dark:text-amber-200">
                  <p className="font-medium mb-1">Tienes cambios pendientes de aprobación</p>
                  <p>Espera a que el administrador revise tu solicitud actual antes de enviar nuevos cambios.</p>
                </div>
              </div>
            </div>

            <div className="bg-muted rounded-lg p-4">
              <p className="text-sm font-medium mb-3">Cambios solicitados:</p>
              <div className="space-y-2 text-sm">
                {Object.entries(pendingRequests[0].proposed_changes).map(([key, value]) => (
                  value !== undefined && (
                    <div key={key} className="flex gap-2">
                      <span className="font-medium text-muted-foreground capitalize">
                        {key === 'shop_name' ? 'Nombre' : 
                         key === 'phone' ? 'Teléfono' :
                         key === 'address' ? 'Dirección' :
                         key === 'city' ? 'Ciudad' :
                         key === 'schedule' ? 'Horario' :
                         key === 'whatsapp' ? 'WhatsApp' : key}:
                      </span>
                      <span className="text-foreground">
                        {typeof value === 'boolean' ? (value ? 'Sí' : 'No') : String(value)}
                      </span>
                    </div>
                  )
                ))}
              </div>
              <Badge variant="outline" className="mt-3 border-amber-500 text-amber-600">
                Pendiente de aprobación
              </Badge>
            </div>

            <Button variant="outline" onClick={onClose} className="w-full">
              Cerrar
            </Button>
          </div>
        ) : (
          <>
            <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
              <div className="flex gap-3">
                <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                <div className="text-sm text-blue-800 dark:text-blue-200">
                  <p className="font-medium mb-1">Los cambios requieren aprobación</p>
                  <p>Un administrador revisará tu solicitud antes de publicar los cambios.</p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="shopName">Nombre del taller</Label>
                <Input
                  id="shopName"
                  value={shopName}
                  onChange={(e) => setShopName(e.target.value)}
                  className="bg-background"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Teléfono</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 809 555 1234"
                  className="bg-background"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Dirección</Label>
                <Input
                  id="address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="bg-background"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="city">Ciudad</Label>
                <Input
                  id="city"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="bg-background"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="schedule">Horario</Label>
                <Textarea
                  id="schedule"
                  value={schedule}
                  onChange={(e) => setSchedule(e.target.value)}
                  placeholder="Lun-Vie: 8am-6pm&#10;Sáb: 8am-2pm"
                  rows={3}
                  className="resize-none bg-background"
                />
              </div>

              <div className="flex items-center justify-between py-2">
                <Label htmlFor="whatsapp" className="cursor-pointer">
                  ¿Tiene WhatsApp?
                </Label>
                <Switch
                  id="whatsapp"
                  checked={whatsapp}
                  onCheckedChange={setWhatsapp}
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-orange hover:bg-orange-light text-white font-semibold h-12 gap-2"
                disabled={mutation.isPending || !hasChanges()}
              >
                <Send className="h-5 w-5" />
                {mutation.isPending ? 'Enviando...' : 'Enviar solicitud de cambios'}
              </Button>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
