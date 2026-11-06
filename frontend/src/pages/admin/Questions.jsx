import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { getApiUrl } from '../../config/api';
import { GENERAL_THEME } from '../../config/theme';

export default function Questions() {
  const [questions, setQuestions] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [form, setForm] = useState({
    room_id: 'room_1',
    question_text: '',
    option_a: '',
    option_b: '',
    option_c: '',
    option_d: '',
    correct_option: 'A',
    marks: 1
  });
  const [file, setFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState('');
  const { token } = useContext(AuthContext);

  const fetchRooms = () => {
    fetch(getApiUrl('/api/admin/rooms'), {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then((res) => res.json())
      .then((d) => {
        if (Array.isArray(d)) {
          setRooms(d);
          if (d.length > 0 && form.room_id === 'room_1') {
            setForm((prev) => ({ ...prev, room_id: d[0].id }));
          }
        }
      })
      .catch((err) => console.error(err));
  };

  const fetchQuestions = () => {
    fetch(getApiUrl('/api/admin/questions'), {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then((res) => res.json())
      .then((d) => {
        if (Array.isArray(d)) setQuestions(d);
      })
      .catch((err) => console.error(err));
  };

  useEffect(() => {
    fetchRooms();
    fetchQuestions();
  }, [token]);

  const handleCreate = async (e) => {
    e.preventDefault();
    await fetch(getApiUrl('/api/admin/questions'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(form)
    });
    setForm({
      ...form,
      question_text: '',
      option_a: '',
      option_b: '',
      option_c: '',
      option_d: '',
      correct_option: 'A',
      marks: 1
    });
    fetchQuestions();
  };

  const handleCSVUpload = async (e) => {
    e.preventDefault();
    if (!file) return;
    setUploadStatus('Uploading and parsing CSV...');
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch(getApiUrl('/api/admin/questions/upload-csv'), {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });
      const data = await res.json();
      setUploadStatus(data.message || 'CSV uploaded successfully');
      setFile(null);
      fetchQuestions();
    } catch (err) {
      setUploadStatus('Upload failed: ' + err.message);
    }
  };

  const handleDelete = async (q) => {
    if (!confirm('Are you sure you want to delete this question?')) return;
    const url = q.room_id
      ? getApiUrl(`/api/admin/questions/${q.room_id}/${q.id}`)
      : getApiUrl(`/api/admin/questions/${q.id}`);

    await fetch(url, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
    fetchQuestions();
  };

  return (
    <div className={`min-h-screen ${GENERAL_THEME.bg} text-slate-100 p-6 space-y-6`}>
      <div className={`flex justify-between items-center ${GENERAL_THEME.headerBg} p-4 rounded-xl shadow-lg border-b-2 ${GENERAL_THEME.border}`}>
        <div>
          <h1 className={`text-xl font-extrabold uppercase tracking-tight ${GENERAL_THEME.text}`}>Question Bank & Import</h1>
          <p className="text-xs text-slate-400 uppercase mt-0.5">Firebase Question Database</p>
        </div>
        <div className="space-x-4">
          <Link to="/admin/dashboard" className="text-sm font-bold text-amber-300 hover:text-amber-400 hover:underline">
            Dashboard
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
        </div>
      </div>

      {/* CSV Bulk Upload */}
      <div className={`${GENERAL_THEME.cardBg} border-2 ${GENERAL_THEME.border} p-5 rounded-2xl shadow-xl space-y-3`}>
        <h2 className={`font-extrabold text-sm uppercase ${GENERAL_THEME.text}`}>Import Questions from CSV</h2>
        <p className="text-xs text-slate-400">
          Required Headers: <code className="font-mono bg-slate-950 text-amber-300 px-1.5 py-0.5 rounded font-bold border border-slate-700">room_id, question_text, option_a, option_b, option_c, option_d, correct_option, marks</code>
        </p>
        <form onSubmit={handleCSVUpload} className="flex items-center space-x-3 pt-1">
          <input
            type="file"
            accept=".csv"
            onChange={(e) => setFile(e.target.files[0])}
            className="border border-slate-700 bg-slate-950 p-2 text-xs rounded text-slate-200"
          />
          <button
            type="submit"
            disabled={!file}
            className={`${GENERAL_THEME.buttonBg} px-5 py-2 text-xs rounded uppercase tracking-wider disabled:opacity-50`}
          >
            Upload CSV
          </button>
        </form>
        {uploadStatus && <p className="text-xs font-semibold text-emerald-400">{uploadStatus}</p>}
      </div>

      {/* Single Add Form */}
      <form onSubmit={handleCreate} className={`${GENERAL_THEME.cardBg} border-2 ${GENERAL_THEME.border} p-5 rounded-2xl shadow-xl space-y-4`}>
        <h2 className={`font-extrabold text-sm uppercase ${GENERAL_THEME.text}`}>Add Question</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs uppercase font-bold text-amber-300 mb-1">Target Room</label>
            <select
              value={form.room_id}
              onChange={(e) => setForm({ ...form, room_id: e.target.value })}
              className={`w-full ${GENERAL_THEME.inputBg} p-2.5 text-sm rounded border-2 font-semibold`}
            >
              {rooms.map((r) => (
                <option key={r.id} value={r.id} className="bg-slate-900 text-slate-100">
                  {r.room_name} ({r.room_code})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs uppercase font-bold text-amber-300 mb-1">Marks</label>
            <input
              type="number"
              placeholder="Marks (e.g. 1)"
              value={form.marks}
              onChange={(e) => setForm({ ...form, marks: e.target.value })}
              className={`w-full ${GENERAL_THEME.inputBg} p-2.5 text-sm rounded border-2 font-mono`}
              required
            />
          </div>
        </div>

        <textarea
          placeholder="Enter question prompt..."
          value={form.question_text}
          onChange={(e) => setForm({ ...form, question_text: e.target.value })}
          className={`w-full ${GENERAL_THEME.inputBg} p-3 text-sm rounded border-2 outline-none`}
          rows={3}
          required
        />

        <div className="grid grid-cols-2 gap-3">
          <input
            placeholder="Option A"
            value={form.option_a}
            onChange={(e) => setForm({ ...form, option_a: e.target.value })}
            className={`w-full ${GENERAL_THEME.inputBg} p-2.5 text-sm rounded border-2`}
            required
          />
          <input
            placeholder="Option B"
            value={form.option_b}
            onChange={(e) => setForm({ ...form, option_b: e.target.value })}
            className={`w-full ${GENERAL_THEME.inputBg} p-2.5 text-sm rounded border-2`}
            required
          />
          <input
            placeholder="Option C"
            value={form.option_c}
            onChange={(e) => setForm({ ...form, option_c: e.target.value })}
            className={`w-full ${GENERAL_THEME.inputBg} p-2.5 text-sm rounded border-2`}
            required
          />
          <input
            placeholder="Option D"
            value={form.option_d}
            onChange={(e) => setForm({ ...form, option_d: e.target.value })}
            className={`w-full ${GENERAL_THEME.inputBg} p-2.5 text-sm rounded border-2`}
            required
          />
        </div>

        <div className="flex items-center space-x-3 pt-2">
          <label className="text-xs font-bold uppercase text-amber-300">Correct Option:</label>
          <select
            value={form.correct_option}
            onChange={(e) => setForm({ ...form, correct_option: e.target.value })}
            className={`bg-slate-950 text-amber-400 p-2 text-sm rounded border-2 border-amber-500 font-bold`}
          >
            <option value="A">A</option>
            <option value="B">B</option>
            <option value="C">C</option>
            <option value="D">D</option>
          </select>

          <button
            type="submit"
            className={`${GENERAL_THEME.buttonBg} px-6 py-2.5 rounded text-sm uppercase tracking-wider ml-auto`}
          >
            Save Question
          </button>
        </div>
      </form>

      {/* Listing */}
      <div className={`${GENERAL_THEME.cardBg} border-2 ${GENERAL_THEME.border} p-5 rounded-2xl shadow-xl space-y-3`}>
        <h2 className={`font-extrabold text-sm uppercase ${GENERAL_THEME.text}`}>Active Questions ({questions.length})</h2>
        <table className="w-full text-left text-sm border-collapse">
          <thead>
            <tr className="border-b border-slate-700 text-xs uppercase font-bold text-slate-400">
              <th className="p-3 w-48">Room Name</th>
              <th className="p-3">Question Prompt</th>
              <th className="p-3 w-24 text-center">Correct</th>
              <th className="p-3 w-20 text-center">Marks</th>
              <th className="p-3 w-24 text-center">Action</th>
            </tr>
          </thead>
          <tbody>
            {questions.length === 0 ? (
              <tr>
                <td colSpan="5" className="p-4 text-center text-slate-400">
                  No questions found. Add questions above or upload a CSV.
                </td>
              </tr>
            ) : (
              questions.map((q) => (
                <tr key={q.id} className="border-b border-slate-800 hover:bg-slate-900/40">
                  <td className="p-3 font-semibold text-slate-200">{q.room_name}</td>
                  <td className="p-3 text-slate-300">{q.question_text}</td>
                  <td className="p-3 font-mono font-extrabold text-amber-400 text-center">
                    {q.correct_option}
                  </td>
                  <td className="p-3 font-mono text-center text-emerald-400 font-bold">{q.marks}</td>
                  <td className="p-3 text-center">
                    <button
                      onClick={() => handleDelete(q)}
                      className="text-red-400 font-bold hover:underline text-xs uppercase"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
