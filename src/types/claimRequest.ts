export interface ShopClaimRequest {
  id: string;
  shop_id: string;
  user_id: string;
  owner_name: string;
  email: string;
  phone: string;
  role_type: 'owner' | 'manager';
  verification_proof: string | null;
  status: 'pending' | 'approved' | 'rejected';
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface ShopUpdateRequest {
  id: string;
  shop_id: string;
  user_id: string;
  proposed_changes: {
    shop_name?: string;
    phone?: string;
    address?: string;
    schedule?: string;
    city?: string;
  };
  status: 'pending' | 'approved' | 'rejected';
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserRole {
  id: string;
  user_id: string;
  role: 'admin' | 'owner' | 'user';
  created_at: string;
}
