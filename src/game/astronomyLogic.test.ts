import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CATALOG_STARS,
  getObservedStarPosition,
  calculateOpticalSharpness,
  findNearestStarInField,
  calculateParallaxIntersection,
  deriveCosmicStage,
  createInitialGameState,
  serializeGameState,
  deserializeGameState,
  type RecordedPlate,
} from './astronomyLogic';

test('fixed catalog stars have identical positions at West and East observation stations', () => {
  const deneb = CATALOG_STARS.find((s) => s.id === 'ALPHA_CYGNI');
  assert.ok(deneb);
  const westPos = getObservedStarPosition(deneb, 'west');
  const eastPos = getObservedStarPosition(deneb, 'east');
  assert.equal(westPos.x, eastPos.x);
  assert.equal(westPos.y, eastPos.y);
  assert.equal(westPos.ra, eastPos.ra);
});

test('anomalous star NADIR_IX exhibits deterministic displacement between West and East stations', () => {
  const nadir = CATALOG_STARS.find((s) => s.id === 'NADIR_IX');
  assert.ok(nadir);
  const westPos = getObservedStarPosition(nadir, 'west');
  const eastPos = getObservedStarPosition(nadir, 'east');
  assert.notEqual(westPos.x, eastPos.x);
  assert.ok(eastPos.x > westPos.x, 'East station shifts Nadir-IX eastward (impossible negative parallax)');
  assert.equal(westPos.angleDeg, -2.15);
  assert.equal(eastPos.angleDeg, 2.15);
});

test('optical sharpness peaks at the star focal plane and drops off smoothly', () => {
  const sharpAt74 = calculateOpticalSharpness(74, 74);
  assert.equal(sharpAt74, 1);

  const slightOffset = calculateOpticalSharpness(71, 74);
  assert.ok(slightOffset >= 0.85, 'Within 3 units of focal plane remains sharp enough for exposure');

  const blurry = calculateOpticalSharpness(30, 74);
  assert.equal(blurry, 0);
});

test('findNearestStarInField locks onto Nadir-IX at station-specific coordinates', () => {
  const nadir = CATALOG_STARS.find((s) => s.id === 'NADIR_IX')!;
  const westPos = getObservedStarPosition(nadir, 'west');

  const foundWest = findNearestStarInField(westPos.x + 0.01, westPos.y - 0.01, 'west');
  assert.ok(foundWest);
  assert.equal(foundWest.star.id, 'NADIR_IX');
});

test('deriveCosmicStage progresses cleanly through Stages 1, 2, 3, and 4', () => {
  const mockPlate = (station: 'west' | 'east', isAnomaly: boolean): RecordedPlate => ({
    station,
    starId: isAnomaly ? 'NADIR_IX' : 'ALPHA_CYGNI',
    starDesignation: isAnomaly ? 'OBJECT NADIR-IX' : 'Deneb',
    timestamp: '02:15 ST',
    focusSharpness: 0.96,
    observedX: 0.5,
    observedY: 0.36,
    raObserved: '20h 54m',
    decObserved: '+42° 09′',
    zenithAngleDeg: station === 'west' ? -2.15 : 2.15,
    isAnomaly,
  });

  assert.equal(
    deriveCosmicStage({
      inspectedStarIds: [],
      westPlate: null,
      eastPlate: null,
      chartPuzzleSolved: false,
    }),
    1
  );

  assert.equal(
    deriveCosmicStage({
      inspectedStarIds: ['NADIR_IX'],
      westPlate: null,
      eastPlate: null,
      chartPuzzleSolved: false,
    }),
    2
  );

  assert.equal(
    deriveCosmicStage({
      inspectedStarIds: ['NADIR_IX'],
      westPlate: mockPlate('west', true),
      eastPlate: mockPlate('east', true),
      chartPuzzleSolved: false,
    }),
    3
  );

  assert.equal(
    deriveCosmicStage({
      inspectedStarIds: ['NADIR_IX'],
      westPlate: mockPlate('west', true),
      eastPlate: mockPlate('east', true),
      chartPuzzleSolved: true,
    }),
    4
  );
});

test('calculateParallaxIntersection identifies impossible geometry for Nadir-IX vs normal stars', () => {
  const normalResult = calculateParallaxIntersection('ALPHA_CYGNI', null, null);
  assert.equal(normalResult.isImpossibleGeometry, false);
  assert.equal(normalResult.angularDisplacementArcsec, 0);

  const anomalyResult = calculateParallaxIntersection('NADIR_IX', null, null);
  assert.equal(anomalyResult.isImpossibleGeometry, true);
  assert.ok(anomalyResult.angularDisplacementArcsec > 15000);
  assert.equal(anomalyResult.parallaxAngleDeg, -2.15);
});

test('save state serialization and deserialization preserves progress and respects autostart', () => {
  const initial = createInitialGameState(false);
  initial.cosmicStage = 3;
  initial.plumbLineInspected = true;
  const raw = serializeGameState(initial);

  const restored = deserializeGameState(raw, true);
  assert.equal(restored.cosmicStage, 3);
  assert.equal(restored.plumbLineInspected, true);
  assert.equal(restored.scene, 'EXTERIOR_DECK');
});
