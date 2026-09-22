// pages/user/Home.jsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { collection, getDocs, query, where } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "../../lib/firebase";

export default function UserHome() {
  const [userData, setUserData] = useState(null);
  const [absensiHariIni, setAbsensiHariIni] = useState(null);
  const [totalLembur, setTotalLembur] = useState(0);
  const [jumlahLembur, setJumlahLembur] = useState(0);

  const today = new Date().toISOString().split("T")[0];
  const bulanIni = today.slice(0, 7);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) return;
      const snap = await getDocs(query(collection(db, "users"), where("uid", "==", u.uid)));
      if (!snap.empty) setUserData(snap.docs[0].data());

      const abSnap = await getDocs(
        query(collection(db, "absensi"), where("uid", "==", u.uid), where("tanggal", "==", today))
      );
      setAbsensiHariIni(abSnap.empty ? null : abSnap.docs[0].data());

      const lemSnap = await getDocs(
        query(collection(db, "lembur"), where("uid", "==", u.uid), where("bulan", "==", bulanIni))
      );
      setTotalLembur(lemSnap.docs.reduce((s, d) => s + (d.data().jumlahJam || 0), 0));
      setJumlahLembur(lemSnap.size);
    });
    return () => unsub();
  }, []);

  const now = new Date();
  const jam = now.getHours();
  const greeting = jam < 12 ? "Selamat Pagi" : jam < 17 ? "Selamat Siang" : "Selamat Malam";

  return (
    <div>
      <div className="page-header">{greeting}, {userData?.nama || "Karyawan"}</div>

      {/* Banner */}
      <div className="user-banner">
        <div className="banner-left">
          {userData?.fotoURL ? (
            <img src={userData.fotoURL} className="banner-avatar" alt="foto" />
          ) : (
            <div className="banner-avatar-placeholder">{userData?.nama?.[0] || "K"}</div>
          )}
          <div className="banner-info">
            <h3>{userData?.nama}</h3>
            <p>{userData?.jabatan}</p>
            <small>NIP: {userData?.nip}</small>
          </div>
        </div>
        <div className="banner-date">
          <div className="big-date">{now.getDate()}</div>
          <div className="month-year">
            {now.toLocaleDateString("id-ID", { month: "long", year: "numeric" })}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-row">
        <div className="stat-card blue">
          <div className="stat-icon-box blue-bg">Ab</div>
          <div className="stat-info">
            <div className="stat-value">{absensiHariIni ? "Sudah" : "Belum"}</div>
            <div className="stat-label">Absensi Hari Ini</div>
          </div>
        </div>
        <div className="stat-card orange">
          <div className="stat-icon-box orange-bg">Lb</div>
          <div className="stat-info">
            <div className="stat-value">{jumlahLembur}x</div>
            <div className="stat-label">Lembur Bulan Ini</div>
          </div>
        </div>
        <div className="stat-card purple">
          <div className="stat-icon-box purple-bg">Jm</div>
          <div className="stat-info">
            <div className="stat-value">{totalLembur} Jam</div>
            <div className="stat-label">Total Jam Lembur</div>
          </div>
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-title">Absensi Hari Ini</div>
          {absensiHariIni ? (
            <div className="status-detail">
              <div className="status-row">
                <span>Status</span>
                <span className={`badge ${absensiHariIni.status === "Hadir" ? "badge-green" : "badge-yellow"}`}>
                  {absensiHariIni.status}
                </span>
              </div>
              <div className="status-row"><span>Jam Masuk</span><strong>{absensiHariIni.jamMasuk || "-"}</strong></div>
              <div className="status-row"><span>Jam Keluar</span><strong>{absensiHariIni.jamKeluar || "-"}</strong></div>
              {absensiHariIni.keterangan && (
                <div className="status-row"><span>Keterangan</span><span>{absensiHariIni.keterangan}</span></div>
              )}
            </div>
          ) : (
            <div className="empty-action">
              <p>Anda belum absen hari ini</p>
              <Link to="/user/absensi" className="btn btn-primary btn-sm">Absen Sekarang</Link>
            </div>
          )}
        </div>

        <div className="card">
          <div className="card-title">Ringkasan Lembur Bulan Ini</div>
          <div className="status-detail">
            <div className="status-row"><span>Jumlah Lembur</span><strong>{jumlahLembur} kali</strong></div>
            <div className="status-row">
              <span>Total Jam</span>
              <span className="badge badge-orange">{totalLembur} Jam</span>
            </div>
          </div>
          <div style={{ marginTop: 12 }}>
            <Link to="/user/lembur" className="btn btn-outline btn-sm">Input Lembur</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
