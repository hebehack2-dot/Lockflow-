
export enum UnlockMethod {
  MANUAL_CODE = 'MANUAL_CODE',
  TASK_VERIFICATION = 'TASK_VERIFICATION',
  TIME_DELAY = 'TIME_DELAY'
}

export interface SocialLinks {
  instagram?: string;
  youtube?: string;
  twitter?: string;
  tiktok?: string;
}

export interface Creator {
  id: string;
  username: string;
  brandName: string;
  email: string;
  profileImage: string;
  bannerImage: string;
  bio: string;
  socials: SocialLinks;
  stats: {
    totalUnlocks: number;
    totalVisitors: number;
    engagementScore: number;
  };
}

export interface Resource {
  id: string;
  creatorId: string;
  title: string;
  description: string;
  fileType: 'PDF' | 'ZIP' | 'IMAGE' | 'DOC' | 'LINK';
  fileUrl: string;
  unlockMethod: UnlockMethod;
  unlockRequirement: string; // The code, the YT link, or seconds
  previewImage: string;
  createdAt: string;
  unlockCount: number;
}

export interface UserSession {
  unlockedResourceIds: string[];
}
