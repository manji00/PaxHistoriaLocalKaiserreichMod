import Phaser from 'phaser';
import { MapScene } from './scenes/MapScene.js';
import { loadGeometry } from './geometry/GeometryLoader.js';
import { fitScale } from './geometry/CoordinateSystem.js';
import { runtimeConfig } from '../config.js';

export class PhaserMapAdapter {
  async initialize(container) {
    this.container = typeof container === 'string' ? document.querySelector(container) : container;
    if (!this.container) throw new Error('Phaser map container was not found');
    const mapScene = new MapScene(this);
    this.ready = new Promise(resolve => { this.resolveReady = resolve; });
    this.game = new Phaser.Game({ type: Phaser.CANVAS, parent: this.container, backgroundColor: '#9fc5df',
      width: this.container.clientWidth, height: this.container.clientHeight,
      resolution: Math.min(globalThis.devicePixelRatio || 1, runtimeConfig.maxDevicePixelRatio), scene: mapScene,
      banner: false, render: { antialias: true, roundPixels: false } });
    this.observer = new ResizeObserver(() => this.resize()); this.observer.observe(this.container);
    return this.ready;
  }
  sceneReady(scene) {
    this.scene = scene;
    console.info(`[Pax Historia] Phaser ${Phaser.VERSION} map renderer started`);
    this.controller.emit('ready', { engine: 'Phaser', version: Phaser.VERSION });
    this.resolveReady?.();
  }
  async loadScenario(scenario) {
    this.abort?.abort(); this.abort = new AbortController();
    try {
      const id = scenario.id || 'original_wk';
      const [artifact, mapData, colors, cities] = await Promise.all([
        loadGeometry(scenario.geometry || `maps/${id}.geometry.json`, this.abort.signal),
        fetch(`${runtimeConfig.apiBaseUrl}/api/map/geojson?scenario_id=${encodeURIComponent(id)}`, { signal: this.abort.signal }).then(r => r.json()),
        fetch(`${runtimeConfig.apiBaseUrl}/api/map/colors?scenario_id=${encodeURIComponent(id)}`, { signal: this.abort.signal }).then(r => r.json()),
        fetch(`${runtimeConfig.apiBaseUrl}/api/map/cities?scenario_id=${encodeURIComponent(id)}`, { signal: this.abort.signal }).then(r => r.json())
      ]);
      this.artifact = artifact; this.regions = mapData.regions; this.colors = colors;
      this.scene.model.regions.load(artifact, this.regions, colors); this.scene.model.cities = cities;
      this.scene.model.labels = artifact.nationLabels || [];
      this.resetView(); return mapData;
    } catch (error) { if (error.name !== 'AbortError') this.controller.emit('load-error', { error }); throw error; }
  }
  applyGameState(state) { if (state.regions) { this.regions = state.regions; this.scene.model.regions.update(state.regions, this.colors); } if (state.units) this.scene.model.units = state.units; }
  resize() { if (!this.game || !this.container) return; this.game.scale.resize(this.container.clientWidth, this.container.clientHeight); if (this.artifact) this.resetView(); }
  zoomBy(factor, pointer) { const c = this.scene.cameras.main, anchor = pointer ? this.pointerToScreen(pointer) : { x: c.width / 2, y: c.height / 2 }, before = this.screenToWorld(anchor); c.setZoom(Math.max(this.minZoom, Math.min(8, c.zoom * factor))); const after = this.screenToWorld(anchor); c.scrollX += before.x - after.x; c.scrollY += before.y - after.y; this.cameraChanged(); }
  zoomIn() { this.zoomBy(1.25); } zoomOut() { this.zoomBy(.8); }
  panBy(screenX, screenY) { const c = this.scene.cameras.main; c.scrollX += screenX / c.zoom; c.scrollY += screenY / c.zoom; this.cameraChanged(); }
  setDragging(active) { this.dragging = active; this.game.canvas.style.cursor = active ? 'grabbing' : ''; }
  resetView() { const c = this.scene.cameras.main, v = this.artifact.viewBox; this.minZoom = fitScale(v, { width: c.width, height: c.height }); c.setZoom(this.minZoom); c.centerOn(v.x + v.width / 2, v.y + v.height / 2); this.cameraChanged(); }
  handlePointerMove(pointer) { if (!this.artifact || this.dragging) return; const p = this.screenToWorld(this.pointerToScreen(pointer)), ctx = this.game.canvas.getContext('2d'), hit = this.scene.model.regions.hitTest(p.x, p.y, ctx); if (hit !== this.scene.model.hovered) { this.scene.model.hovered = hit; this.controller.emit('region-hover', hit?.region || null); } }
  handlePointerUp(pointer) { if (this.dragging || pointer.rightButtonReleased?.() || pointer.getDistance?.() > 6) return; const p = this.screenToWorld(this.pointerToScreen(pointer)), hit = this.scene.model.regions.hitTest(p.x, p.y, this.game.canvas.getContext('2d')); if (hit) this.selectRegion(hit.region.id); }
  selectRegion(id, emit = true) { const view = this.scene.model.regions.views.get(String(id)); this.scene.model.selected = view || null; if (view && emit) this.controller.emit('region-selected', view.region); }
  clearSelection() { this.scene.model.selected = null; }
  focusRegion(id) { const v = this.scene.model.regions.views.get(String(id)); if (!v) return; this.scene.cameras.main.centerOn(v.centroid[0], v.centroid[1]); this.selectRegion(id); }
  focusNation(code) { const views = [...this.scene.model.regions.views.values()].filter(v => v.region.nation_code === code); if (!views.length) return; const x = views.reduce((n,v)=>n+v.centroid[0],0)/views.length, y=views.reduce((n,v)=>n+v.centroid[1],0)/views.length; this.scene.cameras.main.centerOn(x,y); }
  setLayerVisibility(layer, visible) { if (this.scene.model[layer]) this.scene.model[`${layer}Visible`] = visible; }
  pointerToScreen(pointer) { const event = pointer.event, rect = this.game.canvas.getBoundingClientRect(); if (event && Number.isFinite(event.clientX) && rect.width && rect.height) return { x: (event.clientX - rect.left) * this.scene.cameras.main.width / rect.width, y: (event.clientY - rect.top) * this.scene.cameras.main.height / rect.height }; return { x: pointer.x, y: pointer.y }; }
  screenToWorld({ x, y }) { const point = this.scene.cameras.main.getWorldPoint(x, y); return { x: point.x, y: point.y }; }
  worldToScreen({ x, y }) { const c = this.scene.cameras.main; return { x: (x-c.scrollX)*c.zoom, y: (y-c.scrollY)*c.zoom }; }
  cameraChanged() { clearTimeout(this.cameraTimer); this.cameraTimer=setTimeout(()=>this.controller.emit('camera-changed',{ camera:this.scene.cameras.main }),50); }
  destroy() { this.abort?.abort(); this.observer?.disconnect(); this.game?.destroy(true); }
}
