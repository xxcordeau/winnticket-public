import * as React from "react";
import { Input } from "./input";

interface PhoneInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  value: string;
  onChange: (value: string) => void;
}

// 
export const extractNumbers = (value: string): string => {
  return value.replace(/\D/g, '');
};

// ()
export const formatPhoneNumber = (value: string): string => {
  const digitsOnly = value.replace(/\D/g, "");

  // (15xx, 16xx, 18xx ) → 1588-1234 
  if (/^1\d{3}/.test(digitsOnly)) {
    const d = digitsOnly.slice(0, 8); // 4+4
    if (d.length <= 4) return d;
    return d.replace(/^(\d{4})(\d{0,4}).*$/, "$1-$2");
  }

  // (02) 
  if (digitsOnly.startsWith("02")) {
    const d = digitsOnly.slice(0, 10); // 02 10(2 + 4 + 4)
    if (d.length <= 2) return d;

    const rest = d.slice(2);

    // 02-xxx...
    if (rest.length <= 3) {
      return `02-${rest}`;
    }

    // 02-xxx-xxxx ( 9) — (4~7) 3- 
    if (rest.length <= 7) {
      return `02-${rest.slice(0, 3)}-${rest.slice(3)}`;
    }

    // 02-xxxx-xxxx ( 10)
    return `02-${rest.slice(0, 4)}-${rest.slice(4, 8)}`;
  }

  // (010, 031, 051 )
  const d = digitsOnly.slice(0, 11); // 11
  if (d.length <= 3) return d;
  if (d.length <= 7) return d.replace(/^(\d{3})(\d{0,4})$/, "$1-$2");
  return d.replace(/^(\d{3})(\d{0,4})(\d{0,4}).*$/, "$1-$2-$3");
};

export const PhoneInput = React.forwardRef<HTMLInputElement, PhoneInputProps>(
  ({ value, onChange, ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value;
      const numbers = extractNumbers(inputValue);
      
      // ( )
      onChange(numbers);
    };

    return (
      <Input
        {...props}
        ref={ref}
        type="tel"
        inputMode="numeric"
        value={formatPhoneNumber(value)}
        onChange={handleChange}
        maxLength={13} // (010-1234-5678)
      />
    );
  }
);

PhoneInput.displayName = "PhoneInput";
