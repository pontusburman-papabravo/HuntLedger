import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './auth/useAuth';
import { AppLayout } from './components/AppLayout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Ammunition } from './pages/Ammunition';
import { Dashboard } from './pages/Dashboard';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Reports } from './pages/Reports';
import { Sessions } from './pages/Sessions';
import { WeaponDetail } from './pages/WeaponDetail';
import { Weapons } from './pages/Weapons';

export function App() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <div className="centered">Loading…</div>;
  }

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/register" element={user ? <Navigate to="/" replace /> : <Register />} />

      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="sessions" element={<Sessions />} />
        <Route path="weapons" element={<Weapons />} />
        <Route path="weapons/:id" element={<WeaponDetail />} />
        <Route path="ammunition" element={<Ammunition />} />
        <Route path="reports" element={<Reports />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
