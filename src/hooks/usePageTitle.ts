import { useEffect } from 'react';

/**
 * Custom hook to set the page title dynamically
 * @param title - The title to set for the page
 * @param suffix - Optional suffix to append (defaults to "Sales App")
 */
export const usePageTitle = (title: string, suffix: string = 'Sales App') => {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = title ? `${title} - ${suffix}` : suffix;

    return () => {
      document.title = previousTitle;
    };
  }, [title, suffix]);
};
