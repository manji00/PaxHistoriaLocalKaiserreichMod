export class MapController extends EventTarget {
  constructor(adapter) { super(); this.adapter = adapter; adapter.controller = this; }
  initialize(container) { return this.adapter.initialize(container); }
  loadScenario(scenario) { return this.adapter.loadScenario(scenario); }
  applyGameState(state) { return this.adapter.applyGameState(state); }
  resize() { return this.adapter.resize(); }
  zoomIn() { return this.adapter.zoomIn(); } zoomOut() { return this.adapter.zoomOut(); }
  resetView() { return this.adapter.resetView(); }
  focusNation(id) { return this.adapter.focusNation(id); }
  focusRegion(id) { return this.adapter.focusRegion(id); }
  selectRegion(id) { return this.adapter.selectRegion(id); }
  clearSelection() { return this.adapter.clearSelection(); }
  setLayerVisibility(layer, visible) { return this.adapter.setLayerVisibility(layer, visible); }
  worldToScreen(point) { return this.adapter.worldToScreen(point); }
  screenToWorld(point) { return this.adapter.screenToWorld(point); }
  destroy() { return this.adapter.destroy(); }
  emit(type, detail) { this.dispatchEvent(new CustomEvent(type, { detail })); }
}
