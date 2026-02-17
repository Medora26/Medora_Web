// lib/firebase/service/storage-service.ts

import { db } from '@/lib/firebase/config';
import { 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  increment,
  serverTimestamp
} from 'firebase/firestore';

export interface UserStorage {
  userId: string;
  totalBytes: number;
  totalFiles: number;
  lastUpdated: Date | string;
  quotaBytes: number; // 500MB in bytes
  quotaPercentage: number;
}

const DEFAULT_QUOTA_BYTES = 500 * 1024 * 1024; // 500MB in bytes

export class StorageService {
  // Initialize user storage record
  static async initializeUserStorage(userId: string): Promise<void> {
    try {
      console.log(`🔧 Initializing storage for user: ${userId}`);
      const storageRef = doc(db, 'user_storage', userId);
      const storageDoc = await getDoc(storageRef);
      
      if (!storageDoc.exists()) {
        await setDoc(storageRef, {
          userId,
          totalBytes: 0,
          totalFiles: 0,
          lastUpdated: new Date().toISOString(),
          quotaBytes: DEFAULT_QUOTA_BYTES,
          quotaPercentage: 0
        });
        console.log(`✅ Storage initialized for user: ${userId}`);
      } else {
        console.log(`📦 Storage already exists for user: ${userId}`);
      }
    } catch (error) {
      console.error('❌ Error initializing user storage:', error);
    }
  }

  // Update storage usage when file is added
  static async addFileStorage(
    userId: string, 
    fileBytes: number
  ): Promise<{ success: boolean; newTotal: number; quotaExceeded: boolean }> {
    try {
      console.log(`📤 Adding file to storage - User: ${userId}, Size: ${fileBytes} bytes`);
      
      const storageRef = doc(db, 'user_storage', userId);
      let storageDoc = await getDoc(storageRef);
      
      // If storage doc doesn't exist, initialize it first
      if (!storageDoc.exists()) {
        console.log('⚠️ Storage document not found, initializing...');
        await this.initializeUserStorage(userId);
        storageDoc = await getDoc(storageRef);
      }

      const currentData = storageDoc.data();
      if (!currentData) {
        throw new Error('Failed to get storage data');
      }

      const currentTotal = currentData.totalBytes || 0;
      const newTotal = currentTotal + fileBytes;
      const quotaBytes = currentData.quotaBytes || DEFAULT_QUOTA_BYTES;
      const quotaExceeded = newTotal > quotaBytes;

      console.log(`📊 Storage calculation:`, {
        currentTotal,
        fileBytes,
        newTotal,
        quotaBytes,
        quotaExceeded
      });

      if (quotaExceeded) {
        console.warn(`⚠️ Quota exceeded! ${newTotal} > ${quotaBytes}`);
        return { success: false, newTotal, quotaExceeded: true };
      }

      const percentage = (newTotal / quotaBytes) * 100;

      // Update the document
      await updateDoc(storageRef, {
        totalBytes: increment(fileBytes),
        totalFiles: increment(1),
        lastUpdated: new Date().toISOString(),
        quotaPercentage: percentage
      });

      console.log(`✅ Storage updated successfully! New total: ${newTotal} bytes (${percentage.toFixed(2)}%)`);
      
      return { success: true, newTotal, quotaExceeded: false };
    } catch (error) {
      console.error('❌ Error updating storage:', error);
      return { success: false, newTotal: 0, quotaExceeded: false };
    }
  }

  // Remove file from storage when deleted
  static async removeFileStorage(
    userId: string, 
    fileBytes: number
  ): Promise<boolean> {
    try {
      console.log(`🗑️ Removing file from storage - User: ${userId}, Size: ${fileBytes} bytes`);
      
      const storageRef = doc(db, 'user_storage', userId);
      const storageDoc = await getDoc(storageRef);
      
      if (!storageDoc.exists()) {
        console.warn('⚠️ Storage document not found, cannot remove file');
        return false;
      }

      const currentData = storageDoc.data();
      const currentTotal = currentData.totalBytes || 0;
      const newTotal = Math.max(0, currentTotal - fileBytes);
      const quotaBytes = currentData.quotaBytes || DEFAULT_QUOTA_BYTES;
      const percentage = (newTotal / quotaBytes) * 100;

      await updateDoc(storageRef, {
        totalBytes: increment(-fileBytes),
        totalFiles: increment(-1),
        lastUpdated: new Date().toISOString(),
        quotaPercentage: percentage
      });

      console.log(`✅ Storage updated after removal! New total: ${newTotal} bytes`);
      return true;
    } catch (error) {
      console.error('❌ Error removing storage:', error);
      return false;
    }
  }

  // Get user storage info
  static async getUserStorage(userId: string): Promise<UserStorage | null> {
    try {
      console.log(`📖 Getting storage for user: ${userId}`);
      
      const storageRef = doc(db, 'user_storage', userId);
      const storageDoc = await getDoc(storageRef);
      
      if (storageDoc.exists()) {
        const data = storageDoc.data();
        console.log(`📦 Storage data found:`, data);
        
        return {
          userId: data.userId,
          totalBytes: data.totalBytes || 0,
          totalFiles: data.totalFiles || 0,
          lastUpdated: data.lastUpdated,
          quotaBytes: data.quotaBytes || DEFAULT_QUOTA_BYTES,
          quotaPercentage: data.quotaPercentage || 0
        };
      } else {
        console.log(`⚠️ No storage document found for user: ${userId}`);
        // Initialize if doesn't exist
        await this.initializeUserStorage(userId);
        return await this.getUserStorage(userId);
      }
    } catch (error) {
      console.error('❌ Error getting user storage:', error);
      return null;
    }
  }

  // Format bytes to human readable
  static formatBytes(bytes: number, decimals: number = 2): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }
}