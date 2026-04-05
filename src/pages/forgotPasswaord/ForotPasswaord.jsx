import "./forgot.css";
import { useState } from "react";
import { Link } from "react-router-dom";
import API_URL from "../../api";
export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleReset = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    try {
      const response = await fetch(`${API_URL}/api/auth/forgotpassword`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(data.message || "Reset link sent! Check your email.");
      } else {
        setError(data.message || "Something went wrong");
      }
    } catch (err) {
      setError("Failed to connect to server. Is the backend running?");
    }
  };

  return (
    <div className="forgot-wrapper">
      <div className="forgot-card">
        <h1>Reset Password</h1>
        <p>Enter the email address associated with your account.</p>

        {message && <div className="auth-message success">{message}</div>}

        {error && <div className="auth-message error">{error}</div>}

        <form className="forgot-form" onSubmit={handleReset}>
          <input
            type="email"
            placeholder="Enter your Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <button
            type="submit"
            className="login-btn"
            style={{
              width: "100%",
              padding: "12px",
              backgroundColor: "#4f46e5",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
            }}
          >
            Send Reset Link
          </button>
        </form>

        <Link to="/login" className="forgot-back">
          ← Back to Login
        </Link>
      </div>
    </div>
  );
}
