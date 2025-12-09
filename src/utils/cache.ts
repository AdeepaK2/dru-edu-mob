import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Cache utility for optimizing API calls and data persistence
 * Designed to handle 500+ concurrent users efficiently
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

// In-memory cache for frequently accessed data
const memoryCache = new Map<string, CacheEntry<any>>();

// Default cache durations (in milliseconds)
export const CACHE_DURATIONS = {
  SHORT: 1 * 60 * 1000,        // 1 minute - for rapidly changing data
  MEDIUM: 5 * 60 * 1000,       // 5 minutes - for semi-static data
  LONG: 30 * 60 * 1000,        // 30 minutes - for static data
  VERY_LONG: 24 * 60 * 60 * 1000, // 24 hours - for rarely changing data
};

// Cache key prefixes
export const CACHE_KEYS = {
  STUDENT_CLASSES: 'cache_student_classes_',
  CLASS_DETAILS: 'cache_class_details_',
  TEST_DETAILS: 'cache_test_details_',
  TEACHERS: 'cache_teachers_',
  NOTIFICATIONS: 'cache_notifications_',
  SUBSCRIPTION: 'cache_subscription_',
  USER_PROFILE: 'cache_user_profile_',
};

/**
 * Get data from memory cache (fastest)
 */
export function getFromMemoryCache<T>(key: string): T | null {
  const entry = memoryCache.get(key);
  if (!entry) return null;
  
  if (Date.now() > entry.expiresAt) {
    memoryCache.delete(key);
    return null;
  }
  
  return entry.data as T;
}

/**
 * Set data in memory cache
 */
export function setInMemoryCache<T>(key: string, data: T, duration: number = CACHE_DURATIONS.MEDIUM): void {
  const now = Date.now();
  memoryCache.set(key, {
    data,
    timestamp: now,
    expiresAt: now + duration,
  });
}

/**
 * Get data from persistent cache (AsyncStorage)
 */
export async function getFromPersistentCache<T>(key: string): Promise<T | null> {
  try {
    const cached = await AsyncStorage.getItem(key);
    if (!cached) return null;
    
    const entry: CacheEntry<T> = JSON.parse(cached);
    
    if (Date.now() > entry.expiresAt) {
      await AsyncStorage.removeItem(key);
      return null;
    }
    
    // Also store in memory cache for faster subsequent access
    setInMemoryCache(key, entry.data, entry.expiresAt - Date.now());
    
    return entry.data;
  } catch (error) {
    console.error('Cache read error:', error);
    return null;
  }
}

/**
 * Set data in persistent cache
 */
export async function setInPersistentCache<T>(key: string, data: T, duration: number = CACHE_DURATIONS.MEDIUM): Promise<void> {
  try {
    const now = Date.now();
    const entry: CacheEntry<T> = {
      data,
      timestamp: now,
      expiresAt: now + duration,
    };
    
    await AsyncStorage.setItem(key, JSON.stringify(entry));
    
    // Also store in memory cache
    setInMemoryCache(key, data, duration);
  } catch (error) {
    console.error('Cache write error:', error);
  }
}

/**
 * Get data with cache-first strategy
 * 1. Check memory cache
 * 2. Check persistent cache
 * 3. Fetch from source
 */
export async function getCachedData<T>(
  key: string,
  fetcher: () => Promise<T>,
  duration: number = CACHE_DURATIONS.MEDIUM,
  forceRefresh: boolean = false
): Promise<T> {
  // Skip cache if force refresh
  if (!forceRefresh) {
    // Try memory cache first (fastest)
    const memoryData = getFromMemoryCache<T>(key);
    if (memoryData !== null) {
      return memoryData;
    }
    
    // Try persistent cache
    const persistentData = await getFromPersistentCache<T>(key);
    if (persistentData !== null) {
      return persistentData;
    }
  }
  
  // Fetch fresh data
  const freshData = await fetcher();
  
  // Store in both caches
  await setInPersistentCache(key, freshData, duration);
  
  return freshData;
}

/**
 * Invalidate specific cache key
 */
export async function invalidateCache(key: string): Promise<void> {
  memoryCache.delete(key);
  await AsyncStorage.removeItem(key);
}

/**
 * Invalidate all cache keys matching a prefix
 */
export async function invalidateCacheByPrefix(prefix: string): Promise<void> {
  // Clear from memory cache
  for (const key of memoryCache.keys()) {
    if (key.startsWith(prefix)) {
      memoryCache.delete(key);
    }
  }
  
  // Clear from persistent cache
  try {
    const allKeys = await AsyncStorage.getAllKeys();
    const keysToRemove = allKeys.filter(key => key.startsWith(prefix));
    if (keysToRemove.length > 0) {
      await AsyncStorage.multiRemove(keysToRemove);
    }
  } catch (error) {
    console.error('Error invalidating cache by prefix:', error);
  }
}

/**
 * Clear all caches
 */
export async function clearAllCache(): Promise<void> {
  memoryCache.clear();
  
  try {
    const allKeys = await AsyncStorage.getAllKeys();
    const cacheKeys = allKeys.filter(key => key.startsWith('cache_'));
    if (cacheKeys.length > 0) {
      await AsyncStorage.multiRemove(cacheKeys);
    }
  } catch (error) {
    console.error('Error clearing cache:', error);
  }
}

/**
 * Get cache statistics
 */
export function getCacheStats(): { memorySize: number; keys: string[] } {
  return {
    memorySize: memoryCache.size,
    keys: Array.from(memoryCache.keys()),
  };
}
