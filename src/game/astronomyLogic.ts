export type CosmicStage = 1 | 2 | 3 | 4;

export type StationId = 'west' | 'east';

export type SceneId =
  | 'TITLE'
  | 'EXTERIOR_DECK'
  | 'EAST_STATION'
  | 'TELESCOPE'
  | 'CHART_ROOM'
  | 'ANOMALY_FINALE';

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

export interface ParallaxCalculationResult {
  starId: string;
  isAnomaly: boolean;
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
 * Evaluates the two recorded photographic plates and computes the baseline sightline intersection.
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

  // Nadir-IX anomaly calculation
  const westAngle = westPlate?.zenithAngleDeg ?? star.westOffset.angleDeg;
  const eastAngle = eastPlate?.zenithAngleDeg ?? star.eastOffset.angleDeg;
  const deltaDeg = eastAngle - westAngle; // +4.30 degrees (inverted!)
  const arcsec = Math.round(Math.abs(deltaDeg) * 3600);

  return {
    starId: star.id,
    isAnomaly: true,
    angularDisplacementArcsec: arcsec,
    angularDisplacementFormatted: '4° 18′ 12.0″ [INVERTED]',
    parallaxAngleDeg: -2.15,
    calculatedDistanceLabel: '−1.84 km (NEGATIVE PARALLAX · SUB-DOME CONVERGENCE)',
    intersectionValid: true,
    isImpossibleGeometry: true,
    verdictTitle: 'IMPOSSIBLE PARALLAX DETECTED — NEGATIVE CONVERGENCE',
    verdictSummary:
      'Across the 500m baseline, Object Nadir-IX shifted +4° 18′ 12″ in the direction of observer motion. Rather than converging in deep space, the West and East sightlines diverge upward and intersect 1.84 km BELOW the celestial sphere—tracking the observer directly.',
    intersectionPoint: { x: 0.5, y: 0.68 },
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
      scene: autostart && parsed.scene === 'TITLE' ? 'EXTERIOR_DECK' : (parsed.scene ?? fallback.scene),
      cosmicStage,
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
