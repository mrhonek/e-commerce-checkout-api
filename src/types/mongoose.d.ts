/**
 * Custom type definitions for Mongoose
 */
import mongoose from 'mongoose';

// Make sure Mongoose types are properly defined
declare global {
  // Extend the Mongoose namespace to add better typing
  namespace mongoose {
    interface Types {
      ObjectId: {
        prototype: mongoose.Types.ObjectId;
        new(id?: string | mongoose.Types.ObjectId): mongoose.Types.ObjectId;
      };
    }
    
    interface Document {
      _id: mongoose.Types.ObjectId;
    }
  }
}

// Helper type for documents with IDs
export type WithId<T> = T & {
  _id: mongoose.Types.ObjectId;
  id?: string;
}; 