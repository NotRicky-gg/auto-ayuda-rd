import { supabase } from '@/lib/supabase';
import type { ShopRating, Review, ShopWithStats } from '@/types/mechanic';

// Fetch shops from shop_ratings table
export const fetchShopRatings = async (): Promise<ShopWithStats[]> => {
  // Fetch all shops
  const { data: shops, error: shopsError } = await supabase
    .from('shop_ratings')
    .select('*');

  if (shopsError) {
    console.error('Error fetching shop ratings:', shopsError);
    throw shopsError;
  }

  // Fetch all reviews to calculate stats
  const { data: reviews, error: reviewsError } = await supabase
    .from('reviews')
    .select('*');

  if (reviewsError) {
    console.error('Error fetching reviews:', reviewsError);
    // Continue without reviews if table doesn't exist
  }

  // Calculate stats for each shop
  const shopsWithStats: ShopWithStats[] = (shops || []).map((shop: ShopRating) => {
    const shopReviews = (reviews || []).filter((r: Review) => r.shop_id === shop.shop_id);
    const reviewCount = shopReviews.length;
    const averageRating = reviewCount > 0
      ? shopReviews.reduce((sum: number, r: Review) => sum + r.rating, 0) / reviewCount
      : 0;

    return {
      ...shop,
      average_rating: Math.round(averageRating * 10) / 10,
      review_count: reviewCount,
    };
  });

  // Sort by review count and rating
  return shopsWithStats.sort((a, b) => {
    const scoreA = a.average_rating * Math.log10(a.review_count + 1);
    const scoreB = b.average_rating * Math.log10(b.review_count + 1);
    return scoreB - scoreA;
  });
};

export const fetchShopReviews = async (shopId: string): Promise<Review[]> => {
  const { data, error } = await supabase
    .from('reviews')
    .select('*')
    .eq('shop_id', shopId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching reviews:', error);
    return [];
  }

  return data || [];
};

export const submitReview = async (
  shopId: string,
  reviewerName: string,
  rating: number,
  comment: string
): Promise<Review | null> => {
  const { data, error } = await supabase
    .from('reviews')
    .insert({
      shop_id: shopId,
      reviewer_name: reviewerName,
      rating,
      comment,
    })
    .select()
    .single();

  if (error) {
    console.error('Error submitting review:', error);
    throw error;
  }

  return data;
};

export const searchShops = (
  shops: ShopWithStats[],
  query: string
): ShopWithStats[] => {
  if (!query.trim()) return shops;

  const lowerQuery = query.toLowerCase();

  return shops.filter(
    (shop) =>
      shop.shop_name.toLowerCase().includes(lowerQuery) ||
      shop.city.toLowerCase().includes(lowerQuery) ||
      shop.address.toLowerCase().includes(lowerQuery)
  );
};

export const getFeaturedShopIds = (shops: ShopWithStats[]): string[] => {
  return shops
    .filter(shop => shop.review_count > 0)
    .slice(0, 3)
    .map(shop => shop.shop_id);
};
