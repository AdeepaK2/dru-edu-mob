import { getApiUrl } from '../config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  getCachedData, 
  invalidateCache, 
  invalidateCacheByPrefix,
  CACHE_KEYS, 
  CACHE_DURATIONS 
} from './cache';

/**
 * Optimized API client with caching, retry logic, and request deduplication
 * Designed for 500+ concurrent users
 */

// Request deduplication map
const pendingRequests = new Map<string, Promise<any>>();

// Retry configuration
const RETRY_CONFIG = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 10000,
};

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

/**
 * Get auth token from storage
 */
async function getAuthToken(): Promise<string | null> {
  return AsyncStorage.getItem('@dru_auth_token');
}

/**
 * Exponential backoff delay
 */
function getRetryDelay(attempt: number): number {
  const delay = Math.min(
    RETRY_CONFIG.baseDelay * Math.pow(2, attempt),
    RETRY_CONFIG.maxDelay
  );
  // Add jitter to prevent thundering herd
  return delay + Math.random() * 1000;
}

/**
 * Check if error is retryable
 */
function isRetryableError(status: number): boolean {
  return status === 429 || status >= 500;
}

/**
 * Optimized fetch with retry logic
 */
async function fetchWithRetry<T>(
  url: string,
  options: RequestInit,
  retries: number = RETRY_CONFIG.maxRetries
): Promise<T> {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });
      
      if (!response.ok) {
        if (isRetryableError(response.status) && attempt < retries) {
          const delay = getRetryDelay(attempt);
          console.log(`Retrying request (attempt ${attempt + 1}) after ${delay}ms`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error ${response.status}`);
      }
      
      return response.json();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt < retries && !(error instanceof TypeError)) {
        const delay = getRetryDelay(attempt);
        console.log(`Retrying request (attempt ${attempt + 1}) after ${delay}ms`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError || new Error('Request failed after retries');
}

/**
 * Deduplicated fetch - prevents multiple simultaneous requests for the same resource
 */
async function deduplicatedFetch<T>(
  key: string,
  fetcher: () => Promise<T>
): Promise<T> {
  // Check if there's already a pending request for this key
  const pending = pendingRequests.get(key);
  if (pending) {
    return pending;
  }
  
  // Create new request and store it
  const promise = fetcher().finally(() => {
    pendingRequests.delete(key);
  });
  
  pendingRequests.set(key, promise);
  return promise;
}

/**
 * Main API client with caching
 */
export const apiClient = {
  /**
   * GET request with caching
   */
  async get<T>(
    endpoint: string,
    options: {
      cacheKey?: string;
      cacheDuration?: number;
      forceRefresh?: boolean;
      requireAuth?: boolean;
    } = {}
  ): Promise<ApiResponse<T>> {
    const {
      cacheKey,
      cacheDuration = CACHE_DURATIONS.MEDIUM,
      forceRefresh = false,
      requireAuth = true,
    } = options;
    
    const url = getApiUrl(endpoint);
    const requestKey = cacheKey || `get_${endpoint}`;
    
    const fetcher = async () => {
      const headers: Record<string, string> = {};
      
      if (requireAuth) {
        const token = await getAuthToken();
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
      }
      
      return fetchWithRetry<ApiResponse<T>>(url, {
        method: 'GET',
        headers,
      });
    };
    
    // Use cache if cacheKey provided
    if (cacheKey && !forceRefresh) {
      return getCachedData(requestKey, fetcher, cacheDuration, forceRefresh);
    }
    
    // Use deduplication for uncached requests
    return deduplicatedFetch(requestKey, fetcher);
  },
  
  /**
   * POST request (no caching, but with retry)
   */
  async post<T>(
    endpoint: string,
    data: any,
    options: {
      requireAuth?: boolean;
      invalidateCacheKeys?: string[];
    } = {}
  ): Promise<ApiResponse<T>> {
    const { requireAuth = true, invalidateCacheKeys = [] } = options;
    const url = getApiUrl(endpoint);
    
    const headers: Record<string, string> = {};
    
    if (requireAuth) {
      const token = await getAuthToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }
    
    const result = await fetchWithRetry<ApiResponse<T>>(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });
    
    // Invalidate related caches after successful mutation
    if (result.success && invalidateCacheKeys.length > 0) {
      for (const key of invalidateCacheKeys) {
        await invalidateCache(key);
      }
    }
    
    return result;
  },
  
  /**
   * PUT request
   */
  async put<T>(
    endpoint: string,
    data: any,
    options: {
      requireAuth?: boolean;
      invalidateCacheKeys?: string[];
    } = {}
  ): Promise<ApiResponse<T>> {
    const { requireAuth = true, invalidateCacheKeys = [] } = options;
    const url = getApiUrl(endpoint);
    
    const headers: Record<string, string> = {};
    
    if (requireAuth) {
      const token = await getAuthToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }
    
    const result = await fetchWithRetry<ApiResponse<T>>(url, {
      method: 'PUT',
      headers,
      body: JSON.stringify(data),
    });
    
    if (result.success && invalidateCacheKeys.length > 0) {
      for (const key of invalidateCacheKeys) {
        await invalidateCache(key);
      }
    }
    
    return result;
  },
  
  /**
   * DELETE request
   */
  async delete<T>(
    endpoint: string,
    options: {
      requireAuth?: boolean;
      invalidateCacheKeys?: string[];
    } = {}
  ): Promise<ApiResponse<T>> {
    const { requireAuth = true, invalidateCacheKeys = [] } = options;
    const url = getApiUrl(endpoint);
    
    const headers: Record<string, string> = {};
    
    if (requireAuth) {
      const token = await getAuthToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }
    
    const result = await fetchWithRetry<ApiResponse<T>>(url, {
      method: 'DELETE',
      headers,
    });
    
    if (result.success && invalidateCacheKeys.length > 0) {
      for (const key of invalidateCacheKeys) {
        await invalidateCache(key);
      }
    }
    
    return result;
  },
  
  /**
   * Invalidate cache
   */
  invalidateCache,
  invalidateCacheByPrefix,
};

export { CACHE_KEYS, CACHE_DURATIONS };
