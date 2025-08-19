/// <reference types="vite/client" />
/// <reference path="./types/model-viewer.d.ts" />
import type React from 'react';

// Allow using the <model-viewer> web component in TSX
declare global {
	namespace JSX {
		interface IntrinsicElements {
			'model-viewer': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
				src?: string;
				poster?: string;
				'camera-controls'?: boolean;
				'auto-rotate'?: boolean;
				'rotation-per-second'?: string;
				'shadow-intensity'?: string | number;
				exposure?: string | number;
				'interaction-prompt'?: string;
				ar?: boolean;
				'ar-modes'?: string;
			};
		}
	}
}
export {};
