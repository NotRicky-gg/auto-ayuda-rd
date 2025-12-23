import { supabase } from '@/lib/supabase';
import type { ShopRating, Review, ShopWithStats, ReviewReply, ShopOwner } from '@/types/mechanic';

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
  return shops
    .filter(shop => shop.review_count > 0)
    .slice(0, 3)
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
