import { Zap } from 'lucide-react';

export const Navbar = () => {
  return (
    <header className="bg-card border-b border-border sticky top-0 z-50">
      <div className="container py-4">
        <div className="flex items-center">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-orange rounded-lg">
              <Zap className="h-5 w-5 text-white" fill="currentColor" />
            </div>
            <span className="text-xl font-bold tracking-tight text-foreground">
              CHEQUÉALO RD
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};
