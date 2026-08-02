import { SpatialIndex } from '../geometry/SpatialIndex.js';

export class RegionLayer {
  constructor(scene) { this.scene = scene; this.views = new Map(); }
  load(artifact, regions, colors) {
    this.clear();
    const data = new Map(regions.map(region => [String(region.id), region]));
    for (const geometry of artifact.regions) {
      const region = data.get(String(geometry.id));
      if (!region) continue;
      this.views.set(String(geometry.id), {
        ...geometry, region, path: new Path2D(geometry.path),
        fill: colors[region.nation_code]?.color || region.fill || '#777777'
      });
    }
    this.index = new SpatialIndex([...this.views.values()]);
  }
  update(regions, colors) {
    for (const region of regions) {
      const view = this.views.get(String(region.id));
      if (!view) continue;
      view.region = region;
      view.fill = colors[region.nation_code]?.color || region.fill || '#777777';
    }
  }
  hitTest(x, y, context) {
    return this.index?.search(x, y).reverse().find(view => context.isPointInPath(view.path, x, y, 'evenodd')) || null;
  }
  clear() { this.views.clear(); this.index = new SpatialIndex(); }
}
