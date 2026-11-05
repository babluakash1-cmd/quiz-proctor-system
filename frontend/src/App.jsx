import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Landing from './pages/Landing';
import JoinRoom from './pages/JoinRoom';
import Quiz from './pages/Quiz';
import Result from './pages/Result';
import Login from './pages/admin/Login';
import Dashboard from './pages/admin/Dashboard';
import Questions from './pages/admin/Questions';
import Rooms from './pages/admin/Rooms';
import Monitor from './pages/admin/Monitor';
import Ranks from './pages/admin/Ranks';
import { AuthProvider } from './context/AuthContext';

function ProtectedRoute({ children }) {
  const token = localStorage.getItem('adminToken');
  return token ? children : <Navigate to="/admin/login" replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Candidate Assessment Flow */}
          <Route path="/" element={<Landing />} />
          <Route path="/join/:roomCode" element={<JoinRoom />} />
          <Route path="/quiz/:sessionToken" element={<Quiz />} />
          <Route path="/result/:candidateId" element={<Result />} />

          {/* Admin Backoffice Routes */}
          <Route path="/admin/login" element={<Login />} />
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/questions"
            element={
              <ProtectedRoute>
                <Questions />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/rooms"
            element={
              <ProtectedRoute>
                <Rooms />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/monitor"
            element={
              <ProtectedRoute>
                <Monitor />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/ranks"
            element={
              <ProtectedRoute>
                <Ranks />
              </ProtectedRoute>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
