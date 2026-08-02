# Szenario-Analyse und Einstiegspunkte

Diese Notiz dokumentiert, an welchen Stellen das historische Szenario von Pax
Historia verändert wird. Das Szenario ist derzeit nicht als einzelnes Paket
modelliert, sondern über mehrere JSON-, JavaScript-, HTML- und SVG-Dateien
verteilt.

## Zentrale Datenquellen

| Szenarioelement | Primäre Quelle |
| --- | --- |
| Existierende und spielbare Länder | `data/nations_v2.json` |
| Eigentümer der Gebiete | `data/hoi4_map.json`, Feld `regions[].nation_code` |
| Geometrie und Grenzen | `frontend/1936.svg` und `data/hoi4_map.json` |
| Startdatum und Zeitraum | `frontend/index.html`, `backend/routes/game.js`, `backend/services/game-engine.js` |
| Hauptstädte und Städte | `data/cities.json` |
| Historischer Hintergrund für die KI | `data/historical_roadmaps.json` |
| Startarmeen | `GameEngine.createStartingUnits()` in `backend/services/game-engine.js` |
| Ländernamen auf der Karte | `NationLabelManager.nationCoordinates` in `frontend/js/nations.js` |
| KI-Zeitraum und Szenarioregeln | `backend/services/llm-service.js` |
| Dynamische Besetzungen | `nations[CODE].occupied_regions` in `data/saves/*.json` |

## 1. Länder

`data/nations_v2.json` ist die zentrale Länderliste. Ein Eintrag verwendet
einen eindeutigen Code, üblicherweise mit drei Zeichen, und enthält unter
anderem:

```json
{
  "TAG": {
    "code": "TAG",
    "name": "Anzeigename",
    "ideology": "authoritarian",
    "is_major_power": false,
    "leader_name": "Name",
    "leader_title": "Titel",
    "population": 1000000,
    "military_strength": 10,
    "color": "#c8102e",
    "capital": "Hauptstadt"
  }
}
```

`backend/routes/nations.js` markiert ein Land als territorial aktiv, wenn sein
Code mindestens einmal in `data/hoi4_map.json` vorkommt. Beim Hinzufügen oder
Entfernen eines Landes müssen deshalb auch Gebiete, Städte, Einheiten,
Beschriftungen und Roadmaps auf diesen Code geprüft werden.

`scripts/rebuild_nations.ps1` enthält eine weitere hart codierte Länderliste
und überschreibt `data/nations_v2.json`. Änderungen müssen entweder auch dort
eingepflegt werden oder das Skript darf für das neue Szenario nicht verwendet
werden.

## 2. Gebietsbesitz

Der Grundbesitz steht in `data/hoi4_map.json`. Jede Region besitzt mindestens
`id`, `name`, `path`, `fill` und `nation_code`. Für einen reinen Besitzerwechsel
wird nur `nation_code` auf einen gültigen Code aus `nations_v2.json` geändert.

Die Landesfarbe stammt zur Laufzeit primär aus `nations_v2.json`; der Renderer
in `frontend/js/map.js` überschreibt damit die ursprüngliche SVG-Farbe.

Bei geladenen Spielen legt `backend/routes/regions.js` die Einträge aus
`occupied_regions` über den Grundbesitz. Nach einer Szenarioänderung sollte
daher ein neues Spiel begonnen oder ein alter Save vollständig migriert
werden.

## 3. Grenzen und Regionsgeometrie

Für veränderte Grenzverläufe müssen zwei Darstellungen synchron bleiben:

1. `frontend/1936.svg` enthält die tatsächlich gerenderten SVG-Pfade.
2. `data/hoi4_map.json` enthält Regions-IDs, Pfade und Besitzer.

`frontend/js/map.js` verbindet SVG-Pfade und Regionsdaten über die jeweilige
`id`. Abweichende IDs führen zu Regionen ohne Interaktion oder Szenariofarbe.

`backend/scripts/parse_svg.js` verweist derzeit nicht auf die im Frontend
verwendete Position der SVG-Datei und setzt `nation_code` zunächst auf eine
Farbe. Die Karten-Skripte müssen daher vor einer Regenerierung geprüft und an
das neue Szenario angepasst werden. Insbesondere
`backend/scripts/advanced_map_regions.js` enthält 1936-spezifische Regeln.

`data/world-1938.json` ist keine aktive Karte; die untersuchten Routen und der
Renderer laden diese Datei nicht.

## 4. Datum und Zeitraum

Das Datum ist mehrfach fest codiert:

- `frontend/index.html`: Standarddatum, Minimum, Maximum und sichtbare Texte.
- `backend/routes/game.js`: Fallback-Startdatum.
- `backend/services/game-engine.js`: Defaultdatum, `world_context` und
  `simulation_rules`.
- `backend/routes/chat.js`: historischer Fallback-Kontext.
- `backend/services/llm-service.js`: Zeitraum und historische Beispiele in den
  Prompts.

Alle Stellen müssen gemeinsam geändert werden. Zusätzlich sollte das Backend
das Datumsformat und den erlaubten Szenariozeitraum validieren, statt sich nur
auf das HTML-Datumsfeld zu verlassen.

## 5. Städte und Hauptstädte

`data/cities.json` enthält `id`, `name`, `nation_code`, `type` und SVG-
Koordinaten `[x, y]`. Ein Gebietswechsel aktualisiert Städte nicht automatisch.
Das Feld `capital` in `nations_v2.json` und ein Marker mit
`type: "capital"` in `cities.json` müssen separat konsistent gehalten werden.

## 6. Kartenbeschriftungen

`frontend/js/nations.js` positioniert Ländernamen manuell in
`NationLabelManager.nationCoordinates`. Neue Länder brauchen dort Position,
Größe, Winkel, Buchstabenabstand und Text. Ein entfernter Staat muss dort
ebenfalls entfernt werden, sonst kann seine Beschriftung bestehen bleiben.

Langfristig sollte der Renderer nur Beschriftungen für Länder mit tatsächlich
vorhandenem Territorium erzeugen.

## 7. Starttruppen

Die Startaufstellung ist direkt in `GameEngine.createStartingUnits()` in
`backend/services/game-engine.js` definiert und nicht vom gewählten Datum
abhängig. Für ein neues Szenario müssen Ländercodes, Regions-IDs, Namen,
Einheitstypen und SVG-Koordinaten ersetzt werden.

Empfohlen ist die Auslagerung in eine szenariospezifische JSON-Datei. Bei
`region_id` sollten stabile IDs aus `hoi4_map.json` statt frei formulierter
Ortsnamen verwendet werden.

## 8. Historische Roadmaps und KI

`data/historical_roadmaps.json` liefert Profile, narrative Geschichte,
strategische Dilemmas, historische Fehler und Meilensteine. Die Schlüssel
müssen exakt den Ländercodes entsprechen.

`backend/services/llm-service.js` enthält weiterhin einen festen historischen
Zeitraum und konkrete Beispiele aus 1935/1936. Ohne Anpassung dieser Prompts
würde die KI trotz neuer Karte Ereignisse aus dem alten Szenario erzeugen.
Auch `world_context`, `simulation_rules` und Chat-Fallbacks müssen den neuen
Ausgangspunkt beschreiben.

## 9. Empfohlene Reihenfolge für einen einmaligen Umbau

1. Länder und Codes in `data/nations_v2.json` festlegen.
2. Regionen in `data/hoi4_map.json` diesen Codes zuweisen.
3. Nur bei neuen Grenzverläufen SVG und Map-JSON gemeinsam bearbeiten.
4. Städte und Hauptstädte in `data/cities.json` aktualisieren.
5. Ländernamen in `frontend/js/nations.js` positionieren.
6. Starttruppen in `GameEngine.createStartingUnits()` ersetzen.
7. Datum, Weltkontext, Regeln und KI-Prompts umstellen.
8. Roadmaps ergänzen oder ersetzen.
9. Neue Spielstände anlegen oder alte Saves ausdrücklich migrieren.

## 10. Empfohlene langfristige Architektur

Für mehrere Szenarien sollte jedes Szenario ein Paket wie
`data/scenarios/<scenario-id>/` mit folgenden Dateien erhalten:

- `scenario.json`: ID, Name, Startdatum, Zeitraum, Kartenpfad, Weltkontext und
  Simulationsregeln.
- `nations.json`
- `regions.json`
- `cities.json`
- `units.json`
- `roadmaps.json`

Die zugehörige SVG kann unter `frontend/maps/<scenario-id>.svg` liegen.
`POST /api/game/new` sollte eine `scenarioId` annehmen, die ID im Save sichern
und alle Routen sollten ihre Daten anhand dieser ID beziehungsweise anhand der
`save_id` laden. Dadurch entfallen die derzeit über das Repository verteilten
1936-Defaults.

