const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');
const dbService = require('../services/dbService');
const auth = require('../middleware/auth');

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

// Admin Login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  try {
    const admin = await dbService.getAdmin(username);
    if (!admin) return res.status(401).json({ error: 'Invalid username or password' });

    const match = await bcrypt.compare(password, admin.password_hash);
    if (!match) return res.status(401).json({ error: 'Invalid username or password' });

    const secret = process.env.JWT_SECRET || 'fallback_secret_key_change_me';
    const token = jwt.sign(
      { username: admin.username },
      secret,
      { expiresIn: '12h' }
    );

    return res.json({
      token,
      username: admin.username,
      mustChangePassword: admin.must_change_password || false
    });
  } catch (err) {
    console.error('Admin login error:', err);
    return res.status(500).json({ error: err.message });
  }
});

// Dashboard Overview
router.get('/dashboard', auth, async (req, res) => {
  try {
    const candidates = await dbService.getAllCandidates();
    const violations = await dbService.getAllViolations(1000);
    const rooms = await dbService.getAllRooms();

    const totalSubmitted = candidates.filter((c) => c.status === 'submitted').length;
    const totalDisqualified = candidates.filter((c) => c.status === 'disqualified').length;
    const finished = candidates.filter((c) => c.status === 'submitted' || c.status === 'disqualified');
    const avgScore = finished.length > 0
      ? (finished.reduce((acc, c) => acc + (c.score || 0), 0) / finished.length).toFixed(1)
      : '0';

    const roomBreakdown = rooms.map((r) => ({
      id: r.id,
      room_name: r.room_name,
      room_code: r.room_code,
      candidate_count: candidates.filter((c) => c.room_id === r.id).length
    }));

    return res.json({
      stats: {
        total_candidates: candidates.length,
        total_submitted: totalSubmitted,
        total_disqualified: totalDisqualified,
        total_violations: violations.length,
        average_score: avgScore
      },
      roomBreakdown
    });
  } catch (err) {
    console.error('Dashboard fetch error:', err);
    return res.status(500).json({ error: err.message });
  }
});

// Rooms Management
router.get('/rooms', auth, async (req, res) => {
  try {
    const rooms = await dbService.getAllRooms();
    return res.json(rooms);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.put('/rooms/:id', auth, async (req, res) => {
  const { id } = req.params;
  const { room_code, room_name, time_per_question, is_active } = req.body;
  try {
    await dbService.updateRoom(id, {
      room_code,
      room_name,
      time_per_question: parseInt(time_per_question, 10) || 30,
      is_active: is_active !== false
    });
    return res.json({ message: 'Room updated successfully' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.post('/rooms/:id/reset', auth, async (req, res) => {
  const { id } = req.params;
  try {
    await dbService.resetRoom(id);
    return res.json({ message: 'Room candidate history, answers, and violations reset.' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Questions CRUD
router.get('/questions', auth, async (req, res) => {
  try {
    const [questions, rooms] = await Promise.all([
      dbService.getAllQuestions(),
      dbService.getAllRooms()
    ]);

    const roomMap = {};
    for (const r of rooms) {
      roomMap[r.id] = r.room_name;
    }

    const enriched = questions.map((q) => ({
      ...q,
      room_name: roomMap[q.room_id] || `Room ${q.room_id}`
    }));

    return res.json(enriched);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.post('/questions', auth, async (req, res) => {
  const { room_id, question_text, option_a, option_b, option_c, option_d, correct_option, marks } = req.body;
  if (!room_id || !question_text || !option_a || !option_b || !option_c || !option_d || !correct_option) {
    return res.status(400).json({ error: 'All question fields are required' });
  }

  try {
    const q = await dbService.addQuestion(room_id, {
      question_text,
      option_a,
      option_b,
      option_c,
      option_d,
      correct_option: correct_option.toUpperCase(),
      marks: parseInt(marks, 10) || 1
    });
    return res.json(q);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Support both /questions/:roomId/:id and /questions/:id
router.delete('/questions/:roomId/:id', auth, async (req, res) => {
  const { roomId, id } = req.params;
  try {
    await dbService.deleteQuestion(roomId, id);
    return res.json({ message: 'Question deleted successfully' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.delete('/questions/:id', auth, async (req, res) => {
  const { id } = req.params;
  try {
    await dbService.deleteQuestion(null, id);
    return res.json({ message: 'Question deleted successfully' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// CSV Import
router.post('/questions/upload-csv', auth, upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'CSV file is required' });

  const results = [];
  fs.createReadStream(req.file.path)
    .pipe(csv())
    .on('data', (data) => results.push(data))
    .on('end', async () => {
      try {
        for (const row of results) {
          if (!row.room_id || !row.question_text) continue;
          await dbService.addQuestion(row.room_id, {
            question_text: row.question_text,
            option_a: row.option_a || '',
            option_b: row.option_b || '',
            option_c: row.option_c || '',
            option_d: row.option_d || '',
            correct_option: (row.correct_option || 'A').toUpperCase(),
            marks: parseInt(row.marks, 10) || 1
          });
        }
        if (fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
        }
        return res.json({ message: `Successfully loaded ${results.length} questions.` });
      } catch (err) {
        if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
        return res.status(500).json({ error: err.message });
      }
    })
    .on('error', (err) => {
      if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      return res.status(500).json({ error: err.message });
    });
});

// Live Monitor Data
router.get('/monitor', auth, async (req, res) => {
  try {
    const [candidates, violations, rooms] = await Promise.all([
      dbService.getAllCandidates(),
      dbService.getAllViolations(50),
      dbService.getAllRooms()
    ]);

    const formattedCandidates = candidates.map((c) => {
      const room = rooms.find((r) => r.id === c.room_id);
      return { ...c, room_name: room?.room_name || c.room_id };
    });

    return res.json({ candidates: formattedCandidates, violations });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Ranks
router.get('/ranks/:roomId', auth, async (req, res) => {
  try {
    let leaderboard = await dbService.getLeaderboard(req.params.roomId);
    if (!leaderboard || leaderboard.length === 0) {
      // If not yet cached, pull from candidates
      const all = await dbService.getAllCandidates();
      leaderboard = all.filter((c) => c.room_id === req.params.roomId);
      leaderboard.sort((a, b) => (b.score || 0) - (a.score || 0));
    }
    return res.json(leaderboard);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
