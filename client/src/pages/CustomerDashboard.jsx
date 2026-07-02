import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client.js';
import Alert from '../components/Alert.jsx';
import { prettyDate } from '../utils/format.js';

export default function CustomerDashboard() {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get('/reservations/me');
      setReservations(res.data.reservations);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
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

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>My Reservations</h1>
          <p className="subtitle">View and manage your table bookings.</p>
        </div>
        <Link to="/reserve" className="btn">
          + New Reservation
        </Link>
      </div>

      <Alert type="success" message={notice} />
      <Alert message={error} />

      {loading ? (
        <div className="page-center">Loading…</div>
      ) : reservations.length === 0 ? (
        <div className="card center">
          <p className="muted">You have no reservations yet.</p>
          <Link to="/reserve" className="btn mt">
            Book a table
          </Link>
        </div>
      ) : (
        <div className="card table-wrap">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Time Slot</th>
                <th>Table</th>
                <th>Guests</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {reservations.map((r) => (
                <tr key={r._id}>
                  <td>{prettyDate(r.date)}</td>
                  <td>{r.timeSlot}</td>
                  <td>
                    {r.table?.name}{' '}
                    <span className="muted">({r.table?.capacity} seats)</span>
                  </td>
                  <td>{r.guests}</td>
                  <td>
                    <span className={`status status-${r.status}`}>{r.status}</span>
                  </td>
                  <td>
                    {r.status === 'confirmed' && (
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => cancel(r._id)}
                      >
                        Cancel
                      </button>
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
