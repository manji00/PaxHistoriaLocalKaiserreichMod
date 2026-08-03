# Pax Historia – technische Spieldokumentation

> **Stand der Analyse:** 3. August 2026. Diese Dokumentation beschreibt den
> tatsächlich vorhandenen Code – nicht nur die beabsichtigte Spielidee. Wo UI,
> API und Datenmodell voneinander abweichen, wird das ausdrücklich als
> Einschränkung gekennzeichnet.

## Was für ein Spiel ist das?

Pax Historia ist im aktuellen Stand ein lokales, rundenbasiertes
Grand-Strategy-/Alternative-History-Spiel. Der Spieler wählt ein Szenario und
einen Staat, formuliert politische, militärische oder diplomatische Vorhaben
als Freitext und lässt anschließend Zeit verstreichen. Ein externes Large
Language Model (LLM) übernimmt drei Rollen:

1. **Game Master:** erzeugt beim Zeitsprung Weltereignisse und numerische Folgen;
2. **strategischer Berater:** beantwortet Fragen aus Sicht des Spielerstaats;
3. **diplomatische Staatenagenten:** antworten im Namen anderer Staaten.

Es gibt keine klassische deterministische Wirtschafts-, Kampf-, Forschungs-
oder Produktionssimulation. Abseits weniger Zahlenänderungen und
Gebietsbesetzungen entstehen die Entwicklungen durch das LLM. Die JSON-Datei
eines Spielstands ist die maßgebliche Wahrheit.

## Empfohlene Lesereihenfolge

| Dokument | Inhalt |
| --- | --- |
| [01_ARCHITEKTUR_UND_START.md](01_ARCHITEKTUR_UND_START.md) | Prozesse, Technologien, Start und Gesamtarchitektur |
| [02_SPIELABLAUF_UND_REGELN.md](02_SPIELABLAUF_UND_REGELN.md) | vollständiger Ablauf von Neuem Spiel bis Zeitsprung |
| [03_SPIELSTAND_UND_GESCHICHTE.md](03_SPIELSTAND_UND_GESCHICHTE.md) | Speicherung, Save-Schema, Geschichte, Autosave |
| [04_AGENTEN_UND_LLM.md](04_AGENTEN_UND_LLM.md) | Game Master, Berater, Diplomaten, Prompts und Provider |
| [05_SZENARIEN_UND_WELTDATEN.md](05_SZENARIEN_UND_WELTDATEN.md) | Länder, Regionen, Städte, Einheiten, Roadmaps |
| [06_KARTE_UND_FRONTEND.md](06_KARTE_UND_FRONTEND.md) | Phaser-/Canvas-Karte, UI, Panels und Browserzustand |
| [07_BACKEND_UND_API.md](07_BACKEND_UND_API.md) | Server, REST-Endpunkte und WebSockets |
| [08_DATENFLUESSE.md](08_DATENFLUESSE.md) | Sequenzen und Herkunft jedes wichtigen Datenwerts |
| [09_GRENZEN_FEHLER_UND_RISIKEN.md](09_GRENZEN_FEHLER_UND_RISIKEN.md) | implementierte Grenzen, Inkonsistenzen und Sicherheit |
| [10_ENTWICKLERLEITFADEN.md](10_ENTWICKLERLEITFADEN.md) | Änderungen, Erweiterung und Prüfchecklisten |
| [11_DATEIINDEX.md](11_DATEIINDEX.md) | Zuständigkeit der Laufzeitdateien |

## Kurzfassung der wichtigsten Antworten

- **Wo wird gespeichert?** In `data/saves/<saveId>.json`; ein Save enthält den
  gesamten veränderlichen Zustand einschließlich Aktionen, Ereignissen,
  Chats/Nachrichten, Staatenwerten, Besetzungen und Einheiten.
- **Wie wird „Geschichte“ gespeichert?** Tatsächlich über `events`, ergänzt um
  `actions` und `chats[].messages`. Das Feld `history` wird zwar angelegt, aber
  vom vorhandenen Code niemals befüllt.
- **Wann wird gespeichert?** Nach der Erstellung und nach jeder mutierenden
  Aktion (Aktion einreichen/löschen, Chat beginnen/schreiben/schließen,
  Zeitsprung, Einheit erstellen/verschieben, Save umbenennen). Es gibt keinen
  separaten manuellen Save-Slot: die UI meldet korrekt „automatisch gespeichert“.
- **Was tun die Agenten?** Sie sind keine dauerhaft laufenden Prozesse. Bei
  einer Anfrage baut das Backend einen Prompt aus Save- und Szenariodaten,
  ruft das konfigurierte LLM auf und speichert das Ergebnis dort, wo der
  jeweilige Workflow es vorsieht.
- **Was simuliert der Code selbst?** Datum/Rundennummer, Status von Aktionen,
  additive Änderungen an Stabilität/Kriegsunterstützung/Staatskasse,
  Besetzungslisten sowie einfache CRUD-Operationen für Chats und Einheiten.
