const fs = require('fs');
const path = require('path');

const scenariosDir = path.join(__dirname, '../../data/scenarios');
const defaultScenarioId = 'original_wk';
const validId = /^[a-z0-9_-]+$/;

function scenarioDir(id = defaultScenarioId) {
    if (!validId.test(id)) throw new Error('Invalid scenario id');
    const dir = path.join(scenariosDir, id);
    if (!fs.existsSync(path.join(dir, 'scenario.json'))) throw new Error(`Scenario ${id} not found`);
    return dir;
}

function readJson(id, filename, fallback = null) {
    const file = path.join(scenarioDir(id), filename);
    if (!fs.existsSync(file)) return fallback;
    return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function writeJson(id, filename, value) {
    const allowed = new Set(['scenario.json', 'nations.json', 'regions.json', 'cities.json', 'units.json', 'roadmaps.json']);
    if (!allowed.has(filename)) throw new Error('Invalid scenario file');
    const file = path.join(scenarioDir(id), filename);
    const temporary = `${file}.tmp`;
    fs.writeFileSync(temporary, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
    fs.renameSync(temporary, file);
}

function getScenario(id = defaultScenarioId) {
    return readJson(id, 'scenario.json');
}

function listScenarios() {
    if (!fs.existsSync(scenariosDir)) return [];
    return fs.readdirSync(scenariosDir, { withFileTypes: true })
        .filter(entry => entry.isDirectory() && validId.test(entry.name))
        .map(entry => getScenario(entry.name))
        .sort((a, b) => a.name.localeCompare(b.name));
}

function getScenarioIdFromRequest(req) {
    return req.query.scenario_id || req.body?.scenarioId || defaultScenarioId;
}

module.exports = { defaultScenarioId, getScenario, listScenarios, readJson, writeJson, getScenarioIdFromRequest, scenariosDir, validId };
