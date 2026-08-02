const express = require('express');
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

module.exports = router;
