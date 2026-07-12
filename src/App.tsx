import React, { useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { store } from './store/store';
import { queryClient } from './api/queryClient';
import { ToastProvider } from './contexts/ToastContext';
import { ScreenSettingsProvider } from './contexts/ScreenSettingsContext';
import { PermissionProvider } from './contexts/PermissionContext';
import AutoDismissAlertManager from './components/common/AutoDismissAlertManager';
import ErrorBoundary from './components/common/ErrorBoundary';
import OfflineIndicator from './components/common/OfflineIndicator';
import { AppRoutes } from './routes';
import { theme } from './theme/theme';

const App: React.FC = () => {
  useEffect(() => {
    // Override MUI's aria-hidden behavior on root element
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'aria-hidden') {
          const target = mutation.target as HTMLElement;
          if (target.id === 'root' && target.getAttribute('aria-hidden') === 'true') {
            target.removeAttribute('aria-hidden');
          }
        }
      });
    });

    const rootElement = document.getElementById('root');
    if (rootElement) {
      observer.observe(rootElement, {
        attributes: true,
        attributeFilter: ['aria-hidden']
      });
    }

    return () => observer.disconnect();
  }, []);

  return (
    <ErrorBoundary>
      <Provider store={store}>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider theme={theme}>
            <ToastProvider>
              <ScreenSettingsProvider>
                <PermissionProvider>
                  <OfflineIndicator />
                  <AutoDismissAlertManager />
                  <CssBaseline />
                  <BrowserRouter>
                    <AppRoutes />
                  </BrowserRouter>
                  <ReactQueryDevtools initialIsOpen={false} />
                </PermissionProvider>
              </ScreenSettingsProvider>
            </ToastProvider>
          </ThemeProvider>
        </QueryClientProvider>
      </Provider>
    </ErrorBoundary>
  );
};

export default App;
