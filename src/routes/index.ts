import { Application } from 'express';
import { notFoundMiddleware, errorMiddleware } from '../middleware';
import authRoutes from './auth.routes';
import productRoutes from './product.routes';
import paymentRoutes from './payment.routes';
import corsTestRoutes from './cors-test.route';

/**
 * Initialize all routes for the application
 * @param app Express application instance
 */
export const initializeRoutes = (app: Application): void => {
  // API routes
  app.use('/api/auth', authRoutes);
  app.use('/api/products', productRoutes);
  app.use('/api/payments', paymentRoutes);
  app.use('/api/cors-test', corsTestRoutes);
  
  // Health check route
  app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'OK', message: 'API is running' });
  });
  
  // Direct CORS test endpoint for quick testing
  app.get('/cors-test', (req, res) => {
    res.json({
      success: true,
      message: 'CORS direct test successful',
      origin: req.headers.origin || 'No origin header',
      timestamp: new Date().toISOString(),
      headers: res.getHeaders()
    });
  });
  
  // Handle 404 for API routes
  app.use('/api', notFoundMiddleware);
  
  // Error handling middleware (should be the last middleware to use)
  app.use(errorMiddleware);
}; 