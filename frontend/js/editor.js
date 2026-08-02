import { MapController } from '../src/map/MapController.js';
import { PhaserMapAdapter } from '../src/map/PhaserMapAdapter.js';

const MIN_SCENARIO_PANE_WIDTH = 230;
const DEFAULT_SCENARIO_PANE_WIDTH = 310;
const SCENARIO_PANE_STORAGE_KEY = 'pax-editor-scenario-pane-width';

const $ = selector => document.querySelector(selector);

let data;
let selectedNation = null;
let selectedRegion = null;
let dirty = false;
let zoom = 1;
const mapAdapter = new PhaserMapAdapter();
const mapController = new MapController(mapAdapter);

const backendOrigin = getBackendOrigin();

function getBackendOrigin() {
  if (!location.protocol.startsWith('http')) {
    return 'http://127.0.0.1:3000';
  }

  const isLocalHost = ['localhost', '127.0.0.1'].includes(location.hostname);
  if (isLocalHost && location.port !== '3000') {
    return `${location.protocol}//${location.hostname}:3000`;
  }

  return location.origin;
}

function escapeHtml(value) {
  const characters = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' };
  return String(value).replace(/[&<>"]/g, character => characters[character]);
}

function renderFields(values, definitions) {
  return definitions.map(([key, label, type = 'text', wide = false]) => {
    const className = wide ? 'wide' : '';
    const value = escapeHtml(values[key] ?? '');
    const control = type === 'textarea'
      ? `<textarea data-key="${key}">${value}</textarea>`
      : `<input data-key="${key}" type="${type}" value="${value}">`;

    return `<label class="${className}">${label}${control}</label>`;
  }).join('');
}

async function request(url, options = {}) {
  const response = await fetch(`${backendOrigin}${url}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options
  });
  const contentType = response.headers.get('content-type') || '';

  if (!contentType.includes('application/json')) {
    throw new Error(
      `JSON erwartet, aber ${contentType || 'unbekannter Inhaltstyp'} empfangen ` +
      `(HTTP ${response.status}).`
    );
  }

  const responseData = await response.json();
  if (!response.ok) {
    throw new Error(responseData.error || 'Request failed');
  }

  return responseData;
}

function setDirty(value = true) {
  dirty = value;
  $('#status').textContent = value
    ? 'Nicht gespeicherte Änderungen'
    : 'Alle Änderungen gespeichert';
}

function toast(message, isError = false) {
  const element = $('#toast');
  element.textContent = message;
  element.style.background = isError ? '#552326' : '#183626';
  element.classList.add('show');
  setTimeout(() => element.classList.remove('show'), 2500);
}

async function loadScenarios(selectedId) {
  const scenarios = await request('/api/scenarios');
  const select = $('#scenario-select');

  select.innerHTML = scenarios.map(scenario => (
    `<option value="${scenario.id}">${escapeHtml(scenario.name)}</option>`
  )).join('');
  select.value = selectedId || scenarios[0]?.id;

  await loadScenario();
}

async function loadScenario() {
  const scenarioId = $('#scenario-select').value;
  data = await request(`/api/scenarios/${scenarioId}/editor`);
  selectedNation = null;
  selectedRegion = null;
  setDirty(false);
  await mapController.loadScenario({ id: scenarioId });
  renderAll();
}

function renderAll() {
  renderMeta();
  renderNations();
  renderMap();
  showEmpty();
}

function renderMeta() {
  const definitions = [
    ['name', 'Name'],
    ['description', 'Beschreibung', 'textarea', true],
    ['period', 'Zeitraum'],
    ['startDate', 'Startdatum', 'date'],
    ['minDate', 'Frühestes Datum', 'date'],
    ['maxDate', 'Spätestes Datum', 'date'],
    ['worldContext', 'KI-Weltkontext', 'textarea', true],
    ['simulationRules', 'Simulationsregeln', 'textarea', true]
  ];
  const form = $('#meta-form');

  form.innerHTML = `
    <h2>Szenario</h2>
    <div class="field-grid">${renderFields(data.scenario, definitions)}</div>
  `;
  form.oninput = event => {
    if (!event.target.dataset.key) return;
    data.scenario[event.target.dataset.key] = event.target.value;
    setDirty();
  };
}

function getOwnedRegions(code) {
  return data.regions.regions
    .filter(region => region.nation_code === code)
    .sort((first, second) => first.name.localeCompare(second.name));
}

function ownedCount(code) {
  return getOwnedRegions(code).length;
}

function renderNations() {
  const query = $('#nation-search').value.toLowerCase();
  const nations = Object.entries(data.nations)
    .filter(([code, nation]) => `${code} ${nation.name}`.toLowerCase().includes(query))
    .sort((first, second) => first[1].name.localeCompare(second[1].name));

  $('#nation-list').innerHTML = nations.map(([code, nation]) => `
    <div class="nation-item ${selectedNation === code ? 'active' : ''}" data-code="${code}">
      <i class="swatch" style="background: ${nation.color}"></i>
      <span>
        ${escapeHtml(nation.name)}
        <small>${code} · ${ownedCount(code)} Gebiete</small>
      </span>
    </div>
  `).join('');
}

function renderMap() {
  mapAdapter.colors = data.nations;
  mapController.applyGameState({ regions: data.regions.regions });
}

function showEmpty() {
  $('#empty-detail').classList.remove('hidden');
  $('#nation-form').classList.add('hidden');
  $('#region-form').classList.add('hidden');
}

function renderOwnedRegions(code) {
  const regions = getOwnedRegions(code);
  const content = regions.length
    ? regions.map(region => `
        <button type="button" data-region-id="${escapeHtml(region.id)}">
          ${escapeHtml(region.name)}
          <small>${escapeHtml(region.id)}</small>
        </button>
      `).join('')
    : '<p class="empty-regions">Diesem Land sind keine Gebiete zugeordnet.</p>';

  return `
    <section class="owned-regions">
      <h3>Zugehörige Gebiete (${regions.length})</h3>
      <div class="region-list">${content}</div>
    </section>
  `;
}

function showNation(code) {
  const nation = data.nations[code];
  if (!nation) return;

  selectedNation = code;
  selectedRegion = null;
  renderNations();
  highlightRegion(null);

  const definitions = [
    ['name', 'Name'],
    ['color', 'Farbe', 'color'],
    ['ideology', 'Ideologie'],
    ['capital', 'Hauptstadt'],
    ['leader_name', 'Anführer'],
    ['leader_title', 'Titel'],
    ['population', 'Bevölkerung', 'number'],
    ['military_strength', 'Militärstärke', 'number']
  ];
  const form = $('#nation-form');

  $('#empty-detail').classList.add('hidden');
  $('#region-form').classList.add('hidden');
  form.classList.remove('hidden');
  form.innerHTML = `
    <h2>${escapeHtml(nation.name)}</h2>
    <div class="region-owner" style="border-color: ${nation.color}">
      ${code} · ${ownedCount(code)} Gebiete
    </div>
    <div class="field-grid">
      ${renderFields(nation, definitions)}
      <label>
        <input data-key="is_major_power" type="checkbox" ${nation.is_major_power ? 'checked' : ''}>
        Großmacht
      </label>
    </div>
    ${renderOwnedRegions(code)}
    <button type="button" class="danger" id="delete-nation">Land löschen</button>
  `;

  form.oninput = event => updateNation(event, code);
  form.onclick = event => {
    const regionButton = event.target.closest('[data-region-id]');
    if (regionButton) focusRegion(regionButton.dataset.regionId);
  };
  $('#delete-nation').onclick = () => deleteNation(code);
}

function updateNation(event, code) {
  const input = event.target;
  if (!input.dataset.key) return;

  const nation = data.nations[code];
  nation[input.dataset.key] = input.type === 'checkbox'
    ? input.checked
    : input.type === 'number' ? Number(input.value) : input.value;

  setDirty();
  renderNations();

  if (input.dataset.key === 'color' || input.dataset.key === 'name') {
    renderMap();
  }
}

function highlightRegion(id) {
  if (id) mapController.selectRegion(id, false);
  else mapController.clearSelection();
}

function focusRegion(id) {
  selectedRegion = id;
  highlightRegion(id);
  mapController.focusRegion(id);
}

function showRegion(id) {
  const region = data.regions.regions.find(item => item.id === id);
  if (!region) return;

  selectedRegion = id;
  highlightRegion(id);

  const form = $('#region-form');
  const nationOptions = Object.entries(data.nations)
    .sort((first, second) => first[1].name.localeCompare(second[1].name))
    .map(([code, nation]) => `
      <option value="${code}" ${code === region.nation_code ? 'selected' : ''}>
        ${escapeHtml(nation.name)} (${code})
      </option>
    `).join('');

  $('#empty-detail').classList.add('hidden');
  $('#nation-form').classList.add('hidden');
  form.classList.remove('hidden');
  form.innerHTML = `
    <h2>Gebiet bearbeiten</h2>
    <div class="region-owner" style="border-color: ${data.nations[region.nation_code]?.color}">
      ${escapeHtml(region.id)}
    </div>
    <label>Name<input data-key="name" value="${escapeHtml(region.name)}"></label>
    <label>Besitzer<select data-key="nation_code">${nationOptions}</select></label>
  `;
  form.oninput = event => {
    if (!event.target.dataset.key) return;
    region[event.target.dataset.key] = event.target.value;
    setDirty();
    renderMap();
    renderNations();
    showRegion(id);
  };
}

function assignRegion(id) {
  if (!selectedNation) {
    toast('Bitte zuerst ein Land auswählen.', true);
    return;
  }

  const region = data.regions.regions.find(item => item.id === id);
  region.nation_code = selectedNation;
  selectedRegion = id;
  setDirty();
  renderMap();
  renderNations();
  showNation(selectedNation);
  focusRegion(id);
}

function setScenarioPaneWidth(width) {
  const maxWidth = Math.max(MIN_SCENARIO_PANE_WIDTH, window.innerWidth - 650);
  const constrainedWidth = Math.min(maxWidth, Math.max(MIN_SCENARIO_PANE_WIDTH, width));
  document.documentElement.style.setProperty('--scenario-pane-width', `${constrainedWidth}px`);
  localStorage.setItem(SCENARIO_PANE_STORAGE_KEY, String(constrainedWidth));
}

function initializeScenarioPaneResize() {
  const savedWidth = Number(localStorage.getItem(SCENARIO_PANE_STORAGE_KEY));
  if (Number.isFinite(savedWidth) && savedWidth > 0) setScenarioPaneWidth(savedWidth);

  const resizer = $('#scenario-resizer');
  resizer.addEventListener('pointerdown', event => {
    event.preventDefault();
    resizer.setPointerCapture(event.pointerId);
    document.body.classList.add('resizing');
  });
  resizer.addEventListener('pointermove', event => {
    if (!resizer.hasPointerCapture(event.pointerId)) return;
    setScenarioPaneWidth(event.clientX);
  });
  resizer.addEventListener('pointerup', event => {
    if (resizer.hasPointerCapture(event.pointerId)) resizer.releasePointerCapture(event.pointerId);
    document.body.classList.remove('resizing');
  });
  resizer.addEventListener('keydown', event => {
    const currentWidth = $('.scenario-pane').getBoundingClientRect().width;
    if (event.key === 'ArrowLeft') setScenarioPaneWidth(currentWidth - 10);
    if (event.key === 'ArrowRight') setScenarioPaneWidth(currentWidth + 10);
    if (event.key === 'Home') setScenarioPaneWidth(DEFAULT_SCENARIO_PANE_WIDTH);
  });
}

function addNation() {
  const code = (prompt('Ländercode (2–5 Großbuchstaben/Ziffern):') || '').trim().toUpperCase();
  if (!/^[A-Z0-9]{2,5}$/.test(code)) return toast('Ungültiger Ländercode.', true);
  if (data.nations[code]) return toast('Dieser Code existiert bereits.', true);

  data.nations[code] = {
    code,
    name: 'Neues Land',
    ideology: 'authoritarian',
    is_major_power: false,
    leader_name: '',
    leader_title: '',
    population: 0,
    military_strength: 0,
    color: '#d6a84b',
    capital: ''
  };
  setDirty();
  showNation(code);
}

function deleteNation(code) {
  if (ownedCount(code)) {
    toast('Weise zuerst alle Gebiete einem anderen Land zu.', true);
    return;
  }
  if (!confirm(`${data.nations[code].name} wirklich löschen?`)) return;

  delete data.nations[code];
  delete data.roadmaps[code];
  selectedNation = null;
  setDirty();
  renderNations();
  showEmpty();
}

async function save() {
  try {
    await request(`/api/scenarios/${data.scenario.id}/editor`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
    setDirty(false);
    toast('Szenario gespeichert.');
  } catch (error) {
    toast(error.message, true);
  }
}

async function createScenario() {
  const id = (prompt('Neue Szenario-ID (klein, ohne Leerzeichen):') || '').trim();
  if (!id) return;

  const name = (prompt('Anzeigename:') || id).trim();
  try {
    await request('/api/scenarios', {
      method: 'POST',
      body: JSON.stringify({ id, name, sourceId: data.scenario.id })
    });
    await loadScenarios(id);
    toast('Szenario wurde erstellt.');
  } catch (error) {
    toast(error.message, true);
  }
}

function bindEvents() {
  $('#scenario-select').onchange = () => {
    if (!dirty || confirm('Ungespeicherte Änderungen verwerfen?')) {
      loadScenario().catch(error => toast(error.message, true));
    } else {
      $('#scenario-select').value = data.scenario.id;
    }
  };
  $('#nation-search').oninput = renderNations;
  $('#nation-list').onclick = event => {
    const item = event.target.closest('[data-code]');
    if (item) showNation(item.dataset.code);
  };
  $('#zoom-in').onclick = () => mapController.zoomIn();
  $('#zoom-out').onclick = () => mapController.zoomOut();
  $('#zoom-reset').onclick = () => mapController.resetView();
  $('#add-nation').onclick = addNation;
  $('#save').onclick = save;
  $('#new-scenario').onclick = createScenario;
  window.onbeforeunload = () => dirty ? 'Ungespeicherte Änderungen' : undefined;
}

mapController.addEventListener('region-selected', event => {
  const region = event.detail;
  if ($('#paint-mode').checked) assignRegion(region.id);
  else showRegion(region.id);
});
mapController.addEventListener('camera-changed', event => {
  zoom = event.detail.camera.zoom;
  $('#zoom-level').textContent = `${Math.round(zoom * 100)} %`;
});

initializeScenarioPaneResize();
bindEvents();
mapController.initialize('#editor-map')
  .then(() => loadScenarios('kaiserreich'))
  .catch(error => toast(error.message, true));
