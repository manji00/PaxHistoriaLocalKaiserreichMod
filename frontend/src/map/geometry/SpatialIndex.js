export class SpatialIndex {
  constructor(regions = []) { this.regions = regions; }
  search(x, y) {
    return this.regions.filter(({ bbox: b }) => x >= b.x && y >= b.y && x <= b.x + b.width && y <= b.y + b.height);
  }
}
