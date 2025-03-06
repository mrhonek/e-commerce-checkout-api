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
app.use(cors()); // Enable CORS
app.use(express.json()); // Parse JSON requests

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/shipping', shippingRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/order', orderRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
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