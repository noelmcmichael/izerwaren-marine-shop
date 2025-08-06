/**
 * Search Analytics Hook
 * Task 9.4: Algolia Search Integration
 * 
 * Provides search analytics tracking and reporting functionality
 */

'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useSearchBox, useStats } from 'react-instantsearch';

interface SearchAnalyticsEvent {
  type: 'search' | 'click' | 'conversion' | 'filter';
  query?: string;
  resultCount?: number;
  clickedObjectID?: string;
  clickedPosition?: number;
  filters?: Record<string, unknown>;
  timestamp: number;
  sessionId: string;
  userAgent?: string;
}

interface UseSearchAnalyticsOptions {
  enabled?: boolean;
  sessionTimeout?: number; // in minutes
  debounceDelay?: number; // in milliseconds
}

// Session management
const getOrCreateSessionId = (timeout: number = 30): string => {
  const storageKey = 'izerwaren_search_session';
  const now = Date.now();
  
  try {
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      const { sessionId, timestamp } = JSON.parse(stored);
      const elapsed = (now - timestamp) / (1000 * 60); // minutes
      
      if (elapsed < timeout) {
        // Update timestamp and return existing session
        localStorage.setItem(storageKey, JSON.stringify({ sessionId, timestamp: now }));
        return sessionId;
      }
    }
  } catch (error) {
    console.warn('Failed to retrieve session ID:', error);
  }
  
  // Create new session
  const newSessionId = `search_${now}_${Math.random().toString(36).substr(2, 9)}`;
  try {
    localStorage.setItem(storageKey, JSON.stringify({ 
      sessionId: newSessionId, 
      timestamp: now 
    }));
  } catch (error) {
    console.warn('Failed to store session ID:', error);
  }
  
  return newSessionId;
};

// Event queue management
class AnalyticsEventQueue {
  private queue: SearchAnalyticsEvent[] = [];
  private isProcessing = false;
  private maxQueueSize = 50;
  private flushInterval = 10000; // 10 seconds
  
  constructor() {
    // Periodic flush
    setInterval(() => {
      this.flush();
    }, this.flushInterval);
    
    // Flush on page unload
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        this.flush(true);
      });
    }
  }
  
  add(event: SearchAnalyticsEvent) {
    this.queue.push(event);
    
    // Flush if queue is full
    if (this.queue.length >= this.maxQueueSize) {
      this.flush();
    }
  }
  
  flush(synchronous: boolean = false) {
    if (this.isProcessing || this.queue.length === 0) {
      return;
    }
    
    this.isProcessing = true;
    const events = [...this.queue];
    this.queue = [];
    
    const sendEvents = async () => {
      try {
        // In production, this would send to your analytics service
        if (process.env.NODE_ENV === 'development') {
          console.info('[Search Analytics] Sending events:', events);
        }
        
        // Example: Send to analytics endpoint
        // await fetch('/api/analytics/search', {
        //   method: 'POST',
        //   headers: { 'Content-Type': 'application/json' },
        //   body: JSON.stringify({ events }),
        // });
        
        // For now, just log to console in development
        if (process.env.NODE_ENV === 'development') {
          events.forEach(event => {
            const { type, query, resultCount, clickedObjectID } = event;
            switch (type) {
              case 'search':
                console.info(`[Analytics] Search: "${query}" (${resultCount} results)`);
                break;
              case 'click':
                console.info(`[Analytics] Click: ${clickedObjectID} at position ${event.clickedPosition}`);
                break;
              case 'filter':
                console.info(`[Analytics] Filter applied:`, event.filters);
                break;
            }
          });
        }
        
      } catch (error) {
        console.error('[Search Analytics] Failed to send events:', error);
        // Re-queue events on failure
        this.queue.unshift(...events);
      } finally {
        this.isProcessing = false;
      }
    };
    
    if (synchronous) {
      // Use sendBeacon for synchronous sending (e.g., on page unload)
      try {
        if (navigator.sendBeacon) {
          navigator.sendBeacon('/api/analytics/search', JSON.stringify({ events }));
        }
      } catch (error) {
        console.warn('[Search Analytics] Failed to send beacon:', error);
      }
    } else {
      sendEvents();
    }
  }
}

// Global event queue instance
const eventQueue = new AnalyticsEventQueue();

export function useSearchAnalytics(options: UseSearchAnalyticsOptions = {}) {
  const {
    enabled = true,
    sessionTimeout = 30,
    debounceDelay = 1000,
  } = options;
  
  const { query } = useSearchBox();
  const { nbHits } = useStats();
  const sessionId = useRef<string>('');
  const lastQuery = useRef<string>('');
  const searchTimeout = useRef<ReturnType<typeof setTimeout>>();
  
  // Initialize session
  useEffect(() => {
    if (enabled && typeof window !== 'undefined') {
      sessionId.current = getOrCreateSessionId(sessionTimeout);
    }
  }, [enabled, sessionTimeout]);
  
  // Track search events with debouncing
  useEffect(() => {
    if (!enabled || !query || query === lastQuery.current) {
      return;
    }
    
    // Clear previous timeout
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }
    
    // Debounce search tracking
    searchTimeout.current = setTimeout(() => {
      trackSearch(query, nbHits);
      lastQuery.current = query;
    }, debounceDelay);
    
    return () => {
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current);
      }
    };
  }, [query, nbHits, enabled, debounceDelay, trackSearch]);
  
  // Track search event
  const trackSearch = useCallback((searchQuery: string, resultCount: number) => {
    if (!enabled) return;
    
    const event: SearchAnalyticsEvent = {
      type: 'search',
      query: searchQuery,
      resultCount,
      timestamp: Date.now(),
      sessionId: sessionId.current,
      userAgent: typeof window !== 'undefined' ? navigator.userAgent : undefined,
    };
    
    eventQueue.add(event);
  }, [enabled]);
  
  // Track click events
  const trackClick = useCallback((objectID: string, position: number, searchQuery?: string) => {
    if (!enabled) return;
    
    const event: SearchAnalyticsEvent = {
      type: 'click',
      query: searchQuery || query,
      clickedObjectID: objectID,
      clickedPosition: position,
      timestamp: Date.now(),
      sessionId: sessionId.current,
    };
    
    eventQueue.add(event);
  }, [enabled, query]);
  
  // Track conversion events
  const trackConversion = useCallback((objectID: string, searchQuery?: string) => {
    if (!enabled) return;
    
    const event: SearchAnalyticsEvent = {
      type: 'conversion',
      query: searchQuery || query,
      clickedObjectID: objectID,
      timestamp: Date.now(),
      sessionId: sessionId.current,
    };
    
    eventQueue.add(event);
  }, [enabled, query]);
  
  // Track filter events
  const trackFilter = useCallback((filters: Record<string, unknown>) => {
    if (!enabled) return;
    
    const event: SearchAnalyticsEvent = {
      type: 'filter',
      query,
      filters,
      timestamp: Date.now(),
      sessionId: sessionId.current,
    };
    
    eventQueue.add(event);
  }, [enabled, query]);
  
  // Get analytics summary
  const getAnalyticsSummary = useCallback(() => {
    if (typeof window === 'undefined') return null;
    
    try {
      const searches = localStorage.getItem('izerwaren_search_history');
      if (searches) {
        const parsed = JSON.parse(searches);
        return {
          totalSearches: parsed.length,
          recentSearches: parsed.slice(-10),
          sessionId: sessionId.current,
        };
      }
    } catch (error) {
      console.warn('Failed to get analytics summary:', error);
    }
    
    return {
      totalSearches: 0,
      recentSearches: [],
      sessionId: sessionId.current,
    };
  }, []);
  
  return {
    trackSearch,
    trackClick,
    trackConversion,
    trackFilter,
    getAnalyticsSummary,
    sessionId: sessionId.current,
    enabled,
  };
}

export default useSearchAnalytics;