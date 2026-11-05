import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import io from 'socket.io-client';
import { AuthContext } from '../../context/AuthContext';
import { getApiUrl, getSocketUrl } from '../../config/api';

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
    <div className="min-h-screen bg-white p-6 space-y-6">
      <div className="flex justify-between items-center border-b border-black pb-4">
        <div>
          <h1 className="text-xl font-bold uppercase tracking-tight">Real-Time Proctor Monitor & Violation Feed</h1>
          <p className="text-xs text-gray-500 uppercase mt-0.5">Live WebSocket and Heartbeat Telemetry</p>
        </div>
        <div className="space-x-4">
          <Link to="/admin/dashboard" className="text-sm font-semibold hover:underline">
            Dashboard
          </Link>
          <Link to="/admin/questions" className="text-sm font-semibold hover:underline">
            Questions
          </Link>
          <Link to="/admin/rooms" className="text-sm font-semibold hover:underline">
            Rooms
          </Link>
          <Link to="/admin/ranks" className="text-sm font-semibold hover:underline">
            Rankings
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Candidates Status Table */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-sm font-bold uppercase">Candidate Status ({candidates.length})</h2>
            <button
              onClick={fetchMonitorData}
              className="text-xs font-semibold text-gray-600 hover:text-black underline"
            >
              Refresh Table
            </button>
          </div>
          <table className="w-full border border-black text-left text-xs">
            <thead className="bg-gray-100 border-b border-black">
              <tr>
                <th className="p-2 border-r border-black">Candidate</th>
                <th className="p-2 border-r border-black">Room</th>
                <th className="p-2 border-r border-black">Status</th>
                <th className="p-2">Score</th>
              </tr>
            </thead>
            <tbody>
              {candidates.length === 0 ? (
                <tr>
                  <td colSpan="4" className="p-4 text-center text-gray-500">
                    No active candidates currently.
                  </td>
                </tr>
              ) : (
                candidates.map((c) => (
                  <tr key={c.id} className="border-b border-black">
                    <td className="p-2 border-r border-black font-semibold">{c.name}</td>
                    <td className="p-2 border-r border-black">{c.room_name}</td>
                    <td
                      className={`p-2 border-r border-black uppercase font-bold ${
                        c.status === 'disqualified'
                          ? 'text-red-600'
                          : c.status === 'submitted'
                          ? 'text-green-700'
                          : 'text-blue-600'
                      }`}
                    >
                      {c.status}
                    </td>
                    <td className="p-2 font-mono font-bold">{c.score}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Real-Time Violation Feed */}
        <div>
          <h2 className="text-sm font-bold uppercase text-red-600 mb-2 flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-red-600 animate-ping"></span>
            <span>Real-Time Violation Feed</span>
          </h2>
          <div className="border-2 border-black h-[500px] overflow-y-auto p-3 space-y-2 bg-gray-50">
            {violations.length === 0 ? (
              <div className="text-gray-400 text-xs italic text-center p-8">
                No security violations recorded.
              </div>
            ) : (
              violations.map((v, idx) => (
                <div key={idx} className="border border-red-500 bg-red-50 p-3 text-xs space-y-1 shadow-sm">
                  <div className="flex justify-between font-bold text-red-700">
                    <span>[{v.type}]</span>
                    <span className="text-gray-500 font-mono text-[11px]">
                      {new Date(v.time || v.occurred_at).toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="text-gray-800">
                    Candidate: <span className="font-bold">{v.candidateName || v.candidate_name || `ID #${v.candidateId || v.candidate_id}`}</span>
                  </div>
                  <div className="text-gray-500 text-[11px]">
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
