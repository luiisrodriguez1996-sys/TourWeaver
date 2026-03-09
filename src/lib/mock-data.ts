import { Tour } from './types';

export const MOCK_TOURS: Tour[] = [
  {
    id: '1',
    name: 'Modern Lakeside Villa',
    slug: 'modern-lakeside-villa',
    description: 'A beautiful contemporary home with panoramic lake views.',
    published: true,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    sceneIds: ['s1', 's2']
  }
];
