import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Protected({ children }) {
  const { user, ready } = useAuth();
  const location = useLocation();
  if (!ready) return <div className="loading">Loading your account…</div>;
  if (!user) return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  return children;
}