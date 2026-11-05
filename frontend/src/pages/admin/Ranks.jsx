import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { getApiUrl } from '../../config/api';

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
    a.download = `room_${roomId}_rankings_${Date.now()}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-white p-6 space-y-6">
      <div className="flex justify-between items-center border-b border-black pb-4">
        <div>
          <h1 className="text-xl font-bold uppercase tracking-tight">Room Rankings & CSV Export</h1>
          <p className="text-xs text-gray-500 uppercase mt-0.5">Firebase Live Leaderboards</p>
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
          <Link to="/admin/monitor" className="text-sm font-semibold hover:underline">
            Live Monitor
          </Link>
        </div>
      </div>

      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <label className="text-xs font-bold uppercase">Select Assessment Room:</label>
          <select
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            className="border-2 border-black p-1.5 text-sm font-semibold"
          >
            {rooms.map((r) => (
              <option key={r.id} value={r.id}>
                {r.room_name} ({r.room_code})
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={exportCSV}
          disabled={ranks.length === 0}
          className="bg-black text-white px-4 py-2 text-sm font-semibold uppercase hover:bg-gray-800 disabled:opacity-50"
        >
          Export Rankings to CSV
        </button>
      </div>

      {loading ? (
        <div className="p-8 text-center text-sm font-bold uppercase">Loading rankings...</div>
      ) : (
        <table className="w-full border border-black text-left text-sm">
          <thead className="bg-gray-100 border-b border-black">
            <tr>
              <th className="p-2.5 border-r border-black w-20">Rank</th>
              <th className="p-2.5 border-r border-black">Candidate Name</th>
              <th className="p-2.5 border-r border-black w-24">Score</th>
              <th className="p-2.5 border-r border-black w-32">Status</th>
              <th className="p-2.5">Disqualification / Timeout Reason</th>
            </tr>
          </thead>
          <tbody>
            {ranks.length === 0 ? (
              <tr>
                <td colSpan="5" className="p-4 text-center text-gray-500">
                  No ranked candidates found for this room.
                </td>
              </tr>
            ) : (
              ranks.map((r) => (
                <tr key={r.id} className="border-b border-black">
                  <td className="p-2.5 border-r border-black font-mono font-bold text-center">
                    {r.rank ? `#${r.rank}` : '—'}
                  </td>
                  <td className="p-2.5 border-r border-black font-semibold">{r.name}</td>
                  <td className="p-2.5 border-r border-black font-mono font-bold">{r.score}</td>
                  <td className="p-2.5 border-r border-black uppercase text-xs">
                    <span
                      className={
                        r.status === 'disqualified'
                          ? 'text-red-600 font-bold'
                          : 'text-green-700 font-bold'
                      }
                    >
                      {r.status}
                    </span>
                  </td>
                  <td className="p-2.5 text-xs text-red-600">{r.terminated_reason || '—'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}
