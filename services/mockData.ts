
import { Creator, Resource, UnlockMethod } from '../types';

// Updated property names to match snake_case from types.ts and removed non-existent stats property
export const MOCK_CREATOR: Creator = {
  id: 'c1',
  username: 'tech_guru',
  brand_name: 'Tech Guru Academy',
  email: 'hello@techguru.com',
  profile_image: 'https://picsum.photos/seed/tech/200/200',
  banner_image: 'https://picsum.photos/seed/neon/1200/400',
  bio: 'Helping developers master the art of high-performance frontend systems. Unlock my premium cheat sheets and architecture diagrams below.',
  socials: {
    youtube: 'https://youtube.com/@techguru',
    twitter: 'https://twitter.com/techguru',
    instagram: 'https://instagram.com/techguru'
  }
};

export const MOCK_RESOURCES: Resource[] = [
  {
    id: 'r1',
    creator_id: 'c1',
    title: 'Modern React Architecture PDF',
    description: 'A complete guide to structuring large-scale React applications with clean code principles.',
    file_type: 'PDF',
    file_url: 'https://example.com/files/react-arch.pdf',
    unlock_method: UnlockMethod.MANUAL_CODE,
    unlock_requirement: 'REACT2024',
    preview_image: 'https://picsum.photos/seed/react/600/400',
    created_at: '2024-01-15T10:00:00Z',
    unlock_count: 450
  },
  {
    id: 'r2',
    creator_id: 'c1',
    title: 'Ultimate Tailwind Preset v2',
    description: 'My personal configuration file for stunning dark-themed UIs. Includes custom spacing and glassmorphism helpers.',
    file_type: 'ZIP',
    file_url: 'https://example.com/files/tailwind-preset.zip',
    unlock_method: UnlockMethod.TASK_VERIFICATION,
    unlock_requirement: 'https://youtube.com/watch?v=dQw4w9WgXcQ',
    preview_image: 'https://picsum.photos/seed/tailwind/600/400',
    created_at: '2024-02-01T14:30:00Z',
    unlock_count: 890
  },
  {
    id: 'r3',
    creator_id: 'c1',
    title: 'System Design Interview Checklist',
    description: 'A one-page cheat sheet for acing system design interviews at top tech companies.',
    file_type: 'IMAGE',
    file_url: 'https://example.com/files/system-design.png',
    unlock_method: UnlockMethod.TIME_DELAY,
    unlock_requirement: '30', // 30 seconds
    preview_image: 'https://picsum.photos/seed/design/600/400',
    created_at: '2024-03-10T09:15:00Z',
    unlock_count: 230
  }
];
