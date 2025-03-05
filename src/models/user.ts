import mongoose, { Document, Schema } from 'mongoose';
import crypto from 'crypto';

export interface User extends Document {
  email: string;
  firstName: string;
  lastName: string;
  passwordHash: string;
  salt: string;
  role: 'user' | 'admin';
  createdAt: Date;
  updatedAt: Date;
  lastLogin?: Date;
  addresses: {
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
    isDefault: boolean;
  }[];
  setPassword(password: string): void;
  validatePassword(password: string): boolean;
}

const userSchema = new Schema<User>(
  {
    email: { 
      type: String, 
      required: true, 
      unique: true,
      trim: true,
      lowercase: true
    },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    passwordHash: { type: String, required: true },
    salt: { type: String, required: true },
    role: { 
      type: String, 
      enum: ['user', 'admin'], 
      default: 'user' 
    },
    lastLogin: { type: Date },
    addresses: [{
      street: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      zip: { type: String, required: true },
      country: { type: String, required: true },
      isDefault: { type: Boolean, default: false }
    }]
  },
  { timestamps: true }
);

userSchema.methods.setPassword = function(password: string): void {
  this.salt = crypto.randomBytes(16).toString('hex');
  this.passwordHash = crypto
    .pbkdf2Sync(password, this.salt, 1000, 64, 'sha512')
    .toString('hex');
};

userSchema.methods.validatePassword = function(password: string): boolean {
  const hash = crypto
    .pbkdf2Sync(password, this.salt, 1000, 64, 'sha512')
    .toString('hex');
  return this.passwordHash === hash;
};

export const UserModel = mongoose.model<User>('User', userSchema); 