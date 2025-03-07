/**
 * Calculates an estimated delivery date based on business days
 * @param estimatedDays - Number of business days for delivery
 * @returns Formatted date string for estimated delivery
 */
export function getEstimatedDeliveryDate(estimatedDays: number): string {
  if (!estimatedDays || estimatedDays < 0) {
    estimatedDays = 3; // Default to 3 business days if invalid
  }
  
  const date = new Date();
  let businessDaysToAdd = estimatedDays;
  
  // Keep adding days until we've added enough business days
  while (businessDaysToAdd > 0) {
    // Add a day
    date.setDate(date.getDate() + 1);
    
    // Skip weekends (0 = Sunday, 6 = Saturday)
    const dayOfWeek = date.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      businessDaysToAdd--;
    }
  }
  
  // Format the date
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric'
  });
}

/**
 * Formats a date as a readable string
 * @param date - Date to format (Date object or ISO string)
 * @returns Formatted date string
 */
export function formatDate(date: Date | string): string {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  // Check if date is valid
  if (isNaN(dateObj.getTime())) {
    return '';
  }
  
  return dateObj.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

/**
 * Formats a date and time as a readable string
 * @param dateTime - Date and time to format (Date object or ISO string)
 * @returns Formatted date and time string
 */
export function formatDateTime(dateTime: Date | string): string {
  if (!dateTime) return '';
  
  const dateObj = typeof dateTime === 'string' ? new Date(dateTime) : dateTime;
  
  // Check if date is valid
  if (isNaN(dateObj.getTime())) {
    return '';
  }
  
  return dateObj.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric'
  });
} 