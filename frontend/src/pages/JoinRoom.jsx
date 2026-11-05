import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getApiUrl } from '../config/api';

export default function JoinRoom() {
  const { roomCode } = useParams();
  const [name, setName] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

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
      // 1. Enter Fullscreen
      if (document.documentElement.requestFullscreen) {
        try {
          await document.documentElement.requestFullscreen();
        } catch (fsErr) {
          console.warn('Fullscreen permission requested:', fsErr);
        }
      }

      // 2. Request candidate session
      const res = await fetch(getApiUrl('/api/join'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomCode, name: name.trim() })
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Failed to join room');
        setIsSubmitting(false);
        return;
      }

      localStorage.setItem('candidateId', data.candidateId);
      localStorage.setItem('timePerQuestion', data.timePerQuestion || 30);
      navigate(`/quiz/${data.sessionToken}`);
    } catch (err) {
      alert('Error entering exam mode: ' + err.message);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-6">
      <div className="max-w-md w-full border border-black p-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold uppercase">Candidate Registration</h2>
          <button
            onClick={() => navigate('/')}
            className="text-xs text-gray-500 hover:text-black underline"
          >
            Change Room
          </button>
        </div>

        <p className="text-sm text-gray-600 mb-6">
          Assigned Room Code: <span className="font-mono font-semibold text-black">{roomCode}</span>
        </p>

        <form onSubmit={handleOpenModal} className="space-y-4">
          <div>
            <label className="block text-xs uppercase font-bold mb-1">Enter Your Full Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-black p-2 outline-none font-medium"
              placeholder="e.g. John Doe"
            />
          </div>

          {error && <p className="text-red-600 text-xs font-semibold">{error}</p>}

          <button
            type="submit"
            className="w-full bg-black text-white py-2 font-medium hover:bg-gray-800 uppercase tracking-wide"
          >
            Continue
          </button>
        </form>
      </div>

      {/* Mandatory Warning Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white max-w-lg w-full p-6 border-2 border-black space-y-4">
            <h3 className="text-red-600 font-bold uppercase tracking-wide">
              Warning: Strict Anti-Cheat Active
            </h3>
            <p className="text-sm leading-relaxed text-gray-800">
              This assessment is strictly proctored in real-time. Switching tabs, taking screenshots,
              exiting fullscreen mode, or opening another application will automatically terminate and
              disqualify your test immediately.
            </p>
            <ul className="text-xs list-disc pl-5 space-y-1 text-gray-600">
              <li>No backward navigation is allowed once a question is answered.</li>
              <li>Each question has an independent non-pausing countdown timer.</li>
              <li>Right-click, copy, cut, paste, and text highlighting are hard-blocked.</li>
              <li>Heartbeat audit tracks active tab status continuously.</li>
            </ul>
            <div className="pt-4 flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                disabled={isSubmitting}
                className="border border-black px-4 py-2 text-sm"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleStartExam}
                disabled={isSubmitting}
                className="bg-red-600 text-white font-bold px-4 py-2 text-sm hover:bg-red-700 disabled:opacity-50"
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
