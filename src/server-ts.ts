/**
 * TypeScript Server Entry Point
 * 
 * This is a TypeScript version of the server that uses TypeScript modules.
 * It will gradually replace the deploy-bypass.js file as more code is migrated.
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
// Import our TypeScript utilities
import { formatCurrency } from './utils/formatCurrency';
import { getEstimatedDeliveryDate } from './utils/dateUtils';
import { calculateOrderTotals, formatOrderForDisplay, generateOrderId } from './utils/orderUtils';

// Load environment variables
dotenv.config();

// Initialize express app
const app = express();
const port = process.env.PORT || 5000;

// Configure CORS with allowed origins
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  'http://localhost:4173',
  process.env.CORS_ORIGIN,
  // Common development origins
  'http://localhost:8080',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:3000',
  // Vercel deployment URLs
  'https://e-commerce-checkout-redesign.vercel.app',
  'https://e-commerce-checkout-redesign-fqsb18vg3-mikes-projects-15384662.vercel.app',
  // Add any other Vercel preview URLs with the following pattern
  'https://e-commerce-checkout-redesign-git-*-mikes-projects-15384662.vercel.app',
].filter(Boolean); // Filter out any undefined values

// Middleware
app.use(helmet()); // Security headers
app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps, curl requests)
    if (!origin) return callback(null, true);
    
    // Check if the origin is allowed
    if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV !== 'production') {
      callback(null, true);
    } else {
      console.log('Blocked by CORS:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
app.use(express.json()); // Parse JSON requests

// Sample route using TypeScript utilities
app.get('/api/sample', (req, res) => {
  const sampleItems = [
    { name: 'Product 1', price: 29.99, quantity: 2 },
    { name: 'Product 2', price: 49.99, quantity: 1 }
  ];
  
  const orderId = generateOrderId();
  const totals = calculateOrderTotals(sampleItems, 5.99);
  const estimatedDelivery = getEstimatedDeliveryDate(3);
  
  const response = {
    success: true,
    data: {
      orderId,
      items: sampleItems,
      totals: {
        ...totals,
        formattedSubtotal: formatCurrency(totals.subtotal),
        formattedShipping: formatCurrency(totals.shipping),
        formattedTax: formatCurrency(totals.tax),
        formattedTotal: formatCurrency(totals.total)
      },
      estimatedDelivery
    }
  };
  
  res.json(response);
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'TypeScript Server is running' });
});

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({
    status: 'error',
    message: 'Something went wrong on the server'
  });
});

// Start server
if (process.env.NODE_ENV !== 'test') {
  app.listen(port, () => {
    console.log(`TypeScript server running on port ${port}`);
  });
}

export default app; 