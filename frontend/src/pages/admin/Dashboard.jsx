import React, { useEffect, useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { getApiUrl } from '../../config/api';

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { token, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    fetch(getApiUrl('/api/admin/dashboard'), {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then((res) => {
        if (res.status === 401 || res.status === 403) {
          logout();
          navigate('/admin/login');
          return null;
        }
        return res.json();
      })
      .then((d) => {
        if (d) setData(d);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [token, logout, navigate]);

  return (
    <div className="min-h-screen bg-white p-6 space-y-6">
      <div className="flex justify-between items-center border-b border-black pb-4">
        <div>
          <h1 className="text-xl font-bold uppercase tracking-tight">Admin Console</h1>
          <p className="text-xs text-gray-500 uppercase mt-0.5">Firebase Realtime Proctor Engine</p>
        </div>
        <div className="flex items-center space-x-6">
          <Link to="/admin/questions" className="text-sm font-semibold hover:underline">
            Questions
          </Link>
          <Link to="/admin/rooms" className="text-sm font-semibold hover:underline">
            Rooms
          </Link>
          <Link to="/admin/monitor" className="text-sm font-semibold hover:underline">
            Live Monitor
          </Link>
          <Link to="/admin/ranks" className="text-sm font-semibold hover:underline">
            Rankings
          </Link>
          <button
            onClick={() => {
              logout();
              navigate('/admin/login');
            }}
            className="text-sm font-semibold text-red-600 hover:underline"
          >
            Logout
          </button>
        </div>
      </div>

      {loading ? (
        <div className="p-8 text-center text-sm font-bold uppercase">Loading overview statistics...</div>
      ) : data ? (
        <>
          <div className="grid grid-cols-5 gap-4">
            <div className="border border-black p-4">
              <span className="text-xs uppercase text-gray-500 font-bold">Total Candidates</span>
              <p className="text-3xl font-bold mt-1 font-mono">{data.stats.total_candidates}</p>
            </div>
            <div className="border border-black p-4">
              <span className="text-xs uppercase text-gray-500 font-bold">Submitted</span>
              <p className="text-3xl font-bold mt-1 font-mono text-green-700">{data.stats.total_submitted}</p>
            </div>
            <div className="border border-black p-4">
              <span className="text-xs uppercase text-gray-500 font-bold">Disqualified</span>
              <p className="text-3xl font-bold mt-1 font-mono text-red-600">{data.stats.total_disqualified}</p>
            </div>
            <div className="border border-black p-4">
              <span className="text-xs uppercase text-gray-500 font-bold">Total Violations</span>
              <p className="text-3xl font-bold mt-1 font-mono text-red-600">{data.stats.total_violations}</p>
            </div>
            <div className="border border-black p-4">
              <span className="text-xs uppercase text-gray-500 font-bold">Avg. Score</span>
              <p className="text-3xl font-bold mt-1 font-mono">{data.stats.average_score}</p>
            </div>
          </div>

          <div>
            <h2 className="text-md font-bold uppercase mb-3">Room Candidate Counts</h2>
            <table className="w-full border border-black text-left text-sm">
              <thead className="bg-gray-100 border-b border-black">
                <tr>
                  <th className="p-3 border-r border-black">Room Name</th>
                  <th className="p-3 border-r border-black w-36">Code</th>
                  <th className="p-3 w-48">Candidates Registered</th>
                </tr>
              </thead>
              <tbody>
                {data.roomBreakdown.map((r) => (
                  <tr key={r.id} className="border-b border-black">
                    <td className="p-3 border-r border-black font-semibold">{r.room_name}</td>
                    <td className="p-3 border-r border-black font-mono">{r.room_code}</td>
                    <td className="p-3 font-mono font-bold">{r.candidate_count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <div className="p-8 text-center text-red-600">Failed to load dashboard data.</div>
      )}
    </div>
  );
}
