# 4. Agenten und LLM-System

## 4.1 Was „Agent“ hier bedeutet

Die Agenten sind Prompt-Rollen desselben konfigurierten Sprachmodells, keine
autonomen Hintergrunddienste. Sie besitzen kein eigenes Gedächtnis und planen
nicht zwischen Requests weiter. Gedächtnis entsteht ausschließlich dadurch,
dass ausgewählte Save-Daten erneut in einen Prompt geschrieben werden.

## 4.2 Game-Master-Agent

**Auslöser:** `POST /api/game/advance`.

**Kontext:** aktuelles Datum, Spielerland, alle pending Aktionen, letzte zehn
Ereignisse, reduzierte Weltübersicht, im Save eingefrorener Weltkontext und
Simulationsregeln sowie die Roadmap des Spielerlands.

Die Weltübersicht enthält nur:

- Spielerland;
- Länder aus pending Aktionen und dreibuchstabige Großbuchstaben-Tags, die per
  Regex im Aktionstext vorkommen;
- betroffene Länder der letzten zehn Ereignisse;
- alle als Großmacht markierten Länder.

Pro aufgenommenem Land werden nur Name, Stabilität, Kriegsunterstützung,
Anzahl besetzter Regionen und Kriegsstatus gesendet. Vollständige Beziehungen,
Kassenstände, Truppen und regionale Geografie fehlen.

**Auftrag:** drei bis sechs plausible Ereignisse als JSON erzeugen. Der Prompt
verlangt englische Texte, Nationstags, konkrete Geografie/Einheiten,
Konsequenzen, `state_changes` und Globalspannung.

**Antwortverarbeitung:** Markdown-Codeblöcke werden entfernt, führende `+` vor
Zahlen repariert und JSON geparst. Falls nötig wird der Bereich vom ersten bis
letzten geschweiften Klammerpaar versucht. Es gibt keine Schema-Validierung.
Bei Fehlern liefert der Service `{events:[], error}`; die Engine schreitet
trotzdem in Datum/Runde fort und schließt Aktionen ab.

## 4.3 Strategischer Berater

**Auslöser:** Frage, Zusammenfassung, Fokusberatung, Sofortvorschläge oder
Actions-Brainstorming.

Er erhält Spielerland (Name, Code, Krieg, Besetzungen), priorisierte
Weltübersicht, zehn letzte Ereignisse und pending Aktionen. Seine Systemrolle
fordert historisch fundierte, konkrete, warnende Beratung mit festem
Markdown-Schema; auf sehr kurze Nachrichten soll er in einem Satz antworten.

Der Save-Weltkontext und die Simulationsregeln werden zwar von
`getAdvisorContext()` bereitgestellt, aber im aktuell gebauten Beraterprompt
nicht eingesetzt. Die Antwort wird an den Browser zurückgegeben, aber nicht
persistiert.

## 4.4 Diplomatische Staatenagenten

Für jedes andere Land eines Chats erfolgt seriell ein eigener Modellaufruf.
Der Prompt nennt Teilnehmer, Spielerpolity, Datum, Weltkontext, Regeln, die
letzten 20 Ereignisse und das aktuell antwortende Land. Er fordert
Professionalität, eine klare Annahme/Ablehnung und eine Länge von ungefähr
±10 % der durchschnittlichen Spielernachrichtenlänge.

Der Nachrichtenverlauf wird in `user`/`assistant` umgewandelt. Dabei gelten
alle `sender_is_player:false`-Nachrichten – auch Antworten anderer Staaten in
einer Konferenz – als `assistant`. Eine echte Mehragentenidentität auf
Protokollebene existiert daher nicht; die Rollentrennung beruht auf dem
Systemprompt. Die aktuelle Spielernachricht steht bereits im übergebenen
Verlauf und wird zusätzlich als letzte User-Nachricht angehängt, also doppelt.

Fehler werden als sichtbarer Text `[Communication Error: ...]` in der
Diplomatie gespeichert.

## 4.5 Roadmaps und wichtige Inkonsistenz

Szenarien besitzen `data/scenarios/<id>/roadmaps.json`. Der LLM-Service lädt
jedoch ausschließlich die **globale Legacy-Datei**
`data/historical_roadmaps.json`. Damit sind die Roadmaps im Szenariopaket und
Änderungen über den Szenarioeditor derzeit wirkungslos für alle Agenten.
Zusätzlich ist der Game-Master-Systemprompt fest auf 1935–1945 und historische
Beispiele zugeschnitten. Das kann dem Kaiserreich-Weltkontext widersprechen.

Eine Roadmap kann ein altes String-Array oder ein Objekt mit `profile`,
`narrative_history`, `strategic_dilemmas`, `historical_mistakes` und
`milestones` sein. Fehlt sie, erhält das Modell einen generischen
1935–1945-Hinweis.

## 4.6 Provider und Konfiguration

Unterstützt werden OpenAI-kompatibel: `openai`, `google`, `lm-studio`,
`ollama`, `llama.cpp`, `vllm`; Anthropic wird per eigenem HTTP-Aufruf bedient.
Default ist LM Studio auf `http://127.0.0.1:1234/v1`, Modell `qwen3-vl-8b`.

- Für Nicht-Google-URLs hängt der Code `/v1` an, wenn die URL nicht exakt auf
  `/v1` endet.
- Google nutzt standardmäßig den OpenAI-kompatiblen Gemini-Endpunkt und setzt
  `reasoning_effort: minimal` statt Temperatur.
- Anthropic erhält einen Systemstring, Messages, Temperatur und Tokenlimit.
- Timeout für OpenAI-kompatible Clients: 120 Sekunden, keine Retries.
- Einstellungen inklusive API-Key werden unverschlüsselt global in
  `data/llm_settings.json` gespeichert und über `GET /api/llm/settings`
  vollständig an jeden Client ausgegeben.

Tokenlimits: Game Master 3000, Diplomatie 1000, Berater standardmäßig 400,
Verbindungstest 10. Der Game Master nutzt Temperatur 0,7, Diplomatie 0,8,
Berater 0,7.
