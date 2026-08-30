import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ admin = false }: { admin?: boolean }) {
  const { session, loading, isAdmin } = useAuth();
  const location = useLocation();

  if (loading) return <div className="min-h-screen grid place-items-center text-slate-400">Loading Boosty...</div>;
  if (!session) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (admin && !isAdmin) return <Navigate to="/dashboard" replace />;
  return <Outlet />;
}