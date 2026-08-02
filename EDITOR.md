# Szenario-Editor

Der Szenario-Editor ist über **Szenario-Editor** im Hauptmenü oder direkt über
`/editor.html` erreichbar. Er bearbeitet die getrennten Szenariopakete unter
`data/scenarios/<id>/`. Änderungen werden erst dauerhaft übernommen, wenn oben
rechts **Änderungen speichern** gewählt wird.

## Szenario-Einstellungen und Arbeitsfläche

Links werden Szenario, Datumsgrenzen, Beschreibung, KI-Weltkontext und
Simulationsregeln bearbeitet. Der schmale Griff zwischen den Einstellungen und
der Karte lässt sich mit der Maus horizontal ziehen. Bei fokussiertem Griff
ändern außerdem die Pfeiltasten die Breite; `Home` stellt die Standardbreite
wieder her. Die gewählte Breite wird im Browser gespeichert.

Über **Szenario duplizieren** entsteht eine unabhängige Kopie des aktuellen
Szenarios. Das Original wird dabei nicht verändert.

## Länder und Gebiete

Die Länderliste kann nach Name oder Code gefiltert werden. Nach der Auswahl
eines Landes erscheinen rechts seine Stammdaten und eine sortierte Liste aller
zugehörigen Gebiete. Ein Klick auf einen Gebietseintrag springt auf der Karte
zu diesem Gebiet und hebt es hervor.

Ein normaler Klick auf ein Gebiet der Karte wählt dessen Besitzer genauso aus
wie ein Klick in der Länderliste. So sind die Landesdaten und die vollständige
Gebietsliste sofort sichtbar. Mit einem Doppelklick wird stattdessen das
Gebietsformular geöffnet, in dem Name und Besitzer direkt geändert werden
können.

Um Gebiete neu zuzuweisen:

1. Das Zielland in der Länderliste auswählen.
2. **Gebiete direkt zuweisen** aktivieren.
3. Die gewünschten Gebiete auf der Karte anklicken.

Das Gebiet erhält unmittelbar die Farbe des neuen Besitzers. Ein Land kann nur
gelöscht werden, wenn ihm keine Gebiete mehr gehören.

## Kartenzoom

Die Schaltflächen **−** und **＋** verkleinern oder vergrößern die Karte.
**Zurücksetzen** stellt 100 % wieder her. Alternativ kann bei gedrückter
`Strg`-Taste mit dem Mausrad über der Karte gezoomt werden. Beim Zoomen bleibt
der Punkt unter dem Mauszeiger möglichst an derselben Bildschirmposition; die
Scrollleisten dienen zum Verschieben des vergrößerten Kartenausschnitts.

## Speichern und Sicherheit

Der Status unter der Karte zeigt an, ob noch ungespeicherte Änderungen
vorliegen. Beim Szenariowechsel und beim Verlassen der Seite warnt der Editor,
bevor Änderungen verworfen werden. Gespeichert werden Szenariometadaten,
Länder, Regionen und die übrigen vom Editor-Endpunkt gelieferten Daten.
