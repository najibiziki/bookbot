// src/pages/ForgotPassword/ForgotPassword.jsx
import { useState } from "react";
import { Link } from "react-router-dom";
import "./forgot.css";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");

  const handleReset = (e) => {
    e.preventDefault();
    // TODO: Later, this will trigger your backend to send an email
    alert(`A password reset link has been sent to ${email}. (Backend pending)`);
  };

  return (
    <div className="forgot-wrapper">
      <div className="forgot-card">
        <h1>Reset Password</h1>
        <p>
          Enter the email address associated with your account. We will send you
          a link to reset your password.
        </p>

        <form className="forgot-form" onSubmit={handleReset}>
          <input
            type="email"
            placeholder="Enter your Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <button
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
