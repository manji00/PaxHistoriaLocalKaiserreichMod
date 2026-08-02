const express = require('express');
const GameEngine = require('../services/game-engine');
const scenarios = require('../services/scenario-service');
const router = express.Router();
const engine = new GameEngine();
const id = req => scenarios.getScenarioIdFromRequest(req);
const nations = req => scenarios.readJson(id(req), 'nations.json', {});

router.get('/geojson', (req, res) => { try { res.json(scenarios.readJson(id(req), 'regions.json', { regions: [] })); } catch (e) { res.status(400).json({ error: e.message }); } });
router.get('/colors', (req, res) => { try { const result = {}; Object.entries(nations(req)).forEach(([code,n]) => result[code] = { color:n.color, name:n.name }); res.json(result); } catch(e) { res.status(400).json({error:e.message}); } });
router.get('/search/:query', (req,res) => { try { const q=req.params.query.toLowerCase(); res.json(Object.entries(nations(req)).filter(([c,n]) => c.toLowerCase().includes(q)||n.name?.toLowerCase().includes(q)||n.name_local?.toLowerCase().includes(q)).slice(0,10).map(([code,n])=>({type:'nation',id:code,name:n.name,detail:n.capital,color:n.color,category:'Nations'}))); } catch(e){res.status(400).json({error:e.message});} });
router.get('/nation/:code/state/:saveId', async (req,res) => { try { const game=await engine.loadGame(req.params.saveId); const nation=engine.getNations(game.scenarioId)[req.params.code.toUpperCase()]; if(!nation)return res.status(404).json({error:'Nation not found'}); res.json({...nation,...(game.nations[req.params.code.toUpperCase()]||{})}); } catch(e){res.status(500).json({error:e.message});} });
router.get('/nation/:code', (req,res) => { try { const nation=nations(req)[req.params.code.toUpperCase()]; nation?res.json(nation):res.status(404).json({error:'Nation not found'}); } catch(e){res.status(400).json({error:e.message});} });
router.get('/cities', (req,res) => { try { res.json(scenarios.readJson(id(req),'cities.json',[])); } catch(e){res.status(400).json({error:e.message});} });
module.exports = router;
