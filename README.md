# E-Commerce Checkout Backend

This is the backend API for the E-Commerce Checkout system. It's built with Node.js, Express, TypeScript, and MongoDB.

## Setup Options

There are two ways to run this backend:

1. **TypeScript Build (Recommended)**: Compiles TypeScript code to JavaScript and runs the compiled code
2. **Bypass Script**: Uses the deploy-bypass.js script (legacy approach) if you encounter TypeScript compilation issues

## Prerequisites

- Node.js (v16+)
- npm or yarn
- MongoDB connection string
- Stripe API keys (for payment processing)

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```
PORT=8080
NODE_ENV=development
MONGO_URI=your_mongodb_connection_string
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
CORS_ORIGIN=http://localhost:3000,https://e-commerce-checkout-redesign.vercel.app
```

## Installation

```bash
# Install dependencies
npm install

# Build TypeScript
npm run build
```

## Running the Application

### TypeScript Approach (Recommended)

```bash
# Development mode with hot reloading
npm run dev

# Production mode
npm run build
npm start
```

### Bypass Script (If TypeScript Build Fails)

```bash
# Run the bypass script directly
npm run start-bypass
```

## Docker

This project includes Docker configuration for easy development and deployment.

### Using Docker Compose (Development)

```bash
# Start the backend in development mode
docker-compose up

# Build and start in detached mode
docker-compose up --build -d
```

### Using Docker (Production)

```bash
# Build the Docker image
docker build -t ecommerce-backend .

# Run the container
docker run -p 8080:8080 --env-file .env ecommerce-backend
```

## API Endpoints

The backend provides endpoints for:

- Authentication
- Product management
- Cart operations
- Orders
- Payments (via Stripe)
- Shipping options

## Development

- Run `npm run lint` to check for code style issues
- Run `npm run seed` to populate the database with sample data

## Deployment

This backend can be deployed to services like Railway, Heroku, or any other platform that supports Node.js applications.

For Railway deployment, the included Dockerfile will be used automatically.