# 11. Dateiindex der Laufzeit

## Backend

| Datei | Verantwortung |
| --- | --- |
| `backend/server.js` | Express, Static Hosting, Router, WebSocket, Broadcast |
| `backend/services/game-engine.js` | Saves, Initialzustand, Aktionen, Runden, Zustandsfolgen |
| `backend/services/scenario-service.js` | Szenarioauflistung, sicheres Szenario-ID-Format, JSON-I/O |
| `backend/services/llm-service.js` | Provider, Einstellungen, Prompts, Agentenaufrufe, Parsing |
| `backend/routes/game.js` | Neues/Laden/Listen/Löschen/Umbenennen/Advance/State |
| `backend/routes/actions.js` | Befehle und Brainstorming |
| `backend/routes/events.js` | Ereignisabfragen und Statistiken |
| `backend/routes/chat.js` | Diplomatische Chats und Antworten |
| `backend/routes/advisor.js` | Beraterworkflows und Verbindungstest |
| `backend/routes/units.js` | Save-Einheiten lesen/erzeugen/verschieben |
| `backend/routes/regions.js` | Regionslisten/Besetzungen sowie Legacy-Details |
| `backend/routes/map.js` | Regionsdaten, Farben, Kartenländer, Städte |
| `backend/routes/nations.js` | Länderliste, Suche, Großmächte, Territoriumsflag |
| `backend/routes/scenarios.js` | Szenariolesen, Editor und Kopieren |
| `backend/routes/llm.js` | LLM-Einstellungen und temporärer Test |

`backend/scripts/` enthält Import-, Parsing-, Mapping- und Validierungshilfen,
ist aber nicht Teil des gestarteten Spielprozesses.

## Frontend

| Datei | Verantwortung |
| --- | --- |
| `frontend/index.html` | DOM-Struktur, Modals, Panels, ES-Modul-Einstieg |
| `frontend/src/main.js` | Phaser-Bridge und sequenzielles Laden klassischer UI-Scripts |
| `frontend/js/api.js` | REST- und WebSocket-Client |
| `frontend/js/app.js` | globaler UI-Controller und Spielstart/-laden |
| `frontend/js/panels/actions-panel.js` | Aktionen |
| `frontend/js/panels/timeline-panel.js` | Zeitfortschritt |
| `frontend/js/panels/events-panel.js` | Ereignischronik |
| `frontend/js/panels/diplomacy-panel.js` | Diplomatie-UI |
| `frontend/js/panels/advisor-panel.js` | Berater-UI |
| `frontend/src/map/PhaserMapAdapter.js` | Rendereradapter, Datenladen, Auswahl, Kamera |
| `frontend/src/map/scenes/MapScene.js` | Canvas-Zeichenreihenfolge und Phaser-Szene |
| `frontend/src/map/layers/RegionLayer.js` | Geometrie/Region-Verbindung und Hit-Test |
| `frontend/src/map/CameraController.js` | Maus-/Radsteuerung |
| `frontend/src/map/CanvasManagers.js` | Städte-/Einheiten-Kompatibilitätsmanager |
| `frontend/src/map/geometry/*` | Artefaktladen, Koordinaten, einfacher Index |
| `frontend/editor.html`, `frontend/js/editor.js` | Szenarioeditor |

## Daten

- `data/scenarios/*`: aktive statische Szenariopakete.
- `frontend/maps/*`: aktive SVG- und Geometrieartefakte.
- `data/saves/*`: dynamische komplette Spielstände (zur Laufzeit erzeugt).
- `data/llm_settings.json`: globale LLM-Einstellungen (zur Laufzeit erzeugt).
- `data/debug/last_ai_response.txt`: letzter Game-Master-Rohoutput.
- `data/historical_roadmaps.json`: derzeit tatsächlich geladene Agentenroadmaps.
- `data/nations_v2.json`, `data/hoi4_map.json`, `data/cities.json` und
  `data/region_metadata.json`: Legacy-Daten; teilweise noch in Detailrouten oder
  Werkzeugen relevant, aber nicht die primäre Szenarioquelle.
