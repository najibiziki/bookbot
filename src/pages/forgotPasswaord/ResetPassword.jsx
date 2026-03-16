import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import "./forgot.css";

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const { token } = useParams();

  const handleUpdate = (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      alert("Passwords do not match!");
      return;
    }

    console.log("Updating password for token:", token);
    alert("Password updated successfully! Please login.");

    window.location.href = "/login";
  };

  return (
    <div className="forgot-wrapper">
      <div className="forgot-card">
        <h1>Set New Password</h1>
        <p>Please enter your new password below.</p>

        <form className="forgot-form" onSubmit={handleUpdate}>
          <input
            type="password"
            placeholder="New Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Confirm New Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
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
            Update Password
          </button>
        </form>

        <Link to="/login" className="forgot-back">
          ← Back to Login
        </Link>
      </div>
    </div>
  );
}
