import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Landing() {
  const [roomCode, setRoomCode] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleJoin = (e) => {
    e.preventDefault();
    const formatted = roomCode.trim().toUpperCase();
    if (formatted.length >= 2) {
      navigate(`/join/${formatted}`);
    } else {
      setError('Please enter a valid room code (e.g. ECE-R1, ECE-R2)');
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col justify-between p-6">
      <div className="flex justify-end">
        <button
          onClick={() => navigate('/admin/login')}
          className="border border-black px-4 py-1 text-sm font-medium hover:bg-gray-100 transition-colors"
        >
          Admin Login
        </button>
      </div>

      <div className="max-w-md w-full mx-auto text-center">
        <h1 className="text-xl font-bold tracking-tight mb-8 uppercase">
          ECE Assessment Portal
        </h1>
        <form onSubmit={handleJoin} className="space-y-4">
          <div>
            <input
              type="text"
              placeholder="ENTER ROOM ACCESS CODE"
              value={roomCode}
              onChange={(e) => {
                setRoomCode(e.target.value);
                setError('');
              }}
              className="w-full text-center tracking-widest text-lg border-2 border-black p-3 outline-none uppercase font-mono"
            />
          </div>
          {error && <p className="text-red-600 text-sm font-semibold">{error}</p>}
          <button
            type="submit"
            className="w-full bg-black text-white font-medium py-3 hover:bg-gray-800 transition-none uppercase"
          >
            Proceed to Registration
          </button>
        </form>

        <div className="mt-8 border border-gray-200 p-4 text-left text-xs text-gray-600 space-y-1">
          <p className="font-bold text-gray-800">Quick Test Room Codes:</p>
          <p>• <span className="font-mono font-bold">ECE-R1</span> - Room 1 (Core Electronics)</p>
          <p>• <span className="font-mono font-bold">ECE-R2</span> - Room 2 (Communication Systems)</p>
        </div>
      </div>

      <div className="text-center text-xs text-gray-400 uppercase tracking-widest">
        Strict Proctoring System Active • Firebase RTDB Synchronized
      </div>
    </div>
  );
}
