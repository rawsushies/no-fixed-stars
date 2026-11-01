import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  CATALOG_STARS,
  getObservedStarPosition,
  calculateOpticalSharpness,
  validatePlateExposure,
  findNearestStarInField,
  calculateParallaxIntersection,
  deriveCosmicStage,
  deriveActiveTutorialStep,
  findNearbyHotspot,
  createInitialGameState,
  serializeGameState,
  deserializeGameState,
  type RecordedPlate,
} from './astronomyLogic';

describe('NO FIXED STARS — Astrometric & Cosmic Anomaly Logic (Milestone 02)', () => {
  it('keeps ordinary catalog stars invariant across the 500m West/East baseline', () => {
    const deneb = CATALOG_STARS.find((s) => s.id === 'ALPHA_CYGNI')!;
    const west = getObservedStarPosition(deneb, 'west');
    const east = getObservedStarPosition(deneb, 'east');

    assert.equal(west.x, east.x);
    assert.equal(west.y, east.y);
    assert.equal(west.ra, east.ra);
    assert.equal(west.angleDeg, east.angleDeg);
  });

  it('displaces Object Nadir-IX (The Wanderer) in inverted direction across West and East stations', () => {
    const nadir = CATALOG_STARS.find((s) => s.id === 'NADIR_IX')!;
    const west = getObservedStarPosition(nadir, 'west');
    const east = getObservedStarPosition(nadir, 'east');

    assert.notEqual(west.x, east.x);
    assert.ok(east.x > west.x, 'Anomaly shifts East when observer moves East (negative parallax)');
    assert.equal(west.angleDeg, -2.15);
    assert.equal(east.angleDeg, 2.15);
  });

  it('computes optical sharpness peaking at 1.0 when focus vernier matches star focalPlane', () => {
    const nadir = CATALOG_STARS.find((s) => s.id === 'NADIR_IX')!;
    const exact = calculateOpticalSharpness(74, nadir.focalPlane);
    const slightOff = calculateOpticalSharpness(71, nadir.focalPlane);
    const farOff = calculateOpticalSharpness(40, nadir.focalPlane);

    assert.equal(exact, 1);
    assert.ok(slightOff >= 0.85, 'Within 3mm should still be sharp enough to expose plate');
    assert.equal(farOff, 0);
  });

  it('strictly validates telescope plate exposure without auto-centering or auto-focusing', () => {
    const nadir = CATALOG_STARS.find((s) => s.id === 'NADIR_IX')!;
    const westPos = getObservedStarPosition(nadir, 'west');

    // Off-center and defocused
    const badBoth = validatePlateExposure(0.2, 0.2, 50, nadir, 'west');
    assert.equal(badBoth.canExpose, false);
    assert.equal(badBoth.isCentered, false);
    assert.equal(badBoth.isSharp, false);

    // Centered but defocused (at 62mm instead of 74mm)
    const badFocus = validatePlateExposure(westPos.x, westPos.y, 60, nadir, 'west');
    assert.equal(badFocus.canExpose, false);
    assert.equal(badFocus.isCentered, true);
    assert.equal(badFocus.isSharp, false);

    // Centered and focused at 74mm
    const valid = validatePlateExposure(westPos.x, westPos.y, 74, nadir, 'west');
    assert.equal(valid.canExpose, true);
    assert.equal(valid.isCentered, true);
    assert.equal(valid.isSharp, true);
  });

  it('finds the nearest star in the telescope field within tolerance', () => {
    const nadir = CATALOG_STARS.find((s) => s.id === 'NADIR_IX')!;
    const westPos = getObservedStarPosition(nadir, 'west');

    const hit = findNearestStarInField(westPos.x + 0.01, westPos.y - 0.01, 'west', 0.065);
    assert.ok(hit !== null);
    assert.equal(hit?.star.id, 'NADIR_IX');

    const miss = findNearestStarInField(0.02, 0.02, 'west', 0.05);
    assert.equal(miss, null);
  });

  it('requires BOTH West and East anomaly plates before solving Nadir-IX triangulation', () => {
    const normalRes = calculateParallaxIntersection('ALPHA_CYGNI', null, null);
    assert.equal(normalRes.isImpossibleGeometry, false);
    assert.equal(normalRes.angularDisplacementArcsec, 0);

    const mockWestPlate: RecordedPlate = {
      station: 'west',
      starId: 'NADIR_IX',
      starDesignation: 'The Wanderer',
      timestamp: '02:18 ST',
      focusSharpness: 0.96,
      observedX: 0.498,
      observedY: 0.368,
      raObserved: '20h 48m 12.4s',
      decObserved: '+42° 04′ 18.0″',
      zenithAngleDeg: -2.15,
      isAnomaly: true,
    };

    // Missing East plate -> cannot solve anomaly yet
    const incompleteRes = calculateParallaxIntersection('NADIR_IX', mockWestPlate, null);
    assert.equal(incompleteRes.canSolveAnomaly, false);
    assert.equal(incompleteRes.isImpossibleGeometry, false);

    const mockEastPlate: RecordedPlate = {
      ...mockWestPlate,
      station: 'east',
      observedX: 0.582,
      observedY: 0.352,
      raObserved: '20h 59m 47.6s',
      decObserved: '+42° 13′ 42.0″',
      zenithAngleDeg: 2.15,
    };

    const solvedRes = calculateParallaxIntersection('NADIR_IX', mockWestPlate, mockEastPlate);
    assert.equal(solvedRes.canSolveAnomaly, true);
    assert.equal(solvedRes.isImpossibleGeometry, true);
    assert.ok(solvedRes.angularDisplacementArcsec > 15000);
  });

  it('advances CosmicStage 1 -> 2 -> 3 -> 4 and progresses through Tutorial 01..10', () => {
    const state = createInitialGameState(true);
    assert.equal(deriveActiveTutorialStep(state, { isTelescopeOpen: false }), 'TUTORIAL_01');

    state.hasMovedPlayer = true;
    assert.equal(deriveActiveTutorialStep(state, { isTelescopeOpen: false }), 'TUTORIAL_02');
    assert.equal(
      deriveActiveTutorialStep(state, {
        isTelescopeOpen: true,
        selectedStarId: 'ALPHA_CYGNI',
        isCentered: true,
        isSharp: true,
      }),
      'TUTORIAL_03'
    );
    assert.equal(
      deriveActiveTutorialStep(state, {
        isTelescopeOpen: true,
        selectedStarId: 'NADIR_IX',
        isCentered: true,
        isSharp: false,
      }),
      'TUTORIAL_04'
    );
    assert.equal(
      deriveActiveTutorialStep(state, {
        isTelescopeOpen: true,
        selectedStarId: 'NADIR_IX',
        isCentered: true,
        isSharp: true,
      }),
      'TUTORIAL_05'
    );

    const westPlate: RecordedPlate = {
      station: 'west',
      starId: 'NADIR_IX',
      starDesignation: 'OBJECT NADIR-IX',
      timestamp: '02:15',
      focusSharpness: 0.98,
      observedX: 0.498,
      observedY: 0.368,
      raObserved: '20h 48m 12.4s',
      decObserved: '+42° 04′ 18.0″',
      zenithAngleDeg: -2.15,
      isAnomaly: true,
    };
    state.recordedPlates.west = westPlate;
    assert.equal(deriveActiveTutorialStep(state, { isTelescopeOpen: false }), 'TUTORIAL_06');

    state.journalOpenedOnce = true;
    assert.equal(deriveActiveTutorialStep(state, { isTelescopeOpen: false }), 'TUTORIAL_07');

    state.scene = 'EAST_STATION';
    assert.equal(deriveActiveTutorialStep(state, { isTelescopeOpen: false }), 'TUTORIAL_08');

    const eastPlate: RecordedPlate = { ...westPlate, station: 'east', zenithAngleDeg: 2.15 };
    state.recordedPlates.east = eastPlate;
    assert.equal(deriveActiveTutorialStep(state, { isTelescopeOpen: false }), 'TUTORIAL_09');

    state.scene = 'CHART_ROOM';
    assert.equal(deriveActiveTutorialStep(state, { isTelescopeOpen: false }), 'TUTORIAL_10');

    state.chartPuzzleSolved = true;
    assert.equal(deriveActiveTutorialStep(state, { isTelescopeOpen: false }), 'COMPLETED');
    assert.equal(
      deriveCosmicStage({
        inspectedStarIds: ['NADIR_IX'],
        westPlate,
        eastPlate,
        chartPuzzleSolved: true,
      }),
      4
    );
  });

  it('detects proximity to world hotspots and preserves save state across serialization', () => {
    const nearWestScope = findNearbyHotspot('EXTERIOR_DECK', 0.24);
    assert.equal(nearWestScope?.id, 'WEST_TELESCOPE');

    const initial = createInitialGameState(true);
    initial.cosmicStage = 3;
    initial.playerX = 0.68;
    initial.plumbLineInspected = true;

    const raw = serializeGameState(initial);
    const restored = deserializeGameState(raw, false);

    assert.equal(restored.cosmicStage, 3);
    assert.equal(restored.playerX, 0.68);
    assert.equal(restored.plumbLineInspected, true);
  });
});
