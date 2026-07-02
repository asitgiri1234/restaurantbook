import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import Alert from '../components/Alert.jsx';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [details, setDetails] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setDetails(null);
    setSubmitting(true);
    try {
      await register(form.name, form.email, form.password);
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.message);
      setDetails(err.details);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="card card-narrow">
      <h1>Create your account</h1>
      <p className="subtitle">Sign up to book a table.</p>
      <Alert message={error} details={details} />
      <form onSubmit={onSubmit}>
        <div className="field">
          <label>Name</label>
          <input name="name" value={form.name} onChange={onChange} required />
        </div>
        <div className="field">
          <label>Email</label>
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={onChange}
            required
            autoComplete="email"
          />
        </div>
        <div className="field">
          <label>Password</label>
          <input
            type="password"
            name="password"
            value={form.password}
            onChange={onChange}
            required
            minLength={6}
            autoComplete="new-password"
          />
        </div>
        <button className="btn btn-block" disabled={submitting}>
          {submitting ? 'Creating…' : 'Sign up'}
        </button>
      </form>
      <p className="auth-switch">
        Already registered? <Link to="/login">Log in</Link>
      </p>
    </div>
  );
}
