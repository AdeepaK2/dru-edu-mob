/**
 * Cache Utility Tests
 * 
 * Tests for the cache utility including:
 * - Memory cache operations
 * - Persistent cache operations
 * - Cache expiration
 * - Cache invalidation
 * - Cache-first strategy
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  CACHE_DURATIONS,
  CACHE_KEYS,
  getFromMemoryCache,
  setInMemoryCache,
  getFromPersistentCache,
  setInPersistentCache,
  getCachedData,
  invalidateCache,
  invalidateCacheByPrefix,
  clearAllCache,
  getCacheStats,
} from '../../../src/utils/cache';

describe('Cache Utility', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    AsyncStorage.clear();
    // Clear the in-memory cache by invalidating all
    clearAllCache();
  });

  describe('CACHE_DURATIONS', () => {
    it('should have correct duration values', () => {
      expect(CACHE_DURATIONS.SHORT).toBe(1 * 60 * 1000); // 1 minute
      expect(CACHE_DURATIONS.MEDIUM).toBe(5 * 60 * 1000); // 5 minutes
      expect(CACHE_DURATIONS.LONG).toBe(30 * 60 * 1000); // 30 minutes
      expect(CACHE_DURATIONS.VERY_LONG).toBe(24 * 60 * 60 * 1000); // 24 hours
    });
  });

  describe('CACHE_KEYS', () => {
    it('should have correct key prefixes', () => {
      expect(CACHE_KEYS.STUDENT_CLASSES).toBe('cache_student_classes_');
      expect(CACHE_KEYS.CLASS_DETAILS).toBe('cache_class_details_');
      expect(CACHE_KEYS.TEST_DETAILS).toBe('cache_test_details_');
      expect(CACHE_KEYS.TEACHERS).toBe('cache_teachers_');
      expect(CACHE_KEYS.NOTIFICATIONS).toBe('cache_notifications_');
      expect(CACHE_KEYS.SUBSCRIPTION).toBe('cache_subscription_');
      expect(CACHE_KEYS.USER_PROFILE).toBe('cache_user_profile_');
    });
  });

  describe('Memory Cache', () => {
    describe('setInMemoryCache and getFromMemoryCache', () => {
      it('should store and retrieve data from memory cache', () => {
        const testData = { name: 'Test', value: 123 };
        const key = 'test_key';

        setInMemoryCache(key, testData);
        const retrieved = getFromMemoryCache(key);

        expect(retrieved).toEqual(testData);
      });

      it('should return null for non-existent key', () => {
        const result = getFromMemoryCache('non_existent_key');
        expect(result).toBeNull();
      });

      it('should return null for expired cache entry', async () => {
        const testData = { name: 'Test' };
        const key = 'expiring_key';

        // Set with very short duration
        setInMemoryCache(key, testData, 1); // 1ms

        // Wait for expiration
        await new Promise((resolve) => setTimeout(resolve, 10));

        const result = getFromMemoryCache(key);
        expect(result).toBeNull();
      });

      it('should overwrite existing cache entry', () => {
        const key = 'overwrite_key';
        const data1 = { value: 1 };
        const data2 = { value: 2 };

        setInMemoryCache(key, data1);
        setInMemoryCache(key, data2);

        const result = getFromMemoryCache(key);
        expect(result).toEqual(data2);
      });

      it('should use default duration when not specified', () => {
        const key = 'default_duration_key';
        const data = { value: 'test' };

        setInMemoryCache(key, data); // No duration specified

        const result = getFromMemoryCache(key);
        expect(result).toEqual(data);
      });
    });
  });

  describe('Persistent Cache', () => {
    describe('setInPersistentCache and getFromPersistentCache', () => {
      it('should store data in AsyncStorage', async () => {
        const testData = { name: 'Test', value: 456 };
        const key = 'persistent_test_key';

        await setInPersistentCache(key, testData);

        expect(AsyncStorage.setItem).toHaveBeenCalledWith(
          key,
          expect.stringContaining('"data":')
        );
      });

      it('should retrieve data from AsyncStorage', async () => {
        const testData = { name: 'Test', value: 789 };
        const key = 'retrieve_test_key';

        // Pre-set data in AsyncStorage mock
        const cacheEntry = {
          data: testData,
          timestamp: Date.now(),
          expiresAt: Date.now() + CACHE_DURATIONS.LONG,
        };
        await AsyncStorage.setItem(key, JSON.stringify(cacheEntry));

        const result = await getFromPersistentCache(key);
        expect(result).toEqual(testData);
      });

      it('should return null for expired persistent cache', async () => {
        const testData = { name: 'Expired' };
        const key = 'expired_persistent_key';

        // Set already expired cache entry
        const cacheEntry = {
          data: testData,
          timestamp: Date.now() - 10000,
          expiresAt: Date.now() - 5000, // Already expired
        };
        await AsyncStorage.setItem(key, JSON.stringify(cacheEntry));

        const result = await getFromPersistentCache(key);
        expect(result).toBeNull();
      });

      it('should return null for non-existent key', async () => {
        const result = await getFromPersistentCache('non_existent');
        expect(result).toBeNull();
      });

      it('should also store in memory cache when retrieving from persistent', async () => {
        const testData = { name: 'Test' };
        const key = 'memory_sync_key';

        const cacheEntry = {
          data: testData,
          timestamp: Date.now(),
          expiresAt: Date.now() + CACHE_DURATIONS.MEDIUM,
        };
        await AsyncStorage.setItem(key, JSON.stringify(cacheEntry));

        await getFromPersistentCache(key);

        // Should now be in memory cache
        const memoryResult = getFromMemoryCache(key);
        expect(memoryResult).toEqual(testData);
      });
    });
  });

  describe('getCachedData', () => {
    it('should return memory cached data without calling fetcher', async () => {
      const key = 'cached_data_key';
      const cachedData = { source: 'memory' };
      const fetcher = jest.fn().mockResolvedValue({ source: 'fetcher' });

      setInMemoryCache(key, cachedData);

      const result = await getCachedData(key, fetcher);

      expect(result).toEqual(cachedData);
      expect(fetcher).not.toHaveBeenCalled();
    });

    it('should call fetcher when cache is empty', async () => {
      const key = 'empty_cache_key';
      const fetchedData = { source: 'fetcher' };
      const fetcher = jest.fn().mockResolvedValue(fetchedData);

      const result = await getCachedData(key, fetcher);

      expect(result).toEqual(fetchedData);
      expect(fetcher).toHaveBeenCalled();
    });

    it('should force refresh when forceRefresh is true', async () => {
      const key = 'force_refresh_key';
      const cachedData = { source: 'cache' };
      const fetchedData = { source: 'fetcher' };
      const fetcher = jest.fn().mockResolvedValue(fetchedData);

      setInMemoryCache(key, cachedData);

      const result = await getCachedData(key, fetcher, CACHE_DURATIONS.MEDIUM, true);

      expect(result).toEqual(fetchedData);
      expect(fetcher).toHaveBeenCalled();
    });

    it('should store fetched data in cache', async () => {
      const key = 'store_fetched_key';
      const fetchedData = { value: 'stored' };
      const fetcher = jest.fn().mockResolvedValue(fetchedData);

      await getCachedData(key, fetcher);

      // Should now be in memory cache
      const cached = getFromMemoryCache(key);
      expect(cached).toEqual(fetchedData);
    });
  });

  describe('Cache Invalidation', () => {
    describe('invalidateCache', () => {
      it('should remove specific key from memory cache', async () => {
        const key = 'invalidate_memory_key';
        setInMemoryCache(key, { value: 'test' });

        await invalidateCache(key);

        const result = getFromMemoryCache(key);
        expect(result).toBeNull();
      });

      it('should remove specific key from AsyncStorage', async () => {
        const key = 'invalidate_storage_key';

        await invalidateCache(key);

        expect(AsyncStorage.removeItem).toHaveBeenCalledWith(key);
      });
    });

    describe('invalidateCacheByPrefix', () => {
      it('should remove all keys matching prefix from memory cache', async () => {
        const prefix = 'test_prefix_';
        setInMemoryCache(`${prefix}1`, { value: 1 });
        setInMemoryCache(`${prefix}2`, { value: 2 });
        setInMemoryCache('other_key', { value: 3 });

        await invalidateCacheByPrefix(prefix);

        expect(getFromMemoryCache(`${prefix}1`)).toBeNull();
        expect(getFromMemoryCache(`${prefix}2`)).toBeNull();
        expect(getFromMemoryCache('other_key')).not.toBeNull();
      });

      it('should remove matching keys from AsyncStorage', async () => {
        const prefix = 'cache_test_prefix_';
        // Pre-populate AsyncStorage
        await AsyncStorage.setItem(`${prefix}1`, 'data1');
        await AsyncStorage.setItem(`${prefix}2`, 'data2');
        await AsyncStorage.setItem('other', 'data3');

        await invalidateCacheByPrefix(prefix);

        expect(AsyncStorage.multiRemove).toHaveBeenCalled();
      });
    });

    describe('clearAllCache', () => {
      it('should clear all memory cache', async () => {
        setInMemoryCache('key1', { value: 1 });
        setInMemoryCache('key2', { value: 2 });

        await clearAllCache();

        const stats = getCacheStats();
        expect(stats.memorySize).toBe(0);
      });

      it('should remove cache keys from AsyncStorage', async () => {
        // Pre-populate with cache keys
        await AsyncStorage.setItem('cache_key1', 'data1');
        await AsyncStorage.setItem('cache_key2', 'data2');
        await AsyncStorage.setItem('non_cache_key', 'data3');

        await clearAllCache();

        expect(AsyncStorage.multiRemove).toHaveBeenCalled();
      });
    });
  });

  describe('getCacheStats', () => {
    it('should return correct memory cache size', () => {
      setInMemoryCache('stat_key1', { value: 1 });
      setInMemoryCache('stat_key2', { value: 2 });

      const stats = getCacheStats();

      expect(stats.memorySize).toBe(2);
      expect(stats.keys).toContain('stat_key1');
      expect(stats.keys).toContain('stat_key2');
    });

    it('should return empty stats when cache is empty', async () => {
      await clearAllCache();

      const stats = getCacheStats();

      expect(stats.memorySize).toBe(0);
      expect(stats.keys).toEqual([]);
    });
  });
});
