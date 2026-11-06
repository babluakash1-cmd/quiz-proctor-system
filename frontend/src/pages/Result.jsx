import React, { useEffect, useState, useRef } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import io from 'socket.io-client';
import { getApiUrl, getSocketUrl } from '../config/api';
import { getRoomTheme } from '../config/theme';

export default function Result() {
  const { candidateId } = useParams();
  const [searchParams] = useSearchParams();
  const [data, setData] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const socketRef = useRef(null);

  const isTerminated = searchParams.get('terminated') === 'true';
  const terminationReason = searchParams.get('reason');

  const roomIdentifier = localStorage.getItem('roomCode') || localStorage.getItem('roomName') || '';
  const theme = getRoomTheme(roomIdentifier);

  useEffect(() => {
    let isMounted = true;

    fetch(getApiUrl(`/api/result/${candidateId}`))
      .then((res) => {
        if (!res.ok) throw new Error('Result not found');
        return res.json();
      })
      .then((resData) => {
        if (!isMounted) return;
        setData(resData.candidate);
        setLeaderboard(resData.leaderboard || []);
        setLoading(false);

        const socketTarget = getSocketUrl();
        const socket = socketTarget ? io(socketTarget) : io();
        socketRef.current = socket;

        if (resData.candidate && resData.candidate.room_id) {
          socket.emit('join_room', resData.candidate.room_id);
        }

        socket.on('rank:update', (updatedBoard) => {
          if (!isMounted) return;
          if (Array.isArray(updatedBoard)) {
            setLeaderboard(updatedBoard);
            const current = updatedBoard.find((c) => String(c.id) === String(candidateId));
            if (current) setData(current);
          }
        });
      })
      .catch((err) => {
        if (!isMounted) return;
        console.error('Failed to load result:', err);
        setLoading(false);
      });

    return () => {
      isMounted = false;
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [candidateId]);

  if (loading) {
    return (
      <div className={`min-h-screen ${theme.bg} ${theme.textLight} flex items-center justify-center font-bold tracking-widest uppercase text-sm`}>
        Calculating Results & Live Rankings...
      </div>
    );
  }

  if (!data) {
    return (
      <div className={`min-h-screen ${theme.bg} ${theme.textLight} flex flex-col items-center justify-center p-6 space-y-4`}>
        <p className="text-red-400 font-bold">Candidate record not found or server connection error.</p>
        <Link to="/" className={`${theme.buttonBg} px-6 py-2 rounded-lg font-semibold`}>
          Return to Portal
        </Link>
      </div>
    );
  }

  const isDisqualified = data.status === 'disqualified' || isTerminated;

  return (
    <div className={`min-h-screen ${theme.bg} ${theme.textLight} p-6`}>
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header bar */}
        <div className={`flex justify-between items-center ${theme.headerBg} p-4 rounded-xl border-b-2 ${theme.border}`}>
          <h2 className={`text-lg font-extrabold uppercase tracking-tight ${theme.text}`}>Assessment Scorecard</h2>
          <Link to="/" className="text-xs font-semibold text-slate-300 hover:underline">
            Exit to Portal
          </Link>
        </div>

        {/* Violation Alert Banner */}
        {isDisqualified && (
          <div className="bg-red-600 text-white p-4 rounded-xl font-bold uppercase tracking-wider text-center shadow-lg border border-red-500">
            Assessment Terminated — Reason: {data.terminated_reason || terminationReason || 'Anti-Cheat Violation Recorded'}
          </div>
        )}

        {/* Candidate Scorecard */}
        <div className={`${theme.cardBg} border-2 ${theme.border} p-6 rounded-2xl shadow-2xl space-y-4`}>
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs uppercase font-extrabold text-slate-400">Candidate Name</p>
              <h1 className={`text-3xl font-extrabold uppercase ${theme.text}`}>{data.name}</h1>
            </div>
            <span className={`text-xs font-bold uppercase px-3 py-1 rounded-full ${theme.badge}`}>
              Official Record
            </span>
          </div>

          <div className="grid grid-cols-3 gap-4 border-t border-slate-700/60 pt-4 text-center">
            <div className="p-3.5 rounded-xl bg-black/40 border border-slate-700/40">
              <p className="text-xs font-bold text-slate-400 uppercase">Status</p>
              <p
                className={`text-lg font-extrabold uppercase mt-1 ${
                  data.status === 'disqualified' ? 'text-red-400' : 'text-emerald-400'
                }`}
              >
                {data.status}
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-black/40 border border-slate-700/40">
              <p className="text-xs font-bold text-slate-400 uppercase">Marks Scored</p>
              <p className={`text-3xl font-mono font-extrabold mt-1 ${theme.text}`}>{data.score ?? data.marks ?? 0}</p>
            </div>

            <div className="p-3.5 rounded-xl bg-black/40 border border-slate-700/40">
              <p className="text-xs font-bold text-slate-400 uppercase">Final Rank</p>
              <p className="text-3xl font-mono font-extrabold text-amber-400 mt-1">
                {data.rank ? `#${data.rank}` : '—'}
              </p>
            </div>
          </div>
        </div>

        {/* Live Leaderboard */}
        <div className={`${theme.cardBg} border-2 ${theme.border} p-6 rounded-2xl shadow-2xl space-y-4`}>
          <div className="flex justify-between items-center border-b border-slate-700/60 pb-3">
            <h2 className={`text-lg font-bold uppercase ${theme.text}`}>
              Official Room Leaderboard
            </h2>
            <span className="text-xs font-bold text-emerald-400 flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>SYNCHRONIZED WITH DATABASE</span>
            </span>
          </div>

          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-700 text-xs uppercase font-extrabold text-slate-400">
                <th className="p-3 w-20">Rank</th>
                <th className="p-3">Candidate Name</th>
                <th className="p-3 w-28">Marks</th>
                <th className="p-3 w-32">Status</th>
                <th className="p-3">Remarks</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-6 text-center text-slate-400 text-sm">
                    No completed submissions recorded yet.
                  </td>
                </tr>
              ) : (
                leaderboard.map((item) => {
                  const isSelf = String(item.id) === String(candidateId);
                  return (
                    <tr
                      key={item.id}
                      className={`border-b border-slate-800 text-sm font-medium transition-colors ${
                        isSelf ? 'bg-amber-500/15 border-amber-500/40 font-bold' : 'hover:bg-slate-800/40'
                      }`}
                    >
                      <td className="p-3 font-mono font-extrabold text-amber-400">
                        {item.rank ? `#${item.rank}` : '—'}
                      </td>
                      <td className="p-3">
                        {item.name} {isSelf && <span className="text-xs bg-amber-500 text-slate-950 font-extrabold px-2 py-0.5 rounded ml-2">YOU</span>}
                      </td>
                      <td className="p-3 font-mono font-extrabold text-slate-100">
                        {item.score ?? item.marks ?? 0}
                      </td>
                      <td className="p-3 uppercase text-xs">
                        <span
                          className={
                            item.status === 'disqualified'
                              ? 'text-red-400 font-bold'
                              : 'text-emerald-400 font-bold'
                          }
                        >
                          {item.status}
                        </span>
                      </td>
                      <td className="p-3 text-xs text-red-400">
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
    </div>
  );
}
