// UserLayout.jsx
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { signOut, onAuthStateChanged } from "firebase/auth";
import { useEffect, useState, useRef } from "react";
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
  const [open, setOpen] = useState(false);
  const [userData, setUserData] = useState(null);
  const sidebarRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (open && sidebarRef.current && !sidebarRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

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
    <div className="app-layout">
      {open && <div className="mob-overlay" onClick={() => setOpen(false)} />}

      <nav ref={sidebarRef} className={`sidebar ${open ? "mobile-open" : ""}`}>
        <div className="sidebar-brand">
          <img src={logoPLN} alt="PLN" className="sidebar-logo" />
          <span className="brand-text">PLN UP3</span>
        </div>
        <ul className="sidebar-nav">
          {menus.map((m) => (
            <li key={m.to}>
              <NavLink
                to={m.to} end={m.end}
                className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
                onClick={() => setOpen(false)}
              >
                <span>{m.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
        <div className="sidebar-bottom">
          <button className="logout-btn" onClick={handleLogout}>Keluar</button>
        </div>
      </nav>

      <div className="main-wrap">
        <header className="topbar">
          <button className="hamburger" onClick={() => setOpen(!open)}>&#9776;</button>
          <div className="topbar-brand">Portal Karyawan</div>
          <div className="topbar-right">
            {userData?.fotoURL
              ? <img src={userData.fotoURL} className="avatar-img" alt="" />
              : <div className="avatar-circle user-ava">{initials}</div>}
            <span>{userData?.nama || "Karyawan"}</span>
          </div>
        </header>
        <div className="content-area"><Outlet /></div>
      </div>
    </div>
  );
}
