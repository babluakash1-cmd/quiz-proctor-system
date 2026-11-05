import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { getApiUrl } from '../../config/api';

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
    <div className="min-h-screen bg-white p-6 space-y-6">
      <div className="flex justify-between items-center border-b border-black pb-4">
        <div>
          <h1 className="text-xl font-bold uppercase tracking-tight">Question Bank & CSV Import</h1>
          <p className="text-xs text-gray-500 uppercase mt-0.5">Firebase Realtime Database Question Bank</p>
        </div>
        <div className="space-x-4">
          <Link to="/admin/dashboard" className="text-sm font-semibold hover:underline">
            Dashboard
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
        </div>
      </div>

      {/* CSV Bulk Upload */}
      <div className="border border-black p-4 space-y-2">
        <h2 className="font-bold text-sm uppercase">Import Questions from CSV</h2>
        <p className="text-xs text-gray-500">
          Required Headers: <code className="font-mono bg-gray-100 px-1 font-bold">room_id, question_text, option_a, option_b, option_c, option_d, correct_option, marks</code>
        </p>
        <form onSubmit={handleCSVUpload} className="flex items-center space-x-2">
          <input
            type="file"
            accept=".csv"
            onChange={(e) => setFile(e.target.files[0])}
            className="border border-black p-1 text-sm"
          />
          <button
            type="submit"
            disabled={!file}
            className="bg-black text-white px-4 py-1 text-sm font-semibold hover:bg-gray-800 disabled:opacity-50"
          >
            Upload CSV
          </button>
        </form>
        {uploadStatus && <p className="text-xs font-semibold text-blue-600">{uploadStatus}</p>}
      </div>

      {/* Single Add Form */}
      <form onSubmit={handleCreate} className="border border-black p-4 space-y-3">
        <h2 className="font-bold text-sm uppercase">Add Single Question</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs uppercase font-bold mb-1">Target Room</label>
            <select
              value={form.room_id}
              onChange={(e) => setForm({ ...form, room_id: e.target.value })}
              className="w-full border border-black p-2 text-sm"
            >
              {rooms.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.room_name} ({r.room_code})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs uppercase font-bold mb-1">Marks</label>
            <input
              type="number"
              placeholder="Marks (e.g. 1)"
              value={form.marks}
              onChange={(e) => setForm({ ...form, marks: e.target.value })}
              className="w-full border border-black p-2 text-sm"
              required
            />
          </div>
        </div>

        <textarea
          placeholder="Enter question prompt..."
          value={form.question_text}
          onChange={(e) => setForm({ ...form, question_text: e.target.value })}
          className="w-full border border-black p-2 text-sm outline-none"
          rows={3}
          required
        />

        <div className="grid grid-cols-2 gap-2">
          <input
            placeholder="Option A"
            value={form.option_a}
            onChange={(e) => setForm({ ...form, option_a: e.target.value })}
            className="border border-black p-2 text-sm"
            required
          />
          <input
            placeholder="Option B"
            value={form.option_b}
            onChange={(e) => setForm({ ...form, option_b: e.target.value })}
            className="border border-black p-2 text-sm"
            required
          />
          <input
            placeholder="Option C"
            value={form.option_c}
            onChange={(e) => setForm({ ...form, option_c: e.target.value })}
            className="border border-black p-2 text-sm"
            required
          />
          <input
            placeholder="Option D"
            value={form.option_d}
            onChange={(e) => setForm({ ...form, option_d: e.target.value })}
            className="border border-black p-2 text-sm"
            required
          />
        </div>

        <div className="flex items-center space-x-3 pt-2">
          <label className="text-xs font-bold uppercase">Correct Option:</label>
          <select
            value={form.correct_option}
            onChange={(e) => setForm({ ...form, correct_option: e.target.value })}
            className="border border-black p-2 text-sm font-bold"
          >
            <option value="A">A</option>
            <option value="B">B</option>
            <option value="C">C</option>
            <option value="D">D</option>
          </select>

          <button
            type="submit"
            className="bg-black text-white px-6 py-2 font-bold text-sm uppercase hover:bg-gray-800 ml-auto"
          >
            Save Question
          </button>
        </div>
      </form>

      {/* Listing */}
      <div>
        <h2 className="font-bold text-sm uppercase mb-2">Active Questions ({questions.length})</h2>
        <table className="w-full border border-black text-left text-sm">
          <thead className="bg-gray-100 border-b border-black">
            <tr>
              <th className="p-2 border-r border-black w-40">Room</th>
              <th className="p-2 border-r border-black">Question Prompt</th>
              <th className="p-2 border-r border-black w-24">Correct</th>
              <th className="p-2 border-r border-black w-20">Marks</th>
              <th className="p-2 w-20">Action</th>
            </tr>
          </thead>
          <tbody>
            {questions.length === 0 ? (
              <tr>
                <td colSpan="5" className="p-4 text-center text-gray-500">
                  No questions found. Add questions above or upload a CSV.
                </td>
              </tr>
            ) : (
              questions.map((q) => (
                <tr key={q.id} className="border-b border-black">
                  <td className="p-2 border-r border-black font-medium">{q.room_name}</td>
                  <td className="p-2 border-r border-black">{q.question_text}</td>
                  <td className="p-2 border-r border-black font-bold font-mono text-center">
                    {q.correct_option}
                  </td>
                  <td className="p-2 border-r border-black font-mono text-center">{q.marks}</td>
                  <td className="p-2 text-center">
                    <button
                      onClick={() => handleDelete(q)}
                      className="text-red-600 font-bold hover:underline"
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
