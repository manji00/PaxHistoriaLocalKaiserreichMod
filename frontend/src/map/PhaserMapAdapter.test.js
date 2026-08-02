import { describe, expect, it, vi } from 'vitest';
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

describe('PhaserMapAdapter camera coordinates', () => {
  function cameraAdapter(camera) {
    const adapter = new PhaserMapAdapter();
    adapter.scene = { cameras: { main: camera } };
    return adapter;
  }

  it('uses the current scroll and zoom rather than Phaser\'s stale render matrix', () => {
    const camera = {
      scrollX: 240,
      scrollY: 80,
      zoom: 2,
      getWorldPoint: vi.fn(() => ({ x: -1, y: -1 }))
    };
    const adapter = cameraAdapter(camera);

    expect(adapter.screenToWorld({ x: 120, y: 40 })).toEqual({ x: 300, y: 100 });
    expect(camera.getWorldPoint).not.toHaveBeenCalled();
  });

  it('keeps screen and world conversions inverse after camera changes', () => {
    const camera = { scrollX: 25, scrollY: -10, zoom: 0.75 };
    const adapter = cameraAdapter(camera);
    const world = { x: 640, y: 215 };

    expect(adapter.screenToWorld(adapter.worldToScreen(world))).toEqual(world);

    camera.scrollX = 310;
    camera.scrollY = 90;
    camera.zoom = 3.5;
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
