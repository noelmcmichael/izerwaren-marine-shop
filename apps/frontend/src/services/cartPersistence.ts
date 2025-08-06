/**
 * Cart Persistence Service
 * 
 * Enhanced cart persistence with IndexedDB fallback and user-specific storage
 */

import { Cart } from './shopify';

interface CartTemplate {
  id: string;
  name: string;
  description?: string;
  items: Array<{
    sku: string;
    quantity: number;
    productTitle: string;
    price: string;
  }>;
  createdAt: number;
  updatedAt: number;
}

interface CartShare {
  id: string;
  cartData: Cart;
  sharedBy?: string;
  expiresAt: number;
  accessCount: number;
}

class CartPersistenceService {
  private dbName = 'izerwaren_cart_db';
  private dbVersion = 1;
  private db: IDBDatabase | null = null;

  constructor() {
    this.initDB();
  }

  /**
   * Initialize IndexedDB
   */
  private async initDB(): Promise<void> {
    if (typeof window === 'undefined') return;

    try {
      const request = indexedDB.open(this.dbName, this.dbVersion);
      
      request.onerror = () => {
        console.warn('IndexedDB failed to initialize, falling back to localStorage');
      };

      request.onsuccess = (event) => {
        this.db = (event.target as IDBOpenDBRequest).result;
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Cart templates store
        if (!db.objectStoreNames.contains('cartTemplates')) {
          const templateStore = db.createObjectStore('cartTemplates', { keyPath: 'id' });
          templateStore.createIndex('name', 'name', { unique: false });
          templateStore.createIndex('createdAt', 'createdAt', { unique: false });
        }

        // Shared carts store
        if (!db.objectStoreNames.contains('sharedCarts')) {
          const shareStore = db.createObjectStore('sharedCarts', { keyPath: 'id' });
          shareStore.createIndex('expiresAt', 'expiresAt', { unique: false });
        }

        // Cart history store
        if (!db.objectStoreNames.contains('cartHistory')) {
          const historyStore = db.createObjectStore('cartHistory', { keyPath: 'timestamp' });
          historyStore.createIndex('cartId', 'cartId', { unique: false });
        }
      };
    } catch (error) {
      console.warn('Failed to initialize IndexedDB:', error);
    }
  }

  /**
   * Save cart as template
   */
  async saveAsTemplate(cart: Cart, name: string, description?: string): Promise<string> {
    const template: CartTemplate = {
      id: `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      description,
      items: cart.items.map(item => ({
        sku: item.sku,
        quantity: item.quantity,
        productTitle: item.productTitle,
        price: item.price,
      })),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    try {
      if (this.db) {
        const transaction = this.db.transaction(['cartTemplates'], 'readwrite');
        const store = transaction.objectStore('cartTemplates');
        await new Promise((resolve, reject) => {
          const request = store.add(template);
          request.onsuccess = () => resolve(template.id);
          request.onerror = () => reject(request.error);
        });
      } else {
        // Fallback to localStorage
        const templates = this.getTemplatesFromStorage();
        templates[template.id] = template;
        localStorage.setItem('cart_templates', JSON.stringify(templates));
      }

      return template.id;
    } catch (error) {
      console.error('Failed to save cart template:', error);
      throw error;
    }
  }

  /**
   * Get all cart templates
   */
  async getTemplates(): Promise<CartTemplate[]> {
    try {
      if (this.db) {
        const transaction = this.db.transaction(['cartTemplates'], 'readonly');
        const store = transaction.objectStore('cartTemplates');
        
        return new Promise((resolve, reject) => {
          const request = store.getAll();
          request.onsuccess = () => resolve(request.result);
          request.onerror = () => reject(request.error);
        });
      } else {
        // Fallback to localStorage
        const templates = this.getTemplatesFromStorage();
        return Object.values(templates);
      }
    } catch (error) {
      console.error('Failed to get cart templates:', error);
      return [];
    }
  }

  /**
   * Delete cart template
   */
  async deleteTemplate(templateId: string): Promise<void> {
    try {
      if (this.db) {
        const transaction = this.db.transaction(['cartTemplates'], 'readwrite');
        const store = transaction.objectStore('cartTemplates');
        
        await new Promise<void>((resolve, reject) => {
          const request = store.delete(templateId);
          request.onsuccess = () => resolve();
          request.onerror = () => reject(request.error);
        });
      } else {
        // Fallback to localStorage
        const templates = this.getTemplatesFromStorage();
        delete templates[templateId];
        localStorage.setItem('cart_templates', JSON.stringify(templates));
      }
    } catch (error) {
      console.error('Failed to delete cart template:', error);
      throw error;
    }
  }

  /**
   * Share cart (create shareable link)
   */
  async shareCart(cart: Cart, expirationHours: number = 24): Promise<string> {
    const shareData: CartShare = {
      id: `share_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      cartData: cart,
      expiresAt: Date.now() + (expirationHours * 60 * 60 * 1000),
      accessCount: 0,
    };

    try {
      if (this.db) {
        const transaction = this.db.transaction(['sharedCarts'], 'readwrite');
        const store = transaction.objectStore('sharedCarts');
        
        await new Promise<void>((resolve, reject) => {
          const request = store.add(shareData);
          request.onsuccess = () => resolve();
          request.onerror = () => reject(request.error);
        });
      } else {
        // Fallback to localStorage
        const shares = this.getSharedFromStorage();
        shares[shareData.id] = shareData;
        localStorage.setItem('cart_shares', JSON.stringify(shares));
      }

      // Return shareable URL
      return `${window.location.origin}/cart/shared/${shareData.id}`;
    } catch (error) {
      console.error('Failed to share cart:', error);
      throw error;
    }
  }

  /**
   * Get shared cart by ID
   */
  async getSharedCart(shareId: string): Promise<Cart | null> {
    try {
      if (this.db) {
        const transaction = this.db.transaction(['sharedCarts'], 'readwrite');
        const store = transaction.objectStore('sharedCarts');
        
        const shareData = await new Promise<CartShare | null>((resolve, reject) => {
          const request = store.get(shareId);
          request.onsuccess = () => resolve(request.result || null);
          request.onerror = () => reject(request.error);
        });

        if (shareData) {
          // Check expiration
          if (Date.now() > shareData.expiresAt) {
            await this.deleteSharedCart(shareId);
            return null;
          }

          // Increment access count
          shareData.accessCount++;
          store.put(shareData);

          return shareData.cartData;
        }
      } else {
        // Fallback to localStorage
        const shares = this.getSharedFromStorage();
        const shareData = shares[shareId];
        
        if (shareData) {
          if (Date.now() > shareData.expiresAt) {
            delete shares[shareId];
            localStorage.setItem('cart_shares', JSON.stringify(shares));
            return null;
          }

          shareData.accessCount++;
          localStorage.setItem('cart_shares', JSON.stringify(shares));
          return shareData.cartData;
        }
      }

      return null;
    } catch (error) {
      console.error('Failed to get shared cart:', error);
      return null;
    }
  }

  /**
   * Delete shared cart
   */
  private async deleteSharedCart(shareId: string): Promise<void> {
    try {
      if (this.db) {
        const transaction = this.db.transaction(['sharedCarts'], 'readwrite');
        const store = transaction.objectStore('sharedCarts');
        store.delete(shareId);
      } else {
        const shares = this.getSharedFromStorage();
        delete shares[shareId];
        localStorage.setItem('cart_shares', JSON.stringify(shares));
      }
    } catch (error) {
      console.error('Failed to delete shared cart:', error);
    }
  }

  /**
   * Clean up expired shared carts
   */
  async cleanupExpiredShares(): Promise<void> {
    try {
      if (this.db) {
        const transaction = this.db.transaction(['sharedCarts'], 'readwrite');
        const store = transaction.objectStore('sharedCarts');
        const index = store.index('expiresAt');
        
        const request = index.openCursor(IDBKeyRange.upperBound(Date.now()));
        request.onsuccess = (event) => {
          const cursor = (event.target as IDBRequest).result;
          if (cursor) {
            cursor.delete();
            cursor.continue();
          }
        };
      } else {
        const shares = this.getSharedFromStorage();
        const now = Date.now();
        
        Object.keys(shares).forEach(id => {
          if (shares[id].expiresAt < now) {
            delete shares[id];
          }
        });
        
        localStorage.setItem('cart_shares', JSON.stringify(shares));
      }
    } catch (error) {
      console.error('Failed to cleanup expired shares:', error);
    }
  }

  /**
   * Save cart to history
   */
  async saveCartHistory(cart: Cart): Promise<void> {
    const historyEntry = {
      timestamp: Date.now(),
      cartId: cart.id,
      itemCount: cart.totalQuantity,
      subtotal: cart.subtotal,
      items: cart.items.length,
    };

    try {
      if (this.db) {
        const transaction = this.db.transaction(['cartHistory'], 'readwrite');
        const store = transaction.objectStore('cartHistory');
        store.add(historyEntry);
      } else {
        // Fallback to localStorage
        const history = this.getHistoryFromStorage();
        history.push(historyEntry);
        
        // Keep only last 50 entries
        if (history.length > 50) {
          history.splice(0, history.length - 50);
        }
        
        localStorage.setItem('cart_history', JSON.stringify(history));
      }
    } catch (error) {
      console.error('Failed to save cart history:', error);
    }
  }

  /**
   * Get localStorage fallback helpers
   */
  private getTemplatesFromStorage(): Record<string, CartTemplate> {
    try {
      const saved = localStorage.getItem('cart_templates');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  }

  private getSharedFromStorage(): Record<string, CartShare> {
    try {
      const saved = localStorage.getItem('cart_shares');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  }

  private getHistoryFromStorage(): any[] {
    try {
      const saved = localStorage.getItem('cart_history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  }

  /**
   * Export all cart data
   */
  async exportCartData(): Promise<{
    templates: CartTemplate[];
    analytics: any;
    history: any[];
  }> {
    const templates = await this.getTemplates();
    const history = this.getHistoryFromStorage();
    
    // Get analytics from cartAnalytics service
    const { cartAnalytics } = await import('./cartAnalytics');
    const analytics = cartAnalytics.getAnalyticsSummary();

    return {
      templates,
      analytics,
      history,
    };
  }

  /**
   * Clear all cart data
   */
  async clearAllData(): Promise<void> {
    try {
      if (this.db) {
        const transaction = this.db.transaction(['cartTemplates', 'sharedCarts', 'cartHistory'], 'readwrite');
        transaction.objectStore('cartTemplates').clear();
        transaction.objectStore('sharedCarts').clear();
        transaction.objectStore('cartHistory').clear();
      }
      
      // Clear localStorage fallbacks
      localStorage.removeItem('cart_templates');
      localStorage.removeItem('cart_shares');
      localStorage.removeItem('cart_history');
      localStorage.removeItem('cart_analytics_sessions');
    } catch (error) {
      console.error('Failed to clear cart data:', error);
    }
  }
}

// Create singleton instance
export const cartPersistence = new CartPersistenceService();
export default cartPersistence;