# 3. Spielstand, Persistenz und Geschichte

## 3.1 Speicherorte

| Inhalt | Datei/Ordner | Lebensdauer |
| --- | --- | --- |
| Spielstände | `data/saves/<saveId>.json` | dauerhaft, bis Löschen |
| LLM-Konfiguration inkl. API-Key | `data/llm_settings.json` | dauerhaft, global |
| letzter roher Game-Master-Output | `data/debug/last_ai_response.txt` | wird je Aufruf überschrieben |
| Szenarien | `data/scenarios/<id>/*.json` | statische bzw. Editor-Daten |
| Browserzustand | JS-Objekte/DOM | nur bis Reload/Navigation |

Die Save-ID ist `Date.now().toString()`. Objekt-IDs für Aktionen, Chats,
Nachrichten und manche Einheiten beruhen ebenfalls auf Millisekunden; es gibt
keine UUIDs und damit theoretische Kollisionsmöglichkeiten.

## 3.2 Vollständiges Save-Schema

Das folgende Schema fasst alle vom Laufzeitcode verwendeten Felder zusammen:

```json
{
  "id": "<Millisekunden>",
  "name": "<Land> - <Szenario> - <Datum>",
  "scenarioId": "original_wk",
  "playerNationCode": "GER",
  "currentDate": "1935-12-01",
  "turnNumber": 1,
  "nations": {
    "GER": {
      "code": "GER",
      "stability": 70,
      "warSupport": 20,
      "manpower": 100000,
      "politicalPower": 100,
      "treasury": 1000,
      "atWar": false,
      "relations": {},
      "occupied_regions": []
    }
  },
  "chats": [{
    "id": "...", "save_id": "...",
    "participant_nations": ["GER", "FRA"],
    "chat_type": "bilateral", "topic": "Diplomacy",
    "is_active": true, "created_at": "<ISO>",
    "messages": [{
      "id": "...", "sender_nation": "GER",
      "sender_is_player": true, "message_text": "...",
      "game_date": "1935-12-01", "created_at": "<ISO>"
    }]
  }],
  "actions": [{
    "id": "...", "save_id": "...", "nation_code": "GER",
    "action_text": "...", "action_type": "general",
    "status": "pending|completed", "turn_number": 1,
    "created_at": "<ISO>"
  }],
  "events": [{
    "id": "...", "title": "...", "description": "...",
    "event_type": "political|military|economic|diplomatic|social",
    "severity": "minor|moderate|major|critical",
    "affected_nations": ["GER"], "state_changes": {},
    "game_date": "1935-12-01", "created_at": "<ISO>",
    "turn_number": 1
  }],
  "units": [{
    "id": "...", "name": "...", "unit_type": "infantry",
    "nation_code": "GER", "region_id": "...",
    "centroid": [700, 250], "strength": 100,
    "organization": 100, "experience": 0,
    "created_at": "<ISO>", "updated_at": "<ISO optional>"
  }],
  "history": [],
  "created_at": "<ISO>",
  "world_context": "...",
  "simulation_rules": "..."
}
```

`loadGame()` reichert das gelesene Objekt nur für die Antwort mit `scenario`
und statischen `playerNation`-Daten an. Diese abgeleiteten Felder sollen nicht
als eigene Datenquelle verstanden werden; bei einem späteren Speichern können
sie allerdings durch den Spread-basierten Ladevorgang mit in der Datei landen.

## 3.3 Was ist die Geschichte?

Es existieren vier unterschiedliche historische Ebenen:

1. **Vorgeschichte des Szenarios:** `world_context` und `simulation_rules`
   werden bei Spielbeginn in den Save kopiert und dadurch eingefroren.
2. **Roadmaps:** statische LLM-Hintergrundtexte mit Profil, Nationalgeschichte,
   Dilemmas, Fehlern und Meilensteinen.
3. **Entstehende Weltchronik:** `events` ist die tatsächlich vom Game Master
   erzeugte Ereignisgeschichte. Das Events-Panel sortiert/filtriert sie.
4. **Entscheidungs- und Gesprächsprotokoll:** `actions` dokumentiert Befehle;
   `chats[].messages` dokumentiert Diplomatie.

Das Save-Feld **`history` bleibt immer leer**, weil keine Funktion Einträge
hinzufügt. Wer die „Geschichte des Spiels“ exportieren möchte, muss daher
`events`, `actions` und Chatnachrichten chronologisch zusammenführen.
Beraterantworten und Brainstorming sind nicht persistent. Ebenso wird der rohe
LLM-Output nur als globale Debugdatei gehalten, nicht pro Save.

## 3.4 Autosave-Semantik

`saveGame()` serialisiert das komplette Objekt eingerückt und überschreibt die
Save-Datei direkt. Gespeichert wird nach:

- neuem Spiel;
- Aktion erstellen oder pending Aktion löschen;
- Chat erstellen, Nachricht samt Antworten speichern oder Chat schließen;
- abgeschlossenem Zeitsprung;
- Einheit erstellen oder verschieben;
- Umbenennen.

Die Schaltfläche „Save“ schreibt nicht zusätzlich; sie zeigt nur den Hinweis
auf Autosave. Während eines laufenden LLM-Aufrufs wird der Zeitsprung erst am
Ende gespeichert. Bei Prozessabbruch bleiben somit der vorherige Save und ggf.
ein älterer Debugoutput erhalten.

## 3.5 Laden, Listen, Umbenennen, Löschen

- Die Save-Liste liest alle `*.json` synchron und ohne Fehlerisolation. Eine
  beschädigte Datei kann die ganze Liste scheitern lassen.
- Alte Saves ohne `scenarioId` werden als `original_wk` behandelt.
- `updated_at` in der Listenantwort ist tatsächlich stets `created_at`; letzte
  Änderung wird nicht gepflegt.
- Umbenennen ersetzt `name` ohne Validierung.
- Löschen entfernt die Datei; eine nicht vorhandene ID führt trotzdem über die
  Route zu `{success:true}`.

## 3.6 Konsistenz und Parallelität

Szenario-Dateien werden über temporäre Datei plus Rename geschrieben; Saves
hingegen nicht atomar. Es gibt keine Dateisperre, Versionsnummer oder
Transaktion. Zwei gleichzeitige Requests können denselben alten Stand laden
und anschließend nach dem Prinzip „letzter Schreibvorgang gewinnt“ Änderungen
verlieren. Mehrere Serverprozesse sind daher nicht sicher.
