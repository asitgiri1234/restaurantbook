import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import { useAuth } from './context/AuthContext.jsx';

import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import CustomerDashboard from './pages/CustomerDashboard.jsx';
import NewReservation from './pages/NewReservation.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';
import AdminTables from './pages/AdminTables.jsx';

/** Sends a logged-in user to the right home based on their role. */
function Home() {
  const { isAdmin } = useAuth();
  return <Navigate to={isAdmin ? '/admin' : '/'} replace />;
}

export default function App() {
  return (
    <>
      <Navbar />
      <main className="container">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Customer */}
          <Route
            path="/"
            element={
              <ProtectedRoute role="customer">
                <CustomerDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/reserve"
            element={
              <ProtectedRoute role="customer">
                <NewReservation />
              </ProtectedRoute>
            }
          />

          {/* Admin */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute role="admin">
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/tables"
            element={
              <ProtectedRoute role="admin">
                <AdminTables />
              </ProtectedRoute>
            }
          />

          <Route path="/home" element={<Home />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </>
  );
}
