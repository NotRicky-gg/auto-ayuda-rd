import { Zap } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="bg-navy text-white mt-auto">
      <div className="container py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-orange" fill="currentColor" />
            <span className="font-bold">CHEQUÉALO RD</span>
          </div>
          
          <p className="text-gray-400 text-sm">
            © {new Date().getFullYear()} Chequéalo RD. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
};
