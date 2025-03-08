import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import cartRoutes from './routes/cartRoutes';
import shippingRoutes from './routes/shippingRoutes';
import paymentRoutes from './routes/paymentRoutes';
import orderRoutes from './routes/orderRoutes';
import authRoutes from './routes/authRoutes';
import connectDB from './db/connection';

// Load environment variables
dotenv.config();

// Initialize express app
const app = express();
const port = process.env.PORT || 5000;

// Connect to MongoDB
connectDB()
  .then(() => console.log('Connected to database'))
  .catch(err => console.error('Database connection error:', err));

// Middleware
app.use(helmet()); // Security headers

// ** TEMPORARY ** Permissive CORS configuration to unblock development
app.use(cors({
  origin: true, // Allow all origins
  credentials: true, // Allow credentials
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Log for debugging CORS
app.use((req, res, next) => {
  console.log(`Request from origin: ${req.headers.origin}`);
  next();
});

app.use(express.json()); // Parse JSON requests

// Add this before the routes are initialized
// Handle preflight requests
app.options('*', cors());

// Special handler for CORS issues
app.use('/api/cors-test', (req, res) => {
  res.json({ 
    message: 'CORS is working properly!',
    headers: req.headers,
    timestamp: new Date().toISOString()
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/shipping', shippingRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/order', orderRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Server is running' });
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
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

export default app; 