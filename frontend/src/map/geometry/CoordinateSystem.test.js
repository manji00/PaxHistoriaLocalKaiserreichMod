import { describe, expect, it } from 'vitest';
import { clampCamera, fitScale, normalizeWorldX } from './CoordinateSystem.js';

describe('map coordinates', () => {
  const world = { x: 0, y: 0, width: 1400, height: 600 };
  it('fits and clamps the camera', () => {
    expect(fitScale(world, { width: 700, height: 600 })).toBe(.5);
    expect(clampCamera({ x: -20, y: 900, zoom: .1 }, world, { width: 700, height: 300 })).toEqual({ x: 0, y: 0, zoom: .5 });
  });
  it('normalizes wrapped x coordinates', () => {
    expect(normalizeWorldX(-10, world)).toBe(1390);
    expect(normalizeWorldX(1410, world)).toBe(10);
  });
});
