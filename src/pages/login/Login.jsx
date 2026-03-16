// src/pages/Login/Login.jsx
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "./login.css";

export default function Login() {
  // Change state from 'phone' to 'email'
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    // TODO: Send email and password to backend
    console.log("Logging in with:", email);

    // Mocking successful login
    localStorage.setItem("isLoggedIn", "true");
    navigate("/dashboard");
  };

  return (
    <div className="login-wrapper">
      <div className="login-card">
        <h1>Welcome Back</h1>
        <p className="login-subtitle">Login to your BookBot account</p>

        <form className="login-form" onSubmit={handleLogin}>
          <input
            type="email" // Changed to email
            placeholder="Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          {/* Forgot Password Link */}
          <div className="login-link-wrapper">
            <Link to="/forgot-password" className="login-link">
              Forgot Password?
            </Link>
          </div>

          <button className="login-btn" type="submit">
            Login
          </button>
        </form>

        <p className="login-footer">
          Don't have an account? <Link to="/register">Register</Link>
        </p>
      </div>
    </div>
  );
}
