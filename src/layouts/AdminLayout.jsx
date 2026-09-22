// AdminLayout.jsx
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../lib/firebase";
import { useState } from "react";
import logoPLN from "../assets/images (5).jpg";

const menus = [
  { to: "/admin", label: "Dashboard", end: true },
  { to: "/admin/absensi", label: "Rekap Absensi" },
  { to: "/admin/lembur", label: "Data Lembur" },
  { to: "/admin/karyawan", label: "Karyawan" },
  { to: "/admin/export", label: "Export Data" },
];

export default function AdminLayout() {
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/login");
  };

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
          <div className="topbar-brand">Panel Admin</div>
          <div className="topbar-right">
            <div className="avatar-circle admin-ava">A</div>
            <span>Admin</span>
          </div>
        </header>
        <div className="content-area">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
