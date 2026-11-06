const dbService = require('./dbService');

async function recomputeRanks(roomId, io = null) {
  try {
    const allCandidates = await dbService.getAllCandidates();

    // Filter candidates belonging to the room with finalized or disqualified status
    const roomCandidates = allCandidates.filter(
      (c) => c.room_id === roomId && (c.status === 'submitted' || c.status === 'disqualified')
    );

    // Sort descending by score, ascending by submission time (fastest submission gets higher rank on tie)
    roomCandidates.sort((a, b) => {
      const scoreA = a.marks !== undefined ? a.marks : (a.score || 0);
      const scoreB = b.marks !== undefined ? b.marks : (b.score || 0);
      if (scoreB !== scoreA) {
        return scoreB - scoreA;
      }
      return (a.submitted_at || 0) - (b.submitted_at || 0);
    });

    const rankedLeaderboard = [];
    const batchUpdates = {};
    let currentRank = 1;

    for (const c of roomCandidates) {
      const candidateMarks = c.marks !== undefined ? c.marks : (c.score || 0);
      const updated = {
        ...c,
        name: c.name,
        marks: candidateMarks,
        score: candidateMarks,
        rank: currentRank
      };

      batchUpdates[`candidates/${c.id}/rank`] = currentRank;
      batchUpdates[`candidates/${c.id}/marks`] = candidateMarks;
      batchUpdates[`candidates/${c.id}/score`] = candidateMarks;
      batchUpdates[`candidates/${c.id}/name`] = c.name;

      rankedLeaderboard.push(updated);
      currentRank++;
    }

    batchUpdates[`leaderboards/${roomId}`] = rankedLeaderboard;

    // Atomically persist all candidate rank changes and room leaderboard in one single batch operation
    if (Object.keys(batchUpdates).length > 0) {
      await dbService.updateBatch(batchUpdates);
    }

    // Broadcast to Socket.IO room channel and admin monitor
    if (io) {
      io.to(`room_${roomId}`).emit('rank:update', rankedLeaderboard);
      io.to('admin_monitor').emit('rank:update', { roomId, leaderboard: rankedLeaderboard });
    }

    return rankedLeaderboard;
  } catch (err) {
    console.error(`Failed to recompute ranks for room ${roomId}:`, err.message);
    return [];
  }
}

module.exports = { recomputeRanks };
