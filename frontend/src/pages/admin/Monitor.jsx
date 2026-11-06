import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import io from 'socket.io-client';
import { AuthContext } from '../../context/AuthContext';
import { getApiUrl, getSocketUrl } from '../../config/api';
import { GENERAL_THEME } from '../../config/theme';

export default function Monitor() {
  const [candidates, setCandidates] = useState([]);
  const [violations, setViolations] = useState([]);
  const { token } = useContext(AuthContext);

  const fetchMonitorData = () => {
    fetch(getApiUrl('/api/admin/monitor'), {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then((res) => res.json())
      .then((data) => {
        setCandidates(data.candidates || []);
        setViolations(data.violations || []);
      })
      .catch((err) => console.error('Failed to load monitor data:', err));
  };

  useEffect(() => {
    fetchMonitorData();

    const socketTarget = getSocketUrl();
    const socket = socketTarget ? io(socketTarget) : io();

    socket.emit('join_admin_feed');

    socket.on('candidate:joined', () => {
      fetchMonitorData();
    });

    socket.on('candidate:timeout', () => {
      fetchMonitorData();
    });

    socket.on('violation:feed', (violation) => {
      setViolations((prev) => [violation, ...prev]);
      fetchMonitorData();
    });

    return () => {
      socket.disconnect();
    };
  }, [token]);

  return (
    <div className={`min-h-screen ${GENERAL_THEME.bg} text-slate-100 p-6 space-y-6`}>
      <div className={`flex justify-between items-center ${GENERAL_THEME.headerBg} p-4 rounded-xl shadow-lg border-b-2 ${GENERAL_THEME.border}`}>
        <div>
          <h1 className={`text-xl font-extrabold uppercase tracking-tight ${GENERAL_THEME.text}`}>Real-Time Proctor Monitor & Feed</h1>
          <p className="text-xs text-slate-400 uppercase mt-0.5">Live WebSocket and Heartbeat Telemetry</p>
        </div>
        <div className="space-x-4">
          <Link to="/admin/dashboard" className="text-sm font-bold text-amber-300 hover:text-amber-400 hover:underline">
            Dashboard
          </Link>
          <Link to="/admin/questions" className="text-sm font-bold text-amber-300 hover:text-amber-400 hover:underline">
            Questions
          </Link>
          <Link to="/admin/rooms" className="text-sm font-bold text-amber-300 hover:text-amber-400 hover:underline">
            Rooms
          </Link>
          <Link to="/admin/ranks" className="text-sm font-bold text-amber-300 hover:text-amber-400 hover:underline">
            Rankings
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Candidates Status Table */}
        <div className={`${GENERAL_THEME.cardBg} border-2 ${GENERAL_THEME.border} p-5 rounded-2xl shadow-xl space-y-3`}>
          <div className="flex justify-between items-center pb-2 border-b border-slate-700/60">
            <h2 className={`text-sm font-extrabold uppercase ${GENERAL_THEME.text}`}>Registered Candidates ({candidates.length})</h2>
            <button
              onClick={fetchMonitorData}
              className="text-xs font-bold text-amber-400 hover:underline"
            >
              Refresh Table
            </button>
          </div>
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-700 text-slate-400 font-bold uppercase">
                <th className="p-2">Candidate</th>
                <th className="p-2">Room Name</th>
                <th className="p-2">Status</th>
                <th className="p-2 text-right">Score</th>
              </tr>
            </thead>
            <tbody>
              {candidates.length === 0 ? (
                <tr>
                  <td colSpan="4" className="p-4 text-center text-slate-400">
                    No active candidates currently.
                  </td>
                </tr>
              ) : (
                candidates.map((c) => (
                  <tr key={c.id} className="border-b border-slate-800 hover:bg-slate-900/40">
                    <td className="p-2 font-semibold text-slate-200">{c.name}</td>
                    <td className="p-2 text-slate-300">{c.room_name}</td>
                    <td
                      className={`p-2 uppercase font-bold ${
                        c.status === 'disqualified'
                          ? 'text-red-400'
                          : c.status === 'submitted'
                          ? 'text-emerald-400'
                          : 'text-amber-300'
                      }`}
                    >
                      {c.status}
                    </td>
                    <td className="p-2 font-mono font-extrabold text-right text-amber-400">{c.score}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Real-Time Violation Feed */}
        <div className={`${GENERAL_THEME.cardBg} border-2 ${GENERAL_THEME.border} p-5 rounded-2xl shadow-xl space-y-3`}>
          <h2 className="text-sm font-extrabold uppercase text-red-400 flex items-center space-x-2 border-b border-slate-700/60 pb-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping"></span>
            <span>Real-Time Security Violation Feed</span>
          </h2>
          <div className="h-[480px] overflow-y-auto p-3 space-y-2.5 bg-slate-950/80 rounded-xl border border-slate-800">
            {violations.length === 0 ? (
              <div className="text-slate-500 text-xs italic text-center p-8">
                No security violations recorded.
              </div>
            ) : (
              violations.map((v, idx) => (
                <div key={idx} className="border border-red-900/80 bg-red-950/40 p-3 rounded-lg text-xs space-y-1 shadow-sm">
                  <div className="flex justify-between font-bold text-red-400">
                    <span>[{v.type}]</span>
                    <span className="text-slate-400 font-mono text-[11px]">
                      {new Date(v.time || v.occurred_at).toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="text-slate-200">
                    Candidate: <span className="font-bold text-amber-300">{v.candidateName || v.candidate_name || `Candidate #${v.candidateId || v.candidate_id}`}</span>
                  </div>
                  <div className="text-slate-400 text-[11px]">
                    Occurred at Question #{v.questionIndex || v.question_index || 1} • Auto-disqualified
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
