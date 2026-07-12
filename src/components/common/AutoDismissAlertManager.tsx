import { useEffect } from 'react';

const AUTO_DISMISS_MS = 15000;

const markAndSchedule = (el: Element) => {
  if (!(el instanceof HTMLElement)) return;
  if (el.dataset.autodismissScheduled === 'true') return;

  el.dataset.autodismissScheduled = 'true';
  setTimeout(() => {
    if (el.parentElement) {
      el.style.display = 'none';
    }
  }, AUTO_DISMISS_MS);
};

const AutoDismissAlertManager = () => {
  useEffect(() => {
    const selector = '.MuiAlert-root';

    document.querySelectorAll(selector).forEach(markAndSchedule);

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node instanceof HTMLElement) {
            if (node.matches(selector)) {
              markAndSchedule(node);
            }
            node.querySelectorAll?.(selector).forEach(markAndSchedule);
          }
        });
      });
    });

    observer.observe(document.body, { childList: true, subtree: true });

    return () => observer.disconnect();
  }, []);

  return null;
};

export default AutoDismissAlertManager;
