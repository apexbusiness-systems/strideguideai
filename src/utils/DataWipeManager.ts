/**
 * DataWipeManager - Comprehensive data deletion utility
 * Handles both local (IndexedDB, localStorage, caches) and remote (Supabase) data wipe
 * for the signed-in user.
 */

import { supabase } from '@/integrations/supabase/client';
import { EncryptedKV } from '@/crypto/kv';

export interface WipeResult {
  success: boolean;
  localCleared: number;
  remoteDeleted: number;
  errors: string[];
  details: {
    localStorage: boolean;
    indexedDB: boolean;
    cacheStorage: boolean;
    learnedItems: number;
    userSettings: number;
    journeyTraces: number;
    performanceMetrics: number;
    emergencyContacts: number;
    emergencyRecordings: number;
  };
}

export class DataWipeManager {
  private static readonly TIMEOUT_MS = 10000; // 10s per operation

  private static readonly REMOTE_TABLES = [
    { id: 'learnedItems', name: 'learned_items', label: 'Learned items' },
    { id: 'userSettings', name: 'user_settings', label: 'Settings' },
    { id: 'journeyTraces', name: 'journey_traces', label: 'Journey traces' },
    { id: 'performanceMetrics', name: 'performance_metrics', label: 'Metrics' },
    { id: 'emergencyContacts', name: 'emergency_contacts', label: 'Emergency contacts' },
    { id: 'emergencyRecordings', name: 'emergency_recordings', label: 'Emergency recordings' }
  ] as const;
  
  /**
   * Get count of remote rows that will be deleted for the current user
   */
  static async getRemoteRowCount(): Promise<number> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return 0;

      let totalCount = 0;

      // Parallelize row counting for all tables
      const results = await Promise.all(
        this.REMOTE_TABLES.map(table =>
          supabase
            .from(table.name)
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id)
        )
      );

      totalCount = results.reduce((sum, { count }) => sum + (count || 0), 0);

      return totalCount;
    } catch (error) {
      console.error('Failed to count remote rows:', error);
      return 0;
    }
  }

  /**
   * Clear all local storage data
   */
  private static async clearLocalStorage(): Promise<boolean> {
    try {
      // Get all keys that belong to the app
      const appKeys: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && !key.startsWith('sb-')) { // Keep Supabase auth keys
          appKeys.push(key);
        }
      }

      // Remove app-specific keys
      appKeys.forEach(key => localStorage.removeItem(key));
      
      return true;
    } catch (error) {
      console.error('localStorage clear failed:', error);
      return false;
    }
  }

  /**
   * Clear all IndexedDB databases except service worker cache
   */
  private static async clearIndexedDB(): Promise<boolean> {
    try {
      // Clear encrypted KV store
      await EncryptedKV.deleteAll();

      // Get all databases
      const databases = await indexedDB.databases();
      
      for (const db of databases) {
        if (db.name && !db.name.includes('workbox')) { // Keep SW cache
          indexedDB.deleteDatabase(db.name);
        }
      }
      
      return true;
    } catch (error) {
      console.error('IndexedDB clear failed:', error);
      return false;
    }
  }

  /**
   * Clear application caches (but keep SW app-shell)
   */
  private static async clearCacheStorage(): Promise<boolean> {
    try {
      if (!('caches' in window)) return true;

      const cacheNames = await caches.keys();
      
      const deletePromises = cacheNames
        .filter(cacheName => !cacheName.includes('workbox') && !cacheName.includes('precache'))
        .map(cacheName => caches.delete(cacheName));

      await Promise.all(deletePromises);
      
      return true;
    } catch (error) {
      console.error('CacheStorage clear failed:', error);
      return false;
    }
  }

  /**
   * Delete remote Supabase data for the current user
   */
  private static async deleteRemoteData(userId: string): Promise<{
    success: boolean;
    deleted: {
      learnedItems: number;
      userSettings: number;
      journeyTraces: number;
      performanceMetrics: number;
      emergencyContacts: number;
      emergencyRecordings: number;
    };
    errors: string[];
  }> {
    const deleted = {
      learnedItems: 0,
      userSettings: 0,
      journeyTraces: 0,
      performanceMetrics: 0,
      emergencyContacts: 0,
      emergencyRecordings: 0,
    };

    const errors: string[] = [];

    try {
      // Parallelize deletion across all tables
      const results = await Promise.all(
        this.REMOTE_TABLES.map(config =>
          supabase
            .from(config.name)
            .delete({ count: 'exact' })
            .eq('user_id', userId)
            .then(res => ({ ...res, config }))
        )
      );

      results.forEach(({ error, count, config }) => {
        if (error) {
          errors.push(`${config.label}: ${error.message}`);
        } else {
          deleted[config.id] = count || 0;
        }
      });

    } catch (error) {
      errors.push(`Remote delete error: ${error instanceof Error ? error.message : 'Unknown'}`);
    }

    return {
      success: errors.length === 0,
      deleted,
      errors,
    };
  }

  /**
   * Execute complete data wipe - local and remote
   */
  static async wipeAllData(): Promise<WipeResult> {
    const result: WipeResult = {
      success: false,
      localCleared: 0,
      remoteDeleted: 0,
      errors: [],
      details: {
        localStorage: false,
        indexedDB: false,
        cacheStorage: false,
        learnedItems: 0,
        userSettings: 0,
        journeyTraces: 0,
        performanceMetrics: 0,
        emergencyContacts: 0,
        emergencyRecordings: 0,
      },
    };

    try {
      // Get current user
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        result.errors.push('No authenticated user found');
        return result;
      }

      // Parallelize local and remote wipes for maximum efficiency
      const [localStoreSuccess, indexedDbSuccess, cacheSuccess, remoteResult] = await Promise.all([
        this.clearLocalStorage(),
        this.clearIndexedDB(),
        this.clearCacheStorage(),
        this.deleteRemoteData(user.id)
      ]);

      result.details.localStorage = localStoreSuccess;
      if (localStoreSuccess) result.localCleared++;

      result.details.indexedDB = indexedDbSuccess;
      if (indexedDbSuccess) result.localCleared++;

      result.details.cacheStorage = cacheSuccess;
      if (cacheSuccess) result.localCleared++;
      
      result.details.learnedItems = remoteResult.deleted.learnedItems;
      result.details.userSettings = remoteResult.deleted.userSettings;
      result.details.journeyTraces = remoteResult.deleted.journeyTraces;
      result.details.performanceMetrics = remoteResult.deleted.performanceMetrics;
      result.details.emergencyContacts = remoteResult.deleted.emergencyContacts;
      result.details.emergencyRecordings = remoteResult.deleted.emergencyRecordings;
      
      result.remoteDeleted = Object.values(remoteResult.deleted).reduce((sum, count) => sum + count, 0);
      result.errors.push(...remoteResult.errors);

      // Overall success if no critical errors
      result.success = result.errors.length === 0;

      return result;
    } catch (error) {
      result.errors.push(`Wipe failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return result;
    }
  }
}
