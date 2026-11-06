const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const dbService = require('./src/services/dbService');
const candidateRoutes = require('./src/routes/candidate');
const adminRoutes = require('./src/routes/admin');
const registerSocketHandlers = require('./src/socket/socketHandler');
const { recomputeRanks } = require('./src/services/rankingService');

const app = express();
const server = http.createServer(app);

// Determine allowed origins for CORS & WebSockets
const rawClientUrl = process.env.CLIENT_URL || '*';
const allowedOrigins = rawClientUrl === '*'
  ? true
  : rawClientUrl.includes(',')
  ? rawClientUrl.split(',').map((u) => u.trim())
  : [rawClientUrl.trim()];

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
  }
});

// Attach socket io instance to express req object
app.use((req, res, next) => {
  req.io = io;
  next();
});

app.use(
  cors({
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
  })
);

app.use(express.json());

// API Routes
app.use('/api', candidateRoutes);
app.use('/api/admin', adminRoutes);

// Health check endpoint for monitoring & cloud load balancers
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Production static file serving: If frontend is built in ../frontend/dist
const frontendDistPath = path.join(__dirname, '../frontend/dist');
if (fs.existsSync(frontendDistPath)) {
  console.log(`Serving static frontend build from ${frontendDistPath}`);
  app.use(express.static(frontendDistPath));
  app.get('*', (req, res) => {
    // Avoid intercepting API routes
    if (req.path.startsWith('/api') || req.path.startsWith('/socket.io')) {
      return res.status(404).json({ error: 'Endpoint not found' });
    }
    res.sendFile(path.join(frontendDistPath, 'index.html'));
  });
}

// Register WebSocket handlers
registerSocketHandlers(io);

// Background Heartbeat Monitor: Checks every 5 seconds for disconnected candidates (no ping in 20s)
setInterval(async () => {
  try {
    const candidates = await dbService.getAllCandidates();
    const now = Date.now();
    const expired = candidates.filter(
      (c) => c.status === 'in_progress' && c.last_ping && now - c.last_ping > 20000
    );

    for (const c of expired) {
      // Calculate current score from saved responses
      const answers = await dbService.getCandidateAnswers(c.id);
      const questions = await dbService.getQuestionsByRoom(c.room_id);
      let totalScore = 0;
      for (const [qId, ans] of Object.entries(answers)) {
        if (ans.is_correct) {
          const q = questions.find((item) => item.id === qId);
          totalScore += q?.marks || 1;
        }
      }

      await dbService.updateCandidate(c.id, {
        status: 'submitted',
        score: totalScore,
        marks: totalScore,
        submitted_at: Date.now(),
        terminated_reason: 'Heartbeat timeout (force close / connection drop)'
      });

      // Notify admin monitor
      io.to('admin_monitor').emit('candidate:timeout', {
        candidateId: c.id,
        name: c.name,
        roomId: c.room_id,
        reason: 'Heartbeat timeout'
      });

      await recomputeRanks(c.room_id, io);
    }
  } catch (err) {
    // Suppress repeated logs if RTDB is not yet connected
    if (process.env.NODE_ENV !== 'production') {
      console.error('Firebase heartbeat audit tick:', err.message);
    }
  }
}, 5000);

const PORT = process.env.PORT || 5000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Quiz Proctor backend running on port ${PORT}`);
  console.log(`Allowed CORS origins: ${JSON.stringify(allowedOrigins)}`);
});

