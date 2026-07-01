import { useState, useCallback } from 'react';

interface UseModalStateReturn<T = any> {
  isOpen: boolean;
  selectedItem: T | null;
  open: (item?: T) => void;
  close: () => void;
  selectItem: (item: T | null) => void;
  toggle: () => void;
}

/**
 * Hook for managing modal/sheet/dialog state
 * Handles open/close states and optional selected item management
 * 
 * @example
 * // Basic modal state
 * const modal = useModalState();
 * 
 * // Modal with selected item (e.g., edit modal)
 * const editModal = useModalState<Task>();
 * editModal.open(selectedTask);
 * 
 * // In component:
 * <Sheet open={editModal.isOpen} onOpenChange={editModal.close}>
 *   {editModal.selectedItem && <TaskEditForm task={editModal.selectedItem} />}
 * </Sheet>
 */
export function useModalState<T = any>(): UseModalStateReturn<T> {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<T | null>(null);

  const open = useCallback((item?: T) => {
    if (item !== undefined) {
      setSelectedItem(item);
    }
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    // Optional: Clear selected item when closing
    // Comment out if you want to preserve selection
    setSelectedItem(null);
  }, []);

  const selectItem = useCallback((item: T | null) => {
    setSelectedItem(item);
  }, []);

  const toggle = useCallback(() => {
    setIsOpen(prev => !prev);
  }, []);

  return {
    isOpen,
    selectedItem,
    open,
    close,
    selectItem,
    toggle,
  };
}

export default useModalState;
