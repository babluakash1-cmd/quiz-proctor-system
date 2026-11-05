const { rtdb } = require('../config/firebase');

function checkDb() {
  if (!rtdb) {
    throw new Error('Firebase Realtime Database is not initialized. Please verify your credentials and FIREBASE_DATABASE_URL in .env.');
  }
}

const dbService = {
  // Rooms
  async getRoomByCode(code) {
    checkDb();
    const snap = await rtdb.ref('rooms').orderByChild('room_code').equalTo(code).once('value');
    const val = snap.val();
    if (!val) return null;
    const roomId = Object.keys(val)[0];
    return { id: roomId, ...val[roomId] };
  },

  async getAllRooms() {
    checkDb();
    const snap = await rtdb.ref('rooms').once('value');
    const val = snap.val() || {};
    return Object.keys(val).map((k) => ({ id: k, ...val[k] }));
  },

  async updateRoom(roomId, updates) {
    checkDb();
    await rtdb.ref(`rooms/${roomId}`).update(updates);
  },

  async resetRoom(roomId) {
    checkDb();
    // 1. Remove candidates of this room and their answers
    const snap = await rtdb.ref('candidates').orderByChild('room_id').equalTo(roomId).once('value');
    const candidates = snap.val() || {};
    for (const cId of Object.keys(candidates)) {
      await rtdb.ref(`candidates/${cId}`).remove();
      await rtdb.ref(`answers/${cId}`).remove();
    }

    // 2. Clear violations matching this room
    const violSnap = await rtdb.ref('violations').orderByChild('room_id').equalTo(roomId).once('value');
    const viols = violSnap.val() || {};
    for (const vId of Object.keys(viols)) {
      await rtdb.ref(`violations/${vId}`).remove();
    }

    // 3. Clear Room Leaderboard
    await rtdb.ref(`leaderboards/${roomId}`).remove();
  },

  // Admins
  async getAdmin(username) {
    checkDb();
    const snap = await rtdb.ref(`admins/${username}`).once('value');
    return snap.val();
  },

  // Candidates
  async createCandidate(candidateData) {
    checkDb();
    const newRef = rtdb.ref('candidates').push();
    const candidate = { id: newRef.key, ...candidateData };
    await newRef.set(candidate);
    return candidate;
  },

  async getCandidateBySession(sessionToken) {
    checkDb();
    const snap = await rtdb.ref('candidates').orderByChild('session_token').equalTo(sessionToken).once('value');
    const val = snap.val();
    if (!val) return null;
    const key = Object.keys(val)[0];
    return { id: key, ...val[key] };
  },

  async getCandidateById(candidateId) {
    checkDb();
    const snap = await rtdb.ref(`candidates/${candidateId}`).once('value');
    return snap.val();
  },

  async updateCandidate(candidateId, updates) {
    checkDb();
    await rtdb.ref(`candidates/${candidateId}`).update(updates);
  },

  async getAllCandidates() {
    checkDb();
    const snap = await rtdb.ref('candidates').once('value');
    const val = snap.val() || {};
    return Object.keys(val).map((k) => ({ id: k, ...val[k] }));
  },

  // Questions
  async getQuestionsByRoom(roomId) {
    checkDb();
    const snap = await rtdb.ref(`questions/${roomId}`).once('value');
    const val = snap.val() || {};
    return Object.keys(val).map((k) => ({ id: k, ...val[k] }));
  },

  async getAllQuestions() {
    checkDb();
    const snap = await rtdb.ref('questions').once('value');
    const val = snap.val() || {};
    const list = [];
    for (const roomId of Object.keys(val)) {
      for (const qId of Object.keys(val[roomId])) {
        list.push({ id: qId, room_id: roomId, ...val[roomId][qId] });
      }
    }
    return list;
  },

  async addQuestion(roomId, questionData) {
    checkDb();
    const newRef = rtdb.ref(`questions/${roomId}`).push();
    const q = { id: newRef.key, ...questionData, is_active: true };
    await newRef.set(q);
    return q;
  },

  async deleteQuestion(roomId, questionId) {
    checkDb();
    if (roomId) {
      await rtdb.ref(`questions/${roomId}/${questionId}`).remove();
    } else {
      // Find question across all rooms if roomId is not provided
      const snap = await rtdb.ref('questions').once('value');
      const val = snap.val() || {};
      for (const rId of Object.keys(val)) {
        if (val[rId][questionId]) {
          await rtdb.ref(`questions/${rId}/${questionId}`).remove();
          break;
        }
      }
    }
  },

  // Answers
  async saveAnswer(candidateId, questionId, answerData) {
    checkDb();
    await rtdb.ref(`answers/${candidateId}/${questionId}`).set(answerData);
  },

  async getCandidateAnswers(candidateId) {
    checkDb();
    const snap = await rtdb.ref(`answers/${candidateId}`).once('value');
    return snap.val() || {};
  },

  // Violations
  async logViolation(violationData) {
    checkDb();
    const newRef = rtdb.ref('violations').push();
    await newRef.set({ id: newRef.key, ...violationData });
  },

  async getAllViolations(limit = 50) {
    checkDb();
    const snap = await rtdb.ref('violations').limitToLast(limit).once('value');
    const val = snap.val() || {};
    return Object.keys(val).map((k) => ({ id: k, ...val[k] })).reverse();
  },

  // Leaderboard
  async setLeaderboard(roomId, leaderboardArray) {
    checkDb();
    await rtdb.ref(`leaderboards/${roomId}`).set(leaderboardArray);
  },

  async getLeaderboard(roomId) {
    checkDb();
    const snap = await rtdb.ref(`leaderboards/${roomId}`).once('value');
    return snap.val() || [];
  }
};

module.exports = dbService;
