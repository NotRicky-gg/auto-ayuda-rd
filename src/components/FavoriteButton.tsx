import { useState, useEffect } from 'react';
import { Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { checkIsFavorite, addFavorite, removeFavorite } from '@/services/mechanicService';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

interface FavoriteButtonProps {
  shopId: string;
  size?: 'sm' | 'md';
}

export const FavoriteButton = ({ shopId, size = 'md' }: FavoriteButtonProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: isFavorite = false, isLoading } = useQuery({
    queryKey: ['isFavorite', user?.id, shopId],
    queryFn: () => checkIsFavorite(user!.id, shopId),
    enabled: !!user?.id,
  });

  const addMutation = useMutation({
    mutationFn: () => addFavorite(user!.id, shopId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['isFavorite', user?.id, shopId] });
      queryClient.invalidateQueries({ queryKey: ['userFavorites', user?.id] });
      toast({
        title: '¡Agregado a favoritos!',
        description: 'Puedes ver tus favoritos en tu perfil.',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'No se pudo agregar a favoritos.',
        variant: 'destructive',
      });
    },
  });

  const removeMutation = useMutation({
    mutationFn: () => removeFavorite(user!.id, shopId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['isFavorite', user?.id, shopId] });
      queryClient.invalidateQueries({ queryKey: ['userFavorites', user?.id] });
      toast({
        title: 'Eliminado de favoritos',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'No se pudo eliminar de favoritos.',
        variant: 'destructive',
      });
    },
  });

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!user) {
      toast({
        title: 'Inicia sesión',
        description: 'Necesitas una cuenta para guardar favoritos.',
        variant: 'destructive',
      });
      return;
    }

    if (isFavorite) {
      removeMutation.mutate();
    } else {
      addMutation.mutate();
    }
  };

  const isPending = addMutation.isPending || removeMutation.isPending;
  const iconSize = size === 'sm' ? 'h-4 w-4' : 'h-5 w-5';
  const buttonSize = size === 'sm' ? 'h-8 w-8' : 'h-10 w-10';

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleClick}
      disabled={isPending || isLoading}
      className={`${buttonSize} rounded-full hover:bg-red-50 dark:hover:bg-red-950 transition-all`}
      title={isFavorite ? 'Quitar de favoritos' : 'Agregar a favoritos'}
    >
      <Heart
        className={`${iconSize} transition-all ${
          isFavorite
            ? 'fill-red-500 text-red-500'
            : 'text-muted-foreground hover:text-red-500'
        } ${isPending ? 'animate-pulse' : ''}`}
      />
    </Button>
  );
};