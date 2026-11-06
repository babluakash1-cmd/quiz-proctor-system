import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GENERAL_THEME } from '../config/theme';

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
      setError('Please enter a valid assessment access code');
    }
  };

  return (
    <div className={`min-h-screen ${GENERAL_THEME.bg} text-slate-100 flex flex-col justify-between p-6`}>
      <div className="flex justify-between items-center max-w-5xl w-full mx-auto">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 rounded-full bg-amber-400 animate-pulse"></div>
          <span className="text-xs font-bold uppercase tracking-widest text-amber-300">
            Secure Assessment Portal
          </span>
        </div>
        <button
          onClick={() => navigate('/admin/login')}
          className="border border-amber-500/60 text-amber-400 px-4 py-1.5 rounded-lg text-sm font-semibold hover:bg-amber-500/10 transition-colors shadow-sm"
        >
          Admin Portal
        </button>
      </div>

      <div className="max-w-md w-full mx-auto text-center space-y-6">
        <div className="space-y-3">
          <div className="inline-block p-4 rounded-2xl bg-gradient-to-br from-amber-500/20 to-blue-900/40 border border-amber-500/40 shadow-xl">
            <svg className="w-10 h-10 text-amber-400 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-yellow-500 uppercase">
            ECE Assessment Portal
          </h1>
          <p className="text-xs text-slate-400 uppercase tracking-widest">
            Strict Multi-Vector Proctoring & Live Ranking
          </p>
        </div>

        <div className={`${GENERAL_THEME.cardBg} border-2 ${GENERAL_THEME.border} p-8 rounded-2xl shadow-2xl space-y-6`}>
          <form onSubmit={handleJoin} className="space-y-4">
            <div>
              <label className="block text-xs uppercase font-extrabold text-amber-300 mb-2 text-left tracking-wide">
                Candidate Assessment Access Code
              </label>
              <input
                type="text"
                placeholder="ENTER ACCESS CODE"
                value={roomCode}
                onChange={(e) => {
                  setRoomCode(e.target.value);
                  setError('');
                }}
                className={`w-full text-center tracking-widest text-lg ${GENERAL_THEME.inputBg} p-3.5 rounded-xl outline-none uppercase font-mono font-extrabold border-2 focus:border-amber-400 transition-colors`}
                autoFocus
              />
            </div>
            {error && <p className="text-red-400 text-xs font-semibold">{error}</p>}
            <button
              type="submit"
              className={`w-full ${GENERAL_THEME.buttonBg} py-3.5 rounded-xl uppercase tracking-wider font-extrabold transition-all transform hover:-translate-y-0.5`}
            >
              Verify & Proceed
            </button>
          </form>

          <div className="pt-4 border-t border-slate-700/60 text-center">
            <p className="text-xs text-slate-400">
              Please enter the confidential access code issued by your exam invigilator.
            </p>
          </div>
        </div>
      </div>

      <div className="text-center text-xs text-slate-500 uppercase tracking-widest">
        Strict Proctoring System Active • Blue & Gold Interface
      </div>
    </div>
  );
}
