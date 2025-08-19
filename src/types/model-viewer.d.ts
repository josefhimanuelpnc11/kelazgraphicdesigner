declare namespace JSX {
  interface IntrinsicElements {
    'model-viewer': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
      src?: string;
      alt?: string;
      'camera-controls'?: boolean | '';
      'auto-rotate'?: boolean | '';
      'rotation-per-second'?: string;
      'shadow-intensity'?: string | number;
      exposure?: string | number;
      'interaction-prompt'?: string;
      loading?: 'eager' | 'lazy' | 'auto';
      reveal?: 'auto' | 'interaction' | 'manual';
      'disable-zoom'?: boolean | '';
      style?: React.CSSProperties;
    };
  }
}
