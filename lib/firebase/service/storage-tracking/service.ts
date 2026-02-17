import { collection, doc, getDoc, getDocs, increment, query, setDoc, updateDoc, where } from "firebase/firestore";
import { db } from "../../config";
import { DEFAULT_QUOTA_BYTES, UserStorageAPI_RESPONSE_PROPS, UserStorageProps } from "@/types/storage/type";


export class StorageService {

    // initialized storage
    static async initializeUserStorage(userId: string): Promise<void>{
            try {
                 const storageRef = doc(db, "user_storage", userId);
                 const storageDoc = await getDoc(storageRef);

                 if(!storageDoc.exists()) {
                     await setDoc(storageRef, {
                         userId,
                         totalBytes: 0,
                         totalFiles: 0,
                         lastUpdated: new Date().toISOString(),
                         quotaBytes: DEFAULT_QUOTA_BYTES,
                         quotaPercentage: 0
                     });
                     console.log(`Storage initialized for users: ${userId}`)
                 }
            } catch (error) {
              console.log("Error initializing user storage", error)
            }
    }


  //update Storage when files added 
   static async addFileStorage(
       userId: string,
       fileBytes: number
   ): Promise<UserStorageAPI_RESPONSE_PROPS> {
        try {
          const storageRef = doc(db, "user_storage", userId);
          const storageDoc = await getDoc(storageRef);

          if(!storageDoc.exists()) {
             await this.initializeUserStorage(userId)
          }

          const currentData = storageDoc.exists() ? storageDoc.data() : {totalBytes: 0, quotaBytes: DEFAULT_QUOTA_BYTES};
          const newTotal = (currentData.totalBytes || 0) + fileBytes
          const quotaExceeded = newTotal > (currentData.quotaBytes || DEFAULT_QUOTA_BYTES) * 100;

          if(quotaExceeded) {
             return {success: false, newTotal, quotaExceeded: true}
          }

          const percentage = (newTotal/ (currentData.quotaBytes || DEFAULT_QUOTA_BYTES)) * 100

          await updateDoc(storageRef, {
             totalBytes: increment(fileBytes),
             totalFiles: increment(1),
             lastUpdated: new Date().toISOString(),
             quotaPercentage: percentage
          });
          console.log(`Added ${fileBytes} bytes to users ${userId} storage`)
          return {
            success: true,
            newTotal,
            quotaExceeded: false
          }
        } catch (error) {
          console.error("Error updating user storage:", error)
          return {
             success: false,
             newTotal: 0,
             quotaExceeded: false
          }
        }
   }

   // Remove file from storage when deleted 

  static async removeFileStorage(
    userId: string, 
    fileBytes: number
  ): Promise<void> {
    try {
      const storageRef = doc(db, 'user_storage', userId);
      const storageDoc = await getDoc(storageRef);
      
      if (storageDoc.exists()) {
        const currentTotal = storageDoc.data().totalBytes || 0;
        const newTotal = Math.max(0, currentTotal - fileBytes);
        const quotaBytes = storageDoc.data().quotaBytes || DEFAULT_QUOTA_BYTES;
        const percentage = (newTotal / quotaBytes) * 100;

        await updateDoc(storageRef, {
          totalBytes: increment(-fileBytes),
          totalFiles: increment(-1),
          lastUpdated: new Date().toISOString(),
          quotaPercentage: percentage
        });

        console.log(`✅ Removed ${fileBytes} bytes from user ${userId} storage`);
      }
    } catch (error) {
      console.error('Error removing storage:', error);
    }
  }

  static async getUserStorage(userId: string): Promise<UserStorageProps | null> {
    try {
      const storageRef = doc(db, 'user_storage', userId);
      const storageDoc = await getDoc(storageRef);

      if(storageDoc.exists()) {
         const data = storageDoc.data()
         return {
             userId: data.userId,
             totalBytes: data.totalBytes,
             totalFiles: data.totalFiles,
             lastUpdated: new Date(data.lastUpdated),
             quotaBytes: data.quotaBytes,
             quotaPercentage: data.quotaPercentage
         }
      } else {
         await this.initializeUserStorage(userId)
         return await this.getUserStorage(userId)
      }
    } catch (error) {
      console.error("Error getting user storage",error)
      return null
    }
  }

  // Calculate total storage from all user documents (for admin)
  static async calculateUserStorageFromDocuments(userId: string): Promise<number> {
    try {
      const documentsCollection = collection(db, 'documents');
      const q = query(
        documentsCollection,
        where('userId', '==', userId),
        where('isTrashed', '==', false)
      );
      
      const querySnapshot = await getDocs(q);
      let totalBytes = 0;
      
      querySnapshot.forEach(doc => {
        const data = doc.data();
        totalBytes += data.cloudinary?.bytes || 0;
      });
      
      return totalBytes;
    } catch (error) {
      console.error('Error calculating storage:', error);
      return 0;
    }
  }

  // Format bytes to human readable
  static formatBytes(bytes: number, decimals: number = 2): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }


}


