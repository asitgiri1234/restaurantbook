import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Navbar() {
  const { user, isAdmin, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="brand">
          🍽️ RestaurantBook
        </Link>

        {isAuthenticated && (
          <div className="nav-links">
            {isAdmin ? (
              <>
                <span className="badge badge-admin">ADMIN</span>
                <Link to="/admin">Reservations</Link>
                <Link to="/admin/tables">Tables</Link>
              </>
            ) : (
              <>
                <span className="badge badge-customer">CUSTOMER</span>
                <Link to="/">My Reservations</Link>
                <Link to="/reserve">New Reservation</Link>
              </>
            )}
            <span className="nav-user">{user?.name}</span>
            <button className="btn btn-ghost" onClick={handleLogout}>
              Logout
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
