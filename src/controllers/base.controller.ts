import { Request, Response, NextFunction } from 'express';
import { AppError } from '../middleware/error.middleware';

/**
 * Base controller response for standard structure
 */
export interface ApiResponse<T = any> {
  status: 'success' | 'error' | 'fail';
  message?: string;
  data?: T;
  error?: any;
}

/**
 * Paginated response interface
 */
export interface PaginatedResponse<T = any> extends ApiResponse<T[]> {
  pagination: {
    total: number;
    limit: number;
    page: number;
    pages: number;
  };
}

/**
 * Base controller with common utilities
 */
export abstract class BaseController {
  /**
   * Create a success response
   */
  protected sendSuccess<T>(
    res: Response,
    data: T,
    message = 'Success',
    statusCode = 200
  ): Response<ApiResponse<T>> {
    return res.status(statusCode).json({
      status: 'success',
      message,
      data
    });
  }

  /**
   * Create a paginated response
   */
  protected sendPaginated<T>(
    res: Response,
    data: T[],
    total: number,
    page: number,
    limit: number,
    message = 'Success'
  ): Response<PaginatedResponse<T>> {
    const pages = Math.ceil(total / limit);
    
    return res.status(200).json({
      status: 'success',
      message,
      data,
      pagination: {
        total,
        limit,
        page,
        pages
      }
    });
  }

  /**
   * Send a 201 Created response with data
   */
  protected sendCreated<T>(
    res: Response,
    data: T,
    message = 'Resource created successfully'
  ): Response<ApiResponse<T>> {
    return this.sendSuccess(res, data, message, 201);
  }

  /**
   * Send a 204 No Content response (for successful deletion)
   */
  protected sendNoContent(
    res: Response
  ): Response {
    return res.status(204).send();
  }

  /**
   * Create an API error and pass to the error handler middleware
   */
  protected sendError(
    next: NextFunction,
    message: string,
    statusCode = 400
  ): void {
    next(new AppError(message, statusCode));
  }

  /**
   * Async handler wrapper to catch errors
   */
  protected catchAsync(fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) {
    return (req: Request, res: Response, next: NextFunction): void => {
      fn(req, res, next).catch(next);
    };
  }
}

/**
 * Parse pagination parameters
 */
export const parsePagination = (req: Request): { page: number; limit: number; skip: number } => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const skip = (page - 1) * limit;
  
  return { page, limit, skip };
}; 