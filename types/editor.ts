// Editor Adjustment Properties
export interface EditorAdjustments {
  exposure: number;      // -3 to +3 EV
  brightness: number;    // -100 to +100
  contrast: number;      // -100 to +100
  saturation: number;    // 0 to 200%
  temperature: number;   // -100 (blue) to +100 (yellow)
  fade: number;          // 0 to 100
  highlights: number;    // -100 to +100
  shadows: number;       // -100 to +100
  grain: number;         // 0 to 100
  vignette: number;      // 0 to 100
  tint: number;          // -100 (green) to +100 (magenta)
  shadowsTint: number;   // -100 to +100
  blacks: number;        // -100 to +100
  whites: number;        // -100 to +100
}

// User saved preset
export interface UserPreset {
  id: string;
  name: string;
  adjustments: EditorAdjustments;
  filterId: string;
  previewImageUri: string;
}

// Aspect ratio options for cropping
export type AspectRatio = '1:1' | '4:3' | '16:9' | '2.35:1' | 'freeform';

// Crop parameters
export interface CropParams {
  crop: {
    originX: number;
    originY: number;
    width: number;
    height: number;
  };
  rotation: number;
  flipHorizontal: boolean;
  flipVertical: boolean;
  aspectRatio?: AspectRatio;
} 