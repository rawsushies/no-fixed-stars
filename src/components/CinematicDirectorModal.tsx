import React, { useState, useEffect } from 'react';
import { PROLOGUE_BEATS, type CinematicId } from '../game/astronomyLogic';
import { soundEngine } from '../game/soundEngine';

export interface CinematicDirectorModalProps {
  cinematicId: CinematicId;
  onComplete: () => void;
}

interface CutsceneSlide {
  heading: string;
  caption: string;
  imageSrc: string;
}

const CUTSCENE_DATA: Record<CinematicId, { title: string; slides: CutsceneSlide[] }> = {
  PROLOGUE_1926: {
    title: 'PROLOGUE · THE NORTHERN MERIDIAN SURVEY',
    slides: PROLOGUE_BEATS.map((b) => ({
      heading: b.heading,
      caption: b.caption,
      imageSrc:
        b.plateKey === 'sky'
          ? '/src/assets/images/painted_sky_nebula_1793506262807.jpg'
          : b.plateKey === 'east_pier'
            ? '/src/assets/images/east_cliffside_pier_1793506265480.jpg'
            : b.plateKey === 'chart_room'
              ? '/src/assets/images/chart_room_desk_1793502243466.jpg'
              : '/src/assets/images/master_nadir_observatory_1793506260866.jpg',
    })),
  },
  ANOMALY_STAGE_2: {
    title: 'COSMIC STAGE II · FIRST BASELINE ANOMALY',
    slides: [
      {
        heading: 'GLASS PLATE W-09 DEVELOPED · DEEP FOCAL PLANE (74.0 MM)',
        caption:
          'While every star in Cygnus resolves at the 62.0 mm infinite focus stop, Object Nadir-IX required racking the drawtube twelve millimetres deeper—as if it hangs closer than the clouds.',
        imageSrc: '/src/assets/images/master_nadir_observatory_1793506260866.jpg',
      },
    ],
  },
  ANOMALY_STAGE_3: {
    title: 'COSMIC STAGE III · INVERTED DISPLACEMENT',
    slides: [
      {
        heading: 'GLASS PLATE E-09 DEVELOPED · +250.0 M EAST CLIFFSIDE PIER',
        caption:
          'Across five hundred metres of mountain granite, Object Nadir-IX shifted over four degrees East—in the same direction you walked. Carry both plates to the Chart Room Blink Comparator.',
        imageSrc: '/src/assets/images/east_cliffside_pier_1793506265480.jpg',
      },
    ],
  },
  REVELATION_STAGE_4: {
    title: 'COSMIC STAGE IV · NEGATIVE CONVERGENCE',
    slides: [
      {
        heading: 'THE APERTURE ABOVE NADIR PLATEAU (−1.84 KM)',
        caption:
          'The West and East sightlines do not converge in deep space. They cross 1.84 kilometres above the mountain ridge. Outside the Chart Room window, the clouds part around a fixed double ring that turns to meet your gaze.',
        imageSrc: '/src/assets/images/cosmic_revelation_sky_1793506266973.jpg',
      },
    ],
  },
};

export const CinematicDirectorModal: React.FC<CinematicDirectorModalProps> = ({
  cinematicId,
  onComplete,
}) => {
  const sequence = CUTSCENE_DATA[cinematicId];
  const [slideIndex, setSlideIndex] = useState(0);

  const currentSlide = sequence.slides[slideIndex] ?? sequence.slides[0];
  const isLastSlide = slideIndex >= sequence.slides.length - 1;

  const handleAdvance = () => {
    soundEngine.playVernierTick('light');
    if (isLastSlide) {
      onComplete();
    } else {
      setSlideIndex((i) => i + 1);
    }
  };

  const handleSkip = () => {
    soundEngine.playVernierTick('medium');
    onComplete();
  };

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Escape') {
        e.preventDefault();
        handleSkip();
      } else if (e.code === 'Space' || e.code === 'Enter' || e.code === 'ArrowRight') {
        e.preventDefault();
        handleAdvance();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  });

  return (
    <div
      role="dialog"
      aria-label={sequence.title}
      data-testid="cinematic-director-modal"
      className="fixed inset-0 z-50 flex flex-col justify-between bg-[#03050b] text-[#f4efe6] pointer-events-auto select-none overflow-hidden"
    >
      {/* Painted Widescreen Plate with Subtle Ken Burns Motion */}
      <div className="relative flex-1 w-full overflow-hidden flex items-center justify-center bg-[#040710]">
        <img
          key={currentSlide.imageSrc + slideIndex}
          src={currentSlide.imageSrc}
          alt={currentSlide.heading}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover opacity-85 transition-transform duration-1000 scale-105"
        />
        {/* Vignette & Letterbox Scrim */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#03050b] via-[#03050b]/35 to-[#03050b]/80 pointer-events-none" />

        {/* Top Bar: Sequence Title & Skip Button */}
        <div className="absolute top-0 inset-x-0 p-5 sm:px-10 flex items-center justify-between">
          <div className="text-xs font-mono-tabular uppercase tracking-[0.22em] text-[#d4a359]">
            {sequence.title} · BEAT 0{slideIndex + 1} / 0{sequence.slides.length}
          </div>
          <button
            type="button"
            data-testid="skip-cinematic-btn"
            onClick={handleSkip}
            className="px-3.5 py-1.5 text-xs font-mono-tabular uppercase tracking-wider bg-[#0b1324]/90 hover:bg-[#162442] text-[#cbd5e1] hover:text-white border border-[#d4a359]/40 rounded cursor-pointer whitespace-nowrap shrink-0"
          >
            {cinematicId === 'PROLOGUE_1926' ? 'Skip Prologue [Esc]' : 'Continue Observation [Esc]'}
          </button>
        </div>
      </div>

      {/* Bottom Narrative Letterbox Caption Deck */}
      <div className="w-full bg-[#050811] border-t border-[#d4a359]/30 px-6 py-6 sm:px-12 sm:py-7">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="space-y-2 flex-1">
            <div className="text-xs font-mono-tabular uppercase tracking-widest text-[#d4a359]">
              {currentSlide.heading}
            </div>
            <p className="text-base sm:text-lg font-serif text-[#f4efe6] leading-relaxed">
              “{currentSlide.caption}”
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
            {sequence.slides.length > 1 && (
              <div className="flex items-center gap-1.5 mr-2">
                {sequence.slides.map((_, idx) => (
                  <span
                    key={idx}
                    className={`w-2 h-2 rounded-full ${
                      idx === slideIndex ? 'bg-[#d4a359]' : 'bg-slate-700'
                    }`}
                  />
                ))}
              </div>
            )}

            <button
              type="button"
              data-testid="advance-cinematic-btn"
              onClick={handleAdvance}
              className="px-5 py-2.5 text-xs font-mono-tabular uppercase tracking-wider bg-[#d4a359] hover:bg-[#e5b86b] text-[#050811] font-medium rounded cursor-pointer whitespace-nowrap shrink-0"
            >
              {isLastSlide
                ? cinematicId === 'PROLOGUE_1926'
                  ? 'Step Onto Observation Deck →'
                  : 'Resume Survey →'
                : 'Next Beat [Space] →'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
