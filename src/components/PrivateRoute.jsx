import { Navigate, Outlet } from "react-router-dom";

function PrivateRoute() {
  const userInfo = localStorage.getItem("userInfo");

  return userInfo ? <Outlet /> : <Navigate to="/login" replace />;
}

export default PrivateRoute;
