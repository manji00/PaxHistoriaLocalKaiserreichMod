# 2. Spielablauf und tatsächlich implementierte Regeln

## 2.1 Neues Spiel

1. **Szenario wählen.** Das Frontend lädt `GET /api/scenarios`; Metadaten legen
   Name, Beschreibung und erlaubte Datumsgrenzen fest.
2. **Land wählen.** `GET /api/nations?scenario_id=...` liefert die Länder.
   Sichtbar bleiben nur Länder, die mindestens eine Region besitzen
   (`has_territory !== false`). Filter existieren für Großmächte und Ideologie.
3. **Startdatum wählen.** Das HTML-Feld erhält `startDate`, `minDate` und
   `maxDate`. Das Backend prüft das Datum jedoch nicht gegen diese Grenzen.
4. **Spiel erzeugen.** `POST /api/game/new` sendet Land, Datum und Szenario.
5. **Engine-Initialisierung.** Für jedes Land entstehen Standardwerte:
   Stabilität 70, Kriegsunterstützung 20, politische Macht 100, Staatskasse
   1000, kein Krieg, leere Beziehungen und Besetzungen. Manpower stammt aus
   dem Land oder fällt auf 100.000 zurück.
6. **Starttruppen.** Jede Definition aus `units.json` wird in eine Save-Einheit
   mit Stärke/Organisation 100 und Erfahrung 0 umgewandelt.
7. **Autosave und Welt laden.** Der Save wird geschrieben; Karte, Regionen,
   Städte und Einheiten werden im Browser geladen.

## 2.2 Spieleraktionen

Das Actions-Panel nimmt Freitext und einen Aktionstyp entgegen. Das Backend
akzeptiert jede nichtleere Aktion unmittelbar; es findet **keine**
Machbarkeitsprüfung durch Regeln oder KI statt. Der zurückgegebene
Validierungstext (`feasible: true`) ist konstant.

Eine Aktion wird mit Land, Text, Typ, aktueller Runde und Status `pending` im
Save gespeichert. Pending-Aktionen können vor der Auswertung gelöscht werden.
Beim nächsten Zeitsprung werden sämtliche aktuell pending Aktionen in den
Game-Master-Kontext aufgenommen und anschließend unabhängig vom Erfolg auf
`completed` gesetzt. Die Aktion selbst enthält kein strukturiertes Ergebnis;
die Folgen stehen in den erzeugten Ereignissen.

„Brainstorm“ ruft den strategischen Berater mit einer fest formulierten Bitte
um fünf Vorschläge auf. Vorschläge verändern den Spielstand nicht.

## 2.3 Zeit und Runden

Der Spieler wählt einen String wie `10_days`, `2_weeks`, `4_months` oder
`1_year`. Die Engine akzeptiert allgemein `N_day(s)|week(s)|month(s)|year(s)`.
Ein rein numerischer String bedeutet Tage; ein unverständlicher String fällt
auf einen Tag zurück.

Bei einem Zeitsprung:

1. Save laden;
2. Pending-Aktionen, zehn jüngste Ereignisse und eine reduzierte Weltübersicht
   sammeln;
3. Game-Master-LLM synchron aufrufen;
4. valide Ereignisse an `events` anhängen und unterstützte `state_changes`
   anwenden;
5. Datum weitersetzen, Rundennummer um eins erhöhen;
6. alle zuvor pending Aktionen abschließen;
7. vollständigen Save überschreiben;
8. REST-Antwort und WebSocket-Abschlussmeldung senden.

Monate/Jahre verwenden JavaScripts `Date.setMonth`/`setFullYear`; dadurch gilt
das normale JS-Überlaufverhalten (z. B. Monatsenden). Das Ereignis erhält als
`game_date` das Datum **vor** dem Sprung und die alte Rundennummer.

## 2.4 Folgen eines Ereignisses

Nur folgende vom LLM gelieferte Werte werden mechanisch angewandt:

| LLM-Feld | Save-Feld | Regel |
| --- | --- | --- |
| `stability` | `stability` | additiv, auf 0–100 begrenzt |
| `war_support` | `warSupport` | additiv, auf 0–100 begrenzt |
| `treasury` | `treasury` | additiv, ohne Begrenzung |
| `occupied_regions` | `occupied_regions` | anhängen und Duplikate entfernen |

Wichtig: Eine Änderung von exakt `0` wird wegen einer Truthiness-Prüfung nicht
angewandt (praktisch folgenlos). Nicht implementiert sind u. a. Änderungen an
Manpower, politischer Macht, Beziehungen, `atWar`, Einheitenschäden,
Globalspannung oder Eigentümerentzug. `global_tension_delta` wird zwar vom
Prompt verlangt, aber von der Engine ignoriert.

## 2.5 Diplomatie

Ein Chat ist bilateral bei höchstens zwei Einträgen, andernfalls eine
Konferenz. Der Code ergänzt den Spieler nicht automatisch: Die übergebene
Teilnehmerliste ist die Wahrheit. Eine gesendete Nachricht wird gespeichert;
danach antwortet jedes andere Teilnehmerland nacheinander mit einem separaten
LLM-Aufruf. Alle Antworten werden dem Chat hinzugefügt und der gesamte Save
wird geschrieben. Chats können lediglich als inaktiv markiert werden.

Diplomatische Aussagen verändern Beziehungen, Bündnisse, Krieg oder andere
Werte **nicht automatisch**. Sie sind Rollenspieltext. Sollen sie Folgen
haben, muss eine Spieleraktion formuliert und über einen Zeitsprung vom Game
Master verarbeitet werden.

## 2.6 Berater

Fragen, Zusammenfassungen, strategische Hinweise und Kurzvorschläge erzeugen
nur Textantworten. Sie werden weder in `chats` noch in einem eigenen
Beraterverlauf gespeichert. Nach Neuladen ist dieser sichtbare Dialog daher
nicht als Save-Historie verfügbar.

## 2.7 Einheiten und Gebiete

Einheiten können per API gelesen, erzeugt und sofort in eine Zielregion
verschoben werden. Es gibt keine Wegfindung, Reisezeit, Zugangskontrolle,
Besitzprüfung, Kampf- oder Versorgungsauswertung. `arrives_at` ist nur der
aktuelle reale Zeitstempel.

Gebietsbesitz beginnt mit `regions.json`. Eine vom LLM hinzugefügte Besetzung
legt die Regions-ID in der Liste des Besatzerstaats ab. Beim Kartenabruf wird
diese Belegung über den Szenariobesitzer gelegt. Es gibt keine Konfliktlösung
außer Iterationsreihenfolge, keinen ursprünglichen Besitzerwechsel und keinen
Mechanismus zum Entfernen einer Besetzung.
