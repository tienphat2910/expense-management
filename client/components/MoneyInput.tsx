'use client';

import React, { useState } from 'react';
import { formatCurrency } from '@/lib/formatCurrency';

interface MoneyInputProps {
  value: string | number;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  className?: string;
  disabled?: boolean;
}

export default function MoneyInput({
  value,
  onChange,
  placeholder = '0',
  required = false,
  className = '',
  disabled = false,
}: MoneyInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [localValue, setLocalValue] = useState('');

  // Get display value
  const displayValue = isFocused 
    ? localValue 
    : (value ? formatCurrency(value) : '');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    
    // Allow only numbers
    const cleanValue = inputValue.replace(/[^\d]/g, '');
    
    if (cleanValue) {
      const numValue = parseInt(cleanValue);
      const formatted = formatCurrency(numValue);
      setLocalValue(formatted);
      onChange(numValue.toString());
    } else {
      setLocalValue('');
      onChange('');
    }
  };

  const handleFocus = () => {
    setIsFocused(true);
    setLocalValue(value ? formatCurrency(value) : '');
  };

  const handleBlur = () => {
    setIsFocused(false);
    setLocalValue('');
  };

  return (
    <div className="relative">
      <input
        type="text"
        inputMode="numeric"
        value={displayValue}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        className={className}
      />
      {displayValue && !isFocused && (
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">
          đ
        </span>
      )}
    </div>
  );
}
