import { Download, X, Smartphone } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface PWAInstallPromptProps {
  isOpen: boolean;
  onClose: () => void;
  onInstall: () => void;
  isInstalling?: boolean;
}

export const PWAInstallPrompt = ({ 
  isOpen, 
  onClose, 
  onInstall,
  isInstalling = false 
}: PWAInstallPromptProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center">
          <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-orange/10 flex items-center justify-center">
            <Smartphone className="h-8 w-8 text-orange" />
          </div>
          <DialogTitle className="text-xl">¡Instala Chequéalo RD!</DialogTitle>
          <DialogDescription className="text-base">
            Agrega la app a tu pantalla de inicio para acceder más rápido y recibir una mejor experiencia.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 mt-4">
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0">
              <Download className="h-4 w-4" />
            </div>
            <span>Acceso rápido desde tu pantalla de inicio</span>
          </div>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0">
              <Smartphone className="h-4 w-4" />
            </div>
            <span>Funciona sin conexión a internet</span>
          </div>
        </div>

        <div className="flex flex-col gap-2 mt-6">
          <Button 
            onClick={onInstall} 
            disabled={isInstalling}
            className="w-full bg-orange hover:bg-orange-light text-white font-semibold h-12"
          >
            <Download className="h-5 w-5 mr-2" />
            {isInstalling ? 'Instalando...' : 'Instalar Ahora'}
          </Button>
          <Button 
            variant="ghost" 
            onClick={onClose}
            className="w-full"
          >
            Quizás después
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};