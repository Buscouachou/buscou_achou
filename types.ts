// Hand-written mirrors of backend/models/schemas.py — keep in sync.
export type Role = "admin" | "business" | "customer";
export type BizStatus = "pending" | "approved" | "rejected";
export type Availability = "pronta" | "encomenda" | "indisponivel";
export type ReqStatus = "pending" | "available" | "unavailable";

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  business_id: string | null;
}

export interface Banner {
  id: string;
  image: string;
  title: string;
  subtitle: string;
}

export interface Settings {
  platform_name: string;
  logo_url: string;
  primary_color: string;
  secondary_color: string;
  city: string;
  hero_title: string;
  hero_subtitle: string;
  hero_image: string;
  banners: Banner[];
}

export interface BusinessBase {
  name: string;
  category: string;
  description: string;
  logo: string;
  cover: string;
  whatsapp: string;
  email: string;
  address: string;
  neighborhood: string;
  city: string;
  hours: string;
}

export interface Business extends BusinessBase {
  id: string;
  status: BizStatus;
  owner_id: string;
  created_at: string;
  rating: number;
  review_count: number;
}

export interface UsersOut {
  roles: Role[];
  users: User[];
}

export interface ProductIn {
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  availability: Availability;
}

export interface Product extends ProductIn {
  id: string;
  business_id: string;
}

export interface ProductHit extends Product {
  business_name: string;
}

export interface SearchOut {
  businesses: Business[];
  products: ProductHit[];
}

export interface RequestIn {
  business_id: string;
  product_id: string | null;
  customer_name: string;
  customer_whatsapp: string;
  customer_email: string;
  quantity: number;
  notes: string;
}

export interface AvailabilityRequest extends RequestIn {
  id: string;
  product_name: string;
  status: ReqStatus;
  reply: string;
  created_at: string;
}

export interface ReviewIn {
  rating: number;
  comment: string;
}

export interface Review {
  id: string;
  business_id: string;
  business_name: string;
  user_id: string;
  user_name: string;
  rating: number;
  comment: string;
  created_at: string;
}

export interface Ok {
  ok: boolean;
}
