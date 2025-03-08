import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Product from '../models/product.model';
import User from '../models/user.model';

// Load environment variables
dotenv.config();

// MongoDB connection URI - using Railway MongoDB instance
const MONGO_URI = process.env.MONGODB_URI || (() => {
  console.error('ERROR: MONGODB_URI environment variable is not set.');
  console.error('Please make sure your .env file contains the Railway connection string.');
  process.exit(1);
  return '';
})();

// Sample product data
const products = [
  {
    name: 'Classic White T-Shirt',
    slug: 'classic-white-t-shirt',
    price: 29.99,
    description: 'A comfortable and versatile white t-shirt made from 100% cotton.',
    category: 'clothing',
    sku: 'TS-WHT-001',
    stockQuantity: 90,
    images: ['https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80'],
    features: ['100% cotton', 'Machine washable', 'Regular fit'],
    variants: [
      { size: 'S', color: 'white', inventory: 25 },
      { size: 'M', color: 'white', inventory: 30 },
      { size: 'L', color: 'white', inventory: 20 },
      { size: 'XL', color: 'white', inventory: 15 }
    ],
    tags: ['t-shirt', 'casual', 'essential'],
    isInStock: true,
    isFeatured: true
  },
  {
    name: 'Classic Black T-Shirt',
    slug: 'classic-black-t-shirt',
    price: 29.99,
    description: 'A comfortable and versatile black t-shirt made from 100% cotton.',
    category: 'clothing',
    sku: 'TS-BLK-001',
    stockQuantity: 85,
    images: ['https://images.unsplash.com/photo-1503341504253-dff4815485f1?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80'],
    features: ['100% cotton', 'Machine washable', 'Regular fit'],
    variants: [
      { size: 'S', color: 'black', inventory: 25 },
      { size: 'M', color: 'black', inventory: 30 },
      { size: 'L', color: 'black', inventory: 20 },
      { size: 'XL', color: 'black', inventory: 15 }
    ],
    tags: ['t-shirt', 'casual', 'essential'],
    isInStock: true,
    isFeatured: false
  },
  {
    name: 'Slim Fit Jeans',
    slug: 'slim-fit-jeans',
    price: 59.99,
    description: 'Modern slim fit jeans with a comfortable stretch.',
    category: 'clothing',
    sku: 'JN-BLU-001',
    stockQuantity: 50,
    images: ['https://images.unsplash.com/photo-1542272604-787c3835535d?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80'],
    features: ['98% cotton, 2% elastane', 'Slim fit', 'Machine washable'],
    variants: [
      { size: '30x32', color: 'blue', inventory: 20 },
      { size: '32x32', color: 'blue', inventory: 25 },
      { size: '34x32', color: 'blue', inventory: 25 },
      { size: '36x32', color: 'blue', inventory: 15 }
    ],
    tags: ['jeans', 'slim-fit', 'casual'],
    isInStock: true,
    isFeatured: false
  },
  {
    name: 'Wireless Headphones',
    slug: 'wireless-headphones',
    price: 129.99,
    description: 'High-quality wireless headphones with noise cancellation.',
    category: 'electronics',
    sku: 'HP-BLK-001',
    stockQuantity: 75,
    images: ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80'],
    features: ['Bluetooth 5.0', '30-hour battery life', 'Active noise cancellation'],
    variants: [
      { color: 'black', inventory: 35 },
      { color: 'white', inventory: 25 },
      { color: 'blue', inventory: 15 }
    ],
    tags: ['headphones', 'wireless', 'audio'],
    isInStock: true,
    isFeatured: true
  },
  {
    name: 'Smart Watch',
    slug: 'smart-watch',
    price: 249.99,
    description: 'Advanced smartwatch with health tracking and notifications.',
    category: 'electronics',
    sku: 'SW-BLK-001',
    stockQuantity: 35,
    images: ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80'],
    features: ['Heart rate monitor', 'GPS', 'Water resistant', '5-day battery life'],
    variants: [
      { color: 'black', inventory: 20 },
      { color: 'silver', inventory: 15 }
    ],
    tags: ['smartwatch', 'fitness', 'wearable'],
    isInStock: true,
    isFeatured: true
  }
];

// Sample user data (with hashed passwords in a real scenario)
const users = [
  {
    email: 'customer@example.com',
    password: 'password123', // In real scenario, this would be hashed
    firstName: 'John',
    lastName: 'Doe',
    role: 'customer'
  },
  {
    email: 'admin@example.com',
    password: 'admin123', // In real scenario, this would be hashed
    firstName: 'Admin',
    lastName: 'User',
    role: 'admin'
  }
];

async function seedDatabase() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB...');
    
    // Clear existing data (optional)
    await Product.deleteMany({});
    console.log('Products collection cleared');
    
    // Insert products
    const insertedProducts = await Product.insertMany(products);
    console.log(`${insertedProducts.length} products seeded successfully!`);
    
    // Clear existing users (be careful in production!)
    await User.deleteMany({});
    console.log('Users collection cleared');
    
    // Insert users
    const insertedUsers = await User.insertMany(users);
    console.log(`${insertedUsers.length} users seeded successfully!`);
    
    console.log('Database seeding completed!');
  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    // Disconnect from the database
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Execute the seeding function
seedDatabase(); 