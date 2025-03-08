import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { ApiResponse, BaseController } from './base.controller';
import User from '../models/user.model';
import { IUserDocument, IUserRegistrationPayload } from '../models/interfaces/user.interface';
import { UserPayload } from '../types';

/**
 * Authentication controller responsible for user registration, login, and session management
 */
export class AuthController extends BaseController {
  /**
   * Register a new user
   */
  register = this.catchAsync(async (req: Request, res: Response, next: NextFunction): Promise<Response<ApiResponse> | void> => {
    const { email, password, firstName, lastName }: IUserRegistrationPayload = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return this.sendError(next, 'Email is already registered', 400);
    }
    
    // Create new user
    const user = await User.create({
      email,
      password, // Will be hashed in the pre-save hook
      firstName,
      lastName,
      role: 'customer'
    });
    
    const userDoc = user as IUserDocument;
    
    // Generate JWT token
    const token = jwt.sign(
      {
        id: userDoc._id.toString(),
        email: userDoc.email,
        role: userDoc.role
      },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '30d' }
    );
    
    // Send response
    return this.sendCreated(res, {
      user: {
        id: userDoc._id.toString(),
        email: userDoc.email,
        firstName: userDoc.firstName,
        lastName: userDoc.lastName,
        role: userDoc.role
      },
      token
    }, 'User registered successfully');
  });

  /**
   * Login user and get token
   */
  login = this.catchAsync(async (req: Request, res: Response, next: NextFunction): Promise<Response<ApiResponse> | void> => {
    const { email, password } = req.body;
    
    // Check if user exists
    const user = await User.findOne({ email }) as IUserDocument | null;
    if (!user) {
      return this.sendError(next, 'Invalid credentials', 401);
    }
    
    // Check if password is correct
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return this.sendError(next, 'Invalid credentials', 401);
    }
    
    // Generate JWT token
    const token = jwt.sign(
      {
        id: user._id.toString(),
        email: user.email,
        role: user.role
      },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '30d' }
    );
    
    // Send response
    return this.sendSuccess(res, {
      user: {
        id: user._id.toString(),
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      },
      token
    }, 'Login successful');
  });

  /**
   * Get user profile
   */
  getProfile = this.catchAsync(async (req: Request, res: Response, next: NextFunction): Promise<Response<ApiResponse> | void> => {
    if (!req.user || !req.user.id) {
      return this.sendError(next, 'User not found', 404);
    }
    
    // Get user from database
    const user = await User.findById(req.user.id).select('-password') as IUserDocument | null;
    if (!user) {
      return this.sendError(next, 'User not found', 404);
    }
    
    // Send response
    return this.sendSuccess(res, {
      id: user._id.toString(),
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      addresses: user.addresses || []
    }, 'User profile found');
  });

  /**
   * Logout user (client-side)
   */
  logout = this.catchAsync(async (req: Request, res: Response): Promise<Response<ApiResponse>> => {
    // JWT is stateless, so this is mostly for clearing cookies if used
    return this.sendSuccess(res, null, 'Logged out successfully');
  });
}

// Export a singleton instance
export const authController = new AuthController(); 