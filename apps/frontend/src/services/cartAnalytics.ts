/**
 * Cart Analytics Service
 * 
 * Tracks cart interactions for business intelligence and optimization
 */

interface CartEvent {
  type: 'cart_view' | 'item_add' | 'item_remove' | 'item_update' | 'checkout_start' | 'cart_abandon' | 'bulk_add';
  timestamp: number;
  data: {
    cartId?: string;
    productSku?: string;
    quantity?: number;
    price?: number;
    cartTotal?: number;
    cartItemCount?: number;
    bulkItems?: number;
    sessionId?: string;
  };
}

interface CartSession {
  sessionId: string;
  startTime: number;
  lastActivity: number;
  events: CartEvent[];
  isAbandoned?: boolean;
  checkoutCompleted?: boolean;
}

class CartAnalyticsService {
  private sessionId: string;
  private currentSession: CartSession | null = null;
  private abandonmentTimeout: NodeJS.Timeout | null = null;
  private readonly ABANDONMENT_DELAY = 30 * 60 * 1000; // 30 minutes

  constructor() {
    this.sessionId = this.generateSessionId();
    this.initializeSession();
    this.startAbandonmentTracking();
  }

  /**
   * Generate unique session ID
   */
  private generateSessionId(): string {
    return `cart_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Initialize new cart session
   */
  private initializeSession(): void {
    this.currentSession = {
      sessionId: this.sessionId,
      startTime: Date.now(),
      lastActivity: Date.now(),
      events: [],
    };

    this.trackEvent('cart_view', {});
  }

  /**
   * Track cart event
   */
  trackEvent(type: CartEvent['type'], data: CartEvent['data']): void {
    if (!this.currentSession) {
      this.initializeSession();
    }

    const event: CartEvent = {
      type,
      timestamp: Date.now(),
      data: {
        ...data,
        sessionId: this.sessionId,
      },
    };

    this.currentSession!.events.push(event);
    this.currentSession!.lastActivity = Date.now();

    // Store in localStorage for persistence
    this.saveSession();

    // Log for development
    if (process.env.NODE_ENV === 'development') {
      console.log('📊 Cart Analytics:', type, data);
    }

    // Reset abandonment timer
    this.resetAbandonmentTimer();
  }

  /**
   * Track cart view (when cart is opened/viewed)
   */
  trackCartView(cartItemCount: number, cartTotal: number): void {
    this.trackEvent('cart_view', {
      cartItemCount,
      cartTotal,
    });
  }

  /**
   * Track item added to cart
   */
  trackItemAdd(productSku: string, quantity: number, price: number, cartTotal: number): void {
    this.trackEvent('item_add', {
      productSku,
      quantity,
      price,
      cartTotal,
    });
  }

  /**
   * Track item removed from cart
   */
  trackItemRemove(productSku: string, quantity: number, cartTotal: number): void {
    this.trackEvent('item_remove', {
      productSku,
      quantity,
      cartTotal,
    });
  }

  /**
   * Track item quantity update
   */
  trackItemUpdate(productSku: string, oldQuantity: number, newQuantity: number, cartTotal: number): void {
    this.trackEvent('item_update', {
      productSku,
      quantity: newQuantity - oldQuantity,
      cartTotal,
    });
  }

  /**
   * Track bulk add operation
   */
  trackBulkAdd(bulkItems: number, cartTotal: number): void {
    this.trackEvent('bulk_add', {
      bulkItems,
      cartTotal,
    });
  }

  /**
   * Track checkout start
   */
  trackCheckoutStart(cartId: string, cartItemCount: number, cartTotal: number): void {
    this.trackEvent('checkout_start', {
      cartId,
      cartItemCount,
      cartTotal,
    });

    if (this.currentSession) {
      this.currentSession.checkoutCompleted = true;
      this.saveSession();
    }
  }

  /**
   * Start abandonment tracking
   */
  private startAbandonmentTracking(): void {
    this.resetAbandonmentTimer();
  }

  /**
   * Reset abandonment timer
   */
  private resetAbandonmentTimer(): void {
    if (this.abandonmentTimeout) {
      clearTimeout(this.abandonmentTimeout);
    }

    this.abandonmentTimeout = setTimeout(() => {
      this.trackCartAbandonment();
    }, this.ABANDONMENT_DELAY);
  }

  /**
   * Track cart abandonment
   */
  private trackCartAbandonment(): void {
    if (this.currentSession && !this.currentSession.checkoutCompleted && !this.currentSession.isAbandoned) {
      this.trackEvent('cart_abandon', {
        cartItemCount: this.getLastCartItemCount(),
        cartTotal: this.getLastCartTotal(),
      });

      this.currentSession.isAbandoned = true;
      this.saveSession();
    }
  }

  /**
   * Get last known cart item count from events
   */
  private getLastCartItemCount(): number {
    const lastEvent = this.currentSession?.events
      .filter(e => e.data.cartItemCount !== undefined)
      .pop();
    return lastEvent?.data.cartItemCount || 0;
  }

  /**
   * Get last known cart total from events
   */
  private getLastCartTotal(): number {
    const lastEvent = this.currentSession?.events
      .filter(e => e.data.cartTotal !== undefined)
      .pop();
    return lastEvent?.data.cartTotal || 0;
  }

  /**
   * Save session to localStorage
   */
  private saveSession(): void {
    if (this.currentSession && typeof window !== 'undefined') {
      try {
        const sessions = this.getSavedSessions();
        sessions[this.sessionId] = this.currentSession;
        
        // Keep only last 10 sessions
        const sessionKeys = Object.keys(sessions).slice(-10);
        const trimmedSessions = sessionKeys.reduce((acc, key) => {
          acc[key] = sessions[key];
          return acc;
        }, {} as Record<string, CartSession>);

        localStorage.setItem('cart_analytics_sessions', JSON.stringify(trimmedSessions));
      } catch (error) {
        console.warn('Failed to save cart analytics session:', error);
      }
    }
  }

  /**
   * Get saved sessions from localStorage
   */
  private getSavedSessions(): Record<string, CartSession> {
    if (typeof window === 'undefined') return {};

    try {
      const saved = localStorage.getItem('cart_analytics_sessions');
      return saved ? JSON.parse(saved) : {};
    } catch (error) {
      console.warn('Failed to load cart analytics sessions:', error);
      return {};
    }
  }

  /**
   * Get analytics summary
   */
  getAnalyticsSummary(): {
    currentSession: CartSession | null;
    allSessions: CartSession[];
    metrics: {
      totalSessions: number;
      abandonmentRate: number;
      averageItemsPerCart: number;
      totalCheckouts: number;
    };
  } {
    const allSessions = Object.values(this.getSavedSessions());
    const totalSessions = allSessions.length;
    const abandonedSessions = allSessions.filter(s => s.isAbandoned).length;
    const completedCheckouts = allSessions.filter(s => s.checkoutCompleted).length;
    
    const allItemAddEvents = allSessions.flatMap(s => 
      s.events.filter(e => e.type === 'item_add')
    );
    const averageItemsPerCart = allItemAddEvents.length / (totalSessions || 1);

    return {
      currentSession: this.currentSession,
      allSessions,
      metrics: {
        totalSessions,
        abandonmentRate: totalSessions > 0 ? (abandonedSessions / totalSessions) * 100 : 0,
        averageItemsPerCart,
        totalCheckouts: completedCheckouts,
      },
    };
  }

  /**
   * Clear analytics data (for privacy compliance)
   */
  clearAnalyticsData(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('cart_analytics_sessions');
    }
    this.currentSession = null;
    this.initializeSession();
  }

  /**
   * Export analytics data
   */
  exportAnalyticsData(): string {
    const summary = this.getAnalyticsSummary();
    return JSON.stringify(summary, null, 2);
  }
}

// Create singleton instance
export const cartAnalytics = new CartAnalyticsService();
export default cartAnalytics;