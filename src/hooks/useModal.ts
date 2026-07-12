import { useState, useCallback } from 'react';

export interface UseModalResult<T = any> {
  /**
   * Whether modal is open
   */
  isOpen: boolean;
  
  /**
   * Data associated with the modal
   */
  data: T | null;
  
  /**
   * Open the modal
   */
  open: (data?: T) => void;
  
  /**
   * Close the modal
   */
  close: () => void;
  
  /**
   * Toggle modal open/close
   */
  toggle: () => void;
  
  /**
   * Update modal data without closing
   */
  setData: (data: T | null) => void;
}

/**
 * Custom hook for managing modal state
 * 
 * Provides open/close state management and optional data passing
 * 
 * @param initialOpen - Initial open state (default: false)
 * @param onOpen - Callback when modal opens
 * @param onClose - Callback when modal closes
 * @returns Object with isOpen, data, open, close, toggle, and setData
 * 
 * @example
 * ```tsx
 * function UserList() {
 *   const editModal = useModal<User>();
 *   const deleteModal = useModal<User>();
 * 
 *   return (
 *     <>
 *       <button onClick={() => editModal.open(user)}>Edit User</button>
 *       <button onClick={() => deleteModal.open(user)}>Delete User</button>
 * 
 *       <Modal
 *         isOpen={editModal.isOpen}
 *         onClose={editModal.close}
 *         title="Edit User"
 *       >
 *         <UserForm user={editModal.data} />
 *       </Modal>
 * 
 *       <Modal
 *         isOpen={deleteModal.isOpen}
 *         onClose={deleteModal.close}
 *         title="Delete User"
 *       >
 *         <p>Are you sure you want to delete {deleteModal.data?.name}?</p>
 *       </Modal>
 *     </>
 *   );
 * }
 * ```
 */
export function useModal<T = any>(
  initialOpen: boolean = false,
  onOpen?: (data?: T) => void,
  onClose?: () => void
): UseModalResult<T> {
  const [isOpen, setIsOpen] = useState<boolean>(initialOpen);
  const [data, setData] = useState<T | null>(null);

  const open = useCallback((modalData?: T) => {
    if (modalData !== undefined) {
      setData(modalData);
    }
    setIsOpen(true);
    
    if (onOpen) {
      onOpen(modalData);
    }
  }, [onOpen]);

  const close = useCallback(() => {
    setIsOpen(false);
    
    if (onClose) {
      onClose();
    }
    
    // Clear data after a short delay to allow exit animations
    setTimeout(() => {
      setData(null);
    }, 300);
  }, [onClose]);

  const toggle = useCallback(() => {
    if (isOpen) {
      close();
    } else {
      open();
    }
  }, [isOpen, open, close]);

  return {
    isOpen,
    data,
    open,
    close,
    toggle,
    setData,
  };
}

export default useModal;
