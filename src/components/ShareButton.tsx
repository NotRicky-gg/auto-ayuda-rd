import { Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface ShareButtonProps {
  shopName: string;
  shopCity: string;
  size?: 'sm' | 'md';
}

export const ShareButton = ({ shopName, shopCity, size = 'md' }: ShareButtonProps) => {
  const { toast } = useToast();

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();

    const message = `🔧 ¡Encontré un taller de confianza!\n\n*${shopName}*\n📍 ${shopCity}\n\n¿Buscas un buen mecánico? En *Chequéalo RD* encuentras los mejores talleres con reseñas reales de clientes. ¡Dale un vistazo!\n\n👉 ${window.location.origin}`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;

    // Try native share first (mobile), fallback to WhatsApp
    if (navigator.share) {
      navigator.share({
        title: `${shopName} - Chequéalo RD`,
        text: `¡Mira este taller mecánico! ${shopName} en ${shopCity}`,
        url: window.location.origin,
      }).catch(() => {
        // User cancelled or error, open WhatsApp
        window.open(whatsappUrl, '_blank');
      });
    } else {
      window.open(whatsappUrl, '_blank');
    }

    toast({
      title: 'Compartiendo...',
      description: 'Abriendo WhatsApp para compartir.',
    });
  };

  const iconSize = size === 'sm' ? 'h-4 w-4' : 'h-5 w-5';
  const buttonSize = size === 'sm' ? 'h-8 w-8' : 'h-10 w-10';

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleShare}
      className={`${buttonSize} rounded-full hover:bg-green-50 dark:hover:bg-green-950 transition-all`}
      title="Compartir por WhatsApp"
    >
      <Share2 className={`${iconSize} text-muted-foreground hover:text-green-600`} />
    </Button>
  );
};