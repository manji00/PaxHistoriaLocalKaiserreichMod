import { describe, expect, it } from 'vitest';
import { PhaserMapAdapter } from './PhaserMapAdapter.js';

describe('PhaserMapAdapter pointer coordinates', () => {
  it('uses Phaser-normalized coordinates instead of scaling client coordinates again', () => {
    const adapter = new PhaserMapAdapter();
    adapter.game = {
      canvas: { getBoundingClientRect: () => ({ left: 10, top: 20, width: 500, height: 250 }) }
    };
    adapter.scene = { cameras: { main: { width: 1000, height: 500 } } };

    expect(adapter.pointerToScreen({
      x: 125,
      y: 75,
      event: { clientX: 135, clientY: 95 }
    })).toEqual({ x: 125, y: 75 });
  });

  it('falls back to client coordinates for non-Phaser pointer-like events', () => {
    const adapter = new PhaserMapAdapter();
    adapter.game = {
      canvas: { getBoundingClientRect: () => ({ left: 10, top: 20, width: 500, height: 250 }) }
    };
    adapter.scene = { cameras: { main: { width: 1000, height: 500 } } };

    expect(adapter.pointerToScreen({ event: { clientX: 135, clientY: 95 } }))
      .toEqual({ x: 250, y: 150 });
  });
});
