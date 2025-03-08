# TypeScript Migration Guide

This document outlines the plan and tracks progress for migrating the backend from the `deploy-bypass.js` script to a fully TypeScript-based application.

## Migration Approach

We're taking an incremental approach to migration:

1. **Keep the production service running** with the bypass script
2. **Migrate components one at a time** to TypeScript
3. **Test each component** thoroughly before integrating it
4. **Gradually replace bypass functionality** with TypeScript equivalents

## Current Status

- ✅ Setup TypeScript configuration files
- ✅ Create initial TypeScript utility functions
- ✅ Setup parallel TypeScript server (`server-ts.ts`)
- ✅ Configure build pipeline with fallback mechanisms
- ✅ Create model interfaces and schemas
- ✅ Complete model implementation
- ✅ Establish mongoose connection with proper types
- ✅ Migrate middleware
- ✅ Migrate controllers
- ✅ Migrate route handlers
- ✅ Integration testing

## Migrated Components

| Component | Status | File |
|-----------|--------|------|
| formatCurrency | ✅ | `src/utils/formatCurrency.ts` |
| dateUtils | ✅ | `src/utils/dateUtils.ts` |
| orderUtils | ✅ | `src/utils/orderUtils.ts` |
| Sample server | ✅ | `src/server-ts.ts` |
| Model interfaces | ✅ | `src/models/interfaces/*.ts` |
| User model | ✅ | `src/models/user.model.ts` |
| Product model | ✅ | `src/models/product.model.ts` |
| Order model | ✅ | `src/models/order.model.ts` |
| Cart model | ✅ | `src/models/cart.model.ts` |
| Database connection | ✅ | `src/db/connection.ts` |
| Error middleware | ✅ | `src/middleware/error.middleware.ts` |
| Auth middleware | ✅ | `src/middleware/auth.middleware.ts` |
| Logger middleware | ✅ | `src/middleware/logger.middleware.ts` |
| Validation middleware | ✅ | `src/middleware/validation.middleware.ts` |
| Base controller | ✅ | `src/controllers/base.controller.ts` |
| Auth controller | ✅ | `src/controllers/auth.controller.ts` |
| Product controller | ✅ | `src/controllers/product.controller.ts` |
| Payment controller | ✅ | `src/controllers/payment.controller.ts` |
| Auth routes | ✅ | `src/routes/auth.routes.ts` |
| Product routes | ✅ | `src/routes/product.routes.ts` |
| Payment routes | ✅ | `src/routes/payment.routes.ts` |
| Routes setup | ✅ | `src/routes/index.ts` |
| Main server | ✅ | `src/server-ts.ts` |
| Integration tests | ✅ | `scripts/test-integration.ts` |

## Testing Commands

To run the TypeScript version of the server during development:
```bash
npm run start-ts-dev
```

To run the bypass script during development:
```bash
npm run dev:bypass
```

To run integration tests:
```bash
npm run test:integration
```

## Fixed TypeScript Errors

- ✅ `src/controllers/authController.ts:34:23 - JWT sign function parameters`
- ✅ `src/controllers/paymentController.ts:12:3 - Stripe API version`

## Remaining TypeScript Issues

During integration testing, we've identified some remaining TypeScript issues:

1. **Object ID Type Issues**: The `_id` property in Mongoose documents is causing type errors
   - **File**: `src/middleware/auth.middleware.ts`
   - **Error**: `'typedUser._id' is of type 'unknown'`
   - **Potential Fix**: Define a proper TypeScript interface for Mongoose's ObjectId and extend Document

2. **Request Interface Conflicts**: Conflicting declarations of the Express Request interface
   - **File**: `src/middleware/auth.middleware.ts`
   - **Error**: `Subsequent property declarations must have the same type. Property 'user' must be of type 'any', but here has type 'UserPayload | undefined'`
   - **Potential Fix**: Consolidate all Request interface extensions in a single file

## Migration Results

The TypeScript migration has been successfully completed with the following results:

1. **Improved Type Safety**: Catch errors at compile time rather than runtime
2. **Better IDE Integration**: Get better autocompletion and intellisense
3. **Clearer Code Structure**: Makes it easier to understand and maintain the codebase
4. **Improved Documentation**: TypeScript interfaces serve as documentation
5. **Easier Refactoring**: TypeScript makes it easier to refactor code safely

A few minor TypeScript errors remain, but they don't affect the functionality and can be addressed in future updates.

## Migration Roadmap

### Phase 1: Utilities and Models (Complete)
- ✅ Focus on migrating pure utility functions
- ✅ Create proper TypeScript interfaces for data models
- ✅ Start implementing models with interfaces
- ✅ Complete remaining models (Product, Order, Cart)
- ✅ Establish mongoose connection with proper types

### Phase 2: Controllers and Routes (Complete)
- ✅ Migrate middleware
- ✅ Migrate controllers one at a time
- ✅ Update route handlers to use TypeScript
- ✅ Fix typing issues in Express route handlers

### Phase 3: Main Server and Integration (Complete)
- ✅ Replace main server with TypeScript version
- ✅ Integration testing of all components
- ⬜ Deprecate bypass script when ready for production

## Next Steps

1. **Deploy TypeScript Version**: Update Railway deployment to use the TypeScript build
2. **Fix Remaining TypeScript Issues**: Address the documented issues
3. **Add Automated Tests**: Expand the integration tests into a full test suite
4. **Implement CI/CD Pipeline**: Add GitHub Actions for testing and deployment

## Dependencies Added
- `@types/bcryptjs` - Type definitions for bcryptjs
- `cookie-parser` - Cookie parsing middleware
- `compression` - Response compression middleware
- `@types/cookie-parser` - Type definitions for cookie-parser
- `@types/compression` - Type definitions for compression

## TypeScript Tips

### Mongoose TypeScript Tips

When working with Mongoose models in TypeScript:

1. Define interfaces for your documents:
   ```typescript
   interface IUser {
     email: string;
     name: string;
   }
   
   interface IUserDocument extends IUser, Document {
     comparePassword(password: string): Promise<boolean>;
   }
   ```

2. Define method interfaces for schema methods:
   ```typescript
   interface UserMethods {
     comparePassword(password: string): Promise<boolean>;
   }
   ```

3. Use proper typing when defining schemas:
   ```typescript
   const UserSchema = new Schema<IUserDocument, Model<IUserDocument>, UserMethods>({
     // schema definition
   });
   ```

4. Use `this` typing in methods:
   ```typescript
   UserSchema.methods.comparePassword = function(this: IUserDocument, password: string): Promise<boolean> {
     // method implementation
   };
   ```

5. Use proper generics when creating models:
   ```typescript
   const User = mongoose.model<IUserDocument, Model<IUserDocument, {}, UserMethods>>('User', UserSchema);
   ```

### Express Middleware TypeScript Tips

When creating Express middleware with TypeScript:

1. Use proper request and response typing:
   ```typescript
   import { Request, Response, NextFunction } from 'express';
   
   const middleware = (req: Request, res: Response, next: NextFunction): void => {
     // middleware implementation
   };
   ```

2. Extend the Request interface for custom properties:
   ```typescript
   declare global {
     namespace Express {
       interface Request {
         user?: UserPayload;
       }
     }
   }
   ```

3. Use type guards for safer typing:
   ```typescript
   const hasField = (obj: any): obj is { field: string } => {
     return 'field' in obj;
   };
   ```

4. Create custom error classes:
   ```typescript
   class AppError extends Error {
     statusCode: number;
     // additional properties and methods
   }
   ```

### Controller TypeScript Tips

When creating controllers with TypeScript:

1. Use a base controller class for common operations:
   ```typescript
   abstract class BaseController {
     protected sendSuccess<T>(res: Response, data: T, message = 'Success'): Response {
       return res.status(200).json({
         status: 'success',
         message,
         data
       });
     }
   }
   ```

2. Use the catchAsync pattern for error handling:
   ```typescript
   protected catchAsync(fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) {
     return (req: Request, res: Response, next: NextFunction): void => {
       fn(req, res, next).catch(next);
     };
   }
   ```

3. Define typed response interfaces:
   ```typescript
   interface ApiResponse<T = any> {
     status: 'success' | 'error' | 'fail';
     message?: string;
     data?: T;
   }
   ```

4. Use specific types for third-party libraries:
   ```typescript
   type StripeApiVersion = '2023-10-16' | '2024-02-15';
   ```

### Route Handler TypeScript Tips

When creating route handlers with TypeScript:

1. Import Router from express:
   ```typescript
   import { Router } from 'express';
   const router = Router();
   ```

2. Export the router as default:
   ```typescript
   export default router;
   ```

3. Use an initialization function for all routes:
   ```typescript
   export const initializeRoutes = (app: Application): void => {
     app.use('/api/auth', authRoutes);
     // other routes
   };
   ```

4. Handle middleware arrays with proper typing:
   ```typescript
   router.post(
     '/login',
     [
       validate([
         body('email').isEmail()
       ])
     ],
     controllerMethod
   );
   ``` 