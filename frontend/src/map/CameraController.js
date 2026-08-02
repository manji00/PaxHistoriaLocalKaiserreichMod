export class CameraController {
  constructor(scene, bridge) {
    this.scene = scene;
    this.bridge = bridge;
    this.dragPointerId = null;
  }

  bind() {
    const input = this.scene.input;
    input.mouse?.disableContextMenu();
    input.on('wheel', this.handleWheel, this);
    input.on('pointerdown', this.handlePointerDown, this);
    input.on('pointermove', this.handlePointerMove, this);
    input.on('pointerup', this.handlePointerUp, this);
    input.on('pointerupoutside', this.handlePointerUp, this);
  }

  destroy() {
    const input = this.scene.input;
    input.off('wheel', this.handleWheel, this);
    input.off('pointerdown', this.handlePointerDown, this);
    input.off('pointermove', this.handlePointerMove, this);
    input.off('pointerup', this.handlePointerUp, this);
    input.off('pointerupoutside', this.handlePointerUp, this);
  }

  handleWheel(pointer, _objects, _deltaX, deltaY, _deltaZ, event) {
    event?.preventDefault();
    if (event?.ctrlKey) {
      this.bridge.panBy(deltaY, 0);
    } else if (event?.altKey) {
      this.bridge.panBy(0, deltaY);
    } else {
      this.bridge.zoomBy(deltaY < 0 ? 1.18 : 0.85, pointer);
    }
  }

  handlePointerDown(pointer) {
    if (!pointer.rightButtonDown()) return;
    this.dragPointerId = pointer.id;
    this.bridge.setDragging(true);
  }

  handlePointerMove(pointer) {
    if (this.dragPointerId !== pointer.id || !pointer.rightButtonDown()) return;
    this.bridge.panBy(-pointer.velocity.x, -pointer.velocity.y);
  }

  handlePointerUp(pointer) {
    if (this.dragPointerId !== pointer.id) return;
    this.dragPointerId = null;
    this.bridge.setDragging(false);
  }
}
