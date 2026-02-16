export interface UserStorageProps {
    userId: string;
    totalBytes: number;
    totalFiles: number;
    lastUpdated: Date;
    quotaBytes: number; //500MB in byes
    quotaPercentage: number;
}

const DEFAULT_QUOTA_BYTES = 500 * 1024 * 1024 //500MB 

