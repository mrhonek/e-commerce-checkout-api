import { Request, Response, NextFunction } from 'express';
import { validationResult, ValidationChain, ValidationError } from 'express-validator';
import { AppError } from './error.middleware';

/**
 * Type guard to check if error has msg property
 */
const hasMsg = (error: ValidationError): error is ValidationError & { msg: string } => {
  return 'msg' in error;
};

/**
 * Type guard to check if error has param property
 */
const hasParam = (error: ValidationError): error is ValidationError & { param: string } => {
  return 'param' in error;
};

/**
 * Middleware to validate request data using express-validator
 * @param validations - Array of express-validator validation chains
 */
export const validate = (validations: ValidationChain[]) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Execute all validations
    await Promise.all(validations.map(validation => validation.run(req)));
    
    // Get validation results
    const errors = validationResult(req);
    
    // If there are errors, format and return them
    if (!errors.isEmpty()) {
      const errorMessages = errors.array().map(err => {
        if (hasMsg(err)) {
          return `${err.msg}${hasParam(err) && err.param ? ` (${err.param})` : ''}`;
        }
        return 'Invalid value';
      });
      
      const errorMessage = `Validation error: ${errorMessages.join(', ')}`;
      return next(new AppError(errorMessage, 400));
    }
    
    // No errors, proceed
    next();
  };
};

/**
 * Format error for response
 */
export const formatValidationErrors = (errors: ValidationError[]): { field: string; message: string }[] => {
  return errors.map(err => ({
    field: hasParam(err) ? err.param : 'unknown',
    message: hasMsg(err) ? err.msg : 'Invalid value'
  }));
}; 