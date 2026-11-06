const express = require('express');
const crypto = require('crypto');
const dbService = require('../services/dbService');
const { recomputeRanks } = require('../services/rankingService');

const router = express.Router();

// Candidate joins room
router.post('/join', async (req, res) => {
  const { roomCode, name } = req.body;
  if (!roomCode || !name) {
    return res.status(400).json({ error: 'Room code and name are required' });
  }

  const nameRegex = /^[A-Za-z\s.]{2,50}$/;
  if (!nameRegex.test(name.trim())) {
    return res.status(400).json({ error: 'Name must be 2-50 characters (letters, spaces, dots only)' });
  }

  try {
    const room = await dbService.getRoomByCode(roomCode.trim().toUpperCase());
    if (!room || !room.is_active) {
      return res.status(404).json({ error: 'Invalid or inactive room access code' });
    }

    const sessionToken = crypto.randomBytes(32).toString('hex');
    const candidate = await dbService.createCandidate({
      name: name.trim(),
      room_id: room.id,
      session_token: sessionToken,
      status: 'in_progress',
      score: 0,
      marks: 0,
      rank: null,
      terminated_reason: null,
      last_ping: Date.now(),
      started_at: Date.now(),
      submitted_at: null
    });

    if (req.io) {
      req.io.to('admin_monitor').emit('candidate:joined', {
        candidate,
        name: candidate.name,
        roomId: room.id,
        roomName: room.room_name
      });
    }

    return res.json({
      sessionToken: candidate.session_token,
      candidateId: candidate.id,
      roomId: room.id,
      roomName: room.room_name,
      timePerQuestion: room.time_per_question || 30
    });
  } catch (err) {
    console.error('Join error:', err);
    return res.status(500).json({ error: err.message });
  }
});

function fisherYatesShuffle(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Shuffled Question Initialization (Strips correct options so they cannot be inspected in browser)
router.get('/questions-init/:sessionToken', async (req, res) => {
  const { sessionToken } = req.params;
  try {
    const candidate = await dbService.getCandidateBySession(sessionToken);
    if (!candidate) return res.status(404).json({ error: 'Invalid or expired session' });

    if (candidate.status !== 'in_progress') {
      return res.status(403).json({ error: 'Quiz already closed', status: candidate.status });
    }

    const rawQuestions = await dbService.getQuestionsByRoom(candidate.room_id);
    const activeQuestions = rawQuestions.filter((q) => q.is_active !== false);

    // Randomize question sequence per candidate using Fisher-Yates
    const shuffledQuestions = fisherYatesShuffle(activeQuestions);

    // Sanitize and shuffle answer choices per question (stripping correct_option)
    const prepared = shuffledQuestions.map((q) => {
      const options = fisherYatesShuffle([
        { key: 'A', text: q.option_a },
        { key: 'B', text: q.option_b },
        { key: 'C', text: q.option_c },
        { key: 'D', text: q.option_d }
      ]);

      return {
        id: q.id,
        question_text: q.question_text,
        marks: q.marks || 1,
        options
      };
    });

    return res.json({ total: prepared.length, questions: prepared });
  } catch (err) {
    console.error('Questions-init error:', err);
    return res.status(500).json({ error: err.message });
  }
});

// Save intermediate answer per question
router.post('/answer', async (req, res) => {
  const { sessionToken, questionId, selectedOption, timeTaken } = req.body;
  try {
    const candidate = await dbService.getCandidateBySession(sessionToken);
    if (!candidate || candidate.status !== 'in_progress') {
      return res.status(403).json({ error: 'Session not valid or quiz finalized' });
    }

    const questions = await dbService.getQuestionsByRoom(candidate.room_id);
    const targetQ = questions.find((q) => q.id === questionId);
    if (!targetQ) return res.status(404).json({ error: 'Question not found' });

    const isCorrect = String(targetQ.correct_option || '').trim().toUpperCase() === String(selectedOption || '').trim().toUpperCase();
    await dbService.saveAnswer(candidate.id, questionId, {
      selected_option: selectedOption || null,
      is_correct: isCorrect,
      time_taken_seconds: timeTaken || 0,
      answered_at: Date.now()
    });

    return res.json({ success: true });
  } catch (err) {
    console.error('Answer error:', err);
    return res.status(500).json({ error: err.message });
  }
});

// Heartbeat ping
router.post('/heartbeat', async (req, res) => {
  const { sessionToken } = req.body;
  try {
    const candidate = await dbService.getCandidateBySession(sessionToken);
    if (candidate) {
      await dbService.updateCandidate(candidate.id, { last_ping: Date.now() });
    }
    return res.json({ status: 'ok' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Strict Anti-Cheat Violation Trigger
router.post('/violation', async (req, res) => {
  const { sessionToken, type, questionIndex } = req.body;
  try {
    const candidate = await dbService.getCandidateBySession(sessionToken);
    if (!candidate) return res.status(404).json({ error: 'Candidate not found' });

    if (candidate.status !== 'in_progress') {
      return res.json({ message: 'Quiz already finalized', candidateId: candidate.id });
    }

    // Log violation event
    await dbService.logViolation({
      candidate_id: candidate.id,
      candidate_name: candidate.name,
      room_id: candidate.room_id,
      type: type || 'Unspecified violation',
      question_index: questionIndex || 0,
      occurred_at: Date.now()
    });

    // Compute existing score from submitted answers
    const answers = await dbService.getCandidateAnswers(candidate.id);
    const questions = await dbService.getQuestionsByRoom(candidate.room_id);
    let totalScore = 0;
    for (const [qId, ans] of Object.entries(answers)) {
      if (ans.is_correct) {
        const q = questions.find((item) => item.id === qId);
        totalScore += q?.marks || 1;
      }
    }

    // Terminate candidate
    await dbService.updateCandidate(candidate.id, {
      status: 'disqualified',
      score: totalScore,
      marks: totalScore,
      submitted_at: Date.now(),
      terminated_reason: type
    });

    // Broadcast violation to real-time admin monitor
    if (req.io) {
      req.io.to('admin_monitor').emit('violation:feed', {
        candidateId: candidate.id,
        candidateName: candidate.name,
        roomId: candidate.room_id,
        type,
        questionIndex,
        time: Date.now()
      });
    }

    await recomputeRanks(candidate.room_id, req.io);

    return res.json({
      success: true,
      disqualified: true,
      reason: type,
      candidateId: candidate.id
    });
  } catch (err) {
    console.error('Violation handling error:', err);
    return res.status(500).json({ error: err.message });
  }
});

// Final Exam Submission (Normal finish)
router.post('/submit', async (req, res) => {
  const { sessionToken } = req.body;
  try {
    const candidate = await dbService.getCandidateBySession(sessionToken);
    if (!candidate) return res.status(404).json({ error: 'Candidate not found' });

    if (candidate.status !== 'in_progress') {
      return res.json({ message: 'Quiz already submitted', candidateId: candidate.id, score: candidate.score });
    }

    const answers = await dbService.getCandidateAnswers(candidate.id);
    const questions = await dbService.getQuestionsByRoom(candidate.room_id);
    let totalScore = 0;
    for (const [qId, ans] of Object.entries(answers)) {
      if (ans.is_correct) {
        const q = questions.find((item) => item.id === qId);
        totalScore += q?.marks || 1;
      }
    }

    await dbService.updateCandidate(candidate.id, {
      status: 'submitted',
      score: totalScore,
      marks: totalScore,
      submitted_at: Date.now()
    });

    await recomputeRanks(candidate.room_id, req.io);

    return res.json({
      success: true,
      candidateId: candidate.id,
      score: totalScore
    });
  } catch (err) {
    console.error('Submit error:', err);
    return res.status(500).json({ error: err.message });
  }
});

// Candidate Result & Live Leaderboard Fetch
router.get('/result/:candidateId', async (req, res) => {
  const { candidateId } = req.params;
  try {
    const candidate = await dbService.getCandidateById(candidateId);
    if (!candidate) return res.status(404).json({ error: 'Candidate not found' });

    const leaderboard = await dbService.getLeaderboard(candidate.room_id);
    return res.json({ candidate, leaderboard });
  } catch (err) {
    console.error('Result fetch error:', err);
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;

