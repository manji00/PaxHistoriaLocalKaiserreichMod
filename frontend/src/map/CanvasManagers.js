class BaseManager { constructor() {} updateVisibility() {} clearMarkers() {} clearLabels() {} }

export class CityManager extends BaseManager {
  async loadCities() {
    const id = window.app?.currentGame?.scenario?.id || 'original_wk';
    const response = await fetch(`/api/map/cities?scenario_id=${encodeURIComponent(id)}`);
    window.gameMap.adapter.scene.model.cities = await response.json();
  }
}

export class NationLabelManager extends BaseManager {
  async loadNationLabels() { /* Labels are part of the generated scenario artifact. */ }
}

export class UnitManager extends BaseManager {
  async loadUnits(saveId) {
    const response = await fetch(`/api/units?saveId=${encodeURIComponent(saveId)}`);
    this.units = await response.json(); window.gameMap.controller.applyGameState({ units: this.units }); return this.units;
  }
  displayUnits() { window.gameMap.controller.applyGameState({ units: this.units || [] }); }
  clearUnits() { this.units = []; window.gameMap.controller.applyGameState({ units: [] }); }
  showUnitsPopup() {}
}
