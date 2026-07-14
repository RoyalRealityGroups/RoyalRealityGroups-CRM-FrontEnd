/**
 * Validate email address format
 * 
 * @param email - Email address to validate
 * @returns true if valid, false otherwise
 * 
 * @example
 * validateEmail('user@example.com') // true
 * validateEmail('invalid.email') // false
 */
export const validateEmail = (email: string | null | undefined): boolean => {
  if (!email) return false;
  
  // RFC 5322 compliant email regex (simplified)
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
};

// Contact validation rules aligned with Location Contact validation.
export const CONTACT_PHONE_REGEX = /^[+]?[0-9]{1,4}?[-\s]?[(]?[0-9]{1,4}[)]?[-\s]?[0-9]{1,4}[-\s]?[0-9]{1,9}$/;
export const CONTACT_EMAIL_REGEX = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
export const CONTACT_PHONE_MIN_LENGTH = 10;
export const CONTACT_PHONE_MAX_LENGTH = 15;
export const PHONE_FIELD_HELPER_TEXT =
  'Enter mobile number with country code (up to 15 digits). Example: +91 9876543210';

export const sanitizePhoneInput = (value: string): string =>
  value.replace(/\D/g, '').slice(0, 10);

/**
 * Validate Indian GST number format
 * Format: 22AAAAA0000A1Z5
 * - 2 digits: State code
 * - 10 characters: PAN
 * - 1 character: Entity number
 * - 1 character: Z (default)
 * - 1 character: Checksum
 * 
 * @param gst - GST number to validate
 * @returns true if valid format, false otherwise
 * 
 * @example
 * validateGST('22AAAAA0000A1Z5') // true
 * validateGST('INVALID') // false
 */
export const validateGST = (gst: string | null | undefined): boolean => {
  if (!gst) return false;
  
  // GST format: 2 digits + 10 char PAN + 1 char entity + Z + 1 char checksum
  const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
  return gstRegex.test(gst.trim().toUpperCase());
};

/**
 * Validate Indian mobile number
 * Must be 10 digits starting with 6, 7, 8, or 9
 * 
 * @param mobile - Mobile number to validate
 * @returns true if valid, false otherwise
 * 
 * @example
 * validateMobile('9876543210') // true
 * validateMobile('1234567890') // false (doesn't start with 6-9)
 */
export const validateMobile = (mobile: string | null | undefined): boolean => {
  if (!mobile) return false;
  
  // Remove all non-digit characters
  const cleaned = mobile.replace(/\D/g, '');
  
  // Check if it's exactly 10 digits starting with 6-9
  const mobileRegex = /^[6-9]\d{9}$/;
  return mobileRegex.test(cleaned);
};

/**
 * Validate Indian PIN code
 * Must be exactly 6 digits
 * 
 * @param pincode - PIN code to validate
 * @returns true if valid, false otherwise
 * 
 * @example
 * validatePinCode('560001') // true
 * validatePinCode('12345') // false (not 6 digits)
 */
export const validatePinCode = (pincode: string | null | undefined): boolean => {
  if (!pincode) return false;
  
  // Remove all non-digit characters
  const cleaned = pincode.replace(/\D/g, '');
  
  // Check if it's exactly 6 digits
  const pincodeRegex = /^\d{6}$/;
  return pincodeRegex.test(cleaned);
};

/**
 * Validate Indian PAN (Permanent Account Number)
 * Format: AAAAA9999A
 * - 5 characters (alphabets)
 * - 4 digits
 * - 1 character (alphabet)
 * 
 * @param pan - PAN number to validate
 * @returns true if valid format, false otherwise
 * 
 * @example
 * validatePAN('ABCDE1234F') // true
 * validatePAN('INVALID') // false
 */
export const validatePAN = (pan: string | null | undefined): boolean => {
  if (!pan) return false;
  
  // PAN format: 5 letters + 4 digits + 1 letter
  const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
  return panRegex.test(pan.trim().toUpperCase());
};

/**
 * Validate IFSC code (Indian Financial System Code)
 * Format: AAAA0BBBBBB
 * - 4 characters (alphabets) - Bank code
 * - 1 digit (always 0)
 * - 6 characters (alphanumeric) - Branch code
 * 
 * @param ifsc - IFSC code to validate
 * @returns true if valid format, false otherwise
 * 
 * @example
 * validateIFSC('SBIN0001234') // true
 * validateIFSC('INVALID') // false
 */
export const validateIFSC = (ifsc: string | null | undefined): boolean => {
  if (!ifsc) return false;
  
  // IFSC format: 4 letters + 0 + 6 alphanumeric characters
  const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
  return ifscRegex.test(ifsc.trim().toUpperCase());
};

/**
 * Validate URL format
 * 
 * @param url - URL to validate
 * @returns true if valid, false otherwise
 * 
 * @example
 * validateURL('https://example.com') // true
 * validateURL('not-a-url') // false
 */
export const validateURL = (url: string | null | undefined): boolean => {
  if (!url) return false;
  
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

/**
 * Validate password strength
 * Requirements:
 * - At least 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 * - At least one special character
 * 
 * @param password - Password to validate
 * @returns Object with isValid flag and array of failed requirements
 * 
 * @example
 * validatePassword('Test@123') 
 * // { isValid: true, errors: [] }
 * 
 * validatePassword('weak') 
 * // { isValid: false, errors: ['Must be at least 8 characters', ...] }
 */
export const validatePassword = (
  password: string | null | undefined
): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (!password) {
    return { isValid: false, errors: ['Password is required'] };
  }
  
  if (password.length < 8) {
    errors.push('Must be at least 8 characters');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Must contain at least one uppercase letter');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Must contain at least one lowercase letter');
  }
  
  if (!/\d/.test(password)) {
    errors.push('Must contain at least one number');
  }
  
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Must contain at least one special character');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Validate Aadhaar number (Indian ID)
 * Must be 12 digits
 * 
 * @param aadhaar - Aadhaar number to validate
 * @returns true if valid format, false otherwise
 * 
 * @example
 * validateAadhaar('123456789012') // true
 * validateAadhaar('12345') // false
 */
export const validateAadhaar = (aadhaar: string | null | undefined): boolean => {
  if (!aadhaar) return false;
  
  // Remove all non-digit characters
  const cleaned = aadhaar.replace(/\D/g, '');
  
  // Check if it's exactly 12 digits
  const aadhaarRegex = /^\d{12}$/;
  return aadhaarRegex.test(cleaned);
};

/**
 * Validate numeric input
 * 
 * @param value - Value to validate
 * @param min - Minimum value (optional)
 * @param max - Maximum value (optional)
 * @returns true if valid, false otherwise
 */
export const validateNumber = (
  value: string | number | null | undefined,
  min?: number,
  max?: number
): boolean => {
  if (value === null || value === undefined || value === '') return false;
  
  const num = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(num)) return false;
  
  if (min !== undefined && num < min) return false;
  if (max !== undefined && num > max) return false;
  
  return true;
};
