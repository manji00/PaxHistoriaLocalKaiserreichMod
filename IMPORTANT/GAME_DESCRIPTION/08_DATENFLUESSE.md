# 8. Datenflüsse und Sequenzen

## 8.1 Neues Spiel

```text
UI ─GET /scenarios────────────► ScenarioService ─liest scenario.json
UI ─GET /nations?scenario─────► nations.json + regions.json
UI ─POST /game/new────────────► GameEngine
                                ├─ scenario + nations lesen
                                ├─ dynamische Staaten initialisieren
                                ├─ units.json in Save-Einheiten umformen
                                └─ data/saves/<id>.json schreiben
UI ◄─Save-ID/Land/Szenario─────┘
UI ─parallel──────────────────► geometry.json, /map/geojson, /map/colors,
                                /map/cities; danach /units?saveId
```

## 8.2 Aktion und Zeitsprung

```text
Aktionstext ─POST /actions──► Save.actions += pending ─► Save schreiben
Zeitwahl ─POST /game/advance► Save laden
                              ├─ Kontext reduzieren
                              ├─ LLM Game Master aufrufen
                              ├─ Rohtext nach data/debug schreiben
                              ├─ JSON-Ereignisse + Zustandsdelta anwenden
                              ├─ Datum/Runde ändern, Aktionen completed
                              └─ Save schreiben
Browser ◄─REST-Ergebnis + WebSocket-Broadcast
Browser ─GET /regions?save_id► Basiseigentümer + Besetzungs-Overlay
Browser ─GET /units?saveId───► aktuelle Save-Einheiten
```

## 8.3 Diplomatische Nachricht

```text
UI ─POST /chat/:id/message──► Save laden, Spielernachricht anhängen
                              für jedes andere Teilnehmerland:
                                Prompt aus Chat + Kontext bauen
                                LLM synchron aufrufen
                                Antwort anhängen
                              Save einmal am Ende schreiben
UI ◄─Antwortliste───────────── Broadcast an alle Clients
```

Fällt ein Request zwischen dem Anhängen im Arbeitsspeicher und dem finalen
Schreiben aus, bleibt nichts davon persistent. Ein einzelner LLM-Fehler wird
hingegen in Text umgewandelt und der Chat anschließend gespeichert.

## 8.4 Quelle der sichtbaren Werte

| Sichtbarer Wert | Quelle |
| --- | --- |
| Szenarioname/Datumsspanne | `scenario.json` |
| Landname/Führer/Farbe | `nations.json` |
| aktuelle Stabilität etc. | Save `nations[code]` |
| Kartenform | `frontend/maps/<id>.geometry.json` |
| Kartenbesitzer vor Save | `regions.json` |
| Kartenbesitzer nach Ereignissen | Save-`occupied_regions` als Overlay |
| Städtenamen/-position | `cities.json` |
| Einheit nach Start | Save `units` |
| Ereignischronik | Save `events` |
| Befehlschronik | Save `actions` |
| Diplomatiechronik | Save `chats[].messages` |
| Beraterdialog | nur DOM/Panelzustand |
| Agentenhintergrund | derzeit globale `data/historical_roadmaps.json` |
| Agentenregeln je Partie | Save `world_context`, `simulation_rules` |
