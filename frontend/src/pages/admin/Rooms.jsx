import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { getApiUrl } from '../../config/api';
import { GENERAL_THEME, getRoomTheme } from '../../config/theme';

export default function Rooms() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const { token } = useContext(AuthContext);

  const fetchRooms = () => {
    fetch(getApiUrl('/api/admin/rooms'), {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then((res) => res.json())
      .then((d) => {
        if (Array.isArray(d)) setRooms(d);
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

  const handleUpdate = async (room) => {
    try {
      const res = await fetch(getApiUrl(`/api/admin/rooms/${room.id}`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(room)
      });
      if (res.ok) {
        alert(`Room "${room.room_name}" settings updated.`);
        fetchRooms();
      }
    } catch (err) {
      alert('Update failed: ' + err.message);
    }
  };

  const handleReset = async (roomId) => {
    if (
      confirm(
        'Are you sure you want to reset this room? All candidate scores, answers, and violations will be permanently wiped.'
      )
    ) {
      try {
        const res = await fetch(getApiUrl(`/api/admin/rooms/${roomId}/reset`), {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          alert('Room reset successfully.');
          fetchRooms();
        }
      } catch (err) {
        alert('Reset failed: ' + err.message);
      }
    }
  };

  return (
    <div className={`min-h-screen ${GENERAL_THEME.bg} text-slate-100 p-6 space-y-6`}>
      <div className={`flex justify-between items-center ${GENERAL_THEME.headerBg} p-4 rounded-xl shadow-lg border-b-2 ${GENERAL_THEME.border}`}>
        <div>
          <h1 className={`text-xl font-extrabold uppercase tracking-tight ${GENERAL_THEME.text}`}>Room Configuration</h1>
          <p className="text-xs text-slate-400 uppercase mt-0.5">Control Test Timers and Active Status</p>
        </div>
        <div className="space-x-4">
          <Link to="/admin/dashboard" className="text-sm font-bold text-amber-300 hover:text-amber-400 hover:underline">
            Dashboard
          </Link>
          <Link to="/admin/questions" className="text-sm font-bold text-amber-300 hover:text-amber-400 hover:underline">
            Questions
          </Link>
          <Link to="/admin/monitor" className="text-sm font-bold text-amber-300 hover:text-amber-400 hover:underline">
            Live Monitor
          </Link>
          <Link to="/admin/ranks" className="text-sm font-bold text-amber-300 hover:text-amber-400 hover:underline">
            Rankings
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="p-8 text-center text-sm font-bold uppercase text-slate-400">Loading rooms...</div>
      ) : (
        <div className="space-y-4">
          {rooms.map((room) => {
            const roomThemeInfo = getRoomTheme(room.room_code || room.room_name);
            return (
              <div key={room.id} className={`${GENERAL_THEME.cardBg} border-2 ${GENERAL_THEME.border} p-5 rounded-2xl shadow-xl space-y-4`}>
                <div className="flex justify-between items-center border-b border-slate-700/60 pb-3">
                  <div className="flex items-center space-x-3">
                    <span className="text-sm font-extrabold text-slate-200">{room.room_name}</span>
                    <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${roomThemeInfo.badge}`}>
                      Theme: {roomThemeInfo.name}
                    </span>
                  </div>
                  <span className={`text-xs font-mono font-bold uppercase px-3 py-1 rounded bg-slate-950 border border-amber-500/40 text-amber-400`}>
                    Code: {room.room_code}
                  </span>
                </div>

                <div className="grid grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase text-amber-300 mb-1">Room Name</label>
                    <input
                      type="text"
                      value={room.room_name}
                      onChange={(e) => {
                        const val = e.target.value;
                        setRooms(rooms.map((r) => (r.id === room.id ? { ...r, room_name: val } : r)));
                      }}
                      className={`w-full ${GENERAL_THEME.inputBg} p-2 text-sm rounded border-2`}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-amber-300 mb-1">Access Code</label>
                    <input
                      type="text"
                      value={room.room_code}
                      onChange={(e) => {
                        const val = e.target.value;
                        setRooms(rooms.map((r) => (r.id === room.id ? { ...r, room_code: val } : r)));
                      }}
                      className={`w-full ${GENERAL_THEME.inputBg} p-2 text-sm uppercase font-mono font-bold border-2`}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-amber-300 mb-1">Per Question Timer (s)</label>
                    <input
                      type="number"
                      value={room.time_per_question}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10);
                        setRooms(
                          rooms.map((r) => (r.id === room.id ? { ...r, time_per_question: val } : r))
                        );
                      }}
                      className={`w-full ${GENERAL_THEME.inputBg} p-2 text-sm font-mono border-2`}
                    />
                  </div>

                  <div className="flex items-center space-x-2 pt-5">
                    <input
                      type="checkbox"
                      checked={room.is_active}
                      onChange={(e) => {
                        const val = e.target.checked;
                        setRooms(rooms.map((r) => (r.id === room.id ? { ...r, is_active: val } : r)));
                      }}
                      id={`active_${room.id}`}
                      className="w-4 h-4 accent-amber-500 cursor-pointer"
                    />
                    <label htmlFor={`active_${room.id}`} className="text-xs font-bold uppercase text-slate-200 cursor-pointer">
                      Active for Registration
                    </label>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-3 border-t border-slate-700/60">
                  <button
                    type="button"
                    onClick={() => handleReset(room.id)}
                    className="border border-red-500 text-red-400 px-4 py-1.5 text-xs font-bold rounded hover:bg-red-950/40 uppercase"
                  >
                    Reset Room Data
                  </button>
                  <button
                    type="button"
                    onClick={() => handleUpdate(room)}
                    className={`${GENERAL_THEME.buttonBg} px-6 py-1.5 text-xs rounded uppercase tracking-wider`}
                  >
                    Save Settings
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
