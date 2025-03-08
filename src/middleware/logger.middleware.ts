import { Request, Response, NextFunction } from 'express';

/**
 * Request info for logging
 */
interface RequestInfo {
  method: string;
  path: string;
  params: Record<string, any>;
  query: Record<string, any>;
  body: Record<string, any>;
  ip: string;
  userId?: string;
  timestamp: Date;
}

/**
 * Format request for logging
 */
const formatRequest = (req: Request): RequestInfo => {
  // Basic request info
  const requestInfo: RequestInfo = {
    method: req.method,
    path: req.path,
    params: req.params,
    query: req.query,
    body: sanitizeBody(req.body),
    ip: req.ip || req.socket.remoteAddress || 'unknown',
    timestamp: new Date()
  };
  
  // Add user ID if authenticated
  if (req.user && 'id' in req.user) {
    requestInfo.userId = req.user.id as string;
  }
  
  return requestInfo;
};

/**
 * Sanitize request body to remove sensitive data
 */
const sanitizeBody = (body: any): Record<string, any> => {
  if (!body) return {};
  
  // Create a copy of the body
  const sanitized = { ...body };
  
  // Remove sensitive fields
  const sensitiveFields = ['password', 'passwordConfirm', 'token', 'cardNumber', 'cvv', 'cardCvv'];
  
  sensitiveFields.forEach(field => {
    if (field in sanitized) {
      sanitized[field] = '***REDACTED***';
    }
  });
  
  return sanitized;
};

/**
 * Format response data for logging
 */
const formatResponseData = (data: any): Record<string, any> => {
  if (!data) return {};
  
  // If data is too large, truncate it
  const stringified = JSON.stringify(data);
  if (stringified.length > 1000) {
    return { truncated: true, size: stringified.length, preview: stringified.substring(0, 100) + '...' };
  }
  
  return data;
};

/**
 * Response info for logging
 */
interface ResponseInfo {
  statusCode: number;
  responseTime: number;
  contentLength?: number;
  data?: Record<string, any>;
}

// Define a type for the res.end method
type ResponseEndMethod = {
  (cb?: (() => void) | undefined): Response;
  (chunk: any, cb?: (() => void) | undefined): Response;
  (chunk: any, encoding: BufferEncoding, cb?: (() => void) | undefined): Response;
};

/**
 * Logger middleware
 */
export const loggerMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  // Store the start time
  const startTime = process.hrtime();
  
  // Format initial request info for logging
  const requestInfo = formatRequest(req);
  
  // Log the request
  if (process.env.NODE_ENV !== 'test') {
    console.log(`[${new Date().toISOString()}] REQUEST: ${req.method} ${req.originalUrl}`);
    
    // Detailed logging in development
    if (process.env.NODE_ENV === 'development') {
      console.log('Request Details:', JSON.stringify(requestInfo, null, 2));
    }
  }
  
  // Capture the original end method to intercept it
  const originalEnd = res.end as ResponseEndMethod;
  
  // Override the end method to log response info
  res.end = function(
    this: Response,
    chunkOrCb?: any, 
    encodingOrCb?: BufferEncoding | (() => void),
    cb?: (() => void)
  ): Response {
    // Calculate the response time
    const hrTime = process.hrtime(startTime);
    const responseTimeMs = hrTime[0] * 1000 + hrTime[1] / 1000000;
    
    // Format response info for logging
    const responseInfo: ResponseInfo = {
      statusCode: res.statusCode,
      responseTime: parseFloat(responseTimeMs.toFixed(2)),
      contentLength: res.getHeader('content-length') ? 
        parseInt(res.getHeader('content-length') as string, 10) : undefined
    };
    
    // For non-success responses, try to capture more details
    if (res.statusCode >= 400 && (typeof chunkOrCb === 'string' || Buffer.isBuffer(chunkOrCb))) {
      try {
        const body = JSON.parse(chunkOrCb.toString('utf8'));
        responseInfo.data = formatResponseData(body);
      } catch (error) {
        // Ignore parsing errors
      }
    }
    
    // Log the response
    if (process.env.NODE_ENV !== 'test') {
      console.log(`[${new Date().toISOString()}] RESPONSE: ${req.method} ${req.originalUrl} ${res.statusCode} - ${responseTimeMs.toFixed(2)}ms`);
      
      // Detailed logging in development
      if (process.env.NODE_ENV === 'development' && res.statusCode >= 400) {
        console.log('Response Details:', JSON.stringify(responseInfo, null, 2));
      }
    }
    
    // Call the original end method
    return originalEnd.apply(this, [chunkOrCb, encodingOrCb, cb].filter(Boolean) as any);
  } as ResponseEndMethod;
  
  next();
}; 