// Camera configuration and settings

// Color filter presets
export const FILTERS = [
  { name: 'Normal', color: 'transparent', opacity: 0 },
  { name: 'Warm', color: 'rgba(255, 160, 120, 0.2)', opacity: 1 },
  { name: 'Cool', color: 'rgba(100, 140, 230, 0.2)', opacity: 1 },
  { name: 'Vintage', color: 'rgba(200, 180, 120, 0.3)', opacity: 1 },
  { name: 'Cinematic', color: 'rgba(80, 70, 90, 0.3)', opacity: 1 },
  { name: 'Noir', color: 'rgba(0, 0, 0, 0.4)', opacity: 1 },
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