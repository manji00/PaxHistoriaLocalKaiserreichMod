# 7. Backend, REST-API und WebSockets

Alle Bodies sind JSON. CORS ist ohne Einschränkung aktiv. Es gibt keine
Authentifizierung oder Benutzertrennung.

## 7.1 System und Szenarien

| Methode | Pfad | Zweck |
| --- | --- | --- |
| GET | `/api/ping` | Prozess-/Zeitprüfung |
| GET | `/api/health` | Health und file-based Hinweis |
| GET | `/api/scenarios` | Szenariometadaten auflisten |
| GET | `/api/scenarios/:id` | Metadaten eines Szenarios |
| GET | `/api/scenarios/:id/editor` | gesamtes editierbares Paket |
| PUT | `/api/scenarios/:id/editor` | Paket validieren und überschreiben |
| POST | `/api/scenarios` | Szenario aus Quelle kopieren |

## 7.2 Spielstände und Runde

| Methode | Pfad | Zweck |
| --- | --- | --- |
| POST | `/api/game/new` | Save erzeugen (`nationCode`, optional Datum/Szenario) |
| GET | `/api/game/load/:saveId` | vollständigen angereicherten Save laden |
| GET | `/api/game/saves` | Save-Metadaten auflisten |
| DELETE | `/api/game/saves/:saveId` | Save-Datei löschen |
| PATCH | `/api/game/saves/:saveId` | Save mit `name` umbenennen |
| POST | `/api/game/advance` | Runde/LLM auswerten (`saveId`, `timeJump`) |
| GET | `/api/game/state/:saveId` | kompakter Spielkontext |

## 7.3 Länder, Karte und Regionen

| Methode | Pfad | Zweck |
| --- | --- | --- |
| GET | `/api/nations?scenario_id=` | Länder, sortiert und mit Territoriumsflag |
| GET | `/api/nations/code/:code` | statisches Land |
| GET | `/api/nations/filter/major` | Großmächte |
| GET | `/api/nations/search/:query` | Ländersuche |
| GET | `/api/map/geojson?scenario_id=` | vollständige Regions-/Pfaddaten |
| GET | `/api/map/colors?scenario_id=` | Farbe und Name je Land |
| GET | `/api/map/search/:query` | kompakte Ländersuche |
| GET | `/api/map/nation/:code` | statisches Land |
| GET | `/api/map/nation/:code/state/:saveId` | statisch + dynamischer Staat |
| GET | `/api/map/cities?scenario_id=` | Städte |
| GET | `/api/regions` | kompakte Regionen; Filter `nation_code`, Save/Szenario |
| GET | `/api/regions/:id` | Legacy-Regionsdetail |
| GET | `/api/regions/:id/stats` | Legacy-Detail plus Defaultstatistiken |

## 7.4 Aktionen, Ereignisse und Einheiten

| Methode | Pfad | Zweck |
| --- | --- | --- |
| POST | `/api/actions` | pending Aktion erstellen |
| POST | `/api/actions/brainstorm` | LLM-Vorschläge |
| GET | `/api/actions/save/:saveId[/pending|/current]` | Aktionen abfragen |
| DELETE | `/api/actions/:id` | pending Aktion löschen; `saveId` im Body |
| GET | `/api/events/save/:saveId` | Ereignisse, optional `limit` |
| GET | `/api/events/save/:saveId/turn/:turnNumber` | Ereignisse einer Runde |
| GET | `/api/events/save/:saveId/type/:type` | Ereignisse eines Typs |
| GET | `/api/events/save/:saveId/nation/:nationCode` | Land betroffen |
| GET | `/api/events/save/:saveId/important` | major/critical |
| GET | `/api/events/save/:saveId/stats` | Gruppenzählung |
| GET | `/api/events/:id?saveId=` | Einzelereignis |
| GET | `/api/units?saveId=` | Einheiten mit optionalen Filtern |
| GET | `/api/units/:id?saveId=` | Einheit |
| POST | `/api/units` | Einheit erzeugen |
| PUT | `/api/units/:id/move` | Region sofort ändern |

## 7.5 Diplomatie, Berater und LLM

| Methode | Pfad | Zweck |
| --- | --- | --- |
| POST | `/api/chat/start` | Chat erzeugen |
| POST | `/api/chat/:chatId/message` | Nachricht + Antworten |
| GET | `/api/chat/save/:saveId` | aktive Chats |
| GET | `/api/chat/:chatId/messages?saveId=` | angereicherte Nachrichten |
| POST | `/api/chat/:chatId/close` | deaktivieren; `saveId` im Body |
| GET | `/api/chat/available/:saveId` | Gesprächsländer |
| POST | `/api/advisor/ask` | Frage |
| GET | `/api/advisor/summary/:saveId` | Zusammenfassung |
| POST | `/api/advisor/strategic` | Fokusberatung |
| GET | `/api/advisor/test` | aktive Verbindung testen |
| GET/POST | `/api/llm/settings` | Einstellungen lesen/schreiben |
| POST | `/api/llm/test` | temporäre Einstellungen testen |

## 7.6 WebSocket-Ereignisse

Der Socket hängt ohne Pfad am selben HTTP-Server. Server → alle Clients:

- `time_advance_start` mit Save-ID und Abstand;
- `time_advance_complete` mit Save-ID und Ergebnis;
- `new_action` mit Aktion;
- `diplomatic_message` mit Chat-ID und Antworten.

Clientnachrichten werden lediglich geloggt. WebSocket ist also eine
Broadcast-Benachrichtigungsschicht, kein alternativer Befehlskanal.
