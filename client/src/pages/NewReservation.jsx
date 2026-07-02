import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client.js';
import Alert from '../components/Alert.jsx';
import { todayISO } from '../utils/format.js';

/**
 * Reservation flow:
 *  1. Pick date, time slot, and party size.
 *  2. "Check availability" queries the backend for tables that are free AND large
 *     enough for the party.
 *  3. Pick an available table and confirm.
 *
 * The backend re-validates everything on submit, so this UI is a convenience layer,
 * not the source of truth for availability.
 */
export default function NewReservation() {
  const navigate = useNavigate();
  const [slots, setSlots] = useState([]);
  const [form, setForm] = useState({ date: todayISO(), timeSlot: '', guests: 2 });
  const [tables, setTables] = useState(null); // null = not checked yet
  const [selectedTable, setSelectedTable] = useState(null);
  const [error, setError] = useState('');
  const [details, setDetails] = useState(null);
  const [checking, setChecking] = useState(false);
  const [booking, setBooking] = useState(false);

  useEffect(() => {
    api
      .get('/reservations/slots')
      .then((res) => {
        setSlots(res.data.slots);
        setForm((f) => ({ ...f, timeSlot: res.data.slots[0] }));
      })
      .catch((err) => setError(err.message));
  }, []);

  const onChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    // Any change invalidates the previously fetched availability.
    setTables(null);
    setSelectedTable(null);
  };

  const checkAvailability = async () => {
    setError('');
    setDetails(null);
    setSelectedTable(null);
    setChecking(true);
    try {
      const res = await api.get('/reservations/availability', {
        params: { date: form.date, timeSlot: form.timeSlot, guests: form.guests },
      });
      setTables(res.data.tables);
    } catch (err) {
      setError(err.message);
      setDetails(err.details);
    } finally {
      setChecking(false);
    }
  };

  const book = async () => {
    if (!selectedTable) return;
    setError('');
    setDetails(null);
    setBooking(true);
    try {
      await api.post('/reservations', {
        tableId: selectedTable,
        date: form.date,
        timeSlot: form.timeSlot,
        guests: Number(form.guests),
      });
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.message);
      setDetails(err.details);
      // A conflict may mean someone just took the table — refresh availability.
      if (err.status === 409) checkAvailability();
    } finally {
      setBooking(false);
    }
  };

  const availableCount = tables?.filter((t) => t.available).length ?? 0;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>New Reservation</h1>
          <p className="subtitle">Choose a date and time, then pick an available table.</p>
        </div>
      </div>

      <Alert message={error} details={details} />

      <div className="card">
        <div className="form-row">
          <div className="field">
            <label>Date</label>
            <input
              type="date"
              name="date"
              min={todayISO()}
              value={form.date}
              onChange={onChange}
            />
          </div>
          <div className="field">
            <label>Time Slot</label>
            <select name="timeSlot" value={form.timeSlot} onChange={onChange}>
              {slots.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Guests</label>
            <input
              type="number"
              name="guests"
              min={1}
              max={20}
              value={form.guests}
              onChange={onChange}
            />
          </div>
        </div>
        <button className="btn" onClick={checkAvailability} disabled={checking || !form.timeSlot}>
          {checking ? 'Checking…' : 'Check availability'}
        </button>
      </div>

      {tables && (
        <div className="card">
          <h3 style={{ marginTop: 0 }}>
            {availableCount > 0
              ? `${availableCount} table(s) available`
              : 'No tables available for this slot'}
          </h3>
          {tables.length === 0 && (
            <p className="muted">No tables can seat {form.guests} guest(s).</p>
          )}
          <div className="tables-grid">
            {tables.map((t) => (
              <button
                key={t.id}
                type="button"
                disabled={!t.available}
                className={`table-option ${selectedTable === t.id ? 'selected' : ''} ${
                  !t.available ? 'disabled' : ''
                }`}
                onClick={() => setSelectedTable(t.id)}
              >
                <div className="t-name">{t.name}</div>
                <div className="t-meta">
                  {t.capacity} seats · {t.location}
                </div>
                {!t.available && <div className="t-meta">{t.reason}</div>}
              </button>
            ))}
          </div>

          <button
            className="btn mt btn-block"
            onClick={book}
            disabled={!selectedTable || booking}
          >
            {booking ? 'Booking…' : 'Confirm reservation'}
          </button>
        </div>
      )}
    </div>
  );
}
