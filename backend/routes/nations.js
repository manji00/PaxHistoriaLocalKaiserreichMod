const express = require('express');
const scenarioService = require('../services/scenario-service');
const router = express.Router();

function scenarioId(req) { return scenarioService.getScenarioIdFromRequest(req); }
function getNations(req) { return scenarioService.readJson(scenarioId(req), 'nations.json', {}); }
function withTerritory(req) {
    const nations = getNations(req);
    const map = scenarioService.readJson(scenarioId(req), 'regions.json', { regions: [] });
    const active = new Set(map.regions.map(region => region.nation_code).filter(Boolean));
    Object.keys(nations).forEach(code => { nations[code].has_territory = active.has(code); });
    return nations;
}
router.get('/', (req, res) => {
    try {
        const nations = Object.values(withTerritory(req)).sort((a, b) =>
            a.is_major_power !== b.is_major_power ? (a.is_major_power ? -1 : 1) : a.name.localeCompare(b.name));
        res.json(nations);
    } catch (error) { res.status(400).json({ error: error.message }); }
});
router.get('/code/:code', (req, res) => {
    try { const nation = getNations(req)[req.params.code.toUpperCase()]; nation ? res.json(nation) : res.status(404).json({ error: 'Nation not found' }); }
    catch (error) { res.status(400).json({ error: error.message }); }
});
router.get('/filter/major', (req, res) => {
    try { res.json(Object.values(getNations(req)).filter(n => n.is_major_power)); }
    catch (error) { res.status(400).json({ error: error.message }); }
});
router.get('/search/:query', (req, res) => {
    try { const q = req.params.query.toLowerCase(); res.json(Object.values(withTerritory(req)).filter(n =>
        [n.name, n.code, n.leader_name, n.capital].some(value => value?.toLowerCase().includes(q)))); }
    catch (error) { res.status(400).json({ error: error.message }); }
});
module.exports = router;
