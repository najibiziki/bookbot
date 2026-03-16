import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/login/Login";
import Register from "./pages/register/Register";
import Dashboard from "./pages/dashboard/Dashboard"; // Move your current App logic here or keep it in App
import ForgotPassword from "./pages/forgotPasswaord/ForotPasswaord";
import ResetPassword from "./pages/forgotPasswaord/ResetPassword";
import "./App.css";

// Simple protection component
function PrivateRoute({ children }) {
  const isLoggedIn = localStorage.getItem("isLoggedIn");
  return isLoggedIn ? children : <Navigate to="/login" />;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
        {/* Protected Route (Your PWA Dashboard) */}
        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <Dashboard />
              {/* Or simply put your current App content here inside a component */}
            </PrivateRoute>
          }
        />

        {/* Default redirect */}
        <Route path="/" element={<Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
