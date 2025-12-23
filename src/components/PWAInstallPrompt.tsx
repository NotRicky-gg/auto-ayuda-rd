import { Download, Smartphone } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { useState } from 'react';

interface PWAInstallPromptProps {
  isOpen: boolean;
  onClose: () => void;
  onInstall: () => void;
  onDismissPermanently: () => void;
  isInstalling?: boolean;
}

export const PWAInstallPrompt = ({ 
  isOpen, 
  onClose, 
  onInstall,
  onDismissPermanently,
  isInstalling = false 
}: PWAInstallPromptProps) => {
  const [dontAskAgain, setDontAskAgain] = useState(false);

  const handleClose = () => {
    if (dontAskAgain) {
      onDismissPermanently();
    }
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md bg-card border-border">
        <DialogHeader className="text-center">
          <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-orange/10 flex items-center justify-center">
            <Smartphone className="h-8 w-8 text-orange" />
          </div>
          <DialogTitle className="text-xl text-foreground">¡Instala Chequéalo RD!</DialogTitle>
          <DialogDescription className="text-base text-muted-foreground">
            Agrega la app a tu pantalla de inicio para acceder más rápido y tener una mejor experiencia.
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

        <div className="flex flex-col gap-3 mt-6">
          <Button 
            onClick={onInstall} 
            disabled={isInstalling}
            className="w-full bg-orange hover:bg-orange-light text-white font-semibold h-12"
          >
            <Download className="h-5 w-5 mr-2" />
            {isInstalling ? 'Instalando...' : 'Sí, Instalar Ahora'}
          </Button>
          <Button 
            variant="outline" 
            onClick={handleClose}
            className="w-full border-border text-foreground hover:bg-muted"
          >
            No, gracias
          </Button>
        </div>

        <div className="flex items-center gap-2 mt-4 pt-4 border-t border-border">
          <Checkbox 
            id="dont-ask" 
            checked={dontAskAgain}
            onCheckedChange={(checked) => setDontAskAgain(checked === true)}
          />
          <label 
            htmlFor="dont-ask" 
            className="text-sm text-muted-foreground cursor-pointer"
          >
            No volver a preguntarme
          </label>
        </div>
      </DialogContent>
    </Dialog>
  );
};