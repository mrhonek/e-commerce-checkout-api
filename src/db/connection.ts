import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// MongoDB connection options
const options: mongoose.ConnectOptions = {
  // No need to pass useNewUrlParser, useUnifiedTopology, etc. as they are now default in Mongoose 6+
};

// MongoDB connection URI
const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/e-commerce';

/**
 * Connect to MongoDB database
 */
const connectDB = async (): Promise<typeof mongoose> => {
  try {
    const connection = await mongoose.connect(MONGO_URI, options);
    
    // Use the connection object to log the connection state
    const { connection: { host, port, name } } = connection;
    console.log(`MongoDB Connected: ${host}:${port}/${name}`);
    
    return connection;
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

/**
 * Disconnect from MongoDB database
 */
const disconnectDB = async (): Promise<void> => {
  try {
    await mongoose.disconnect();
    console.log('MongoDB Disconnected');
  } catch (error) {
    console.error('MongoDB disconnection error:', error);
  }
};

/**
 * Get the current MongoDB connection state
 */
const getConnectionState = (): number => {
  return mongoose.connection.readyState;
};

/**
 * Get a human-readable MongoDB connection state message
 */
const getConnectionStateMessage = (): string => {
  const state = getConnectionState();
  
  switch (state) {
    case 0:
      return 'Disconnected';
    case 1:
      return 'Connected';
    case 2:
      return 'Connecting';
    case 3:
      return 'Disconnecting';
    default:
      return 'Unknown state';
  }
};

// Set up global mongoose configuration
mongoose.set('strictQuery', true);

// Handle connection errors
mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error:', err);
});

// Handle disconnection
mongoose.connection.on('disconnected', () => {
  console.warn('MongoDB disconnected. Attempting to reconnect...');
});

// Handle reconnection
mongoose.connection.on('reconnected', () => {
  console.log('MongoDB reconnected');
});

// Handle process termination
process.on('SIGINT', async () => {
  await disconnectDB();
  process.exit(0);
});

export default {
  connectDB,
  disconnectDB,
  getConnectionState,
  getConnectionStateMessage
}; 