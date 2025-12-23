import { Wrench } from 'lucide-react';

export const Header = () => {
  return (
    <header className="gradient-hero text-primary-foreground">
      <div className="container py-16 md:py-24">
        <div className="flex flex-col items-center text-center space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-accent rounded-xl">
              <Wrench className="h-8 w-8 text-accent-foreground" />
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">
              MecánicosRD
            </h1>
          </div>
          
          <p className="text-lg md:text-xl text-primary-foreground/80 max-w-2xl">
            Encuentra los mejores talleres mecánicos en República Dominicana. 
            Servicio de calidad cerca de ti.
          </p>
        </div>
      </div>
    </header>
  );
};
