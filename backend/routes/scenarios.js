const express = require('express');
const fs = require('fs');
const path = require('path');
const scenarios = require('../services/scenario-service');
const router = express.Router();

router.get('/', (req, res) => {
    try { res.json(scenarios.listScenarios()); }
    catch (error) { res.status(500).json({ error: error.message }); }
});

router.get('/:id', (req, res) => {
    try { res.json(scenarios.getScenario(req.params.id)); }
    catch (error) { res.status(404).json({ error: error.message }); }
});

router.get('/:id/editor', (req, res) => {
    try {
        res.json({
            scenario: scenarios.getScenario(req.params.id),
            nations: scenarios.readJson(req.params.id, 'nations.json', {}),
            regions: scenarios.readJson(req.params.id, 'regions.json', { regions: [] }),
            cities: scenarios.readJson(req.params.id, 'cities.json', []),
            units: scenarios.readJson(req.params.id, 'units.json', []),
            roadmaps: scenarios.readJson(req.params.id, 'roadmaps.json', {})
        });
    } catch (error) { res.status(404).json({ error: error.message }); }
});

router.put('/:id/editor', (req, res) => {
    try {
        const { scenario, nations, regions, cities, units, roadmaps } = req.body;
        if (!scenario || !nations || !regions || !Array.isArray(regions.regions)) throw new Error('Incomplete scenario data');
        if (scenario.id !== req.params.id) throw new Error('Scenario id cannot be changed');
        for (const [code, nation] of Object.entries(nations)) {
            if (!/^[A-Z0-9]{2,5}$/.test(code) || nation.code !== code) throw new Error(`Invalid nation code: ${code}`);
        }
        for (const region of regions.regions) {
            if (!region.id || !nations[region.nation_code]) throw new Error(`Region ${region.id || '?'} has an invalid owner`);
        }
        scenarios.writeJson(req.params.id, 'scenario.json', scenario);
        scenarios.writeJson(req.params.id, 'nations.json', nations);
        scenarios.writeJson(req.params.id, 'regions.json', regions);
        scenarios.writeJson(req.params.id, 'cities.json', Array.isArray(cities) ? cities : []);
        scenarios.writeJson(req.params.id, 'units.json', Array.isArray(units) ? units : []);
        scenarios.writeJson(req.params.id, 'roadmaps.json', roadmaps || {});
        res.json({ ok: true });
    } catch (error) { res.status(400).json({ error: error.message }); }
});

router.post('/', (req, res) => {
    try {
        const { id, name, sourceId = scenarios.defaultScenarioId } = req.body;
        if (!scenarios.validId.test(id || '')) throw new Error('ID may only contain lowercase letters, numbers, _ and -');
        const destination = path.join(scenarios.scenariosDir, id);
        if (fs.existsSync(destination)) throw new Error('Scenario already exists');
        const source = path.join(scenarios.scenariosDir, sourceId);
        scenarios.getScenario(sourceId);
        fs.cpSync(source, destination, { recursive: true });
        const metadata = scenarios.getScenario(id);
        metadata.id = id;
        metadata.name = (name || id).trim();
        const sourceMap = path.join(__dirname, '../../frontend', metadata.map);
        const mapName = `maps/${id}.svg`;
        const destinationMap = path.join(__dirname, '../../frontend', mapName);
        if (fs.existsSync(sourceMap)) fs.copyFileSync(sourceMap, destinationMap);
        metadata.map = mapName;
        scenarios.writeJson(id, 'scenario.json', metadata);
        res.status(201).json(metadata);
    } catch (error) { res.status(400).json({ error: error.message }); }
});

module.exports = router;
