// Format number to Vietnamese currency format: 100.000.000 đ
export const formatCurrency = (value: number | string): string => {
  // Convert to number if string
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  
  // If not a valid number, return empty
  if (isNaN(numValue)) return '';
  
  // Format with thousand separators
  const formatted = numValue.toLocaleString('vi-VN');
  
  return formatted;
};

// Parse formatted currency string back to number
export const parseCurrency = (value: string): number => {
  // Remove all dots (thousand separators) and 'đ' symbol
  const cleanValue = value.replace(/\./g, '').replace(/đ/g, '').trim();
  
  // Parse to number
  const numValue = parseFloat(cleanValue);
  
  return isNaN(numValue) ? 0 : numValue;
};

// Format for display with 'đ' symbol
export const formatCurrencyDisplay = (value: number | string): string => {
  const formatted = formatCurrency(value);
  return formatted ? `${formatted} đ` : '0 đ';
};
