/**
 * Update Featured Products Script
 * 
 * This script sets the isFeatured field to true for selected products in the database.
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Product from '../models/product.model';

// Load environment variables
dotenv.config();

// MongoDB connection URI
const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/checkout-redesign';

async function updateFeaturedProducts() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB...');
    
    // Find White T-Shirt and Smart Watch - set them as featured
    const whiteTShirt = await Product.findOneAndUpdate(
      { slug: 'classic-white-t-shirt' },
      { isFeatured: true },
      { new: true }
    );
    
    const smartWatch = await Product.findOneAndUpdate(
      { slug: 'smart-watch' },
      { isFeatured: true },
      { new: true }
    );
    
    const wirelessHeadphones = await Product.findOneAndUpdate(
      { slug: 'wireless-headphones' },
      { isFeatured: true },
      { new: true }
    );
    
    // List all products and their featured status
    const allProducts = await Product.find({});
    
    console.log('\nUpdated Featured Products:');
    console.log('------------------------');
    allProducts.forEach(product => {
      console.log(`${product.name} (${product.slug}): ${product.isFeatured ? 'Featured' : 'Not Featured'} - ID: ${product._id}`);
    });
    
    console.log('\nFeature Update Complete!');
    console.log(`Total Products: ${allProducts.length}`);
    console.log(`Featured Products: ${allProducts.filter(p => p.isFeatured).length}`);
    
  } catch (error) {
    console.error('Error updating featured products:', error);
  } finally {
    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the update function
updateFeaturedProducts(); 