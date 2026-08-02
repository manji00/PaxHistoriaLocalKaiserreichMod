const page = globalThis.location;

export const runtimeConfig = Object.freeze({
  apiBaseUrl: import.meta.env.VITE_API_URL || page?.origin || 'http://localhost:3000',
  webSocketUrl: import.meta.env.VITE_WS_URL || `${page?.protocol === 'https:' ? 'wss' : 'ws'}://${page?.host || 'localhost:3000'}`,
  maxDevicePixelRatio: 2,
  geometryVersion: 1
});
