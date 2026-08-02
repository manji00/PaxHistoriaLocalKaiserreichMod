import { describe, expect, it, vi } from 'vitest';
import { CameraController } from './CameraController.js';

function controller() {
  const bridge = { panBy: vi.fn(), zoomBy: vi.fn(), setDragging: vi.fn() };
  const input = { mouse: { disableContextMenu: vi.fn() }, on: vi.fn(), off: vi.fn() };
  return { bridge, camera: new CameraController({ input }, bridge) };
}

describe('CameraController', () => {
  it('maps the wheel modifiers to the requested axes', () => {
    const { bridge, camera } = controller();
    camera.handleWheel({}, [], 0, 12, 0, { ctrlKey: true, preventDefault() {} });
    camera.handleWheel({}, [], 0, -9, 0, { altKey: true, preventDefault() {} });
    expect(bridge.panBy).toHaveBeenNthCalledWith(1, 12, 0);
    expect(bridge.panBy).toHaveBeenNthCalledWith(2, 0, -9);
  });

  it('zooms without a modifier and pans while right-dragging', () => {
    const { bridge, camera } = controller();
    const pointer = { id: 2, velocity: { x: 7, y: -3 }, rightButtonDown: () => true };
    camera.handleWheel(pointer, [], 0, -1, 0, { preventDefault() {} });
    camera.handlePointerDown(pointer);
    camera.handlePointerMove(pointer);
    camera.handlePointerUp(pointer);
    expect(bridge.zoomBy).toHaveBeenCalledWith(1.18, pointer);
    expect(bridge.panBy).toHaveBeenCalledWith(-7, 3);
    expect(bridge.setDragging.mock.calls).toEqual([[true], [false]]);
  });
});
