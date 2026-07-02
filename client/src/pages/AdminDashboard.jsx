import { useEffect, useState, useCallback } from 'react';
import api from '../api/client.js';
import Alert from '../components/Alert.jsx';
import { prettyDate, todayISO } from '../utils/format.js';

export default function AdminDashboard() {
  const [reservations, setReservations] = useState([]);
  const [slots, setSlots] = useState([]);
  const [tables, setTables] = useState([]);
  const [filters, setFilters] = useState({ date: '', status: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [editing, setEditing] = useState(null); // reservation being edited

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (filters.date) params.date = filters.date;
      if (filters.status) params.status = filters.status;
      const res = await api.get('/reservations', { params });
      setReservations(res.data.reservations);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    // Slots and tables power the edit form.
    api.get('/reservations/slots').then((r) => setSlots(r.data.slots)).catch(() => {});
    api.get('/tables').then((r) => setTables(r.data.tables)).catch(() => {});
  }, []);

  const cancel = async (id) => {
    if (!window.confirm('Cancel this reservation?')) return;
    setError('');
    setNotice('');
    try {
      await api.delete(`/reservations/${id}`);
      setNotice('Reservation cancelled.');
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const saveEdit = async (e) => {
    e.preventDefault();
    setError('');
    setNotice('');
    try {
      await api.patch(`/reservations/${editing._id}`, {
        tableId: editing.tableId,
        date: editing.date,
        timeSlot: editing.timeSlot,
        guests: Number(editing.guests),
      });
      setNotice('Reservation updated.');
      setEditing(null);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const startEdit = (r) =>
    setEditing({
      _id: r._id,
      tableId: r.table?._id,
      date: r.date,
      timeSlot: r.timeSlot,
      guests: r.guests,
    });

  return (
    <div className="admin-shell">
      <div className="page-header">
        <div>
          <h1>Admin · All Reservations</h1>
          <p className="subtitle">Oversee, filter, update, and cancel any booking.</p>
        </div>
      </div>

      <Alert type="success" message={notice} />
      <Alert message={error} />

      <div className="card">
        <div className="form-row">
          <div className="field">
            <label>Filter by date</label>
            <input
              type="date"
              value={filters.date}
              onChange={(e) => setFilters({ ...filters, date: e.target.value })}
            />
          </div>
          <div className="field">
            <label>Status</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            >
              <option value="">All</option>
              <option value="confirmed">Confirmed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <div className="field" style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
            <button
              className="btn btn-admin"
              onClick={() => setFilters({ date: todayISO(), status: 'confirmed' })}
            >
              Today
            </button>
            <button className="btn btn-ghost" style={{ color: '#1d4e89', borderColor: '#1d4e89' }}
              onClick={() => setFilters({ date: '', status: '' })}>
              Clear
            </button>
          </div>
        </div>
      </div>

      {editing && (
        <div className="card">
          <h3 style={{ marginTop: 0 }}>Edit reservation</h3>
          <form onSubmit={saveEdit}>
            <div className="form-row">
              <div className="field">
                <label>Date</label>
                <input
                  type="date"
                  value={editing.date}
                  onChange={(e) => setEditing({ ...editing, date: e.target.value })}
                />
              </div>
              <div className="field">
                <label>Time Slot</label>
                <select
                  value={editing.timeSlot}
                  onChange={(e) => setEditing({ ...editing, timeSlot: e.target.value })}
                >
                  {slots.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label>Table</label>
                <select
                  value={editing.tableId}
                  onChange={(e) => setEditing({ ...editing, tableId: e.target.value })}
                >
                  {tables.map((t) => (
                    <option key={t._id} value={t._id}>
                      {t.name} ({t.capacity} seats)
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label>Guests</label>
                <input
                  type="number"
                  min={1}
                  value={editing.guests}
                  onChange={(e) => setEditing({ ...editing, guests: e.target.value })}
                />
              </div>
            </div>
            <button className="btn btn-admin" type="submit">
              Save changes
            </button>{' '}
            <button className="btn btn-ghost" style={{ color: '#333', borderColor: '#ccc' }}
              type="button" onClick={() => setEditing(null)}>
              Cancel
            </button>
          </form>
        </div>
      )}

      {loading ? (
        <div className="page-center">Loading…</div>
      ) : reservations.length === 0 ? (
        <div className="card center muted">No reservations match these filters.</div>
      ) : (
        <div className="card table-wrap">
          <table>
            <thead>
              <tr>
                <th>Customer</th>
                <th>Date</th>
                <th>Slot</th>
                <th>Table</th>
                <th>Guests</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {reservations.map((r) => (
                <tr key={r._id}>
                  <td>
                    {r.user?.name}
                    <div className="muted" style={{ fontSize: '0.78rem' }}>
                      {r.user?.email}
                    </div>
                  </td>
                  <td>{prettyDate(r.date)}</td>
                  <td>{r.timeSlot}</td>
                  <td>{r.table?.name}</td>
                  <td>{r.guests}</td>
                  <td>
                    <span className={`status status-${r.status}`}>{r.status}</span>
                  </td>
                  <td style={{ whiteSpace: 'nowrap' }}>
                    {r.status === 'confirmed' && (
                      <>
                        <button className="btn btn-admin btn-sm" onClick={() => startEdit(r)}>
                          Edit
                        </button>{' '}
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => cancel(r._id)}
                        >
                          Cancel
                        </button>
                      </>
                    )}
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
