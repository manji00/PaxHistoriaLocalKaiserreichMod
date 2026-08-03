import { MapController } from './map/MapController.js';
import { PhaserMapAdapter } from './map/PhaserMapAdapter.js';
import { CityManager, NationLabelManager, UnitManager } from './map/CanvasManagers.js';

const adapter = new PhaserMapAdapter();
const controller = new MapController(adapter);

const gameMap = {
  adapter, controller, map: controller, svgLayer: null, svgWidth: 1400.16, svgHeight: 600, scaleFactor: 1,
  init() { return controller.initialize('#map'); },
  async asyncLoadMapData() {
    const scenario = window.app?.currentGame?.scenario || { id: 'original_wk' };
    const data = await controller.loadScenario(scenario);
    this.svgWidth = adapter.artifact.viewBox.width; this.svgHeight = adapter.artifact.viewBox.height;
    this.nationColors = adapter.colors; return data;
  },
  refreshSize() { controller.resize(); },
  focusOnNation(code) { controller.focusNation(code); },
  showNationPopup: async code => window.app?.showNationPopup?.(code),
  closePopup() { document.getElementById('nation-popup')?.classList.add('hidden'); controller.clearSelection(); },
  applyNationColorsToSVG(_unused, regions) { controller.applyGameState({ regions }); },
  updateLabelsVisibility() {},
  formatIdeology(value) { return value ? value[0].toUpperCase() + value.slice(1) : 'N/A'; },
  formatPopulation(value) { return Number(value || 0).toLocaleString(); }
};
controller.addEventListener('region-selected', event => gameMap.onRegionClick?.(event.detail));
controller.addEventListener('region-hover', event => {
  const tooltip = window.app?.ui;
  if (!tooltip) return;
  event.detail ? tooltip.showTooltip?.({ clientX: 0, clientY: 0 }, event.detail.name) : tooltip.hideTooltip?.();
});

Object.assign(window, { gameMap, CityManager, NationLabelManager, UnitManager });

document.addEventListener('change', event => {
  const layer = event.target?.dataset?.mapLayer;
  if (layer) controller.setLayerVisibility(layer, event.target.checked);
});

const scripts = ['js/api.js', 'js/panels/actions-panel.js', 'js/panels/advisor-panel.js',
  'js/panels/diplomacy-panel.js', 'js/panels/events-panel.js', 'js/panels/timeline-panel.js', 'js/app.js'];
for (const src of scripts) await new Promise((resolve, reject) => {
  const script = document.createElement('script'); script.src = src; script.onload = resolve; script.onerror = reject; document.body.append(script);
});
