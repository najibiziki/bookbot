import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import BookBotIcon from "../bookbotIcon";
import "./Navbar.css";

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();

  // Simplified retrieval: JSON.parse(null) returns null, so this handles missing items automatically
  const userInfo = JSON.parse(localStorage.getItem("userInfo"));

  const handleLogout = () => {
    localStorage.removeItem("userInfo");
    navigate("/login");
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-brand">
          <Link to="/dashboard" className="navbar-logo">
            <BookBotIcon size={32} color="#4f46e5" />
            BookBot
          </Link>
          {userInfo && (
            <div className="user-status">
              <span className="status-dot"></span>
              <span className="status-email">{userInfo.email}</span>
            </div>
          )}
        </div>

        <div className="menu-icon" onClick={() => setIsMenuOpen(!isMenuOpen)}>
          <i className={isMenuOpen ? "fas fa-times" : "fas fa-bars"}></i>
        </div>

        <ul className={isMenuOpen ? "nav-menu active" : "nav-menu"}>
          <li className="nav-item">
            <Link
              to="/dashboard"
              className="nav-links"
              onClick={() => setIsMenuOpen(false)}
            >
              <i className="fas fa-calendar-alt icon-left"></i> Dashboard
            </Link>
          </li>

          {/* ADDED: Hide this link if the user is an admin */}
          {!userInfo?.isAdmin && (
            <li className="nav-item">
              <Link
                to="/business-profile"
                className="nav-links"
                onClick={() => setIsMenuOpen(false)}
              >
                <i className="fas fa-store icon-left"></i> Business Profile
              </Link>
            </li>
          )}

          {userInfo && userInfo.isAdmin && (
            <li className="nav-item">
              <Link
                to="/admin"
                className="nav-links admin-link"
                onClick={() => setIsMenuOpen(false)}
              >
                <i className="fas fa-user-shield icon-left"></i> Admin Dashboard
              </Link>
            </li>
          )}

          <li className="nav-item">
            <button className="nav-links logout-btn" onClick={handleLogout}>
              <i className="fas fa-sign-out-alt icon-left"></i> Logout
            </button>
          </li>
        </ul>
      </div>
    </nav>
  );
}
