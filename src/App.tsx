/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  SAVE_STORAGE_KEY,
  createInitialGameState,
  serializeGameState,
  deserializeGameState,
  deriveCosmicStage,
  type GameSaveState,
  type RecordedPlate,
  type StationId,
} from './game/astronomyLogic';
import { soundEngine } from './game/soundEngine';
import { LivingSkyCanvas } from './components/LivingSkyCanvas';
import { TelescopeModal } from './components/TelescopeModal';
import { ChartRoomView } from './components/ChartRoomView';
import { FieldJournalModal } from './components/FieldJournalModal';

const STAGE_NAMES: Record<1 | 2 | 3 | 4, string> = {
  1: 'STAGE I · FAMILIARITY',
  2: 'STAGE II · ANOMALY',
  3: 'STAGE III · DISTORTION',
  4: 'STAGE IV · REVELATION',
};

export default function App() {
  const isAutostart =
    typeof window !== 'undefined' &&
    new URLSearchParams(window.location.search).get('autostart') === '1';

  const [gameState, setGameState] = useState<GameSaveState>(() => {
    if (typeof window === 'undefined') return createInitialGameState(false);
    const saved = window.localStorage.getItem(SAVE_STORAGE_KEY);
    return deserializeGameState(saved, isAutostart);
  });

  const [isPaused, setIsPaused] = useState(false);
  const [isJournalOpen, setIsJournalOpen] = useState(false);
  const [isTelescopeOpen, setIsTelescopeOpen] = useState(false);
  const [isMilestoneModalOpen, setIsMilestoneModalOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [cameraOffset, setCameraOffset] = useState<{ x: number; y: number }>({
    x: 0,
    y: 0,
  });
  const [traumaCounter, setTraumaCounter] = useState(0);
  const [inspectionToast, setInspectionToast] = useState<{
    title: string;
    body: string;
  } | null>(null);

  // Persist game state to localStorage
  useEffect(() => {
    try {
      window.localStorage.setItem(
        SAVE_STORAGE_KEY,
        serializeGameState(gameState)
      );
    } catch {
      // Ignore storage quota errors
    }
  }, [gameState]);

  // Synchronize document.body.dataset.state for Game Shell compliance
  useEffect(() => {
    if (isMilestoneModalOpen) {
      document.body.dataset.state = 'gameover';
    } else if (isPaused) {
      document.body.dataset.state = 'paused';
    } else if (gameState.scene === 'TITLE') {
      document.body.dataset.state = 'title';
    } else {
      document.body.dataset.state = 'playing';
    }
  }, [gameState.scene, isPaused, isMilestoneModalOpen]);

  // Keep Web Audio harmonics synced to Cosmic Stage
  useEffect(() => {
    soundEngine.setCosmicStage(gameState.cosmicStage);
  }, [gameState.cosmicStage]);

  const handleStartGame = useCallback(() => {
    soundEngine.initOnInteraction();
    soundEngine.playVernierTick('medium');
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    setIsPaused(false);
    setIsMilestoneModalOpen(false);
    setCameraOffset({ x: 0, y: 0 });
    setGameState((prev) => ({
      ...prev,
      scene: prev.scene === 'TITLE' ? 'EXTERIOR_DECK' : prev.scene,
    }));
  }, []);

  const handleResetSurvey = useCallback(() => {
    soundEngine.initOnInteraction();
    soundEngine.playVernierTick('medium');
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    const fresh = createInitialGameState(true);
    setGameState(fresh);
    setIsPaused(false);
    setIsJournalOpen(false);
    setIsTelescopeOpen(false);
    setIsMilestoneModalOpen(false);
    setInspectionToast(null);
    setCameraOffset({ x: 0, y: 0 });
  }, []);

  const handleToggleMute = useCallback(() => {
    soundEngine.initOnInteraction();
    const next = !soundEngine.getMuted();
    soundEngine.setMuted(next);
    setIsMuted(next);
  }, []);

  const handleTogglePause = useCallback(() => {
    if (gameState.scene === 'TITLE') return;
    setIsPaused((prev) => {
      const next = !prev;
      soundEngine.setPaused(next);
      return next;
    });
  }, [gameState.scene]);

  // Global keyboard shortcuts (Enter/Space on Title, Esc/P Pause, J Journal, M Mute, R Restart)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (gameState.scene === 'TITLE') {
        if (e.code === 'Enter' || e.code === 'Space') {
          e.preventDefault();
          handleStartGame();
        }
        return;
      }

      if (e.code === 'Escape' || e.code === 'KeyP') {
        e.preventDefault();
        if (isTelescopeOpen) {
          setIsTelescopeOpen(false);
        } else if (isJournalOpen) {
          setIsJournalOpen(false);
        } else {
          handleTogglePause();
        }
      } else if (e.code === 'KeyJ' && !isPaused) {
        e.preventDefault();
        soundEngine.playVernierTick('light');
        setIsJournalOpen((prev) => !prev);
      } else if (e.code === 'KeyM') {
        e.preventDefault();
        handleToggleMute();
      } else if (e.code === 'KeyR' && isPaused) {
        e.preventDefault();
        handleResetSurvey();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [
    gameState.scene,
    isTelescopeOpen,
    isJournalOpen,
    isPaused,
    handleStartGame,
    handleTogglePause,
    handleToggleMute,
    handleResetSurvey,
  ]);

  const handleInspectStar = useCallback((starId: string) => {
    setGameState((prev) => {
      const inspected = prev.inspectedStarIds.includes(starId)
        ? prev.inspectedStarIds
        : [...prev.inspectedStarIds, starId];
      const nextStage = deriveCosmicStage({
        inspectedStarIds: inspected,
        westPlate: prev.recordedPlates.west,
        eastPlate: prev.recordedPlates.east,
        chartPuzzleSolved: prev.chartPuzzleSolved,
      });
      if (
        inspected.length === prev.inspectedStarIds.length &&
        nextStage === prev.cosmicStage
      ) {
        return prev;
      }
      return {
        ...prev,
        inspectedStarIds: inspected,
        cosmicStage: nextStage,
      };
    });
  }, []);

  const handleRecordPlate = useCallback((plate: RecordedPlate) => {
    setGameState((prev) => {
      const nextPlates = {
        ...prev.recordedPlates,
        [plate.station]: plate,
      };
      const nextStage = deriveCosmicStage({
        inspectedStarIds: prev.inspectedStarIds,
        westPlate: nextPlates.west,
        eastPlate: nextPlates.east,
        chartPuzzleSolved: prev.chartPuzzleSolved,
      });
      return {
        ...prev,
        recordedPlates: nextPlates,
        cosmicStage: nextStage,
      };
    });
    if (plate.isAnomaly) {
      setTraumaCounter((c) => c + 1);
    }
  }, []);

  const handleSolveChartPuzzle = useCallback(() => {
    setGameState((prev) => {
      const docs = prev.unlockedDocIds.includes('DOC_FINAL_REVELATION')
        ? prev.unlockedDocIds
        : [...prev.unlockedDocIds, 'DOC_FINAL_REVELATION'];
      return {
        ...prev,
        chartPuzzleSolved: true,
        cosmicStage: 4,
        unlockedDocIds: docs,
      };
    });
    setTraumaCounter((c) => c + 1);
  }, []);

  const handleOpenTelescopeFromStation = (station: StationId) => {
    soundEngine.initOnInteraction();
    soundEngine.playVernierTick('medium');
    setGameState((prev) => ({
      ...prev,
      activeStation: station,
      scene: station === 'west' ? 'EXTERIOR_DECK' : 'EAST_STATION',
    }));
    setIsTelescopeOpen(true);
  };

  const handleInspectPlumbLine = () => {
    soundEngine.initOnInteraction();
    soundEngine.playVernierTick('medium');
    setGameState((prev) => ({
      ...prev,
      plumbLineInspected: true,
      unlockedDocIds: prev.unlockedDocIds.includes('DOC_PLUMB_LINE')
        ? prev.unlockedDocIds
        : [...prev.unlockedDocIds, 'DOC_PLUMB_LINE'],
    }));
    setInspectionToast({
      title: 'Meridian Plumb-Line Pillar (Journal Entry Recovered)',
      body: 'Inside the glass wind-shield, the suspended lead plumb-bob does not hang vertical. It leans 0.4° upward toward Cygnus—deflected toward the azimuth of Object Nadir-IX.',
    });
  };

  const handleInspectEastTheodolite = () => {
    soundEngine.initOnInteraction();
    soundEngine.playVernierTick('medium');
    setGameState((prev) => ({
      ...prev,
      eastBeaconAligned: true,
      unlockedDocIds: prev.unlockedDocIds.includes('DOC_EAST_PIER_LOG')
        ? prev.unlockedDocIds
        : [...prev.unlockedDocIds, 'DOC_EAST_PIER_LOG'],
    }));
    setInspectionToast({
      title: 'Baseline Theodolite (+250.0 m East · Log Recovered)',
      body: 'Sighting back toward the warm amber lantern on the West Dome confirms the granite baseline is 500.00 meters true. Torn pages from Director Vane’s logbook are wedged beneath the brass vernier.',
    });
  };

  const platesRecordedCount =
    (gameState.recordedPlates.west?.isAnomaly ? 1 : 0) +
    (gameState.recordedPlates.east?.isAnomaly ? 1 : 0);

  return (
    <main className="relative w-screen h-screen overflow-hidden select-none bg-[#050811]">
      {/* Isolated 60fps 10-Layer Living Sky Canvas */}
      <LivingSkyCanvas
        scene={gameState.scene}
        station={gameState.activeStation}
        cosmicStage={gameState.cosmicStage}
        isPaused={isPaused}
        cameraTargetOffset={cameraOffset}
        onCameraMove={setCameraOffset}
        traumaTrigger={traumaCounter}
      />

      {/* ========================================================= */}
      {/* SCENE 1: TITLE SCREEN OVERLAY                             */}
      {/* ========================================================= */}
      {gameState.scene === 'TITLE' && (
        <section
          aria-label="Title Screen"
          className="fixed inset-0 z-20 flex flex-col items-center justify-between px-6 py-8 pointer-events-none"
        >
          {/* Top Subtle Location Line + Bespoke Inline SVG Title Lockup in Upper Negative Space */}
          <div className="flex flex-col items-center text-center max-w-2xl mt-2 pointer-events-auto">
            <div className="text-xs font-mono-tabular tracking-[0.25em] text-[#94a3b8] uppercase mb-3">
              NADIR OBSERVATORY · ELEV. 4,120 M · SECTOR IV SURVEY
            </div>

            <svg
              viewBox="0 0 680 185"
              className="w-full max-w-[580px] h-auto mb-3 overflow-visible"
              role="img"
              aria-label="No Fixed Stars — A star should not move when you move"
            >
              {/* Delicate Astrometric Degree Arcs & Sightlines */}
              <g stroke="rgba(212, 163, 89, 0.32)" strokeWidth="1" fill="none">
                <path d="M 140 48 Q 340 6 540 48" strokeDasharray="3 5" />
                <path d="M 190 152 Q 340 178 490 152" strokeDasharray="2 4" />
                <line x1="75" y1="94" x2="145" y2="94" />
                <line x1="535" y1="94" x2="605" y2="94" />
                <circle cx="340" cy="26" r="9" stroke="rgba(243, 229, 171, 0.65)" />
                <circle cx="340" cy="26" r="2.8" fill="#f3e5ab" />
                <line x1="340" y1="10" x2="340" y2="42" />
              </g>

              {/* Main Title Lettering */}
              <text
                x="340"
                y="102"
                textAnchor="middle"
                fill="#f4efe6"
                fontFamily="Cormorant Garamond, Georgia, serif"
                fontSize="54"
                fontWeight="600"
                letterSpacing="12"
              >
                NO FIXED STARS
              </text>

              {/* Tagline */}
              <text
                x="340"
                y="140"
                textAnchor="middle"
                fill="#d4a359"
                fontFamily="Lora, Georgia, serif"
                fontStyle="italic"
                fontSize="17"
                letterSpacing="1.5"
              >
                “A star should not move when you move.”
              </text>
            </svg>

            <div className="flex flex-wrap items-center justify-center gap-4">
              <button
                type="button"
                data-start="true"
                onClick={handleStartGame}
                className="px-8 py-2.5 text-sm font-mono-tabular uppercase tracking-widest bg-[#d4a359] hover:bg-[#e3b56b] text-[#050811] font-medium rounded shadow-[0_0_30px_rgba(212,163,89,0.28)] transition-transform active:scale-95 cursor-pointer whitespace-nowrap shrink-0"
              >
                Begin Observation
              </button>
            </div>
          </div>

          {/* Single Flat Control-Hint Line in Bottom Safe Margin */}
          <div className="text-xs font-mono-tabular text-[#94a3b8] tracking-wider text-center">
            WASD / Drag Pan Sky · Click Instruments to Inspect · J Field Journal · Esc Pause
          </div>
        </section>
      )}

      {/* ========================================================= */}
      {/* PLAYING HUD & WORLD HOTSPOTS (EXTERIOR & EAST STATION)    */}
      {/* ========================================================= */}
      {gameState.scene !== 'TITLE' && (
        <div className="fixed inset-0 z-20 pointer-events-none flex flex-col justify-between p-4 sm:p-6">
          {/* Top Perimeter Clusters (Low-Occlusion World-Matched Framing) */}
          <div className="flex flex-wrap items-start justify-between gap-2 sm:gap-4">
            {/* Top-Left Telemetry & Stage Cluster */}
            <div className="pointer-events-auto bg-[#070c18]/85 border border-[#d4a359]/30 rounded px-3 py-2 sm:px-3.5 sm:py-2.5 shadow-lg space-y-1">
              <div className="flex items-center gap-2 sm:gap-3">
                <span className="text-[11px] font-mono-tabular uppercase tracking-wider text-[#d4a359] whitespace-nowrap">
                  {STAGE_NAMES[gameState.cosmicStage]}
                </span>
                <span aria-hidden="true" className="hidden sm:inline text-slate-600">
                  ·
                </span>
                <span className="hidden sm:inline text-[11px] font-mono-tabular text-[#cbd5e1] whitespace-nowrap">
                  {gameState.scene === 'EAST_STATION'
                    ? 'EAST CLIFFSIDE PIER (+250 m)'
                    : gameState.scene === 'CHART_ROOM'
                      ? 'CHART ROOM INTERIOR'
                      : 'OBSERVATION DECK (−250 m)'}
                </span>
              </div>

              <div className="flex items-center gap-3 sm:gap-4 text-xs font-mono-tabular">
                <div className="whitespace-nowrap">
                  <span className="text-[#94a3b8] mr-1">PLATES:</span>
                  <span className="text-sm sm:text-base font-semibold text-[#f3e5ab]">
                    {platesRecordedCount}/2
                  </span>
                </div>
                <span aria-hidden="true" className="text-slate-700">
                  |
                </span>
                <div className="whitespace-nowrap">
                  <span className="text-[#94a3b8] mr-1">SURVEY:</span>
                  <span className="text-sm sm:text-base font-semibold text-[#f3e5ab]">
                    {gameState.chartPuzzleSolved ? 'SOLVED' : 'PENDING'}
                  </span>
                </div>
              </div>
            </div>

            {/* Top-Right Compact Utility Controls */}
            <div className="pointer-events-auto flex items-center gap-2">
              <button
                type="button"
                tabIndex={-1}
                onClick={(e) => {
                  e.currentTarget.blur();
                  soundEngine.initOnInteraction();
                  soundEngine.playVernierTick('light');
                  setIsJournalOpen(true);
                }}
                aria-label="Open Field Journal"
                className="px-3 py-2 text-xs font-mono-tabular bg-[#070c18]/85 hover:bg-[#111b30] text-[#f3e5ab] border border-[#d4a359]/35 rounded flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
              >
                <svg viewBox="0 0 24 24" className="w-4 h-4 fill-none stroke-current" strokeWidth="1.8">
                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                  <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                </svg>
                <span>Journal [J]</span>
              </button>

              <button
                type="button"
                tabIndex={-1}
                onClick={(e) => {
                  e.currentTarget.blur();
                  handleToggleMute();
                }}
                aria-label={isMuted ? 'Unmute Audio' : 'Mute Audio'}
                className="p-2 bg-[#070c18]/85 hover:bg-[#111b30] text-[#cbd5e1] border border-slate-700/80 rounded cursor-pointer"
              >
                <svg viewBox="0 0 24 24" className="w-4 h-4 fill-none stroke-current" strokeWidth="1.8">
                  {isMuted ? (
                    <>
                      <path d="M11 5L6 9H2v6h4l5 4V5z" />
                      <line x1="23" y1="9" x2="17" y2="15" />
                      <line x1="17" y1="9" x2="23" y2="15" />
                    </>
                  ) : (
                    <>
                      <path d="M11 5L6 9H2v6h4l5 4V5z" />
                      <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                      <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
                    </>
                  )}
                </svg>
              </button>

              <button
                type="button"
                tabIndex={-1}
                onClick={(e) => {
                  e.currentTarget.blur();
                  handleTogglePause();
                }}
                aria-label="Pause Game"
                className="p-2 bg-[#070c18]/85 hover:bg-[#111b30] text-[#cbd5e1] border border-slate-700/80 rounded cursor-pointer"
              >
                <svg viewBox="0 0 24 24" className="w-4 h-4 fill-none stroke-current" strokeWidth="1.8">
                  <rect x="6" y="4" width="4" height="16" />
                  <rect x="14" y="4" width="4" height="16" />
                </svg>
              </button>
            </div>
          </div>

          {/* Lower Sky Notice when in Stage 4 Revelation (positioned above bottom dock so center sky is unobstructed) */}
          {gameState.cosmicStage === 4 &&
            (gameState.scene === 'EXTERIOR_DECK' || gameState.scene === 'EAST_STATION') && (
              <div className="mt-auto mb-3 mx-auto max-w-2xl pointer-events-auto bg-[#090614]/92 border border-[#b388eb]/55 rounded-lg px-5 py-3 text-center flex flex-col sm:flex-row items-center justify-between gap-4 shadow-2xl">
                <div className="text-left space-y-0.5">
                  <div className="text-[11px] font-mono-tabular uppercase tracking-widest text-[#b388eb]">
                    CELESTIAL ANOMALY CONFIRMED · STAGE IV REVELATION
                  </div>
                  <p className="text-xs sm:text-sm font-serif text-[#f3e5ab] leading-relaxed">
                    Pan the sky with mouse or <span className="font-mono-tabular">WASD</span>. While every mountain and constellation shifts, <strong className="underline decoration-[#b388eb]">Object Nadir-IX remains locked to your gaze</strong>.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    soundEngine.playVernierTick('medium');
                    setGameState((prev) => ({ ...prev, anomalyWitnessed: true }));
                    setIsMilestoneModalOpen(true);
                  }}
                  className="px-4 py-2 text-xs font-mono-tabular uppercase tracking-wider bg-[#d4a359] hover:bg-[#e5b86b] text-[#050811] font-medium rounded cursor-pointer whitespace-nowrap shrink-0"
                >
                  Complete First Night Log →
                </button>
              </div>
            )}

          {/* Contextual Inspection Toast */}
          {inspectionToast && (
            <div
              role="status"
              className="mx-auto max-w-lg pointer-events-auto bg-[#080e1c]/95 border border-[#d4a359]/45 rounded px-4 py-3 shadow-xl flex items-start justify-between gap-4"
            >
              <div className="space-y-1">
                <div className="text-xs font-display font-semibold text-[#f3e5ab]">
                  {inspectionToast.title}
                </div>
                <p className="text-xs text-[#cbd5e1] leading-relaxed">
                  {inspectionToast.body}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setInspectionToast(null)}
                className="text-xs font-mono-tabular text-[#94a3b8] hover:text-white shrink-0 cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Bottom Interactive Observatory Station Hotspots Dock (Occupies Lower Foreground) */}
          {(gameState.scene === 'EXTERIOR_DECK' || gameState.scene === 'EAST_STATION') && (
            <div className="flex flex-col items-center gap-2">
              <div className="pointer-events-auto flex flex-wrap items-center justify-center gap-2.5 bg-[#060b16]/90 border border-slate-800/90 rounded-lg px-4 py-2.5 shadow-2xl">
                {gameState.scene === 'EXTERIOR_DECK' ? (
                  <>
                    <button
                      type="button"
                      onClick={() => handleOpenTelescopeFromStation('west')}
                      className="px-3.5 py-2 text-xs font-mono-tabular bg-[#111c33] hover:bg-[#19294a] text-[#f3e5ab] border border-[#d4a359]/50 rounded transition-colors cursor-pointer whitespace-nowrap shrink-0"
                    >
                      {gameState.recordedPlates.west?.isAnomaly
                        ? '✓ West Pier Telescope (−250 m)'
                        : '◎ Inspect West Pier Telescope (−250 m)'}
                    </button>

                    <button
                      type="button"
                      onClick={handleInspectPlumbLine}
                      className="px-3.5 py-2 text-xs font-mono-tabular bg-[#0d1526] hover:bg-[#16223d] text-[#cbd5e1] border border-slate-700/80 rounded transition-colors cursor-pointer whitespace-nowrap shrink-0"
                    >
                      {gameState.plumbLineInspected
                        ? '✓ Meridian Plumb-Line'
                        : 'Inspect Meridian Plumb-Line'}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        soundEngine.initOnInteraction();
                        soundEngine.playVernierTick('medium');
                        setInspectionToast(null);
                        setGameState((prev) => ({
                          ...prev,
                          scene: 'CHART_ROOM',
                        }));
                      }}
                      className="px-3.5 py-2 text-xs font-mono-tabular bg-[#141d30] hover:bg-[#1e2c48] text-[#f3e5ab] border border-[#d4a359]/40 rounded transition-colors cursor-pointer whitespace-nowrap shrink-0"
                    >
                      Enter Chart Room (Blink Comparator)
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        soundEngine.initOnInteraction();
                        soundEngine.playVernierTick('medium');
                        setInspectionToast(null);
                        setGameState((prev) => ({
                          ...prev,
                          scene: 'EAST_STATION',
                          activeStation: 'east',
                        }));
                      }}
                      className="px-3.5 py-2 text-xs font-mono-tabular bg-[#111c33] hover:bg-[#19294a] text-[#d8dee9] border border-slate-700 rounded transition-colors cursor-pointer whitespace-nowrap shrink-0"
                    >
                      Walk to East Cliffside Pier (+250 m) →
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        soundEngine.initOnInteraction();
                        soundEngine.playVernierTick('medium');
                        setInspectionToast(null);
                        setGameState((prev) => ({
                          ...prev,
                          scene: 'EXTERIOR_DECK',
                          activeStation: 'west',
                        }));
                      }}
                      className="px-3.5 py-2 text-xs font-mono-tabular bg-[#111c33] hover:bg-[#19294a] text-[#d8dee9] border border-slate-700 rounded transition-colors cursor-pointer whitespace-nowrap shrink-0"
                    >
                      ← Return to West Observation Deck (−250 m)
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenTelescopeFromStation('east')}
                      className="px-3.5 py-2 text-xs font-mono-tabular bg-[#111c33] hover:bg-[#19294a] text-[#f3e5ab] border border-[#d4a359]/50 rounded transition-colors cursor-pointer whitespace-nowrap shrink-0"
                    >
                      {gameState.recordedPlates.east?.isAnomaly
                        ? '✓ East Pier Telescope (+250 m)'
                        : '◎ Inspect East Pier Telescope (+250 m)'}
                    </button>

                    <button
                      type="button"
                      onClick={handleInspectEastTheodolite}
                      className="px-3.5 py-2 text-xs font-mono-tabular bg-[#0d1526] hover:bg-[#16223d] text-[#cbd5e1] border border-slate-700/80 rounded transition-colors cursor-pointer whitespace-nowrap shrink-0"
                    >
                      {gameState.eastBeaconAligned
                        ? '✓ Baseline Theodolite (500.0 m)'
                        : 'Inspect Baseline Theodolite'}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        soundEngine.initOnInteraction();
                        soundEngine.playVernierTick('medium');
                        setInspectionToast(null);
                        setGameState((prev) => ({
                          ...prev,
                          scene: 'CHART_ROOM',
                        }));
                      }}
                      className="px-3.5 py-2 text-xs font-mono-tabular bg-[#141d30] hover:bg-[#1e2c48] text-[#f3e5ab] border border-[#d4a359]/40 rounded transition-colors cursor-pointer whitespace-nowrap shrink-0"
                    >
                      Enter Chart Room (Blink Comparator)
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* SCENE 3: TELESCOPE OBSERVATION MODAL                      */}
      {/* ========================================================= */}
      {isTelescopeOpen && (
        <TelescopeModal
          station={gameState.activeStation}
          cosmicStage={gameState.cosmicStage}
          existingPlate={gameState.recordedPlates[gameState.activeStation]}
          onRecordPlate={handleRecordPlate}
          onInspectStar={handleInspectStar}
          onClose={() => setIsTelescopeOpen(false)}
        />
      )}

      {/* ========================================================= */}
      {/* SCENE 4: CHART ROOM VIEW                                  */}
      {/* ========================================================= */}
      {gameState.scene === 'CHART_ROOM' && (
        <ChartRoomView
          westPlate={gameState.recordedPlates.west}
          eastPlate={gameState.recordedPlates.east}
          chartPuzzleSolved={gameState.chartPuzzleSolved}
          onSolveChartPuzzle={handleSolveChartPuzzle}
          onReturnToDeck={() => {
            soundEngine.playVernierTick('medium');
            setGameState((prev) => ({
              ...prev,
              scene: 'EXTERIOR_DECK',
            }));
          }}
          onOpenTelescopeStation={(st) => {
            setGameState((prev) => ({
              ...prev,
              activeStation: st,
              scene: st === 'west' ? 'EXTERIOR_DECK' : 'EAST_STATION',
            }));
            setIsTelescopeOpen(true);
          }}
        />
      )}

      {/* ========================================================= */}
      {/* FIELD JOURNAL NOTEBOOK OVERLAY                            */}
      {/* ========================================================= */}
      {isJournalOpen && (
        <FieldJournalModal
          cosmicStage={gameState.cosmicStage}
          westPlate={gameState.recordedPlates.west}
          eastPlate={gameState.recordedPlates.east}
          unlockedDocIds={gameState.unlockedDocIds}
          chartPuzzleSolved={gameState.chartPuzzleSolved}
          onClose={() => setIsJournalOpen(false)}
        />
      )}

      {/* ========================================================= */}
      {/* PAUSE MODAL (`document.body.dataset.state = 'paused'`)    */}
      {/* ========================================================= */}
      {isPaused && (
        <div
          role="dialog"
          aria-label="Observation Paused"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#03050a]/88 pointer-events-auto"
        >
          <div className="w-full max-w-md bg-[#090f1d] border border-[#d4a359]/40 rounded-lg p-6 text-center space-y-5 shadow-2xl">
            <div>
              <div className="text-xs font-mono-tabular uppercase tracking-widest text-[#d4a359]">
                NADIR OBSERVATORY · SURVEY PAUSED
              </div>
              <h2 className="text-2xl font-display font-semibold text-[#f3e5ab] mt-1">
                Meridian Chronometer Halted
              </h2>
            </div>

            <div className="grid grid-cols-3 gap-2 p-3 rounded bg-[#050811] border border-slate-800 font-mono-tabular">
              <div>
                <span className="block text-[10px] text-[#94a3b8]">STAGE</span>
                <span className="text-lg font-semibold text-[#f3e5ab]">
                  0{gameState.cosmicStage}
                </span>
              </div>
              <div>
                <span className="block text-[10px] text-[#94a3b8]">PLATES</span>
                <span className="text-lg font-semibold text-[#f3e5ab]">
                  {platesRecordedCount}/2
                </span>
              </div>
              <div>
                <span className="block text-[10px] text-[#94a3b8]">NOTES</span>
                <span className="text-lg font-semibold text-[#f3e5ab]">
                  {gameState.unlockedDocIds.length}/5
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-2.5">
              <button
                type="button"
                onClick={handleTogglePause}
                className="w-full py-2.5 px-4 text-xs font-mono-tabular uppercase tracking-wider bg-[#d4a359] hover:bg-[#e5b86b] text-[#050811] font-medium rounded cursor-pointer"
              >
                Resume Observation [Esc]
              </button>
              <button
                type="button"
                onClick={handleResetSurvey}
                className="w-full py-2.5 px-4 text-xs font-mono-tabular uppercase tracking-wider bg-[#121c33] hover:bg-[#1a2847] text-[#cbd5e1] border border-slate-700 rounded cursor-pointer"
              >
                Reset Survey Progress [R]
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsPaused(false);
                  soundEngine.setPaused(false);
                  setGameState((prev) => ({ ...prev, scene: 'TITLE' }));
                }}
                className="w-full py-2 px-4 text-xs font-mono-tabular uppercase tracking-wider text-[#94a3b8] hover:text-white cursor-pointer"
              >
                Return to Title Screen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MILESTONE 01 COMPLETION MODAL (`dataset.state='gameover'`)*/}
      {/* ========================================================= */}
      {isMilestoneModalOpen && (
        <div
          role="dialog"
          aria-label="Milestone 01 Complete — The First Night"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#03050a]/90 pointer-events-auto"
        >
          <div className="w-full max-w-lg bg-[#0b0e1c] border border-[#b388eb]/55 rounded-lg p-6 text-center space-y-5 shadow-2xl">
            <div>
              <div className="text-xs font-mono-tabular uppercase tracking-widest text-[#b388eb]">
                MILESTONE 01 COMPLETE · THE FIRST NIGHT
              </div>
              <h2 className="text-3xl font-display font-semibold text-[#f3e5ab] mt-1">
                “A Star Should Not Move When You Move”
              </h2>
              <p className="text-xs sm:text-sm text-[#cbd5e1] mt-2 leading-relaxed italic">
                “We assumed the dome was built to shelter an instrument that looks into the heavens. Tonight the baseline proved otherwise: the aperture is two kilometers above the ridge, and it has locked onto the observatory.”
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2.5 p-3.5 rounded bg-[#060812] border border-slate-800 font-mono-tabular">
              <div>
                <span className="block text-[10px] text-[#94a3b8]">PLATES EXPOSED</span>
                <span className="text-lg font-semibold text-[#f3e5ab]">
                  {platesRecordedCount}/2
                </span>
              </div>
              <div>
                <span className="block text-[10px] text-[#94a3b8]">PARALLAX SHIFT</span>
                <span className="text-lg font-semibold text-[#b388eb]">
                  −4° 18′
                </span>
              </div>
              <div>
                <span className="block text-[10px] text-[#94a3b8]">LOGS FOUND</span>
                <span className="text-lg font-semibold text-[#f3e5ab]">
                  {gameState.unlockedDocIds.length}/5
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setIsMilestoneModalOpen(false)}
                className="w-full sm:w-auto flex-1 py-2.5 px-4 text-xs font-mono-tabular uppercase tracking-wider bg-[#151e36] hover:bg-[#1f2d50] text-[#f3e5ab] border border-[#d4a359]/45 rounded cursor-pointer whitespace-nowrap shrink-0"
              >
                Continue Observing Sky
              </button>
              <button
                type="button"
                data-start="true"
                onClick={handleResetSurvey}
                className="w-full sm:w-auto flex-1 py-2.5 px-4 text-xs font-mono-tabular uppercase tracking-wider bg-[#d4a359] hover:bg-[#e5b86b] text-[#050811] font-medium rounded cursor-pointer whitespace-nowrap shrink-0"
              >
                Begin New Survey
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
