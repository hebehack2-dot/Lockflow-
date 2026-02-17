
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
  brand_name: string;
  email?: string;
  profile_image: string;
  banner_image: string;
  bio: string;
  socials: SocialLinks;
}

export interface Resource {
  id: string;
  creator_id: string;
  title: string;
  description: string;
  file_type: 'PDF' | 'ZIP' | 'IMAGE' | 'DOC' | 'LINK';
  file_url: string;
  unlock_method: UnlockMethod;
  unlock_requirement: string;
  preview_image: string;
  created_at: string;
  unlock_count: number;
}
