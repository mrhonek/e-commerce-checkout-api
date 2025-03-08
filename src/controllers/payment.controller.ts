import { Request, Response, NextFunction } from 'express';
import Stripe from 'stripe';
import { ApiResponse, BaseController } from './base.controller';
import { formatCurrency } from '../utils/formatCurrency';

// Define the specific Stripe API version to use
type StripeApiVersion = '2023-10-16' | '2024-02-15' | '2024-05-15' | '2024-08-15';

/**
 * Payment controller for handling Stripe payments
 */
export class PaymentController extends BaseController {
  private stripe: Stripe;

  constructor() {
    super();
    
    // Initialize Stripe with API key and API version
    const stripeApiKey = process.env.STRIPE_SECRET_KEY || 'your-stripe-secret-key';
    
    // Use a specific API version that matches Stripe's requirements
    const apiVersion: StripeApiVersion = '2023-10-16';
    
    this.stripe = new Stripe(stripeApiKey, {
      apiVersion,
    });
  }

  /**
   * Create a payment intent for checkout
   */
  createPaymentIntent = this.catchAsync(async (req: Request, res: Response, next: NextFunction): Promise<Response<ApiResponse> | void> => {
    const { amount, currency = 'usd', paymentMethodTypes = ['card'] } = req.body;
    
    // Validate amount
    if (!amount || amount <= 0) {
      return this.sendError(next, 'Payment amount must be greater than 0', 400);
    }
    
    try {
      // Create payment intent with Stripe
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency,
        payment_method_types: paymentMethodTypes,
        metadata: {
          userId: req.user?.id || 'guest',
          orderId: req.body.orderId || 'pending'
        }
      });
      
      // Return client secret for frontend to complete payment
      return this.sendSuccess(res, {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        amount: formatCurrency(amount)
      }, 'Payment intent created');
    } catch (error) {
      console.error('Stripe payment intent error:', error);
      
      // Extract Stripe error message
      let errorMessage = 'Payment processing failed';
      if (error instanceof Stripe.errors.StripeError) {
        errorMessage = error.message;
      }
      
      return this.sendError(next, errorMessage, 400);
    }
  });

  /**
   * Confirm a payment
   */
  confirmPayment = this.catchAsync(async (req: Request, res: Response, next: NextFunction): Promise<Response<ApiResponse> | void> => {
    const { paymentIntentId } = req.body;
    
    if (!paymentIntentId) {
      return this.sendError(next, 'Payment intent ID is required', 400);
    }
    
    try {
      // Retrieve the payment intent to check its status
      const paymentIntent = await this.stripe.paymentIntents.retrieve(paymentIntentId);
      
      // Check if payment is successful
      if (paymentIntent.status !== 'succeeded') {
        return this.sendError(next, `Payment not complete. Status: ${paymentIntent.status}`, 400);
      }
      
      // Return payment confirmation details
      return this.sendSuccess(res, {
        paymentIntentId,
        status: paymentIntent.status,
        amount: formatCurrency(paymentIntent.amount / 100), // Convert from cents
        paymentMethod: {
          id: paymentIntent.payment_method,
          type: paymentIntent.payment_method_types?.[0] || 'card'
        }
      }, 'Payment confirmed');
    } catch (error) {
      console.error('Stripe payment confirmation error:', error);
      
      // Extract Stripe error message
      let errorMessage = 'Payment confirmation failed';
      if (error instanceof Stripe.errors.StripeError) {
        errorMessage = error.message;
      }
      
      return this.sendError(next, errorMessage, 400);
    }
  });

  /**
   * Handle Stripe webhook events
   */
  handleWebhook = this.catchAsync(async (req: Request, res: Response, next: NextFunction): Promise<Response<ApiResponse> | void> => {
    const signature = req.headers['stripe-signature'] as string;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';
    
    if (!signature || !webhookSecret) {
      return this.sendError(next, 'Missing webhook signature', 400);
    }
    
    let event: Stripe.Event;
    
    try {
      // Verify webhook signature
      event = this.stripe.webhooks.constructEvent(
        req.body,
        signature,
        webhookSecret
      );
    } catch (error) {
      console.error('Webhook signature verification failed:', error);
      return this.sendError(next, 'Webhook signature verification failed', 400);
    }
    
    // Handle specific events
    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log(`PaymentIntent succeeded: ${paymentIntent.id}`);
        // TODO: Update order status in database
        break;
        
      case 'payment_intent.payment_failed':
        const failedPayment = event.data.object as Stripe.PaymentIntent;
        console.log(`PaymentIntent failed: ${failedPayment.id}`);
        // TODO: Handle failed payment
        break;
        
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
    
    // Return success response to Stripe
    return this.sendSuccess(res, { received: true }, 'Webhook received');
  });
}

// Export a singleton instance
export const paymentController = new PaymentController(); 