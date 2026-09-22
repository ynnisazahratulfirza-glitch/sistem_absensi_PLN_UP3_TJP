import { Outlet, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../lib/firebase";
import logoPLN from "../assets/images (5).jpg";

function LoadingScreen() {
  return (
    <div className="loading-screen">
      <div className="loading-inner">
        <img src={logoPLN} alt="PLN" className="loading-logo" />
        <div className="loading-text">Memuat...</div>
        <div className="loading-bar"><div className="loading-bar-fill" /></div>
      </div>
    </div>
  );
}

export default function AuthLayout() {
  const [checking, setChecking] = useState(true);
  const [redirect, setRedirect] = useState(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (u) {
        const snap = await getDoc(doc(db, "users", u.uid));
        const r = snap.exists() ? snap.data().role : null;
        setRedirect(r === "admin" ? "/admin" : "/user");
      }
      setChecking(false);
    });
    return () => unsub();
  }, []);

  if (checking) return <LoadingScreen />;
  if (redirect) return <Navigate to={redirect} replace />;

  return (
    <div className="auth-wrapper">
      <div className="auth-left">
        <div className="auth-brand">
          <img src={logoPLN} alt="Logo PLN" className="auth-logo" />
          <h1>PLN UP3</h1>
          <p>Sistem Absensi Karyawan Digital</p>
        </div>
        <div className="floating-shapes">
          <div className="shape s1" />
          <div className="shape s2" />
          <div className="shape s3" />
        </div>
      </div>
      <div className="auth-right">
        <Outlet />
      </div>
    </div>
  );
}
