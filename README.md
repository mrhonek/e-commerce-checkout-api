# E-Commerce Checkout API

Backend API service for the E-Commerce Checkout Redesign project. This API handles user authentication, product data, cart management, and checkout processing.

## Technologies Used

- **Node.js** - JavaScript runtime
- **Express** - Web framework
- **TypeScript** - Type-safe JavaScript
- **MongoDB** - NoSQL database
- **Mongoose** - MongoDB ODM
- **JWT** - Authentication
- **Stripe** - Payment processing
- **Jest** - Testing

## Getting Started

### Prerequisites

- Node.js 18 or later
- MongoDB (local or Atlas connection)
- Stripe account (for payment processing)

### Installation

1. Clone the repository
   ```bash
   git clone https://github.com/mrhonek/e-commerce-checkout-api.git
   cd e-commerce-checkout-api
   ```

2. Install dependencies
   ```bash
   npm install
   ```

3. Set up environment variables
   ```bash
   cp .env.example .env
   ```
   Then edit `.env` with your actual configuration values.

4. Start the development server
   ```bash
   npm run dev
   ```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Log in a user
- `GET /api/auth/me` - Get current user data

### Products
- `GET /api/products` - Get all products
- `GET /api/products/:id` - Get a specific product

### Cart
- `GET /api/cart` - Get user's cart
- `POST /api/cart` - Add item to cart
- `PUT /api/cart/:itemId` - Update cart item
- `DELETE /api/cart/:itemId` - Remove item from cart

### Checkout
- `POST /api/checkout/shipping` - Submit shipping information
- `POST /api/checkout/payment` - Process payment
- `POST /api/checkout/complete` - Complete order

### Orders
- `GET /api/orders` - Get user's orders
- `GET /api/orders/:id` - Get specific order details

## Development

### Testing
```bash
npm test
```

### Linting
```bash
npm run lint
```

### Build for Production
```bash
npm run build
```

## Deployment

This API is designed to be deployed on Railway. For deployment instructions, see [Railway documentation](https://docs.railway.app/).