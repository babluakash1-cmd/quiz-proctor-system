import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { getApiUrl } from '../../config/api';
import { GENERAL_THEME } from '../../config/theme';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch(getApiUrl('/api/admin/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login failed');

      login(data.token);
      navigate('/admin/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen ${GENERAL_THEME.bg} text-slate-100 flex items-center justify-center p-6`}>
      <div className={`max-w-sm w-full ${GENERAL_THEME.cardBg} border-2 ${GENERAL_THEME.border} p-6 rounded-2xl shadow-2xl space-y-4`}>
        <div className="flex justify-between items-center border-b border-slate-700/60 pb-3">
          <h1 className={`text-lg font-extrabold uppercase tracking-tight ${GENERAL_THEME.text}`}>Admin Authentication</h1>
          <Link to="/" className="text-xs text-slate-400 hover:underline">
            Home
          </Link>
        </div>

        {error && (
          <div className="bg-red-950/80 border border-red-500 text-red-300 text-xs font-bold p-3 rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs uppercase font-bold text-amber-300 mb-1">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className={`w-full ${GENERAL_THEME.inputBg} p-2.5 rounded outline-none font-medium text-sm border-2`}
              placeholder="admin1 or admin2"
              required
            />
          </div>

          <div>
            <label className="block text-xs uppercase font-bold text-amber-300 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`w-full ${GENERAL_THEME.inputBg} p-2.5 rounded outline-none font-medium text-sm border-2`}
              placeholder="••••••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full ${GENERAL_THEME.buttonBg} py-2.5 rounded uppercase tracking-wider text-sm transition-all disabled:opacity-50`}
          >
            {loading ? 'Authenticating...' : 'Login'}
          </button>
        </form>

        <div className="border-t border-slate-700/60 pt-3 text-xs text-slate-400 space-y-1">
          <p className="font-bold text-amber-400 uppercase">Default Admin Credentials:</p>
          <p>Username: <code className="font-mono bg-slate-900 text-amber-300 px-1.5 py-0.5 rounded font-bold border border-slate-700">admin1</code> or <code className="font-mono bg-slate-900 text-amber-300 px-1.5 py-0.5 rounded font-bold border border-slate-700">admin2</code></p>
          <p>Password: <code className="font-mono bg-slate-900 text-amber-300 px-1.5 py-0.5 rounded font-bold border border-slate-700">adminpassword123</code></p>
        </div>
      </div>
    </div>
  );
}
