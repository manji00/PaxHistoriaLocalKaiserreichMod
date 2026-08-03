# 6. Frontend, Karte und Panels

## 6.1 Anwendungszustand

`app.currentGame` hält nur Save-ID, statische Spielerlanddaten, Datum, Runde
und Szenario. Der vollständige Save bleibt im Backend. Nach Neuerstellung oder
Laden ruft `startGame()` Weltartefakte ab, fokussiert zeitverzögert das
Spielerland und lädt Städte/Einheiten.

Die UI umfasst Hauptmenü, Szenario-/Länderauswahl, Save-Liste,
LLM-Einstellungen, Kopfzeile, Aktionen, Diplomatie, Berater, Ereignisse und
Zeitleiste. Panels holen ihre Daten bei Bedarf per REST und verwalten zusätzlich
lokale Anzeigezustände.

## 6.2 Kartenpipeline

1. `PhaserMapAdapter.initialize()` erzeugt ein Phaser-4-Spiel im Canvas-Modus,
   begrenzt Device Pixel Ratio auf 2 und beobachtet Containergrößen.
2. `loadScenario()` lädt parallel Geometrieartefakt, Regionen, Farben und
   Städte.
3. `RegionLayer` verbindet Geometrie und API-Regionen nach ID, baut einen
   einfachen Bounding-Box-Index und erstellt `Path2D`.
4. Ein benutzerdefiniertes `CanvasWorld` zeichnet pro Frame Regionen,
   Grenzlinien, Labels, Städte und Einheiten direkt auf den Canvas-Kontext.
5. Save-Besetzungen aktualisieren Regionsobjekte/Farben nach einem Zeitsprung.

Der „SpatialIndex“ ist aktuell nur ein linearer Filter über alle Bounding
Boxes, kein Baum. Der eigentliche Treffer wird anschließend mit
`isPointInPath(..., 'evenodd')` geprüft.

## 6.3 Kamera und Eingabe

- Mausrad zoomt um den Zeiger; Ctrl+Rad schwenkt horizontal,
  Alt/Shift+Rad vertikal.
- Linke, mittlere und rechte Maustaste können nach vier Pixeln Dragdistanz
  schwenken; Kontextmenü ist deaktiviert.
- Zoom liegt zwischen dem Fit-to-Viewport-Wert und 8.
- Fokus auf Land mittelt die Zentren all seiner Regionen; Fokus auf Region
  zentriert auf deren Geometriezentrum.
- Der beim Rendern tatsächliche Canvas-Transform wird gespeichert und für
  exakte Screen↔World-Koordinaten invertiert.

Die Kamera wird beim Resize vollständig zurückgesetzt. Eine Begrenzung des
Schwenkens auf die Weltgrenzen ist im Adapter nicht aktiv, obwohl
`CoordinateSystem.js` eine separate Clamp-Hilfsfunktion besitzt.

## 6.4 Darstellung

- Normale Regionsfarbe: Länderfarbe; Hover gelb, Auswahl heller gelb/weißer Rand.
- Labels kommen aus dem Geometrieartefakt. Größere werden zuerst gesetzt;
  überschneidende achsenparallele Boxen werden ausgelassen. Rotationen werden
  bei dieser Kollisionsprüfung nicht berücksichtigt.
- Städte: Kreis; Hauptstädte größer und golden.
- Einheiten: dunkles Rechteck mit Diamantsymbol an `centroid`/`coords`.
- Layer `labels`, `cities`, `units` können sichtbar/unsichtbar geschaltet werden.

## 6.5 Panels

### Aktionen

Zeigt pending Befehle, sendet Freitext, löscht Befehle und ruft Brainstorming
ab. Aktionen sind keine direkten Kartenbefehle.

### Zeitleiste

Wählt einen Zeitabstand, öffnet Bestätigung/Loading und sendet den synchronen
Zeitsprung. Nach Antwort werden Datum/Runde und Ereignisse aktualisiert. Der
WebSocket-Handler aktualisiert zusätzlich Karte, Weltobjekte und Pending-Liste;
dadurch können bei einem einzelnen Browser sowohl REST- als auch Broadcast-
Aktualisierungen stattfinden.

### Ereignisse

Lädt bis zu 50 Ereignisse und filtert lokal nach Kategorie. Backend bietet
weitere Turn-, Typ-, Länder-, Wichtigkeits- und Statistikendpunkte.

### Diplomatie

Listet aktive Chats, Teilnehmer und Nachrichten; erstellt Chats und sendet
Nachrichten. Einige Methoden des API-Clients reichen die backendseitig
notwendige `saveId` nicht mit (siehe Fehlerdokument), weshalb Nachrichtenladen
und Schließen über diese Wrapper fehlschlagen können.

### Berater

Zeigt lokale User-/Assistant-Nachrichten, stellt Fragen und bietet
Schnellaktionen. Dieser lokale Verlauf ist nicht Teil des Saves.

## 6.6 WebSocket

Der Client verbindet zum Backend-Origin, versucht nach Abbruch bis zu fünfmal
mit wachsender Verzögerung (2, 4, 6, 8, 10 Sekunden) neu zu verbinden und
verteilt Nachrichten nach Typ. Der Server authentifiziert nicht und sendet
Broadcasts an **alle** verbundenen Browser. Der Client filtert empfangene
Zeitsprungmeldungen nicht nach `saveId`; bei mehreren Spielen/Clients kann ein
fremder Zeitsprung die lokale Anzeige aktualisieren.
