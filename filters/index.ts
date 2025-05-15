import { DuotoneShader } from './shaders/DuotoneShader';
import { FujiShader } from './shaders/FujiShader';
import { GlitchShader } from './shaders/GlitchShader';
import { RetroCamShader } from './shaders/RetroCamShader';
import { VHSShader } from './shaders/VHSShader';

// Map filter names to their shader implementations
export const FILTER_SHADER_MAP = {
  RetroCam: RetroCamShader,
  FujiFilm: FujiShader,
  Glitch: GlitchShader,
  VHS: VHSShader,
  Duotone: DuotoneShader,
};

// Filter metadata for UI display
export const FILTER_METADATA = [
  {
    id: 'Normal',
    name: 'Normal',
    displayName: 'Normal',
    description: 'No filter applied',
    icon: 'image-outline',
    previewColor: 'transparent',
  },
  {
    id: 'RetroCam',
    name: 'RetroCam',
    displayName: 'Retro',
    description: 'Vintage film look with warm tones and subtle grain',
    icon: 'film-outline',
    previewColor: 'rgba(220, 180, 140, 0.25)',
  },
  {
    id: 'FujiFilm',
    name: 'FujiFilm',
    displayName: 'Fuji',
    description: 'Fujifilm-inspired colors with rich greens and vibrant reds',
    icon: 'leaf-outline',
    previewColor: 'rgba(130, 180, 160, 0.3)',
  },
  {
    id: 'Glitch',
    name: 'Glitch',
    displayName: 'Glitch',
    description: 'Digital distortion with RGB shifts and noise',
    icon: 'flash-outline',
    previewColor: 'rgba(100, 120, 220, 0.25)',
  },
  {
    id: 'VHS',
    name: 'VHS',
    displayName: 'VHS',
    description: 'Old VHS tape look with scanlines and color bleeding',
    icon: 'tv-outline',
    previewColor: 'rgba(180, 100, 120, 0.25)',
  },
  {
    id: 'Duotone',
    name: 'Duotone',
    displayName: 'Duotone',
    description: 'Two-tone color effect with customizable colors',
    icon: 'contrast-outline',
    previewColor: 'rgba(120, 80, 180, 0.3)',
  },
]; 