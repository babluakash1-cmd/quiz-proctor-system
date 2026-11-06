import React, { useEffect, useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { getApiUrl } from '../../config/api';
import { GENERAL_THEME } from '../../config/theme';

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
    <div className={`min-h-screen ${GENERAL_THEME.bg} text-slate-100 p-6 space-y-6`}>
      <div className={`flex justify-between items-center ${GENERAL_THEME.headerBg} p-4 rounded-xl shadow-lg border-b-2 ${GENERAL_THEME.border}`}>
        <div>
          <h1 className={`text-xl font-extrabold uppercase tracking-tight ${GENERAL_THEME.text}`}>Admin Console</h1>
          <p className="text-xs text-slate-400 uppercase mt-0.5">Firebase Realtime Proctor Engine</p>
        </div>
        <div className="flex items-center space-x-6">
          <Link to="/admin/questions" className="text-sm font-bold text-amber-300 hover:text-amber-400 hover:underline">
            Questions
          </Link>
          <Link to="/admin/rooms" className="text-sm font-bold text-amber-300 hover:text-amber-400 hover:underline">
            Rooms
          </Link>
          <Link to="/admin/monitor" className="text-sm font-bold text-amber-300 hover:text-amber-400 hover:underline">
            Live Monitor
          </Link>
          <Link to="/admin/ranks" className="text-sm font-bold text-amber-300 hover:text-amber-400 hover:underline">
            Rankings
          </Link>
          <button
            onClick={() => {
              logout();
              navigate('/admin/login');
            }}
            className="text-sm font-bold text-red-400 hover:underline"
          >
            Logout
          </button>
        </div>
      </div>

      {loading ? (
        <div className="p-8 text-center text-sm font-bold uppercase text-slate-400">Loading overview statistics...</div>
      ) : data ? (
        <>
          <div className="grid grid-cols-5 gap-4">
            <div className={`${GENERAL_THEME.cardBg} border-2 ${GENERAL_THEME.border} p-4 rounded-xl shadow-lg`}>
              <span className="text-xs uppercase text-slate-400 font-bold">Total Candidates</span>
              <p className={`text-3xl font-mono font-extrabold mt-1 ${GENERAL_THEME.text}`}>{data.stats.total_candidates}</p>
            </div>
            <div className={`${GENERAL_THEME.cardBg} border-2 ${GENERAL_THEME.border} p-4 rounded-xl shadow-lg`}>
              <span className="text-xs uppercase text-slate-400 font-bold">Submitted</span>
              <p className="text-3xl font-mono font-extrabold mt-1 text-emerald-400">{data.stats.total_submitted}</p>
            </div>
            <div className={`${GENERAL_THEME.cardBg} border-2 ${GENERAL_THEME.border} p-4 rounded-xl shadow-lg`}>
              <span className="text-xs uppercase text-slate-400 font-bold">Disqualified</span>
              <p className="text-3xl font-mono font-extrabold mt-1 text-red-400">{data.stats.total_disqualified}</p>
            </div>
            <div className={`${GENERAL_THEME.cardBg} border-2 ${GENERAL_THEME.border} p-4 rounded-xl shadow-lg`}>
              <span className="text-xs uppercase text-slate-400 font-bold">Total Violations</span>
              <p className="text-3xl font-mono font-extrabold mt-1 text-red-400">{data.stats.total_violations}</p>
            </div>
            <div className={`${GENERAL_THEME.cardBg} border-2 ${GENERAL_THEME.border} p-4 rounded-xl shadow-lg`}>
              <span className="text-xs uppercase text-slate-400 font-bold">Avg. Score</span>
              <p className={`text-3xl font-mono font-extrabold mt-1 ${GENERAL_THEME.text}`}>{data.stats.average_score}</p>
            </div>
          </div>

          <div className={`${GENERAL_THEME.cardBg} border-2 ${GENERAL_THEME.border} p-6 rounded-2xl shadow-xl space-y-4`}>
            <h2 className={`text-md font-extrabold uppercase ${GENERAL_THEME.text}`}>Room Candidate Overview</h2>
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-700 text-xs uppercase font-bold text-slate-400">
                  <th className="p-3">Room Name</th>
                  <th className="p-3 w-44">Access Code</th>
                  <th className="p-3 w-48 text-right">Candidates Registered</th>
                </tr>
              </thead>
              <tbody>
                {data.roomBreakdown.map((r) => (
                  <tr key={r.id} className="border-b border-slate-800 text-sm font-medium hover:bg-slate-900/40">
                    <td className="p-3 font-semibold text-slate-200">{r.room_name}</td>
                    <td className="p-3 font-mono text-amber-400 font-bold">{r.room_code}</td>
                    <td className="p-3 font-mono font-extrabold text-right text-emerald-400">{r.candidate_count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <div className="p-8 text-center text-red-400 font-bold">Failed to load dashboard data.</div>
      )}
    </div>
  );
}
