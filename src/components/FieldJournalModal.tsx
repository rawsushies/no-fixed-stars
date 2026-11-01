import React, { useState } from 'react';
import {
  INITIAL_DOCUMENTS,
  TUTORIAL_STEPS,
  type RecordedPlate,
  type CosmicStage,
  type TutorialStepId,
} from '../game/astronomyLogic';
import { soundEngine } from '../game/soundEngine';

export interface FieldJournalModalProps {
  cosmicStage: CosmicStage;
  westPlate: RecordedPlate | null;
  eastPlate: RecordedPlate | null;
  unlockedDocIds: string[];
  chartPuzzleSolved: boolean;
  activeTutorialStep: TutorialStepId;
  onReplayPrologue?: () => void;
  onClose: () => void;
}

export const FieldJournalModal: React.FC<FieldJournalModalProps> = ({
  cosmicStage,
  westPlate,
  eastPlate,
  unlockedDocIds,
  chartPuzzleSolved,
  activeTutorialStep,
  onReplayPrologue,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<
    'objectives' | 'tutorials' | 'plates' | 'documents' | 'archive'
  >('objectives');
  const [img1Error, setImg1Error] = useState(false);
  const [img2Error, setImg2Error] = useState(false);

  const documents = INITIAL_DOCUMENTS.map((doc) => ({
    ...doc,
    unlocked: unlockedDocIds.includes(doc.id),
  }));

  const tutorialList = Object.values(TUTORIAL_STEPS);

  return (
    <div
      role="dialog"
      aria-label="Astronomer's Field Journal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#03050a]/85 pointer-events-auto"
    >
      <div className="w-full max-w-4xl max-h-[88vh] bg-[#16130f] text-[#e6dcc8] border border-[#8c6f44]/50 rounded-lg shadow-2xl flex flex-col overflow-hidden">
        {/* Top Leather Notebook Header */}
        <div className="px-6 py-4 bg-[#110e0b] border-b border-[#8c6f44]/30 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-display font-semibold text-[#f3e5ab] tracking-wide">
              Nadir Observatory · Meridian Field Journal
            </h2>
            <p className="text-xs font-mono-tabular text-[#b09f82]">
              RELIEF ASTRONOMER DR. E. VANCE · SECTOR IV SURVEY · COSMIC STAGE 0{cosmicStage}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {onReplayPrologue && (
              <button
                type="button"
                onClick={() => {
                  soundEngine.playVernierTick('light');
                  onClose();
                  onReplayPrologue();
                }}
                className="px-3 py-1.5 text-xs font-mono-tabular bg-[#1d1812] hover:bg-[#2a2219] text-[#d4a359] border border-[#8c6f44]/40 rounded whitespace-nowrap shrink-0 cursor-pointer"
              >
                Replay Prologue
              </button>
            )}
            <button
              type="button"
              data-testid="close-journal-btn"
              onClick={() => {
                soundEngine.playVernierTick('light');
                onClose();
              }}
              className="px-3.5 py-1.5 text-xs font-mono-tabular bg-[#262018] hover:bg-[#362d22] text-[#f3e5ab] border border-[#8c6f44]/50 rounded whitespace-nowrap shrink-0 cursor-pointer"
            >
              Close Journal [J]
            </button>
          </div>
        </div>

        {/* Notebook Tab Bar */}
        <div className="px-6 py-2.5 bg-[#13100c] border-b border-[#8c6f44]/25 flex flex-wrap items-center gap-2">
          {(
            [
              { id: 'objectives', label: '01. Survey Objectives' },
              { id: 'tutorials', label: '02. Field Manual (Tutorials 01–10)' },
              { id: 'plates', label: '03. Recorded Glass Plates' },
              { id: 'documents', label: '04. Director Vane’s Notes' },
              { id: 'archive', label: '05. Archival Plates (1894–1924)' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                soundEngine.playVernierTick('light');
                setActiveTab(tab.id);
              }}
              className={`px-3 py-1.5 text-xs font-mono-tabular rounded transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-[#d4a359] text-[#0c0a08] font-medium'
                  : 'text-[#b8a78a] hover:text-[#f3e5ab] bg-[#1d1812]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Notebook Page Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1 bg-[#181410]">
          {activeTab === 'objectives' && (
            <div className="space-y-4">
              <h3 className="text-lg font-display font-semibold text-[#f3e5ab]">
                Current Investigation Protocol — First Night at Nadir Plateau
              </h3>
              <p className="text-sm text-[#d4c7b0] leading-relaxed">
                Director Julian Vane vanished after attempting a dual-baseline parallax measurement of an uncatalogued star in Cygnus-Lacerta (<strong className="text-[#f3e5ab]">Object Nadir-IX / The Wanderer</strong>). Walk Dr. Vance across the observatory terrace and complete his unfinished observation sequence.
              </p>

              <div className="space-y-2.5 pt-2">
                <div className="p-3.5 rounded bg-[#120f0c] border border-[#8c6f44]/30 flex items-start justify-between gap-4">
                  <div>
                    <div className="text-sm font-semibold text-[#f3e5ab]">
                      Step 1: Expose West Pier Photographic Plate (−250.0 m)
                    </div>
                    <p className="text-xs text-[#b8a78a] mt-1">
                      Walk Dr. Vance to the West Pier Equatorial Telescope on the Observation Deck and press <strong>E</strong>. Select <em>The Wanderer (Object Nadir-IX)</em>, rack the focus vernier to 74.0 mm (≥85% sharpness), and expose Glass Plate W-09.
                    </p>
                  </div>
                  <span className="text-xs font-mono-tabular shrink-0 text-[#d4a359]">
                    {westPlate?.isAnomaly ? '✓ COMPLETED' : 'PENDING'}
                  </span>
                </div>

                <div className="p-3.5 rounded bg-[#120f0c] border border-[#8c6f44]/30 flex items-start justify-between gap-4">
                  <div>
                    <div className="text-sm font-semibold text-[#f3e5ab]">
                      Step 2: Traverse to East Cliffside Pier &amp; Expose East Plate (+250.0 m)
                    </div>
                    <p className="text-xs text-[#b8a78a] mt-1">
                      Walk to the right end of the terrace (East Ridge Walkway) and press <strong>E</strong> to reach the East Pier Station (+250 m). Open the East Transit Instrument, focus on <em>The Wanderer</em> at 74.0 mm, and expose Glass Plate E-09.
                    </p>
                  </div>
                  <span className="text-xs font-mono-tabular shrink-0 text-[#d4a359]">
                    {eastPlate?.isAnomaly ? '✓ COMPLETED' : 'PENDING'}
                  </span>
                </div>

                <div className="p-3.5 rounded bg-[#120f0c] border border-[#8c6f44]/30 flex items-start justify-between gap-4">
                  <div>
                    <div className="text-sm font-semibold text-[#f3e5ab]">
                      Step 3: Superimpose Both Plates &amp; Plot Sightlines in the Chart Room
                    </div>
                    <p className="text-xs text-[#b8a78a] mt-1">
                      Walk to the Chart Room Door, press <strong>E</strong>, superimpose both glass plates on the Blink Comparator, select <em>The Wanderer</em>, and calculate its parallax intersection.
                    </p>
                  </div>
                  <span className="text-xs font-mono-tabular shrink-0 text-[#d4a359]">
                    {chartPuzzleSolved ? '✓ COMPLETED' : 'PENDING'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'tutorials' && (
            <div className="space-y-3">
              <h3 className="text-lg font-display font-semibold text-[#f3e5ab]">
                Astrometric Field Manual — Progressive Tutorial Ledger (01–10)
              </h3>
              <div className="grid grid-cols-1 gap-2.5">
                {tutorialList.map((step) => {
                  const isCurrent = activeTutorialStep === step.id;
                  return (
                    <div
                      key={step.id}
                      className={`p-3 rounded border flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
                        isCurrent
                          ? 'bg-[#211a11] border-[#d4a359]'
                          : 'bg-[#120f0c] border-[#8c6f44]/25'
                      }`}
                    >
                      <div>
                        <div className="text-xs font-mono-tabular text-[#d4a359]">
                          {step.numberLabel} · {step.title}
                        </div>
                        <p className="text-xs text-[#d4c7b0] mt-0.5">{step.instruction}</p>
                      </div>
                      <span className="text-[11px] font-mono-tabular px-2 py-1 rounded bg-[#1a150f] text-[#f3e5ab] shrink-0">
                        {step.controlHint}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'plates' && (
            <div className="space-y-4">
              <h3 className="text-lg font-display font-semibold text-[#f3e5ab]">
                Astrometric Plate Ledger (500.0 m Granite Baseline)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded bg-[#120f0c] border border-[#8c6f44]/35 space-y-2">
                  <div className="text-xs font-mono-tabular uppercase tracking-wider text-[#b8a78a]">
                    PLATE W-09 · WEST PIER STATION (−250.0 m)
                  </div>
                  {westPlate ? (
                    <div className="space-y-1.5 text-xs font-mono-tabular">
                      <div className="text-sm font-serif font-semibold text-[#f3e5ab]">
                        {westPlate.starDesignation}
                      </div>
                      <div>RA OBSERVED: {westPlate.raObserved}</div>
                      <div>DEC OBSERVED: {westPlate.decObserved}</div>
                      <div>ZENITH ANGLE: {westPlate.zenithAngleDeg}°</div>
                      <div>OPTICAL SHARPNESS: {Math.round(westPlate.focusSharpness * 100)}%</div>
                    </div>
                  ) : (
                    <p className="text-xs text-[#8c7e68] italic">
                      No photographic plate exposed at West Pier yet.
                    </p>
                  )}
                </div>

                <div className="p-4 rounded bg-[#120f0c] border border-[#8c6f44]/35 space-y-2">
                  <div className="text-xs font-mono-tabular uppercase tracking-wider text-[#b8a78a]">
                    PLATE E-09 · EAST PIER STATION (+250.0 m)
                  </div>
                  {eastPlate ? (
                    <div className="space-y-1.5 text-xs font-mono-tabular">
                      <div className="text-sm font-serif font-semibold text-[#f3e5ab]">
                        {eastPlate.starDesignation}
                      </div>
                      <div>RA OBSERVED: {eastPlate.raObserved}</div>
                      <div>DEC OBSERVED: {eastPlate.decObserved}</div>
                      <div>ZENITH ANGLE: +{eastPlate.zenithAngleDeg}°</div>
                      <div>OPTICAL SHARPNESS: {Math.round(eastPlate.focusSharpness * 100)}%</div>
                    </div>
                  ) : (
                    <p className="text-xs text-[#8c7e68] italic">
                      No photographic plate exposed at East Pier yet.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'documents' && (
            <div className="space-y-4">
              {documents.map((doc) => (
                <article
                  key={doc.id}
                  className="p-4 rounded bg-[#120f0c] border border-[#8c6f44]/30 space-y-2"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h4 className="text-base font-display font-semibold text-[#f3e5ab]">
                      {doc.unlocked ? doc.title : 'Unrecovered Observatory Entry'}
                    </h4>
                    <span className="text-xs font-mono-tabular text-[#b8a78a]">
                      {doc.date} · {doc.locationFound}
                    </span>
                  </div>
                  {doc.unlocked ? (
                    <div className="space-y-2 text-xs sm:text-sm text-[#d4c7b0] leading-relaxed italic">
                      {doc.body.map((para, idx) => (
                        <p key={idx}>{para}</p>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-[#8c7e68]">
                      Walk Dr. Vance to instruments and stations around Nadir Observatory and press [E] to recover this document.
                    </p>
                  )}
                </article>
              ))}
            </div>
          )}

          {activeTab === 'archive' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="p-4 rounded bg-[#120f0c] border border-[#8c6f44]/35 space-y-3">
                <div className="aspect-square w-full rounded overflow-hidden bg-[#080d18] border border-slate-800 flex items-center justify-center">
                  {!img1Error ? (
                    <img
                      src="/src/assets/images/plate_1894_eclipse_1793502240047.jpg"
                      alt="1894 Dry-Gelatin Glass Plate showing concentric double ring anomaly above Nadir ridge"
                      referrerPolicy="no-referrer"
                      onError={() => setImg1Error(true)}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-xs font-mono-tabular text-[#94a3b8] p-4 text-center">
                      [ARCHIVE PLATE #1894-B · CONCENTRIC APERTURE ANOMALY]
                    </div>
                  )}
                </div>
                <div>
                  <h4 className="text-base font-display font-semibold text-[#f3e5ab]">
                    Plate #1894-B — Founding Survey (Nov 1894)
                  </h4>
                  <p className="text-xs text-[#b8a78a] mt-1 leading-relaxed">
                    Dry-gelatin silver negative exposed during the construction of Nadir Observatory. Notice the faint double-ringed diffraction structure directly above the meridian peak—forty years before Director Vane’s disappearance.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded bg-[#120f0c] border border-[#8c6f44]/35 space-y-3">
                <div className="aspect-square w-full rounded overflow-hidden bg-[#080d18] border border-slate-800 flex items-center justify-center">
                  {!img2Error ? (
                    <img
                      src="/src/assets/images/plate_1924_vane_1793502242444.jpg"
                      alt="1924 Long-Exposure Star Trail Plate curving around a central dark void"
                      referrerPolicy="no-referrer"
                      onError={() => setImg2Error(true)}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-xs font-mono-tabular text-[#94a3b8] p-4 text-center">
                      [ARCHIVE PLATE #1924-X · LONG-EXPOSURE OCCULTATION]
                    </div>
                  )}
                </div>
                <div>
                  <h4 className="text-base font-display font-semibold text-[#f3e5ab]">
                    Plate #1924-X — Vane’s 6-Hour Exposure (Oct 1924)
                  </h4>
                  <p className="text-xs text-[#b8a78a] mt-1 leading-relaxed">
                    While all circumpolar stars trace concentric arcs as the Earth rotates, stars within four degrees of Nadir-IX bend around an optically black disc that refuses to rotate with the celestial sphere.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
