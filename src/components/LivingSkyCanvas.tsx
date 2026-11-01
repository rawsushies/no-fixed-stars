import React, { useEffect, useRef } from 'react';
import {
  CATALOG_STARS,
  getObservedStarPosition,
  type CosmicStage,
  type SceneId,
  type StationId,
} from '../game/astronomyLogic';

interface BgStar {
  x: number;
  y: number;
  radius: number;
  baseAlpha: number;
  twinkleSpeed: number;
  twinklePhase: number;
  depthLayer: 0 | 1 | 2; // 0 = far, 1 = mid, 2 = near
  color: string;
  vanishesInStage3: boolean;
}

interface CloudBand {
  x: number;
  y: number;
  width: number;
  height: number;
  speed: number;
  depth: number;
  opacity: number;
  lobes: { dx: number; dy: number; rx: number; ry: number }[];
}

interface DustParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  phase: number;
}

export interface LivingSkyCanvasProps {
  scene: SceneId;
  station: StationId;
  cosmicStage: CosmicStage;
  isPaused: boolean;
  cameraTargetOffset: { x: number; y: number };
  onCameraMove?: (offset: { x: number; y: number }) => void;
  traumaTrigger?: number;
}

export const LivingSkyCanvas: React.FC<LivingSkyCanvasProps> = ({
  scene,
  station,
  cosmicStage,
  isPaused,
  cameraTargetOffset,
  onCameraMove,
  traumaTrigger = 0,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Store latest props in refs so the 60Hz loop never tears down or restarts on React state updates
  const stateRef = useRef({
    scene,
    station,
    cosmicStage,
    isPaused,
    cameraTargetOffset,
    onCameraMove,
  });

  useEffect(() => {
    stateRef.current = {
      scene,
      station,
      cosmicStage,
      isPaused,
      cameraTargetOffset,
      onCameraMove,
    };
  }, [scene, station, cosmicStage, isPaused, cameraTargetOffset, onCameraMove]);

  const simRef = useRef({
    camX: 0,
    camY: 0,
    velX: 0,
    velY: 0,
    trauma: 0,
    hitstop: 0,
    time: 0,
    isDragging: false,
    dragLastX: 0,
    dragLastY: 0,
    keysHeld: new Set<string>(),
  });

  // Trigger camera trauma & brief simulation hitstop on cosmic revelation events
  useEffect(() => {
    if (traumaTrigger > 0) {
      simRef.current.trauma = Math.min(1, simRef.current.trauma + 0.65);
      simRef.current.hitstop = 0.06;
    }
  }, [traumaTrigger]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    // Deterministic seeded PRNG for consistent starfields & clouds
    let seed = 19261031;
    const rand = () => {
      seed = (seed * 1664525 + 1013904223) % 4294967296;
      return seed / 4294967296;
    };

    // Layer 2: Pre-allocate 3 depth layers of stars (420 stars total)
    const starPalette = ['#dce8ff', '#e8eef9', '#cbd9f0', '#f4e7d3', '#b8cde8'];
    const bgStars: BgStar[] = Array.from({ length: 420 }, (_, i) => {
      const depthLayer = (i < 240 ? 0 : i < 360 ? 1 : 2) as 0 | 1 | 2;
      return {
        x: rand() * 1.4 - 0.2,
        y: rand() * 0.78, // Concentrated in the top 78% sky region
        radius:
          depthLayer === 0
            ? 0.55 + rand() * 0.55
            : depthLayer === 1
              ? 0.85 + rand() * 0.75
              : 1.25 + rand() * 0.95,
        baseAlpha:
          depthLayer === 0
            ? 0.25 + rand() * 0.35
            : depthLayer === 1
              ? 0.45 + rand() * 0.4
              : 0.65 + rand() * 0.35,
        twinkleSpeed: 0.4 + rand() * 2.1,
        twinklePhase: rand() * Math.PI * 2,
        depthLayer,
        color: starPalette[Math.floor(rand() * starPalette.length)],
        vanishesInStage3: i % 9 === 0,
      };
    });

    // Layer 5: High-altitude nocturnal cloud bands
    const clouds: CloudBand[] = Array.from({ length: 11 }, (_, i) => {
      const lobes = Array.from({ length: 5 }, () => ({
        dx: (rand() - 0.5) * 220,
        dy: (rand() - 0.5) * 26,
        rx: 70 + rand() * 110,
        ry: 14 + rand() * 22,
      }));
      return {
        x: (i / 11) * 1.3 - 0.15,
        y: 0.16 + rand() * 0.52,
        width: 240 + rand() * 220,
        height: 32 + rand() * 28,
        speed: (0.0022 + rand() * 0.0035) * (i % 2 === 0 ? 1 : -0.7),
        depth: 0.35 + (i % 3) * 0.22,
        opacity: 0.16 + rand() * 0.18,
        lobes,
      };
    });

    // Layer 10: Pre-allocated Zero-GC ring buffer of 55 environmental particles
    const particles: DustParticle[] = Array.from({ length: 55 }, () => ({
      x: rand(),
      y: rand(),
      vx: -0.006 - rand() * 0.012,
      vy: -0.002 + (rand() - 0.5) * 0.004,
      size: 0.8 + rand() * 1.4,
      alpha: 0.12 + rand() * 0.28,
      phase: rand() * Math.PI * 2,
    }));

    let width = window.innerWidth;
    let height = window.innerHeight;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);

    const updateCanvasSize = () => {
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      width = Math.max(320, rect.width || window.innerWidth);
      height = Math.max(320, rect.height || window.innerHeight);
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    updateCanvasSize();
    const resizeObserver = new ResizeObserver(updateCanvasSize);
    resizeObserver.observe(canvas);

    // Input listeners on window for smooth sky panning
    const onKeyDown = (e: KeyboardEvent) => {
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'KeyA', 'KeyD', 'KeyW', 'KeyS'].includes(e.code)) {
        simRef.current.keysHeld.add(e.code);
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      simRef.current.keysHeld.delete(e.code);
    };
    const clearInputs = () => {
      simRef.current.keysHeld.clear();
      simRef.current.isDragging = false;
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', clearInputs);

    let rafId = 0;
    let timerId: ReturnType<typeof setTimeout> | null = null;
    let isDisposed = false;
    let lastTime = performance.now();

    const renderFrame = (now: number) => {
      if (isDisposed) return;
      const rawDt = Math.max(0.001, (now - lastTime) / 1000);
      lastTime = now;
      // Clamp frame delta time per game craft rules
      const dt = Math.min(rawDt, 0.05);

      const {
        scene: curScene,
        station: curStation,
        cosmicStage: stage,
        isPaused: paused,
        cameraTargetOffset: targetOffset,
        onCameraMove: reportCam,
      } = stateRef.current;

      const sim = simRef.current;

      // Decay trauma & hitstop in real dt
      if (sim.hitstop > 0) {
        sim.hitstop = Math.max(0, sim.hitstop - dt);
      }
      if (sim.trauma > 0) {
        sim.trauma = Math.max(0, sim.trauma - dt * 0.55);
      }

      const simDt = paused || sim.hitstop > 0 ? 0 : dt;
      sim.time += simDt;

      // Keyboard sky panning
      const panSpeed = 0.42;
      let keyDx = 0;
      let keyDy = 0;
      if (sim.keysHeld.has('ArrowLeft') || sim.keysHeld.has('KeyA')) keyDx -= 1;
      if (sim.keysHeld.has('ArrowRight') || sim.keysHeld.has('KeyD')) keyDx += 1;
      if (sim.keysHeld.has('ArrowUp') || sim.keysHeld.has('KeyW')) keyDy -= 1;
      if (sim.keysHeld.has('ArrowDown') || sim.keysHeld.has('KeyS')) keyDy += 1;

      if (keyDx !== 0 || keyDy !== 0) {
        targetOffset.x = Math.max(-1, Math.min(1, targetOffset.x + keyDx * panSpeed * simDt));
        targetOffset.y = Math.max(-0.6, Math.min(0.6, targetOffset.y + keyDy * panSpeed * simDt));
        reportCam?.({ x: targetOffset.x, y: targetOffset.y });
      }

      // Autonomous gentle camera offset on Title Screen that settles smoothly
      let desiredX = targetOffset.x;
      let desiredY = targetOffset.y;
      if (curScene === 'TITLE') {
        desiredX = targetOffset.x * 0.6;
        desiredY = targetOffset.y * 0.4;
      }

      // Smooth exponential camera damping
      const damp = 1 - Math.exp(-7.5 * dt);
      sim.camX += (desiredX - sim.camX) * damp;
      sim.camY += (desiredY - sim.camY) * damp;

      // Camera shake offset from trauma^2
      const shakeMag = sim.trauma * sim.trauma * 14;
      const shakeX = shakeMag * Math.sin(now * 0.047);
      const shakeY = shakeMag * Math.cos(now * 0.063);

      // =========================================================
      // LAYER 1: DEEP-SPACE BACKGROUND GRADIENT
      // =========================================================
      const skyGrad = ctx.createLinearGradient(0, 0, 0, height);
      if (stage <= 2) {
        skyGrad.addColorStop(0, '#03060e');
        skyGrad.addColorStop(0.42, '#070d1c');
        skyGrad.addColorStop(0.74, '#0f1b31');
        skyGrad.addColorStop(1, '#162338');
      } else if (stage === 3) {
        skyGrad.addColorStop(0, '#04050f');
        skyGrad.addColorStop(0.4, '#0b0e22');
        skyGrad.addColorStop(0.74, '#151c33');
        skyGrad.addColorStop(1, '#1a2336');
      } else {
        // Stage 4 Revelation: Colder abyssal indigo with faint unnatural violet-verdigris zenith
        skyGrad.addColorStop(0, '#060412');
        skyGrad.addColorStop(0.38, '#110d26');
        skyGrad.addColorStop(0.72, '#13222e');
        skyGrad.addColorStop(1, '#0e1722');
      }
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, width, height);

      // =========================================================
      // LAYER 4: SLOWLY MOVING NEBULA FORMATIONS
      // =========================================================
      ctx.save();
      const nebParallaxX = -sim.camX * 22 + shakeX * 0.2;
      const nebParallaxY = -sim.camY * 14 + shakeY * 0.2;
      const nebDrift = Math.sin(sim.time * 0.03) * 18;

      // Primary Milky Way / Cygnus Rift veil
      const nebGrad1 = ctx.createRadialGradient(
        width * 0.48 + nebParallaxX + nebDrift,
        height * 0.32 + nebParallaxY,
        10,
        width * 0.48 + nebParallaxX + nebDrift,
        height * 0.32 + nebParallaxY,
        Math.max(width, height) * 0.45
      );
      if (stage < 3) {
        nebGrad1.addColorStop(0, 'rgba(44, 72, 118, 0.22)');
        nebGrad1.addColorStop(0.5, 'rgba(26, 45, 82, 0.11)');
        nebGrad1.addColorStop(1, 'rgba(5, 8, 17, 0)');
      } else {
        nebGrad1.addColorStop(0, 'rgba(98, 62, 152, 0.25)');
        nebGrad1.addColorStop(0.45, 'rgba(46, 102, 108, 0.14)');
        nebGrad1.addColorStop(1, 'rgba(5, 8, 17, 0)');
      }
      ctx.fillStyle = nebGrad1;
      ctx.fillRect(0, 0, width, height * 0.85);

      // Secondary pale moonlight / cosmic dust band
      const nebGrad2 = ctx.createRadialGradient(
        width * 0.66 + nebParallaxX * 1.2 - nebDrift,
        height * 0.24 + nebParallaxY,
        5,
        width * 0.66 + nebParallaxX * 1.2 - nebDrift,
        height * 0.24 + nebParallaxY,
        width * 0.32
      );
      nebGrad2.addColorStop(0, stage === 4 ? 'rgba(130, 210, 185, 0.14)' : 'rgba(102, 142, 192, 0.14)');
      nebGrad2.addColorStop(1, 'rgba(5, 8, 17, 0)');
      ctx.fillStyle = nebGrad2;
      ctx.fillRect(0, 0, width, height * 0.85);
      ctx.restore();

      // =========================================================
      // LAYER 2: MULTI-PLANE STARFIELD (3 DEPTH LAYERS)
      // =========================================================
      const depthMultipliers = [14, 28, 46];
      for (let i = 0; i < bgStars.length; i++) {
        const s = bgStars[i];
        if (stage >= 3 && s.vanishesInStage3) continue;

        const pMult = depthMultipliers[s.depthLayer];
        const sx = ((s.x * width - sim.camX * pMult + shakeX * 0.3) % (width * 1.3));
        const wrappedX = sx < -width * 0.15 ? sx + width * 1.3 : sx;
        const sy = s.y * height - sim.camY * (pMult * 0.65) + shakeY * 0.3;

        if (sy < 0 || sy > height * 0.82) continue;

        // Unsynchronized individual scintillation
        const twinkle =
          0.72 + 0.28 * Math.sin(sim.time * s.twinkleSpeed + s.twinklePhase);
        const alpha = Math.max(0.08, Math.min(1, s.baseAlpha * twinkle));

        ctx.fillStyle = s.color;
        ctx.globalAlpha = alpha;
        ctx.beginPath();
        ctx.arc(wrappedX, sy, s.radius, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      // =========================================================
      // LAYER 3: INDIVIDUALLY RENDERED CATALOG STARS & CONSTELLATIONS
      // =========================================================
      const starScreenCoords: Record<string, { x: number; y: number }> = {};
      const catalogParallax = 38;

      for (const cStar of CATALOG_STARS) {
        const pos = getObservedStarPosition(cStar, curStation);
        let screenX = pos.x * width - sim.camX * catalogParallax + shakeX * 0.4;
        let screenY = pos.y * height - sim.camY * (catalogParallax * 0.7) + shakeY * 0.4;

        // THE CORE VISUAL HORROR MECHANIC:
        // "A star should not move when you move."
        if (cStar.isAnomaly) {
          if (stage === 2) {
            screenX = pos.x * width + sim.camX * (catalogParallax * 0.65);
            screenY = pos.y * height + sim.camY * (catalogParallax * 0.45);
          } else if (stage === 3) {
            screenX = pos.x * width + sim.camX * (catalogParallax * 1.1);
            screenY = pos.y * height + sim.camY * (catalogParallax * 0.8);
          } else if (stage === 4) {
            // STAGE 4 REVELATION: Nadir-IX remains dead-fixed in the viewport while the entire sky moves around it!
            screenX = 0.54 * width;
            screenY = 0.34 * height;
          }
        }

        starScreenCoords[cStar.id] = { x: screenX, y: screenY };
      }

      // Constellation geometry lines
      ctx.save();
      ctx.lineWidth = 0.9;
      if (stage <= 2) {
        ctx.strokeStyle = 'rgba(168, 195, 235, 0.16)';
        const normalPairs: [string, string][] = [
          ['ALPHA_CYGNI', 'GAMMA_CYGNI'],
          ['GAMMA_CYGNI', 'DELTA_CYGNI'],
          ['GAMMA_CYGNI', 'EPSILON_CYGNI'],
          ['EPSILON_CYGNI', 'SIGMA_NADIR'],
          ['BETA_LACERTAE', 'ALPHA_LACERTAE'],
        ];
        ctx.beginPath();
        for (const [a, b] of normalPairs) {
          const pa = starScreenCoords[a];
          const pb = starScreenCoords[b];
          if (pa && pb) {
            ctx.moveTo(pa.x, pa.y);
            ctx.lineTo(pb.x, pb.y);
          }
        }
        ctx.stroke();
      } else {
        // Stages 3 & 4: Constellations re-link toward Nadir-IX in an impossible ocular/radial geometry
        ctx.strokeStyle =
          stage === 4
            ? 'rgba(179, 136, 235, 0.32)'
            : 'rgba(168, 185, 225, 0.22)';
        const hub = starScreenCoords['NADIR_IX'];
        if (hub) {
          ctx.beginPath();
          for (const cStar of CATALOG_STARS) {
            if (cStar.id === 'NADIR_IX') continue;
            const pt = starScreenCoords[cStar.id];
            if (pt) {
              ctx.moveTo(hub.x, hub.y);
              ctx.lineTo(pt.x, pt.y);
            }
          }
          ctx.stroke();

          if (stage === 4) {
            // Impossible non-Euclidean double iris rings around Nadir-IX
            ctx.strokeStyle = 'rgba(130, 210, 185, 0.28)';
            ctx.beginPath();
            ctx.ellipse(
              hub.x,
              hub.y,
              115 + Math.sin(sim.time * 0.8) * 6,
              54 + Math.cos(sim.time * 0.6) * 4,
              sim.camX * 0.25,
              0,
              Math.PI * 2
            );
            ctx.stroke();

            ctx.strokeStyle = 'rgba(212, 163, 89, 0.26)';
            ctx.beginPath();
            ctx.arc(hub.x, hub.y, 44, 0, Math.PI * 2);
            ctx.stroke();
          }
        }
      }
      ctx.restore();

      // Render each catalog star with restrained bloom
      for (const cStar of CATALOG_STARS) {
        const pt = starScreenCoords[cStar.id];
        if (!pt) continue;

        const isAnom = cStar.isAnomaly;
        const pulse =
          0.85 + 0.15 * Math.sin(sim.time * (isAnom ? 2.4 : 1.3) + pt.x * 0.01);
        const coreRadius = Math.max(2.0, (6.2 - cStar.magnitude) * 0.75);

        // Fast concentric soft glow halos
        ctx.save();
        ctx.fillStyle =
          isAnom && stage >= 2
            ? stage >= 3
              ? 'rgba(179, 136, 235, 0.18)'
              : 'rgba(212, 163, 89, 0.18)'
            : 'rgba(195, 220, 255, 0.15)';
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, coreRadius * (isAnom ? 6.5 : 4.2) * pulse, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = isAnom ? 'rgba(243, 229, 171, 0.45)' : 'rgba(220, 235, 255, 0.35)';
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, coreRadius * 2.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Crisp star pinpoint
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, coreRadius, 0, Math.PI * 2);
        ctx.fill();

        // In Stage 4, Nadir-IX develops a tiny dark slit/pupil right inside its blazing core
        if (isAnom && stage >= 3) {
          ctx.fillStyle = '#040309';
          ctx.beginPath();
          ctx.ellipse(
            pt.x,
            pt.y,
            stage === 4 ? 2.2 : 1.1,
            stage === 4 ? 4.2 : 1.8,
            0,
            0,
            Math.PI * 2
          );
          ctx.fill();
        }
      }

      // =========================================================
      // STAGE 3 & 4: VAST CELESTIAL SILHOUETTE BEHIND CLOUDS
      // =========================================================
      if (stage >= 3) {
        const anomPt = starScreenCoords['NADIR_IX'] ?? {
          x: width * 0.54,
          y: height * 0.35,
        };
        ctx.save();
        ctx.strokeStyle =
          stage === 4
            ? 'rgba(155, 195, 182, 0.14)'
            : 'rgba(120, 145, 185, 0.08)';
        ctx.lineWidth = 1.5;
        for (let r = 1; r <= 4; r++) {
          ctx.beginPath();
          ctx.arc(
            anomPt.x,
            anomPt.y + r * 18,
            r * 68 + Math.sin(sim.time * 0.4 + r) * 5,
            Math.PI * 1.12,
            Math.PI * 1.88
          );
          ctx.stroke();
        }
        ctx.restore();
      }

      // =========================================================
      // LAYER 5: HIGH-ALTITUDE CLOUD LAYERS (FASTLAYERED ELLIPSES)
      // =========================================================
      ctx.save();
      for (const cl of clouds) {
        const dirMultiplier = stage === 4 ? -0.6 : 1;
        cl.x += cl.speed * simDt * dirMultiplier;
        if (cl.x > 1.25) cl.x = -0.25;
        if (cl.x < -0.25) cl.x = 1.25;

        const cx =
          cl.x * width - sim.camX * (45 * cl.depth) + shakeX * 0.5;
        const cy =
          cl.y * height - sim.camY * (24 * cl.depth) + shakeY * 0.5;

        ctx.fillStyle =
          stage === 4
            ? `rgba(20, 29, 46, ${cl.opacity * 0.55})`
            : `rgba(14, 24, 42, ${cl.opacity * 0.55})`;
        for (const lobe of cl.lobes) {
          ctx.beginPath();
          ctx.ellipse(cx + lobe.dx, cy + lobe.dy, lobe.rx, lobe.ry, 0, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.restore();

      // =========================================================
      // LAYER 6: ATMOSPHERIC HORIZON HAZE & PALE MOONLIGHT
      // =========================================================
      const horizonY = height * 0.75;
      const hazeGrad = ctx.createLinearGradient(0, horizonY - height * 0.22, 0, height);
      hazeGrad.addColorStop(0, 'rgba(15, 27, 49, 0)');
      hazeGrad.addColorStop(
        0.55,
        stage === 4
          ? 'rgba(34, 54, 66, 0.28)'
          : 'rgba(32, 52, 82, 0.25)'
      );
      hazeGrad.addColorStop(1, 'rgba(7, 11, 20, 0.85)');
      ctx.fillStyle = hazeGrad;
      ctx.fillRect(0, horizonY - height * 0.22, width, height * 0.48);

      // =========================================================
      // LAYER 7: DISTANT MOUNTAIN SILHOUETTES (3 PARALLAX PLANES)
      // =========================================================
      const drawMountainLayer = (
        baseYRatio: number,
        amp: number,
        freq: number,
        phase: number,
        parallax: number,
        fillColor: string,
        rimColor: string
      ) => {
        const px = -sim.camX * parallax + shakeX * 0.7;
        const py = -sim.camY * (parallax * 0.35) + shakeY * 0.7;
        ctx.beginPath();
        ctx.moveTo(0, height);
        const step = 18;
        for (let x = 0; x <= width + step; x += step) {
          const wx = x - px;
          const ridge =
            Math.sin(wx * freq + phase) * amp +
            Math.sin(wx * freq * 2.3 + phase * 1.7) * (amp * 0.42) +
            Math.cos(wx * freq * 5.1 - phase) * (amp * 0.16);
          const y = height * baseYRatio + ridge + py;
          ctx.lineTo(x, y);
        }
        ctx.lineTo(width, height);
        ctx.closePath();
        ctx.fillStyle = fillColor;
        ctx.fill();

        ctx.strokeStyle = rimColor;
        ctx.lineWidth = 1.1;
        ctx.stroke();
      };

      // Far range
      drawMountainLayer(
        0.76,
        34,
        0.0028,
        1.2,
        52,
        '#0c1526',
        'rgba(148, 178, 218, 0.15)'
      );
      // Mid alpine ridge
      drawMountainLayer(
        0.81,
        28,
        0.0038,
        3.4,
        74,
        '#080f1d',
        'rgba(120, 152, 195, 0.12)'
      );
      // Near valley crags
      drawMountainLayer(
        0.86,
        20,
        0.0052,
        5.1,
        96,
        '#050912',
        'rgba(88, 114, 150, 0.10)'
      );

      // =========================================================
      // LAYER 8 & 9: FOREGROUND OBSERVATORY ARCHITECTURE & LIGHTING
      // =========================================================
      const fgParallaxX = -sim.camX * 118 + shakeX;
      const fgParallaxY = -sim.camY * 32 + shakeY;

      ctx.save();
      ctx.translate(fgParallaxX, fgParallaxY);

      if (curScene === 'EAST_STATION') {
        // EAST CLIFFSIDE BASELINE PIER (+250m East)
        const pierX = width * 0.52;
        const pierY = height * 0.79;

        // Distant main dome silhouette on the West ridge
        const westDomeX = width * 0.18;
        const westDomeY = height * 0.755;
        ctx.fillStyle = '#060a14';
        ctx.beginPath();
        ctx.arc(westDomeX, westDomeY, 18, Math.PI, 0);
        ctx.fill();
        ctx.fillRect(westDomeX - 20, westDomeY, 40, 26);

        // Warm amber reference beacon on West Dome
        ctx.fillStyle = 'rgba(235, 178, 92, 0.25)';
        ctx.beginPath();
        ctx.arc(westDomeX + 12, westDomeY + 6, 14, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#f3c677';
        ctx.beginPath();
        ctx.arc(westDomeX + 12, westDomeY + 6, 3, 0, Math.PI * 2);
        ctx.fill();

        // East Cliff Granite Promontory
        ctx.fillStyle = '#04070e';
        ctx.beginPath();
        ctx.moveTo(width * 0.25, height * 1.05);
        ctx.lineTo(width * 0.36, pierY + 22);
        ctx.lineTo(width * 0.74, pierY + 14);
        ctx.lineTo(width * 0.88, height * 1.05);
        ctx.closePath();
        ctx.fill();

        // Iron railing along cliff walkway
        ctx.strokeStyle = 'rgba(130, 152, 185, 0.28)';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(width * 0.37, pierY + 10);
        ctx.lineTo(width * 0.72, pierY + 4);
        ctx.stroke();
        for (let rx = width * 0.38; rx <= width * 0.71; rx += 24) {
          ctx.beginPath();
          ctx.moveTo(rx, pierY + 20);
          ctx.lineTo(rx, pierY + 6);
          ctx.stroke();
        }

        // East Transit Pier Stone Plinth & Brass Equatorial Telescope
        ctx.fillStyle = '#0a101d';
        ctx.strokeStyle = 'rgba(165, 190, 225, 0.25)';
        ctx.fillRect(pierX - 24, pierY - 22, 48, 40);
        ctx.strokeRect(pierX - 24, pierY - 22, 48, 40);

        // Telescope tube angled toward Cygnus-Lacerta
        ctx.save();
        ctx.translate(pierX, pierY - 26);
        ctx.rotate(-0.58);
        ctx.fillStyle = '#2d2419';
        ctx.strokeStyle = '#d4a359';
        ctx.lineWidth = 1.6;
        ctx.fillRect(-32, -5, 68, 10);
        ctx.strokeRect(-32, -5, 68, 10);
        ctx.restore();

        // Survey Baseline Marker (+250m)
        ctx.fillStyle = '#0b1220';
        ctx.fillRect(width * 0.64, pierY - 12, 12, 28);
      } else {
        // MAIN NADIR OBSERVATORY PLATEAU (Title & Exterior Deck)
        const obsX = width * 0.48;
        const obsY = height * 0.77;

        // Foreground mountain plateau silhouette
        ctx.fillStyle = '#04070f';
        ctx.beginPath();
        ctx.moveTo(-width * 0.2, height * 1.05);
        ctx.lineTo(width * 0.15, obsY + 45);
        ctx.lineTo(obsX - 160, obsY + 18);
        ctx.lineTo(obsX + 185, obsY + 16);
        ctx.lineTo(width * 0.86, obsY + 38);
        ctx.lineTo(width * 1.2, height * 1.05);
        ctx.closePath();
        ctx.fill();

        // Main Observatory Stone Rotunda & Chart Room Wing
        ctx.fillStyle = '#080e1a';
        ctx.strokeStyle = 'rgba(155, 180, 215, 0.22)';
        ctx.lineWidth = 1.2;

        // Left West Pier Annex
        ctx.fillRect(obsX - 115, obsY - 18, 56, 36);
        ctx.strokeRect(obsX - 115, obsY - 18, 56, 36);

        // West Pier Brass Telescope Tube extending from open annex roof
        ctx.save();
        ctx.translate(obsX - 88, obsY - 22);
        ctx.rotate(-0.62);
        ctx.fillStyle = '#1f1a14';
        ctx.strokeStyle = 'rgba(212, 163, 89, 0.65)';
        ctx.lineWidth = 1.5;
        ctx.fillRect(-26, -4.5, 58, 9);
        ctx.strokeRect(-26, -4.5, 58, 9);
        ctx.restore();

        // Central Copper-Ribbed Astrometric Dome
        ctx.fillStyle = '#0a1222';
        ctx.beginPath();
        ctx.arc(obsX - 12, obsY - 22, 46, Math.PI, 0);
        ctx.fill();
        ctx.stroke();

        // Open observatory dome slit revealing inner warm brass glow
        ctx.fillStyle = '#141c2b';
        ctx.beginPath();
        ctx.moveTo(obsX - 20, obsY - 67);
        ctx.lineTo(obsX - 4, obsY - 67);
        ctx.lineTo(obsX - 2, obsY - 22);
        ctx.lineTo(obsX - 22, obsY - 22);
        ctx.closePath();
        ctx.fill();

        // Rotunda lower masonry cylinder
        ctx.fillStyle = '#070c18';
        ctx.fillRect(obsX - 58, obsY - 22, 92, 40);
        ctx.strokeRect(obsX - 58, obsY - 22, 92, 40);

        // Right Wing: Chart Room Masonry & Warm Amber Arched Window
        ctx.fillRect(obsX + 34, obsY - 16, 68, 34);
        ctx.strokeRect(obsX + 34, obsY - 16, 68, 34);

        // Layer 9: Restrained Warm Amber Lantern Light from Chart Room Window
        const winX = obsX + 68;
        const winY = obsY - 2;
        ctx.fillStyle = 'rgba(212, 152, 68, 0.22)';
        ctx.beginPath();
        ctx.arc(winX, winY, 28, 0, Math.PI * 2);
        ctx.fill();

        // Window pane frame
        ctx.fillStyle = '#f3c677';
        ctx.beginPath();
        ctx.arc(winX, winY - 3, 5, Math.PI, 0);
        ctx.fillRect(winX - 5, winY - 3, 10, 9);
        ctx.fill();

        // Meridian Plumb-Line Pillar & East Walkway Lanterns
        const pillarX = obsX + 128;
        const pillarY = obsY + 2;
        ctx.fillStyle = '#0b1324';
        ctx.fillRect(pillarX - 7, pillarY - 18, 14, 34);
        ctx.strokeRect(pillarX - 7, pillarY - 18, 14, 34);
      }
      ctx.restore();

      // =========================================================
      // LAYER 10: SUBTLE ENVIRONMENTAL PARTICLES (HIGH-ALTITUDE FROST)
      // =========================================================
      ctx.save();
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.vx * simDt;
        p.y += p.vy * simDt;
        if (p.x < 0) p.x += 1;
        if (p.y < 0) p.y += 1;
        if (p.y > 1) p.y -= 1;

        const px = p.x * width;
        const py = p.y * height;
        const flicker = 0.6 + 0.4 * Math.sin(sim.time * 1.5 + p.phase);
        ctx.fillStyle =
          stage === 4 ? 'rgba(179, 136, 235, 0.4)' : 'rgba(205, 224, 255, 0.35)';
        ctx.globalAlpha = p.alpha * flicker;
        ctx.beginPath();
        ctx.arc(px, py, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      // Adaptive frame scheduling: fast 25ms tick during active movement/input, 220ms tick when settled
      const isActivelyMoving =
        sim.isDragging ||
        sim.keysHeld.size > 0 ||
        sim.trauma > 0.01 ||
        Math.abs(desiredX - sim.camX) > 0.004 ||
        Math.abs(desiredY - sim.camY) > 0.004;

      if (!isDisposed) {
        timerId = setTimeout(
          () => {
            if (!isDisposed) {
              renderFrame(performance.now());
            }
          },
          isActivelyMoving ? 25 : 220
        );
      }
    };

    renderFrame(performance.now());

    return () => {
      isDisposed = true;
      if (timerId !== null) clearTimeout(timerId);
      cancelAnimationFrame(rafId);
      resizeObserver.disconnect();
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', clearInputs);
    };
  }, []);

  // Pointer drag/parallax handler on the canvas
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    simRef.current.isDragging = true;
    simRef.current.dragLastX = e.clientX;
    simRef.current.dragLastY = e.clientY;
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    if (simRef.current.isDragging) {
      const dx = (e.clientX - simRef.current.dragLastX) / Math.max(300, rect.width);
      const dy = (e.clientY - simRef.current.dragLastY) / Math.max(300, rect.height);
      simRef.current.dragLastX = e.clientX;
      simRef.current.dragLastY = e.clientY;
      const nextX = Math.max(-1, Math.min(1, stateRef.current.cameraTargetOffset.x - dx * 2.2));
      const nextY = Math.max(-0.6, Math.min(0.6, stateRef.current.cameraTargetOffset.y - dy * 1.8));
      stateRef.current.onCameraMove?.({ x: nextX, y: nextY });
    } else if (stateRef.current.scene === 'TITLE') {
      // Gentle cursor parallax on title screen
      const nx = ((e.clientX - rect.left) / Math.max(1, rect.width) - 0.5) * 0.5;
      const ny = ((e.clientY - rect.top) / Math.max(1, rect.height) - 0.5) * 0.35;
      stateRef.current.onCameraMove?.({ x: nx, y: ny });
    }
  };

  const handlePointerUp = () => {
    simRef.current.isDragging = false;
  };

  return (
    <canvas
      ref={canvasRef}
      data-testid="living-sky-canvas"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      className="fixed inset-0 w-full h-full block cursor-grab active:cursor-grabbing"
    />
  );
};
