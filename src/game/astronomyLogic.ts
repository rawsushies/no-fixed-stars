export type CosmicStage = 1 | 2 | 3 | 4;

export type StationId = 'west' | 'east';

export type SceneId =
  | 'TITLE'
  | 'PROLOGUE'
  | 'EXTERIOR_DECK'
  | 'EAST_STATION'
  | 'TELESCOPE'
  | 'CHART_ROOM'
  | 'ANOMALY_FINALE';

export type TutorialStepId =
  | 'TUTORIAL_01'
  | 'TUTORIAL_02'
  | 'TUTORIAL_03'
  | 'TUTORIAL_04'
  | 'TUTORIAL_05'
  | 'TUTORIAL_06'
  | 'TUTORIAL_07'
  | 'TUTORIAL_08'
  | 'TUTORIAL_09'
  | 'TUTORIAL_10'
  | 'COMPLETED';

export type CinematicId =
  | 'PROLOGUE_1926'
  | 'ANOMALY_STAGE_2'
  | 'ANOMALY_STAGE_3'
  | 'REVELATION_STAGE_4';

export interface TutorialStepInfo {
  id: Exclude<TutorialStepId, 'COMPLETED'>;
  numberLabel: string;
  title: string;
  instruction: string;
  controlHint: string;
}

export interface WorldHotspot {
  id: string;
  scene: 'EXTERIOR_DECK' | 'EAST_STATION';
  /** Normalized horizontal position along the walkable deck [0.12 .. 0.88] */
  x: number;
  /** Normalized vertical anchor for prompt badge */
  y: number;
  label: string;
  actionLabel: string;
  shortTag: string;
}

export interface CatalogStar {
  id: string;
  designation: string;
  commonName: string;
  raBase: string;
  decBase: string;
  magnitude: number;
  spectralClass: string;
  /** Normalized field position [0.15 .. 0.85] */
  baseX: number;
  baseY: number;
  /** Optimal vernier focus setting [0 .. 100] */
  focalPlane: number;
  color: string;
  anomalyColor?: string;
  isAnomaly: boolean;
  notes: string;
  /** Displaced positions from West (-250m) and East (+250m) piers */
  westOffset: { dx: number; dy: number; ra: string; dec: string; angleDeg: number };
  eastOffset: { dx: number; dy: number; ra: string; dec: string; angleDeg: number };
}

export interface RecordedPlate {
  station: StationId;
  starId: string;
  starDesignation: string;
  timestamp: string;
  focusSharpness: number;
  observedX: number;
  observedY: number;
  raObserved: string;
  decObserved: string;
  zenithAngleDeg: number;
  isAnomaly: boolean;
}

export interface ExposureValidationResult {
  canExpose: boolean;
  isCentered: boolean;
  isSharp: boolean;
  sharpness: number;
  aimDistance: number;
  reason: string | null;
}

export interface ParallaxCalculationResult {
  starId: string;
  isAnomaly: boolean;
  canSolveAnomaly: boolean;
  angularDisplacementArcsec: number;
  angularDisplacementFormatted: string;
  parallaxAngleDeg: number;
  calculatedDistanceLabel: string;
  intersectionValid: boolean;
  isImpossibleGeometry: boolean;
  verdictTitle: string;
  verdictSummary: string;
  /** Normalized SVG coordinates for the triangulation diagram */
  intersectionPoint: { x: number; y: number };
}

export interface JournalDocument {
  id: string;
  title: string;
  date: string;
  author: string;
  locationFound: string;
  unlocked: boolean;
  excerpt: string;
  body: string[];
}

export interface GameSaveState {
  version: number;
  scene: SceneId;
  activeStation: StationId;
  cosmicStage: CosmicStage;
  /** Dr. E. Vance normalized horizontal position on the current deck [0.12 .. 0.88] */
  playerX: number;
  playerFacing: 'left' | 'right';
  hasMovedPlayer: boolean;
  prologueCompleted: boolean;
  journalOpenedOnce: boolean;
  tutorialDismissed: boolean;
  recordedPlates: {
    west: RecordedPlate | null;
    east: RecordedPlate | null;
  };
  inspectedStarIds: string[];
  unlockedDocIds: string[];
  chartPuzzleSolved: boolean;
  anomalyWitnessed: boolean;
  plumbLineInspected: boolean;
  eastBeaconAligned: boolean;
}

export const SAVE_STORAGE_KEY = 'no_fixed_stars_save_v1';

export const PROLOGUE_BEATS: {
  id: string;
  heading: string;
  caption: string;
  plateKey: 'sky' | 'observatory' | 'east_pier' | 'chart_room';
}[] = [
  {
    id: 'beat_1',
    heading: 'OCTOBER 28, 1926 · NADIR PLATEAU · ELEVATION 4,120 METRES',
    caption: 'Fourteen days ago, Observatory Director Julian Vane ceased all wireless transmissions from the summit.',
    plateKey: 'sky',
  },
  {
    id: 'beat_2',
    heading: 'MINISTRY OF ASTROMETRY — RELIEF DISPATCH',
    caption: 'You are Dr. E. Vance, meridian astronomer sent to assume custody of the high-altitude facility and complete the unfinished northern sky survey.',
    plateKey: 'observatory',
  },
  {
    id: 'beat_3',
    heading: 'THE FIVE-HUNDRED-METRE GRANITE BASELINE',
    caption: 'Two brass observation piers span the mountain ridge: the West Dome (−250 m) and the East Cliffside Transit Station (+250 m).',
    plateKey: 'east_pier',
  },
  {
    id: 'beat_4',
    heading: 'THE SEALED DOME & THE LAST GLASS PLATES',
    caption: 'The main dome was bolted from within. On the Chart Room comparator table, Vane’s final dry-gelatin plates remain uncatalogued.',
    plateKey: 'chart_room',
  },
  {
    id: 'beat_5',
    heading: 'MARGINALIA IN RED INK',
    caption: 'In the margin of the Sector IV meridian logbook, a single sentence is underlined three times: “Do not triangulate Nadir-IX.”',
    plateKey: 'observatory',
  },
];

export const TUTORIAL_STEPS: Record<Exclude<TutorialStepId, 'COMPLETED'>, TutorialStepInfo> = {
  TUTORIAL_01: {
    id: 'TUTORIAL_01',
    numberLabel: 'TUTORIAL 01 / 10',
    title: 'Traverse the Observatory Terrace',
    instruction: 'Move Dr. Vance across the stone observation deck using A / D, Left / Right Arrow keys, or by clicking along the terrace.',
    controlHint: 'Press [A] / [D] or [←] / [→] to walk',
  },
  TUTORIAL_02: {
    id: 'TUTORIAL_02',
    numberLabel: 'TUTORIAL 02 / 10',
    title: 'Approach the West Pier Telescope',
    instruction: 'Walk to the West Pier Telescope (−250 m) on the left side of the observatory deck and press E (or click the instrument) to look through the eyepiece.',
    controlHint: 'Stand near West Telescope + Press [E]',
  },
  TUTORIAL_03: {
    id: 'TUTORIAL_03',
    numberLabel: 'TUTORIAL 03 / 10',
    title: 'Center Object Nadir-IX in the Eyepiece',
    instruction: 'Select “The Wanderer (Object Nadir-IX)” in the Sector IV catalog or slew the telescope crosshair until the anomalous star is centered within the inner brass ring.',
    controlHint: 'Select Nadir-IX or Slew Crosshair',
  },
  TUTORIAL_04: {
    id: 'TUTORIAL_04',
    numberLabel: 'TUTORIAL 04 / 10',
    title: 'Rack the Brass Focus Vernier',
    instruction: 'Unlike fixed stars that focus at 62.0 mm, Nadir-IX lies at a deeper focal plane (74.0 mm). Adjust the Focus Vernier slider until optical sharpness exceeds 85%.',
    controlHint: 'Adjust Focus Vernier to 74.0 mm (≥85% Sharp)',
  },
  TUTORIAL_05: {
    id: 'TUTORIAL_05',
    numberLabel: 'TUTORIAL 05 / 10',
    title: 'Expose the First Photographic Plate',
    instruction: 'With Object Nadir-IX centered and sharp in the reticle, click “Record Observation (West Plate)” to expose Glass Plate W-09.',
    controlHint: 'Click Record Observation (West Plate)',
  },
  TUTORIAL_06: {
    id: 'TUTORIAL_06',
    numberLabel: 'TUTORIAL 06 / 10',
    title: 'Inspect the Meridian Field Journal',
    instruction: 'Press J (or click Journal in the upper-right) to review your recorded West Plate coordinates and Director Vane’s marginalia.',
    controlHint: 'Press [J] to open Field Journal',
  },
  TUTORIAL_07: {
    id: 'TUTORIAL_07',
    numberLabel: 'TUTORIAL 07 / 10',
    title: 'Walk to the East Cliffside Pier',
    instruction: 'Walk Dr. Vance to the far right edge of the Observation Deck (East Ridge Walkway) and press E to traverse the 500-metre ridge to the East Pier (+250 m).',
    controlHint: 'Walk right to East Ridge Path + Press [E]',
  },
  TUTORIAL_08: {
    id: 'TUTORIAL_08',
    numberLabel: 'TUTORIAL 08 / 10',
    title: 'Expose the Second Baseline Plate',
    instruction: 'Approach the East Pier Transit Instrument (+250 m), press E, center and focus Object Nadir-IX (74.0 mm), and record Glass Plate E-09.',
    controlHint: 'Expose East Plate E-09 at +250 m Pier',
  },
  TUTORIAL_09: {
    id: 'TUTORIAL_09',
    numberLabel: 'TUTORIAL 09 / 10',
    title: 'Enter the Astrometric Chart Room',
    instruction: 'With both West and East baseline plates recorded, approach the warm amber Chart Room Door and press E to access the Blink Comparator.',
    controlHint: 'Enter Chart Room + Open Blink Comparator',
  },
  TUTORIAL_10: {
    id: 'TUTORIAL_10',
    numberLabel: 'TUTORIAL 10 / 10',
    title: 'Superimpose Plates & Triangulate Parallax',
    instruction: 'Select Object Nadir-IX on the superimposed star chart and click “Plot Sightlines & Calculate Parallax” to solve the baseline convergence.',
    controlHint: 'Click Plot Sightlines & Calculate Parallax',
  },
};

export const WORLD_HOTSPOTS: WorldHotspot[] = [
  // Exterior Deck (West Station -250m)
  {
    id: 'WEST_TELESCOPE',
    scene: 'EXTERIOR_DECK',
    x: 0.24,
    y: 0.72,
    label: 'West Pier Equatorial Refractor (−250.0 m)',
    actionLabel: 'Look Through Eyepiece',
    shortTag: 'West Pier Telescope',
  },
  {
    id: 'CHART_ROOM_DOOR',
    scene: 'EXTERIOR_DECK',
    x: 0.54,
    y: 0.73,
    label: 'Astrometric Chart Room & Blink Comparator',
    actionLabel: 'Enter Chart Room',
    shortTag: 'Chart Room Door',
  },
  {
    id: 'PLUMB_LINE_PILLAR',
    scene: 'EXTERIOR_DECK',
    x: 0.70,
    y: 0.74,
    label: 'Meridian Plumb-Line Transit Pillar',
    actionLabel: 'Inspect Plumb-Bob',
    shortTag: 'Meridian Plumb-Line',
  },
  {
    id: 'EAST_RIDGE_PATH',
    scene: 'EXTERIOR_DECK',
    x: 0.84,
    y: 0.75,
    label: 'East Ridge Granite Walkway (+250.0 m →)',
    actionLabel: 'Traverse to East Pier',
    shortTag: 'East Cliffside Path →',
  },
  // East Cliffside Pier (East Station +250m)
  {
    id: 'WEST_RETURN_PATH',
    scene: 'EAST_STATION',
    x: 0.17,
    y: 0.75,
    label: 'West Ridge Return Path (← −250.0 m)',
    actionLabel: 'Return to West Deck',
    shortTag: '← West Deck Path',
  },
  {
    id: 'EAST_TELESCOPE',
    scene: 'EAST_STATION',
    x: 0.50,
    y: 0.71,
    label: 'East Cliffside Transit Telescope (+250.0 m)',
    actionLabel: 'Look Through Eyepiece',
    shortTag: 'East Pier Telescope',
  },
  {
    id: 'BASELINE_THEODOLITE',
    scene: 'EAST_STATION',
    x: 0.69,
    y: 0.73,
    label: '500m Baseline Optical Theodolite',
    actionLabel: 'Sight West Dome Beacon',
    shortTag: 'Baseline Theodolite',
  },
  {
    id: 'EAST_CHART_SHORTCUT',
    scene: 'EAST_STATION',
    x: 0.84,
    y: 0.75,
    label: 'Observatory Chart Room Annex',
    actionLabel: 'Enter Chart Room',
    shortTag: 'Chart Room Annex',
  },
];

export const CATALOG_STARS: CatalogStar[] = [
  {
    id: 'ALPHA_CYGNI',
    designation: 'HD 197345 · Alpha Cygni',
    commonName: 'Deneb',
    raBase: '20h 41m 25.9s',
    decBase: '+45° 16′ 49.0″',
    magnitude: 1.25,
    spectralClass: 'A2 Ia (White Supergiant)',
    baseX: 0.28,
    baseY: 0.34,
    focalPlane: 62,
    color: '#dce8ff',
    isAnomaly: false,
    notes: 'Primary meridional reference star. Zero measurable terrestrial baseline parallax.',
    westOffset: { dx: 0, dy: 0, ra: '20h 41m 25.9s', dec: '+45° 16′ 49.0″', angleDeg: -14.2 },
    eastOffset: { dx: 0, dy: 0, ra: '20h 41m 25.9s', dec: '+45° 16′ 49.0″', angleDeg: -14.2 },
  },
  {
    id: 'GAMMA_CYGNI',
    designation: 'HD 194093 · Gamma Cygni',
    commonName: 'Sadr',
    raBase: '20h 22m 13.7s',
    decBase: '+40° 15′ 24.0″',
    magnitude: 2.23,
    spectralClass: 'F8 Ib (Yellow-White Supergiant)',
    baseX: 0.39,
    baseY: 0.46,
    focalPlane: 62,
    color: '#f4efe0',
    isAnomaly: false,
    notes: 'Central vertex of the Northern Cross. Stable astrometric anchor.',
    westOffset: { dx: 0, dy: 0, ra: '20h 22m 13.7s', dec: '+40° 15′ 24.0″', angleDeg: -7.4 },
    eastOffset: { dx: 0, dy: 0, ra: '20h 22m 13.7s', dec: '+40° 15′ 24.0″', angleDeg: -7.4 },
  },
  {
    id: 'DELTA_CYGNI',
    designation: 'HD 186882 · Delta Cygni',
    commonName: 'Fawaris',
    raBase: '19h 44m 58.5s',
    decBase: '+45° 07′ 50.9″',
    magnitude: 2.87,
    spectralClass: 'B9.5 III (Blue-White Giant)',
    baseX: 0.27,
    baseY: 0.55,
    focalPlane: 62,
    color: '#cfe2ff',
    isAnomaly: false,
    notes: 'Triple star system on the western wing of Cygnus. Invariant across 500m baseline.',
    westOffset: { dx: 0, dy: 0, ra: '19h 44m 58.5s', dec: '+45° 07′ 50.9″', angleDeg: -15.0 },
    eastOffset: { dx: 0, dy: 0, ra: '19h 44m 58.5s', dec: '+45° 07′ 50.9″', angleDeg: -15.0 },
  },
  {
    id: 'EPSILON_CYGNI',
    designation: 'HD 197989 · Epsilon Cygni',
    commonName: 'Gienah',
    raBase: '20h 46m 12.6s',
    decBase: '+33° 58′ 12.9″',
    magnitude: 2.48,
    spectralClass: 'K0 III (Orange Giant)',
    baseX: 0.49,
    baseY: 0.59,
    focalPlane: 62,
    color: '#f2cfa0',
    isAnomaly: false,
    notes: 'Eastern wing reference anchor. Exhibited slight atmospheric extinction in Stage 3.',
    westOffset: { dx: 0, dy: 0, ra: '20h 46m 12.6s', dec: '+33° 58′ 12.9″', angleDeg: -0.8 },
    eastOffset: { dx: 0, dy: 0, ra: '20h 46m 12.6s', dec: '+33° 58′ 12.9″', angleDeg: -0.8 },
  },
  {
    id: 'NADIR_IX',
    designation: 'OBJECT NADIR-IX · [UNCATALOGUED]',
    commonName: 'The Wanderer',
    raBase: '20h 54m 00.0s',
    decBase: '+42° 09′ 00.0″',
    magnitude: 1.65,
    spectralClass: 'Non-Thermal Continuum (Violet/Amber Shift)',
    baseX: 0.54,
    baseY: 0.36,
    focalPlane: 74,
    color: '#e5b869',
    anomalyColor: '#b388eb',
    isAnomaly: true,
    notes: 'Absent from the 1855 Bonner Durchmusterung. Penciled into Director Vane’s margin with the warning: "DO NOT TRIANGULATE."',
    westOffset: {
      dx: -0.042,
      dy: 0.008,
      ra: '20h 48m 12.4s',
      dec: '+42° 04′ 18.0″',
      angleDeg: -2.15,
    },
    eastOffset: {
      dx: 0.042,
      dy: -0.008,
      ra: '20h 59m 47.6s',
      dec: '+42° 13′ 42.0″',
      angleDeg: 2.15,
    },
  },
  {
    id: 'SIGMA_NADIR',
    designation: 'HD 201091 · 61 Cygni',
    commonName: 'Bessel’s Star',
    raBase: '21h 06m 53.9s',
    decBase: '+38° 44′ 57.9″',
    magnitude: 5.2,
    spectralClass: 'K5 V (Orange Dwarf Binary)',
    baseX: 0.62,
    baseY: 0.53,
    focalPlane: 62,
    color: '#e8b98a',
    isAnomaly: false,
    notes: 'First star with measured annual heliocentric parallax (0.314″ over 2 AU). Over a 500m mountain baseline, shift is 0.000000″.',
    westOffset: { dx: 0, dy: 0, ra: '21h 06m 53.9s', dec: '+38° 44′ 57.9″', angleDeg: 6.8 },
    eastOffset: { dx: 0, dy: 0, ra: '21h 06m 53.9s', dec: '+38° 44′ 57.9″', angleDeg: 6.8 },
  },
  {
    id: 'BETA_LACERTAE',
    designation: 'HD 212496 · Beta Lacertae',
    commonName: 'Lacerta Borealis',
    raBase: '22h 23m 33.6s',
    decBase: '+52° 13′ 44.6″',
    magnitude: 4.42,
    spectralClass: 'G9 III (Yellow Giant)',
    baseX: 0.69,
    baseY: 0.28,
    focalPlane: 62,
    color: '#e8ecf7',
    isAnomaly: false,
    notes: 'High-declination boundary star bordering the northern meridian.',
    westOffset: { dx: 0, dy: 0, ra: '22h 23m 33.6s', dec: '+52° 13′ 44.6″', angleDeg: 11.4 },
    eastOffset: { dx: 0, dy: 0, ra: '22h 23m 33.6s', dec: '+52° 13′ 44.6″', angleDeg: 11.4 },
  },
  {
    id: 'ALPHA_LACERTAE',
    designation: 'HD 213558 · Alpha Lacertae',
    commonName: 'Stellio',
    raBase: '22h 31m 17.5s',
    decBase: '+50° 16′ 56.9″',
    magnitude: 3.76,
    spectralClass: 'A1 V (Main-Sequence White)',
    baseX: 0.75,
    baseY: 0.43,
    focalPlane: 62,
    color: '#dce8ff',
    isAnomaly: false,
    notes: 'Easternmost survey calibration star in Sector IV.',
    westOffset: { dx: 0, dy: 0, ra: '22h 31m 17.5s', dec: '+50° 16′ 56.9″', angleDeg: 14.8 },
    eastOffset: { dx: 0, dy: 0, ra: '22h 31m 17.5s', dec: '+50° 16′ 56.9″', angleDeg: 14.8 },
  },
];

export const INITIAL_DOCUMENTS: JournalDocument[] = [
  {
    id: 'DOC_ASSIGNMENT',
    title: 'Ministry of Astrometry — Dispatch Order #19',
    date: 'October 28, 1926',
    author: 'Royal Bureau of Meridians',
    locationFound: 'Carried on Arrival',
    unlocked: true,
    excerpt: 'Replace Director Julian Vane at Nadir Plateau (Elev. 4,120m) and complete Sector IV Baseline Survey.',
    body: [
      'TO: Dr. E. Vance, Relief Meridian Astronomer',
      'SUBJECT: Unfinished Dual-Baseline Survey at Nadir Observatory',
      'Director Julian Vane has failed to transmit his fortnightly telegraph dispatches since October 14. You are instructed to ascend to Nadir Plateau, assume custody of the West and East Baseline Piers (separated by exactly 500.0 meters of granite ridge), and expose the remaining calibration plates for Cygnus-Lacerta Sector IV.',
      'PROCEDURE: 1) Expose a focused photographic plate of the anomalous target from the West Pier Telescope. 2) Traverse the ridge walkway to the East Pier Station and expose a second plate of the same object. 3) Compare both plates on the Chart Room Blink Comparator and plot their baseline sightlines.',
    ],
  },
  {
    id: 'DOC_VANE_NOTE_1',
    title: 'Director Vane’s Marginalia — Meridian Logbook',
    date: 'October 14, 1926',
    author: 'Director Julian Vane',
    locationFound: 'West Pier Telescope Desk',
    unlocked: true,
    excerpt: 'Even the nearest star in the heavens shows zero parallax across five hundred meters of rock. Why does Nadir-IX shift by four degrees?',
    body: [
      'October 14, 02:15 Sidereal Time.',
      'I have scrubbed the brass verniers three times with spirits. When Friedrich Bessel measured 61 Cygni in 1838, he required the entire diameter of Earth’s orbit—three hundred million kilometers—to detect a shift of one-third of one arcsecond.',
      'Our West Pier and East Pier are separated by five hundred meters of mountain granite. No star in the firmament can shift across a 500-meter baseline. Yet Object Nadir-IX (RA 20h 54m, DEC +42° 09′) changes its position against Deneb and Sadr whenever I walk from the West Pier to the East Cliff.',
      'Note on optics: Nadir-IX does not focus at the infinite focal plane (62.0 mm) like the true stars. You must rack the focus dial deeper—near 74.0 mm—before its rings resolve.',
    ],
  },
  {
    id: 'DOC_PLUMB_LINE',
    title: 'Geodetic Anomaly Report — The Plumb Line',
    date: 'October 19, 1926',
    author: 'Director Julian Vane',
    locationFound: 'Observatory Deck Meridian Pillar',
    unlocked: false,
    excerpt: 'The lead plumb-bob no longer hangs toward the center of the Earth. It leans 0.4 degrees toward the zenith.',
    body: [
      'October 19, 04:00 Sidereal Time.',
      'A surveyor trusts two things: the fixed stars and gravity. Tonight both lied.',
      'When the clouds parted below Cygnus, the brass plumb-bob suspended inside the meridian transit pillar deflected upward—not toward the mountain mass, but toward the azimuth of Nadir-IX.',
      'As if the sky above Nadir Plateau possesses mass. Or appetite.',
    ],
  },
  {
    id: 'DOC_EAST_PIER_LOG',
    title: 'Torn Field Leaf — East Cliffside Pier',
    date: 'October 24, 1926',
    author: 'Director Julian Vane',
    locationFound: 'East Pier Transit Housing',
    unlocked: false,
    excerpt: 'It is not parallax. Parallax shifts an object backward against the background. This shifts forward.',
    body: [
      'October 24, Midnight.',
      'When you step right, a nearby lantern appears to shift left against the distant mountains. That is ordinary geometric parallax.',
      'Tonight I carried the chronometer to the East Pier (+250m). Object Nadir-IX did not shift West. It shifted East—by more than four degrees.',
      'If you draw the sightlines from both piers, they do not converge in the heavens. They cross behind the observer’s eyes. A star should not move when you move. Unless it is pivoting to keep you in its focal plane.',
    ],
  },
  {
    id: 'DOC_FINAL_REVELATION',
    title: 'Unsent Telegraph Draft — Chart Room Drawer',
    date: 'October 27, 1926',
    author: 'Director Julian Vane',
    locationFound: 'Chart Room Triangulation Table',
    unlocked: false,
    excerpt: 'We did not build the telescope to look at it. It built the sky to look through our telescope.',
    body: [
      'DO NOT TRANSMIT TO THE MINISTRY.',
      'I overlaid Plate W-09 and Plate E-09 on the blink comparator. Every star in Cygnus is a painted pinhole on a membrane less than two kilometers above the plateau.',
      'Nadir-IX is the pupil. When you align both sightlines, the aperture knows you have solved its distance. Do not go back outside once the comparator locks. The clouds are not water vapor.',
    ],
  },
];

/**
 * Returns the observed position of a star from a given observation station.
 */
export function getObservedStarPosition(
  star: CatalogStar,
  station: StationId
): {
  x: number;
  y: number;
  ra: string;
  dec: string;
  angleDeg: number;
} {
  const offset = station === 'west' ? star.westOffset : star.eastOffset;
  return {
    x: Number((star.baseX + offset.dx).toFixed(4)),
    y: Number((star.baseY + offset.dy).toFixed(4)),
    ra: offset.ra,
    dec: offset.dec,
    angleDeg: offset.angleDeg,
  };
}

/**
 * Calculates optical sharpness [0..1] based on current focus dial vs star's focal plane.
 * Sharpness >= 0.85 is considered "in focus" for exposing a photographic plate.
 */
export function calculateOpticalSharpness(
  focusSetting: number,
  starFocalPlane: number
): number {
  const distance = Math.abs(focusSetting - starFocalPlane);
  const sharpness = Math.max(0, 1 - distance / 28);
  return Number(sharpness.toFixed(3));
}

/**
 * Strictly validates whether a photographic plate can be exposed right now without auto-snapping.
 * Requires the target star to be centered within tolerance (<= 0.065) AND focused (>= 0.85).
 */
export function validatePlateExposure(
  aimX: number,
  aimY: number,
  focusSetting: number,
  star: CatalogStar,
  station: StationId
): ExposureValidationResult {
  const pos = getObservedStarPosition(star, station);
  const aimDistance = Number(Math.hypot(aimX - pos.x, aimY - pos.y).toFixed(4));
  const sharpness = calculateOpticalSharpness(focusSetting, star.focalPlane);
  const isCentered = aimDistance <= 0.065;
  const isSharp = sharpness >= 0.85;

  if (!isCentered && !isSharp) {
    return {
      canExpose: false,
      isCentered,
      isSharp,
      sharpness,
      aimDistance,
      reason: `Target ${star.commonName} is neither centered in the reticle nor focused. Slew the crosshair onto the star and rack the Focus Vernier to ${star.focalPlane.toFixed(1)} mm.`,
    };
  }
  if (!isCentered) {
    return {
      canExpose: false,
      isCentered,
      isSharp,
      sharpness,
      aimDistance,
      reason: `Target ${star.commonName} is outside the inner astrometric reticle ring. Click the star in the eyepiece or use the Slew controls to center it before exposing a glass plate.`,
    };
  }
  if (!isSharp) {
    return {
      canExpose: false,
      isCentered,
      isSharp,
      sharpness,
      aimDistance,
      reason: `Optical image is defocused (${Math.round(sharpness * 100)}% sharpness). Adjust the Focus Vernier slider toward ${star.focalPlane.toFixed(1)} mm until sharpness reaches at least 85%.`,
    };
  }

  return {
    canExpose: true,
    isCentered: true,
    isSharp: true,
    sharpness,
    aimDistance,
    reason: null,
  };
}

/**
 * Finds the nearest star within a given normalized selection radius in the telescope field.
 */
export function findNearestStarInField(
  aimX: number,
  aimY: number,
  station: StationId,
  maxRadius = 0.065
): { star: CatalogStar; distance: number; observedX: number; observedY: number } | null {
  let best: { star: CatalogStar; distance: number; observedX: number; observedY: number } | null =
    null;

  for (const star of CATALOG_STARS) {
    const pos = getObservedStarPosition(star, station);
    const dist = Math.hypot(aimX - pos.x, aimY - pos.y);
    if (dist <= maxRadius && (!best || dist < best.distance)) {
      best = {
        star,
        distance: Number(dist.toFixed(4)),
        observedX: pos.x,
        observedY: pos.y,
      };
    }
  }

  return best;
}

/**
 * Checks whether both West and East baseline plates of Object Nadir-IX have been recorded.
 */
export function hasBothAnomalyPlates(
  westPlate: RecordedPlate | null,
  eastPlate: RecordedPlate | null
): boolean {
  return westPlate?.isAnomaly === true && eastPlate?.isAnomaly === true;
}

/**
 * Evaluates the two recorded photographic plates and computes the baseline sightline intersection.
 * Requires both West and East anomaly plates to be recorded before the anomaly triangulation can be solved.
 */
export function calculateParallaxIntersection(
  starId: string,
  westPlate: RecordedPlate | null,
  eastPlate: RecordedPlate | null
): ParallaxCalculationResult {
  const star = CATALOG_STARS.find((s) => s.id === starId) ?? CATALOG_STARS[0];

  if (!star.isAnomaly) {
    return {
      starId: star.id,
      isAnomaly: false,
      canSolveAnomaly: false,
      angularDisplacementArcsec: 0,
      angularDisplacementFormatted: '0° 00′ 00.00″',
      parallaxAngleDeg: 0,
      calculatedDistanceLabel: '> 10¹³ km (Parallel Rays / Fixed Star)',
      intersectionValid: true,
      isImpossibleGeometry: false,
      verdictTitle: 'Normal Stellar Invariance Confirmed',
      verdictSummary: `${star.commonName} (${star.designation}) exhibits zero measurable displacement across the 500.0m Nadir baseline. Sightlines from West and East piers are parallel within 0.0001 arcseconds.`,
      intersectionPoint: { x: 0.5, y: 0.04 },
    };
  }

  const bothRecorded = hasBothAnomalyPlates(westPlate, eastPlate);
  if (!bothRecorded) {
    const missingLabel =
      !westPlate?.isAnomaly && !eastPlate?.isAnomaly
        ? 'both Plate W-09 (West Pier −250 m) and Plate E-09 (East Pier +250 m)'
        : !westPlate?.isAnomaly
          ? 'Plate W-09 at the West Pier (−250 m)'
          : 'Plate E-09 at the East Cliffside Pier (+250 m)';

    return {
      starId: star.id,
      isAnomaly: true,
      canSolveAnomaly: false,
      angularDisplacementArcsec: 0,
      angularDisplacementFormatted: 'INCOMPLETE BASELINE',
      parallaxAngleDeg: 0,
      calculatedDistanceLabel: 'REQUIRES DUAL-PIER PLATES (W-09 & E-09)',
      intersectionValid: false,
      isImpossibleGeometry: false,
      verdictTitle: 'INSUFFICIENT BASELINE DATA — MISSING PHOTOGRAPHIC PLATE',
      verdictSummary: `Cannot triangulate Object Nadir-IX from a single station. Expose ${missingLabel} so both sightlines across the 500.0-metre granite baseline can be plotted.`,
      intersectionPoint: { x: 0.5, y: 0.5 },
    };
  }

  // Use the actual recorded plate zenith angles
  const westAngle = westPlate!.zenithAngleDeg;
  const eastAngle = eastPlate!.zenithAngleDeg;
  const deltaDeg = Number((eastAngle - westAngle).toFixed(2)); // +4.30 degrees (inverted!)
  const arcsec = Math.round(Math.abs(deltaDeg) * 3600);

  return {
    starId: star.id,
    isAnomaly: true,
    canSolveAnomaly: true,
    angularDisplacementArcsec: arcsec,
    angularDisplacementFormatted: `4° 18′ 12.0″ [INVERTED · W ${westAngle}° / E +${eastAngle}°]`,
    parallaxAngleDeg: Number((-deltaDeg / 2).toFixed(2)),
    calculatedDistanceLabel: '−1.84 km (NEGATIVE PARALLAX · SUB-DOME CONVERGENCE)',
    intersectionValid: true,
    isImpossibleGeometry: true,
    verdictTitle: 'IMPOSSIBLE PARALLAX DETECTED — NEGATIVE CONVERGENCE',
    verdictSummary: `Using recorded plates W-09 (${westPlate!.raObserved}, ${westAngle}°) and E-09 (${eastPlate!.raObserved}, +${eastAngle}°), Object Nadir-IX shifted +${deltaDeg}° in the direction of observer motion. Rather than converging in deep space, the sightlines intersect 1.84 km BELOW the celestial sphere—tracking the observer directly.`,
    intersectionPoint: { x: 0.5, y: 0.68 },
  };
}

/**
 * Computes the nearest interactive hotspot in the current scene if Dr. Vance is within interaction range.
 */
export function findNearbyHotspot(
  scene: SceneId,
  playerX: number,
  maxDistance = 0.075
): WorldHotspot | null {
  if (scene !== 'EXTERIOR_DECK' && scene !== 'EAST_STATION') return null;
  let closest: { hotspot: WorldHotspot; dist: number } | null = null;
  for (const h of WORLD_HOTSPOTS) {
    if (h.scene !== scene) continue;
    const dist = Math.abs(playerX - h.x);
    if (dist <= maxDistance && (!closest || dist < closest.dist)) {
      closest = { hotspot: h, dist };
    }
  }
  return closest ? closest.hotspot : null;
}

/**
 * Derives the active contextual tutorial step (TUTORIAL_01 .. TUTORIAL_10 or COMPLETED).
 */
export function deriveActiveTutorialStep(
  state: GameSaveState,
  uiContext: {
    isTelescopeOpen: boolean;
    selectedStarId?: string;
    isCentered?: boolean;
    isSharp?: boolean;
  }
): TutorialStepId {
  if (state.chartPuzzleSolved) {
    return 'COMPLETED';
  }

  const hasWestAnomaly = state.recordedPlates.west?.isAnomaly === true;
  const hasEastAnomaly = state.recordedPlates.east?.isAnomaly === true;

  // Step 1-5: West Pier observation flow
  if (!hasWestAnomaly) {
    if (!uiContext.isTelescopeOpen) {
      if (!state.hasMovedPlayer) {
        return 'TUTORIAL_01';
      }
      return 'TUTORIAL_02';
    }
    // Inside West Telescope
    if (uiContext.selectedStarId !== 'NADIR_IX' || !uiContext.isCentered) {
      return 'TUTORIAL_03';
    }
    if (!uiContext.isSharp) {
      return 'TUTORIAL_04';
    }
    return 'TUTORIAL_05';
  }

  // Step 6: Open Journal once after recording West Plate
  if (!state.journalOpenedOnce) {
    return 'TUTORIAL_06';
  }

  // Step 7-8: Traverse to East Pier & expose East Plate
  if (!hasEastAnomaly) {
    if (state.scene !== 'EAST_STATION' && !uiContext.isTelescopeOpen) {
      return 'TUTORIAL_07';
    }
    return 'TUTORIAL_08';
  }

  // Step 9-10: Enter Chart Room & Triangulate
  if (state.scene !== 'CHART_ROOM') {
    return 'TUTORIAL_09';
  }

  return 'TUTORIAL_10';
}

/**
 * Returns the persistent "CURRENT INVESTIGATION" summary shown in the top-left HUD and Journal.
 */
export function getCurrentInvestigationObjective(state: GameSaveState): {
  phaseLabel: string;
  headline: string;
  detail: string;
} {
  const hasWest = state.recordedPlates.west?.isAnomaly === true;
  const hasEast = state.recordedPlates.east?.isAnomaly === true;

  if (!hasWest) {
    return {
      phaseLabel: 'OBJECTIVE 01 / 04',
      headline: 'Expose West Pier Plate of Object Nadir-IX (−250 m)',
      detail: 'Walk Dr. Vance to the West Pier Equatorial Telescope, focus on The Wanderer (74.0 mm), and expose Glass Plate W-09.',
    };
  }
  if (!hasEast) {
    return {
      phaseLabel: 'OBJECTIVE 02 / 04',
      headline: 'Traverse to East Cliffside Pier & Expose Plate E-09 (+250 m)',
      detail: 'Walk east along the granite ridge path to the East Pier (+250 m) and record the second baseline observation of Object Nadir-IX.',
    };
  }
  if (!state.chartPuzzleSolved) {
    return {
      phaseLabel: 'OBJECTIVE 03 / 04',
      headline: 'Superimpose Both Plates in the Chart Room',
      detail: 'Enter the Astrometric Chart Room, overlay Plates W-09 and E-09 on the Blink Comparator, and calculate the baseline parallax.',
    };
  }
  return {
    phaseLabel: 'OBJECTIVE 04 / 04',
    headline: 'Step Outside & Witness the Stage IV Sky Transformation',
    detail: 'Pan the firmament above Nadir Plateau and observe how Object Nadir-IX remains locked to your gaze.',
  };
}

/**
 * Computes the appropriate CosmicStage (1..4) from current investigation milestones.
 */
export function deriveCosmicStage(state: {
  inspectedStarIds: string[];
  westPlate: RecordedPlate | null;
  eastPlate: RecordedPlate | null;
  chartPuzzleSolved: boolean;
}): CosmicStage {
  if (state.chartPuzzleSolved) {
    return 4;
  }
  const hasWestAnomaly = state.westPlate?.isAnomaly === true;
  const hasEastAnomaly = state.eastPlate?.isAnomaly === true;
  if (hasWestAnomaly && hasEastAnomaly) {
    return 3;
  }
  if (
    hasWestAnomaly ||
    hasEastAnomaly ||
    state.inspectedStarIds.includes('NADIR_IX')
  ) {
    return 2;
  }
  return 1;
}

export function createInitialGameState(autostart = false): GameSaveState {
  return {
    version: 1,
    scene: autostart ? 'EXTERIOR_DECK' : 'TITLE',
    activeStation: 'west',
    cosmicStage: 1,
    playerX: 0.38,
    playerFacing: 'left',
    hasMovedPlayer: false,
    prologueCompleted: autostart,
    journalOpenedOnce: false,
    tutorialDismissed: false,
    recordedPlates: {
      west: null,
      east: null,
    },
    inspectedStarIds: [],
    unlockedDocIds: ['DOC_ASSIGNMENT', 'DOC_VANE_NOTE_1'],
    chartPuzzleSolved: false,
    anomalyWitnessed: false,
    plumbLineInspected: false,
    eastBeaconAligned: false,
  };
}

export function serializeGameState(state: GameSaveState): string {
  return JSON.stringify(state);
}

export function deserializeGameState(
  raw: string | null,
  autostart = false
): GameSaveState {
  const fallback = createInitialGameState(autostart);
  if (!raw) return fallback;
  try {
    const parsed = JSON.parse(raw) as Partial<GameSaveState>;
    if (typeof parsed !== 'object' || parsed === null || parsed.version !== 1) {
      return fallback;
    }
    const cosmicStage =
      parsed.cosmicStage === 1 ||
      parsed.cosmicStage === 2 ||
      parsed.cosmicStage === 3 ||
      parsed.cosmicStage === 4
        ? parsed.cosmicStage
        : 1;

    return {
      ...fallback,
      ...parsed,
      scene:
        autostart && (parsed.scene === 'TITLE' || parsed.scene === 'PROLOGUE')
          ? 'EXTERIOR_DECK'
          : (parsed.scene ?? fallback.scene),
      cosmicStage,
      playerX:
        typeof parsed.playerX === 'number'
          ? Math.max(0.12, Math.min(0.88, parsed.playerX))
          : fallback.playerX,
      playerFacing:
        parsed.playerFacing === 'left' || parsed.playerFacing === 'right'
          ? parsed.playerFacing
          : fallback.playerFacing,
      hasMovedPlayer: Boolean(parsed.hasMovedPlayer),
      prologueCompleted: autostart ? true : Boolean(parsed.prologueCompleted),
      journalOpenedOnce: Boolean(parsed.journalOpenedOnce),
      tutorialDismissed: Boolean(parsed.tutorialDismissed),
      recordedPlates: {
        west: parsed.recordedPlates?.west ?? null,
        east: parsed.recordedPlates?.east ?? null,
      },
      inspectedStarIds: Array.isArray(parsed.inspectedStarIds)
        ? parsed.inspectedStarIds
        : [],
      unlockedDocIds: Array.isArray(parsed.unlockedDocIds)
        ? parsed.unlockedDocIds
        : fallback.unlockedDocIds,
    };
  } catch {
    return fallback;
  }
}
