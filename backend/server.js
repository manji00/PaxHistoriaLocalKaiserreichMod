require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const WebSocket = require('ws');
const http = require('http');

// Import routes
const nationsRouter = require('./routes/nations');
const gameRouter = require('./routes/game');
const mapRouter = require('./routes/map');
const chatRouter = require('./routes/chat');
const advisorRouter = require('./routes/advisor');
const actionsRouter = require('./routes/actions');
const eventsRouter = require('./routes/events');
const regionsRouter = require('./routes/regions');
const unitsRouter = require('./routes/units');
const llmRouter = require('./routes/llm');
const scenariosRouter = require('./routes/scenarios');

const app = express();
const server = http.createServer(app);

// WebSocket server for real-time updates
const wss = new WebSocket.Server({ server });

// Make pool available to routes
app.locals.wss = wss;

// Middleware
app.use(cors());
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
    if (req.url.startsWith('/api')) {
        console.log(`[API Request] ${req.method} ${req.url}`);
    }
    next();
});

// API Routes
app.use('/api/nations', nationsRouter);
app.use('/api/game', gameRouter);
app.use('/api/map', mapRouter);
app.use('/api/chat', chatRouter);
app.use('/api/advisor', advisorRouter);
app.use('/api/actions', actionsRouter);
app.use('/api/events', eventsRouter);
app.use('/api/regions', regionsRouter);
app.use('/api/units', unitsRouter);
app.use('/api/llm', llmRouter);
app.use('/api/scenarios', scenariosRouter);

// Ping endpoint for verification
app.get('/api/ping', (req, res) => {
    res.json({ pong: true, time: new Date().toISOString(), message: "Server is running with latest Pax Historia routes" });
});

// Prefer Vite's production output when present, while retaining source assets
// for development without requiring two servers.
const fs = require('fs');
const frontendSource = path.join(__dirname, '../frontend');
const frontendDist = path.join(frontendSource, 'dist');
const frontendRoot = fs.existsSync(path.join(frontendDist, 'index.html')) ? frontendDist : frontendSource;
app.use(express.static(frontendRoot));

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', database: 'none (file-based)' });
});

// Never let an unknown API request fall through to the HTML SPA fallback.
// Clients can then report the real HTTP error instead of trying to parse
// "<!DOCTYPE ..." as JSON.
app.use('/api', (req, res) => {
    res.status(404).json({ error: `API endpoint not found: ${req.method} ${req.originalUrl}` });
});

// Serve frontend
app.get('*', (req, res) => {
    res.sendFile(path.join(frontendRoot, 'index.html'));
});

// WebSocket connection handling
wss.on('connection', (ws) => {
    console.log('Client connected via WebSocket');

    ws.on('message', (message) => {
        console.log('Received:', message.toString());
    });

    ws.on('close', () => {
        console.log('Client disconnected');
    });
});

// Broadcast to all connected clients
app.locals.broadcast = (data) => {
    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(data));
        }
    });
};

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
    console.log(`
╔══════════════════════════════════════════════════════════╗
║                    PAX HISTORIA                          ║
║              WW2 Grand Strategy Game                     ║
╠══════════════════════════════════════════════════════════╣
║  Server running on: http://localhost:${PORT}               ║
║  System: File-Based (HOI4 Data)                          ║
║  LLM API: ${process.env.LLM_API_URL || 'http://127.0.0.1:1234/v1'}        ║
╚══════════════════════════════════════════════════════════╝
    `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('Shutting down gracefully...');
    server.close(() => process.exit(0));
});
