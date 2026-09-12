import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

function RoleRoute({ allowedRoles }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <p>Loading...</p>;
  }

  const userRoles = user?.roles || [];

  const hasAllowedRole = userRoles.some((role) =>
    allowedRoles.includes(role)
  );

  if (!hasAllowedRole) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}

export default RoleRoute;