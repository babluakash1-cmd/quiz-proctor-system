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
      if ((b.score || 0) !== (a.score || 0)) {
        return (b.score || 0) - (a.score || 0);
      }
      return (a.submitted_at || 0) - (b.submitted_at || 0);
    });

    const rankedLeaderboard = [];
    let currentRank = 1;

    for (const c of roomCandidates) {
      const updated = { ...c, rank: currentRank };
      await dbService.updateCandidate(c.id, { rank: currentRank });
      rankedLeaderboard.push(updated);
      currentRank++;
    }

    // Persist snapshot directly into Firebase Realtime Database
    await dbService.setLeaderboard(roomId, rankedLeaderboard);

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
