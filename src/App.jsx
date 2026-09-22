// =============================================
// App.jsx - Router utama aplikasi
// Route:
//   /login       → Login
//   /register    → Register
//   /admin/*     → Admin (protected, role=admin)
//   /user/*      → User  (protected, role=user)
// =============================================

import { Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "./lib/firebase";
import logoPLN from "./assets/images (5).jpg";

import AuthLayout from "./layouts/AuthLayout";
import AdminLayout from "./layouts/AdminLayout";

import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import SeedAdmin from "./pages/auth/SeedAdmin";

import AdminDashboard from "./pages/admin/Dashboard";
import AdminAbsensi from "./pages/admin/Absensi";
import AdminLembur from "./pages/admin/Lembur";
import AdminKaryawan from "./pages/admin/Karyawan";
import AdminExport from "./pages/admin/Export";

import UserHome from "./pages/user/Home";
import UserAbsensi from "./pages/user/Absensi";
import UserLembur from "./pages/user/Lembur";
import UserRiwayat from "./pages/user/Riwayat";
import UserProfil from "./pages/user/Profil";
import UserLayout from "./layouts/UserLayout";

function LoadingScreen({ text = "Memuat Aplikasi..." }) {
  return (
    <div className="loading-screen">
      <div className="loading-inner">
        <img src={logoPLN} alt="PLN" className="loading-logo" />
        <div className="loading-text">{text}</div>
        <div className="loading-bar"><div className="loading-bar-fill" /></div>
      </div>
    </div>
  );
}

function ProtectedRoute({ children, allowedRole, user, role, loading }) {
  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;
  if (role !== allowedRole) return <Navigate to={role === "admin" ? "/admin" : "/user"} replace />;
  return children;
}

export default function App() {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (u) {
        try {
          const snap = await getDoc(doc(db, "users", u.uid));
          if (snap.exists()) {
            setUser(u);
            setRole(snap.data().role);
          } else {
            // Dokumen user tidak ada (mungkin dihapus admin)
            await signOut(auth);
            setUser(null);
            setRole(null);
          }
        } catch {
          setUser(null);
          setRole(null);
        }
      } else {
        setUser(null);
        setRole(null);
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  if (loading) return <LoadingScreen />;

  return (
    <Routes>
      {/* Auth Routes */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Route>

      {/* Admin Routes */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRole="admin" user={user} role={role} loading={loading}>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<AdminDashboard />} />
        <Route path="absensi" element={<AdminAbsensi />} />
        <Route path="lembur" element={<AdminLembur />} />
        <Route path="karyawan" element={<AdminKaryawan />} />
        <Route path="export" element={<AdminExport />} />
      </Route>

      {/* User Routes */}
      <Route
        path="/user"
        element={
          <ProtectedRoute allowedRole="user" user={user} role={role} loading={loading}>
            <UserLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<UserHome />} />
        <Route path="absensi" element={<UserAbsensi />} />
        <Route path="lembur" element={<UserLembur />} />
        <Route path="riwayat" element={<UserRiwayat />} />
        <Route path="profil" element={<UserProfil />} />
      </Route>

      {/* Seed Admin - hanya untuk setup awal */}
      <Route path="/seed-admin" element={<SeedAdmin />} />

      {/* Default redirect */}
      <Route
        path="*"
        element={
          loading ? null : user ? (
            <Navigate to={role === "admin" ? "/admin" : "/user"} replace />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
    </Routes>
  );
}
