import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { getApiUrl } from '../../config/api';

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
    <div className="min-h-screen bg-white flex items-center justify-center p-6">
      <div className="max-w-sm w-full border-2 border-black p-6 space-y-4">
        <div className="flex justify-between items-center border-b border-black pb-3">
          <h1 className="text-xl font-bold uppercase tracking-tight">Admin Authentication</h1>
          <Link to="/" className="text-xs font-semibold hover:underline">
            Home
          </Link>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-500 text-red-600 text-xs font-bold p-2">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs uppercase font-bold mb-1">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full border border-black p-2 outline-none font-medium"
              placeholder="admin1 or admin2"
              required
            />
          </div>

          <div>
            <label className="block text-xs uppercase font-bold mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-black p-2 outline-none font-medium"
              placeholder="••••••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-black text-white py-2 font-medium hover:bg-gray-800 uppercase tracking-wide disabled:opacity-50"
          >
            {loading ? 'Authenticating...' : 'Login'}
          </button>
        </form>

        <div className="border-t border-gray-200 pt-3 text-xs text-gray-500 space-y-1">
          <p className="font-bold text-gray-700">Default Admin Credentials:</p>
          <p>Username: <code className="font-mono bg-gray-100 px-1 font-bold">admin1</code> or <code className="font-mono bg-gray-100 px-1 font-bold">admin2</code></p>
          <p>Password: <code className="font-mono bg-gray-100 px-1 font-bold">adminpassword123</code></p>
        </div>
      </div>
    </div>
  );
}
