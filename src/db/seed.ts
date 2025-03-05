import dotenv from 'dotenv';
import mongoose from 'mongoose';
import connectDB from './connection';

// Load environment variables
dotenv.config();

// Sample products data
const products = [
  {
    id: 'prod_1',
    name: 'Premium Headphones',
    description: 'Noise-cancelling wireless headphones with premium sound quality.',
    price: 249.99,
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=80',
    category: 'Electronics'
  },
  {
    id: 'prod_2',
    name: 'Smart Watch',
    description: 'Track your fitness, receive notifications, and more with this premium smartwatch.',
    price: 199.99,
    image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&q=80',
    category: 'Electronics'
  },
  {
    id: 'prod_3',
    name: 'Wireless Earbuds',
    description: 'True wireless earbuds with touch controls and 24-hour battery life.',
    price: 129.99,
    image: 'https://images.unsplash.com/photo-1572569511254-d8f925fe2cbb?w=500&q=80',
    category: 'Electronics'
  },
  {
    id: 'prod_4',
    name: 'Laptop Backpack',
    description: 'Water-resistant backpack with multiple compartments for your laptop and accessories.',
    price: 59.99,
    image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500&q=80',
    category: 'Accessories'
  },
  {
    id: 'prod_5',
    name: 'Bluetooth Speaker',
    description: 'Portable Bluetooth speaker with 360° sound and 12-hour battery life.',
    price: 89.99,
    image: 'https://images.unsplash.com/photo-1612444530582-fc66183b16f0?w=500&q=80',
    category: 'Electronics'
  }
];

// Sample users data
const users = [
  {
    id: 'user_1',
    email: 'john.doe@example.com',
    firstName: 'John',
    lastName: 'Doe',
    passwordHash: 'hashed_password_here', // In a real app, this would be bcrypt hashed
    addresses: [
      {
        id: 'addr_1',
        firstName: 'John',
        lastName: 'Doe',
        street: '123 Main St',
        city: 'San Francisco',
        state: 'CA',
        zipCode: '94105',
        country: 'US',
        isDefault: true
      }
    ]
  }
];

// Sample orders data
const orders = [
  {
    id: 'ord_1',
    userId: 'user_1',
    date: new Date('2025-01-15').toISOString(),
    items: [
      {
        productId: 'prod_1',
        name: 'Premium Headphones',
        price: 249.99,
        quantity: 1,
        image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=80'
      }
    ],
    shipping: {
      address: {
        firstName: 'John',
        lastName: 'Doe',
        street: '123 Main St',
        city: 'San Francisco',
        state: 'CA',
        zipCode: '94105',
        country: 'US'
      },
      method: 'Standard Shipping',
      cost: 5.99,
      estimatedDelivery: '01/20/2025'
    },
    billing: {
      address: {
        firstName: 'John',
        lastName: 'Doe',
        street: '123 Main St',
        city: 'San Francisco',
        state: 'CA',
        zipCode: '94105',
        country: 'US'
      },
      paymentMethod: 'credit_card',
      lastFourDigits: '4242'
    },
    totals: {
      subtotal: 249.99,
      tax: 24.99,
      shipping: 5.99,
      total: 280.97
    },
    status: 'delivered',
    statusHistory: [
      {
        status: 'processing',
        timestamp: new Date('2025-01-15').toISOString(),
        note: 'Order received'
      },
      {
        status: 'shipped',
        timestamp: new Date('2025-01-16').toISOString(),
        note: 'Order shipped via USPS'
      },
      {
        status: 'delivered',
        timestamp: new Date('2025-01-19').toISOString(),
        note: 'Package delivered'
      }
    ]
  }
];

// Function to seed the database
const seedDatabase = async () => {
  try {
    // Connect to MongoDB
    await connectDB();
    console.log('Connected to MongoDB for seeding');
    
    // For a real app, you would create MongoDB models and use them to seed the data
    // For this mock backend, we're just logging the sample data
    console.log('Seeding would insert the following data:');
    console.log(`- ${products.length} products`);
    console.log(`- ${users.length} users`);
    console.log(`- ${orders.length} orders`);
    
    console.log('Sample data ready for use in the mock API');
    
    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
    
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

// Run the seeding function
seedDatabase(); 