import React, { useEffect, useRef } from 'react';
import {
  CATALOG_STARS,
  WORLD_HOTSPOTS,
  getObservedStarPosition,
  findNearbyHotspot,
  type CosmicStage,
  type SceneId,
  type StationId,
  type WorldHotspot,
} from '../game/astronomyLogic';
import { soundEngine } from '../game/soundEngine';

interface BgStar {
  x: number;
  y: number;
  radius: number;
  baseAlpha: number;
  twinkleSpeed: number;
  twinklePhase: number;
  depthLayer: 0 | 1 | 2;
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
  playerX: number;
  playerFacing: 'left' | 'right';
  onPlayerMove?: (nextX: number, facing: 'left' | 'right') => void;
  onHotspotInteract?: (hotspot: WorldHotspot) => void;
  cameraTargetOffset: { x: number; y: number };
  onCameraMove?: (offset: { x: number; y: number }) => void;
  traumaTrigger?: number;
}

/**
 * Chroma-keys out the dark background (#070d19) of the generated character sprite sheet
 * into an offscreen transparent canvas so Dr. Vance renders seamlessly over any painted surface.
 */
function createChromaKeyedSpriteCanvas(img: HTMLImageElement): HTMLCanvasElement {
  const off = document.createElement('canvas');
  const w = img.naturalWidth || 512;
  const h = img.naturalHeight || 512;
  off.width = w;
  off.height = h;
  const octx = off.getContext('2d');
  if (!octx) return off;

  octx.drawImage(img, 0, 0, w, h);
  try {
    const imgData = octx.getImageData(0, 0, w, h);
    const data = imgData.data;
    const bgR = data[0];
    const bgG = data[1];
    const bgB = data[2];

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const diff = Math.hypot(r - bgR, g - bgG, b - bgB);
      const luma = 0.299 * r + 0.587 * g + 0.114 * b;

      if (diff < 24 && luma < 34) {
        data[i + 3] = 0;
      } else if (diff < 42 && luma < 48) {
        data[i + 3] = Math.floor(((diff - 24) / 18) * 255);
      }
    }
    octx.putImageData(imgData, 0, 0);
  } catch {
    // Fallback if canvas taint occurs
  }
  return off;
}

/**
 * Smoothly feathers the upper sky portion of an environment painting into alpha transparency
 * so the painted mountains, observatory dome, and brass instruments composite into the live
 * multi-plane sky with zero horizontal seam line.
 */
function createFeatheredLandscapeCanvas(img: HTMLImageElement): HTMLCanvasElement {
  const off = document.createElement('canvas');
  const w = img.naturalWidth || 1280;
  const h = img.naturalHeight || 720;
  off.width = w;
  off.height = h;
  const octx = off.getContext('2d');
  if (!octx) return off;

  octx.drawImage(img, 0, 0, w, h);
  try {
    const imgData = octx.getImageData(0, 0, w, h);
    const data = imgData.data;

    for (let y = 0; y < h; y++) {
      const normY = y / h;
      if (normY >= 0.68) continue; // Keep lower 32% (mountains, observatory, walkway) 100% opaque

      let baseFade = 0;
      if (normY > 0.22) {
        const t = (normY - 0.22) / (0.68 - 0.22);
        baseFade = t * t * (3 - 2 * t); // Smoothstep
      }

      const rowOffset = y * w * 4;
      for (let x = 0; x < w; x++) {
        const idx = rowOffset + x * 4;
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];
        // Warm amber window/brass details or solid silhouette structures preserve higher opacity
        const warmth = Math.max(0, r - b * 0.75) / 255;
        const alpha = Math.min(1, baseFade + warmth * 0.45 * baseFade);
        data[idx + 3] = Math.floor(alpha * 255);
      }
    }
    octx.putImageData(imgData, 0, 0);
  } catch {
    // Fallback if canvas taint occurs
  }
  return off;
}

export const LivingSkyCanvas: React.FC<LivingSkyCanvasProps> = ({
  scene,
  station,
  cosmicStage,
  isPaused,
  playerX,
  playerFacing,
  onPlayerMove,
  onHotspotInteract,
  cameraTargetOffset,
  onCameraMove,
  traumaTrigger = 0,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const stateRef = useRef({
    scene,
    station,
    cosmicStage,
    isPaused,
    playerX,
    playerFacing,
    onPlayerMove,
    onHotspotInteract,
    cameraTargetOffset,
    onCameraMove,
  });

  useEffect(() => {
    stateRef.current = {
      scene,
      station,
      cosmicStage,
      isPaused,
      playerX,
      playerFacing,
      onPlayerMove,
      onHotspotInteract,
      cameraTargetOffset,
      onCameraMove,
    };
  }, [
    scene,
    station,
    cosmicStage,
    isPaused,
    playerX,
    playerFacing,
    onPlayerMove,
    onHotspotInteract,
    cameraTargetOffset,
    onCameraMove,
  ]);

  const simRef = useRef({
    camX: 0,
    camY: 0,
    trauma: 0,
    hitstop: 0,
    time: 0,
    isDragging: false,
    dragStartX: 0,
    dragStartY: 0,
    dragLastX: 0,
    dragLastY: 0,
    pointerMovedDistance: 0,
    keysHeld: new Set<string>(),
    charX: playerX,
    targetWalkX: null as number | null,
    pendingHotspot: null as WorldHotspot | null,
    isWalking: false,
    walkCycleTime: 0,
    interactPulseTime: 0,
    facing: playerFacing,
  });

  // Sync external playerX changes (e.g. clicking a station pill or traversing scenes)
  useEffect(() => {
    if (Math.abs(simRef.current.charX - playerX) > 0.01) {
      simRef.current.charX = playerX;
      simRef.current.targetWalkX = null;
      simRef.current.pendingHotspot = null;
    }
    simRef.current.facing = playerFacing;
  }, [playerX, playerFacing, scene]);

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

    const assets: {
      skyNebula: HTMLCanvasElement | null;
      revelationSky: HTMLCanvasElement | null;
      westObservatory: HTMLCanvasElement | null;
      eastPier: HTMLCanvasElement | null;
      vanceSprite: HTMLCanvasElement | null;
    } = {
      skyNebula: null,
      revelationSky: null,
      westObservatory: null,
      eastPier: null,
      vanceSprite: null,
    };

    const toOffscreenSkyCanvas = (img: HTMLImageElement): HTMLCanvasElement => {
      const off = document.createElement('canvas');
      off.width = Math.min(1280, img.naturalWidth || 1280);
      off.height = Math.min(720, img.naturalHeight || 720);
      const octx = off.getContext('2d');
      octx?.drawImage(img, 0, 0, off.width, off.height);
      return off;
    };

    const loadImg = (src: string, onLoad: (img: HTMLImageElement) => void) => {
      const img = new Image();
      img.decoding = 'async';
      img.onload = () => onLoad(img);
      img.src = src;
    };

    loadImg('/src/assets/images/painted_sky_nebula_1793506262807.jpg', (img) => {
      assets.skyNebula = toOffscreenSkyCanvas(img);
    });
    loadImg('/src/assets/images/cosmic_revelation_sky_1793506266973.jpg', (img) => {
      assets.revelationSky = toOffscreenSkyCanvas(img);
    });
    loadImg('/src/assets/images/master_nadir_observatory_1793506260866.jpg', (img) => {
      assets.westObservatory = createFeatheredLandscapeCanvas(img);
    });
    loadImg('/src/assets/images/east_cliffside_pier_1793506265480.jpg', (img) => {
      assets.eastPier = createFeatheredLandscapeCanvas(img);
    });
    loadImg('/src/assets/images/dr_vance_character_sheet_1793506265433.jpg', (img) => {
      assets.vanceSprite = createChromaKeyedSpriteCanvas(img);
    });

    let seed = 19261031;
    const rand = () => {
      seed = (seed * 1664525 + 1013904223) % 4294967296;
      return seed / 4294967296;
    };

    const starPalette = ['#dce8ff', '#e8eef9', '#cbd9f0', '#f4e7d3', '#b8cde8'];
    const bgStars: BgStar[] = Array.from({ length: 420 }, (_, i) => {
      const depthLayer = (i < 240 ? 0 : i < 360 ? 1 : 2) as 0 | 1 | 2;
      return {
        x: rand() * 1.4 - 0.2,
        y: rand() * 0.76,
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

    const clouds: CloudBand[] = Array.from({ length: 11 }, (_, i) => {
      const lobes = Array.from({ length: 5 }, () => ({
        dx: (rand() - 0.5) * 220,
        dy: (rand() - 0.5) * 26,
        rx: 70 + rand() * 110,
        ry: 14 + rand() * 22,
      }));
      return {
        x: (i / 11) * 1.3 - 0.15,
        y: 0.16 + rand() * 0.5,
        width: 240 + rand() * 220,
        height: 32 + rand() * 28,
        speed: (0.0022 + rand() * 0.0035) * (i % 2 === 0 ? 1 : -0.7),
        depth: 0.35 + (i % 3) * 0.22,
        opacity: 0.14 + rand() * 0.16,
        lobes,
      };
    });

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

    const onKeyDown = (e: KeyboardEvent) => {
      if (
        [
          'ArrowLeft',
          'ArrowRight',
          'ArrowUp',
          'ArrowDown',
          'KeyA',
          'KeyD',
          'KeyW',
          'KeyS',
        ].includes(e.code)
      ) {
        simRef.current.keysHeld.add(e.code);
        if (
          e.code === 'ArrowLeft' ||
          e.code === 'KeyA' ||
          e.code === 'ArrowRight' ||
          e.code === 'KeyD'
        ) {
          simRef.current.targetWalkX = null;
          simRef.current.pendingHotspot = null;
        }
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
      const dt = Math.min(rawDt, 0.05);

      const {
        scene: curScene,
        station: curStation,
        cosmicStage: stage,
        isPaused: paused,
        onPlayerMove: reportPlayerMove,
        onHotspotInteract: triggerHotspot,
        cameraTargetOffset: targetOffset,
        onCameraMove: reportCam,
      } = stateRef.current;

      const sim = simRef.current;

      if (sim.hitstop > 0) {
        sim.hitstop = Math.max(0, sim.hitstop - dt);
      }
      if (sim.trauma > 0) {
        sim.trauma = Math.max(0, sim.trauma - dt * 0.55);
      }
      if (sim.interactPulseTime > 0) {
        sim.interactPulseTime = Math.max(0, sim.interactPulseTime - dt);
      }

      const simDt = paused || sim.hitstop > 0 ? 0 : dt;
      sim.time += simDt;

      // =========================================================
      // PLAYABLE PROTAGONIST MOVEMENT (DR. E. VANCE) & CAMERA FOLLOW
      // =========================================================
      const isDeckScene = curScene === 'EXTERIOR_DECK' || curScene === 'EAST_STATION';
      let walkDir = 0;
      if (isDeckScene && !paused) {
        if (sim.keysHeld.has('ArrowLeft') || sim.keysHeld.has('KeyA')) walkDir -= 1;
        if (sim.keysHeld.has('ArrowRight') || sim.keysHeld.has('KeyD')) walkDir += 1;

        const walkSpeed = 0.32;
        if (walkDir !== 0) {
          sim.facing = walkDir < 0 ? 'left' : 'right';
          sim.charX = Math.max(0.14, Math.min(0.86, sim.charX + walkDir * walkSpeed * simDt));
          sim.isWalking = true;
          sim.walkCycleTime += simDt * 8.0;
          soundEngine.playFootstep();
          reportPlayerMove?.(Number(sim.charX.toFixed(4)), sim.facing);
        } else if (sim.targetWalkX !== null) {
          const diff = sim.targetWalkX - sim.charX;
          if (Math.abs(diff) > 0.015) {
            const stepDir = diff > 0 ? 1 : -1;
            sim.facing = stepDir < 0 ? 'left' : 'right';
            const step = Math.min(Math.abs(diff), walkSpeed * simDt);
            sim.charX = Math.max(0.14, Math.min(0.86, sim.charX + stepDir * step));
            sim.isWalking = true;
            sim.walkCycleTime += simDt * 8.0;
            soundEngine.playFootstep();
            reportPlayerMove?.(Number(sim.charX.toFixed(4)), sim.facing);
          } else {
            sim.charX = sim.targetWalkX;
            sim.targetWalkX = null;
            sim.isWalking = false;
            reportPlayerMove?.(Number(sim.charX.toFixed(4)), sim.facing);
            if (sim.pendingHotspot) {
              const hs = sim.pendingHotspot;
              sim.pendingHotspot = null;
              sim.interactPulseTime = 0.45;
              triggerHotspot?.(hs);
            }
          }
        } else {
          sim.isWalking = false;
        }

        let keyDy = 0;
        if (sim.keysHeld.has('ArrowUp') || sim.keysHeld.has('KeyW')) keyDy -= 1;
        if (sim.keysHeld.has('ArrowDown') || sim.keysHeld.has('KeyS')) keyDy += 1;
        if (keyDy !== 0) {
          targetOffset.y = Math.max(-0.55, Math.min(0.55, targetOffset.y + keyDy * 0.42 * simDt));
          reportCam?.({ x: targetOffset.x, y: targetOffset.y });
        }
      } else {
        sim.isWalking = false;
      }

      const charCamBias = isDeckScene ? (sim.charX - 0.5) * 0.75 : 0;
      let desiredX = Math.max(-1, Math.min(1, charCamBias + targetOffset.x));
      let desiredY = targetOffset.y;
      if (curScene === 'TITLE') {
        desiredX = targetOffset.x * 0.6;
        desiredY = targetOffset.y * 0.4;
      }

      const damp = 1 - Math.exp(-12.0 * dt);
      sim.camX += (desiredX - sim.camX) * damp;
      sim.camY += (desiredY - sim.camY) * damp;
      if (Math.abs(desiredX - sim.camX) < 0.012) sim.camX = desiredX;
      if (Math.abs(desiredY - sim.camY) < 0.012) sim.camY = desiredY;

      const shakeMag = sim.trauma * sim.trauma * 14;
      const shakeX = shakeMag * Math.sin(now * 0.047);
      const shakeY = shakeMag * Math.cos(now * 0.063);

      // =========================================================
      // LAYER 1: PAINTED DEEP-SPACE BACKGROUND & STAGE IV REVELATION SKY
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
        skyGrad.addColorStop(0, '#060412');
        skyGrad.addColorStop(0.38, '#110d26');
        skyGrad.addColorStop(0.72, '#13222e');
        skyGrad.addColorStop(1, '#0e1722');
      }
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, width, height);

      if (assets.skyNebula) {
        ctx.save();
        ctx.globalAlpha = stage === 4 ? 0.38 : 0.62;
        const skyPanX = -sim.camX * 26 + shakeX * 0.2;
        const skyPanY = -sim.camY * 16 + shakeY * 0.2;
        ctx.drawImage(
          assets.skyNebula,
          -width * 0.08 + skyPanX,
          -height * 0.04 + skyPanY,
          width * 1.16,
          height * 0.96
        );
        ctx.restore();
      }

      if (stage >= 3 && assets.revelationSky) {
        ctx.save();
        ctx.globalAlpha = stage === 4 ? 0.66 : 0.25;
        const revPanX = stage === 4 ? 0 : -sim.camX * 14;
        const revPanY = stage === 4 ? 0 : -sim.camY * 10;
        ctx.drawImage(
          assets.revelationSky,
          -width * 0.05 + revPanX,
          -height * 0.04 + revPanY,
          width * 1.1,
          height * 0.92
        );
        ctx.restore();
      }

      // =========================================================
      // LAYER 2: SLOWLY DRIFTING NEBULA WASHES
      // =========================================================
      ctx.save();
      const nebParallaxX = -sim.camX * 22 + shakeX * 0.2;
      const nebParallaxY = -sim.camY * 14 + shakeY * 0.2;
      const nebDrift = Math.sin(sim.time * 0.03) * 18;

      const nebGrad1 = ctx.createRadialGradient(
        width * 0.48 + nebParallaxX + nebDrift,
        height * 0.32 + nebParallaxY,
        10,
        width * 0.48 + nebParallaxX + nebDrift,
        height * 0.32 + nebParallaxY,
        Math.max(width, height) * 0.45
      );
      if (stage < 3) {
        nebGrad1.addColorStop(0, 'rgba(44, 72, 118, 0.20)');
        nebGrad1.addColorStop(0.5, 'rgba(26, 45, 82, 0.10)');
        nebGrad1.addColorStop(1, 'rgba(5, 8, 17, 0)');
      } else {
        nebGrad1.addColorStop(0, 'rgba(98, 62, 152, 0.24)');
        nebGrad1.addColorStop(0.45, 'rgba(46, 102, 108, 0.14)');
        nebGrad1.addColorStop(1, 'rgba(5, 8, 17, 0)');
      }
      ctx.fillStyle = nebGrad1;
      ctx.fillRect(0, 0, width, height * 0.85);
      ctx.restore();

      // =========================================================
      // LAYER 3: MULTI-PLANE STARFIELD & CATALOG STARS
      // =========================================================
      const depthMultipliers = [14, 28, 46];
      for (let i = 0; i < bgStars.length; i++) {
        const s = bgStars[i];
        if (stage >= 3 && s.vanishesInStage3) continue;

        const pMult = depthMultipliers[s.depthLayer];
        const sx = (s.x * width - sim.camX * pMult + shakeX * 0.3) % (width * 1.3);
        const wrappedX = sx < -width * 0.15 ? sx + width * 1.3 : sx;
        const sy = s.y * height - sim.camY * (pMult * 0.65) + shakeY * 0.3;

        if (sy < 0 || sy > height * 0.80) continue;

        const twinkle = 0.72 + 0.28 * Math.sin(sim.time * s.twinkleSpeed + s.twinklePhase);
        const alpha = Math.max(0.08, Math.min(1, s.baseAlpha * twinkle));

        ctx.fillStyle = s.color;
        ctx.globalAlpha = alpha;
        ctx.beginPath();
        ctx.arc(wrappedX, sy, s.radius, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      const starScreenCoords: Record<string, { x: number; y: number }> = {};
      const catalogParallax = 38;

      for (const cStar of CATALOG_STARS) {
        const pos = getObservedStarPosition(cStar, curStation);
        let screenX = pos.x * width - sim.camX * catalogParallax + shakeX * 0.4;
        let screenY = pos.y * height - sim.camY * (catalogParallax * 0.7) + shakeY * 0.4;

        if (cStar.isAnomaly) {
          if (stage === 2) {
            screenX = pos.x * width + sim.camX * (catalogParallax * 0.65);
            screenY = pos.y * height + sim.camY * (catalogParallax * 0.45);
          } else if (stage === 3) {
            screenX = pos.x * width + sim.camX * (catalogParallax * 1.1);
            screenY = pos.y * height + sim.camY * (catalogParallax * 0.8);
          } else if (stage === 4) {
            screenX = 0.54 * width;
            screenY = 0.32 * height;
          }
        }

        starScreenCoords[cStar.id] = { x: screenX, y: screenY };
      }

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
        ctx.strokeStyle =
          stage === 4 ? 'rgba(179, 136, 235, 0.34)' : 'rgba(168, 185, 225, 0.22)';
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
            ctx.strokeStyle = 'rgba(130, 210, 185, 0.32)';
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

            ctx.strokeStyle = 'rgba(212, 163, 89, 0.28)';
            ctx.beginPath();
            ctx.arc(hub.x, hub.y, 44, 0, Math.PI * 2);
            ctx.stroke();
          }
        }
      }
      ctx.restore();

      for (const cStar of CATALOG_STARS) {
        const pt = starScreenCoords[cStar.id];
        if (!pt) continue;

        const isAnom = cStar.isAnomaly;
        const pulse =
          0.85 + 0.15 * Math.sin(sim.time * (isAnom ? 2.4 : 1.3) + pt.x * 0.01);
        const coreRadius = Math.max(2.0, (6.2 - cStar.magnitude) * 0.75);

        ctx.save();
        ctx.fillStyle =
          isAnom && stage >= 2
            ? stage >= 3
              ? 'rgba(179, 136, 235, 0.22)'
              : 'rgba(212, 163, 89, 0.22)'
            : 'rgba(195, 220, 255, 0.15)';
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, coreRadius * (isAnom ? 6.5 : 4.2) * pulse, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = isAnom ? 'rgba(243, 229, 171, 0.5)' : 'rgba(220, 235, 255, 0.35)';
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, coreRadius * 2.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, coreRadius, 0, Math.PI * 2);
        ctx.fill();

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
      // LAYER 4: HIGH-ALTITUDE NOCTURNAL CLOUDS
      // =========================================================
      ctx.save();
      for (const cl of clouds) {
        const dirMultiplier = stage === 4 ? -0.6 : 1;
        cl.x += cl.speed * simDt * dirMultiplier;
        if (cl.x > 1.25) cl.x = -0.25;
        if (cl.x < -0.25) cl.x = 1.25;

        const cx = cl.x * width - sim.camX * (45 * cl.depth) + shakeX * 0.5;
        const cy = cl.y * height - sim.camY * (24 * cl.depth) + shakeY * 0.5;

        ctx.fillStyle =
          stage === 4
            ? `rgba(20, 29, 46, ${cl.opacity * 0.45})`
            : `rgba(14, 24, 42, ${cl.opacity * 0.45})`;
        for (const lobe of cl.lobes) {
          ctx.beginPath();
          ctx.ellipse(cx + lobe.dx, cy + lobe.dy, lobe.rx, lobe.ry, 0, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.restore();

      // =========================================================
      // LAYER 5–7: MULTI-PLANE MOUNTAIN RIDGES & HORIZON MIST
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

      drawMountainLayer(
        0.73,
        34,
        0.0028,
        1.2,
        52,
        '#0b1424',
        'rgba(148, 178, 218, 0.15)'
      );
      drawMountainLayer(
        0.78,
        26,
        0.0038,
        3.4,
        74,
        '#070e1b',
        'rgba(120, 152, 195, 0.12)'
      );

      // =========================================================
      // LAYER 8: PAINTED OBSERVATORY ARCHITECTURE & PLATEAU ARTWORK (SEAMLESS FEATHERED)
      // =========================================================
      const fgParallaxX = -sim.camX * 88 + shakeX;
      const fgParallaxY = -sim.camY * 24 + shakeY;

      const activePainting =
        curScene === 'EAST_STATION' ? assets.eastPier : assets.westObservatory;

      if (activePainting) {
        ctx.save();
        const paintW = width * 1.14;
        const paintH = height * 1.06;
        const paintX = -width * 0.07 + fgParallaxX * 0.65;
        const paintY = -height * 0.02 + fgParallaxY * 0.55;
        ctx.drawImage(activePainting, paintX, paintY, paintW, paintH);
        ctx.restore();
      }

      // =========================================================
      // LAYER 9 & 10: WALKABLE GRANITE TERRACE & IN-WORLD INSTRUMENT PROPS
      // =========================================================
      const walkDeckY = height * 0.84 + fgParallaxY * 0.7;

      ctx.save();
      const deckGrad = ctx.createLinearGradient(0, walkDeckY - 18, 0, height);
      deckGrad.addColorStop(0, 'rgba(7, 12, 23, 0)');
      deckGrad.addColorStop(0.28, 'rgba(7, 12, 23, 0.88)');
      deckGrad.addColorStop(1, '#03060c');
      ctx.fillStyle = deckGrad;
      ctx.fillRect(0, walkDeckY - 18, width, height - walkDeckY + 24);

      ctx.strokeStyle = 'rgba(155, 182, 220, 0.22)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(width * 0.08 + fgParallaxX * 0.4, walkDeckY - 4);
      ctx.lineTo(width * 0.92 + fgParallaxX * 0.4, walkDeckY - 4);
      ctx.stroke();

      // Render delicate diegetic brass astrometric markers & proximity prompts at hotspot positions
      if (isDeckScene) {
        const sceneHotspots = WORLD_HOTSPOTS.filter((h) => h.scene === curScene);
        const nearbyHotspot = findNearbyHotspot(curScene, sim.charX);

        for (const hs of sceneHotspots) {
          const hx = hs.x * width + fgParallaxX * 0.45;
          const hy = walkDeckY - 6;
          const isNear = nearbyHotspot?.id === hs.id;

          // Subtle ground lantern glow at each interactive station
          const spotGlow = ctx.createRadialGradient(hx, hy - 14, 2, hx, hy - 14, isNear ? 34 : 20);
          spotGlow.addColorStop(
            0,
            isNear ? 'rgba(243, 215, 148, 0.38)' : 'rgba(212, 163, 89, 0.18)'
          );
          spotGlow.addColorStop(1, 'rgba(9, 15, 29, 0)');
          ctx.fillStyle = spotGlow;
          ctx.beginPath();
          ctx.arc(hx, hy - 14, isNear ? 34 : 20, 0, Math.PI * 2);
          ctx.fill();

          // Delicate brass astrometric diamond reticle pin
          const pinY = hy - 26 + Math.sin(sim.time * 2.4 + hs.x * 6) * 2;
          ctx.save();
          ctx.translate(hx, pinY);
          ctx.rotate(Math.PI / 4);
          ctx.strokeStyle = isNear ? '#f3e5ab' : 'rgba(212, 163, 89, 0.75)';
          ctx.fillStyle = isNear ? '#d4a359' : 'rgba(12, 20, 36, 0.85)';
          ctx.lineWidth = isNear ? 1.6 : 1.1;
          const dSize = isNear ? 6.5 : 4.5;
          ctx.fillRect(-dSize / 2, -dSize / 2, dSize, dSize);
          ctx.strokeRect(-dSize / 2, -dSize / 2, dSize, dSize);
          ctx.restore();

          // Floating diegetic world proximity prompt above nearby station
          const promptY = hy - 48 + Math.sin(sim.time * 2.4 + hs.x * 6) * 2;
          if (isNear) {
            const boxW = 212;
            const boxH = 36;
            ctx.fillStyle = 'rgba(7, 12, 24, 0.92)';
            ctx.strokeStyle = '#d4a359';
            ctx.lineWidth = 1.4;
            ctx.beginPath();
            ctx.roundRect(hx - boxW / 2, promptY - boxH, boxW, boxH, 5);
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = '#f3e5ab';
            ctx.font = '600 11px "JetBrains Mono", monospace';
            ctx.textAlign = 'center';
            ctx.fillText(`[E] ${hs.actionLabel.toUpperCase()}`, hx, promptY - 20);

            ctx.fillStyle = '#94a3b8';
            ctx.font = '10px "JetBrains Mono", monospace';
            ctx.fillText(hs.shortTag, hx, promptY - 6);
          }
        }
      }
      ctx.restore();

      // =========================================================
      // LAYER 11: PLAYABLE PROTAGONIST — DR. E. VANCE (SPRITE + LANTERN)
      // =========================================================
      if (isDeckScene) {
        const charScreenX = sim.charX * width + fgParallaxX * 0.45;
        const charFootY = walkDeckY + 2;
        const charHeight = Math.max(70, Math.min(98, height * 0.102));
        const charWidth = charHeight * 0.62;

        ctx.save();
        const lanternX = charScreenX + (sim.facing === 'right' ? 14 : -14);
        const lanternY = charFootY - charHeight * 0.48;
        const lanternPool = ctx.createRadialGradient(
          lanternX,
          lanternY,
          2,
          lanternX,
          lanternY,
          charHeight * 1.15
        );
        lanternPool.addColorStop(0, 'rgba(243, 212, 138, 0.36)');
        lanternPool.addColorStop(0.45, 'rgba(212, 152, 68, 0.15)');
        lanternPool.addColorStop(1, 'rgba(9, 15, 29, 0)');
        ctx.fillStyle = lanternPool;
        ctx.beginPath();
        ctx.arc(lanternX, lanternY, charHeight * 1.15, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = 'rgba(2, 4, 9, 0.75)';
        ctx.beginPath();
        ctx.ellipse(charScreenX, charFootY, charWidth * 0.36, 5, 0, 0, Math.PI * 2);
        ctx.fill();

        if (assets.vanceSprite) {
          const sw = assets.vanceSprite.width;
          const sh = assets.vanceSprite.height;

          let sx = 0;
          let sy = 0;
          let sWidth = sw * 0.19;
          let sHeight = sh * 0.45;

          if (sim.isWalking) {
            const frameIdx = Math.floor(sim.walkCycleTime) % 5;
            sx = frameIdx * (sw / 5) + sw * 0.015;
            sy = sh * 0.52;
            sWidth = sw * 0.17;
            sHeight = sh * 0.45;
          } else if (sim.interactPulseTime > 0) {
            sx = sw * 0.04;
            sy = sh * 0.04;
            sWidth = sw * 0.19;
            sHeight = sh * 0.44;
          } else {
            sx = sw * 0.285;
            sy = sh * 0.04;
            sWidth = sw * 0.19;
            sHeight = sh * 0.44;
          }

          const bobY = sim.isWalking
            ? Math.abs(Math.sin(sim.walkCycleTime * Math.PI)) * 2.5
            : Math.sin(sim.time * 2.1) * 1.2;

          ctx.save();
          ctx.translate(charScreenX, charFootY - bobY);
          if (sim.facing === 'left') {
            ctx.scale(-1, 1);
          }
          ctx.drawImage(
            assets.vanceSprite,
            sx,
            sy,
            sWidth,
            sHeight,
            -charWidth / 2,
            -charHeight,
            charWidth,
            charHeight
          );
          ctx.restore();
        } else {
          ctx.fillStyle = '#0d1524';
          ctx.strokeStyle = '#d4a359';
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.arc(charScreenX, charFootY - charHeight * 0.82, 7, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillRect(charScreenX - 9, charFootY - charHeight * 0.72, 18, charHeight * 0.55);
        }

        if (sim.targetWalkX !== null) {
          const tx = sim.targetWalkX * width + fgParallaxX * 0.45;
          ctx.strokeStyle = 'rgba(243, 229, 171, 0.65)';
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.ellipse(tx, charFootY, 12, 4, 0, 0, Math.PI * 2);
          ctx.stroke();
        }
        ctx.restore();
      }

      // =========================================================
      // LAYER 12: DYNAMIC CELESTIAL EFFECTS & HIGH-ALTITUDE FROST
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

      const isActivelyMoving =
        sim.isDragging ||
        sim.isWalking ||
        sim.targetWalkX !== null ||
        sim.keysHeld.size > 0 ||
        sim.trauma > 0.01;

      if (!isDisposed) {
        timerId = setTimeout(
          () => {
            if (!isDisposed) {
              renderFrame(performance.now());
            }
          },
          isActivelyMoving ? 32 : 220
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

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    soundEngine.initOnInteraction();
    simRef.current.isDragging = true;
    simRef.current.dragStartX = e.clientX;
    simRef.current.dragStartY = e.clientY;
    simRef.current.dragLastX = e.clientX;
    simRef.current.dragLastY = e.clientY;
    simRef.current.pointerMovedDistance = 0;
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    if (simRef.current.isDragging) {
      const stepDist = Math.hypot(
        e.clientX - simRef.current.dragLastX,
        e.clientY - simRef.current.dragLastY
      );
      simRef.current.pointerMovedDistance += stepDist;

      const dx = (e.clientX - simRef.current.dragLastX) / Math.max(300, rect.width);
      const dy = (e.clientY - simRef.current.dragLastY) / Math.max(300, rect.height);
      simRef.current.dragLastX = e.clientX;
      simRef.current.dragLastY = e.clientY;

      if (simRef.current.pointerMovedDistance > 8) {
        const nextX = Math.max(-1, Math.min(1, stateRef.current.cameraTargetOffset.x - dx * 2.0));
        const nextY = Math.max(
          -0.6,
          Math.min(0.6, stateRef.current.cameraTargetOffset.y - dy * 1.6)
        );
        stateRef.current.onCameraMove?.({ x: nextX, y: nextY });
      }
    } else if (stateRef.current.scene === 'TITLE') {
      const nx = ((e.clientX - rect.left) / Math.max(1, rect.width) - 0.5) * 0.5;
      const ny = ((e.clientY - rect.top) / Math.max(1, rect.height) - 0.5) * 0.35;
      stateRef.current.onCameraMove?.({ x: nx, y: ny });
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const wasClick = simRef.current.pointerMovedDistance <= 10;
    simRef.current.isDragging = false;

    const { scene: curScene, isPaused: paused } = stateRef.current;
    if (!wasClick || paused || (curScene !== 'EXTERIOR_DECK' && curScene !== 'EAST_STATION')) {
      return;
    }

    const rect = e.currentTarget.getBoundingClientRect();
    const clickNormX = (e.clientX - rect.left) / Math.max(1, rect.width);
    const clickNormY = (e.clientY - rect.top) / Math.max(1, rect.height);

    const fgShiftNorm = (-simRef.current.camX * 88 * 0.45) / Math.max(1, rect.width);
    const worldX = Math.max(0.14, Math.min(0.86, clickNormX - fgShiftNorm));

    const sceneHotspots = WORLD_HOTSPOTS.filter((h) => h.scene === curScene);
    let clickedHotspot: WorldHotspot | null = null;
    for (const hs of sceneHotspots) {
      if (Math.abs(worldX - hs.x) <= 0.065 && clickNormY >= 0.55) {
        clickedHotspot = hs;
        break;
      }
    }

    if (clickedHotspot) {
      soundEngine.playVernierTick('light');
      if (Math.abs(simRef.current.charX - clickedHotspot.x) <= 0.085) {
        simRef.current.interactPulseTime = 0.45;
        stateRef.current.onHotspotInteract?.(clickedHotspot);
      } else {
        simRef.current.targetWalkX = clickedHotspot.x;
        simRef.current.pendingHotspot = clickedHotspot;
      }
    } else if (clickNormY >= 0.58) {
      simRef.current.targetWalkX = worldX;
      simRef.current.pendingHotspot = null;
    }
  };

  return (
    <canvas
      ref={canvasRef}
      data-testid="living-sky-canvas"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={() => {
        simRef.current.isDragging = false;
      }}
      className="fixed inset-0 w-full h-full block cursor-pointer"
    />
  );
};
