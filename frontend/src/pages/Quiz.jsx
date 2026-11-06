import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import useProctoring from '../hooks/useProctoring';
import { getApiUrl } from '../config/api';
import { getRoomTheme } from '../config/theme';

export default function Quiz() {
  const { sessionToken } = useParams();
  const navigate = useNavigate();

  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [timeLeft, setTimeLeft] = useState(30);
  const [loading, setLoading] = useState(true);
  const [timePerQuestion, setTimePerQuestion] = useState(30);

  const roomIdentifier = localStorage.getItem('roomCode') || localStorage.getItem('roomName') || '';
  const theme = getRoomTheme(roomIdentifier);

  const selectedOptionRef = useRef(selectedOption);
  const currentIndexRef = useRef(currentIndex);
  const timeLeftRef = useRef(timeLeft);
  const questionsRef = useRef(questions);

  selectedOptionRef.current = selectedOption;
  currentIndexRef.current = currentIndex;
  timeLeftRef.current = timeLeft;
  questionsRef.current = questions;

  // Initialize Shuffled Questions
  useEffect(() => {
    fetch(getApiUrl(`/api/questions-init/${sessionToken}`))
      .then(async (res) => {
        if (!res.ok) {
          const err = await res.json();
          alert(err.error || 'Failed to initialize quiz session');
          navigate('/');
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (data && data.questions) {
          if (data.questions.length === 0) {
            alert('No questions configured in this assessment yet. Please notify the invigilator.');
            navigate('/');
            return;
          }
          setQuestions(data.questions);
          const customTimer = parseInt(localStorage.getItem('timePerQuestion') || '30', 10);
          setTimePerQuestion(customTimer);
          setTimeLeft(customTimer);
        }
        setLoading(false);
      })
      .catch((err) => {
        alert('Network connection error: ' + err.message);
        navigate('/');
      });
  }, [sessionToken, navigate]);

  // Hook anti-cheat violations
  useProctoring({
    sessionToken,
    currentQuestionIndex: currentIndex + 1,
    onViolationTriggered: (reason, candidateId) => {
      const cId = candidateId || localStorage.getItem('candidateId');
      navigate(`/result/${cId}?terminated=true&reason=${encodeURIComponent(reason)}`);
    }
  });

  // Save selection helper
  const saveAnswer = async (option) => {
    const currQ = questionsRef.current[currentIndexRef.current];
    if (!currQ) return;
    try {
      await fetch(getApiUrl('/api/answer'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionToken,
          questionId: currQ.id,
          selectedOption: option,
          timeTaken: timePerQuestion - timeLeftRef.current
        })
      });
    } catch (err) {
      console.error('Answer save failed:', err);
    }
  };

  // Final Assessment Submission
  const handleFinalSubmit = useCallback(async () => {
    await saveAnswer(selectedOptionRef.current);
    try {
      const res = await fetch(getApiUrl('/api/submit'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionToken })
      });
      const data = await res.json();
      const cId = data.candidateId || localStorage.getItem('candidateId');
      navigate(`/result/${cId}`);
    } catch (err) {
      console.error('Final submit failed:', err);
    }
  }, [sessionToken, navigate, timePerQuestion]);

  // Move to Next Question
  const handleNext = useCallback(async () => {
    await saveAnswer(selectedOptionRef.current);
    if (currentIndexRef.current < questionsRef.current.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedOption(null);
      setTimeLeft(timePerQuestion);
    } else {
      await handleFinalSubmit();
    }
  }, [handleFinalSubmit, timePerQuestion]);

  // Countdown timer decrement interval
  useEffect(() => {
    if (loading || questions.length === 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [currentIndex, loading, questions.length]);

  // Handle auto-advance when timer reaches 0
  useEffect(() => {
    if (loading || questions.length === 0) return;

    if (timeLeft === 0) {
      handleNext();
    }
  }, [timeLeft, loading, questions.length, handleNext]);

  if (loading) {
    return (
      <div className={`min-h-screen ${theme.bg} ${theme.textLight} flex items-center justify-center font-bold tracking-widest text-sm uppercase`}>
        Initializing Secure Assessment Environment...
      </div>
    );
  }

  const currentQ = questions[currentIndex];
  const isLast = currentIndex === questions.length - 1;

  if (!currentQ) {
    return (
      <div className={`min-h-screen ${theme.bg} ${theme.textLight} flex items-center justify-center font-bold`}>
        No active questions found.
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${theme.bg} ${theme.textLight} quiz-lock flex flex-col justify-between p-8 select-none`}>
      {/* Top Header: Progress and Timer */}
      <div className={`flex justify-between items-center ${theme.headerBg} p-4 rounded-xl shadow-lg border-b-2 ${theme.border}`}>
        <div>
          <span className={`text-lg font-extrabold ${theme.text}`}>
            Question {currentIndex + 1} of {questions.length}
          </span>
          <span className={`ml-4 text-xs font-bold uppercase px-3 py-1 rounded-full ${theme.badge}`}>
            {currentQ.marks || 1} {currentQ.marks === 1 ? 'Mark' : 'Marks'}
          </span>
        </div>

        <div className="flex items-center space-x-3">
          <span className="text-xs uppercase text-slate-400 font-bold tracking-wider">Timer:</span>
          <span
            className={`text-3xl font-mono font-extrabold ${
              timeLeft <= 5 ? 'text-red-500 animate-pulse' : theme.text
            }`}
          >
            00:{timeLeft < 10 ? `0${timeLeft}` : timeLeft}
          </span>
        </div>
      </div>

      {/* Main Question Interface */}
      <div className={`max-w-3xl w-full mx-auto my-auto py-8 ${theme.cardBg} border-2 ${theme.border} p-8 rounded-2xl shadow-2xl space-y-8`}>
        <h2 className="text-xl md:text-2xl font-bold leading-relaxed text-slate-100">
          {currentQ.question_text}
        </h2>

        <div className="space-y-4">
          {currentQ.options &&
            currentQ.options.map((opt) => {
              const isSelected = selectedOption === opt.key;
              const optionClass = isSelected
                ? theme.optionSelected || 'border-amber-500 bg-amber-500 text-slate-950 font-bold'
                : theme.optionDefault || 'border-slate-700 bg-slate-900/60 text-slate-200 hover:border-amber-500/50';

              return (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => setSelectedOption(opt.key)}
                  className={`w-full text-left p-4 rounded-xl border-2 font-medium text-base md:text-lg flex items-center space-x-4 transition-all ${optionClass}`}
                >
                  <span className={`font-bold border px-3 py-1 rounded-lg ${isSelected ? 'border-current' : 'border-slate-600'}`}>
                    {opt.key}
                  </span>
                  <span>{opt.text}</span>
                </button>
              );
            })}
        </div>
      </div>

      {/* Footer Navigation */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 pt-4 border-t border-slate-700/60">
        <span className="text-xs text-slate-400 font-medium">
          Strict Anti-Cheat Mode: Navigating backward is disabled. Exiting this window terminates the test.
        </span>

        {isLast ? (
          <button
            type="button"
            onClick={handleFinalSubmit}
            className={`${theme.buttonBg} px-8 py-3 rounded-xl uppercase tracking-wider transition-all`}
          >
            Submit Assessment
          </button>
        ) : (
          <button
            type="button"
            onClick={handleNext}
            className={`${theme.buttonBg} px-8 py-3 rounded-xl uppercase tracking-wider transition-all`}
          >
            Next Question
          </button>
        )}
      </div>
    </div>
  );
}
