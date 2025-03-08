import { Request, Response, NextFunction } from 'express';
import { ApiResponse, BaseController, parsePagination } from './base.controller';
import Product from '../models/product.model';
import { IProductDocument, IProductResponse, IProductSearchQuery } from '../models/interfaces';
import { formatCurrency } from '../utils/formatCurrency';

/**
 * Product controller for handling product-related operations
 */
export class ProductController extends BaseController {
  /**
   * Get all products with filtering and pagination
   */
  getAllProducts = this.catchAsync(async (req: Request, res: Response, next: NextFunction): Promise<Response<ApiResponse> | void> => {
    // Parse query parameters
    const { page, limit, skip } = parsePagination(req);
    
    // Build filter object
    const filter: Record<string, any> = {};
    
    // Category filter
    if (req.query.category) {
      filter.category = req.query.category as string;
    }
    
    // Price range filter
    if (req.query.minPrice || req.query.maxPrice) {
      filter.price = {};
      if (req.query.minPrice) {
        filter.price.$gte = parseFloat(req.query.minPrice as string);
      }
      if (req.query.maxPrice) {
        filter.price.$lte = parseFloat(req.query.maxPrice as string);
      }
    }
    
    // In stock filter
    if (req.query.inStock) {
      filter.isInStock = req.query.inStock === 'true';
    }
    
    // Featured filter
    if (req.query.featured) {
      filter.isFeatured = req.query.featured === 'true';
    }
    
    // Tags filter (comma-separated)
    if (req.query.tags) {
      const tags = (req.query.tags as string).split(',').map(tag => tag.trim());
      filter.tags = { $in: tags };
    }
    
    // Build sort object
    let sortBy: Record<string, 1 | -1> = { createdAt: -1 }; // Default sort by newest
    
    if (req.query.sortBy) {
      switch (req.query.sortBy) {
        case 'price':
          sortBy = { price: req.query.sortDirection === 'desc' ? -1 : 1 };
          break;
        case 'name':
          sortBy = { name: req.query.sortDirection === 'desc' ? -1 : 1 };
          break;
        case 'newest':
          sortBy = { createdAt: -1 };
          break;
      }
    }
    
    // Get total count for pagination
    const total = await Product.countDocuments(filter);
    
    // Execute query with pagination
    const products = await Product.find(filter)
      .sort(sortBy)
      .skip(skip)
      .limit(limit);
    
    // Format products for response
    const formattedProducts = products.map(this.formatProductResponse);
    
    // Send paginated response
    return this.sendPaginated(
      res,
      formattedProducts,
      total,
      page,
      limit,
      'Products retrieved successfully'
    );
  });
  
  /**
   * Get a single product by ID
   */
  getProductById = this.catchAsync(async (req: Request, res: Response, next: NextFunction): Promise<Response<ApiResponse> | void> => {
    const productId = req.params.id;
    
    const product = await Product.findById(productId);
    
    if (!product) {
      return this.sendError(next, 'Product not found', 404);
    }
    
    return this.sendSuccess(
      res,
      this.formatProductResponse(product),
      'Product retrieved successfully'
    );
  });
  
  /**
   * Create a new product (admin only)
   */
  createProduct = this.catchAsync(async (req: Request, res: Response, next: NextFunction): Promise<Response<ApiResponse> | void> => {
    // Validate user role (should be done with middleware)
    if (!req.user || req.user.role !== 'admin') {
      return this.sendError(next, 'Not authorized to create products', 403);
    }
    
    const product = await Product.create(req.body);
    
    return this.sendCreated(
      res,
      this.formatProductResponse(product),
      'Product created successfully'
    );
  });
  
  /**
   * Update a product (admin only)
   */
  updateProduct = this.catchAsync(async (req: Request, res: Response, next: NextFunction): Promise<Response<ApiResponse> | void> => {
    // Validate user role (should be done with middleware)
    if (!req.user || req.user.role !== 'admin') {
      return this.sendError(next, 'Not authorized to update products', 403);
    }
    
    const productId = req.params.id;
    
    const product = await Product.findByIdAndUpdate(
      productId,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!product) {
      return this.sendError(next, 'Product not found', 404);
    }
    
    return this.sendSuccess(
      res,
      this.formatProductResponse(product),
      'Product updated successfully'
    );
  });
  
  /**
   * Delete a product (admin only)
   */
  deleteProduct = this.catchAsync(async (req: Request, res: Response, next: NextFunction): Promise<Response<ApiResponse> | void> => {
    // Validate user role (should be done with middleware)
    if (!req.user || req.user.role !== 'admin') {
      return this.sendError(next, 'Not authorized to delete products', 403);
    }
    
    const productId = req.params.id;
    
    const product = await Product.findByIdAndDelete(productId);
    
    if (!product) {
      return this.sendError(next, 'Product not found', 404);
    }
    
    return this.sendNoContent(res);
  });
  
  /**
   * Format product for API response
   */
  private formatProductResponse(product: IProductDocument): IProductResponse {
    return {
      id: product._id.toString(),
      name: product.name,
      slug: product.slug,
      description: product.description,
      price: product.price,
      compareAtPrice: product.compareAtPrice,
      images: product.images,
      category: product.category,
      tags: product.tags,
      sku: product.sku,
      stockQuantity: product.stockQuantity,
      isInStock: product.isInStock,
      isFeatured: product.isFeatured,
      attributes: product.attributes,
      formattedPrice: formatCurrency(product.price),
      formattedCompareAtPrice: product.compareAtPrice ? formatCurrency(product.compareAtPrice) : undefined,
      onSale: product.isOnSale(),
      discountPercentage: product.isOnSale() ? product.getDiscountPercentage() : undefined
    };
  }
}

// Export a singleton instance
export const productController = new ProductController(); 