import { supabase } from '@/lib/supabase';
import type { MechanicShop } from '@/types/mechanic';

export const fetchMechanicShops = async (): Promise<MechanicShop[]> => {
  const { data, error } = await supabase
    .from('mechanic_shops')
    .select('*')
    .order('review_count', { ascending: false });

  if (error) {
    console.error('Error fetching mechanic shops:', error);
    throw error;
  }

  return data || [];
};

export const searchMechanicShops = (
  shops: MechanicShop[],
  query: string
): MechanicShop[] => {
  if (!query.trim()) return shops;

  const lowerQuery = query.toLowerCase();

  return shops.filter(
    (shop) =>
      shop.name.toLowerCase().includes(lowerQuery) ||
      shop.neighborhood.toLowerCase().includes(lowerQuery) ||
      shop.address.toLowerCase().includes(lowerQuery)
  );
};

export const getFeaturedShops = (shops: MechanicShop[]): string[] => {
  // Featured = highest combination of reviews and rating
  return shops
    .slice()
    .sort((a, b) => {
      const scoreA = a.rating * Math.log10(a.review_count + 1);
      const scoreB = b.rating * Math.log10(b.review_count + 1);
      return scoreB - scoreA;
    })
    .slice(0, 3)
    .map((shop) => shop.id);
};

export const isFeaturedShop = (
  shop: MechanicShop,
  featuredIds: string[]
): boolean => {
  return featuredIds.includes(shop.id);
};
