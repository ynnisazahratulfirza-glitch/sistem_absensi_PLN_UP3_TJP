// pages/admin/Dashboard.jsx
import { useEffect, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../../lib/firebase";

export default function AdminDashboard() {
  const [stats, setStats] = useState({ totalUser: 0, hadir: 0, lembur: 0, totalJamLembur: 0 });
  const [todayList, setTodayList] = useState([]);
  const [lemburTop, setLemburTop] = useState([]);

  const today = new Date().toISOString().split("T")[0];
  const bulanIni = today.slice(0, 7);

  useEffect(() => { fetchStats(); }, []);

  const fetchStats = async () => {
    const usersSnap = await getDocs(query(collection(db, "users"), where("role", "==", "user")));
    const totalUser = usersSnap.size;

    const abSnap = await getDocs(query(collection(db, "absensi"), where("tanggal", "==", today)));
    const hadir = abSnap.docs.filter((d) => d.data().status === "Hadir").length;

    const lemSnap = await getDocs(query(collection(db, "lembur"), where("bulan", "==", bulanIni)));
    const totalJamLembur = lemSnap.docs.reduce((s, d) => s + (d.data().jumlahJam || 0), 0);

    setStats({ totalUser, hadir, lembur: lemSnap.size, totalJamLembur });

    const usersMap = {};
    usersSnap.docs.forEach((d) => { usersMap[d.data().uid] = d.data(); });

    const todayData = abSnap.docs.map((d) => {
      const data = d.data();
      const u = usersMap[data.uid] || {};
      return { ...data, nama: u.nama, jabatan: u.jabatan, fotoURL: u.fotoURL };
    });
    setTodayList(todayData);

    const lemMap = {};
    lemSnap.docs.forEach((d) => {
      const { uid, jumlahJam } = d.data();
      lemMap[uid] = (lemMap[uid] || 0) + (jumlahJam || 0);
    });
    const sorted = Object.entries(lemMap)
      .sort((a, b) => b[1] - a[1]).slice(0, 5)
      .map(([uid, total]) => ({ uid, total, ...usersMap[uid] }));
    setLemburTop(sorted);
  };

  const statCards = [
    { label: "Total Karyawan", value: stats.totalUser, color: "blue", abbr: "KRY" },
    { label: "Hadir Hari Ini", value: stats.hadir, color: "green", abbr: "HDR" },
    { label: "Lembur Bulan Ini", value: stats.lembur, color: "orange", abbr: "LBR" },
    { label: "Total Jam Lembur", value: `${stats.totalJamLembur} Jam`, color: "purple", abbr: "JAM" },
  ];

  return (
    <div>
      <div className="page-header">Dashboard Admin</div>

      <div className="stats-row">
        {statCards.map((s) => (
          <div key={s.label} className={`stat-card ${s.color}`}>
            <div className={`stat-icon-box ${s.color}-bg`}>{s.abbr}</div>
            <div className="stat-info">
              <div className="stat-value">{s.value}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-title">Absensi Hari Ini</div>
          {todayList.length === 0 ? (
            <div className="empty-msg">Belum ada absensi hari ini</div>
          ) : (
            <ul className="simple-list">
              {todayList.map((item, i) => (
                <li key={i} className="list-item">
                  {item.fotoURL ? (
                    <img src={item.fotoURL} className="mini-avatar" alt="" />
                  ) : (
                    <div className="mini-avatar-placeholder">{item.nama?.[0]}</div>
                  )}
                  <div className="list-info">
                    <strong>{item.nama}</strong>
                    <small>{item.jabatan}</small>
                  </div>
                  <span className={`badge ${item.status === "Hadir" ? "badge-green" : "badge-red"}`}>
                    {item.status}
                  </span>
                  <span className="list-time">{item.jamMasuk}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="card">
          <div className="card-title">Lembur Terbanyak Bulan Ini</div>
          {lemburTop.length === 0 ? (
            <div className="empty-msg">Belum ada data lembur</div>
          ) : (
            <ul className="simple-list">
              {lemburTop.map((item, i) => (
                <li key={i} className="list-item">
                  <div className="rank-num">#{i + 1}</div>
                  <div className="list-info">
                    <strong>{item.nama}</strong>
                    <small>{item.nip}</small>
                  </div>
                  <span className="badge badge-orange">{item.total} Jam</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
