import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Building2, Mail, Phone, User, Shield, LogIn, UserPlus, Send, AlertCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { submitClaimRequest } from '@/services/claimService';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { ShopWithStats } from '@/types/mechanic';

interface ClaimShopModalProps {
  shop: ShopWithStats;
  isOpen: boolean;
  onClose: () => void;
}

export const ClaimShopModal = ({ shop, isOpen, onClose }: ClaimShopModalProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [ownerName, setOwnerName] = useState('');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState('');
  const [roleType, setRoleType] = useState<'owner' | 'manager'>('owner');
  const [verificationProof, setVerificationProof] = useState('');

  const mutation = useMutation({
    mutationFn: () =>
      submitClaimRequest(
        shop.shop_id,
        user!.id,
        ownerName,
        email,
        phone,
        roleType,
        verificationProof
      ),
    onSuccess: () => {
      toast({
        title: '¡Solicitud enviada!',
        description: 'Tu solicitud de reclamación está siendo revisada. Te contactaremos pronto.',
      });
      queryClient.invalidateQueries({ queryKey: ['shopClaimed', shop.shop_id] });
      queryClient.invalidateQueries({ queryKey: ['pendingClaim', shop.shop_id, user?.id] });
      onClose();
      resetForm();
    },
    onError: (error: any) => {
      if (error.code === '23505') {
        toast({
          title: 'Solicitud duplicada',
          description: 'Ya tienes una solicitud pendiente para este taller.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Error',
          description: 'No se pudo enviar la solicitud. Intenta de nuevo.',
          variant: 'destructive',
        });
      }
    },
  });

  const resetForm = () => {
    setOwnerName('');
    setEmail(user?.email || '');
    setPhone('');
    setRoleType('owner');
    setVerificationProof('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!ownerName.trim()) {
      toast({
        title: 'Nombre requerido',
        description: 'Por favor ingresa tu nombre completo.',
        variant: 'destructive',
      });
      return;
    }

    if (!email.trim() || !email.includes('@')) {
      toast({
        title: 'Email inválido',
        description: 'Por favor ingresa un email válido.',
        variant: 'destructive',
      });
      return;
    }

    if (!phone.trim()) {
      toast({
        title: 'Teléfono requerido',
        description: 'Por favor ingresa tu número de teléfono.',
        variant: 'destructive',
      });
      return;
    }

    mutation.mutate();
  };

  if (!user) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md bg-card">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-foreground flex items-center gap-2">
              <Building2 className="h-5 w-5 text-orange" />
              Reclamar este taller
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {shop.shop_name}
            </DialogDescription>
          </DialogHeader>

          <div className="text-center py-8">
            <div className="h-16 w-16 rounded-full bg-orange/10 flex items-center justify-center mx-auto mb-4">
              <LogIn className="h-8 w-8 text-orange" />
            </div>
            <h4 className="text-lg font-semibold text-foreground mb-2">
              Inicia sesión para reclamar tu taller
            </h4>
            <p className="text-muted-foreground mb-6">
              Necesitas una cuenta para verificar que eres el propietario
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button asChild variant="outline" className="gap-2">
                <Link to="/auth">
                  <LogIn className="h-4 w-4" />
                  Iniciar Sesión
                </Link>
              </Button>
              <Button asChild className="bg-orange hover:bg-orange-light text-white gap-2">
                <Link to="/auth">
                  <UserPlus className="h-4 w-4" />
                  Crear Cuenta
                </Link>
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-card max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-foreground flex items-center gap-2">
            <Building2 className="h-5 w-5 text-orange" />
            Reclamar este taller
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {shop.shop_name}
          </DialogDescription>
        </DialogHeader>

        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-4 mb-4">
          <div className="flex gap-3">
            <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="text-sm text-amber-800 dark:text-amber-200">
              <p className="font-medium mb-1">Proceso de verificación</p>
              <p>Tu solicitud será revisada por nuestro equipo. Te contactaremos para verificar tu identidad.</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="ownerName" className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              Nombre completo
            </Label>
            <Input
              id="ownerName"
              value={ownerName}
              onChange={(e) => setOwnerName(e.target.value)}
              placeholder="Juan Pérez"
              className="bg-background"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              Correo electrónico
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="correo@ejemplo.com"
              className="bg-background"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone" className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-muted-foreground" />
              Teléfono
            </Label>
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
            <Label className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-muted-foreground" />
              Tu rol en el taller
            </Label>
            <RadioGroup value={roleType} onValueChange={(v) => setRoleType(v as 'owner' | 'manager')}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="owner" id="owner" />
                <Label htmlFor="owner" className="font-normal cursor-pointer">
                  Propietario
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="manager" id="manager" />
                <Label htmlFor="manager" className="font-normal cursor-pointer">
                  Gerente / Encargado
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="verification">
              ¿Cómo podemos verificar que eres el propietario? (opcional)
            </Label>
            <Textarea
              id="verification"
              value={verificationProof}
              onChange={(e) => setVerificationProof(e.target.value)}
              placeholder="Ej: Tengo el RNC del negocio, puedo mostrar facturas, tengo acceso al local..."
              rows={3}
              className="resize-none bg-background"
            />
          </div>

          <Button
            type="submit"
            className="w-full bg-orange hover:bg-orange-light text-white font-semibold h-12 gap-2"
            disabled={mutation.isPending}
          >
            <Send className="h-5 w-5" />
            {mutation.isPending ? 'Enviando...' : 'Enviar Solicitud'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};
