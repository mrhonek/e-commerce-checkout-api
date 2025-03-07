import { Document } from 'mongoose';

/**
 * User interface representing a user in the system
 */
export interface IUser {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: 'customer' | 'admin';
  addresses?: IAddress[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Address interface for user addresses
 */
export interface IAddress {
  type: 'shipping' | 'billing';
  firstName: string;
  lastName: string;
  address1: string;
  address2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault?: boolean;
}

/**
 * User mongoose document with document methods
 */
export interface IUserDocument extends IUser, Document {
  comparePassword(password: string): Promise<boolean>;
  getFullName(): string;
}

/**
 * User authentication response
 */
export interface IUserAuthResponse {
  user: Omit<IUser, 'password'>;
  token: string;
}

/**
 * User registration request payload
 */
export interface IUserRegistrationPayload {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
} 