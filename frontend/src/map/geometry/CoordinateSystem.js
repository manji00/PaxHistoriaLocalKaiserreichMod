export function fitScale(viewBox, viewport) {
  return Math.min(viewport.width / viewBox.width, viewport.height / viewBox.height);
}

export function clampCamera(camera, viewBox, viewport, maxZoom = 8) {
  const minZoom = fitScale(viewBox, viewport);
  const zoom = Math.min(maxZoom, Math.max(minZoom, camera.zoom || minZoom));
  const visibleWidth = viewport.width / zoom;
  const visibleHeight = viewport.height / zoom;
  return {
    zoom,
    x: Math.max(viewBox.x, Math.min(camera.x, viewBox.x + viewBox.width - visibleWidth)),
    y: Math.max(viewBox.y, Math.min(camera.y, viewBox.y + viewBox.height - visibleHeight))
  };
}

export function normalizeWorldX(x, viewBox) {
  return viewBox.x + ((((x - viewBox.x) % viewBox.width) + viewBox.width) % viewBox.width);
}
