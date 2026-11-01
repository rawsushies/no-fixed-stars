import React, { useState } from 'react';
import {
  CATALOG_STARS,
  getObservedStarPosition,
  calculateParallaxIntersection,
  type RecordedPlate,
  type ParallaxCalculationResult,
} from '../game/astronomyLogic';
import { soundEngine } from '../game/soundEngine';

export interface ChartRoomViewProps {
  westPlate: RecordedPlate | null;
  eastPlate: RecordedPlate | null;
  chartPuzzleSolved: boolean;
  onSolveChartPuzzle: () => void;
  onReturnToDeck: () => void;
  onOpenTelescopeStation: (station: 'west' | 'east') => void;
}

export const ChartRoomView: React.FC<ChartRoomViewProps> = ({
  westPlate,
  eastPlate,
  chartPuzzleSolved,
  onSolveChartPuzzle,
  onReturnToDeck,
  onOpenTelescopeStation,
}) => {
  const [plateMode, setPlateMode] = useState<'overlay' | 'west' | 'east'>('overlay');
  const [selectedStarId, setSelectedStarId] = useState<string>('NADIR_IX');
  const [sightlinesPlotted, setSightlinesPlotted] = useState<boolean>(chartPuzzleSolved);
  const [calculationResult, setCalculationResult] =
    useState<ParallaxCalculationResult | null>(() =>
      chartPuzzleSolved
        ? calculateParallaxIntersection('NADIR_IX', westPlate, eastPlate)
        : null
    );
  const [bgImgError, setBgImgError] = useState(false);

  const bothAnomalyPlatesRecorded =
    westPlate?.isAnomaly === true && eastPlate?.isAnomaly === true;

  const handleSelectStarOnChart = (starId: string) => {
    soundEngine.playVernierTick('light');
    setSelectedStarId(starId);
    if (sightlinesPlotted) {
      const res = calculateParallaxIntersection(starId, westPlate, eastPlate);
      setCalculationResult(res);
    }
  };

  const handlePlotAndCalculate = () => {
    soundEngine.playVernierTick('medium');
    setSightlinesPlotted(true);
    const res = calculateParallaxIntersection(selectedStarId, westPlate, eastPlate);
    setCalculationResult(res);

    if (res.isImpossibleGeometry) {
      soundEngine.playAnomalyRevelation();
      onSolveChartPuzzle();
    }
  };

  const selectedStar =
    CATALOG_STARS.find((s) => s.id === selectedStarId) ?? CATALOG_STARS[4];

  return (
    <div
      data-testid="chart-room-view"
      className="fixed inset-0 z-30 flex flex-col justify-between bg-[#050811] text-[#d8dee9] overflow-y-auto pointer-events-auto"
    >
      {/* Painterly Chart Room Background Illustration with Measured Scrim */}
      <div className="fixed inset-0 pointer-events-none">
        {!bgImgError ? (
          <img
            src="/src/assets/images/chart_room_desk_1793502243466.jpg"
            alt="Nadir Observatory Chart Room drafting table and stone arch window"
            referrerPolicy="no-referrer"
            onError={() => setBgImgError(true)}
            className="w-full h-full object-cover opacity-35"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-b from-[#060a14] via-[#0c1424] to-[#050811]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#050811] via-[#050811]/75 to-[#050811]/80" />
      </div>

      {/* Main Content Container */}
      <div className="relative z-10 max-w-6xl w-full mx-auto px-4 sm:px-6 py-5 flex-1 flex flex-col justify-between gap-4">
        {/* Header Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b border-[#d4a359]/25">
          <div>
            <h1 className="text-2xl sm:text-3xl font-display font-semibold text-[#f3e5ab] tracking-wide">
              Astrometric Chart Room · Blink Comparator
            </h1>
            <p className="text-xs sm:text-sm text-[#94a3b8]">
              Overlay recorded West and East baseline plates to measure angular parallax displacement across Nadir Plateau (500.0 m).
            </p>
          </div>
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onReturnToDeck}
              className="px-4 py-2 text-xs font-mono-tabular bg-[#131e36] hover:bg-[#1c2c4d] text-[#f3e5ab] border border-[#d4a359]/45 rounded transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Return to Observation Deck
            </button>
          </div>
        </div>

        {/* Missing Plates Prompt if Player Entered Early */}
        {!bothAnomalyPlatesRecorded && (
          <div className="p-4 rounded-lg bg-[#12192b]/95 border border-amber-500/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="text-xs font-mono-tabular uppercase tracking-wider text-amber-300">
                ▲ Dual-Baseline Plates Required for Full Triangulation
              </div>
              <p className="text-xs text-[#cbd5e1]">
                To complete a rigorous baseline triangulation of{' '}
                <strong className="text-[#f3e5ab]">Object Nadir-IX (The Wanderer)</strong>, record focused glass plates from both the West Pier (−250m) and East Pier (+250m).
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {!westPlate?.isAnomaly && (
                <button
                  type="button"
                  onClick={() => onOpenTelescopeStation('west')}
                  className="px-3 py-1.5 text-xs font-mono-tabular bg-[#d4a359] text-[#050811] font-medium rounded whitespace-nowrap shrink-0 cursor-pointer"
                >
                  Observe at West Pier
                </button>
              )}
              {!eastPlate?.isAnomaly && (
                <button
                  type="button"
                  onClick={() => onOpenTelescopeStation('east')}
                  className="px-3 py-1.5 text-xs font-mono-tabular bg-[#d4a359] text-[#050811] font-medium rounded whitespace-nowrap shrink-0 cursor-pointer"
                >
                  Observe at East Pier
                </button>
              )}
            </div>
          </div>
        )}

        {/* Two-Column Comparator & Triangulation Workspace */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch flex-1">
          {/* Left 7 Columns: Interactive Star Chart & Blink Comparator */}
          <div className="lg:col-span-7 bg-[#080d1a]/95 border border-slate-800 rounded-lg p-4 flex flex-col justify-between">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <span className="text-xs font-mono-tabular uppercase tracking-wider text-[#94a3b8]">
                Plate Superposition Field · Sector IV (Cygnus-Lacerta)
              </span>

              {/* Segmented Blink Control */}
              <div className="flex items-center gap-1 bg-[#050811] p-1 rounded border border-slate-800">
                {(
                  [
                    { id: 'overlay', label: 'Superimpose Both' },
                    { id: 'west', label: 'West Plate (−250m)' },
                    { id: 'east', label: 'East Plate (+250m)' },
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => {
                      soundEngine.playVernierTick('light');
                      setPlateMode(tab.id);
                    }}
                    className={`px-2.5 py-1 text-xs font-mono-tabular rounded transition-colors whitespace-nowrap shrink-0 ${
                      plateMode === tab.id
                        ? 'bg-[#d4a359] text-[#050811] font-medium'
                        : 'text-[#94a3b8] hover:text-white'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Interactive SVG Astrometric Star Chart */}
            <div className="relative w-full aspect-[16/10] bg-[#040710] border border-slate-800/90 rounded overflow-hidden">
              <svg
                viewBox="0 0 800 500"
                className="w-full h-full block"
                role="img"
                aria-label="Astrometric Blink Comparator Star Chart"
              >
                {/* Coordinate Grid */}
                <defs>
                  <pattern
                    id="chart-grid"
                    width="80"
                    height="50"
                    patternUnits="userSpaceOnUse"
                  >
                    <path
                      d="M 80 0 L 0 0 0 50"
                      fill="none"
                      stroke="rgba(148, 163, 184, 0.09)"
                      strokeWidth="1"
                    />
                  </pattern>
                </defs>
                <rect width="800" height="500" fill="url(#chart-grid)" />

                {/* Constellation Reference Lines */}
                <g stroke="rgba(148, 163, 184, 0.18)" strokeWidth="1" strokeDasharray="3 3">
                  <line x1={0.28 * 800} y1={0.34 * 500} x2={0.39 * 800} y2={0.46 * 500} />
                  <line x1={0.39 * 800} y1={0.46 * 500} x2={0.27 * 800} y2={0.55 * 500} />
                  <line x1={0.39 * 800} y1={0.46 * 500} x2={0.49 * 800} y2={0.59 * 500} />
                </g>

                {/* Render Catalog Stars on the Plate */}
                {CATALOG_STARS.map((star) => {
                  const westPos = getObservedStarPosition(star, 'west');
                  const eastPos = getObservedStarPosition(star, 'east');
                  const wx = westPos.x * 800;
                  const wy = westPos.y * 500;
                  const ex = eastPos.x * 800;
                  const ey = eastPos.y * 500;
                  const isSelected = star.id === selectedStarId;

                  return (
                    <g
                      key={star.id}
                      onClick={() => handleSelectStarOnChart(star.id)}
                      className="cursor-pointer"
                    >
                      {/* Displacement Vector for Anomaly in Overlay Mode */}
                      {star.isAnomaly && plateMode === 'overlay' && (
                        <>
                          <line
                            x1={wx}
                            y1={wy}
                            x2={ex}
                            y2={ey}
                            stroke="#b388eb"
                            strokeWidth="2"
                            strokeDasharray="4 3"
                          />
                          <rect
                            x={(wx + ex) / 2 - 110}
                            y={Math.min(wy, ey) - 42}
                            width="220"
                            height="20"
                            rx="3"
                            fill="#090d1a"
                            stroke="rgba(179, 136, 235, 0.45)"
                            strokeWidth="1"
                          />
                          <text
                            x={(wx + ex) / 2}
                            y={Math.min(wy, ey) - 28}
                            textAnchor="middle"
                            fill="#f3e5ab"
                            fontSize="10.5"
                            fontFamily="JetBrains Mono, monospace"
                          >
                            Δθ = +4° 18′ 12″ [INVERTED]
                          </text>
                        </>
                      )}

                      {/* West Plate Position (Cyan/Silver) */}
                      {(plateMode === 'overlay' || plateMode === 'west') && (
                        <g>
                          <circle
                            cx={wx}
                            cy={wy}
                            r={star.isAnomaly ? 7 : 5}
                            fill={star.isAnomaly ? '#67e8f9' : '#dce8ff'}
                            opacity={0.9}
                          />
                          {star.isAnomaly && (
                            <text
                              x={wx - 12}
                              y={wy + 18}
                              textAnchor="end"
                              fill="#67e8f9"
                              fontSize="10"
                              fontFamily="JetBrains Mono, monospace"
                            >
                              W-09 (−2.15°)
                            </text>
                          )}
                        </g>
                      )}

                      {/* East Plate Position (Amber/Violet) */}
                      {(plateMode === 'overlay' || plateMode === 'east') && (
                        <g>
                          <circle
                            cx={ex}
                            cy={ey}
                            r={star.isAnomaly ? 7 : 5}
                            fill={star.isAnomaly ? '#f3e5ab' : '#dce8ff'}
                            opacity={plateMode === 'overlay' && !star.isAnomaly ? 0.5 : 0.95}
                          />
                          {star.isAnomaly && (
                            <text
                              x={ex + 12}
                              y={ey + 18}
                              textAnchor="start"
                              fill="#f3e5ab"
                              fontSize="10"
                              fontFamily="JetBrains Mono, monospace"
                            >
                              E-09 (+2.15°)
                            </text>
                          )}
                        </g>
                      )}

                      {/* Selection Ring */}
                      {isSelected && (
                        <circle
                          cx={plateMode === 'east' ? ex : wx}
                          cy={plateMode === 'east' ? ey : wy}
                          r={15}
                          fill="none"
                          stroke="#d4a359"
                          strokeWidth="1.5"
                        />
                      )}

                      <text
                        x={(wx + ex) / 2}
                        y={
                          star.id === 'BETA_LACERTAE'
                            ? Math.min(wy, ey) - 10
                            : Math.max(wy, ey) + (star.isAnomaly ? 34 : 18)
                        }
                        textAnchor="middle"
                        fill={isSelected ? '#f3e5ab' : '#94a3b8'}
                        fontSize="11"
                        fontFamily="JetBrains Mono, monospace"
                      >
                        {star.commonName}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>

            {/* Bottom Legend & Star Quick-Picker */}
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs font-mono-tabular text-[#94a3b8]">
              <div className="flex items-center gap-4">
                <span className="text-cyan-300">● West Plate (−250 m)</span>
                <span className="text-[#f3e5ab]">● East Plate (+250 m)</span>
              </div>
              <div>
                Selected Target:{' '}
                <strong className="text-[#f3e5ab]">{selectedStar.commonName}</strong>
              </div>
            </div>
          </div>

          {/* Right 5 Columns: Sightline Plotter & Parallax Solver */}
          <div className="lg:col-span-5 bg-[#080d1a]/95 border border-slate-800 rounded-lg p-4 flex flex-col justify-between gap-4">
            <div>
              <h2 className="text-lg font-display font-semibold text-[#f3e5ab]">
                Baseline Sightline Triangulation
              </h2>
              <p className="text-xs text-[#94a3b8] mt-0.5">
                Plot rays from West Pier and East Pier through the recorded coordinates of{' '}
                <span className="text-[#e2e8f0] font-medium">{selectedStar.commonName}</span>.
              </p>

              {/* Sightline Geometry Diagram */}
              <div className="mt-3 w-full h-[210px] bg-[#040710] border border-slate-800/90 rounded p-2 relative">
                <svg
                  viewBox="0 0 400 200"
                  className="w-full h-full block"
                  role="img"
                  aria-label="Baseline Sightline Intersection Diagram"
                >
                  {/* Celestial Sphere Arc at Top */}
                  <path
                    d="M 20 45 Q 200 10 380 45"
                    fill="none"
                    stroke="rgba(148, 163, 184, 0.25)"
                    strokeWidth="1.2"
                    strokeDasharray="4 4"
                  />
                  <text
                    x="200"
                    y="18"
                    textAnchor="middle"
                    fill="#64748b"
                    fontSize="9"
                    fontFamily="JetBrains Mono, monospace"
                  >
                    CELESTIAL SPHERE (APPARENT FIRMAMENT)
                  </text>

                  {/* Nadir Mountain Plateau Baseline at Bottom */}
                  <line
                    x1="60"
                    y1="170"
                    x2="340"
                    y2="170"
                    stroke="#475569"
                    strokeWidth="2"
                  />
                  {/* West Pier Node */}
                  <circle cx="110" cy="170" r="5" fill="#67e8f9" />
                  <text
                    x="110"
                    y="188"
                    textAnchor="middle"
                    fill="#67e8f9"
                    fontSize="9"
                    fontFamily="JetBrains Mono, monospace"
                  >
                    WEST PIER (−250m)
                  </text>

                  {/* East Pier Node */}
                  <circle cx="290" cy="170" r="5" fill="#f3e5ab" />
                  <text
                    x="290"
                    y="188"
                    textAnchor="middle"
                    fill="#f3e5ab"
                    fontSize="9"
                    fontFamily="JetBrains Mono, monospace"
                  >
                    EAST PIER (+250m)
                  </text>

                  {/* Plotted Sightlines */}
                  {sightlinesPlotted && !selectedStar.isAnomaly && (
                    <g>
                      {/* Parallel rays to infinity */}
                      <line
                        x1="110"
                        y1="170"
                        x2="110"
                        y2="24"
                        stroke="#67e8f9"
                        strokeWidth="1.5"
                      />
                      <line
                        x1="290"
                        y1="170"
                        x2="290"
                        y2="24"
                        stroke="#f3e5ab"
                        strokeWidth="1.5"
                      />
                      <text
                        x="200"
                        y="105"
                        textAnchor="middle"
                        fill="#94a3b8"
                        fontSize="10"
                        fontFamily="JetBrains Mono, monospace"
                      >
                        RAYS PARALLEL (Δθ = 0.000″ · DIST &gt; 10¹³ KM)
                      </text>
                    </g>
                  )}

                  {sightlinesPlotted && selectedStar.isAnomaly && (
                    <g>
                      {/* Diverging upward rays */}
                      <line
                        x1="110"
                        y1="170"
                        x2="65"
                        y2="30"
                        stroke="#67e8f9"
                        strokeWidth="1.8"
                      />
                      <line
                        x1="290"
                        y1="170"
                        x2="335"
                        y2="30"
                        stroke="#f3e5ab"
                        strokeWidth="1.8"
                      />
                      {/* Sub-dome / local inverted intersection */}
                      <line
                        x1="65"
                        y1="30"
                        x2="200"
                        y2="110"
                        stroke="#b388eb"
                        strokeWidth="1.5"
                        strokeDasharray="3 3"
                      />
                      <line
                        x1="335"
                        y1="30"
                        x2="200"
                        y2="110"
                        stroke="#b388eb"
                        strokeWidth="1.5"
                        strokeDasharray="3 3"
                      />
                      <circle cx="200" cy="110" r="6.5" fill="#b388eb" />
                      <circle
                        cx="200"
                        cy="110"
                        r="13"
                        fill="none"
                        stroke="#f3e5ab"
                        strokeWidth="1.2"
                      />
                      <rect
                        x="105"
                        y="130"
                        width="190"
                        height="18"
                        rx="3"
                        fill="#080c18"
                        stroke="rgba(179, 136, 235, 0.4)"
                      />
                      <text
                        x="200"
                        y="142"
                        textAnchor="middle"
                        fill="#f3e5ab"
                        fontSize="9.5"
                        fontFamily="JetBrains Mono, monospace"
                      >
                        INVERTED CONVERGENCE (−1.84 KM)
                      </text>
                    </g>
                  )}
                </svg>
              </div>

              {/* Calculation Result Readout */}
              {calculationResult ? (
                <div
                  data-testid="parallax-verdict-box"
                  className={`mt-3 p-3 rounded border space-y-1.5 ${
                    calculationResult.isImpossibleGeometry
                      ? 'bg-[#171126] border-[#b388eb]/60 text-[#f3e5ab]'
                      : 'bg-[#0c1526] border-slate-700 text-[#cbd5e1]'
                  }`}
                >
                  <div className="text-xs font-mono-tabular uppercase tracking-wider font-semibold">
                    {calculationResult.verdictTitle}
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs font-mono-tabular pt-1">
                    <div>
                      <span className="block text-[10px] text-[#94a3b8]">ANGULAR SHIFT</span>
                      <span>{calculationResult.angularDisplacementFormatted}</span>
                    </div>
                    <div>
                      <span className="block text-[10px] text-[#94a3b8]">SOLVED DISTANCE</span>
                      <span>{calculationResult.calculatedDistanceLabel}</span>
                    </div>
                  </div>
                  <p className="text-xs leading-relaxed text-[#d8dee9] pt-1">
                    {calculationResult.verdictSummary}
                  </p>
                </div>
              ) : (
                <div className="mt-3 p-3 rounded bg-[#070c18] border border-slate-800 text-xs text-[#94a3b8]">
                  Select <strong className="text-[#f3e5ab]">The Wanderer (Object Nadir-IX)</strong> on the chart, then click{' '}
                  <strong className="text-[#f3e5ab]">Plot Sightlines &amp; Calculate Parallax</strong> to evaluate Director Vane’s survey.
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={handlePlotAndCalculate}
                data-testid="calculate-parallax-btn"
                className="w-full py-2.5 px-4 text-sm font-medium bg-[#d4a359] hover:bg-[#e2b46b] text-[#050811] rounded transition-colors cursor-pointer whitespace-nowrap shrink-0"
              >
                Plot Sightlines &amp; Calculate Parallax
              </button>

              {chartPuzzleSolved && (
                <button
                  type="button"
                  onClick={onReturnToDeck}
                  data-testid="witness-anomaly-btn"
                  className="w-full py-2.5 px-4 text-sm font-medium bg-[#281b3d] hover:bg-[#372554] text-[#f3e5ab] border border-[#b388eb]/60 rounded transition-colors cursor-pointer whitespace-nowrap shrink-0"
                >
                  Step Outside to Witness the Sky Transformation →
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
