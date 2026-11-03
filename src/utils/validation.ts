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
  'Enter mobile number with country code (up to 10 digits). Example: +91 9876543210';

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

// ─────────────────────────────────────────────────────────────────────────────
// File upload validation
// Backend limits (BaseProject/settings.py):
//   DATA_UPLOAD_MAX_MEMORY_SIZE = 10MB  (total request body)
//   FILE_UPLOAD_MAX_MEMORY_SIZE = 10MB  (per file streamed to memory)
// We validate on the client so the user gets a clear message instead of a
// silent 413 / "Save failed".
// ─────────────────────────────────────────────────────────────────────────────

/** Max size for a single file, in bytes (10 MB). */
export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

/**
 * Safe total request size we allow before the backend's 10MB request-body
 * limit rejects it. We keep a small headroom for form fields + multipart overhead.
 */
export const MAX_TOTAL_UPLOAD_BYTES = 9.5 * 1024 * 1024;

/** Human-readable file size, e.g. 10485760 -> "10 MB". */
export const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export interface FileValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validate a single file against the per-file size limit and (optional)
 * allowed extensions.
 */
export const validateSingleFile = (
  file: File,
  opts?: { maxBytes?: number; allowedExtensions?: string[] },
): FileValidationResult => {
  const maxBytes = opts?.maxBytes ?? MAX_FILE_SIZE_BYTES;

  if (opts?.allowedExtensions && opts.allowedExtensions.length > 0) {
    const name = file.name.toLowerCase();
    const ok = opts.allowedExtensions.some((ext) =>
      name.endsWith(ext.toLowerCase().startsWith('.') ? ext.toLowerCase() : `.${ext.toLowerCase()}`),
    );
    if (!ok) {
      return {
        valid: false,
        error: `"${file.name}" is not an allowed file type. Allowed: ${opts.allowedExtensions.join(', ')}.`,
      };
    }
  }

  if (file.size > maxBytes) {
    return {
      valid: false,
      error: `"${file.name}" is ${formatFileSize(file.size)} — the limit is ${formatFileSize(maxBytes)} per file.`,
    };
  }

  return { valid: true };
};

/**
 * Validate a collection of files: each file individually + the combined total.
 * Returns the first error found (one clear message at a time keeps the UX simple).
 */
export const validateFiles = (
  files: File[],
  opts?: { maxBytes?: number; maxTotalBytes?: number; allowedExtensions?: string[] },
): FileValidationResult => {
  const maxTotal = opts?.maxTotalBytes ?? MAX_TOTAL_UPLOAD_BYTES;

  for (const file of files) {
    const single = validateSingleFile(file, opts);
    if (!single.valid) return single;
  }

  const total = files.reduce((sum, f) => sum + f.size, 0);
  if (total > maxTotal) {
    return {
      valid: false,
      error: `Total upload size is ${formatFileSize(total)} — the limit is ${formatFileSize(maxTotal)} per save. Please remove some files or upload in smaller batches.`,
    };
  }

  return { valid: true };
};
