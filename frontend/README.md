# Phaser-4-Frontend

Die Weltkarte wird vollständig im Phaser-Canvas gezeichnet; die bestehenden
Menüs und Popups bleiben im DOM. `npm run map:build` erzeugt aus den
Szenariopaketen versionierte Geometrieartefakte und validiert SVG-/JSON-IDs.

## Entwicklung

```bash
npm ci
npm run map:build
npm run dev
```

Vite leitet `/api` und WebSockets an Port 3000 weiter. Für getrennte Hosts
können `VITE_API_URL` und `VITE_WS_URL` gesetzt werden. Für Produktion erzeugt
`npm run build` `frontend/dist`; Express liefert dieses Verzeichnis automatisch
aus. Ohne Build fällt Express auf die Quelldateien zurück. In diesem Modus löst
die Import-Map in `index.html` den Bare Import `phaser` über die auf
`4.0.0-rc.5` fixierte ESM-CDN-Version auf. Damit funktioniert der bisherige
direkte Start über `backend/server.js` weiterhin; für einen vollständig lokalen
Betrieb sollte vorher der Vite-Build erzeugt werden.

Die Szenariokoordinaten entsprechen ohne Y-Invertierung exakt dem SVG-`viewBox`.
Horizontaler World-Wrap ist bewusst deaktiviert; Kamera und Treffer bleiben im
kanonischen Koordinatensystem. Phaser ist im Lockfile auf `4.0.0-rc.5` fixiert.
