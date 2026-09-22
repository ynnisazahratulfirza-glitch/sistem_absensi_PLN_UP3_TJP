// pages/admin/Export.jsx
import { useState } from "react";
import { collection, getDocs, query, where, orderBy } from "firebase/firestore";
import { db } from "../../lib/firebase";

export default function AdminExport() {
  const [month, setMonth]   = useState(new Date().toISOString().slice(0, 7));
  const [loading, setLoading] = useState("");

  const toCSV = (headers, rows) => {
    const lines = [headers.join(",")];
    rows.forEach((r) => lines.push(r.map((v) => `"${v ?? ""}"`).join(",")));
    return lines.join("\n");
  };

  const downloadCSV = (content, filename) => {
    const blob = new Blob(["\uFEFF" + content], { type: "text/csv;charset=utf-8;" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  };

  const exportAbsensi = async () => {
    setLoading("absensi");
    const snap      = await getDocs(query(collection(db, "absensi"), where("bulan", "==", month), orderBy("tanggal")));
    const usersSnap = await getDocs(collection(db, "users"));
    const userMap   = {};
    usersSnap.docs.forEach((d) => { userMap[d.data().uid] = d.data(); });

    const headers = ["No","Nama","NIP","Jabatan","Tanggal","Jam Masuk","Jam Keluar","Status","Keterangan"];
    const rows    = snap.docs.map((d, i) => {
      const data = d.data(); const u = userMap[data.uid] || {};
      return [i+1, u.nama, u.nip, u.jabatan, data.tanggal, data.jamMasuk, data.jamKeluar, data.status, data.keterangan];
    });
    downloadCSV(toCSV(headers, rows), `absensi_${month}.csv`);
    setLoading("");
  };

  const exportLembur = async () => {
    setLoading("lembur");
    const snap      = await getDocs(query(collection(db, "lembur"), where("bulan", "==", month), orderBy("tanggal")));
    const usersSnap = await getDocs(collection(db, "users"));
    const userMap   = {};
    usersSnap.docs.forEach((d) => { userMap[d.data().uid] = d.data(); });

    const totalPerUser = {};
    snap.docs.forEach((d) => {
      const { uid, jumlahJam } = d.data();
      totalPerUser[uid] = (totalPerUser[uid] || 0) + (jumlahJam || 0);
    });

    const headers = ["No","Nama","NIP","Tanggal","Jam Mulai","Jam Selesai","Jumlah Jam","Total Jam (Bulan)","Nukonfiden","Keterangan"];
    const rows    = snap.docs.map((d, i) => {
      const data = d.data(); const u = userMap[data.uid] || {};
      return [i+1, u.nama, u.nip, data.tanggal, data.jamMulai, data.jamSelesai, data.jumlahJam, totalPerUser[data.uid], data.nukonfiden, data.keterangan];
    });
    downloadCSV(toCSV(headers, rows), `lembur_${month}.csv`);
    setLoading("");
  };

  return (
    <div>
      <div className="page-header">Export Data</div>
      <div className="export-wrap">
        <div className="export-card-clean">
          <div className="export-icon-clean">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#1e3a8a" strokeWidth="1.5">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
              <polyline points="10 9 9 9 8 9"/>
            </svg>
          </div>
          <h3>Download Rekap Data</h3>
          <p>Export data ke format CSV untuk dibuka di Microsoft Excel</p>

          <div className="form-group" style={{ maxWidth: 260, margin: "0 auto 24px" }}>
            <label>Pilih Bulan</label>
            <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} />
          </div>

          <div className="export-btn-row">
            <button className="btn btn-primary" onClick={exportAbsensi} disabled={loading === "absensi"}>
              {loading === "absensi" ? "Memproses..." : "Download Absensi"}
            </button>
            <button className="btn btn-warning" onClick={exportLembur} disabled={loading === "lembur"}>
              {loading === "lembur" ? "Memproses..." : "Download Lembur"}
            </button>
          </div>

          <div className="export-notes">
            <p>File akan ter-download otomatis dalam format <strong>.csv</strong></p>
            <p>Buka dengan Microsoft Excel atau Google Sheets</p>
          </div>
        </div>
      </div>
    </div>
  );
}
