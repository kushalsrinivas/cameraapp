declare module 'gl-react' {
  export const Shaders: {
    create: (shaders: Record<string, { frag: string }>) => any;
  };
  export const GLSL: (strings: TemplateStringsArray, ...values: any[]) => string;
  export const Node: React.ComponentType<{
    shader: any;
    uniforms: Record<string, any>;
  }>;
} 