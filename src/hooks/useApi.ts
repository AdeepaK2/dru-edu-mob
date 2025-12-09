import { useState, useEffect, useCallback, useRef } from 'react';
import { apiClient, CACHE_DURATIONS } from '../utils/apiClient';

/**
 * Custom hook for optimized API data fetching with caching
 * Handles loading states, errors, and automatic refresh
 */

interface UseApiOptions {
  cacheKey?: string;
  cacheDuration?: number;
  autoFetch?: boolean;
  refreshInterval?: number; // Auto-refresh interval in ms
  onSuccess?: (data: any) => void;
  onError?: (error: Error) => void;
}

interface UseApiResult<T> {
  data: T | null;
  isLoading: boolean;
  error: Error | null;
  refetch: (forceRefresh?: boolean) => Promise<void>;
  mutate: (newData: T) => void;
}

export function useApi<T>(
  endpoint: string,
  options: UseApiOptions = {}
): UseApiResult<T> {
  const {
    cacheKey,
    cacheDuration = CACHE_DURATIONS.MEDIUM,
    autoFetch = true,
    refreshInterval,
    onSuccess,
    onError,
  } = options;
  
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(autoFetch);
  const [error, setError] = useState<Error | null>(null);
  
  const isMounted = useRef(true);
  const refreshTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  const fetchData = useCallback(async (forceRefresh: boolean = false) => {
    if (!isMounted.current) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await apiClient.get<T>(endpoint, {
        cacheKey,
        cacheDuration,
        forceRefresh,
      });
      
      if (!isMounted.current) return;
      
      if (response.success && response.data) {
        setData(response.data);
        onSuccess?.(response.data);
      } else {
        throw new Error(response.message || 'Failed to fetch data');
      }
    } catch (err) {
      if (!isMounted.current) return;
      
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      onError?.(error);
    } finally {
      if (isMounted.current) {
        setIsLoading(false);
      }
    }
  }, [endpoint, cacheKey, cacheDuration, onSuccess, onError]);
  
  // Initial fetch
  useEffect(() => {
    if (autoFetch) {
      fetchData();
    }
    
    return () => {
      isMounted.current = false;
    };
  }, [autoFetch, fetchData]);
  
  // Auto-refresh interval
  useEffect(() => {
    if (refreshInterval && refreshInterval > 0) {
      refreshTimerRef.current = setInterval(() => {
        fetchData(true);
      }, refreshInterval);
      
      return () => {
        if (refreshTimerRef.current) {
          clearInterval(refreshTimerRef.current);
        }
      };
    }
  }, [refreshInterval, fetchData]);
  
  const refetch = useCallback(async (forceRefresh: boolean = true) => {
    await fetchData(forceRefresh);
  }, [fetchData]);
  
  const mutate = useCallback((newData: T) => {
    setData(newData);
  }, []);
  
  return { data, isLoading, error, refetch, mutate };
}

/**
 * Hook for paginated data with infinite scroll
 */
interface UsePaginatedApiOptions extends UseApiOptions {
  pageSize?: number;
}

interface UsePaginatedApiResult<T> {
  data: T[];
  isLoading: boolean;
  isLoadingMore: boolean;
  error: Error | null;
  hasMore: boolean;
  loadMore: () => Promise<void>;
  refetch: () => Promise<void>;
}

export function usePaginatedApi<T>(
  endpoint: string,
  options: UsePaginatedApiOptions = {}
): UsePaginatedApiResult<T> {
  const { pageSize = 20, ...apiOptions } = options;
  
  const [data, setData] = useState<T[]>([]);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [hasMore, setHasMore] = useState(true);
  
  const isMounted = useRef(true);
  
  const fetchPage = useCallback(async (pageNum: number, isRefresh: boolean = false) => {
    if (!isMounted.current) return;
    
    if (isRefresh) {
      setIsLoading(true);
    } else {
      setIsLoadingMore(true);
    }
    setError(null);
    
    try {
      const paginatedEndpoint = `${endpoint}?page=${pageNum}&limit=${pageSize}`;
      const response = await apiClient.get<{ items: T[]; total: number }>(paginatedEndpoint, {
        ...apiOptions,
        cacheKey: apiOptions.cacheKey ? `${apiOptions.cacheKey}_page_${pageNum}` : undefined,
        forceRefresh: isRefresh,
      });
      
      if (!isMounted.current) return;
      
      if (response.success && response.data) {
        const { items, total } = response.data;
        
        if (isRefresh) {
          setData(items);
          setPage(1);
        } else {
          setData(prev => [...prev, ...items]);
        }
        
        setHasMore(data.length + items.length < total);
      } else {
        throw new Error(response.message || 'Failed to fetch data');
      }
    } catch (err) {
      if (!isMounted.current) return;
      
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
    } finally {
      if (isMounted.current) {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    }
  }, [endpoint, pageSize, apiOptions]);
  
  useEffect(() => {
    fetchPage(1, true);
    
    return () => {
      isMounted.current = false;
    };
  }, []);
  
  const loadMore = useCallback(async () => {
    if (!hasMore || isLoadingMore) return;
    
    const nextPage = page + 1;
    setPage(nextPage);
    await fetchPage(nextPage, false);
  }, [hasMore, isLoadingMore, page, fetchPage]);
  
  const refetch = useCallback(async () => {
    await fetchPage(1, true);
  }, [fetchPage]);
  
  return { data, isLoading, isLoadingMore, error, hasMore, loadMore, refetch };
}

/**
 * Hook for mutations (POST, PUT, DELETE)
 */
interface UseMutationOptions<T, V> {
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
  invalidateCacheKeys?: string[];
}

interface UseMutationResult<T, V> {
  mutate: (variables: V) => Promise<T | null>;
  isLoading: boolean;
  error: Error | null;
  data: T | null;
  reset: () => void;
}

export function useMutation<T, V>(
  method: 'post' | 'put' | 'delete',
  endpoint: string | ((variables: V) => string),
  options: UseMutationOptions<T, V> = {}
): UseMutationResult<T, V> {
  const { onSuccess, onError, invalidateCacheKeys = [] } = options;
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [data, setData] = useState<T | null>(null);
  
  const mutate = useCallback(async (variables: V): Promise<T | null> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const url = typeof endpoint === 'function' ? endpoint(variables) : endpoint;
      
      let response;
      if (method === 'delete') {
        response = await apiClient.delete<T>(url, { invalidateCacheKeys });
      } else if (method === 'put') {
        response = await apiClient.put<T>(url, variables, { invalidateCacheKeys });
      } else {
        response = await apiClient.post<T>(url, variables, { invalidateCacheKeys });
      }
      
      if (response.success && response.data) {
        setData(response.data);
        onSuccess?.(response.data);
        return response.data;
      } else {
        throw new Error(response.message || 'Operation failed');
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      onError?.(error);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [method, endpoint, invalidateCacheKeys, onSuccess, onError]);
  
  const reset = useCallback(() => {
    setError(null);
    setData(null);
    setIsLoading(false);
  }, []);
  
  return { mutate, isLoading, error, data, reset };
}
