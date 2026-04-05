import "./forgot.css";
import { useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import API_URL from "../../api";
export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const { token } = useParams();
  const navigate = useNavigate();

  const handleUpdate = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setError("Passwords do not match!");
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/api/auth/resetpassword/${token}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ password }),
        },
      );

      const data = await response.json();

      if (response.ok) {
        navigate("/login");
      } else {
        setError(data.message || "Failed to reset password");
      }
    } catch (err) {
      setError("Failed to connect to server");
    }
  };

  return (
    <div className="forgot-wrapper">
      <div className="forgot-card">
        <h1>Set New Password</h1>
        <p>Please enter your new password below.</p>

        {error && <div className="auth-message error">{error}</div>}

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
