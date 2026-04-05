/* --- Imports --- */
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

import API_URL from "../../api";
import "./register.css";

/* --- Component --- */
export default function Register() {
  /* State */
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const navigate = useNavigate();

  /* Handlers */
  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const response = await fetch(`${API_URL}/api/auth/register`, {
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
        setError(data.message || "Registration failed");
      }
    } catch (err) {
      setError("Failed to connect to server");
    }
  };

  /* UI */
  return (
    <div className="register-wrapper">
      <div className="register-card">
        <h1>Create Account</h1>
        <p className="register-subtitle">
          Register for a BookBot Business account
        </p>

        {error && <div className="auth-message error">{error}</div>}

        <form className="register-form" onSubmit={handleRegister}>
          <input
            type="email"
            placeholder="Business Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <input
            type="password"
            placeholder="Create Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button className="register-btn" type="submit">
            Register
          </button>
        </form>

        <p className="register-footer">
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </div>
    </div>
  );
}
