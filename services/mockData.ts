
import { Creator, Resource, UnlockMethod } from '../types';

export const MOCK_CREATOR: Creator = {
  id: 'c1',
  username: 'tech_guru',
  brandName: 'Tech Guru Academy',
  email: 'hello@techguru.com',
  profileImage: 'https://picsum.photos/seed/tech/200/200',
  bannerImage: 'https://picsum.photos/seed/neon/1200/400',
  bio: 'Helping developers master the art of high-performance frontend systems. Unlock my premium cheat sheets and architecture diagrams below.',
  socials: {
    youtube: 'https://youtube.com/@techguru',
    twitter: 'https://twitter.com/techguru',
    instagram: 'https://instagram.com/techguru'
  },
  stats: {
    totalUnlocks: 1240,
    totalVisitors: 4520,
    engagementScore: 88
  }
};

export const MOCK_RESOURCES: Resource[] = [
  {
    id: 'r1',
    creatorId: 'c1',
    title: 'Modern React Architecture PDF',
    description: 'A complete guide to structuring large-scale React applications with clean code principles.',
    fileType: 'PDF',
    fileUrl: 'https://example.com/files/react-arch.pdf',
    unlockMethod: UnlockMethod.MANUAL_CODE,
    unlockRequirement: 'REACT2024',
    previewImage: 'https://picsum.photos/seed/react/600/400',
    createdAt: '2024-01-15T10:00:00Z',
    unlockCount: 450
  },
  {
    id: 'r2',
    creatorId: 'c1',
    title: 'Ultimate Tailwind Preset v2',
    description: 'My personal configuration file for stunning dark-themed UIs. Includes custom spacing and glassmorphism helpers.',
    fileType: 'ZIP',
    fileUrl: 'https://example.com/files/tailwind-preset.zip',
    unlockMethod: UnlockMethod.TASK_VERIFICATION,
    unlockRequirement: 'https://youtube.com/watch?v=dQw4w9WgXcQ',
    previewImage: 'https://picsum.photos/seed/tailwind/600/400',
    createdAt: '2024-02-01T14:30:00Z',
    unlockCount: 890
  },
  {
    id: 'r3',
    creatorId: 'c1',
    title: 'System Design Interview Checklist',
    description: 'A one-page cheat sheet for acing system design interviews at top tech companies.',
    fileType: 'IMAGE',
    fileUrl: 'https://example.com/files/system-design.png',
    unlockMethod: UnlockMethod.TIME_DELAY,
    unlockRequirement: '30', // 30 seconds
    previewImage: 'https://picsum.photos/seed/design/600/400',
    createdAt: '2024-03-10T09:15:00Z',
    unlockCount: 230
  }
];
