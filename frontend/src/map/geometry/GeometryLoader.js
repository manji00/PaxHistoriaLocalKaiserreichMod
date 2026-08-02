import { runtimeConfig } from '../../config.js';

export async function loadGeometry(url, signal) {
  const response = await fetch(url, { signal });
  if (!response.ok) throw new Error(`Geometrie konnte nicht geladen werden (${response.status})`);
  const artifact = await response.json();
  if (artifact.version !== runtimeConfig.geometryVersion) {
    throw new Error(`Nicht unterstützte Geometrieversion ${artifact.version}`);
  }
  return artifact;
}
