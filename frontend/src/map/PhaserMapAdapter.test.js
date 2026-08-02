import { describe, expect, it, vi } from 'vitest';
import { PhaserMapAdapter } from './PhaserMapAdapter.js';

describe('PhaserMapAdapter pointer coordinates', () => {
  it('converts native client coordinates to backing-canvas pixels', () => {
    const adapter = new PhaserMapAdapter();
    adapter.game = {
      canvas: { width: 2000, height: 1000, getBoundingClientRect: () => ({ left: 10, top: 20, width: 500, height: 250 }) }
    };
    adapter.scene = { cameras: { main: { width: 1000, height: 500 } } };

    expect(adapter.pointerToScreen({
      x: 125,
      y: 75,
      event: { clientX: 135, clientY: 95 }
    })).toEqual({ x: 500, y: 300 });
  });

  it('falls back to normalized pointer coordinates without a native event', () => {
    const adapter = new PhaserMapAdapter();
    adapter.game = {
      canvas: { width: 2000, height: 1000, getBoundingClientRect: () => ({ left: 10, top: 20, width: 500, height: 250 }) }
    };
    adapter.scene = { cameras: { main: { width: 1000, height: 500 } } };

    expect(adapter.pointerToScreen({ x: 125, y: 75 }))
      .toEqual({ x: 250, y: 150 });
  });
});

describe('PhaserMapAdapter camera coordinates', () => {
  function cameraAdapter(camera) {
    const adapter = new PhaserMapAdapter();
    adapter.scene = { cameras: { main: camera } };
    return adapter;
  }

  it('inverts the exact canvas transform captured while rendering', () => {
    const camera = {};
    const adapter = cameraAdapter(camera);
    adapter.captureWorldTransform({ a: 4, b: 0, c: 0, d: 4, e: -960, f: -320 });

    expect(adapter.screenToWorld({ x: 120, y: 40 })).toEqual({ x: 270, y: 90 });
  });

  it('keeps screen and world conversions inverse after camera changes', () => {
    const camera = {};
    const adapter = cameraAdapter(camera);
    adapter.captureWorldTransform({ a: 1.5, b: 0, c: 0, d: 1.5, e: -50, f: 20 });
    const world = { x: 640, y: 215 };

    expect(adapter.screenToWorld(adapter.worldToScreen(world))).toEqual(world);

    adapter.captureWorldTransform({ a: 7, b: 0, c: 0, d: 7, e: -2170, f: -630 });
    expect(adapter.screenToWorld(adapter.worldToScreen(world))).toEqual(world);
  });
});

describe('PhaserMapAdapter selection', () => {
  function selectionAdapter() {
    const adapter = new PhaserMapAdapter();
    const hitTest = vi.fn(() => ({ region: { id: '42' } }));
    adapter.game = { canvas: { getContext: vi.fn(() => ({})) } };
    adapter.scene = { model: { regions: { hitTest } } };
    adapter.pointerToScreen = vi.fn(() => ({ x: 10, y: 20 }));
    adapter.screenToWorld = vi.fn(point => point);
    adapter.selectRegion = vi.fn();
    return { adapter, hitTest };
  }

  it('selects a region on an undragged primary click', () => {
    const { adapter } = selectionAdapter();
    adapter.handlePointerUp({ button: 0 }, { wasDragging: false });
    expect(adapter.selectRegion).toHaveBeenCalledWith('42');
  });

  it('does not select after dragging or with a non-primary button', () => {
    const { adapter, hitTest } = selectionAdapter();
    adapter.handlePointerUp({ button: 0 }, { wasDragging: true });
    adapter.handlePointerUp({ button: 2 }, { wasDragging: false });
    expect(hitTest).not.toHaveBeenCalled();
    expect(adapter.selectRegion).not.toHaveBeenCalled();
  });
});
