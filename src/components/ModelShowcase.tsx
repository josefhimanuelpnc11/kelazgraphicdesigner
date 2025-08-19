/* Lightweight 3D model showcase using <model-viewer> web component (CDN-loaded).
   Models are public demo assets from modelviewer.dev shared-assets. */
import React, { useEffect, useRef, useState } from 'react';
import './HomePage.css';


// Resilient viewer with fallbacks; cycles through provided sources on error
const MV: React.FC<{ src?: string; fallback?: string; sources?: string[]; [k: string]: any }> = ({ src, fallback, sources, ...rest }) => {
  const elRef = useRef<HTMLElement | null>(null);
  const srcList = (sources && sources.length ? sources : [src, fallback].filter(Boolean)) as string[];
  const indexRef = useRef(0);
  useEffect(() => {
    const el = elRef.current as any;
    if (!el) return;
    const onError = () => {
      if (indexRef.current < srcList.length - 1) {
        indexRef.current += 1;
        try {
          el.setAttribute('src', srcList[indexRef.current]);
        } catch {}
      }
    };
    el.addEventListener('error', onError);
    return () => el.removeEventListener('error', onError);
  }, [srcList.join('|')]);
  // eslint-disable-next-line react/no-unknown-property
  return React.createElement('model-viewer' as any, { ref: elRef, src: srcList[0], crossorigin: 'anonymous', ...rest });
};

const ModelShowcase: React.FC = () => {
  const ref = useRef<HTMLDivElement>(null);
  const m1 = useRef<HTMLDivElement>(null);
  const m2 = useRef<HTMLDivElement>(null);
  const m3 = useRef<HTMLDivElement>(null);
  const arrange = useRef(false);
  const [arranging, setArranging] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let raf = 0;
    let targetX = 0;
    let targetY = 0;
    let rx = 0;
    let ry = 0;

    const onMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = (e.clientX - cx) / rect.width; // -0.5..0.5
      const dy = (e.clientY - cy) / rect.height; // -0.5..0.5
      targetX = dx * 10; // degrees
      targetY = -dy * 10;
    };

    const animate = () => {
      rx += (targetY - rx) * 0.06;
      ry += (targetX - ry) * 0.06;
      el.style.setProperty('--rx', `${rx.toFixed(2)}deg`);
      el.style.setProperty('--ry', `${ry.toFixed(2)}deg`);
      raf = requestAnimationFrame(animate);
    };

    const start = () => {
      if (!raf) raf = requestAnimationFrame(animate);
      window.addEventListener('mousemove', onMove);
    };
    const stop = () => {
      window.removeEventListener('mousemove', onMove);
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    };

    // Draggable setup for each model; when arrange mode active, drag whole tile
    const makeDraggable = (box: HTMLDivElement | null) => {
      if (!box) return () => {};
      const dragTarget = box; // entire tile draggable in arrange mode
      let dragging = false;
      let sx = 0, sy = 0, bx = 0, by = 0;
      const onDown = (e: PointerEvent) => {
        if (!arrange.current) return; // only draggable in arrange mode
        e.preventDefault();
        dragging = true;
        dragTarget.setPointerCapture(e.pointerId);
        const rect = box.getBoundingClientRect();
        sx = e.clientX; sy = e.clientY; bx = rect.left; by = rect.top;
        // If positioned via right, reset to left for drag calculations
        (box.style as any).right = 'auto';
      };
      const onMove = (e: PointerEvent) => {
        if (!dragging) return;
        const container = ref.current!;
        const cRect = container.getBoundingClientRect();
        const bRect = box.getBoundingClientRect();
        let nx = bx + (e.clientX - sx) - cRect.left;
        let ny = by + (e.clientY - sy) - cRect.top;
        // clamp
        nx = Math.max(0, Math.min(nx, cRect.width - bRect.width));
        ny = Math.max(0, Math.min(ny, cRect.height - bRect.height));
        box.style.left = nx + 'px';
        box.style.top = ny + 'px';
      };
      const onUp = (e: PointerEvent) => {
        dragging = false;
        try { dragTarget.releasePointerCapture(e.pointerId); } catch {}
      };
      dragTarget.addEventListener('pointerdown', onDown);
      dragTarget.addEventListener('pointermove', onMove);
      dragTarget.addEventListener('pointerup', onUp);
      dragTarget.addEventListener('pointercancel', onUp);
      return () => {
        dragTarget.removeEventListener('pointerdown', onDown);
        dragTarget.removeEventListener('pointermove', onMove);
        dragTarget.removeEventListener('pointerup', onUp);
        dragTarget.removeEventListener('pointercancel', onUp);
      };
    };

    const clean1 = makeDraggable(m1.current);
    const clean2 = makeDraggable(m2.current);
    const clean3 = makeDraggable(m3.current);

    start();
    return () => {
      stop();
      clean1(); clean2(); clean3();
    };
  }, []);

  return (
    <div className="model-showcase" ref={ref}>
      <button
        type="button"
        className="arrange-toggle"
        aria-pressed={arranging}
        onClick={() => {
          const next = !arranging;
          setArranging(next);
          arrange.current = next;
          if (ref.current) {
            if (next) ref.current.classList.add('arrange');
            else ref.current.classList.remove('arrange');
          }
        }}
      >{arranging ? 'Stop Arrange' : 'Arrange 3D'}</button>
      <div className="model-float mf-1" ref={m1}>
        <div className="drag-handle" title="Drag"></div>
        <MV
          sources={[
            'https://modelviewer.dev/shared-assets/models/Astronaut.glb',
            'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/DamagedHelmet/glTF/DamagedHelmet.gltf'
          ]}
          camera-controls
          auto-rotate
          loading="lazy"
          rotation-per-second="30deg"
          shadow-intensity="0.9"
          exposure="1.05"
          interaction-prompt="none"
          style={{ width: '100%', height: '100%', background: 'transparent', cursor: 'grab' }}
        />
      </div>
      <div className="model-float mf-2" ref={m2}>
        <div className="drag-handle" title="Drag"></div>
        <MV
          sources={[
            'https://modelviewer.dev/shared-assets/models/RobotExpressive.glb',
            'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/BoomBox/glTF/BoomBox.gltf'
          ]}
          camera-controls
          auto-rotate
          loading="lazy"
          rotation-per-second="25deg"
          shadow-intensity="0.9"
          exposure="1.05"
          interaction-prompt="none"
          style={{ width: '100%', height: '100%', background: 'transparent', cursor: 'grab' }}
        />
      </div>
      <div className="model-float mf-3" ref={m3}>
        <div className="drag-handle" title="Drag"></div>
        <MV
          sources={[
            'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Fox/glTF/Fox.gltf',
            'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Avocado/glTF/Avocado.gltf',
            'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Duck/glTF/Duck.gltf'
          ]}
          camera-controls
          auto-rotate
          loading="lazy"
          rotation-per-second="20deg"
          shadow-intensity="0.9"
          exposure="1.05"
          interaction-prompt="none"
          alt="3D mascot"
          style={{ width: '100%', height: '100%', background: 'transparent', cursor: 'grab' }}
        />
      </div>
      <div className="model-particles" aria-hidden="true">
        {Array.from({ length: 12 }).map((_, i) => (
          <span key={i} style={{ ['--i' as any]: i + 1 }} />
        ))}
      </div>
    </div>
  );
};

export default ModelShowcase;
