import { Navigate, Outlet } from "react-router-dom";

function AdminRoute() {
  const userInfo = localStorage.getItem("userInfo")
    ? JSON.parse(localStorage.getItem("userInfo"))
    : null;

  return userInfo && userInfo.isAdmin ? (
    <Outlet />
  ) : (
    <Navigate to="/dashboard" replace />
  );
}

export default AdminRoute;
