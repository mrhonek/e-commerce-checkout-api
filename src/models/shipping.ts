export interface ShippingOption {
  id: string;
  name: string;
  price: number;
  estimatedDays: string;
}

export interface Address {
  street: string;
  apartment?: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
} 