export interface ShopRating {
  shop_id: string;
  shop_name: string;
  address: string;
  city: string;
  phone: string | null;
  schedule: string | null;
  whatsapp: boolean;
  google_maps_url: string | null;
  latitude: number | null;
  longitude: number | null;
}

export interface Review {
  id: string;
  shop_id: string;
  user_id: string;
  reviewer_name: string;
  rating: number;
  comment: string;
  created_at: string;
}

export interface ReviewReply {
  id: string;
  review_id: string;
  shop_id: string;
  owner_user_id: string;
  reply_text: string;
  created_at: string;
  updated_at: string;
}

export interface ShopOwner {
  id: string;
  shop_id: string;
  user_id: string;
  created_at: string;
}

// Computed shop with review stats
export interface ShopWithStats extends ShopRating {
  average_rating: number;
  review_count: number;
}
