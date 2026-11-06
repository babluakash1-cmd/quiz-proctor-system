import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { getApiUrl } from '../../config/api';
import { GENERAL_THEME } from '../../config/theme';

export default function Ranks() {
  const [roomId, setRoomId] = useState('room_1');
  const [rooms, setRooms] = useState([]);
  const [ranks, setRanks] = useState([]);
  const [loading, setLoading] = useState(true);
  const { token } = useContext(AuthContext);

  const fetchRooms = () => {
    fetch(getApiUrl('/api/admin/rooms'), {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then((res) => res.json())
      .then((d) => {
        if (Array.isArray(d)) {
          setRooms(d);
          if (d.length > 0 && roomId === 'room_1') {
            setRoomId(d[0].id);
          }
        }
      })
      .catch((err) => console.error(err));
  };

  const fetchRanks = (rId) => {
    if (!rId) return;
    setLoading(true);
    fetch(getApiUrl(`/api/admin/ranks/${rId}`), {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then((res) => res.json())
      .then((d) => {
        setRanks(Array.isArray(d) ? d : []);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchRooms();
  }, [token]);

  useEffect(() => {
    if (roomId) fetchRanks(roomId);
  }, [roomId, token]);

  const exportCSV = () => {
    const headers = 'Rank,Candidate Name,Score,Status,Submitted At,Terminated Reason\n';
    const rows = ranks
      .map(
        (r) =>
          `"${r.rank || ''}","${r.name}","${r.score}","${r.status}","${
            r.submitted_at ? new Date(r.submitted_at).toLocaleString() : ''
          }","${r.terminated_reason || ''}"`
      )
      .join('\n');

    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `room_rankings_${Date.now()}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className={`min-h-screen ${GENERAL_THEME.bg} text-slate-100 p-6 space-y-6`}>
      <div className={`flex justify-between items-center ${GENERAL_THEME.headerBg} p-4 rounded-xl shadow-lg border-b-2 ${GENERAL_THEME.border}`}>
        <div>
          <h1 className={`text-xl font-extrabold uppercase tracking-tight ${GENERAL_THEME.text}`}>Room Rankings & CSV Export</h1>
          <p className="text-xs text-slate-400 uppercase mt-0.5">Firebase Live Leaderboards</p>
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
          <Link to="/admin/monitor" className="text-sm font-bold text-amber-300 hover:text-amber-400 hover:underline">
            Live Monitor
          </Link>
        </div>
      </div>

      <div className={`${GENERAL_THEME.cardBg} border-2 ${GENERAL_THEME.border} p-4 rounded-xl shadow-lg flex justify-between items-center`}>
        <div className="flex items-center space-x-3">
          <label className="text-xs font-bold uppercase text-amber-300">Select Room:</label>
          <select
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            className="bg-slate-950 text-amber-400 border-2 border-amber-500 p-2 text-sm font-bold rounded"
          >
            {rooms.map((r) => (
              <option key={r.id} value={r.id} className="bg-slate-900 text-slate-100">
                {r.room_name} ({r.room_code})
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={exportCSV}
          disabled={ranks.length === 0}
          className={`${GENERAL_THEME.buttonBg} px-5 py-2 text-xs rounded uppercase tracking-wider disabled:opacity-50`}
        >
          Export Rankings to CSV
        </button>
      </div>

      {loading ? (
        <div className="p-8 text-center text-sm font-bold uppercase text-slate-400">Loading rankings...</div>
      ) : (
        <div className={`${GENERAL_THEME.cardBg} border-2 ${GENERAL_THEME.border} p-5 rounded-2xl shadow-xl space-y-3`}>
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-slate-700 text-xs uppercase font-bold text-slate-400">
                <th className="p-3 w-20 text-center">Rank</th>
                <th className="p-3">Candidate Name</th>
                <th className="p-3 w-32 text-center">Marks / Score</th>
                <th className="p-3 w-32">Status</th>
                <th className="p-3">Disqualification / Timeout Reason</th>
              </tr>
            </thead>
            <tbody>
              {ranks.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-6 text-center text-slate-400">
                    No ranked candidates found for this room.
                  </td>
                </tr>
              ) : (
                ranks.map((r) => (
                  <tr key={r.id} className="border-b border-slate-800 hover:bg-slate-900/40">
                    <td className="p-3 font-mono font-extrabold text-amber-400 text-center">
                      {r.rank ? `#${r.rank}` : '—'}
                    </td>
                    <td className="p-3 font-semibold text-slate-200">{r.name}</td>
                    <td className="p-3 font-mono font-extrabold text-emerald-400 text-center">{r.score}</td>
                    <td className="p-3 uppercase text-xs">
                      <span
                        className={
                          r.status === 'disqualified'
                            ? 'text-red-400 font-bold'
                            : 'text-emerald-400 font-bold'
                        }
                      >
                        {r.status}
                      </span>
                    </td>
                    <td className="p-3 text-xs text-red-400">{r.terminated_reason || '—'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
