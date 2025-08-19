import React, { useEffect, useRef } from 'react';

// Minimal typings are provided in src/types/model-viewer.d.ts

function useTileFallback(ref: React.RefObject<any>) {
  useEffect(() => {
    const el = ref.current as any;
    if (!el) return;
    const onError = () => el?.classList?.add('mv-error');
    el?.addEventListener?.('error', onError);
    return () => el?.removeEventListener?.('error', onError);
  }, [ref]);
}

// Simple wrapper to render the custom element without TSX typing issues
const MV: React.FC<any> = (props) => React.createElement('model-viewer' as any, props);

const Hero3D: React.FC = () => {
  const r1 = useRef<any>(null);
  const r2 = useRef<any>(null);
  const r3 = useRef<any>(null);
  useTileFallback(r1);
  useTileFallback(r2);
  useTileFallback(r3);

  const models = {
    lantern: 'https://cdn.jsdelivr.net/gh/KhronosGroup/glTF-Sample-Models@master/2.0/Lantern/glTF-Binary/Lantern.glb',
    avocado: 'https://cdn.jsdelivr.net/gh/KhronosGroup/glTF-Sample-Models@master/2.0/Avocado/glTF-Binary/Avocado.glb',
    duck: 'https://cdn.jsdelivr.net/gh/KhronosGroup/glTF-Sample-Models@master/2.0/Duck/glTF-Binary/Duck.glb',
  } as const;

  return (
    <div className="hero-visual" aria-hidden>
      <div className="mv-grid">
  <div className="mv-tile mv-a">
          <MV
            ref={r1}
            src={models.lantern}
            alt="Creative light"
            {...{ 'camera-controls': true, 'auto-rotate': true, 'rotation-per-second': '16deg', 'shadow-intensity': '0.2', exposure: '1.05', 'interaction-prompt': 'none', loading: 'lazy', reveal: 'auto', 'disable-zoom': true }}
            style={{ width: '100%', height: '100%' }}
          />
        </div>
        <div className="mv-tile mv-b">
          <MV
            ref={r2}
            src={models.avocado}
            alt="Fresh ideas"
            {...{ 'camera-controls': true, 'auto-rotate': true, 'rotation-per-second': '12deg', 'shadow-intensity': '0.2', exposure: '1.05', 'interaction-prompt': 'none', loading: 'lazy', reveal: 'auto', 'disable-zoom': true }}
            style={{ width: '100%', height: '100%' }}
          />
        </div>
        <div className="mv-tile mv-c">
          <MV
            ref={r3}
            src={models.duck}
            alt="Playful learning"
            {...{ 'camera-controls': true, 'auto-rotate': true, 'rotation-per-second': '10deg', 'shadow-intensity': '0.2', exposure: '1.05', 'interaction-prompt': 'none', loading: 'lazy', reveal: 'auto', 'disable-zoom': true }}
            style={{ width: '100%', height: '100%' }}
          />
        </div>
      </div>
      <div className="hero-glow" />
    </div>
  );
};

export default Hero3D;
