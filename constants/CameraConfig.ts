// Camera configuration and settings

// Color filter presets
export const FILTERS = [
  { 
    name: 'Normal', 
    displayName: 'Normal',
    color: 'transparent', 
    opacity: 0,
    description: 'No filter applied',
    icon: 'image-outline' // Use Ionicons name
  },
  { 
    name: 'Kodak Gold 200', 
    displayName: 'Gold 200',
    color: 'rgba(255, 190, 120, 0.25)', 
    opacity: 1,
    description: 'Warm, yellowish tones, slight grain',
    icon: 'film-outline'
  },
  { 
    name: 'Portra 400', 
    displayName: 'Portra',
    color: 'rgba(220, 180, 170, 0.25)', 
    opacity: 1,
    description: 'Muted tones, soft skin rendering',
    icon: 'image-outline'
  },
  { 
    name: 'Fujifilm Superia', 
    displayName: 'Superia',
    color: 'rgba(130, 180, 160, 0.3)', 
    opacity: 1,
    description: 'Cool greens, film contrast',
    icon: 'leaf-outline'
  },
  { 
    name: 'Polaroid 600', 
    displayName: 'Polaroid',
    color: 'rgba(200, 210, 230, 0.3)', 
    opacity: 1,
    description: 'Faded pastel look, soft blur',
    icon: 'square-outline'
  },
  { 
    name: 'Ilford HP5', 
    displayName: 'HP5 B&W',
    color: 'rgba(50, 50, 50, 0.6)', 
    opacity: 1,
    description: 'Classic black and white',
    icon: 'contrast-outline'
  },
  { 
    name: 'CineStill 800T', 
    displayName: 'CineStill',
    color: 'rgba(80, 105, 160, 0.35)', 
    opacity: 1,
    description: 'Blue shadows, halation glow',
    icon: 'videocam-outline'
  },
  { 
    name: 'Vintage VHS', 
    displayName: 'VHS',
    color: 'rgba(180, 100, 120, 0.25)', 
    opacity: 1,
    description: 'Low contrast, scan lines',
    icon: 'tv-outline'
  },
  { 
    name: 'Lomo LC-A', 
    displayName: 'Lomo',
    color: 'rgba(70, 40, 90, 0.35)', 
    opacity: 1,
    description: 'Vignette and crushed blacks',
    icon: 'aperture-outline'
  },
];

// Composition guides
export const COMPOSITION_GRIDS = [
  { 
    name: 'None', 
    id: 'none',
  },
  { 
    name: 'Rule of Thirds', 
    id: 'rule-of-thirds',
    description: 'Places subjects at the intersection of grid lines for a balanced composition',
  },
  { 
    name: 'Golden Ratio', 
    id: 'golden-ratio',
    description: 'Uses the 1:1.618 ratio found in nature for aesthetically pleasing composition',
  },
  {
    name: 'Triangle Grid',
    id: 'triangle-grid',
    description: 'Creates triangular sections to guide dynamic and energetic compositions',
  },
  {
    name: 'Fibonacci Spiral',
    id: 'fibonacci-spiral',
    description: 'Uses the logarithmic spiral pattern for natural, flowing compositions',
  },
  {
    name: 'Diagonal Composition',
    id: 'diagonal-composition',
    description: 'Uses diagonal lines to create dynamic and engaging compositions',
  },
];

// Camera settings
export const CAMERA_SETTINGS = {
  // Default aspect ratio
  aspectRatio: '16:9',
  
  // Default photo quality (0-1)
  photoQuality: 0.9,
  
  // Whether to automatically save photos to camera roll
  autoSaveToGallery: true,
  
  // Animation duration for filter transitions (ms)
  filterTransitionDuration: 300,
}; 