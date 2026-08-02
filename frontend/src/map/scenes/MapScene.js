import Phaser from 'phaser';
import { DEPTH } from '../rendering/layers.js';
import { RegionLayer } from '../layers/RegionLayer.js';

class CanvasWorld extends Phaser.GameObjects.GameObject {
  constructor(scene, model) { super(scene, 'CanvasWorld'); this.model = model; this.setDepth(DEPTH.regions); }
  renderCanvas(renderer, src, camera) {
    const ctx = renderer.currentContext;
    ctx.save();
    ctx.translate(-camera.scrollX * camera.zoom, -camera.scrollY * camera.zoom);
    ctx.scale(camera.zoom, camera.zoom);
    for (const view of src.model.regions.views.values()) {
      ctx.fillStyle = view === src.model.hovered ? '#f4d35e' : view === src.model.selected ? '#ffe66d' : view.fill;
      ctx.strokeStyle = view === src.model.selected ? '#ffffff' : '#111827';
      ctx.lineWidth = (view === src.model.selected ? 1.5 : 0.3) / camera.zoom;
      ctx.fill(view.path, 'evenodd'); ctx.stroke(view.path);
    }
    for (const label of src.model.labels) {
      ctx.save(); ctx.translate(label.x, label.y); ctx.rotate((label.angle || 0) * Math.PI / 180);
      ctx.font = `600 ${label.size || 8}px Cinzel`; ctx.textAlign = 'center'; ctx.fillStyle = 'rgba(255,255,255,.78)';
      ctx.fillText(label.text, 0, 0); ctx.restore();
    }
    for (const city of src.model.cities) {
      ctx.fillStyle = city.type === 'capital' ? '#f5c542' : '#f8fafc'; ctx.beginPath();
      ctx.arc(city.coords[0], city.coords[1], city.type === 'capital' ? 2.4 : 1.4, 0, Math.PI * 2); ctx.fill();
    }
    for (const unit of src.model.units) {
      const c = unit.centroid; if (!Array.isArray(c)) continue;
      ctx.fillStyle = '#172033'; ctx.fillRect(c[0] - 5, c[1] - 4, 10, 8);
      ctx.fillStyle = '#fff'; ctx.font = '6px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('◆', c[0], c[1] + 2);
    }
    ctx.restore();
  }
}

export class MapScene extends Phaser.Scene {
  constructor(bridge) { super('MapScene'); this.bridge = bridge; }
  init(data = {}) { this.bridge = data.bridge || this.bridge; this.model = { regions: new RegionLayer(this), labels: [], cities: [], units: [], selected: null, hovered: null }; }
  create() {
    this.add.existing(new CanvasWorld(this, this.model));
    this.input.on('pointermove', pointer => this.bridge.handlePointerMove(pointer));
    this.input.on('pointerup', pointer => this.bridge.handlePointerUp(pointer));
    this.input.on('wheel', (pointer, _objects, _dx, dy) => this.bridge.handleWheel(pointer, dy));
    this.bridge.sceneReady(this);
  }
  shutdown() { this.input.removeAllListeners(); this.model.regions.clear(); }
}
