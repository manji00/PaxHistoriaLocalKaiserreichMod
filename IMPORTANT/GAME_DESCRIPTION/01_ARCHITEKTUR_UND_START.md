# 1. Architektur und Start

## 1.1 Komponenten

```text
Browser (HTML/CSS + klassische JS-Panels)
  └─ ES-Modul-Bridge + Phaser-4-Canvas-Karte
       │ REST/JSON                    │ WebSocket
       ▼                              ▼
Express/Node.js auf Port 3000 ───── WebSocket.Server
       ├─ GameEngine (Save-/Rundenlogik)
       ├─ ScenarioService (Szenario-JSON)
       └─ LLMService ──► lokales oder externes LLM
              │
Dateisystem ◄─┴─► data/saves, data/scenarios, data/llm_settings.json
```

Es gibt trotz der Abhängigkeit `pg` keine Datenbankanbindung. `/api/health`
meldet ausdrücklich `database: none (file-based)`. Alles Persistente liegt in
JSON- oder Textdateien.

## 1.2 Serverstart

- `backend/server.js` lädt `.env`, Express, CORS, JSON-Body-Parsing, HTTP und
  WebSocket.
- Standardport ist `3000`, überschreibbar über `PORT`.
- JSON-Requests sind standardmäßig auf `10mb` begrenzt, überschreibbar über
  `JSON_BODY_LIMIT`; dadurch kann der Szenarioeditor seine vollständigen
  Regionsdaten speichern.
- Alle API-Router werden unter `/api/...` montiert.
- Existiert `frontend/dist/index.html`, wird der Vite-Build ausgeliefert;
  andernfalls direkt der Quellordner `frontend/`.
- Unbekannte `/api`-Routen liefern JSON-404 statt versehentlich `index.html`.
- Alle übrigen GET-Pfade fallen auf das Frontend-`index.html` zurück.

Start im Repository:

```bash
cd backend
npm start
```

Für Frontend-Entwicklung kann Vite separat laufen (`cd frontend && npm run
dev`). Der klassische API-Client leitet bei `localhost` und einem anderen Port
als 3000 automatisch auf den Express-Port 3000 um.

## 1.3 Frontend-Bootstrap

`frontend/index.html` lädt `src/main.js` als ES-Modul. Dieses Modul:

1. erstellt `PhaserMapAdapter` und `MapController`;
2. stellt Kompatibilitätsobjekte (`gameMap`, Manager) auf `window` bereit;
3. lädt nacheinander die klassischen Scripts `api.js`, fünf Panels und
   `app.js`;
4. `app.init()` prüft `/api/health`, verbindet WebSocket, initialisiert die
   Karte und Panels, lädt Szenarien und LLM-Einstellungen und öffnet das Menü.

## 1.4 Verantwortungsgrenzen

- **Frontend:** Anzeige, Benutzereingaben, kurzlebiger `currentGame`-Zustand.
- **REST-Routen:** Validierung auf Endpunktebene und Übersetzung HTTP ↔ Engine.
- **GameEngine:** kanonischer veränderlicher Zustand und Rundenauswertung.
- **ScenarioService:** statische Szenariodaten lesen/schreiben.
- **LLMService:** Providerkonfiguration, Prompts, Modellaufrufe, Antwortparsing.
- **Dateisystem:** einzige dauerhafte Datenhaltung.
