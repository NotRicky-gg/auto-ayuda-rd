import { supabase } from '@/lib/supabase';
import type { ShopClaimRequest, ShopUpdateRequest, UserRole } from '@/types/claimRequest';
import type { ShopRating } from '@/types/mechanic';

// ==================== USER ROLES ====================

export const checkUserRole = async (userId: string, role: 'admin' | 'owner' | 'user'): Promise<boolean> => {
  const { data, error } = await supabase
    .from('user_roles')
    .select('id')
    .eq('user_id', userId)
    .eq('role', role)
    .maybeSingle();

  if (error) {
    console.error('Error checking user role:', error);
    return false;
  }

  return !!data;
};

export const checkIsAdmin = async (userId: string): Promise<boolean> => {
  return checkUserRole(userId, 'admin');
};

// ==================== SHOP CLAIMED STATUS ====================

// Check if shop is claimed (has entry in shop_owners)
export const checkShopClaimed = async (shopId: string): Promise<boolean> => {
  const { data, error } = await supabase
    .from('shop_owners')
    .select('id')
    .eq('shop_id', shopId)
    .maybeSingle();

  if (error) {
    console.error('Error checking shop claimed status:', error);
    return false;
  }

  return !!data;
};

// Check if user has a pending claim for this shop
export const checkPendingClaim = async (shopId: string, userId: string): Promise<boolean> => {
  const { data, error } = await supabase
    .from('shop_claim_requests')
    .select('id')
    .eq('shop_id', shopId)
    .eq('user_id', userId)
    .eq('status', 'pending')
    .maybeSingle();

  if (error) {
    console.error('Error checking pending claim:', error);
    return false;
  }

  return !!data;
};

// Check if user has a rejected claim for this shop (can resubmit)
export const fetchRejectedClaim = async (shopId: string, userId: string): Promise<ShopClaimRequest | null> => {
  const { data, error } = await supabase
    .from('shop_claim_requests')
    .select('*')
    .eq('shop_id', shopId)
    .eq('user_id', userId)
    .eq('status', 'rejected')
    .order('updated_at', { ascending: false })
    .maybeSingle();

  if (error) {
    console.error('Error fetching rejected claim:', error);
    return null;
  }

  return data;
};

// Delete a rejected claim so user can resubmit
export const deleteRejectedClaim = async (claimId: string): Promise<void> => {
  const { error } = await supabase
    .from('shop_claim_requests')
    .delete()
    .eq('id', claimId)
    .eq('status', 'rejected');

  if (error) {
    console.error('Error deleting rejected claim:', error);
    throw error;
  }
};

// ==================== CLAIM REQUESTS ====================

export const submitClaimRequest = async (
  shopId: string,
  userId: string,
  ownerName: string,
  email: string,
  phone: string,
  roleType: 'owner' | 'manager',
  verificationProof?: string
): Promise<ShopClaimRequest | null> => {
  const { data, error } = await supabase
    .from('shop_claim_requests')
    .insert({
      shop_id: shopId,
      user_id: userId,
      owner_name: ownerName,
      email,
      phone,
      role_type: roleType,
      verification_proof: verificationProof || null,
    })
    .select()
    .single();

  if (error) {
    console.error('Error submitting claim request:', error);
    throw error;
  }

  return data;
};

export const fetchAllClaimRequests = async (): Promise<(ShopClaimRequest & { shop?: ShopRating })[]> => {
  const { data: requests, error } = await supabase
    .from('shop_claim_requests')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching claim requests:', error);
    return [];
  }

  if (!requests || requests.length === 0) return [];

  // Get shop details
  const shopIds = [...new Set(requests.map(r => r.shop_id))];
  const { data: shops } = await supabase
    .from('shop_ratings')
    .select('*')
    .in('shop_id', shopIds);

  return requests.map(request => ({
    ...request,
    shop: shops?.find(s => s.shop_id === request.shop_id),
  }));
};

export const approveClaimRequest = async (requestId: string): Promise<void> => {
  const { error } = await supabase.rpc('approve_claim_request', { _request_id: requestId });

  if (error) {
    console.error('Error approving claim request:', error);
    throw error;
  }
};

export const rejectClaimRequest = async (requestId: string, adminNotes?: string): Promise<void> => {
  const { error } = await supabase.rpc('reject_claim_request', { 
    _request_id: requestId, 
    _admin_notes: adminNotes || null 
  });

  if (error) {
    console.error('Error rejecting claim request:', error);
    throw error;
  }
};

// ==================== UPDATE REQUESTS ====================

export const submitUpdateRequest = async (
  shopId: string,
  userId: string,
  proposedChanges: ShopUpdateRequest['proposed_changes']
): Promise<ShopUpdateRequest | null> => {
  const { data, error } = await supabase
    .from('shop_update_requests')
    .insert({
      shop_id: shopId,
      user_id: userId,
      proposed_changes: proposedChanges,
    })
    .select()
    .single();

  if (error) {
    console.error('Error submitting update request:', error);
    throw error;
  }

  return data;
};

export const fetchAllUpdateRequests = async (): Promise<(ShopUpdateRequest & { shop?: ShopRating })[]> => {
  const { data: requests, error } = await supabase
    .from('shop_update_requests')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching update requests:', error);
    return [];
  }

  if (!requests || requests.length === 0) return [];

  // Get shop details
  const shopIds = [...new Set(requests.map(r => r.shop_id))];
  const { data: shops } = await supabase
    .from('shop_ratings')
    .select('*')
    .in('shop_id', shopIds);

  return requests.map(request => ({
    ...request,
    shop: shops?.find(s => s.shop_id === request.shop_id),
  }));
};

export const fetchPendingUpdateRequestsForShop = async (shopId: string): Promise<ShopUpdateRequest[]> => {
  const { data, error } = await supabase
    .from('shop_update_requests')
    .select('*')
    .eq('shop_id', shopId)
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching pending update requests:', error);
    return [];
  }

  return data || [];
};

export const approveUpdateRequest = async (requestId: string): Promise<void> => {
  const { error } = await supabase.rpc('approve_update_request', { _request_id: requestId });

  if (error) {
    console.error('Error approving update request:', error);
    throw error;
  }
};

export const rejectUpdateRequest = async (requestId: string, adminNotes?: string): Promise<void> => {
  const { error } = await supabase.rpc('reject_update_request', { 
    _request_id: requestId, 
    _admin_notes: adminNotes || null 
  });

  if (error) {
    console.error('Error rejecting update request:', error);
    throw error;
  }
};
