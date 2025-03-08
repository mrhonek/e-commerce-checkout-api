import { Application } from 'express';
import { notFoundMiddleware, errorMiddleware } from '../middleware';
import authRoutes from './auth.routes';
import productRoutes from './product.routes';
import paymentRoutes from './payment.routes';

/**
 * Initialize all routes for the application
 * @param app Express application instance
 */
export const initializeRoutes = (app: Application): void => {
  // API routes
  app.use('/api/auth', authRoutes);
  app.use('/api/products', productRoutes);
  app.use('/api/payments', paymentRoutes);
  
  // Health check route
  app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'OK', message: 'API is running' });
  });
  
  // Handle 404 for API routes
  app.use('/api', notFoundMiddleware);
  
  // Error handling middleware (should be the last middleware to use)
  app.use(errorMiddleware);
}; 