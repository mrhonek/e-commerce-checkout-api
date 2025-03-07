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
- ⬜ Migrate middleware
- ⬜ Migrate controllers
- ⬜ Migrate route handlers
- ⬜ Final integration testing

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

## Testing Commands

To run the TypeScript version of the server during development:
```bash
npm run start-ts-dev
```

To run the bypass script during development:
```bash
npm run dev:bypass
```

## TypeScript Error Fixes Needed

```
src/controllers/authController.ts:34:23 - JWT sign function parameters
src/controllers/paymentController.ts:12:3 - Stripe API version
src/middleware/authMiddleware.ts:19:7 - User type mismatch
src/routes/* - Router handler typing issues
```

## Migration Roadmap

### Phase 1: Utilities and Models (Complete)
- ✅ Focus on migrating pure utility functions
- ✅ Create proper TypeScript interfaces for data models
- ✅ Start implementing models with interfaces
- ✅ Complete remaining models (Product, Order, Cart)
- ✅ Establish mongoose connection with proper types

### Phase 2: Controllers and Routes (Current)
- ⬜ Migrate middleware (next focus)
- ⬜ Migrate controllers one at a time
- ⬜ Update route handlers to use TypeScript
- ⬜ Fix typing issues in Express route handlers

### Phase 3: Main Server and Integration
- ⬜ Replace main server with TypeScript version
- ⬜ Integration testing of all components
- ⬜ Deprecate bypass script when ready

## Deployment Strategy

Once migration is complete, we'll update the Railway deployment to use the TypeScript build process. Until then, we'll continue using the bypass script for production.

## Dependencies Added
- `@types/bcryptjs` - Type definitions for bcryptjs

## Mongoose TypeScript Tips

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