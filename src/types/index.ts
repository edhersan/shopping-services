export type CurrencyCode = "USD";

export type ProductCategory = "electronics" | "clothing" | "home" | "sports";

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: CurrencyCode;
  category: ProductCategory;
  imageUrl: string;
  stock: number;
  rating: number;
}

export interface OrderLineInput {
  productId: string;
  quantity: number;
}

export interface PricedCartItem {
  productId: string;
  name: string;
  imageUrl: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
}

export interface PricingSummary {
  items: PricedCartItem[];
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  currency: CurrencyCode;
}

export interface Customer {
  fullName: string;
  email: string;
  address: string;
  city: string;
  zipCode: string;
}

export interface PaymentRequest {
  cardNumber: string;
  holderName: string;
  expiry: string;
  cvv: string;
}

export interface PaymentSummary {
  brand: string;
  last4: string;
  approved: boolean;
}

export type OrderStatus = "paid" | "declined";

export interface Order {
  id: string;
  customer: Customer;
  items: PricedCartItem[];
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  currency: CurrencyCode;
  status: OrderStatus;
  payment: PaymentSummary;
  createdAt: string;
}

export interface CreateOrderRequest {
  items: OrderLineInput[];
  customer: Customer;
  payment: PaymentRequest;
}

export interface ApiErrorPayload {
  code: string;
  message: string;
  details?: string[];
}

export type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; error: ApiErrorPayload };

export interface HealthPayload {
  status: "ok";
  service: string;
  timestamp: string;
}

export interface PublicUser {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

export interface StoredUser extends PublicUser {
  passwordHash: string;
}

export interface AuthCredentials {
  identifier: string;
  password: string;
}

export interface RegisterUserRequest {
  name: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: PublicUser;
}
