// src/pages/Register/Register.jsx
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "./register.css";

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleRegister = (e) => {
    e.preventDefault();
    console.log("Registering:", email);
    alert("Registration successful! Please login.");
    navigate("/login");
  };

  return (
    <div className="register-wrapper">
      <div className="register-card">
        <h1>Create Account</h1>
        <p className="register-subtitle">
          Register for a BookBot Business account
        </p>

        <form className="register-form" onSubmit={handleRegister}>
          <input
            type="email" // Changed to email
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
