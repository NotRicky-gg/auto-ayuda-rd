import { supabase } from '@/lib/supabase';
import type { ShopRating, Review, ShopWithStats, ReviewReply, ShopOwner, UserFavorite } from '@/types/mechanic';

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

export const checkExistingReview = async (shopId: string, userId: string): Promise<boolean> => {
  const { data, error } = await supabase
    .from('reviews')
    .select('id')
    .eq('shop_id', shopId)
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    console.error('Error checking existing review:', error);
    return false;
  }

  return !!data;
};

export const submitReview = async (
  shopId: string,
  userId: string,
  reviewerName: string,
  rating: number,
  comment: string
): Promise<Review | null> => {
  const { data, error } = await supabase
    .from('reviews')
    .insert({
      shop_id: shopId,
      user_id: userId,
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
  return [...shops]
    .filter(shop => shop.review_count > 0)
    .sort((a, b) => b.average_rating - a.average_rating)
    .slice(0, 5)
    .map(shop => shop.shop_id);
};

// Check if user is a shop owner
export const checkIsShopOwner = async (userId: string): Promise<boolean> => {
  const { data, error } = await supabase
    .from('shop_owners')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    console.error('Error checking shop owner:', error);
    return false;
  }

  return !!data;
};

// Get shops owned by a user
export const fetchOwnedShops = async (userId: string): Promise<ShopWithStats[]> => {
  // Get shop IDs owned by user
  const { data: ownerships, error: ownerError } = await supabase
    .from('shop_owners')
    .select('shop_id')
    .eq('user_id', userId);

  if (ownerError) {
    console.error('Error fetching owned shops:', ownerError);
    return [];
  }

  if (!ownerships || ownerships.length === 0) return [];

  const shopIds = ownerships.map(o => o.shop_id);

  // Fetch shop details
  const { data: shops, error: shopsError } = await supabase
    .from('shop_ratings')
    .select('*')
    .in('shop_id', shopIds);

  if (shopsError) {
    console.error('Error fetching shop details:', shopsError);
    return [];
  }

  // Fetch reviews for these shops
  const { data: reviews } = await supabase
    .from('reviews')
    .select('*')
    .in('shop_id', shopIds);

  // Calculate stats
  return (shops || []).map((shop: ShopRating) => {
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
};

// Fetch reviews for a shop with their replies
export const fetchShopReviewsWithReplies = async (shopId: string): Promise<(Review & { reply?: ReviewReply })[]> => {
  const { data: reviews, error: reviewsError } = await supabase
    .from('reviews')
    .select('*')
    .eq('shop_id', shopId)
    .order('created_at', { ascending: false });

  if (reviewsError) {
    console.error('Error fetching reviews:', reviewsError);
    return [];
  }

  if (!reviews || reviews.length === 0) return [];

  // Fetch replies for these reviews
  const reviewIds = reviews.map(r => r.id);
  const { data: replies } = await supabase
    .from('review_replies')
    .select('*')
    .in('review_id', reviewIds);

  // Merge replies with reviews
  return reviews.map(review => ({
    ...review,
    reply: replies?.find(r => r.review_id === review.id),
  }));
};

// Submit a reply to a review
export const submitReviewReply = async (
  reviewId: string,
  shopId: string,
  ownerUserId: string,
  replyText: string
): Promise<ReviewReply | null> => {
  const { data, error } = await supabase
    .from('review_replies')
    .insert({
      review_id: reviewId,
      shop_id: shopId,
      owner_user_id: ownerUserId,
      reply_text: replyText,
    })
    .select()
    .single();

  if (error) {
    console.error('Error submitting reply:', error);
    throw error;
  }

  return data;
};

// Update a reply
export const updateReviewReply = async (
  replyId: string,
  replyText: string
): Promise<ReviewReply | null> => {
  const { data, error } = await supabase
    .from('review_replies')
    .update({
      reply_text: replyText,
      updated_at: new Date().toISOString(),
    })
    .eq('id', replyId)
    .select()
    .single();

  if (error) {
    console.error('Error updating reply:', error);
    throw error;
  }

  return data;
};

// Fetch reviews submitted by a user with shop info
export const fetchUserReviews = async (userId: string): Promise<(Review & { shop?: ShopRating })[]> => {
  const { data: reviews, error: reviewsError } = await supabase
    .from('reviews')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (reviewsError) {
    console.error('Error fetching user reviews:', reviewsError);
    return [];
  }

  if (!reviews || reviews.length === 0) return [];

  // Get unique shop IDs
  const shopIds = [...new Set(reviews.map(r => r.shop_id))];

  // Fetch shop details
  const { data: shops } = await supabase
    .from('shop_ratings')
    .select('*')
    .in('shop_id', shopIds);

  // Merge shop info with reviews
  return reviews.map(review => ({
    ...review,
    shop: shops?.find(s => s.shop_id === review.shop_id),
  }));
};

// Update a review (only allowed once)
export const updateReview = async (
  reviewId: string,
  rating: number,
  comment: string
): Promise<Review | null> => {
  const { data, error } = await supabase
    .from('reviews')
    .update({
      rating,
      comment,
      has_been_edited: true,
      updated_at: new Date().toISOString(),
    })
    .eq('id', reviewId)
    .eq('has_been_edited', false) // Only allow if not already edited
    .select()
    .single();

  if (error) {
    console.error('Error updating review:', error);
    throw error;
  }

  return data;
};

// ==================== FAVORITES ====================

// Check if a shop is favorited by user
export const checkIsFavorite = async (userId: string, shopId: string): Promise<boolean> => {
  const { data, error } = await supabase
    .from('user_favorites')
    .select('id')
    .eq('user_id', userId)
    .eq('shop_id', shopId)
    .maybeSingle();

  if (error) {
    console.error('Error checking favorite:', error);
    return false;
  }

  return !!data;
};

// Add a shop to favorites
export const addFavorite = async (userId: string, shopId: string): Promise<UserFavorite | null> => {
  const { data, error } = await supabase
    .from('user_favorites')
    .insert({ user_id: userId, shop_id: shopId })
    .select()
    .single();

  if (error) {
    console.error('Error adding favorite:', error);
    throw error;
  }

  return data;
};

// Remove a shop from favorites
export const removeFavorite = async (userId: string, shopId: string): Promise<void> => {
  const { error } = await supabase
    .from('user_favorites')
    .delete()
    .eq('user_id', userId)
    .eq('shop_id', shopId);

  if (error) {
    console.error('Error removing favorite:', error);
    throw error;
  }
};

// Fetch user's favorite shops with stats
export const fetchUserFavorites = async (userId: string): Promise<ShopWithStats[]> => {
  // Get user's favorite shop IDs
  const { data: favorites, error: favError } = await supabase
    .from('user_favorites')
    .select('shop_id')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (favError) {
    console.error('Error fetching favorites:', favError);
    return [];
  }

  if (!favorites || favorites.length === 0) return [];

  const shopIds = favorites.map(f => f.shop_id);

  // Fetch shop details
  const { data: shops, error: shopsError } = await supabase
    .from('shop_ratings')
    .select('*')
    .in('shop_id', shopIds);

  if (shopsError) {
    console.error('Error fetching favorite shops:', shopsError);
    return [];
  }

  // Fetch reviews for stats
  const { data: reviews } = await supabase
    .from('reviews')
    .select('*')
    .in('shop_id', shopIds);

  // Calculate stats and return
  return (shops || []).map((shop: ShopRating) => {
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
};
