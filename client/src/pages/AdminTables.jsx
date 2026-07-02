import { useEffect, useState } from 'react';
import api from '../api/client.js';
import Alert from '../components/Alert.jsx';

const EMPTY = { name: '', capacity: 2, location: '' };

export default function AdminTables() {
  const [tables, setTables] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [details, setDetails] = useState(null);
  const [notice, setNotice] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get('/tables');
      setTables(res.data.tables);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const create = async (e) => {
    e.preventDefault();
    setError('');
    setDetails(null);
    setNotice('');
    try {
      await api.post('/tables', {
        name: form.name,
        capacity: Number(form.capacity),
        location: form.location || undefined,
      });
      setNotice(`Table ${form.name} added.`);
      setForm(EMPTY);
      load();
    } catch (err) {
      setError(err.message);
      setDetails(err.details);
    }
  };

  const toggleActive = async (t) => {
    setError('');
    try {
      await api.patch(`/tables/${t._id}`, { isActive: !t.isActive });
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const remove = async (t) => {
    if (!window.confirm(`Delete table ${t.name}? This cannot be undone.`)) return;
    setError('');
    setNotice('');
    try {
      await api.delete(`/tables/${t._id}`);
      setNotice(`Table ${t.name} deleted.`);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="admin-shell">
      <div className="page-header">
        <div>
          <h1>Admin · Manage Tables</h1>
          <p className="subtitle">Add, deactivate, or remove restaurant tables.</p>
        </div>
      </div>

      <Alert type="success" message={notice} />
      <Alert message={error} details={details} />

      <div className="card">
        <h3 style={{ marginTop: 0 }}>Add a table</h3>
        <form onSubmit={create}>
          <div className="form-row">
            <div className="field">
              <label>Name</label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. T9"
                required
              />
            </div>
            <div className="field">
              <label>Capacity</label>
              <input
                type="number"
                min={1}
                value={form.capacity}
                onChange={(e) => setForm({ ...form, capacity: e.target.value })}
                required
              />
            </div>
            <div className="field">
              <label>Location</label>
              <input
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                placeholder="e.g. Patio"
              />
            </div>
          </div>
          <button className="btn btn-admin" type="submit">
            Add table
          </button>
        </form>
      </div>

      {loading ? (
        <div className="page-center">Loading…</div>
      ) : (
        <div className="card table-wrap">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Capacity</th>
                <th>Location</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {tables.map((t) => (
                <tr key={t._id}>
                  <td>{t.name}</td>
                  <td>{t.capacity}</td>
                  <td>{t.location}</td>
                  <td>
                    <span className={`status status-${t.isActive ? 'confirmed' : 'cancelled'}`}>
                      {t.isActive ? 'active' : 'inactive'}
                    </span>
                  </td>
                  <td style={{ whiteSpace: 'nowrap' }}>
                    <button className="btn btn-admin btn-sm" onClick={() => toggleActive(t)}>
                      {t.isActive ? 'Deactivate' : 'Activate'}
                    </button>{' '}
                    <button className="btn btn-danger btn-sm" onClick={() => remove(t)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
