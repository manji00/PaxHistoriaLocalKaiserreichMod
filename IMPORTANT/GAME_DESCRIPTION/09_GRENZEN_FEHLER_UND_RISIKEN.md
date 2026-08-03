# 9. Grenzen, Inkonsistenzen und Risiken

Diese Liste unterscheidet bewusst zwischen Spielumfang und konkreten Defekten.

## 9.1 Nicht implementierte Simulation

- Keine deterministische KI für andere Länder; sie handeln nur über vom Game
  Master erfundene Ereignisse oder Chatantworten.
- Keine Wirtschaftsschleife, Produktion, Forschung, Bau, Logistik, Fronten,
  Kampfauflösung, Verträge oder regelbasierte Diplomatie.
- `relations`, `politicalPower`, `manpower`, `atWar`, Stärke, Organisation und
  Erfahrung werden initialisiert, aber durch Rundenlogik nicht verändert.
- Keine Sieg-/Niederlagebedingungen und kein erzwungenes Szenario-Enddatum.
- Aktionen werden bei LLM-Fehler trotzdem abgeschlossen; Runde/Zeit laufen weiter.
- Ereignisfelder werden nicht gegen das verlangte Schema validiert.

## 9.2 Daten- und Szenarioinkonsistenzen

1. **Falsche Roadmapquelle:** Agenten lesen globale Roadmaps statt der Datei im
   gewählten Szenario.
2. **Fest codierter historischer Prompt:** 1935–1945/Ethiopien-Beispiele können
   alternative Szenarien kontaminieren.
3. **Legacy-Regiondetails:** `GET /api/regions/:id` und `/stats` ignorieren das
   Szenariopaket.
4. **Actions/Chat-Länder:** mehrere Routen rufen `engine.getNations()` ohne die
   Save-Szenario-ID auf und reichern Kaiserreich-Daten aus `original_wk` an.
5. **Neues Szenario:** Kopierroute behandelt SVG, aber keine eigene
   Geometrieartefaktdatei.
6. **Besetzungen:** nur Hinzufügen, kein Entfernen/Übertragen; konkurrierende
   Listen werden durch Objekt-Iterationsreihenfolge entschieden.
7. **Geschichtsfeld:** `history` ist ungenutzt; Beratertexte fehlen im Save.
8. **Zeitgrenzen:** Backend validiert weder ISO-Datum noch min/max.

## 9.3 Frontend/API-Fehlanpassungen

- `ApiClient.deleteAction(actionId)` sendet die erforderliche `saveId` nicht im
  DELETE-Body; Löschen über diesen Wrapper liefert HTTP 400.
- `getChatMessages(chatId)` sendet den erforderlichen Queryparameter `saveId`
  nicht; Nachrichtenabruf liefert HTTP 400.
- `closeChat(chatId)` sendet die erforderliche `saveId` nicht; Schließen liefert
  HTTP 400.
- `getNationsForMap()` fragt `/api/nations/map` ab, wofür keine Route existiert.
- Mehrere Such-/Länderwrapper übergeben keine Szenario-ID und fallen auf das
  Original zurück.
- WebSocket-Abschlussmeldungen werden nicht auf den aktiven Save gefiltert.
- Event-REST-Antwort enthält rohe LLM-Ereignisse ohne die erst im Save ergänzten
  IDs, Datums- und Rundendaten.

## 9.4 Persistenz und Sicherheit

- Save-Lesen/Schreiben verwendet die externe `saveId` direkt in `path.join`,
  ohne Formatprüfung. Pfadmanipulation ist möglich; die `.json`-Endung schränkt
  sie nur teilweise ein.
- Keine Authentifizierung: jeder erreichbare Client kann Saves lesen, ändern
  oder löschen, Szenarien editieren und LLM-Einstellungen/API-Key abrufen.
- Offenes CORS und globale WebSocket-Broadcasts vergrößern die Angriffsfläche.
- API-Keys liegen unverschlüsselt auf Platte und werden vollständig per API
  zurückgegeben.
- Save-Schreiben ist nicht atomar; Parallelrequests können Änderungen verlieren
  oder bei Abbruch eine beschädigte JSON-Datei hinterlassen.
- Synchrones Datei-I/O blockiert den Node-Eventloop; große Saves/Maps bremsen
  alle Clients.
- HTML wird häufig mit `innerHTML` aus Szenario-, Save- und LLM-Texten gebaut;
  ohne Escaping besteht Stored-/Reflected-XSS-Risiko.
- Szenarioeditor schreibt sechs Dateien nacheinander atomar pro Datei, aber
  nicht als Gesamttransaktion: ein Zwischenfehler erzeugt ein Mischpaket.

## 9.5 Robustheit und Bedienung

- IDs aus `Date.now()` können bei gleichzeitigen Vorgängen kollidieren.
- Fehlerhafte Save-JSONs verhindern potenziell die gesamte Save-Liste.
- `updated_at` zeigt Erstellzeit statt letzter Änderung.
- Keine Migration/Schema-Version für Saves; fehlende Felder werden nur punktuell
  normalisiert.
- Das LLM kann erfundene Regions-IDs liefern. Diese landen im Save, verändern
  aber keine sichtbare Region.
- Game-Master-Kontext kennt nur die Roadmap des Spielerlands, obwohl der Prompt
  Nachbarroadmaps behauptet.
- Einheitenposition bleibt bei API-Bewegung auf dem alten `centroid`, weil nur
  `region_id` geändert wird; die Karte zeigt sie weiter am alten Ort.
