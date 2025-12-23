import { Link } from 'react-router-dom';
import { Zap, LogIn, LogOut, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export const Navbar = () => {
  const { user, signOut, loading } = useAuth();

  return (
    <header className="bg-card border-b border-border sticky top-0 z-50">
      <div className="container py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="p-2 bg-orange rounded-lg">
              <Zap className="h-5 w-5 text-white" fill="currentColor" />
            </div>
            <span className="text-xl font-bold tracking-tight text-foreground">
              CHEQUÉALO RD
            </span>
          </Link>

          {/* Auth Section */}
          <div className="flex items-center gap-3">
            {loading ? (
              <div className="h-10 w-10 rounded-full bg-muted animate-pulse" />
            ) : user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={user.user_metadata?.avatar_url} alt={user.user_metadata?.full_name} />
                      <AvatarFallback className="bg-orange text-white">
                        {user.user_metadata?.full_name?.charAt(0) || user.email?.charAt(0)?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-2 py-1.5 text-sm">
                    <p className="font-medium">{user.user_metadata?.full_name || 'Usuario'}</p>
                    <p className="text-muted-foreground text-xs">{user.email}</p>
                  </div>
                  <DropdownMenuItem onClick={signOut} className="text-destructive cursor-pointer">
                    <LogOut className="mr-2 h-4 w-4" />
                    Cerrar sesión
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Button
                  asChild
                  variant="ghost"
                  className="text-foreground hover:text-orange hover:bg-transparent"
                >
                  <Link to="/auth">
                    <LogIn className="h-4 w-4 mr-2" />
                    Iniciar Sesión
                  </Link>
                </Button>
                <Button
                  asChild
                  className="bg-orange hover:bg-orange-light text-white font-semibold"
                >
                  <Link to="/auth">
                    <UserPlus className="h-4 w-4 mr-2" />
                    Registrarse
                  </Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
