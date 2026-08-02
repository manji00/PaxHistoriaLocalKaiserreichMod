#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const root = path.resolve(__dirname, '../..');
let failed = false;
for (const id of ['original_wk', 'kaiserreich']) {
  const file = path.join(root, 'frontend/maps', `${id}.geometry.json`);
  const artifact = JSON.parse(fs.readFileSync(file));
  const checksum = artifact.checksum; delete artifact.checksum;
  const actual = crypto.createHash('sha256').update(JSON.stringify(artifact)).digest('hex');
  const source = JSON.parse(fs.readFileSync(path.join(root, 'data/scenarios', id, 'regions.json')));
  if (checksum !== actual || artifact.regions.length !== source.regions.length || new Set(artifact.regions.map(r => r.id)).size !== artifact.regions.length) {
    console.error(`${id}: Geometrievalidierung fehlgeschlagen`); failed = true;
  } else console.log(`${id}: ${artifact.regions.length} eindeutige Regionen, Prüfsumme gültig`);
}
process.exitCode = failed ? 1 : 0;
