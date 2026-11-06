// scene.jsx: the lobby's street, the game's own (SS5, 1 Nov 2026).
//
// scene.html is lifted from "Manzil - Game Prototype V2.dc.html" by app/scene-extract.mjs:
// the stage's sky, the district's far, mid and near bands, the alley walls, the lines
// overhead, the lamps, the lit windows, the street's life and the four set pieces, every
// SVG byte the game's. It is authored for the game's 932 x 430 stage, so the shell mounts it
// at that size and scales it to the width it has; on a phone the stage is scaled to a
// minimum height and centred, so the street fills the frame and the walls crop. The hour of
// the night (tonight.js's hourStep) picks the layer set through data-hour; scene.css holds
// the four tables and the game's keyframes.
import { useEffect, useRef, useState } from 'react';
import SCENE from './scene.html';
import './scene.css';
import { hourStep } from './tonight.js';

const W = 932, H = 430;

export function Scene({ minHeight = 240, className = '' }) {
  const box = useRef(null);
  const [fit, setFit] = useState({ scale: 1, height: H, offset: 0 });
  const [hour, setHour] = useState(() => hourStep());

  useEffect(() => {
    const el = box.current;
    if (!el) return undefined;
    const measure = () => {
      const w = el.clientWidth || W;
      let scale = w / W;
      let height = Math.round(H * scale);
      if (height < minHeight) { scale = minHeight / H; height = minHeight; }
      const offset = Math.round((w - W * scale) / 2);
      setFit({ scale, height, offset });
    };
    measure();
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(measure) : null;
    if (ro) ro.observe(el); else window.addEventListener('resize', measure);
    return () => { if (ro) ro.disconnect(); else window.removeEventListener('resize', measure); };
  }, [minHeight]);

  // the hour moves on while the page is open
  useEffect(() => {
    const t = setInterval(() => setHour(hourStep()), 60 * 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <div ref={box} className={`scene ${className}`} data-hour={hour} style={{ height: fit.height }} aria-hidden="true">
      <div
        className="scene-stage"
        style={{ transform: `translateX(${fit.offset}px) scale(${fit.scale})` }}
        dangerouslySetInnerHTML={{ __html: SCENE }}
      />
    </div>
  );
}
