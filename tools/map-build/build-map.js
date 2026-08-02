#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const root = path.resolve(__dirname, '../..');
const scenarios = process.argv.slice(2).length ? process.argv.slice(2) : ['original_wk', 'kaiserreich'];

function anchor(svgPath) {
  const values = svgPath.slice(svgPath.search(/[Mm]/) + 1).match(/-?\d*\.?\d+(?:e[-+]?\d+)?/ig);
  if (!values || values.length < 2) throw new Error('Pfad besitzt keinen gültigen Startpunkt');
  return [Number(values[0]), Number(values[1])];
}

for (const id of scenarios) {
  const scenarioDir = path.join(root, 'data/scenarios', id);
  const source = JSON.parse(fs.readFileSync(path.join(scenarioDir, 'regions.json'), 'utf8'));
  const scenario = JSON.parse(fs.readFileSync(path.join(scenarioDir, 'scenario.json'), 'utf8'));
  const svg = fs.readFileSync(path.join(root, 'frontend', scenario.map), 'utf8');
  const ids = new Set();
  const nationAnchors = new Map();
  const regions = source.regions.map(region => {
    const regionId = String(region.id);
    if (ids.has(regionId)) throw new Error(`${id}: doppelte Regions-ID ${regionId}`);
    ids.add(regionId);
    if (!region.path || !/^[\s]*[Mm]/.test(region.path)) throw new Error(`${id}/${regionId}: ungültiger SVG-Pfad`);
    if (!svg.includes(`id="${regionId.replaceAll('&', '&amp;')}"`) && !svg.includes(`id="${regionId}"`)) throw new Error(`${id}: ${regionId} fehlt im SVG`);
    // SVG fills implicitly close open contours. Make that closure explicit in
    // the runtime artifact so rendering and hit testing use identical shapes.
    const normalizedPath = /[zZ]\s*$/.test(region.path) ? region.path : `${region.path}Z`;
    const centroid = anchor(normalizedPath);
    if (region.nation_code) {
      const list = nationAnchors.get(region.nation_code) || []; list.push(centroid); nationAnchors.set(region.nation_code, list);
    }
    // Conservative bounds keep curved/relative SVG commands correct; Path2D
    // remains the authoritative second-stage hit test.
    return { id: regionId, path: normalizedPath, centroid, labelAnchor: centroid,
      bbox: { x: 0, y: 0, width: Number(source.width), height: Number(source.height) } };
  });
  const nations = JSON.parse(fs.readFileSync(path.join(scenarioDir, 'nations.json'), 'utf8'));
  const nationLabels = [...nationAnchors].map(([code, points]) => ({ code,
    text: (nations[code]?.name || code).toUpperCase(),
    x: points.reduce((n,p)=>n+p[0],0)/points.length, y: points.reduce((n,p)=>n+p[1],0)/points.length,
    size: points.length > 30 ? 12 : points.length > 8 ? 9 : 6, angle: 0 }));
  const viewBoxParts = String(source.viewBox).trim().split(/[ ,]+/).map(Number);
  const artifact = { version: 1, scenarioId: id,
    viewBox: { x: viewBoxParts[0], y: viewBoxParts[1], width: viewBoxParts[2], height: viewBoxParts[3] },
    regions, nationLabels };
  artifact.checksum = crypto.createHash('sha256').update(JSON.stringify(artifact)).digest('hex');
  const output = path.join(root, 'frontend/maps', `${id}.geometry.json`);
  fs.writeFileSync(output, JSON.stringify(artifact));
  console.log(`${id}: ${regions.length} Regionen -> ${path.relative(root, output)} (${artifact.checksum.slice(0, 12)})`);
}
