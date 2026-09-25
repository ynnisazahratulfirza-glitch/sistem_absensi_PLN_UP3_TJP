// pages/admin/Export.jsx
import { useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../../lib/firebase";

export default function AdminExport() {
  const [month, setMonth]     = useState(new Date().toISOString().slice(0, 7));
  const [loading, setLoading] = useState("");

  const toCSV = (headers, rows) => {
    // Tab separator - universal untuk semua versi Excel
    const sep = "\t";
    const lines = [headers.join(sep)];
    rows.forEach((r) => lines.push(r.map((v) => String(v ?? "")).join(sep)));
    return lines.join("\n");
  };

  const downloadCSV = (content, filename) => {
    // Simpan sebagai .xls dengan tab separator - Excel langsung buka rapi
    const blob = new Blob(["\uFEFF" + content], { type: "application/vnd.ms-excel;charset=utf-8;" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  };

  const exportAbsensi = async () => {
    setLoading("absensi");
    try {
      // Ambil semua absensi bulan ini tanpa orderBy
      const snap      = await getDocs(query(collection(db, "absensi"), where("bulan", "==", month)));
      const usersSnap = await getDocs(collection(db, "users"));
      const userMap   = {};
      usersSnap.docs.forEach((d) => { userMap[d.data().uid] = d.data(); });

      // Sort di client
      const rows = snap.docs
        .map((d) => d.data())
        .sort((a, b) => (a.tanggal || "").localeCompare(b.tanggal || ""))
        .map((data, i) => {
          const u = userMap[data.uid] || {};
          return [i + 1, u.nama, u.nip, u.jabatan, data.tanggal, data.jamMasuk, data.jamKeluar, data.status, data.keterangan];
        });

      const headers = ["No","Nama","NIP","Jabatan","Tanggal","Jam Masuk","Jam Keluar","Status","Keterangan"];
      downloadCSV(toCSV(headers, rows), `Rekap_Absensi_${month}.xls`);
    } catch (e) {
      console.error(e);
      alert("Gagal export: " + e.message);
    }
    setLoading("");
  };

  const exportLembur = async () => {
    setLoading("lembur");
    try {
      // Ambil semua lembur tanpa orderBy, filter di client
      const snap      = await getDocs(collection(db, "lembur"));
      const usersSnap = await getDocs(collection(db, "users"));
      const userMap   = {};
      usersSnap.docs.forEach((d) => { userMap[d.data().uid] = d.data(); });

      const totalPerUser = {};
      snap.docs.forEach((d) => {
        const data = d.data();
        const bulan = data.bulan || (data.tanggal || "").slice(0, 7);
        if (bulan === month) {
          totalPerUser[data.uid] = (totalPerUser[data.uid] || 0) + (data.jumlahJam || 0);
        }
      });

      const rows = snap.docs
        .map((d) => d.data())
        .filter((data) => {
          const bulan = data.bulan || (data.tanggal || "").slice(0, 7);
          return bulan === month;
        })
        .sort((a, b) => (a.tanggal || "").localeCompare(b.tanggal || ""))
        .map((data, i) => {
          const u = userMap[data.uid] || {};
          return [i + 1, u.nama, u.nip, data.tanggal, data.jamMulai, data.jamSelesai,
            data.jumlahJam, totalPerUser[data.uid] || 0, data.nukonfiden, data.keterangan];
        });

      const headers = ["No","Nama","NIP","Tanggal","Jam Mulai","Jam Selesai","Jumlah Jam","Total Jam (Bulan)","Nukonfiden","Keterangan"];
      downloadCSV(toCSV(headers, rows), `Rekap_Lembur_${month}.xls`);
    } catch (e) {
      console.error(e);
      alert("Gagal export: " + e.message);
    }
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

          <div className="form-group" style={{ maxWidth: 260, margin: "16px auto" }}>
            <label>Pilih Bulan</label>
            <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} />
          </div>

          <div className="export-btn-row">
            <button
              className="btn btn-primary"
              onClick={exportAbsensi}
              disabled={loading === "absensi"}
            >
              {loading === "absensi" ? "Memproses..." : "Download Absensi"}
            </button>
            <button
              className="btn btn-warning"
              onClick={exportLembur}
              disabled={loading === "lembur"}
            >
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
