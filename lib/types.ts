export type Product = {
  id: string;
  slug: string;
  name: string;
  brand: string;
  category: "telephones" | "pc" | "audio" | "accessoires";
  price: number; // DZD
  is_featured?: boolean;
  compare_at_price?: number | null;
  images: string[];
  colors?: string[];
  storage_options?: string[];
  stock: number;
  rating?: number;
  reviews_count?: number;
  specs?: Record<string, string>;
  description?: string;
};

export type CartItem = {
  productId: string;
  name: string;
  image: string;
  price: number;
  color?: string;
  storage?: string;
  qty: number;
  stock?: number; // stock connu à l'ajout, sert à plafonner la quantité
};

export type Wilaya = {
  id: number;
  name: string;
  zone: number;
  is_deliverable: boolean;
};

export type Commune = {
  id: number;
  name: string;
  wilaya_id: number;
  has_stop_desk: boolean;
  is_deliverable: boolean;
};

export type DeliveryType = "home" | "stopdesk";

export type Order = {
  id?: string;
  full_name: string;
  phone: string;
  wilaya_id: number;
  commune_id: number;
  address: string;
  delivery_type: DeliveryType;
  items: CartItem[];
  subtotal: number;
  shipping_cost: number;
  total: number;
  payment_method: "cod"; // cash on delivery only
  yalidine_tracking?: string | null;
  status?: "pending" | "confirmed" | "shipped" | "delivered" | "cancelled";
  created_at?: string;
};