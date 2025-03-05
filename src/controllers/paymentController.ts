import { Request, Response } from 'express';
import Stripe from 'stripe';
import dotenv from 'dotenv';
import { PaymentMethod } from '../models/payment';

// Load environment variables
dotenv.config();

// Initialize Stripe client
// Using this approach to ensure we don't expose actual keys in the code
const stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_your_key', {
  apiVersion: '2023-10-16', // Update this to the current Stripe API version
});

// Mock payment methods
const paymentMethods: PaymentMethod[] = [
  {
    id: 'card',
    name: 'Credit/Debit Card',
    description: 'Pay with your credit or debit card',
    enabled: true
  },
  {
    id: 'paypal',
    name: 'PayPal',
    description: 'Pay using your PayPal account',
    enabled: false
  },
  {
    id: 'applepay',
    name: 'Apple Pay',
    description: 'Pay using Apple Pay',
    enabled: false
  }
];

// Get available payment methods
export const getPaymentMethods = (req: Request, res: Response) => {
  // Only return enabled payment methods
  const enabledMethods = paymentMethods.filter(method => method.enabled);
  res.status(200).json(enabledMethods);
};

// Create payment intent
export const createPaymentIntent = async (req: Request, res: Response) => {
  try {
    const { amount, currency = 'usd', paymentMethodId } = req.body;
    
    if (!amount) {
      return res.status(400).json({ message: 'Amount is required' });
    }
    
    // Create a payment intent with Stripe
    const paymentIntent = await stripeClient.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency,
      payment_method_types: ['card'],
      payment_method: paymentMethodId,
      confirmation_method: 'manual',
    });
    
    // Return the client secret to the frontend to complete the payment
    res.status(201).json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    res.status(500).json({ 
      message: 'Failed to create payment intent',
      error: errorMessage
    });
  }
};

// Confirm payment
export const confirmPayment = async (req: Request, res: Response) => {
  try {
    const { paymentIntentId } = req.body;
    
    if (!paymentIntentId) {
      return res.status(400).json({ message: 'Payment intent ID is required' });
    }
    
    // In a real application, we would confirm the payment with Stripe
    // For this mock, we'll simulate a successful confirmation
    
    // Mock confirmation response
    res.status(200).json({
      success: true,
      paymentId: paymentIntentId,
      status: 'succeeded',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    res.status(500).json({ 
      message: 'Failed to confirm payment',
      error: errorMessage
    });
  }
}; 