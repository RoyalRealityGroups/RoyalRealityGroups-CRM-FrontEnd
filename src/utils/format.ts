import dayjs, { Dayjs } from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';

type PickerValue = Dayjs | Date | null;

// Enable custom parse format plugin
dayjs.extend(customParseFormat);

/**
 * Convert a DatePicker onChange value to a formatted date string.
 *
 * Use this in every `<DatePicker onChange />` callback that needs to
 * persist the selected date as a string (e.g. for react-hook-form fields
 * or local state that stores `'YYYY-MM-DD'`).
 *
 * @param date - The value emitted by MUI DatePicker's `onChange`
 * @param format - Output format (default: `'YYYY-MM-DD'`)
 * @returns Formatted date string, or `''` when `date` is falsy
 *
 * @example
 * onChange={(date) => field.onChange(toDateString(date))}
 * onChange={(date) => field.onChange(toDateString(date) || null)}
 */
export const toDateString = (
  date: PickerValue,
  format: string = 'YYYY-MM-DD',
): string => {
  if (!date) return '';
  return dayjs(date).format(format);
};

/**
 * Safely convert a DatePicker onChange value to a Dayjs instance.
 *
 * Use this in every `<DatePicker onChange />` callback where the
 * component state is typed as `Dayjs` (e.g. `useState<Dayjs>`).
 *
 * @param date - The value emitted by MUI DatePicker's `onChange`
 * @returns A Dayjs instance, or `null` when `date` is falsy
 *
 * @example
 * onChange={(date) => date && setOrderDate(toDayjs(date)!)}
 * onChange={(date) => setDeliveredDate(toDayjs(date))}
 */
export const toDayjs = (date: PickerValue): Dayjs | null => {
  if (!date) return null;
  return dayjs(date);
};

/**
 * Format a number as currency with locale-specific formatting
 * 
 * @param amount - The amount to format
 * @param currency - Currency code (INR, USD, EUR, GBP, etc.)
 * @param locale - Locale for formatting (default: en-IN for INR, en-US for others)
 * @returns Formatted currency string
 * 
 * @example
 * formatCurrency(123456.78) // "₹1,23,456.78" (INR default)
 * formatCurrency(123456.78, 'USD') // "$123,456.78"
 * formatCurrency(123456.78, 'EUR') // "€123,456.78"
 */
export const formatCurrency = (
  amount: number,
  currency: string = 'INR',
  locale?: string
): string => {
  // Determine locale based on currency if not provided
  const defaultLocale = currency === 'INR' ? 'en-IN' : 'en-US';
  const formattingLocale = locale || defaultLocale;

  try {
    return new Intl.NumberFormat(formattingLocale, {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch (error) {
    return `${currency} ${amount.toFixed(2)}`;
  }
};

/**
 * Format a date using the specified format
 * 
 * @param date - Date to format (Date object or string)
 * @param format - Output format (default: 'DD-MM-YYYY')
 * @returns Formatted date string
 * 
 * @example
 * formatDate(new Date()) // "29-12-2025"
 * formatDate('2025-12-29') // "29-12-2025"
 * formatDate(new Date(), 'DD/MM/YYYY') // "29/12/2025"
 * formatDate(new Date(), 'YYYY-MM-DD') // "2025-12-29"
 */
export const formatDate = (
  date: Date | string | null | undefined,
  format: string = 'DD-MM-YYYY'
): string => {
  if (!date) return '';
  
  try {
    return dayjs(date).format(format);
  } catch (error) {
    return '';
  }
};

/**
 * Format time in 12-hour format with AM/PM
 * 
 * @param date - Date to format (Date object or string)
 * @returns Formatted time string (HH:MM AM/PM)
 * 
 * @example
 * formatTime(new Date('2025-12-29T14:30:00')) // "02:30 PM"
 * formatTime(new Date('2025-12-29T09:15:00')) // "09:15 AM"
 */
export const formatTime = (date: Date | string | null | undefined): string => {
  if (!date) return '';
  
  try {
    return dayjs(date).format('hh:mm A');
  } catch (error) {
    return '';
  }
};

/**
 * Format date and time together
 * 
 * @param date - Date to format (Date object or string)
 * @param dateFormat - Date format (default: 'DD-MM-YYYY')
 * @returns Formatted date and time string
 * 
 * @example
 * formatDateTime(new Date()) // "29-12-2025 02:30 PM"
 */
export const formatDateTime = (
  date: Date | string | null | undefined,
  dateFormat: string = 'DD-MM-YYYY'
): string => {
  if (!date) return '';
  
  try {
    return dayjs(date).format(`${dateFormat} hh:mm A`);
  } catch (error) {
    return '';
  }
};

/**
 * Format Indian phone number with country code
 * 
 * @param phone - Phone number (10 digits)
 * @returns Formatted phone number (+91 12345 67890)
 * 
 * @example
 * formatPhoneNumber('9876543210') // "+91 98765 43210"
 * formatPhoneNumber('919876543210') // "+91 98765 43210"
 */
export const formatPhoneNumber = (phone: string | null | undefined): string => {
  if (!phone) return '';
  
  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '');
  
  // Handle phone with country code (91)
  if (cleaned.length === 12 && cleaned.startsWith('91')) {
    const number = cleaned.substring(2);
    return `+91 ${number.substring(0, 5)} ${number.substring(5)}`;
  }
  
  // Handle 10-digit phone
  if (cleaned.length === 10) {
    return `+91 ${cleaned.substring(0, 5)} ${cleaned.substring(5)}`;
  }
  
  // Return original if format doesn't match
  return phone;
};

/**
 * Format a number with Indian numbering system (lakhs and crores)
 * 
 * @param amount - Number to format
 * @returns Formatted number string
 * 
 * @example
 * formatIndianNumber(1234567) // "12,34,567"
 */
export const formatIndianNumber = (amount: number): string => {
  try {
    return new Intl.NumberFormat('en-IN').format(amount);
  } catch (error) {
    return amount.toString();
  }
};

/**
 * Parse date string in DD-MM-YYYY format to Date object
 * 
 * @param dateString - Date string in DD-MM-YYYY format
 * @returns Date object or null if invalid
 * 
 * @example
 * parseDate('29-12-2025') // Date object for Dec 29, 2025
 */
export const parseDate = (dateString: string | null | undefined): Date | null => {
  if (!dateString) return null;
  
  try {
    const parsed = dayjs(dateString, 'DD-MM-YYYY', true);
    return parsed.isValid() ? parsed.toDate() : null;
  } catch (error) {
    return null;
  }
};

/**
 * Get relative time from now
 * 
 * @param date - Date to compare
 * @returns Relative time string (e.g., "2 hours ago", "in 3 days")
 * 
 * @example
 * getRelativeTime(new Date(Date.now() - 2 * 60 * 60 * 1000)) // "2 hours ago"
 */
export const getRelativeTime = (date: Date | string | null | undefined): string => {
  if (!date) return '';
  
  try {
    const now = dayjs();
    const target = dayjs(date);
    const diffInSeconds = now.diff(target, 'second');
    const diffInMinutes = now.diff(target, 'minute');
    const diffInHours = now.diff(target, 'hour');
    const diffInDays = now.diff(target, 'day');
    
    if (Math.abs(diffInSeconds) < 60) {
      return 'just now';
    } else if (Math.abs(diffInMinutes) < 60) {
      return diffInMinutes > 0 
        ? `${diffInMinutes} minute${diffInMinutes !== 1 ? 's' : ''} ago`
        : `in ${Math.abs(diffInMinutes)} minute${diffInMinutes !== -1 ? 's' : ''}`;
    } else if (Math.abs(diffInHours) < 24) {
      return diffInHours > 0
        ? `${diffInHours} hour${diffInHours !== 1 ? 's' : ''} ago`
        : `in ${Math.abs(diffInHours)} hour${diffInHours !== -1 ? 's' : ''}`;
    } else if (Math.abs(diffInDays) < 7) {
      return diffInDays > 0
        ? `${diffInDays} day${diffInDays !== 1 ? 's' : ''} ago`
        : `in ${Math.abs(diffInDays)} day${diffInDays !== -1 ? 's' : ''}`;
    } else {
      return formatDate(date);
    }
  } catch (error) {
    return '';
  }
};
