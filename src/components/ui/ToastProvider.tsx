/**
 * Toast Provider
 *
 * Professional toast notification system with custom styling
 * Integrated with react-hot-toast
 */
import { Toaster } from 'react-hot-toast'

const ToastProvider = () => {
  return (
    <Toaster
      position="top-right"
      reverseOrder={false}
      gutter={8}
      toastOptions={{
        // Default options
        duration: 4000,
        style: {
          background: 'var(--canvas-bg)',
          color: 'hsl(var(--foreground))',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
          border: '1px solid var(--svg-muted-stroke)',
          borderRadius: '0',
          padding: '16px',
          fontSize: '14px',
          maxWidth: '500px',
        },
        // Success toast
        success: {
          duration: 3000,
          iconTheme: {
            primary: '#00A27B',
            secondary: '#CCFBEF',
          },
          style: {
            border: '1px solid #00A27B',
            background: '#CCFBEF',
          },
        },
        // Error toast
        error: {
          duration: 5000,
          iconTheme: {
            primary: '#E85D75',
            secondary: '#FFE8EC',
          },
          style: {
            border: '1px solid #E85D75',
            background: '#FFE8EC',
          },
        },
        // Loading toast
        loading: {
          duration: Infinity,
          iconTheme: {
            primary: '#FF7A59',
            secondary: '#FFE8E3',
          },
        },
      }}
    />
  )
}

export default ToastProvider
