/* --- Imports --- */
import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";

import API_URL from "../../api";
import "./login.css";

/* --- Component --- */
export default function Login() {
  /* State */
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const navigate = useNavigate();
  const userInfo = JSON.parse(localStorage.getItem("userInfo"));
  useEffect(() => {
    // If user is already logged in, kick them to dashboard
    if (userInfo) {
      navigate("/dashboard");
    }
  }, [userInfo, navigate]);
  /* Handlers */
  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem("userInfo", JSON.stringify(data));

        if (data.isAdmin) {
          navigate("/admin");
        } else {
          navigate("/dashboard");
        }
      } else {
        setError(data.message || "Invalid email or password");
      }
    } catch (err) {
      setError("Failed to connect to server");
    }
  };

  /* UI */
  return (
    <div className="login-wrapper">
      <div className="login-card">
        <h1>Welcome Back</h1>
        <p className="login-subtitle">Login to your BookBot account</p>

        {error && <div className="auth-message error">{error}</div>}

        <form className="login-form" onSubmit={handleLogin}>
          <input
            type="email"
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
