import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import useProctoring from '../hooks/useProctoring';
import { getApiUrl } from '../config/api';

export default function Quiz() {
  const { sessionToken } = useParams();
  const navigate = useNavigate();

  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [timeLeft, setTimeLeft] = useState(30);
  const [loading, setLoading] = useState(true);
  const [timePerQuestion, setTimePerQuestion] = useState(30);

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
            alert('No questions configured in this room yet. Please contact the administrator.');
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

  // Countdown timer per individual question
  useEffect(() => {
    if (loading || questions.length === 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          // Timer reached 0 -> Auto advance
          handleNext();
          return timePerQuestion;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [currentIndex, loading, questions.length, handleNext, timePerQuestion]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center font-bold tracking-widest text-sm uppercase">
        Initializing Secure Exam Environment...
      </div>
    );
  }

  const currentQ = questions[currentIndex];
  const isLast = currentIndex === questions.length - 1;

  if (!currentQ) {
    return (
      <div className="min-h-screen flex items-center justify-center font-bold">
        No active questions found.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white quiz-lock flex flex-col justify-between p-8 select-none">
      {/* Top Header: Progress and Timer */}
      <div className="flex justify-between items-center border-b border-black pb-4">
        <div>
          <span className="text-lg font-bold">
            Question {currentIndex + 1} of {questions.length}
          </span>
          <span className="ml-4 text-xs font-semibold uppercase px-2 py-0.5 bg-gray-100 border border-black">
            {currentQ.marks || 1} {currentQ.marks === 1 ? 'Mark' : 'Marks'}
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-xs uppercase text-gray-500 font-bold">Timer:</span>
          <span
            className={`text-3xl font-mono font-bold ${
              timeLeft <= 5 ? 'text-red-600 animate-pulse' : 'text-black'
            }`}
          >
            00:{timeLeft < 10 ? `0${timeLeft}` : timeLeft}
          </span>
        </div>
      </div>

      {/* Main Question Interface */}
      <div className="max-w-3xl w-full mx-auto my-auto py-8">
        <h2 className="text-2xl font-bold leading-relaxed mb-8">
          {currentQ.question_text}
        </h2>

        <div className="space-y-4">
          {currentQ.options &&
            currentQ.options.map((opt) => (
              <button
                key={opt.key}
                type="button"
                onClick={() => setSelectedOption(opt.key)}
                className={`w-full text-left p-4 border-2 font-medium text-lg flex items-center space-x-4 transition-none ${
                  selectedOption === opt.key
                    ? 'border-black bg-black text-white'
                    : 'border-black hover:bg-gray-100 text-black'
                }`}
              >
                <span
                  className={`font-bold border px-2 py-0.5 ${
                    selectedOption === opt.key ? 'border-white' : 'border-black'
                  }`}
                >
                  {opt.key}
                </span>
                <span>{opt.text}</span>
              </button>
            ))}
        </div>
      </div>

      {/* Footer Navigation: No Previous Button Allowed */}
      <div className="flex justify-between items-center pt-4 border-t border-black">
        <span className="text-xs text-gray-500 font-medium">
          Strict Mode: Navigating backward is disabled. Leaving this window terminates the test.
        </span>

        {isLast ? (
          <button
            type="button"
            onClick={handleFinalSubmit}
            className="bg-black text-white font-bold px-8 py-3 uppercase hover:bg-gray-800 transition-colors"
          >
            Submit Quiz
          </button>
        ) : (
          <button
            type="button"
            onClick={handleNext}
            className="bg-black text-white font-bold px-8 py-3 uppercase hover:bg-gray-800 transition-colors"
          >
            Next Question
          </button>
        )}
      </div>
    </div>
  );
}
