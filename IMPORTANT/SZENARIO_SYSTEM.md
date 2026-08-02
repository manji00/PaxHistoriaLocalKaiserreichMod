# Szenario-System

## Ablauf im Spiel

Beim Klick auf **New Game** wird zuerst das Szenario gewählt. Danach lädt das
Frontend die Länder und Datumsgrenzen dieses Szenarios und zeigt die
Länderauswahl. `POST /api/game/new` erhält `scenarioId`; die ID wird dauerhaft
im Spielstand als `scenarioId` gespeichert. Beim Laden eines Spielstands wird
damit wieder dasselbe Szenariopaket ausgewählt. Alte Spielstände ohne dieses
Feld werden aus Kompatibilitätsgründen als `original_wk` behandelt.

Aktuell existieren:

- `original_wk`: der bisherige Datenstand;
- `kaiserreich`: eine getrennte Kopie als Arbeitsgrundlage. Die Inhalte sind
  absichtlich noch weitgehend identisch zum Original und können nun unabhängig
  weiterentwickelt werden.

## Aufbau eines Szenarios

Jedes Szenario liegt unter `data/scenarios/<id>/`:

| Datei | Zweck |
| --- | --- |
| `scenario.json` | Name, Beschreibung, Datum, Karten-URL, KI-Weltkontext und Regeln |
| `nations.json` | Länder, Farben, Anführer und Basiswerte |
| `regions.json` | Regionen, Pfade und ursprüngliche Besitzer |
| `region_metadata.json` | zusätzliche Regionswerte |
| `cities.json` | Städte und Hauptstädte |
| `units.json` | Starttruppen |
| `roadmaps.json` | historische beziehungsweise alternative KI-Roadmaps |

Die SVG-Karte liegt unter `frontend/maps/<id>.svg`; ihr Pfad wird im Feld
`map` der `scenario.json` angegeben. Regions-IDs in SVG und `regions.json`
müssen übereinstimmen.

## Daten austauschen oder ein Szenario hinzufügen

Zum Bearbeiten von Kaiserreich werden ausschließlich die Dateien in
`data/scenarios/kaiserreich/` und `frontend/maps/kaiserreich.svg` geändert.
Das Original bleibt dadurch unangetastet. Ländercodes müssen zwischen Ländern,
Regionen, Städten, Einheiten und Roadmaps konsistent sein.

Ein neues Szenario entsteht durch Kopieren eines vorhandenen Ordners und der
SVG-Datei. Danach müssen mindestens `id`, `name`, `map`, Datumswerte,
`worldContext` und `simulationRules` in `scenario.json` geändert werden. Die
API entdeckt gültige Szenarioordner automatisch; es ist keine zusätzliche
Registrierung im Code nötig. IDs dürfen Kleinbuchstaben, Zahlen, `_` und `-`
enthalten.

## API

- `GET /api/scenarios` listet die verfügbaren Szenarien.
- `GET /api/scenarios/:id` liefert die Metadaten.
- `GET /api/nations?scenario_id=<id>` lädt die zugehörigen Länder.
- Karten-, Farb- und Städte-Endpunkte akzeptieren ebenfalls `scenario_id`.
- Spielstandsbezogene Endpunkte verwenden die im Save gespeicherte ID.

Szenarioinhalte werden serverseitig aus JSON gelesen. Ein Austausch der Daten
erfordert daher keine Änderungen an den Routen oder am Frontend.
