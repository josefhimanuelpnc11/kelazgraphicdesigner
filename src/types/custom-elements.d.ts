// Allow custom elements in TSX (minimal typing to silence JSX errors)
declare namespace JSX {
  interface IntrinsicElements {
    'model-viewer': any;
  }
}
