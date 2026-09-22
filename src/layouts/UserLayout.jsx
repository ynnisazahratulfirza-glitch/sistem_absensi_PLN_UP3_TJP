// UserLayout.jsx
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { signOut, onAuthStateChanged } from "firebase/auth";
import { useEffect, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { auth, db } from "../lib/firebase";
import logoPLN from "../assets/images (5).jpg";

const menus = [
  { to: "/user", label: "Beranda", end: true },
  { to: "/user/absensi", label: "Absensi" },
  { to: "/user/lembur", label: "Input Lembur" },
  { to: "/user/riwayat", label: "Riwayat" },
  { to: "/user/profil", label: "Profil" },
];

export default function UserLayout() {
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (u) {
        const snap = await getDocs(query(collection(db, "users"), where("uid", "==", u.uid)));
        if (!snap.empty) setUserData(snap.docs[0].data());
      }
    });
    return () => unsub();
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/login");
  };

  const initials = userData?.nama
    ? userData.nama.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2)
    : "U";

  return (
    <div className={`app-layout ${collapsed ? "sidebar-collapsed" : ""}`}>
      <nav className="sidebar">
        <div className="sidebar-brand">
          <img src={logoPLN} alt="PLN" className="sidebar-logo" />
          {!collapsed && <span className="brand-text">PLN UP3</span>}
        </div>
        <ul className="sidebar-nav">
          {menus.map((m) => (
            <li key={m.to}>
              <NavLink
                to={m.to}
                end={m.end}
                className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
              >
                <span>{m.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
        <div className="sidebar-bottom">
          <button className="logout-btn" onClick={handleLogout}>
            Keluar
          </button>
        </div>
      </nav>

      <div className="main-wrap">
        <header className="topbar">
          <button className="hamburger" onClick={() => setCollapsed(!collapsed)}>&#9776;</button>
          <div className="topbar-brand">Portal Karyawan</div>
          <div className="topbar-right">
            {userData?.fotoURL ? (
              <img src={userData.fotoURL} className="avatar-img" alt="foto" />
            ) : (
              <div className="avatar-circle user-ava">{initials}</div>
            )}
            <span>{userData?.nama || "Karyawan"}</span>
          </div>
        </header>
        <div className="content-area">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
