# 5. Szenarien und Weltdaten

## 5.1 Paketstruktur

Jedes gültige Szenario liegt in `data/scenarios/<id>/`; IDs dürfen nur
Kleinbuchstaben, Ziffern, `_` und `-` enthalten. Das Vorhandensein einer
`scenario.json` macht den Ordner auffindbar.

| Datei | Laufzeitverwendung |
| --- | --- |
| `scenario.json` | Metadaten, Datum, Karten-/Geometriepfad, KI-Kontext/Regeln |
| `nations.json` | statische Länder, Farben, Führer, Basiswerte |
| `regions.json` | Regions-ID, Name, Pfad/Farbe, ursprünglicher Besitzer |
| `region_metadata.json` | Terrain, Städte, Nachbarn u. a. Metadaten |
| `cities.json` | Kartenmarker |
| `units.json` | Vorlagen der Starteinheiten |
| `roadmaps.json` | vorgesehen für Agenten, derzeit vom LLM nicht geladen |

Aktuell existieren `original_wk` und `kaiserreich`. Kaiserreich hat eigene
Daten und 90 statt 77 Länder, enthält aber weiterhin viele kopierte
Originaldaten. Szenariometadaten deklarieren 1935–1945 und erlauben in der UI
Startdaten von 1935-01-01 bis 1939-09-01.

## 5.2 Szenariometadaten

Wichtige Felder: `id`, `name`, `description`, `period`, `startDate`, `minDate`,
`maxDate`, `map`, `geometry`, `worldContext`, `simulationRules`.

`map` verweist auf eine SVG-Datei, wird im aktuellen Phaser-Laufzeitrenderer
aber nicht direkt geladen. Relevant ist `geometry`, eine vorverarbeitete
JSON-Geometrie. `worldContext` und `simulationRules` werden bei Spielbeginn in
den Save kopiert; spätere Szenarioänderungen verändern bestehende Saves nicht.

## 5.3 Länder

`nations.json` ist ein Objekt nach Ländercode. Übliche statische Felder sind
Code, englischer Name, Ideologie, Großmachtflag, Name/Titel des Führers,
Bevölkerung, militärische Stärke, Farbe und Hauptstadt. Nur `manpower` wird
bei der initialen dynamischen Staatslage direkt übernommen; Population und
militärische Stärke sind Anzeige-/Kontextdaten und keine laufende Simulation.

Ein Land gilt in der Auswahl als territorial, wenn irgendeine Region exakt
seinen Code als `nation_code` besitzt. Ländercodes müssen im Editor 2–5
Großbuchstaben/Ziffern lang sein. Diverse Agentenlogik erkennt im Freitext
allerdings nur exakt drei Großbuchstaben.

## 5.4 Regionen und Metadaten

`regions.json` hat eine `regions`-Liste. Die geometrische JSON-Datei und diese
Liste werden über die stringifizierte `id` verbunden. Fehlt eine ID auf einer
Seite, wird die Region nicht gerendert. Die Farbe kommt vorrangig aus dem
Besitzerland, danach aus `region.fill`, sonst Grau.

Die Listenroute `/api/regions` fügt Metadaten per `metadata[r.name]` oder
`metadata[r.id]` hinzu und legt Save-Besetzungen über `nation_code`. Die
Detail- und Statistikroute arbeitet dagegen noch mit den globalen
Legacy-Dateien `data/hoi4_map.json` und `data/region_metadata.json`; sie kann
für Nicht-Original-Szenarien daher andere Daten liefern.

## 5.5 Geometrieartefakte und SVG

`frontend/maps/<id>.geometry.json` enthält mindestens Version, ViewBox,
Regionen mit Pfad/BBox/Zentrum und optionale `nationLabels`. Es ist die aktive
Phaser-Quelle. `frontend/maps/<id>.svg` ist Szenarioquelle/Editorartefakt, und
`frontend/1936.svg` ist Legacy. Änderungen an SVG/Regionsdaten erfordern eine
Neugenerierung der Geometrie (`npm run map:build`) und Validierung
(`npm run map:validate`), damit IDs und Pfade synchron bleiben.

## 5.6 Städte

Städte sind Arrays mit ID, Name, `nation_code`, Typ (`capital` oder normal) und
Weltkoordinaten `[x,y]`. Der Renderer zeichnet Hauptstädte größer/goldfarben.
Städte haben keine Wirtschafts- oder Eroberungslogik. Eine Besetzung ändert
ihren `nation_code` nicht.

## 5.7 Einheiten

Szenarioeinheiten verwenden `name`, `type`, `nation`, `region`, `coords`.
Beim Kopieren in den Save werden daraus `unit_type`, `nation_code`,
`region_id`, `centroid` sowie die Standardwerte. Nur Save-Einheiten sind nach
Spielbeginn relevant; spätere Änderungen an `units.json` wirken nicht auf
bestehende Spiele.

## 5.8 Szenarioeditor

`frontend/editor.html`/`js/editor.js` kann Pakete abrufen und gesammelt über
`PUT /api/scenarios/:id/editor` schreiben. Der Server prüft:

- Szenario und Länder/Regionen vorhanden;
- `scenario.id` unverändert;
- gültige Ländercodes und übereinstimmendes `nation.code`;
- jede Region besitzt ID und gültigen Besitzer.

Städte, Einheiten und Roadmaps werden nur grob auf Array/Objektform geprüft;
Referenzen werden nicht validiert. `region_metadata.json` ist nicht Teil des
Editorpayloads und kann über `writeJson` nicht geschrieben werden.

`POST /api/scenarios` kopiert ein existierendes Paket und, falls vorhanden,
die in dessen Metadaten genannte SVG. Es kopiert/erzeugt **keine passend
umbenannte Geometrie-JSON**, obwohl die kopierten Metadaten weiterhin auf die
Geometrie des Quellszenarios zeigen können.
