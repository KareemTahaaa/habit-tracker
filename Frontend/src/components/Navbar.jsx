import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar" id="main-navbar">
      <div className="navbar-brand">
        <Link to={isAuthenticated ? '/profile' : '/'} className="navbar-logo">
          <span className="logo-icon">✦</span>
          <span className="logo-text">HabitTracker</span>
        </Link>
      </div>

      {isAuthenticated ? (
        <>
          {/* Left side - Main navigation */}
          <div className="navbar-links-left">
            <span className="navbar-greeting">
              Hi, <strong>{user?.name?.split(' ')[0]}</strong>
            </span>
            <Link to="/habits" className="nav-link" id="nav-habits-link">
              Habits
            </Link>
            <Link to="/dashboard" className="nav-link" id="nav-dashboard-link">
              Dashboard
            </Link>
          </div>

          {/* Right side - Profile, Notifications, Settings & Logout */}
          <div className="navbar-links-right">
            <Link to="/notifications" className="nav-link" id="nav-notifications-link">
              Notifications
            </Link>
            <Link to="/settings" className="nav-link" id="nav-settings-link">
              Settings
            </Link>
            <Link to="/profile" className="nav-link" id="nav-profile-link">
              Profile
            </Link>
            <button
              onClick={handleLogout}
              className="btn btn-outline btn-sm"
              id="nav-logout-btn"
            >
              Logout
            </button>
          </div>
        </>
      ) : (
        <div className="navbar-links">
          <Link to="/login" className="nav-link" id="nav-login-link">
            Login
          </Link>
          <Link to="/register" className="btn btn-primary btn-sm" id="nav-register-link">
            Register
          </Link>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
