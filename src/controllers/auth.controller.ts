import { Request, Response, NextFunction } from 'express';
import jwt, { SignOptions } from 'jsonwebtoken';
import { ApiResponse, BaseController } from './base.controller';
import User from '../models/user.model';
import { IUserDocument, IUserRegistrationPayload } from '../models/interfaces';
import { UserPayload } from '../middleware/auth.middleware';

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
    
    // Generate JWT token
    const token = this.generateToken({
      id: user._id.toString(),
      email: user.email,
      role: user.role
    });
    
    // Send response
    return this.sendCreated(res, {
      user: {
        id: user._id.toString(),
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      },
      token
    }, 'User registered successfully');
  });
  
  /**
   * Login user and generate JWT token
   */
  login = this.catchAsync(async (req: Request, res: Response, next: NextFunction): Promise<Response<ApiResponse> | void> => {
    const { email, password } = req.body;
    
    // Check if email and password exist
    if (!email || !password) {
      return this.sendError(next, 'Please provide email and password', 400);
    }
    
    // Find user with password (explicitly include password for comparison)
    const user = await User.findOne({ email }).select('+password');
    
    // Check if user exists and password is correct
    if (!user || !(await user.comparePassword(password))) {
      return this.sendError(next, 'Incorrect email or password', 401);
    }
    
    // Generate JWT token
    const token = this.generateToken({
      id: user._id.toString(),
      email: user.email,
      role: user.role
    });
    
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
   * Get current user profile
   */
  getProfile = this.catchAsync(async (req: Request, res: Response, next: NextFunction): Promise<Response<ApiResponse> | void> => {
    // User should be available from the protect middleware
    if (!req.user || !req.user.id) {
      return this.sendError(next, 'Not authenticated', 401);
    }
    
    // Get user details
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return this.sendError(next, 'User not found', 404);
    }
    
    // Send user profile
    return this.sendSuccess(res, {
      id: user._id.toString(),
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      addresses: user.addresses || []
    }, 'User profile retrieved successfully');
  });
  
  /**
   * Logout user (client-side)
   */
  logout = (req: Request, res: Response): Response<ApiResponse> => {
    // JWT is stateless, so this is mostly for clearing cookies if used
    return this.sendSuccess(res, null, 'Logged out successfully');
  };
  
  /**
   * Generate a JWT token
   */
  private generateToken(payload: Omit<UserPayload, 'iat' | 'exp'>): string {
    const secret = process.env.JWT_SECRET || 'your-jwt-secret';
    const expiresIn = process.env.JWT_EXPIRES_IN || '30d';
    
    // Fix for TypeScript error in JWT sign function parameters
    const options: SignOptions = { expiresIn };
    
    return jwt.sign(
      payload,
      secret,
      options
    );
  }
}

// Export a singleton instance
export const authController = new AuthController(); 