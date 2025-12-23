import { Wrench } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="bg-primary text-primary-foreground mt-auto">
      <div className="container py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Wrench className="h-5 w-5" />
            <span className="font-semibold">MecánicosRD</span>
          </div>
          
          <p className="text-primary-foreground/70 text-sm">
            © {new Date().getFullYear()} MecánicosRD. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
};
