const page = globalThis.location;
// `import.meta.env` is injected by Vite. It does not exist when Express serves
// the source modules directly, so every environment lookup must tolerate the
// browser-native `import.meta` object having no `env` property.
const environment = import.meta.env || {};

export const runtimeConfig = Object.freeze({
  apiBaseUrl: environment.VITE_API_URL || page?.origin || 'http://localhost:3000',
  webSocketUrl: environment.VITE_WS_URL || `${page?.protocol === 'https:' ? 'wss' : 'ws'}://${page?.host || 'localhost:3000'}`,
  maxDevicePixelRatio: 2,
  geometryVersion: 1
});
