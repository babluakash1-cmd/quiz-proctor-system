import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import io from 'socket.io-client';
import { getApiUrl, getSocketUrl } from '../config/api';

export default function Result() {
  const { candidateId } = useParams();
  const [searchParams] = useSearchParams();
  const [data, setData] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  const isTerminated = searchParams.get('terminated') === 'true';
  const terminationReason = searchParams.get('reason');

  useEffect(() => {
    let socket;

    // Fetch result & initial ranks
    fetch(getApiUrl(`/api/result/${candidateId}`))
      .then((res) => {
        if (!res.ok) throw new Error('Result not found');
        return res.json();
      })
      .then((resData) => {
        setData(resData.candidate);
        setLeaderboard(resData.leaderboard || []);
        setLoading(false);

        // Listen for live leaderboard updates via Socket.IO
        const socketTarget = getSocketUrl();
        socket = socketTarget ? io(socketTarget) : io();

        if (resData.candidate && resData.candidate.room_id) {
          socket.emit('join_room', resData.candidate.room_id);
        }

        socket.on('rank:update', (updatedBoard) => {
          if (Array.isArray(updatedBoard)) {
            setLeaderboard(updatedBoard);
            const current = updatedBoard.find((c) => String(c.id) === String(candidateId));
            if (current) setData(current);
          }
        });
      })
      .catch((err) => {
        console.error('Failed to load result:', err);
        setLoading(false);
      });

    return () => {
      if (socket) socket.disconnect();
    };
  }, [candidateId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center font-bold tracking-widest uppercase">
        Calculating Results & Rankings...
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 space-y-4">
        <p className="text-red-600 font-bold">Candidate record not found or server error.</p>
        <Link to="/" className="border border-black px-4 py-2 font-semibold">
          Return to Home
        </Link>
      </div>
    );
  }

  const isDisqualified = data.status === 'disqualified' || isTerminated;

  return (
    <div className="min-h-screen bg-white p-6 max-w-4xl mx-auto space-y-8">
      {/* Header bar */}
      <div className="flex justify-between items-center border-b border-black pb-4">
        <h2 className="text-lg font-bold uppercase tracking-tight">ECE Assessment Outcome</h2>
        <Link to="/" className="text-sm font-semibold hover:underline">
          Return to Portal
        </Link>
      </div>

      {/* Violation Alert Banner */}
      {isDisqualified && (
        <div className="bg-red-600 text-white p-4 font-bold uppercase tracking-wider text-center shadow-sm">
          Assessment Terminated — Reason: {data.terminated_reason || terminationReason || 'Anti-Cheat Violation Recorded'}
        </div>
      )}

      {/* Candidate Scorecard */}
      <div className="border-2 border-black p-6 space-y-3">
        <h1 className="text-2xl font-bold uppercase tracking-tight">{data.name}</h1>
        <p className="text-xs text-gray-500 uppercase">
          Session ID: <span className="font-mono">{data.id}</span>
        </p>

        <div className="grid grid-cols-3 gap-4 border-t border-black pt-4 text-center">
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase">Status</p>
            <p
              className={`text-lg font-bold uppercase mt-1 ${
                data.status === 'disqualified' ? 'text-red-600' : 'text-green-700'
              }`}
            >
              {data.status}
            </p>
          </div>

          <div>
            <p className="text-xs font-bold text-gray-500 uppercase">Score</p>
            <p className="text-3xl font-bold mt-1 font-mono">{data.score}</p>
          </div>

          <div>
            <p className="text-xs font-bold text-gray-500 uppercase">Current Rank</p>
            <p className="text-3xl font-bold font-mono mt-1">
              {data.rank ? `#${data.rank}` : '—'}
            </p>
          </div>
        </div>
      </div>

      {/* Live Room Leaderboard */}
      <div>
        <div className="flex justify-between items-center border-b-2 border-black pb-2 mb-4">
          <h2 className="text-lg font-bold uppercase">
            Room Live Leaderboard
          </h2>
          <span className="text-xs font-bold text-green-700 flex items-center space-x-1">
            <span className="inline-block w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            <span>REAL-TIME RTDB SYNC</span>
          </span>
        </div>

        <table className="w-full text-left border-collapse border border-black text-sm">
          <thead>
            <tr className="border-b border-black bg-gray-100 text-xs uppercase font-bold">
              <th className="p-3 border-r border-black w-20">Rank</th>
              <th className="p-3 border-r border-black">Candidate Name</th>
              <th className="p-3 border-r border-black w-24">Score</th>
              <th className="p-3 border-r border-black w-32">Status</th>
              <th className="p-3">Termination Reason</th>
            </tr>
          </thead>
          <tbody>
            {leaderboard.length === 0 ? (
              <tr>
                <td colSpan="5" className="p-4 text-center text-gray-500 text-sm">
                  No submissions recorded in this room yet.
                </td>
              </tr>
            ) : (
              leaderboard.map((item) => {
                const isSelf = String(item.id) === String(candidateId);
                return (
                  <tr
                    key={item.id}
                    className={`border-b border-black text-sm font-medium ${
                      isSelf ? 'bg-yellow-100 font-bold' : ''
                    }`}
                  >
                    <td className="p-3 border-r border-black font-mono">
                      {item.rank ? `#${item.rank}` : '—'}
                    </td>
                    <td className="p-3 border-r border-black">
                      {item.name} {isSelf && <span className="text-xs bg-black text-white px-2 py-0.5 rounded ml-2">YOU</span>}
                    </td>
                    <td className="p-3 border-r border-black font-mono font-bold">
                      {item.score}
                    </td>
                    <td className="p-3 border-r border-black uppercase text-xs">
                      <span
                        className={
                          item.status === 'disqualified'
                            ? 'text-red-600 font-bold'
                            : 'text-green-700 font-bold'
                        }
                      >
                        {item.status}
                      </span>
                    </td>
                    <td className="p-3 text-xs text-red-600 font-medium">
                      {item.terminated_reason || '—'}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
