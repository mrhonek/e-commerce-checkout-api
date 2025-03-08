import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from './error.middleware';
import User from '../models/user.model';

// Define the structure of decoded JWT token
interface JwtPayload {
  id: string;
  email: string;
  role: string;
  [key: string]: any;
}

// Extend Express Request interface
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: string;
      };
      token?: string;
    }
  }
}

/**
 * Get JWT token from request headers or cookies
 */
const getTokenFromRequest = (req: Request): string | undefined => {
  // Check authorization header
  let token: string | undefined;
  
  if (req.headers.authorization?.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  } 
  // Check cookies
  else if (req.cookies?.jwt) {
    token = req.cookies.jwt;
  }
  
  return token;
};

/**
 * Verify JWT token and return decoded payload
 */
const verifyToken = (token: string): Promise<JwtPayload> => {
  return new Promise((resolve, reject) => {
    jwt.verify(
      token, 
      process.env.JWT_SECRET || 'your-jwt-secret',
      (err: any, decoded: any) => {
        if (err) {
          return reject(err);
        }
        
        resolve(decoded as JwtPayload);
      }
    );
  });
};

/**
 * Authentication middleware to protect routes
 */
export const protect = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Get token from request
    const token = getTokenFromRequest(req);
    
    // Check if token exists
    if (!token) {
      return next(new AppError('You are not logged in. Please log in to get access.', 401));
    }
    
    // Verify token
    const decoded = await verifyToken(token);
    
    // Check if user still exists
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) {
      return next(new AppError('The user belonging to this token no longer exists.', 401));
    }
    
    // Convert to plain object to avoid mongoose document issues
    const userObj: any = user.toObject();
    
    // Store user info and token for later use
    req.user = {
      id: decoded.id, // Use id from token instead of _id from document
      email: userObj.email,
      role: userObj.role
    };
    req.token = token;
    
    next();
  } catch (error) {
    next(new AppError('Authentication failed. Please log in again.', 401));
  }
};

/**
 * Authorization middleware to restrict access by role
 */
export const restrictTo = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    // Check if user exists and has a role
    if (!req.user || !req.user.role) {
      return next(new AppError('You do not have permission to perform this action', 403));
    }
    
    // Check if user's role is allowed
    if (!roles.includes(req.user.role)) {
      return next(new AppError('You do not have permission to perform this action', 403));
    }
    
    next();
  };
}; 