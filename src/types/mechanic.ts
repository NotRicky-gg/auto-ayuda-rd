export interface MechanicShop {
  id: string;
  name: string;
  address: string;
  neighborhood: string;
  phone: string;
  services: string[];
  category: string;
  rating: number;
  review_count: number;
  hours: string;
  featured: boolean;
}
