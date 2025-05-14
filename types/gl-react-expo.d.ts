declare module 'gl-react-expo' {
  import type React from 'react';
  
  export const Surface: React.ComponentType<{
    style?: Record<string, any>;
    children?: React.ReactNode;
  }>;
} 