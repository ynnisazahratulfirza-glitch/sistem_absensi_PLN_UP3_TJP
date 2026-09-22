// pages/user/Riwayat.jsx
import { useEffect, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "../../lib/firebase";

const HARI = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

export default function UserRiwayat() {
  const [data, setData] = useState([]);
  const [bulan, setBulan] = useState(new Date().toISOString().slice(0, 7));
  const [loading, setLoading] = useState(false);
  const [uid, setUid] = useState(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (u) setUid(u.uid);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (uid) fetchRiwayat();
  }, [uid, bulan]);

  const fetchRiwayat = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(
        query(
          collection(db, "absensi"),
          where("uid", "==", uid),
          where("bulan", "==", bulan)
        )
      );
      const sorted = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .sort((a, b) => b.tanggal.localeCompare(a.tanggal));
      setData(sorted);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const hadir = data.filter((d) => d.status === "Hadir").length;
  const izin = data.filter((d) => d.status === "Izin").length;
  const alpha = data.filter((d) => d.status === "Alpha").length;

  const getHari = (tgl) => HARI[new Date(tgl + "T00:00:00").getDay()];

  return (
    <div>
      <div className="page-header">Riwayat Absensi</div>
      <div className="card">
        <div className="filter-row">
          <div className="form-group">
            <label>Filter Bulan</label>
            <input type="month" value={bulan} onChange={(e) => setBulan(e.target.value)} />
          </div>
        </div>

        {loading ? (
          <div className="loading-msg">Memuat...</div>
        ) : (
          <>
            <div className="table-wrap">
              <table className="tbl">
                <thead>
                  <tr>
                    <th>No</th>
                    <th>Tanggal</th>
                    <th>Hari</th>
                    <th>Jam Masuk</th>
                    <th>Jam Keluar</th>
                    <th>Foto</th>
                    <th>Status</th>
                    <th>Keterangan</th>
                  </tr>
                </thead>
                <tbody>
                  {data.length === 0 ? (
                    <tr><td colSpan={8} className="empty-cell">Tidak ada data absensi di bulan ini</td></tr>
                  ) : (
                    data.map((row, i) => (
                      <tr key={row.id}>
                        <td>{i + 1}</td>
                        <td>{row.tanggal}</td>
                        <td>{getHari(row.tanggal)}</td>
                        <td>{row.jamMasuk || "-"}</td>
                        <td>{row.jamKeluar || "-"}</td>
                        <td>
                          {row.fotoAbsensi ? (
                            <a href={row.fotoAbsensi} target="_blank" rel="noreferrer">
                              <img src={row.fotoAbsensi} className="tbl-avatar" alt="foto" />
                            </a>
                          ) : "-"}
                        </td>
                        <td>
                          <span className={`badge ${row.status === "Hadir" ? "badge-green" : row.status === "Izin" ? "badge-yellow" : "badge-red"}`}>
                            {row.status}
                          </span>
                        </td>
                        <td>{row.keterangan || "-"}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Summary */}
            <div className="sum-bar">
              <span className="sum-item green">Hadir: <strong>{hadir}</strong></span>
              <span className="sum-item yellow">Izin: <strong>{izin}</strong></span>
              <span className="sum-item red">Alpha: <strong>{alpha}</strong></span>
              <span className="sum-item gray">Total: <strong>{data.length}</strong></span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
