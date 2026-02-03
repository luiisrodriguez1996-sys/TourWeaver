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
    scenes: [
      {
        id: 's1',
        tourId: '1',
        name: 'Grand Entrance',
        description: 'The welcoming foyer of the villa.',
        imageUrl: 'https://picsum.photos/seed/villa-hall/6000/3000',
        hotspots: [
          {
            id: 'h1',
            sceneId: 's1',
            targetSceneId: 's2',
            label: 'Go to Living Room',
            yaw: 0.5,
            pitch: -0.1
          }
        ]
      },
      {
        id: 's2',
        tourId: '1',
        name: 'Spacious Living Room',
        description: 'Large open living area with floor-to-ceiling windows.',
        imageUrl: 'https://picsum.photos/seed/villa-living/6000/3000',
        hotspots: [
          {
            id: 'h2',
            sceneId: 's2',
            targetSceneId: 's1',
            label: 'Back to Entrance',
            yaw: 3.5,
            pitch: 0
          }
        ]
      }
    ]
  }
];