import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from './lib/firebase';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Home } from './pages/Home';
import { Payment } from './pages/Payment';
import { Settings } from './pages/Settings';
import MyImages from './pages/MyImages';
import { Analytics } from "@vercel/analytics/react";
import { LoadingSpinner } from './components/LoadingSpinner';
import { SpeedInsights } from "@vercel/speed-insights/react"; // ✅ Importando o Speed Insights

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const [user, loading] = useAuthState(auth);

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function App() {
  return (
    <>
      <SpeedInsights /> {/* ✅ Adicionando para coletar métricas */}
      <Analytics /> {/* ✅ Adicionando o Analytics da Vercel */}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/my-images"
          element={
            <ProtectedRoute>
              <MyImages />
            </ProtectedRoute>
          }
        />
        <Route
          path="/payment/*"
          element={
            <ProtectedRoute>
              <Payment />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          }
        />
      </Routes>
    </>
  );
}

export default App;
