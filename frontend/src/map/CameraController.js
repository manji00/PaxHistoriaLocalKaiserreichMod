export class CameraController {
  constructor(scene, bridge, { dragSpeed = 0.65, dragThreshold = 4 } = {}) {
    this.scene = scene;
    this.bridge = bridge;
    this.dragPointerId = null;
    this.dragSpeed = dragSpeed;
    this.dragThreshold = dragThreshold;
    this.lastPointer = null;
    this.dragDistance = 0;
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
    // Phaser 4 does not consistently pass the native WheelEvent as the last
    // argument. It is, however, retained on the pointer in every input mode.
    const wheelEvent = event || pointer?.event;
    wheelEvent?.preventDefault();
    const multiplier = wheelEvent?.deltaMode === 1 ? 24 : 1;
    const movement = deltaY * multiplier;
    if (wheelEvent?.ctrlKey) {
      this.bridge.panBy(movement, 0);
    } else if (wheelEvent?.altKey || wheelEvent?.shiftKey) {
      this.bridge.panBy(0, movement);
    } else {
      this.bridge.zoomBy(deltaY < 0 ? 1.18 : 0.85, pointer);
    }
  }

  handlePointerDown(pointer) {
    if (!this.isPanButton(pointer)) return;
    this.dragPointerId = pointer.id;
    this.lastPointer = { x: pointer.x, y: pointer.y };
    this.dragDistance = 0;
  }

  handlePointerMove(pointer) {
    if (this.dragPointerId !== pointer.id || !this.lastPointer) return;
    const dx = pointer.x - this.lastPointer.x;
    const dy = pointer.y - this.lastPointer.y;
    this.lastPointer = { x: pointer.x, y: pointer.y };
    this.dragDistance += Math.hypot(dx, dy);
    if (this.dragDistance < this.dragThreshold) return;
    this.bridge.setDragging(true);
    this.bridge.panBy(-dx * this.dragSpeed, -dy * this.dragSpeed);
  }

  handlePointerUp(pointer) {
    if (this.dragPointerId !== pointer.id) return;
    this.dragPointerId = null;
    this.lastPointer = null;
    this.dragDistance = 0;
    this.bridge.setDragging(false);
  }

  isPanButton(pointer) {
    const button = pointer.event?.button ?? pointer.button;
    return button === 0 || button === 1 || button === 2 || pointer.rightButtonDown?.();
  }
}
