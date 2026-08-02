# Vollständiger Plan für den Port auf Phaser 4

## Zielbild

Die strategische Weltkarte wird vollständig in einem von Phaser verwalteten
Canvas gerendert. Dazu gehören Regionen, Grenzen, Städte, Einheiten,
Ländernamen, Auswahlzustände und Effekte. Menüs, Formulare und umfangreiche
Popups bleiben zunächst als zugängliche HTML-Oberfläche bestehen.

Die SVG-Karten bleiben vorerst editierbare Quelldaten. Für Phaser werden ihre
einzelnen Regionspfade in ein vorverarbeitetes, render- und hit-testbares
Geometrieformat übersetzt. Ein SVG darf nicht lediglich als eine einzige
Textur gerendert werden, weil Regionen sonst nicht unabhängig auswählbar,
einfärbbar oder animierbar wären.

## Architekturgrundsätze

- Phaser kennt nur Darstellung, Kamera und Canvas-Eingaben.
- Ein frameworkneutraler `MapController` verbindet Phaser, Spiellogik und DOM.
- Szenario- und Spielstandsdaten bleiben in den bestehenden JSON-Paketen.
- Weltkoordinaten entsprechen dem `viewBox` der jeweiligen Szenariokarte.
- Statische Szenariodaten und dynamischer Spielzustand bleiben getrennt.
- Leaflet wird erst nach funktionaler Parität vollständig entfernt.
- Eine konkret getestete Phaser-4-Version wird exakt im Lockfile fixiert.

## Phase 1: Frontend-Fundament

- [ ] Frontend-`package.json` und Lockfile anlegen.
- [ ] Eine konkrete Phaser-4-Version festschreiben.
- [ ] Vite oder einen vergleichbar schlanken Bundler einführen.
- [ ] Scripts für Entwicklung, Build, Preview und Tests definieren.
- [ ] Einen ES-Modul-Einstieg unter `frontend/src/main.js` schaffen.
- [ ] Entwicklungs- und Produktions-URLs für API und WebSocket zentral
      konfigurieren.
- [ ] Express so konfigurieren und dokumentieren, dass gebaute Assets im
      Produktionsbetrieb korrekt ausgeliefert werden.
- [ ] Leaflet während dieser Phase noch als Fallback beibehalten.

## Phase 2: Renderer-unabhängige Kartenschnittstelle

- [ ] `frontend/src/map/MapController.js` einführen.
- [ ] Die Operationen `initialize`, `loadScenario`, `applyGameState`, `resize`,
      `zoomIn`, `zoomOut`, `resetView`, `focusNation`, `focusRegion`,
      `selectRegion`, `clearSelection`, `setLayerVisibility` und `destroy`
      definieren.
- [ ] Events für Region-Hover, Regionsauswahl, Doppelklick, Städte, Einheiten,
      Kameraänderung, Bereitschaft und Ladefehler definieren.
- [ ] Popup-, Such- und Formatierungslogik aus `frontend/js/map.js` lösen.
- [ ] Direkte Zugriffe aus `frontend/js/app.js` auf Leaflet, `svgLayer` und
      native SVG-Elemente durch den Controller ersetzen.
- [ ] Vorübergehend einen Leaflet- und einen Phaser-Adapter hinter derselben
      Schnittstelle anbieten.

## Phase 3: Phaser-Canvas und Scene-Struktur

- [ ] Phaser sein Canvas im vorhandenen Kartencontainer `#map` anlegen lassen.
- [ ] Renderer, Hintergrund, Auflösung und begrenzte Device Pixel Ratio
      konfigurieren.
- [ ] Eine `MapScene` mit sauberem `init`, `preload`, `create`, Update- und
      Shutdown-Lebenszyklus erstellen.
- [ ] Getrennte Layer beziehungsweise Container für Hintergrund,
      Regionenfüllungen, Grenzen, Städte, Ländernamen, Einheiten, Auswahl und
      Effekte einführen.
- [ ] Depth-Werte zentral statt als verteilte Zahlen definieren.
- [ ] Größenänderungen über `ResizeObserver` behandeln.
- [ ] Beim Szenariowechsel alle Objekte, Handler, Texturen und Subscriptions
      zuverlässig freigeben.

## Phase 4: Karten- und Geometrie-Pipeline

- [ ] Ein Build-Werkzeug unter `tools/map-build/` erstellen.
- [ ] SVG-Pfade über ihre Regions-ID einlesen und in normalisierte Konturen
      beziehungsweise triangulierbare Polygone übersetzen.
- [ ] Inseln, mehrere Teilflächen und Innenringe unterstützen.
- [ ] Pro Szenario ein Laufzeitartefakt mit `viewBox`, Weltgröße, Regions-ID,
      Konturen, Bounding Box, Schwerpunkt und Label-Anker erzeugen.
- [ ] Vereinfachte Konturen für schnelle Hit-Tests generieren.
- [ ] Geometrie einmalig im Build oder beim Laden triangulieren und cachen,
      niemals in jedem Frame.
- [ ] Vollständigkeit und Eindeutigkeit der IDs zwischen SVG und
      `regions.json` validieren.
- [ ] Ungültige oder offene Pfade mit verständlichen Build-Fehlern ablehnen.
- [ ] Das Artefakt versionieren beziehungsweise mit einer Prüfsumme versehen.
- [ ] `scenario.json` um einen expliziten Geometrieverweis erweitern oder eine
      feste Ableitungsregel dokumentieren.
- [ ] Die Pipeline mit `original_wk` und `kaiserreich` validieren.

## Phase 5: Regionenrendering und Interaktion

- [ ] Einen `RegionLayer` mit Lookup `regionId -> RegionView` erstellen.
- [ ] Fachliche Daten, Rendergeometrie und Hit-Test-Geometrie getrennt halten.
- [ ] Visuelle Zustände für Basisfarbe, Besitzer, Besetzung, Hover, Auswahl
      und umkämpfte Regionen modellieren.
- [ ] Eine eindeutige Priorität der Darstellungszustände festlegen.
- [ ] Grenzen in einem eigenen Layer rendern, damit ihre Linienstärke
      zoomabhängig geändert werden kann.
- [ ] Nur geänderte Besitz- und Besetzungszustände aktualisieren.
- [ ] Hit-Tests in Weltkoordinaten mit Bounding-Box-Vorfilter und räumlichem
      Index ausführen.
- [ ] Klicks nach einer Kameraverschiebung zuverlässig unterdrücken.
- [ ] Einfachklick, Doppelklick und Touch-Alternativen implementieren.
- [ ] Eine Debugansicht für IDs, Bounding Boxes, Schwerpunkte und Hit-Flächen
      bereitstellen.

## Phase 6: Phaser-Kamera

- [ ] Das Karten-`viewBox` als kanonisches `[x, y]`-Koordinatensystem nutzen.
- [ ] Minimalzoom dynamisch aus Karte und Viewport bestimmen.
- [ ] Maximalzoom und einheitliche Zoomschritte festlegen.
- [ ] Zoom auf den Cursor, Drag-Panning, Buttons und Reset implementieren.
- [ ] Touch-Panning und Pinch-Zoom ergänzen.
- [ ] Vertikale Kameragrenzen mit konfigurierbarem Rand definieren.
- [ ] Horizontalen World-Wrap bewusst implementieren oder als konfigurierbare
      Funktion deaktivieren.
- [ ] Für World-Wrap Nachbarkopien effizient rendern, ohne fachliche Objekte
      dauerhaft zu verdreifachen.
- [ ] Horizontale Kameraposition normalisieren und Treffer auf kanonische IDs
      zurückführen.
- [ ] Nationen aus den vereinigten Bounding Boxes ihrer Regionen fokussieren.
- [ ] Gedrosselte `camera-changed`-Events für UI und Labels emittieren.

## Phase 7: Städte, Einheiten und Ländernamen

- [ ] `CityManager`, `UnitManager` und `NationLabelManager` durch Phaser-Layer
      ersetzen.
- [ ] Szenariokoordinaten ohne Leaflet-Umkehrung verwenden.
- [ ] Städte als Sprites oder Graphics mit Typen für Hauptstadt, Großstadt,
      Hafen und Festung darstellen.
- [ ] Wiederverwendbare Icons in Sprite-Atlanten bündeln.
- [ ] Einheiten nach `region_id` gruppieren und an Regionsschwerpunkten oder
      expliziten Szenarioankern positionieren.
- [ ] Zoomabhängige Detailstufen für Marker und Einheitenstapel einführen.
- [ ] Unit-Popups im DOM belassen, aber ausschließlich IDs und
      Bildschirmkoordinaten aus Phaser übergeben.
- [ ] Hart codierte Nationenlabel-Koordinaten in Szenariodaten verschieben.
- [ ] Später automatische Label-Anker aus Regionsgeometrie mit manuellen
      Overrides ergänzen.
- [ ] Bitmap Fonts oder gecachte Phaser-Texte für häufige Labels prüfen.

## Phase 8: Datenmodell und API

- [ ] JSON-Schemas für Szenario, Regionen, Metadaten, Städte, Einheiten und
      Geometrieartefakt anlegen.
- [ ] Statische Regionsdaten von dynamischen Besitz- und Besetzungsdaten
      trennen.
- [ ] Entscheiden, ob SVG-`path` nach dem Port aus `regions.json` entfernt oder
      nur noch als Editorquelle behalten wird.
- [ ] `region_metadata.json` konsistent in `scenario-service.js` erlauben oder
      bewusst in `regions.json` integrieren.
- [ ] Einen effizienten Sitzungs-Bootstrap definieren oder statische Assets
      kontrolliert parallel laden.
- [ ] Payload- und Geometrieversionen zwischen Server und Client prüfen.
- [ ] Bei Saves stets deren `scenarioId` als maßgebliche Quelle verwenden.
- [ ] `scenarioId` im Anwendungsmodell und `scenario_id` in HTTP-Anfragen im
      API-Client vereinheitlichen.
- [ ] Spielzustandsänderungen als Delta oder diffbare Daten ausliefern.
- [ ] Referenzen zwischen Nationen, Regionen, Städten, Einheiten, Roadmaps und
      Geometrie automatisiert validieren.

## Phase 9: DOM-UI und Canvas verbinden

- [ ] Nationen-, Regionen- und Einheiten-Popups als HTML beibehalten und in
      eigenständige UI-Controller verschieben.
- [ ] Welt-zu-Bildschirm- und Bildschirm-zu-Welt-Projektion im
      `MapController` anbieten.
- [ ] Tooltips unter Berücksichtigung von Canvas-Offset, Skalierung und Device
      Pixel Ratio positionieren.
- [ ] Verankerte Popups bei Kameraänderungen einheitlich schließen oder neu
      positionieren.
- [ ] Suchergebnisse über fachliche IDs an `focusNation`, `focusRegion`,
      `focusCity` oder `focusUnit` übergeben.
- [ ] Tastatursteuerung und sichtbare Fokuszustände ergänzen.
- [ ] Für relevante Canvas-Inhalte zugängliche DOM-Alternativen bereitstellen.
- [ ] Sicherstellen, dass Klicks auf Panels nicht an die Scene durchgereicht
      werden.

## Phase 10: Performance und Assets

- [ ] Messbare Budgets für Ladezeit, FPS, Speicher, Hit-Test-Dauer und
      Besitzstandsaktualisierung festlegen.
- [ ] Polygonpunkte, Dreiecke, Regionen, Marker, Texte und Texturen je Szenario
      messen.
- [ ] Falls erforderlich mehrere Geometrie-Detailstufen erzeugen.
- [ ] Statische Geometrien cachen, ohne selektive Regionsupdates zu verhindern.
- [ ] Räumliche Indizes für Pointer und Sichtbarkeit verwenden.
- [ ] Wiederkehrende Sprites, Badges und Effekte poolen.
- [ ] Große Assets mit Fortschritt und abbrechbarem Ladeprozess behandeln.
- [ ] Veraltete Requests daran hindern, in eine neu geladene Scene zu schreiben.
- [ ] Eine Debuganzeige für FPS, Objektzahl, Texturen und Hit-Test-Zeit ergänzen.

## Phase 11: Tests und Abnahme

- [ ] Unit-Tests für Koordinaten, Kamera-Clamping, World-Wrap, Bounding Boxes,
      Farbauflösung und Zustandsprioritäten schreiben.
- [ ] Den Geometriekonverter mit Inseln, Innenringen, Kurven, ungültigen Pfaden
      und fehlenden IDs testen.
- [ ] Fixtures für `original_wk` und `kaiserreich` anlegen.
- [ ] Browser-End-to-End-Tests für Spielstart, Laden, Zoom, Drag, Auswahl,
      Doppelklick, Suche, Szenariowechsel und Saves ergänzen.
- [ ] Visuelle Referenzbilder für Weltansicht, Zoomstufen, World-Wrap,
      Auswahl, Städte, Einheiten und Labels erzeugen.
- [ ] Resize, Seitenpanels, Seitenverhältnisse und hohe Device Pixel Ratios
      testen.
- [ ] Pointer-, Touch- und Tastaturbedienung prüfen.
- [ ] Fehlerfälle für fehlende Assets, ungültige Geometrie und abgebrochene
      Requests abdecken.
- [ ] Szenariovalidierung und Frontend-Build als CI-Schritte einführen.

## Phase 12: Kontrollierte Einführung

1. Build-System, Phaser-Bootstrap, leere Scene, Resize und Kamera.
2. Geometrie-Pipeline und statische Regionen.
3. Besitzerfarben, Hover, Auswahl und Popups.
4. Vollständige Kamerafunktionen und optionaler World-Wrap.
5. Städte und Ländernamen im Canvas.
6. Einheiten, Sprite-Atlas und dynamische Zustände.
7. Suche, DOM-Projektion, Accessibility und Fehlerzustände.
8. Performanceprofiling und visuelle Regressionen für beide Szenarien.
9. Phaser als Standard aktivieren, Leaflet kurzzeitig per Feature-Flag erhalten.
10. Leaflet-CDN, Leaflet-Manager, toten Legacy-Code und Leaflet-CSS entfernen.

Jeder Meilenstein muss ein lauffähiges Produktinkrement liefern und eigene
Abnahmekriterien erfüllen, bevor der folgende begonnen wird.

## Vorgeschlagene Zielstruktur

```text
frontend/src/
├── main.js
├── app/
│   ├── AppController.js
│   └── GameSession.js
├── api/
│   ├── ApiClient.js
│   └── WebSocketClient.js
├── map/
│   ├── MapController.js
│   ├── PhaserMapAdapter.js
│   ├── scenes/MapScene.js
│   ├── camera/MapCameraController.js
│   ├── layers/
│   │   ├── RegionLayer.js
│   │   ├── BorderLayer.js
│   │   ├── CityLayer.js
│   │   ├── UnitLayer.js
│   │   ├── NationLabelLayer.js
│   │   └── EffectsLayer.js
│   ├── geometry/
│   │   ├── GeometryLoader.js
│   │   ├── SpatialIndex.js
│   │   └── CoordinateSystem.js
│   └── rendering/
│       ├── layers.js
│       └── styles.js
└── ui/
    ├── MapSearchController.js
    ├── MapPopupController.js
    └── TooltipController.js

tools/map-build/
├── build-map.js
├── validate-map.js
└── schemas/
```

## Definition of Done

- [ ] Die gesamte Spielwelt wird in einem Phaser-Canvas gerendert.
- [ ] Jede Region ist separat einfärbbar, auswählbar und fokussierbar.
- [ ] Städte, Einheiten und Ländernamen liegen ebenfalls im Canvas.
- [ ] Umfangreiche, zugängliche Menüs und Popups bleiben im DOM.
- [ ] `original_wk` und `kaiserreich` funktionieren über denselben generischen
      Szenariopfad.
- [ ] Besitzerwechsel aktualisieren nur betroffene Regionen.
- [ ] Kamera unterstützt Maus, Touch, Reset, Fokus und die festgelegte
      World-Wrap-Strategie.
- [ ] Szenariowechsel hinterlassen keine alten Handler oder GPU-Ressourcen.
- [ ] Performancebudgets und visuelle Regressionstests sind erfüllt.
- [ ] Leaflet ist aus HTML, JavaScript, CSS und Abhängigkeiten entfernt.
