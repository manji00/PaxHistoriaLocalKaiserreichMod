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

  it('reads wheel modifiers from the Phaser pointer when no event argument is supplied', () => {
    const { bridge, camera } = controller();
    const preventDefault = vi.fn();
    camera.handleWheel({ event: { ctrlKey: true, deltaMode: 1, preventDefault } }, [], 0, 2);
    expect(bridge.panBy).toHaveBeenCalledWith(48, 0);
    expect(bridge.zoomBy).not.toHaveBeenCalled();
    expect(preventDefault).toHaveBeenCalled();
  });

  it('zooms without a modifier and pans more slowly while dragging', () => {
    const { bridge, camera } = controller();
    const pointer = { id: 2, x: 10, y: 10, event: { button: 0 } };
    camera.handleWheel(pointer, [], 0, -1, 0, { preventDefault() {} });
    camera.handlePointerDown(pointer);
    pointer.x = 17;
    pointer.y = 7;
    camera.handlePointerMove(pointer);
    camera.handlePointerUp(pointer);
    expect(bridge.zoomBy).toHaveBeenCalledWith(1.18, pointer);
    expect(bridge.panBy.mock.calls[0][0]).toBeCloseTo(-4.55);
    expect(bridge.panBy.mock.calls[0][1]).toBeCloseTo(1.95);
    expect(bridge.setDragging.mock.calls).toEqual([[true], [false]]);
  });

  it('does not turn a left click into a drag before the movement threshold', () => {
    const { bridge, camera } = controller();
    const pointer = { id: 1, x: 20, y: 20, button: 0 };
    camera.handlePointerDown(pointer);
    pointer.x = 22;
    camera.handlePointerMove(pointer);
    camera.handlePointerUp(pointer);
    expect(bridge.panBy).not.toHaveBeenCalled();
    expect(bridge.setDragging).toHaveBeenCalledWith(false);
  });
});
