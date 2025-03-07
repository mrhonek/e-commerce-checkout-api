/**
 * Formats a number as currency with dollar sign and two decimal places
 * @param amount - The amount to format
 * @returns Formatted currency string
 */
export function formatCurrency(amount: number): string {
  if (typeof amount !== 'number' || isNaN(amount)) {
    return '$0.00';
  }
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
}

/**
 * Formats a number as a price (currency without fractional cents)
 * @param amount - The amount to format
 * @returns Formatted price string
 */
export function formatPrice(amount: number): string {
  if (typeof amount !== 'number' || isNaN(amount)) {
    return '$0';
  }
  
  // If the amount has no cents (or exact cents), use no decimal places
  if (amount % 1 === 0) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }
  
  // Otherwise use the standard currency format
  return formatCurrency(amount);
} 