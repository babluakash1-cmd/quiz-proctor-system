import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { getApiUrl } from '../../config/api';

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
    <div className="min-h-screen bg-white p-6 space-y-6">
      <div className="flex justify-between items-center border-b border-black pb-4">
        <div>
          <h1 className="text-xl font-bold uppercase tracking-tight">Room Management & Configuration</h1>
          <p className="text-xs text-gray-500 uppercase mt-0.5">Control Test Timers and Active Status</p>
        </div>
        <div className="space-x-4">
          <Link to="/admin/dashboard" className="text-sm font-semibold hover:underline">
            Dashboard
          </Link>
          <Link to="/admin/questions" className="text-sm font-semibold hover:underline">
            Questions
          </Link>
          <Link to="/admin/monitor" className="text-sm font-semibold hover:underline">
            Live Monitor
          </Link>
          <Link to="/admin/ranks" className="text-sm font-semibold hover:underline">
            Rankings
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="p-8 text-center text-sm font-bold uppercase">Loading rooms...</div>
      ) : (
        <div className="space-y-4">
          {rooms.map((room) => (
            <div key={room.id} className="border-2 border-black p-4 space-y-3">
              <div className="grid grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase mb-1">Room Name</label>
                  <input
                    type="text"
                    value={room.room_name}
                    onChange={(e) => {
                      const val = e.target.value;
                      setRooms(rooms.map((r) => (r.id === room.id ? { ...r, room_name: val } : r)));
                    }}
                    className="w-full border border-black p-2 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase mb-1">Room Code (Access Key)</label>
                  <input
                    type="text"
                    value={room.room_code}
                    onChange={(e) => {
                      const val = e.target.value;
                      setRooms(rooms.map((r) => (r.id === room.id ? { ...r, room_code: val } : r)));
                    }}
                    className="w-full border border-black p-2 text-sm uppercase font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase mb-1">Per Question Timer (Seconds)</label>
                  <input
                    type="number"
                    value={room.time_per_question}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      setRooms(
                        rooms.map((r) => (r.id === room.id ? { ...r, time_per_question: val } : r))
                      );
                    }}
                    className="w-full border border-black p-2 text-sm font-mono"
                  />
                </div>

                <div className="flex items-center space-x-2 pt-6">
                  <input
                    type="checkbox"
                    checked={room.is_active}
                    onChange={(e) => {
                      const val = e.target.checked;
                      setRooms(rooms.map((r) => (r.id === room.id ? { ...r, is_active: val } : r)));
                    }}
                    id={`active_${room.id}`}
                    className="w-4 h-4"
                  />
                  <label htmlFor={`active_${room.id}`} className="text-xs font-bold uppercase cursor-pointer">
                    Room Active for Joining
                  </label>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-3 border-t border-black">
                <button
                  type="button"
                  onClick={() => handleReset(room.id)}
                  className="border border-red-600 text-red-600 px-4 py-1 text-sm font-bold hover:bg-red-50 uppercase"
                >
                  Reset Room Data
                </button>
                <button
                  type="button"
                  onClick={() => handleUpdate(room)}
                  className="bg-black text-white px-6 py-1 text-sm font-bold uppercase hover:bg-gray-800"
                >
                  Save Settings
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
