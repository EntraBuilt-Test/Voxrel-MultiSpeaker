import { useState, useCallback, useEffect, useMemo } from 'react';
import { DEFAULT_PAGE_SIZE, DEFAULT_PAGE } from '@/constants/options.constants';

// Import existing types to ensure compatibility
import type { PaginationInfo } from '@/types';

export interface UseDataTableConfig<T> {
  fetchFn: (page: number, limit: number, filters: Record<string, any>) => Promise<void>;
  itemsPerPage?: number;
  initialFilters?: Record<string, any>;
  data?: T[];
  pagination?: PaginationInfo;
  loading?: boolean;
  error?: string | null;
}

export interface UseDataTableReturn<T> {
  // Data state
  data: T[];
  pagination: PaginationInfo;
  loading: boolean;
  error: string | null;
  
  // Filter state
  filters: Record<string, any>;
  searchQuery: string;
  
  // Actions
  handleSearch: (query: string) => void;
  handleFilter: (filterKey: string, filterValue: any) => void;
  handleFilters: (filters: Record<string, any>) => void;
  handlePageChange: (page: number) => void;
  handlePageSizeChange: (pageSize: number) => void;
  resetFilters: () => void;
  refresh: () => void;
  
  // Computed values
  hasData: boolean;
  isEmpty: boolean;
  totalItems: number;
  currentPage: number;
  totalPages: number;
}

/**
 * Hook for managing data table state including pagination, filtering, and search
 * Works with existing Zustand stores and maintains backward compatibility
 * 
 * @example
 * const table = useDataTable({
 *   fetchFn: useTaskStore().fetchTasks,
 *   data: tasks,
 *   pagination,
 *   loading: isLoading,
 *   initialFilters: { status: 'all' }
 * });
 * 
 * // Use in component:
 * <FilterBar 
 *   onSearch={table.handleSearch}
 *   onFilter={table.handleFilter}
 *   onReset={table.resetFilters}
 * />
 * <DataTable 
 *   data={table.data}
 *   pagination={table.pagination}
 *   onPageChange={table.handlePageChange}
 * />
 */
export function useDataTable<T = any>({
  fetchFn,
  itemsPerPage = DEFAULT_PAGE_SIZE,
  initialFilters = {},
  data = [],
  pagination,
  loading = false,
  error = null,
}: UseDataTableConfig<T>): UseDataTableReturn<T> {
  // Local state for filters and search
  const [filters, setFilters] = useState<Record<string, any>>(initialFilters);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(DEFAULT_PAGE);

  // Create default pagination if not provided
  const defaultPagination: PaginationInfo = useMemo(() => ({
    page: currentPage,
    limit: itemsPerPage,
    total: 0,
    totalPages: 1,
  }), [currentPage, itemsPerPage]);

  const activePagination = pagination || defaultPagination;

  // Fetch data when dependencies change
  const fetchData = useCallback(() => {
    const allFilters = {
      ...filters,
      ...(searchQuery && { search: searchQuery }),
    };

    fetchFn(currentPage, itemsPerPage, allFilters);
  }, [fetchFn, currentPage, itemsPerPage, filters, searchQuery]);

  // Auto-fetch on dependency changes
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Reset to first page when filters change
  useEffect(() => {
    if (currentPage !== DEFAULT_PAGE) {
      setCurrentPage(DEFAULT_PAGE);
    }
  }, [filters, searchQuery]); // Don't include currentPage to avoid infinite loop

  // Handlers
  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  const handleFilter = useCallback((filterKey: string, filterValue: any) => {
    setFilters(prev => ({
      ...prev,
      [filterKey]: filterValue,
    }));
  }, []);

  const handleFilters = useCallback((newFilters: Record<string, any>) => {
    setFilters(prev => ({
      ...prev,
      ...newFilters,
    }));
  }, []);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  const handlePageSizeChange = useCallback((pageSize: number) => {
    setCurrentPage(DEFAULT_PAGE); // Reset to first page when changing page size
    // Note: The actual page size change should be handled by the parent component
    // This hook provides the handler but doesn't manage the page size state
    // as it's typically controlled by the store
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(initialFilters);
    setSearchQuery('');
    setCurrentPage(DEFAULT_PAGE);
  }, [initialFilters]);

  const refresh = useCallback(() => {
    fetchData();
  }, [fetchData]);

  // Computed values
  const hasData = data.length > 0;
  const isEmpty = !loading && !hasData;
  const totalItems = activePagination.total;
  const totalPages = activePagination.totalPages;

  return {
    // Data state
    data,
    pagination: activePagination,
    loading,
    error,
    
    // Filter state
    filters,
    searchQuery,
    
    // Actions
    handleSearch,
    handleFilter,
    handleFilters,
    handlePageChange,
    handlePageSizeChange,
    resetFilters,
    refresh,
    
    // Computed values
    hasData,
    isEmpty,
    totalItems,
    currentPage,
    totalPages,
  };
}

export default useDataTable;
