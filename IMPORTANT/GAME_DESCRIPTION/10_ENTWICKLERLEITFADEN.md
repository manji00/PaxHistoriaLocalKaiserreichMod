# 10. Entwicklerleitfaden

## 10.1 Lokale Kommandos

```bash
# Backend
cd backend && npm start

# Frontend-Build und Tests
cd frontend && npm run build
cd frontend && npm test

# Kartenartefakte (aus frontend/package.json)
cd frontend && npm run map:build
cd frontend && npm run map:validate
```

Der Backendprozess selbst exportiert keine App für Unit-Tests und startet beim
`require` sofort den Port. Für automatisierte Route-/Engine-Tests wäre eine
Trennung von App-Erzeugung und `listen()` sinnvoll.

## 10.2 Szenario sicher ändern

1. Nur `data/scenarios/<id>/` und zugehörige Dateien unter `frontend/maps/`
   bearbeiten.
2. Ländercodes zwischen Ländern, Regionen, Städten, Einheiten und Roadmaps
   abgleichen.
3. Regions-IDs zwischen `regions.json`, Geometrie und Einheit-/Metadaten-
   Referenzen abgleichen.
4. SVG ändern, Geometrie neu bauen und validieren.
5. `scenario.json` inklusive Weltkontext/Regeln/Datumsgrenzen anpassen.
6. Aktuell zusätzlich `data/historical_roadmaps.json` pflegen oder zuerst den
   LLM-Service auf szenariospezifische Roadmaps umstellen.
7. Mit einem **neuen Save** testen; bestehende Saves enthalten kopierten
   Kontext, Einheiten und dynamischen Zustand.

## 10.3 Neues Zustandsfeld hinzufügen

Ein neues dynamisches Feld muss mindestens an diesen Stellen bedacht werden:

- Initialisierung in `GameEngine.createGame()`;
- erlaubtes LLM-Response-Schema im Game-Master-Prompt;
- validierte Anwendung in `advanceTime()`;
- Weltzusammenfassung, falls Agenten es kennen müssen;
- kompakter `/game/state`-Response;
- UI-Anzeige und ggf. Karte;
- Save-Migration/Defaults beim Laden;
- Tests für Grenzen, falsche Typen und Parallelität.

LLM-Ausgaben sollten niemals direkt als vertrauenswürdiger Zustand gelten.
Empfohlen sind JSON-Schema-Validierung, Whitelists, Typ-/Bereichsprüfung und
eine Ereignis-/Änderungstransaktion.

## 10.4 Persistenz verbessern

Empfohlene Reihenfolge:

1. Save-ID strikt validieren und Pfade nach `resolve()` im Save-Ordner halten.
2. Saves wie Szenariodateien per temporärer Datei + atomarem Rename schreiben.
3. `schemaVersion`, `updated_at` und Migrationen ergänzen.
4. Pro Save serialisieren/locken oder optimistic concurrency verwenden.
5. Chronikmodell definieren: ein gemeinsames append-only Journal oder klar
   dokumentierte `events`/`actions`/`messages`-Streams.
6. Geheimnisse aus JSON/API entfernen und serverseitig maskieren.

## 10.5 Agenten verbessern

- Szenario-ID an Roadmaploader übergeben.
- Roadmaps betroffener/Nachbarländer gezielt einbeziehen.
- Promptzeitraum aus Szenario statt hart codiert ableiten.
- LLM-JSON strikt validieren und unbekannte Staaten/Regionen verwerfen.
- Bei LLM-Fehler Aktionen pending lassen oder dem Spieler eine explizite
  Wiederholungsentscheidung geben.
- Diplomatieaussagen in strukturierte Vorschläge/Verträge überführen, die erst
  nach regelbasierter Annahme Zustand ändern.
- Beraterverlauf optional im Save speichern.

## 10.6 Abnahmetest für einen vollständigen Spielzyklus

- Szenarioliste und Länder laden; nur territoriale Länder auswählbar.
- Save erzeugen und JSON-Grundwerte/Starttruppen prüfen.
- Aktion erstellen, anzeigen, löschen; erneut erstellen.
- Zeitsprung mit erfolgreichem und fehlgeschlagenem LLM testen.
- Ereignisse, Statusdelta, Datum, Runde, Action-Status und Kartenbesetzung prüfen.
- Bilateralen Chat und Konferenz samt Reload prüfen.
- Beraterantwort und erwartete Nichtpersistenz prüfen.
- Einheit erzeugen/verschieben und Kartenposition prüfen.
- Save umbenennen, Server neu starten, laden und löschen.
- Zwei parallele Browser/Saves testen, insbesondere WebSocket-Isolation.
