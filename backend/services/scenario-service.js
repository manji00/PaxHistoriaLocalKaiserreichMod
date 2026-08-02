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

module.exports = { defaultScenarioId, getScenario, listScenarios, readJson, getScenarioIdFromRequest };
