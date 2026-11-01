import React, { useState, useEffect, useRef } from 'react';
import {
  CATALOG_STARS,
  getObservedStarPosition,
  calculateOpticalSharpness,
  validatePlateExposure,
  findNearestStarInField,
  type CatalogStar,
  type RecordedPlate,
  type StationId,
  type CosmicStage,
} from '../game/astronomyLogic';
import { soundEngine } from '../game/soundEngine';

export interface TelescopeModalProps {
  station: StationId;
  cosmicStage: CosmicStage;
  existingPlate: RecordedPlate | null;
  onRecordPlate: (plate: RecordedPlate) => void;
  onInspectStar: (starId: string) => void;
  onOpticalStateChange?: (state: {
    selectedStarId: string;
    isCentered: boolean;
    isSharp: boolean;
  }) => void;
  onClose: () => void;
}

export const TelescopeModal: React.FC<TelescopeModalProps> = ({
  station,
  cosmicStage,
  existingPlate,
  onRecordPlate,
  onInspectStar,
  onOpticalStateChange,
  onClose,
}) => {
  // Start aimed at Gamma Cygni (Sadr, central cross star) and focused at 62mm (standard infinite focus)
  // so the player genuinely selects/centers Nadir-IX and racks the focus vernier to 74mm!
  const [aim, setAim] = useState<{ x: number; y: number }>(() => {
    const startStar =
      existingPlate?.isAnomaly
        ? CATALOG_STARS.find((s) => s.id === 'NADIR_IX')!
        : CATALOG_STARS.find((s) => s.id === 'GAMMA_CYGNI')!;
    const pos = getObservedStarPosition(startStar, station);
    return { x: pos.x, y: pos.y };
  });

  const [focusDial, setFocusDial] = useState<number>(() =>
    existingPlate?.isAnomaly ? 74 : 62
  );
  const [zoom, setZoom] = useState<1 | 2.5 | 5>(2.5);
  const [selectedStarId, setSelectedStarId] = useState<string>(() =>
    existingPlate?.isAnomaly ? 'NADIR_IX' : 'GAMMA_CYGNI'
  );
  const [flashExposure, setFlashExposure] = useState(false);
  const [statusBanner, setStatusBanner] = useState<{
    tone: 'info' | 'warning' | 'success';
    text: string;
  } | null>(null);

  const eyepieceCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const selectedStar: CatalogStar =
    CATALOG_STARS.find((s) => s.id === selectedStarId) ?? CATALOG_STARS[4];
  const selectedPos = getObservedStarPosition(selectedStar, station);

  const exposureCheck = validatePlateExposure(
    aim.x,
    aim.y,
    focusDial,
    selectedStar,
    station
  );
  const sharpness = exposureCheck.sharpness;
  const isSharpEnough = exposureCheck.isSharp;
  const isCenteredOnSelected = exposureCheck.isCentered;

  useEffect(() => {
    if (isCenteredOnSelected) {
      onInspectStar(selectedStar.id);
    }
  }, [selectedStar.id, isCenteredOnSelected, onInspectStar]);

  useEffect(() => {
    onOpticalStateChange?.({
      selectedStarId: selectedStar.id,
      isCentered: isCenteredOnSelected,
      isSharp: isSharpEnough,
    });
  }, [selectedStar.id, isCenteredOnSelected, isSharpEnough, onOpticalStateChange]);

  // Render circular optical eyepiece canvas
  useEffect(() => {
    const canvas = eyepieceCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let raf = 0;
    let timerId: ReturnType<typeof setTimeout> | null = null;
    let isDisposed = false;
    const renderEyepiece = (timeMs: number) => {
      if (isDisposed) return;
      const t = timeMs * 0.001;
      const size = canvas.width;
      const half = size / 2;

      ctx.clearRect(0, 0, size, size);

      // Circular clip
      ctx.save();
      ctx.beginPath();
      ctx.arc(half, half, half - 4, 0, Math.PI * 2);
      ctx.clip();

      // Deep optical glass background
      const bgGrad = ctx.createRadialGradient(half, half, 10, half, half, half);
      bgGrad.addColorStop(0, '#091326');
      bgGrad.addColorStop(0.75, '#050a16');
      bgGrad.addColorStop(1, '#020409');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, size, size);

      // Subtle astrometric coordinate grid lines
      ctx.strokeStyle = 'rgba(212, 163, 89, 0.11)';
      ctx.lineWidth = 1;
      const gridSpacing = 45 * (zoom / 2.5);
      const offsetX = ((-aim.x * size * zoom) % gridSpacing + gridSpacing) % gridSpacing;
      const offsetY = ((-aim.y * size * zoom) % gridSpacing + gridSpacing) % gridSpacing;

      ctx.beginPath();
      for (let x = offsetX; x < size; x += gridSpacing) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, size);
      }
      for (let y = offsetY; y < size; y += gridSpacing) {
        ctx.moveTo(0, y);
        ctx.lineTo(size, y);
      }
      ctx.stroke();

      // Faint background field stars
      for (let i = 0; i < 60; i++) {
        const bx = ((i * 73 + 19) % 100) / 100;
        const by = ((i * 41 + 37) % 100) / 100;
        const sx = half + (bx - aim.x) * size * (zoom * 0.85);
        const sy = half + (by - aim.y) * size * (zoom * 0.85);
        if (sx < 0 || sx > size || sy < 0 || sy > size) continue;
        const blurRadius = Math.max(0.8, (1 - calculateOpticalSharpness(focusDial, 62)) * 9);
        ctx.fillStyle = `rgba(195, 215, 245, ${0.35 / Math.max(1, blurRadius * 0.45)})`;
        ctx.beginPath();
        ctx.arc(sx, sy, blurRadius, 0, Math.PI * 2);
        ctx.fill();
      }

      // Render Catalog Stars in eyepiece
      for (const star of CATALOG_STARS) {
        const pos = getObservedStarPosition(star, station);
        const sx = half + (pos.x - aim.x) * size * (zoom * 0.85);
        const sy = half + (pos.y - aim.y) * size * (zoom * 0.85);

        if (sx < -40 || sx > size + 40 || sy < -40 || sy > size + 40) continue;

        const starSharp = calculateOpticalSharpness(focusDial, star.focalPlane);
        const defocus = 1 - starSharp;
        const baseRadius = Math.max(2.6, (6.5 - star.magnitude) * 1.15);

        if (defocus > 0.15) {
          const bokehR = baseRadius + defocus * 24;
          ctx.strokeStyle = star.isAnomaly
            ? `rgba(179, 136, 235, ${0.58 - defocus * 0.35})`
            : `rgba(210, 228, 255, ${0.5 - defocus * 0.35})`;
          ctx.lineWidth = 2.2;
          ctx.beginPath();
          ctx.arc(sx, sy, bokehR, 0, Math.PI * 2);
          ctx.stroke();
        }

        const glowR = baseRadius * (star.isAnomaly ? 6.5 : 4.2);
        const g = ctx.createRadialGradient(sx, sy, 0.5, sx, sy, glowR);
        if (star.isAnomaly) {
          g.addColorStop(0, 'rgba(243, 229, 171, 0.95)');
          g.addColorStop(0.4, 'rgba(179, 136, 235, 0.42)');
          g.addColorStop(1, 'rgba(9, 19, 38, 0)');
        } else {
          g.addColorStop(0, star.color);
          g.addColorStop(0.35, 'rgba(200, 220, 255, 0.25)');
          g.addColorStop(1, 'rgba(9, 19, 38, 0)');
        }
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(sx, sy, glowR, 0, Math.PI * 2);
        ctx.fill();

        if (starSharp >= 0.8) {
          ctx.strokeStyle = star.isAnomaly
            ? 'rgba(243, 229, 171, 0.65)'
            : 'rgba(220, 235, 255, 0.55)';
          ctx.lineWidth = 1;
          const spikeLen = baseRadius * 4.5 * starSharp;
          ctx.beginPath();
          ctx.moveTo(sx - spikeLen, sy);
          ctx.lineTo(sx + spikeLen, sy);
          ctx.moveTo(sx, sy - spikeLen);
          ctx.lineTo(sx, sy + spikeLen);
          ctx.stroke();
        }

        if (star.isAnomaly && starSharp >= 0.75) {
          ctx.strokeStyle = 'rgba(179, 136, 235, 0.75)';
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.arc(sx, sy, 14 + Math.sin(t * 2.2) * 1.5, 0, Math.PI * 2);
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(sx, sy, 21 - Math.cos(t * 1.7) * 1.5, 0, Math.PI * 2);
          ctx.stroke();
        }

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(sx, sy, baseRadius * (0.6 + 0.4 * starSharp), 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle =
          star.id === selectedStarId
            ? '#f3e5ab'
            : 'rgba(200, 216, 238, 0.68)';
        ctx.font = '11px "JetBrains Mono", monospace';
        ctx.fillText(star.commonName, sx + 10, sy - 8);
      }

      // Brass reticle crosshair overlay
      ctx.strokeStyle =
        isCenteredOnSelected && isSharpEnough
          ? 'rgba(110, 231, 183, 0.85)'
          : isCenteredOnSelected
            ? 'rgba(243, 229, 171, 0.75)'
            : 'rgba(212, 163, 89, 0.38)';
      ctx.lineWidth = 1.1;

      ctx.beginPath();
      ctx.moveTo(0, half);
      ctx.lineTo(half - 22, half);
      ctx.moveTo(half + 22, half);
      ctx.lineTo(size, half);
      ctx.moveTo(half, 0);
      ctx.lineTo(half, half - 22);
      ctx.moveTo(half, half + 22);
      ctx.lineTo(half, size);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(half, half, 22, 0, Math.PI * 2);
      ctx.arc(half, half, 68, 0, Math.PI * 2);
      ctx.stroke();

      ctx.restore();

      // Outer brass bezel ring
      ctx.strokeStyle = '#8b6b3b';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.arc(half, half, half - 3, 0, Math.PI * 2);
      ctx.stroke();

      if (!isDisposed) {
        timerId = setTimeout(() => {
          if (!isDisposed) {
            renderEyepiece(performance.now());
          }
        }, 180);
      }
    };

    renderEyepiece(performance.now());
    return () => {
      isDisposed = true;
      if (timerId !== null) clearTimeout(timerId);
      cancelAnimationFrame(raf);
    };
  }, [aim, focusDial, zoom, station, selectedStarId, isCenteredOnSelected, isSharpEnough]);

  const handleSelectAndCenterStar = (star: CatalogStar) => {
    soundEngine.playVernierTick('light');
    const pos = getObservedStarPosition(star, station);
    setSelectedStarId(star.id);
    setAim({ x: pos.x, y: pos.y });
    onInspectStar(star.id);
    const nextSharp = calculateOpticalSharpness(focusDial, star.focalPlane);
    if (nextSharp < 0.85) {
      setStatusBanner({
        tone: 'info',
        text: `${star.commonName} centered in reticle, but optical image is defocused (${Math.round(nextSharp * 100)}%). Rack Focus Vernier to ${star.focalPlane.toFixed(1)} mm.`,
      });
    } else {
      setStatusBanner(null);
    }
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const cx = (e.clientX - rect.left) / rect.width - 0.5;
    const cy = (e.clientY - rect.top) / rect.height - 0.5;
    const clickFieldX = Math.max(0.1, Math.min(0.9, aim.x + cx / (zoom * 0.85)));
    const clickFieldY = Math.max(0.1, Math.min(0.85, aim.y + cy / (zoom * 0.85)));

    const nearest = findNearestStarInField(clickFieldX, clickFieldY, station, 0.09);
    if (nearest) {
      handleSelectAndCenterStar(nearest.star);
    } else {
      soundEngine.playVernierTick('light');
      setAim({ x: clickFieldX, y: clickFieldY });
    }
  };

  const handleSnapFocus = () => {
    soundEngine.playVernierTick('medium');
    setFocusDial(selectedStar.focalPlane);
    setStatusBanner({
      tone: 'info',
      text: `Focus Vernier racked to ${selectedStar.focalPlane.toFixed(1)} mm (100% Optical Sharpness). Ready to expose glass plate.`,
    });
  };

  const handleExposePlate = () => {
    // STRICT VALIDATION: No silent auto-centering or auto-focusing!
    const validation = validatePlateExposure(
      aim.x,
      aim.y,
      focusDial,
      selectedStar,
      station
    );

    if (!validation.canExpose) {
      soundEngine.playVernierTick('light');
      setStatusBanner({
        tone: 'warning',
        text: validation.reason ?? 'Center and focus the target star before exposing the plate.',
      });
      return;
    }

    const pos = getObservedStarPosition(selectedStar, station);
    soundEngine.playPlateShutter(selectedStar.isAnomaly);
    setFlashExposure(true);
    setTimeout(() => setFlashExposure(false), 450);

    const newPlate: RecordedPlate = {
      station,
      starId: selectedStar.id,
      starDesignation: `${selectedStar.commonName} (${selectedStar.designation})`,
      timestamp: station === 'west' ? '02:18 ST' : '02:44 ST',
      focusSharpness: validation.sharpness,
      observedX: pos.x,
      observedY: pos.y,
      raObserved: pos.ra,
      decObserved: pos.dec,
      zenithAngleDeg: pos.angleDeg,
      isAnomaly: selectedStar.isAnomaly,
    };

    onRecordPlate(newPlate);
    setStatusBanner({
      tone: 'success',
      text: selectedStar.isAnomaly
        ? `✓ Glass Plate ${station === 'west' ? 'W-09' : 'E-09'} exposed: ${selectedStar.commonName} recorded at RA ${pos.ra}, DEC ${pos.dec} (Zenith Angle ${pos.angleDeg > 0 ? '+' : ''}${pos.angleDeg}°).`
        : `Calibration plate exposed for ${selectedStar.commonName}. Note: Select and focus OBJECT NADIR-IX (The Wanderer) at 74.0 mm to test Director Vane’s anomaly.`,
    });
  };

  return (
    <div
      role="dialog"
      aria-label={`${station === 'west' ? 'West Pier' : 'East Pier'} Equatorial Telescope`}
      className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-[#03060c]/88 pointer-events-auto"
    >
      <div className="w-full max-w-5xl bg-[#090f1d] border border-[#d4a359]/35 rounded-lg shadow-2xl overflow-hidden flex flex-col lg:flex-row">
        {/* Left / Center: Optical Eyepiece Viewport */}
        <div className="flex-1 p-5 flex flex-col items-center justify-between bg-[#060a14] border-b lg:border-b-0 lg:border-r border-[#d4a359]/20 relative">
          <div className="w-full flex items-center justify-between text-xs font-mono-tabular text-[#94a3b8]">
            <span>
              STATION: {station === 'west' ? 'WEST PIER (−250.0 m)' : 'EAST PIER (+250.0 m)'}
            </span>
            <span>
              STAGE {cosmicStage} · MAGNIFICATION {zoom.toFixed(1)}×
            </span>
          </div>

          <div className="relative my-3 flex items-center justify-center">
            <canvas
              ref={eyepieceCanvasRef}
              width={360}
              height={360}
              onClick={handleCanvasClick}
              data-testid="telescope-eyepiece-canvas"
              className="w-[280px] h-[280px] sm:w-[340px] sm:h-[340px] rounded-full cursor-crosshair shadow-[0_0_50px_rgba(0,0,0,0.9)]"
            />
            {flashExposure && (
              <div className="absolute inset-0 rounded-full bg-[#f3e5ab]/70 pointer-events-none transition-opacity duration-300" />
            )}
          </div>

          {/* Optical Lock & Sharpness Telemetry Strip */}
          <div className="w-full flex items-center justify-between text-[11px] font-mono-tabular px-2 pb-2">
            <span className={isCenteredOnSelected ? 'text-emerald-400' : 'text-amber-300'}>
              {isCenteredOnSelected
                ? `● RETICLE LOCKED: ${selectedStar.commonName.toUpperCase()}`
                : `▲ OFF-CENTER: SLEW OR SELECT TARGET`}
            </span>
            <span className={isSharpEnough ? 'text-emerald-400' : 'text-amber-300'}>
              {isSharpEnough
                ? `● FOCUS LOCKED (${Math.round(sharpness * 100)}%)`
                : `▲ DEFOCUSED (${Math.round(sharpness * 100)}% · NEED ≥85%)`}
            </span>
          </div>

          {/* Fine Slew & Magnification Bar */}
          <div className="w-full flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800/80">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => {
                  soundEngine.playVernierTick('light');
                  setAim((a) => ({ ...a, x: Math.max(0.15, a.x - 0.03) }));
                }}
                className="px-2.5 py-1.5 text-xs font-mono-tabular bg-[#111a2e] hover:bg-[#1a2744] text-[#d8dee9] border border-slate-700/70 rounded whitespace-nowrap shrink-0 cursor-pointer"
              >
                ← West
              </button>
              <button
                type="button"
                onClick={() => {
                  soundEngine.playVernierTick('light');
                  setAim((a) => ({ ...a, y: Math.max(0.15, a.y - 0.03) }));
                }}
                className="px-2.5 py-1.5 text-xs font-mono-tabular bg-[#111a2e] hover:bg-[#1a2744] text-[#d8dee9] border border-slate-700/70 rounded whitespace-nowrap shrink-0 cursor-pointer"
              >
                ↑ North
              </button>
              <button
                type="button"
                onClick={() => {
                  soundEngine.playVernierTick('light');
                  setAim((a) => ({ ...a, y: Math.min(0.75, a.y + 0.03) }));
                }}
                className="px-2.5 py-1.5 text-xs font-mono-tabular bg-[#111a2e] hover:bg-[#1a2744] text-[#d8dee9] border border-slate-700/70 rounded whitespace-nowrap shrink-0 cursor-pointer"
              >
                ↓ South
              </button>
              <button
                type="button"
                onClick={() => {
                  soundEngine.playVernierTick('light');
                  setAim((a) => ({ ...a, x: Math.min(0.85, a.x + 0.03) }));
                }}
                className="px-2.5 py-1.5 text-xs font-mono-tabular bg-[#111a2e] hover:bg-[#1a2744] text-[#d8dee9] border border-slate-700/70 rounded whitespace-nowrap shrink-0 cursor-pointer"
              >
                East →
              </button>
            </div>

            <div className="flex items-center gap-1 bg-[#0d1526] p-1 rounded border border-slate-800">
              {([1, 2.5, 5] as const).map((z) => (
                <button
                  key={z}
                  type="button"
                  onClick={() => {
                    soundEngine.playVernierTick('light');
                    setZoom(z);
                  }}
                  className={`px-2.5 py-1 text-xs font-mono-tabular rounded transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    zoom === z
                      ? 'bg-[#d4a359] text-[#050811] font-medium'
                      : 'text-[#94a3b8] hover:text-white'
                  }`}
                >
                  {z}×
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Astrometric Readout, Focus Vernier, Star Selector & Plate Exposure */}
        <div className="w-full lg:w-[430px] p-5 flex flex-col justify-between gap-4 bg-[#0b1222]">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h2 className="text-xl font-display font-semibold text-[#f3e5ab] tracking-wide">
                  {station === 'west'
                    ? 'West Pier Equatorial Refractor'
                    : 'East Cliffside Transit Instrument'}
                </h2>
                <p className="text-xs text-[#94a3b8]">
                  Baseline Position:{' '}
                  {station === 'west'
                    ? '−250.0 m West of Meridian'
                    : '+250.0 m East of Meridian'}
                </p>
              </div>
              <button
                type="button"
                data-testid="telescope-step-back-btn"
                onClick={onClose}
                className="px-3 py-1.5 text-xs font-mono-tabular text-[#cbd5e1] hover:text-white bg-[#131d33] hover:bg-[#1c2b4a] border border-slate-700 rounded whitespace-nowrap shrink-0 cursor-pointer"
              >
                Step Back [Esc]
              </button>
            </div>

            {/* Catalog Target Selector */}
            <div className="mt-3">
              <label className="block text-xs font-mono-tabular uppercase tracking-wider text-[#94a3b8] mb-1.5">
                1. Select &amp; Slew to Celestial Target in Sector IV
              </label>
              <div className="grid grid-cols-2 gap-1.5 max-h-[148px] overflow-y-auto pr-1">
                {CATALOG_STARS.map((star) => {
                  const isSelected = star.id === selectedStarId;
                  return (
                    <button
                      key={star.id}
                      type="button"
                      data-testid={`select-star-${star.id}`}
                      onClick={() => handleSelectAndCenterStar(star)}
                      className={`px-2.5 py-1.5 text-left rounded border transition-colors flex items-center justify-between cursor-pointer ${
                        isSelected
                          ? 'bg-[#1a2642] border-[#d4a359] text-[#f3e5ab]'
                          : 'bg-[#0e1629] border-slate-800/90 text-[#cbd5e1] hover:border-slate-600'
                      }`}
                    >
                      <span className="text-xs font-medium truncate">
                        {star.commonName}
                      </span>
                      <span
                        className={`text-[10px] font-mono-tabular ml-1 shrink-0 ${
                          star.isAnomaly ? 'text-[#b388eb] font-semibold' : 'text-[#94a3b8]'
                        }`}
                      >
                        {star.isAnomaly ? 'ANOMALY' : `m ${star.magnitude.toFixed(1)}`}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Focus Vernier Control */}
            <div className="mt-4 p-3 rounded bg-[#070c18] border border-slate-800/90">
              <div className="flex items-center justify-between gap-2 text-xs mb-1.5">
                <label
                  htmlFor="focus-vernier-slider"
                  className="font-mono-tabular uppercase tracking-wider text-[#94a3b8] whitespace-nowrap shrink-0"
                >
                  2. Focus Vernier ({focusDial.toFixed(1)} mm)
                </label>
                <span
                  className={`font-mono-tabular whitespace-nowrap shrink-0 ${
                    isSharpEnough ? 'text-emerald-400' : 'text-amber-400'
                  }`}
                >
                  {isSharpEnough
                    ? `● Sharp (${Math.round(sharpness * 100)}%)`
                    : `▲ Defocused (${Math.round(sharpness * 100)}%)`}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  id="focus-vernier-slider"
                  data-testid="focus-vernier-slider"
                  type="range"
                  min={30}
                  max={95}
                  step={1}
                  value={focusDial}
                  onChange={(e) => {
                    soundEngine.playVernierTick('light');
                    setFocusDial(Number(e.target.value));
                  }}
                  className="w-full accent-[#d4a359] cursor-pointer"
                />
                <button
                  type="button"
                  data-testid="fine-focus-btn"
                  onClick={handleSnapFocus}
                  className="px-2.5 py-1 text-xs font-mono-tabular bg-[#152038] hover:bg-[#1e2e50] text-[#f3e5ab] border border-[#d4a359]/40 rounded whitespace-nowrap shrink-0 cursor-pointer"
                >
                  Fine Focus ({selectedStar.focalPlane}mm)
                </button>
              </div>
            </div>

            {/* Selected Star Astrometric Telemetry */}
            <div className="mt-3 p-3 rounded bg-[#070c18] border border-slate-800/90 space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-display font-semibold text-[#f3e5ab] truncate">
                  {selectedStar.designation}
                </span>
                <span className="text-xs font-mono-tabular text-[#94a3b8] whitespace-nowrap shrink-0">
                  Target Plane: {selectedStar.focalPlane.toFixed(1)} mm
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 pt-1 text-xs font-mono-tabular">
                <div>
                  <span className="block text-[10px] text-[#64748b]">OBSERVED RA</span>
                  <span className="text-[#e2e8f0]">{selectedPos.ra}</span>
                </div>
                <div>
                  <span className="block text-[10px] text-[#64748b]">OBSERVED DEC</span>
                  <span className="text-[#e2e8f0]">{selectedPos.dec}</span>
                </div>
                <div>
                  <span className="block text-[10px] text-[#64748b]">ZENITH ANGLE</span>
                  <span
                    className={
                      selectedStar.isAnomaly ? 'text-[#f3e5ab] font-medium' : 'text-[#e2e8f0]'
                    }
                  >
                    {selectedPos.angleDeg > 0 ? `+${selectedPos.angleDeg}°` : `${selectedPos.angleDeg}°`}
                  </span>
                </div>
              </div>
              <p className="text-xs text-[#94a3b8] leading-relaxed pt-1">
                {selectedStar.notes}
              </p>
            </div>
          </div>

          {/* Exposure Action & Status */}
          <div className="space-y-2.5 pt-2 border-t border-slate-800">
            {statusBanner && (
              <div
                role="status"
                data-testid="telescope-status-banner"
                className={`p-2.5 rounded border text-xs leading-relaxed ${
                  statusBanner.tone === 'warning'
                    ? 'bg-[#261912] border-amber-500/60 text-amber-200'
                    : statusBanner.tone === 'success'
                      ? 'bg-[#0f241d] border-emerald-500/50 text-emerald-200'
                      : 'bg-[#132038] border-[#d4a359]/50 text-[#f3e5ab]'
                }`}
              >
                {statusBanner.text}
              </div>
            )}

            {existingPlate && !statusBanner && (
              <div className="text-xs font-mono-tabular text-emerald-400">
                ✓ Recorded at this station: {existingPlate.starDesignation} ({existingPlate.raObserved})
              </div>
            )}

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                data-testid="record-observation-btn"
                onClick={handleExposePlate}
                className={`flex-1 py-2.5 px-4 text-sm font-medium rounded transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                  exposureCheck.canExpose
                    ? 'bg-[#d4a359] hover:bg-[#e2b46b] text-[#050811]'
                    : 'bg-[#1e293b] hover:bg-[#283548] text-[#cbd5e1] border border-[#d4a359]/40'
                }`}
              >
                Record Observation ({station === 'west' ? 'West Plate W-09' : 'East Plate E-09'})
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
