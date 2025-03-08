// Simple Express server for Railway deployment
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const helmet = require('helmet');
const nodemailer = require('nodemailer');

// Load environment variables
dotenv.config();

// Initialize express app
const app = express();
const port = process.env.PORT || 8080;

// CORS Configuration
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, curl requests)
    if (!origin) return callback(null, true);
    
    // Define allowed origins
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:5173',
      'http://localhost:4173',
      process.env.CORS_ORIGIN,
      // Common development origins
      'http://localhost:8080',
      'http://127.0.0.1:5173',
      'http://127.0.0.1:3000',
      // Vercel deployment URLs
      'https://e-commerce-checkout-redesign.vercel.app',
      'https://e-commerce-checkout-redesign-fqsb18vg3-mikes-projects-15384662.vercel.app',
      // Add any other Vercel preview URLs with the following pattern
      'https://e-commerce-checkout-redesign-git-*-mikes-projects-15384662.vercel.app',
    ].filter(Boolean); // Filter out any undefined values
    
    // Check if the origin is allowed
    if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV !== 'production') {
      callback(null, true);
    } else {
      console.log('Blocked by CORS:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  optionsSuccessStatus: 204
};

// Middleware
app.use(helmet({
  contentSecurityPolicy: false, // Disable CSP for development/demo purposes
  crossOriginEmbedderPolicy: false // Allow loading resources from different origins
}));
app.use(cors(corsOptions));

// Use JSON middleware for all routes except the Stripe webhook
app.use((req, res, next) => {
  if (req.originalUrl === '/api/webhooks/stripe') {
    next();
  } else {
    express.json()(req, res, next);
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    message: 'API server is running',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString()
  });
});

// API Routes

// Shipping
app.get('/api/shipping/options', (req, res) => {
  const shippingOptions = [
    {
      id: 'standard',
      name: 'Standard Shipping',
      price: 5.99,
      estimatedDays: '3-5 business days'
    },
    {
      id: 'express',
      name: 'Express Shipping',
      price: 12.99,
      estimatedDays: '1-2 business days'
    },
    {
      id: 'overnight',
      name: 'Overnight Shipping',
      price: 19.99,
      estimatedDays: 'Next business day'
    }
  ];
  
  res.status(200).json(shippingOptions);
});

app.post('/api/shipping/calculate', (req, res) => {
  const { address, items, shippingOptionId } = req.body;
  
  if (!address || !items || !shippingOptionId) {
    return res.status(400).json({ message: 'Missing required fields' });
  }
  
  const shippingOptions = {
    'standard': { price: 5.99, days: '3-5 business days' },
    'express': { price: 12.99, days: '1-2 business days' },
    'overnight': { price: 19.99, days: 'Next business day' }
  };
  
  const option = shippingOptions[shippingOptionId];
  
  if (!option) {
    return res.status(404).json({ message: 'Shipping option not found' });
  }
  
  // Calculate shipping cost
  let cost = option.price;
  
  // Add $2 for every 5 items
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  if (totalItems > 5) {
    cost += Math.floor(totalItems / 5) * 2;
  }
  
  res.status(200).json({
    shippingOption: {
      id: shippingOptionId,
      name: shippingOptionId.charAt(0).toUpperCase() + shippingOptionId.slice(1) + ' Shipping',
      price: option.price,
      estimatedDays: option.days
    },
    totalItems,
    shippingCost: parseFloat(cost.toFixed(2)),
    estimatedDelivery: getEstimatedDeliveryDate(option.days)
  });
});

// Cart routes
app.get('/api/cart', (req, res) => {
  res.status(200).json({
    items: [
      {
        id: 'product-1',
        name: 'Product 1',
        price: 19.99,
        quantity: 2,
        image: 'https://via.placeholder.com/150'
      },
      {
        id: 'product-2',
        name: 'Product 2',
        price: 29.99,
        quantity: 1,
        image: 'https://via.placeholder.com/150'
      }
    ],
    subtotal: 69.97,
    tax: 5.60,
    total: 75.57
  });
});

// Add item to cart
app.post('/api/cart/items', (req, res) => {
  const { productId, name, price, quantity, image } = req.body;
  
  if (!productId || !name || !price || !quantity) {
    return res.status(400).json({ message: 'Missing required fields' });
  }
  
  // Mock response - in a real app, this would add the item to the cart in a database
  res.status(201).json({
    items: [
      {
        id: 'product-1',
        name: 'Product 1',
        price: 19.99,
        quantity: 2,
        image: 'https://via.placeholder.com/150'
      },
      {
        id: 'product-2',
        name: 'Product 2',
        price: 29.99,
        quantity: 1,
        image: 'https://via.placeholder.com/150'
      },
      {
        id: productId,
        name,
        price,
        quantity,
        image
      }
    ],
    subtotal: 69.97 + (price * quantity),
    tax: 5.60 + ((price * quantity) * 0.08),
    total: 75.57 + (price * quantity) + ((price * quantity) * 0.08)
  });
});

// Update cart item
app.put('/api/cart/items/:itemId', (req, res) => {
  const { itemId } = req.params;
  const { quantity } = req.body;
  
  if (!quantity) {
    return res.status(400).json({ message: 'Quantity is required' });
  }
  
  // Mock response - in a real app, this would update the item in the cart in a database
  res.status(200).json({
    items: [
      {
        id: 'product-1',
        name: 'Product 1',
        price: 19.99,
        quantity: itemId === 'product-1' ? quantity : 2,
        image: 'https://via.placeholder.com/150'
      },
      {
        id: 'product-2',
        name: 'Product 2',
        price: 29.99,
        quantity: itemId === 'product-2' ? quantity : 1,
        image: 'https://via.placeholder.com/150'
      }
    ],
    subtotal: itemId === 'product-1' ? (19.99 * quantity) + 29.99 : 19.99 * 2 + (29.99 * quantity),
    tax: itemId === 'product-1' ? ((19.99 * quantity) + 29.99) * 0.08 : (19.99 * 2 + (29.99 * quantity)) * 0.08,
    total: itemId === 'product-1' ? 
      ((19.99 * quantity) + 29.99) + (((19.99 * quantity) + 29.99) * 0.08) : 
      (19.99 * 2 + (29.99 * quantity)) + ((19.99 * 2 + (29.99 * quantity)) * 0.08)
  });
});

// Remove item from cart
app.delete('/api/cart/items/:itemId', (req, res) => {
  const { itemId } = req.params;
  
  // Mock response - in a real app, this would remove the item from the cart in a database
  let items = [
    {
      id: 'product-1',
      name: 'Product 1',
      price: 19.99,
      quantity: 2,
      image: 'https://via.placeholder.com/150'
    },
    {
      id: 'product-2',
      name: 'Product 2',
      price: 29.99,
      quantity: 1,
      image: 'https://via.placeholder.com/150'
    }
  ];
  
  // Remove the specified item
  items = items.filter(item => item.id !== itemId);
  
  // Calculate new totals
  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const tax = subtotal * 0.08;
  const total = subtotal + tax;
  
  res.status(200).json({
    items,
    subtotal,
    tax,
    total
  });
});

// Clear cart
app.delete('/api/cart', (req, res) => {
  // Mock response - in a real app, this would clear the cart in a database
  res.status(200).json({
    items: [],
    subtotal: 0,
    tax: 0,
    total: 0
  });
});

// Payment routes
app.get('/api/payment/methods', (req, res) => {
  res.status(200).json([
    { id: 'card', name: 'Credit/Debit Card' },
    { id: 'paypal', name: 'PayPal' }
  ]);
});

// Email test endpoint
app.get('/api/test-email', async (req, res) => {
  try {
    // Create email transporter
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT),
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD
      }
    });
    
    // Email content
    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: process.env.SMTP_USER, // Send to yourself for testing
      subject: 'Test Email from E-Commerce API',
      text: 'This is a test email from your e-commerce API. If you received this, your SMTP configuration is working correctly!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <h2 style="color: #4a67b7;">E-Commerce API Email Test</h2>
          <p>Hello,</p>
          <p>This is a test email from your e-commerce API deployed on Railway.</p>
          <p>If you're receiving this message, your SMTP configuration is working correctly!</p>
          <div style="background-color: #f5f5f5; padding: 15px; border-left: 4px solid #4a67b7; margin: 20px 0;">
            <p style="margin: 0;"><strong>Server:</strong> Railway</p>
            <p style="margin: 10px 0 0;"><strong>Time:</strong> ${new Date().toLocaleString()}</p>
          </div>
          <p>You can now use this configuration to send:</p>
          <ul>
            <li>Order confirmations</li>
            <li>Shipping notifications</li>
            <li>Payment receipts</li>
            <li>Abandoned cart reminders</li>
          </ul>
          <p style="color: #777; font-size: 12px; margin-top: 30px; border-top: 1px solid #e0e0e0; padding-top: 10px;">
            This is an automated test email. Please do not reply.
          </p>
        </div>
      `
    };
    
    // Send the email
    const info = await transporter.sendMail(mailOptions);
    
    console.log('Email sent successfully:', info.response);
    res.status(200).json({ 
      success: true, 
      message: 'Test email sent successfully!',
      details: {
        messageId: info.messageId,
        response: info.response
      }
    });
  } catch (error) {
    console.error('Error sending test email:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to send test email',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Stripe webhook endpoint
app.post('/api/webhooks/stripe', express.raw({type: 'application/json'}), (req, res) => {
  const signature = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  
  try {
    // In a real implementation, you would verify the signature with Stripe
    // const event = stripe.webhooks.constructEvent(req.body, signature, webhookSecret);
    
    // For now, just log the event type and send a success response
    console.log('Received Stripe webhook event:', req.body);
    
    // Handle specific event types
    const eventType = req.body.type || 'unknown';
    
    switch (eventType) {
      case 'payment_intent.succeeded':
        console.log('Payment succeeded!');
        // Process successful payment - update order status, send confirmation email, etc.
        // In a real implementation, we would extract order details from the payment intent
        
        // Mock order data for demonstration
        const mockOrder = {
          orderNumber: 'ORD-' + Math.floor(10000 + Math.random() * 90000),
          items: [
            {
              id: 'product-1',
              name: 'Premium Headphones',
              price: 199.99,
              quantity: 1,
              image: 'https://via.placeholder.com/50'
            }
          ],
          shippingMethod: {
            id: 'express',
            name: 'Express Shipping',
            price: 12.99,
            estimatedDays: '1-2 business days'
          },
          shippingAddress: {
            firstName: 'Jane',
            lastName: 'Smith',
            street: '456 Oak Ave',
            city: 'Metropolis',
            state: 'NY',
            zipCode: '10001',
            country: 'US'
          },
          paymentMethod: 'Credit Card',
          subtotal: 199.99,
          tax: 16.80,
          total: 229.78
        };
        
        // Send order confirmation email asynchronously 
        // We don't await this to avoid delaying the response to Stripe
        emailService.sendOrderConfirmation(
          mockOrder, 
          process.env.SMTP_USER // In production, this would come from the customer data
        ).then(result => {
          console.log('Webhook order confirmation email result:', result);
        }).catch(err => {
          console.error('Webhook order email error:', err);
        });
        
        break;
      case 'payment_intent.payment_failed':
        console.log('Payment failed!');
        // Handle failed payment
        break;
      default:
        console.log(`Unhandled event type: ${eventType}`);
    }
    
    res.status(200).json({received: true});
  } catch (err) {
    console.error(`Webhook error: ${err.message}`);
    res.status(400).send(`Webhook Error: ${err.message}`);
  }
});

// Helper function to calculate estimated delivery date
function getEstimatedDeliveryDate(estimatedDays) {
  const today = new Date();
  let daysToAdd = 0;
  
  if (estimatedDays.includes('Next business day')) {
    daysToAdd = 1;
  } else if (estimatedDays.includes('1-2')) {
    daysToAdd = 2;
  } else if (estimatedDays.includes('3-5')) {
    daysToAdd = 5;
  } else {
    daysToAdd = 7;
  }
  
  const futureDate = new Date(today);
  futureDate.setDate(today.getDate() + daysToAdd);
  
  return futureDate.toISOString().split('T')[0];
}

// Helper functions for emails
const emailService = {
  // Create reusable transporter
  getTransporter: () => {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD
      }
    });
  },
  
  // Send order confirmation email
  sendOrderConfirmation: async (order, customerEmail) => {
    try {
      const transporter = emailService.getTransporter();
      
      // Format currency
      const formatCurrency = (amount) => {
        return `$${parseFloat(amount).toFixed(2)}`;
      };
      
      // Generate items HTML
      const itemsHtml = order.items.map(item => `
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #eeeeee;">
            <img src="${item.image}" alt="${item.name}" width="50" style="max-width: 50px; vertical-align: middle;">
          </td>
          <td style="padding: 10px; border-bottom: 1px solid #eeeeee;">${item.name}</td>
          <td style="padding: 10px; border-bottom: 1px solid #eeeeee; text-align: center;">${item.quantity}</td>
          <td style="padding: 10px; border-bottom: 1px solid #eeeeee; text-align: right;">${formatCurrency(item.price)}</td>
          <td style="padding: 10px; border-bottom: 1px solid #eeeeee; text-align: right;">${formatCurrency(item.price * item.quantity)}</td>
        </tr>
      `).join('');
      
      // Email content
      const mailOptions = {
        from: process.env.EMAIL_FROM,
        to: customerEmail,
        subject: `Order Confirmation #${order.orderNumber}`,
        text: `Thank you for your order #${order.orderNumber}. Your total is ${formatCurrency(order.total)}. Your order will be shipped to ${order.shippingAddress.street}, ${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.zipCode}.`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
            <h2 style="color: #4a67b7; text-align: center; border-bottom: 2px solid #4a67b7; padding-bottom: 10px;">Order Confirmation</h2>
            
            <div style="background-color: #f9f9f9; padding: 15px; margin: 20px 0; border-radius: 4px;">
              <p style="margin: 5px 0;"><strong>Order Number:</strong> #${order.orderNumber}</p>
              <p style="margin: 5px 0;"><strong>Order Date:</strong> ${new Date().toLocaleDateString()}</p>
              <p style="margin: 5px 0;"><strong>Shipping Method:</strong> ${order.shippingMethod.name}</p>
              <p style="margin: 5px 0;"><strong>Payment Method:</strong> ${order.paymentMethod}</p>
            </div>
            
            <h3 style="color: #4a67b7;">Order Items</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <thead>
                <tr style="background-color: #f2f2f2;">
                  <th style="padding: 10px; text-align: left;">Image</th>
                  <th style="padding: 10px; text-align: left;">Product</th>
                  <th style="padding: 10px; text-align: center;">Qty</th>
                  <th style="padding: 10px; text-align: right;">Price</th>
                  <th style="padding: 10px; text-align: right;">Total</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
            </table>
            
            <div style="margin-top: 20px; text-align: right;">
              <p><strong>Subtotal:</strong> ${formatCurrency(order.subtotal)}</p>
              <p><strong>Shipping:</strong> ${formatCurrency(order.shippingMethod.price)}</p>
              <p><strong>Tax:</strong> ${formatCurrency(order.tax)}</p>
              <p style="font-size: 18px; font-weight: bold; color: #4a67b7;"><strong>Total:</strong> ${formatCurrency(order.total)}</p>
            </div>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
              <h3 style="color: #4a67b7;">Shipping Address</h3>
              <p>
                ${order.shippingAddress.firstName} ${order.shippingAddress.lastName}<br>
                ${order.shippingAddress.street}<br>
                ${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.zipCode}<br>
                ${order.shippingAddress.country}
              </p>
            </div>
            
            <div style="margin-top: 30px; background-color: #f5f5f5; padding: 15px; border-radius: 4px;">
              <p style="margin: 0;">Your order will be shipped within 1-2 business days. You will receive a shipping confirmation email with tracking information once your order ships.</p>
            </div>
            
            <div style="margin-top: 30px; text-align: center; color: #777; font-size: 12px;">
              <p>If you have any questions about your order, please contact our customer support team.</p>
              <p>© ${new Date().getFullYear()} Your E-Commerce Store. All rights reserved.</p>
            </div>
          </div>
        `
      };
      
      // Send the email
      const info = await transporter.sendMail(mailOptions);
      console.log('Order confirmation email sent:', info.response);
      return {
        success: true,
        messageId: info.messageId
      };
    } catch (error) {
      console.error('Error sending order confirmation email:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
};

// Add route for order confirmation - handle both GET and POST for easier testing
app.use('/api/orders', async (req, res) => {
  try {
    // In a real app, this would save the order to the database
    // For this demo, we'll just use the request body data (or default data for GET requests)
    
    const order = {
      orderNumber: 'ORD-' + Math.floor(10000 + Math.random() * 90000),
      items: (req.method === 'POST' && req.body && req.body.items) || [
        {
          id: 'product-1',
          name: 'Modern Desk Lamp',
          price: 49.99,
          quantity: 1,
          image: 'https://via.placeholder.com/50'
        },
        {
          id: 'product-2',
          name: 'Wireless Earbuds',
          price: 129.99,
          quantity: 2,
          image: 'https://via.placeholder.com/50'
        }
      ],
      shippingMethod: (req.method === 'POST' && req.body && req.body.shippingMethod) || {
        id: 'express',
        name: 'Express Shipping',
        price: 12.99,
        estimatedDays: '1-2 business days'
      },
      shippingAddress: (req.method === 'POST' && req.body && req.body.shippingAddress) || {
        firstName: 'John',
        lastName: 'Doe',
        street: '123 Main St',
        city: 'Anytown',
        state: 'CA',
        zipCode: '90210',
        country: 'US'
      },
      paymentMethod: (req.method === 'POST' && req.body && req.body.paymentMethod) || 'Credit Card',
      subtotal: (req.method === 'POST' && req.body && req.body.subtotal) || 309.97,
      tax: (req.method === 'POST' && req.body && req.body.tax) || 25.83,
      total: (req.method === 'POST' && req.body && req.body.total) || 348.79
    };
    
    // Customer email - use request body or default to SMTP_USER for testing
    const customerEmail = (req.method === 'POST' && req.body && req.body.email) || process.env.SMTP_USER;
    
    // Send order confirmation email
    const emailResult = await emailService.sendOrderConfirmation(order, customerEmail);
    
    // Return order with email status
    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      requestMethod: req.method,
      order,
      email: emailResult
    });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create order',
      error: error.message
    });
  }
});

// Products endpoint
app.get('/api/products', (req, res) => {
  // Sample product data
  const products = [
    {
      id: "product-1",
      name: "Modern Desk Lamp",
      price: 49.99,
      description: "A sleek, adjustable desk lamp with multiple brightness settings and a USB charging port.",
      image: "https://picsum.photos/id/1060/400/400",
      category: "Home Office",
      featured: true,
      rating: 4.5,
      stock: 25
    },
    {
      id: "product-2",
      name: "Wireless Earbuds",
      price: 129.99,
      description: "Premium wireless earbuds with active noise cancellation, waterproof design, and 24-hour battery life.",
      image: "https://picsum.photos/id/325/400/400",
      category: "Electronics",
      featured: true,
      rating: 4.8,
      stock: 18
    },
    {
      id: "product-3",
      name: "Leather Wallet",
      price: 39.99,
      description: "Handcrafted genuine leather wallet with RFID protection and multiple card slots.",
      image: "https://picsum.photos/id/846/400/400",
      category: "Accessories",
      featured: false,
      rating: 4.3,
      stock: 32
    },
    {
      id: "product-4",
      name: "Wireless Charging Pad",
      price: 29.99,
      description: "Fast-charging wireless pad compatible with all Qi-enabled devices.",
      image: "https://picsum.photos/id/365/400/400",
      category: "Electronics",
      featured: false,
      rating: 4.1,
      stock: 15
    },
    {
      id: "product-5",
      name: "Smart Water Bottle",
      price: 24.99,
      description: "Tracks hydration levels and reminds you to drink water throughout the day.",
      image: "https://picsum.photos/id/425/400/400",
      category: "Fitness",
      featured: false,
      rating: 4.0,
      stock: 20
    },
    {
      id: "product-6",
      name: "Premium Notebook",
      price: 19.99,
      description: "Hardcover notebook with premium paper, bookmark ribbon, and elastic closure.",
      image: "https://picsum.photos/id/20/400/400",
      category: "Stationery",
      featured: true,
      rating: 4.6,
      stock: 40
    }
  ];
  
  // Simulate a slight delay like a real API
  setTimeout(() => {
    res.status(200).json(products);
  }, 500);
});

// Get single product by ID
app.get('/api/products/:id', (req, res) => {
  const productId = req.params.id;
  
  // Sample product data (same as above)
  const products = [
    {
      id: "product-1",
      name: "Modern Desk Lamp",
      price: 49.99,
      description: "A sleek, adjustable desk lamp with multiple brightness settings and a USB charging port.",
      image: "https://picsum.photos/id/1060/400/400",
      category: "Home Office",
      featured: true,
      rating: 4.5,
      stock: 25,
      features: [
        "Adjustable arm and head for perfect lighting angle",
        "Touch controls with 3 brightness levels",
        "Built-in USB charging port",
        "Energy-efficient LED bulb included",
        "Sleek, modern design"
      ],
      specs: {
        dimensions: "16\" height x 5\" base diameter",
        weight: "2.4 lbs",
        material: "Aluminum and plastic",
        color: "Matte black",
        powerSource: "AC adapter (included)"
      }
    },
    {
      id: "product-2",
      name: "Wireless Earbuds",
      price: 129.99,
      description: "Premium wireless earbuds with active noise cancellation, waterproof design, and 24-hour battery life.",
      image: "https://picsum.photos/id/325/400/400",
      category: "Electronics",
      featured: true,
      rating: 4.8,
      stock: 18,
      features: [
        "Active noise cancellation technology",
        "Waterproof (IPX7 rating)",
        "Up to 8 hours of battery life (24 with charging case)",
        "Touch controls for music and calls",
        "Voice assistant compatible"
      ],
      specs: {
        dimensions: "0.8\" x 0.7\" x 0.6\" (each earbud)",
        weight: "0.2 oz (each earbud), 1.6 oz (charging case)",
        connectivity: "Bluetooth 5.2",
        range: "Up to 33 feet",
        chargingTime: "1.5 hours for full charge"
      }
    },
    {
      id: "product-3",
      name: "Leather Wallet",
      price: 39.99,
      description: "Handcrafted genuine leather wallet with RFID protection and multiple card slots.",
      image: "https://picsum.photos/id/846/400/400",
      category: "Accessories",
      featured: false,
      rating: 4.3,
      stock: 32
    },
    {
      id: "product-4",
      name: "Wireless Charging Pad",
      price: 29.99,
      description: "Fast-charging wireless pad compatible with all Qi-enabled devices.",
      image: "https://picsum.photos/id/365/400/400",
      category: "Electronics",
      featured: false,
      rating: 4.1,
      stock: 15
    },
    {
      id: "product-5",
      name: "Smart Water Bottle",
      price: 24.99,
      description: "Tracks hydration levels and reminds you to drink water throughout the day.",
      image: "https://picsum.photos/id/425/400/400",
      category: "Fitness",
      featured: false,
      rating: 4.0,
      stock: 20
    },
    {
      id: "product-6",
      name: "Premium Notebook",
      price: 19.99,
      description: "Hardcover notebook with premium paper, bookmark ribbon, and elastic closure.",
      image: "https://picsum.photos/id/20/400/400",
      category: "Stationery",
      featured: true,
      rating: 4.6,
      stock: 40
    }
  ];
  
  // Find the product by ID
  const product = products.find(p => p.id === productId);
  
  if (product) {
    res.status(200).json(product);
  } else {
    res.status(404).json({ error: "Product not found" });
  }
});

// Update the catch-all route to include the new endpoints
app.use('*', (req, res) => {
  res.status(404).json({
    status: 'error',
    message: 'Route not found',
    availableRoutes: [
      '/health',
      '/api/shipping/options',
      '/api/shipping/calculate',
      '/api/cart',
      '/api/cart/items',
      '/api/cart/items/:itemId',
      '/api/payment/methods',
      '/api/webhooks/stripe',
      '/api/test-email',
      '/api/orders',
      '/api/products',
      '/api/products/:id'
    ]
  });
});

// Start server
app.listen(port, () => {
  console.log(`API server running on port ${port}`);
}); 