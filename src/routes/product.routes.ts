import { Router } from 'express';
import { body, param } from 'express-validator';
import { productController } from '../controllers/product.controller';
import { protect, restrictTo, validate } from '../middleware';

// Create router
const router = Router();

/**
 * @route   GET /api/products
 * @desc    Get all products
 * @access  Public
 */
router.get('/', productController.getAllProducts);

/**
 * @route   GET /api/products/:id
 * @desc    Get a product by ID
 * @access  Public
 */
router.get(
  '/:id',
  [
    validate([
      param('id').isMongoId().withMessage('Invalid product ID format')
    ])
  ],
  productController.getProductById
);

/**
 * @route   POST /api/products
 * @desc    Create a new product
 * @access  Private/Admin
 */
router.post(
  '/',
  [
    protect,
    restrictTo('admin'),
    validate([
      body('name').notEmpty().withMessage('Product name is required'),
      body('description').notEmpty().withMessage('Product description is required'),
      body('price').isNumeric().withMessage('Price must be a number'),
      body('category').notEmpty().withMessage('Category is required'),
      body('sku').notEmpty().withMessage('SKU is required')
    ])
  ],
  productController.createProduct
);

/**
 * @route   PUT /api/products/:id
 * @desc    Update a product
 * @access  Private/Admin
 */
router.put(
  '/:id',
  [
    protect,
    restrictTo('admin'),
    validate([
      param('id').isMongoId().withMessage('Invalid product ID format'),
      body('price').optional().isNumeric().withMessage('Price must be a number'),
      body('stockQuantity').optional().isInt({ min: 0 }).withMessage('Stock quantity must be a positive number')
    ])
  ],
  productController.updateProduct
);

/**
 * @route   DELETE /api/products/:id
 * @desc    Delete a product
 * @access  Private/Admin
 */
router.delete(
  '/:id',
  [
    protect,
    restrictTo('admin'),
    validate([
      param('id').isMongoId().withMessage('Invalid product ID format')
    ])
  ],
  productController.deleteProduct
);

export default router; 