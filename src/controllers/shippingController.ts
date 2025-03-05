import { Request, Response } from 'express';
import { ShippingOption, Address } from '../models/shipping';

// Mock shipping options
const shippingOptions: ShippingOption[] = [
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

// Get available shipping options
export const getShippingOptions = (req: Request, res: Response) => {
  res.status(200).json(shippingOptions);
};

// Calculate shipping cost based on address and items
export const calculateShipping = (req: Request, res: Response) => {
  try {
    const { address, items, shippingOptionId } = req.body;
    
    if (!address || !items || !shippingOptionId) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    
    // Find the selected shipping option
    const selectedOption = shippingOptions.find(option => option.id === shippingOptionId);
    
    if (!selectedOption) {
      return res.status(404).json({ message: 'Shipping option not found' });
    }
    
    // Calculate base shipping cost
    let shippingCost = selectedOption.price;
    
    // Add extra cost for heavy items or multiple items
    const totalItems = items.reduce((sum: number, item: any) => sum + item.quantity, 0);
    
    if (totalItems > 5) {
      // Add $2 for every 5 items
      shippingCost += Math.floor(totalItems / 5) * 2;
    }
    
    // Return calculated shipping information
    res.status(200).json({
      shippingOption: selectedOption,
      totalItems,
      shippingCost: parseFloat(shippingCost.toFixed(2)),
      estimatedDelivery: getEstimatedDeliveryDate(selectedOption.estimatedDays)
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to calculate shipping' });
  }
};

// Validate shipping address
export const validateAddress = (req: Request, res: Response) => {
  try {
    const address: Address = req.body;
    
    if (!address.street || !address.city || !address.state || !address.zipCode || !address.country) {
      return res.status(400).json({
        valid: false,
        message: 'All address fields are required',
        missingFields: getMissingFields(address)
      });
    }
    
    // Check zip code format (U.S. 5-digit zip code)
    const zipRegex = /^\d{5}(-\d{4})?$/;
    if (address.country === 'US' && !zipRegex.test(address.zipCode)) {
      return res.status(400).json({
        valid: false,
        message: 'Invalid zip code format'
      });
    }
    
    // Mock validation - in a real app, this would call an address verification service
    res.status(200).json({
      valid: true,
      standardizedAddress: {
        street: address.street.toUpperCase(),
        city: address.city.toUpperCase(),
        state: address.state.toUpperCase(),
        zipCode: address.zipCode,
        country: address.country.toUpperCase()
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to validate address' });
  }
};

// Helper function to determine missing fields
const getMissingFields = (address: Address): string[] => {
  const requiredFields = ['street', 'city', 'state', 'zipCode', 'country'];
  return requiredFields.filter(field => !address[field as keyof Address]);
};

// Helper function to calculate estimated delivery date
const getEstimatedDeliveryDate = (estimatedDays: string): string => {
  const today = new Date();
  
  // Parse the estimated days range
  let daysToAdd = 3; // Default to 3 days
  
  if (estimatedDays.includes('Next')) {
    daysToAdd = 1;
  } else if (estimatedDays.includes('1-2')) {
    daysToAdd = 2;
  } else if (estimatedDays.includes('3-5')) {
    daysToAdd = 5;
  }
  
  // Add business days
  const deliveryDate = addBusinessDays(today, daysToAdd);
  
  // Format the date as MM/DD/YYYY
  return `${deliveryDate.getMonth() + 1}/${deliveryDate.getDate()}/${deliveryDate.getFullYear()}`;
};

// Helper function to add business days to a date
const addBusinessDays = (date: Date, days: number): Date => {
  const result = new Date(date);
  let addedDays = 0;
  
  while (addedDays < days) {
    result.setDate(result.getDate() + 1);
    const dayOfWeek = result.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      // Not a weekend
      addedDays++;
    }
  }
  
  return result;
}; 