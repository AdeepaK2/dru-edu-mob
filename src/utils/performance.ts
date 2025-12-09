import { useCallback, useRef, useMemo } from 'react';
import { InteractionManager, Platform } from 'react-native';

/**
 * Performance optimization utilities for React Native app
 * Optimized for 500+ concurrent users
 */

/**
 * Debounce function - delays execution until after wait milliseconds
 * Useful for search inputs, preventing excessive API calls
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout | null = null;
  
  return (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    
    timeoutId = setTimeout(() => {
      func(...args);
    }, wait);
  };
}

/**
 * Throttle function - limits execution to once per wait milliseconds
 * Useful for scroll handlers, preventing excessive re-renders
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let lastCall = 0;
  let timeoutId: NodeJS.Timeout | null = null;
  
  return (...args: Parameters<T>) => {
    const now = Date.now();
    const remaining = wait - (now - lastCall);
    
    if (remaining <= 0) {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      lastCall = now;
      func(...args);
    } else if (!timeoutId) {
      timeoutId = setTimeout(() => {
        lastCall = Date.now();
        timeoutId = null;
        func(...args);
      }, remaining);
    }
  };
}

/**
 * Hook for debounced callback
 */
export function useDebounce<T extends (...args: any[]) => any>(
  callback: T,
  delay: number,
  deps: any[] = []
): T {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;
  
  return useMemo(
    () => debounce((...args: Parameters<T>) => callbackRef.current(...args), delay) as T,
    [delay, ...deps]
  );
}

/**
 * Hook for throttled callback
 */
export function useThrottle<T extends (...args: any[]) => any>(
  callback: T,
  delay: number,
  deps: any[] = []
): T {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;
  
  return useMemo(
    () => throttle((...args: Parameters<T>) => callbackRef.current(...args), delay) as T,
    [delay, ...deps]
  );
}

/**
 * Run expensive operations after interactions complete
 * Prevents UI jank during animations/transitions
 */
export function runAfterInteractions(callback: () => void): void {
  InteractionManager.runAfterInteractions(callback);
}

/**
 * Hook for running effect after interactions
 */
export function useAfterInteractions(
  callback: () => void | (() => void),
  deps: any[] = []
): void {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;
  
  useMemo(() => {
    const handle = InteractionManager.runAfterInteractions(() => {
      callbackRef.current();
    });
    
    return () => handle.cancel();
  }, deps);
}

/**
 * FlatList optimization settings for large lists
 */
export const FLATLIST_OPTIMIZATION = {
  // Remove items from memory when scrolled far away
  removeClippedSubviews: Platform.OS === 'android',
  // Maximum items to render in initial batch
  initialNumToRender: 10,
  // Maximum items to render per batch when scrolling
  maxToRenderPerBatch: 10,
  // How many items to render ahead
  windowSize: 5,
  // Update cells within this threshold distance
  updateCellsBatchingPeriod: 50,
  // Batch callback invocations
  onEndReachedThreshold: 0.5,
};

/**
 * Get optimized props for FlatList
 */
export function getOptimizedFlatListProps<T>(
  data: T[],
  keyExtractor: (item: T, index: number) => string
) {
  return {
    ...FLATLIST_OPTIMIZATION,
    data,
    keyExtractor,
    // Only re-render when these properties change
    extraData: data.length,
    // Prevent unnecessary re-renders
    getItemLayout: undefined, // Override if items have fixed height
  };
}

/**
 * Batch state updates for better performance
 */
export function batchUpdates(callback: () => void): void {
  // React 18+ automatically batches updates, but this is useful for explicit batching
  callback();
}

/**
 * Memoization helper for expensive computations
 */
export function memoize<T extends (...args: any[]) => any>(
  fn: T,
  getKey: (...args: Parameters<T>) => string = (...args) => JSON.stringify(args)
): T {
  const cache = new Map<string, ReturnType<T>>();
  
  return ((...args: Parameters<T>): ReturnType<T> => {
    const key = getKey(...args);
    
    if (cache.has(key)) {
      return cache.get(key)!;
    }
    
    const result = fn(...args);
    cache.set(key, result);
    
    // Limit cache size to prevent memory issues
    if (cache.size > 100) {
      const firstKey = cache.keys().next().value;
      cache.delete(firstKey);
    }
    
    return result;
  }) as T;
}

/**
 * Image optimization constants
 */
export const IMAGE_OPTIMIZATION = {
  // Default cache policy
  cachePolicy: 'memory-disk' as const,
  // Placeholder while loading
  placeholder: 'blur' as const,
  // Transition duration
  transition: 200,
  // Quality for resized images
  quality: 80,
};

/**
 * Get optimized image props for expo-image
 */
export function getOptimizedImageProps(uri: string, size?: { width: number; height: number }) {
  return {
    source: { uri },
    cachePolicy: IMAGE_OPTIMIZATION.cachePolicy,
    placeholder: IMAGE_OPTIMIZATION.placeholder,
    transition: IMAGE_OPTIMIZATION.transition,
    contentFit: 'cover' as const,
    ...(size && {
      style: { width: size.width, height: size.height },
    }),
  };
}

/**
 * Request idle callback polyfill for non-critical tasks
 */
export function requestIdleCallback(callback: () => void, timeout: number = 1000): void {
  if (typeof (global as any).requestIdleCallback === 'function') {
    (global as any).requestIdleCallback(callback, { timeout });
  } else {
    setTimeout(callback, 1);
  }
}

/**
 * Preload images for better UX
 */
export async function preloadImages(uris: string[]): Promise<void> {
  // expo-image handles caching automatically
  // This function can be extended if needed
  console.log(`Preloading ${uris.length} images...`);
}

/**
 * Memory pressure handler
 */
let isLowMemory = false;

export function setLowMemoryMode(enabled: boolean): void {
  isLowMemory = enabled;
}

export function isInLowMemoryMode(): boolean {
  return isLowMemory;
}

/**
 * Conditional logging (disabled in production for performance)
 */
export const performanceLog = __DEV__
  ? (...args: any[]) => console.log('[Performance]', ...args)
  : () => {};
