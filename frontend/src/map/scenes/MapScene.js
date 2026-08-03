import Phaser from 'phaser';
import { DEPTH } from '../rendering/layers.js';
import { RegionLayer } from '../layers/RegionLayer.js';
import { CameraController } from '../CameraController.js';

class CanvasWorld extends Phaser.GameObjects.GameObject {
  constructor(scene, model) {
    super(scene, 'CanvasWorld');
    this.model = model;
    // Phaser's bare GameObject does not include the Depth component (and thus
    // has no setDepth method). The display list still sorts custom game
    // objects by their depth property.
    this.depth = DEPTH.regions;
  }
  renderCanvas(renderer, src, camera) {
    const ctx = renderer.currentContext;
    ctx.save();
    ctx.translate(-camera.scrollX * camera.zoom, -camera.scrollY * camera.zoom);
    ctx.scale(camera.zoom, camera.zoom);
    // Keep the exact transform used by the renderer for input hit testing.
    // This includes Phaser's resolution/base transform as well as the camera.
    src.scene.bridge.captureWorldTransform(ctx.getTransform());
    for (const view of src.model.regions.views.values()) {
      ctx.fillStyle = view === src.model.hovered ? '#f4d35e' : view === src.model.selected ? '#ffe66d' : view.fill;
      ctx.strokeStyle = view === src.model.selected ? '#ffffff' : '#111827';
      ctx.lineWidth = (view === src.model.selected ? 1.5 : 0.3) / camera.zoom;
      ctx.fill(view.path, 'evenodd'); ctx.stroke(view.path);
    }
    const occupiedLabelBoxes = [];
    if (src.model.labelsVisible) for (const label of [...src.model.labels].sort((a, b) => (b.size || 0) - (a.size || 0))) {
      const size = Math.max(3, Math.min(7, label.size || 5));
      const width = Math.min(label.maxWidth || size * 11, Math.max(size * 4, label.text.length * size * .62));
      const box = { left: label.x - width / 2 - 2, right: label.x + width / 2 + 2,
        top: label.y - size / 2 - 1, bottom: label.y + size / 2 + 1 };
      if (occupiedLabelBoxes.some(other => box.left < other.right && box.right > other.left && box.top < other.bottom && box.bottom > other.top)) continue;
      occupiedLabelBoxes.push(box);
      ctx.save(); ctx.translate(label.x, label.y); ctx.rotate((label.angle || 0) * Math.PI / 180);
      ctx.font = `600 ${size}px Cinzel, serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.lineJoin = 'round'; ctx.lineWidth = Math.max(.65, size * .16); ctx.strokeStyle = 'rgba(15,23,42,.72)';
      ctx.fillStyle = 'rgba(255,255,255,.9)';
      const maxWidth = label.maxWidth || Math.max(22, size * 11);
      ctx.strokeText(label.text, 0, 0, maxWidth); ctx.fillText(label.text, 0, 0, maxWidth); ctx.restore();
    }
    if (src.model.citiesVisible) for (const city of src.model.cities) {
      if (!Array.isArray(city.coords)) continue;
      ctx.fillStyle = city.type === 'capital' ? '#f5c542' : '#f8fafc'; ctx.beginPath();
      ctx.strokeStyle = '#172033'; ctx.lineWidth = .55 / camera.zoom;
      ctx.arc(city.coords[0], city.coords[1], city.type === 'capital' ? 2 : 1.15, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    }
    if (src.model.unitsVisible) for (const unit of src.model.units) {
      const c = unit.centroid || unit.coords; if (!Array.isArray(c)) continue;
      ctx.fillStyle = '#172033'; ctx.fillRect(c[0] - 5, c[1] - 4, 10, 8);
      ctx.fillStyle = '#fff'; ctx.font = '6px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('◆', c[0], c[1] + 2);
    }
    ctx.restore();
  }
}

export class MapScene extends Phaser.Scene {
  constructor(bridge) { super('MapScene'); this.bridge = bridge; }
  init(data = {}) { this.bridge = data.bridge || this.bridge; this.model = { regions: new RegionLayer(this), labels: [], cities: [], units: [], labelsVisible: true, citiesVisible: true, unitsVisible: true, selected: null, hovered: null }; }
  create() {
    this.add.existing(new CanvasWorld(this, this.model));
    this.input.on('pointermove', pointer => this.bridge.handlePointerMove(pointer));
    this.cameraController = new CameraController(this, this.bridge);
    this.cameraController.bind();
    this.bridge.sceneReady(this);
  }
  shutdown() { this.cameraController?.destroy(); this.input.removeAllListeners(); this.model.regions.clear(); }
}
