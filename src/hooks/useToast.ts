import { useContext } from 'react';
import { ToastContext } from '../contexts/ToastContext';
import type { ToastContextValue } from '../contexts/ToastContext';

/**
 * Custom hook to use toast notifications
 * 
 * Must be used within ToastProvider
 * 
 * @returns Toast context with methods to show notifications
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const toast = useToast();
 * 
 *   const handleSave = async () => {
 *     try {
 *       await saveData();
 *       toast.success('Data saved successfully!');
 *     } catch (error) {
 *       toast.error('Failed to save data');
 *     }
 *   };
 * 
 *   return (
 *     <div>
 *       <button onClick={handleSave}>Save</button>
 *       <button onClick={() => toast.info('This is info')}>Info</button>
 *       <button onClick={() => toast.warning('Warning!')}>Warn</button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  
  return context;
}

export default useToast;
