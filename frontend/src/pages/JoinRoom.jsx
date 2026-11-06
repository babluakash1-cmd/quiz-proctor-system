import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getApiUrl } from '../config/api';
import { getRoomTheme } from '../config/theme';

export default function JoinRoom() {
  const { roomCode } = useParams();
  const [name, setName] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const theme = getRoomTheme(roomCode);

  const handleOpenModal = (e) => {
    e.preventDefault();
    const regex = /^[A-Za-z\s.]{2,50}$/;
    if (!regex.test(name.trim())) {
      setError('Name must be 2-50 characters containing letters, spaces, or dots only.');
      return;
    }
    setError('');
    setShowModal(true);
  };

  const handleStartExam = async () => {
    setIsSubmitting(true);
    try {
      if (document.documentElement.requestFullscreen) {
        try {
          await document.documentElement.requestFullscreen();
        } catch (fsErr) {
          console.warn('Fullscreen permission requested:', fsErr);
        }
      }

      const res = await fetch(getApiUrl('/api/join'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomCode, name: name.trim() })
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Failed to join assessment');
        setIsSubmitting(false);
        return;
      }

      localStorage.setItem('candidateId', data.candidateId);
      localStorage.setItem('roomCode', roomCode);
      localStorage.setItem('roomName', data.roomName || roomCode);
      localStorage.setItem('timePerQuestion', data.timePerQuestion || 30);
      navigate(`/quiz/${data.sessionToken}`);
    } catch (err) {
      alert('Error entering exam mode: ' + err.message);
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`min-h-screen ${theme.bg} ${theme.textLight} flex items-center justify-center p-6`}>
      <div className={`max-w-md w-full ${theme.cardBg} border-2 ${theme.border} rounded-2xl p-8 shadow-2xl space-y-6`}>
        <div className="flex justify-between items-center border-b border-slate-700/60 pb-3">
          <h2 className={`text-lg font-extrabold uppercase tracking-tight ${theme.text}`}>Candidate Registration</h2>
          <button
            onClick={() => navigate('/')}
            className="text-xs text-slate-400 hover:underline"
          >
            Change Code
          </button>
        </div>

        <div className="flex items-center justify-between p-3 rounded-xl bg-black/40 border border-slate-700/50">
          <span className="text-xs uppercase font-extrabold text-slate-400">Access Status:</span>
          <span className={`font-mono font-extrabold ${theme.text} tracking-wider text-xs uppercase px-2 py-0.5 rounded bg-black/50 border border-current`}>
            Authorized Session
          </span>
        </div>

        <form onSubmit={handleOpenModal} className="space-y-4">
          <div>
            <label className={`block text-xs uppercase font-extrabold mb-2 ${theme.text}`}>Enter Your Full Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={`w-full ${theme.inputBg} p-3 rounded-xl outline-none font-medium border-2`}
              placeholder="e.g. John Doe"
            />
          </div>

          {error && <p className="text-red-400 text-xs font-semibold">{error}</p>}

          <button
            type="submit"
            className={`w-full ${theme.buttonBg} py-3.5 rounded-xl uppercase tracking-wider font-extrabold transition-all transform hover:-translate-y-0.5`}
          >
            Continue
          </button>
        </form>
      </div>

      {/* Warning Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className={`${theme.cardBg} max-w-lg w-full p-6 border-2 ${theme.border} rounded-2xl shadow-2xl space-y-4 text-slate-100`}>
            <h3 className="text-red-500 font-extrabold uppercase tracking-wide flex items-center space-x-2">
              <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>Warning: Anti-Cheat System Active</span>
            </h3>
            <p className="text-sm leading-relaxed text-slate-300">
              This assessment is strictly proctored in real-time. Switching tabs, taking screenshots,
              exiting fullscreen mode, or opening another application will automatically terminate and
              disqualify your test.
            </p>
            <ul className="text-xs list-disc pl-5 space-y-1.5 text-slate-400">
              <li>No backward navigation is allowed once a question is answered.</li>
              <li>Each question has an independent non-pausing countdown timer.</li>
              <li>Right-click, copy, cut, paste, and DevTools shortcuts are blocked.</li>
              <li>Continuous heartbeat audit monitors session status.</li>
            </ul>
            <div className="pt-4 flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                disabled={isSubmitting}
                className="border border-slate-600 px-4 py-2 text-sm rounded-lg text-slate-300 hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleStartExam}
                disabled={isSubmitting}
                className="bg-red-600 text-white font-bold px-4 py-2 text-sm rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {isSubmitting ? 'Starting Exam...' : 'I Understand — Start Quiz'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
