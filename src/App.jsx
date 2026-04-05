import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/login/Login";
import Register from "./pages/register/Register";
import Dashboard from "./pages/dashboard/Dashboard";
import ForgotPassword from "./pages/forgotPasswaord/ForotPasswaord";
import ResetPassword from "./pages/forgotPasswaord/ResetPassword";
import PrivateRoute from "./components/PrivateRoute";
import Layout from "./components/Layout";
import BusinessProfile from "./pages/BusinessProfile/BusinessProfile";
import AdminDashboard from "./pages/adminDashboard/AdminDashboard";
import AdminRoute from "./components/AdminRoutes";
import "./App.css";

function App() {
  const userInfo = JSON.parse(localStorage.getItem("userInfo"));
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            userInfo ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />

        <Route element={<PrivateRoute />}>
          <Route element={<Layout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/business-profile" element={<BusinessProfile />} />
            <Route element={<AdminRoute />}>
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/edit/:id" element={<BusinessProfile />} />
            </Route>
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
export default App;
