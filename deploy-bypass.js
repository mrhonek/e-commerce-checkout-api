// Simple Express server for Railway deployment
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const helmet = require('helmet');

// Load environment variables
dotenv.config();

// Initialize express app
const app = express();
const port = process.env.PORT || 8080;

// Middleware
app.use(helmet());
app.use(cors());

// Use JSON middleware for all routes except the Stripe webhook
app.use((req, res, next) => {
  if (req.originalUrl === '/api/webhooks/stripe') {
    next();
  } else {
    express.json()(req, res, next);
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    message: 'API server is running',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString()
  });
});

// API Routes

// Shipping
app.get('/api/shipping/options', (req, res) => {
  const shippingOptions = [
    {
      id: 'standard',
      name: 'Standard Shipping',
      price: 5.99,
      estimatedDays: '3-5 business days'
    },
    {
      id: 'express',
      name: 'Express Shipping',
      price: 12.99,
      estimatedDays: '1-2 business days'
    },
    {
      id: 'overnight',
      name: 'Overnight Shipping',
      price: 19.99,
      estimatedDays: 'Next business day'
    }
  ];
  
  res.status(200).json(shippingOptions);
});

app.post('/api/shipping/calculate', (req, res) => {
  const { address, items, shippingOptionId } = req.body;
  
  if (!address || !items || !shippingOptionId) {
    return res.status(400).json({ message: 'Missing required fields' });
  }
  
  const shippingOptions = {
    'standard': { price: 5.99, days: '3-5 business days' },
    'express': { price: 12.99, days: '1-2 business days' },
    'overnight': { price: 19.99, days: 'Next business day' }
  };
  
  const option = shippingOptions[shippingOptionId];
  
  if (!option) {
    return res.status(404).json({ message: 'Shipping option not found' });
  }
  
  // Calculate shipping cost
  let cost = option.price;
  
  // Add $2 for every 5 items
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  if (totalItems > 5) {
    cost += Math.floor(totalItems / 5) * 2;
  }
  
  res.status(200).json({
    shippingOption: {
      id: shippingOptionId,
      name: shippingOptionId.charAt(0).toUpperCase() + shippingOptionId.slice(1) + ' Shipping',
      price: option.price,
      estimatedDays: option.days
    },
    totalItems,
    shippingCost: parseFloat(cost.toFixed(2)),
    estimatedDelivery: getEstimatedDeliveryDate(option.days)
  });
});

// Cart routes
app.get('/api/cart', (req, res) => {
  res.status(200).json({
    items: [
      {
        id: 'product-1',
        name: 'Product 1',
        price: 19.99,
        quantity: 2,
        image: 'https://via.placeholder.com/150'
      },
      {
        id: 'product-2',
        name: 'Product 2',
        price: 29.99,
        quantity: 1,
        image: 'https://via.placeholder.com/150'
      }
    ],
    subtotal: 69.97,
    tax: 5.60,
    total: 75.57
  });
});

// Payment routes
app.get('/api/payment/methods', (req, res) => {
  res.status(200).json([
    { id: 'card', name: 'Credit/Debit Card' },
    { id: 'paypal', name: 'PayPal' }
  ]);
});

// Stripe webhook endpoint
app.post('/api/webhooks/stripe', express.raw({type: 'application/json'}), (req, res) => {
  const signature = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  
  try {
    // In a real implementation, you would verify the signature with Stripe
    // const event = stripe.webhooks.constructEvent(req.body, signature, webhookSecret);
    
    // For now, just log the event type and send a success response
    console.log('Received Stripe webhook event:', req.body);
    
    // Handle specific event types
    const eventType = req.body.type || 'unknown';
    
    switch (eventType) {
      case 'payment_intent.succeeded':
        console.log('Payment succeeded!');
        // Process successful payment - update order status, send confirmation email, etc.
        break;
      case 'payment_intent.payment_failed':
        console.log('Payment failed!');
        // Handle failed payment
        break;
      default:
        console.log(`Unhandled event type: ${eventType}`);
    }
    
    res.status(200).json({received: true});
  } catch (err) {
    console.error(`Webhook error: ${err.message}`);
    res.status(400).send(`Webhook Error: ${err.message}`);
  }
});

// Helper function to calculate estimated delivery date
function getEstimatedDeliveryDate(estimatedDays) {
  const today = new Date();
  let daysToAdd = 0;
  
  if (estimatedDays.includes('Next business day')) {
    daysToAdd = 1;
  } else if (estimatedDays.includes('1-2')) {
    daysToAdd = 2;
  } else if (estimatedDays.includes('3-5')) {
    daysToAdd = 5;
  } else {
    daysToAdd = 7;
  }
  
  const futureDate = new Date(today);
  futureDate.setDate(today.getDate() + daysToAdd);
  
  return futureDate.toISOString().split('T')[0];
}

// Catch-all route
app.use('*', (req, res) => {
  res.status(404).json({
    status: 'error',
    message: 'Route not found',
    availableRoutes: [
      '/health',
      '/api/shipping/options',
      '/api/shipping/calculate',
      '/api/cart',
      '/api/payment/methods',
      '/api/webhooks/stripe'
    ]
  });
});

// Start server
app.listen(port, () => {
  console.log(`API server running on port ${port}`);
}); 