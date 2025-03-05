export interface PaymentMethod {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
}

export interface PaymentIntent {
  id: string;
  clientSecret: string;
  amount: number;
  currency: string;
  status: string;
  created: number;
} 