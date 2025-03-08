/**
 * TypeScript Integration Test Script
 * 
 * This script tests various components of the TypeScript implementation
 * to ensure they work correctly together.
 * 
 * Run with: ts-node scripts/test-integration.ts
 */

import mongoose from 'mongoose';
import db from '../src/db/connection';
import { formatCurrency } from '../src/utils/formatCurrency';
import { getEstimatedDeliveryDate } from '../src/utils/dateUtils';
import { calculateOrderTotals } from '../src/utils/orderUtils';
import User from '../src/models/user.model';
import Product from '../src/models/product.model';

// Set up test environment
process.env.NODE_ENV = 'test';

// Test utility functions
function testUtilityFunctions() {
  console.log('\n=== Testing Utility Functions ===');
  
  // Test formatCurrency
  const price = 49.99;
  const formattedPrice = formatCurrency(price);
  console.log(`formatCurrency(${price}) => ${formattedPrice}`);
  
  // Test getEstimatedDeliveryDate
  const estimatedDays = 3;
  const deliveryDate = getEstimatedDeliveryDate(estimatedDays);
  console.log(`getEstimatedDeliveryDate(${estimatedDays}) => ${deliveryDate}`);
  
  // Test calculateOrderTotals
  const items = [
    { productId: '1', name: 'Test Product 1', price: 29.99, quantity: 2, image: '', sku: '' },
    { productId: '2', name: 'Test Product 2', price: 49.99, quantity: 1, image: '', sku: '' }
  ];
  const shippingCost = 5.99;
  const totals = calculateOrderTotals(items, shippingCost);
  console.log('calculateOrderTotals() =>', JSON.stringify(totals, null, 2));
}

// Test database connection
async function testDatabaseConnection() {
  console.log('\n=== Testing Database Connection ===');
  
  try {
    await db.connectDB();
    console.log('MongoDB connection successful');
    
    // Check connection state
    const state = db.getConnectionStateMessage();
    console.log(`Connection state: ${state}`);
    
    return true;
  } catch (error) {
    console.error('MongoDB connection failed:', error);
    return false;
  }
}

// Test User model operations
async function testUserModel() {
  console.log('\n=== Testing User Model ===');
  
  try {
    // Find a user (or create one if needed)
    let testUser = await User.findOne({ email: 'test@example.com' });
    
    if (!testUser) {
      console.log('Creating test user...');
      
      testUser = await User.create({
        email: 'test@example.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User',
        role: 'customer'
      });
      
      console.log('Test user created with ID:', testUser._id);
    } else {
      console.log('Found existing test user with ID:', testUser._id);
    }
    
    // Test password comparison
    const passwordMatch = await testUser.comparePassword('password123');
    console.log(`Password comparison result: ${passwordMatch}`);
    
    return testUser;
  } catch (error) {
    console.error('User model test failed:', error);
    return null;
  }
}

// Test Product model operations
async function testProductModel() {
  console.log('\n=== Testing Product Model ===');
  
  try {
    // Find a product (or create one if needed)
    let testProduct = await Product.findOne({ name: 'Test Product' });
    
    if (!testProduct) {
      console.log('Creating test product...');
      
      testProduct = await Product.create({
        name: 'Test Product',
        slug: 'test-product',
        description: 'A product for testing purposes',
        price: 99.99,
        compareAtPrice: 129.99,
        images: ['https://example.com/image.jpg'],
        category: 'Test',
        tags: ['test', 'sample'],
        sku: 'TEST-123',
        stockQuantity: 100,
        isInStock: true,
        isFeatured: false
      });
      
      console.log('Test product created with ID:', testProduct._id);
    } else {
      console.log('Found existing test product with ID:', testProduct._id);
    }
    
    // Test isOnSale and getDiscountPercentage methods
    const isOnSale = testProduct.isOnSale();
    const discountPercentage = testProduct.getDiscountPercentage();
    
    console.log(`Product is on sale: ${isOnSale}`);
    console.log(`Discount percentage: ${discountPercentage}%`);
    
    return testProduct;
  } catch (error) {
    console.error('Product model test failed:', error);
    return null;
  }
}

// Main test function
async function runTests() {
  console.log('Starting TypeScript Integration Tests...');
  
  // Test utility functions (don't require database)
  testUtilityFunctions();
  
  // Test database and models
  const dbConnected = await testDatabaseConnection();
  
  if (dbConnected) {
    await testUserModel();
    await testProductModel();
    
    // Disconnect from database
    await db.disconnectDB();
    console.log('\nDisconnected from MongoDB');
  }
  
  console.log('\nTests completed!');
}

// Run the tests
runTests()
  .catch(error => {
    console.error('Test execution failed:', error);
    process.exit(1);
  }); 