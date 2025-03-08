/**
 * CORS Test Routes
 * Used for debugging CORS issues between frontend and backend
 */

import { Router, Request, Response } from 'express';

const router = Router();

/**
 * GET /api/cors-test
 * Simple endpoint to test if CORS is working correctly
 */
router.get('/', (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'CORS test successful!',
    timestamp: new Date().toISOString(),
    origin: req.headers.origin || 'No origin header',
    headers: {
      'Access-Control-Allow-Origin': res.getHeader('Access-Control-Allow-Origin'),
      'Access-Control-Allow-Credentials': res.getHeader('Access-Control-Allow-Credentials'),
      'Access-Control-Allow-Methods': res.getHeader('Access-Control-Allow-Methods'),
      'Access-Control-Allow-Headers': res.getHeader('Access-Control-Allow-Headers')
    }
  });
});

/**
 * OPTIONS /api/cors-test
 * Explicitly handle OPTIONS request to debug preflight requests
 */
router.options('/', (req: Request, res: Response) => {
  res.status(200).end();
});

export default router; 