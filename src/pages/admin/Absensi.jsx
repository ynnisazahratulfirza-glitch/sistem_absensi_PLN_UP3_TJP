// pages/admin/Absensi.jsx
import { useEffect, useState } from "react";
import { collection, getDocs, updateDoc, deleteDoc, doc } from "firebase/firestore";
import { db } from "../../lib/firebase";
import ConfirmDialog from "../../components/ConfirmDialog";

const HARI = ["Minggu","Senin","Selasa","Rabu","Kamis","Jumat","Sabtu"];
const getHari = (tgl) => tgl ? HARI[new Date(tgl + "T00:00:00").getDay()] : "-";

export default function AdminAbsensi() {
  const [allData, setAllData]       = useState([]);
  const [users, setUsers]           = useState([]);
  const [filterDate, setFilterDate] = useState("");
  const [filterUser, setFilterUser] = useState("");
  const [loading, setLoading]       = useState(true);
  const [selected, setSelected]     = useState(null);
  const [editing, setEditing]       = useState(null);
  const [editForm, setEditForm]     = useState({});
  const [saving, setSaving]         = useState(false);
  const [deleting, setDeleting]     = useState(false);
  const [confirmId, setConfirmId]   = useState(null); // id yang mau dihapus

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const usersSnap = await getDocs(collection(db, "users"));
      const userMap = {}; const userList = [];
      usersSnap.docs.forEach((d) => {
        userMap[d.data().uid] = d.data();
        if (d.data().role === "user") userList.push(d.data());
      });
      setUsers(userList);

      const snap = await getDocs(collection(db, "absensi"));
      const rows = snap.docs.map((d) => ({
        id: d.id, ...d.data(),
        nama:    userMap[d.data().uid]?.nama    || "-",
        nip:     userMap[d.data().uid]?.nip     || "-",
        jabatan: userMap[d.data().uid]?.jabatan || "-",
        fotoURL: userMap[d.data().uid]?.fotoURL || "",
      })).sort((a, b) => (b.tanggal || "").localeCompare(a.tanggal || ""));
      setAllData(rows);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const filtered = allData.filter((d) =>
    (filterDate ? d.tanggal === filterDate : true) &&
    (filterUser ? d.uid === filterUser : true)
  );

  const totalHadir = filtered.filter((d) => d.status === "Hadir").length;
  const totalIzin  = filtered.filter((d) => d.status === "Izin").length;
  const totalAlpha = filtered.length - totalHadir - totalIzin;

  // ── EDIT ──────────────────────────────────────
  const openEdit = (row) => {
    setEditing(row);
    setEditForm({
      tanggal:    row.tanggal    || "",
      jamMasuk:   row.jamMasuk   || "",
      jamKeluar:  row.jamKeluar  || "",
      status:     row.status     || "Hadir",
      keterangan: row.keterangan || "",
    });
  };

  const saveEdit = async () => {
    setSaving(true);
    try {
      await updateDoc(doc(db, "absensi", editing.id), {
        tanggal:    editForm.tanggal,
        bulan:      editForm.tanggal.slice(0, 7),
        jamMasuk:   editForm.jamMasuk,
        jamKeluar:  editForm.jamKeluar || null,
        status:     editForm.status,
        keterangan: editForm.keterangan,
      });
      setEditing(null);
      await loadAll();
    } catch (e) { console.error(e); }
    setSaving(false);
  };

  // ── HAPUS ─────────────────────────────────────
  const hapus = async () => {
    setDeleting(true);
    try {
      await deleteDoc(doc(db, "absensi", confirmId));
      setAllData((prev) => prev.filter((d) => d.id !== confirmId));
      setConfirmId(null);
    } catch (e) { console.error(e); }
    setDeleting(false);
  };

  const setF = (k) => (e) => setEditForm({ ...editForm, [k]: e.target.value });

  return (
    <div>
      <div className="page-header">Rekap Absensi Karyawan</div>

      <div className="stats-row" style={{ gridTemplateColumns: "repeat(4,1fr)" }}>
        {[
          { label: "Total Data", value: filtered.length, color: "blue",   abbr: "ALL" },
          { label: "Hadir",      value: totalHadir,      color: "green",  abbr: "HDR" },
          { label: "Izin",       value: totalIzin,       color: "orange", abbr: "IZN" },
          { label: "Alpha",      value: totalAlpha,      color: "red",    abbr: "ALP" },
        ].map((s) => (
          <div key={s.label} className={`stat-card ${s.color}`}>
            <div className={`stat-icon-box ${s.color}-bg`}>{s.abbr}</div>
            <div className="stat-info">
              <div className="stat-value">{s.value}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="filter-row">
          <div className="form-group">
            <label>Tanggal</label>
            <input type="date" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} />
          </div>
          <div className="form-group">
            <label>Karyawan</label>
            <select value={filterUser} onChange={(e) => setFilterUser(e.target.value)}>
              <option value="">Semua</option>
              {users.map((u) => <option key={u.uid} value={u.uid}>{u.nama}</option>)}
            </select>
          </div>
          <button className="btn btn-outline" onClick={() => { setFilterDate(""); setFilterUser(""); }}>
            Reset
          </button>
        </div>

        {loading ? <div className="loading-msg">Memuat data...</div> : (
          <div className="table-wrap">
            <table className="tbl">
              <thead>
                <tr>
                  <th>No</th><th>Foto</th><th>Nama</th><th>NIP</th><th>Jabatan</th>
                  <th>Hari / Tanggal</th><th>Jam Masuk</th><th>Jam Keluar</th>
                  <th>Status</th><th>Bukti Foto</th><th>Keterangan</th><th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={12} className="empty-cell">Tidak ada data absensi</td></tr>
                ) : filtered.map((row, i) => (
                  <tr key={row.id}>
                    <td>{i + 1}</td>
                    <td>
                      {row.fotoURL
                        ? <img src={row.fotoURL} className="tbl-avatar" alt="" />
                        : <div className="tbl-avatar-placeholder">{row.nama?.[0]}</div>}
                    </td>
                    <td><strong>{row.nama}</strong></td>
                    <td>{row.nip}</td>
                    <td>{row.jabatan}</td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{getHari(row.tanggal)}</div>
                      <small className="text-muted">{row.tanggal}</small>
                    </td>
                    <td>{row.jamMasuk  ? <span className="time-badge green">{row.jamMasuk}</span>  : "-"}</td>
                    <td>{row.jamKeluar ? <span className="time-badge red">{row.jamKeluar}</span> : <span className="text-muted">Belum</span>}</td>
                    <td>
                      <span className={`badge ${row.status === "Hadir" ? "badge-green" : row.status === "Izin" ? "badge-yellow" : "badge-red"}`}>
                        {row.status}
                      </span>
                    </td>
                    <td>
                      {row.fotoAbsensi
                        ? <img src={row.fotoAbsensi} className="tbl-avatar bukti-thumb" alt="bukti"
                            onClick={() => setSelected(row)} />
                        : <span className="text-muted">-</span>}
                    </td>
                    <td>{row.keterangan || <span className="text-muted">-</span>}</td>
                    <td>
                      <div className="aksi-btns">
                        <button className="btn-detail"   onClick={() => setSelected(row)}>Detail</button>
                        <button className="btn-edit"     onClick={() => openEdit(row)}>Edit</button>
                          <button
                          className="btn-hapus"
                          onClick={() => setConfirmId(row.id)}
                        >
                          Hapus
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="table-footer">Menampilkan {filtered.length} dari {allData.length} data</div>
      </div>

      {/* ── MODAL DETAIL ── */}
      {selected && (
        <div className="modal-overlay" onClick={() => setSelected(null)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Detail Absensi</h3>
              <button className="modal-close" onClick={() => setSelected(null)}>&#10005;</button>
            </div>
            <div className="modal-body">
              <div className="detail-profile">
                {selected.fotoURL
                  ? <img src={selected.fotoURL} className="detail-avatar" alt="" />
                  : <div className="detail-avatar-placeholder">{selected.nama?.[0]}</div>}
                <div>
                  <div className="detail-name">{selected.nama}</div>
                  <div className="detail-sub">{selected.jabatan} &mdash; {selected.nip}</div>
                </div>
              </div>
              <div className="detail-grid">
                <div className="detail-item">
                  <span className="detail-label">Tanggal</span>
                  <span className="detail-value">{getHari(selected.tanggal)}, {selected.tanggal}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Status</span>
                  <span className={`badge ${selected.status === "Hadir" ? "badge-green" : selected.status === "Izin" ? "badge-yellow" : "badge-red"}`}>
                    {selected.status}
                  </span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Jam Masuk</span>
                  <span className="detail-value val-green">{selected.jamMasuk || "-"}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Jam Keluar</span>
                  <span className="detail-value val-red">{selected.jamKeluar || "Belum absen keluar"}</span>
                </div>
                <div className="detail-item full">
                  <span className="detail-label">Keterangan</span>
                  <span className="detail-value">{selected.keterangan || "-"}</span>
                </div>
              </div>
              <div className="detail-foto-section">
                <div className="detail-foto-title">Foto Bukti Absensi</div>
                <div className="detail-foto-row">
                  <div className="detail-foto-box">
                    <div className="detail-foto-label">Foto Masuk</div>
                    {selected.fotoAbsensi
                      ? <a href={selected.fotoAbsensi} target="_blank" rel="noreferrer">
                          <img src={selected.fotoAbsensi} className="detail-foto-img" alt="masuk" />
                          <small>Klik untuk perbesar</small>
                        </a>
                      : <div className="detail-foto-empty">Tidak ada foto</div>}
                  </div>
                  {selected.fotoKeluar && (
                    <div className="detail-foto-box">
                      <div className="detail-foto-label">Foto Keluar</div>
                      <a href={selected.fotoKeluar} target="_blank" rel="noreferrer">
                        <img src={selected.fotoKeluar} className="detail-foto-img" alt="keluar" />
                        <small>Klik untuk perbesar</small>
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setSelected(null)}>Tutup</button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL EDIT ── */}
      {editing && (
        <div className="modal-overlay" onClick={() => setEditing(null)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Edit Absensi — {editing.nama}</h3>
              <button className="modal-close" onClick={() => setEditing(null)}>&#10005;</button>
            </div>
            <div className="modal-body">
              <div className="form-row">
                <div className="form-group">
                  <label>Tanggal</label>
                  <input type="date" value={editForm.tanggal} onChange={setF("tanggal")} />
                </div>
                <div className="form-group">
                  <label>Status</label>
                  <select value={editForm.status} onChange={setF("status")}>
                    <option>Hadir</option>
                    <option>Izin</option>
                    <option>Alpha</option>
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Jam Masuk</label>
                  <input type="time" value={editForm.jamMasuk} onChange={setF("jamMasuk")} />
                </div>
                <div className="form-group">
                  <label>Jam Keluar</label>
                  <input type="time" value={editForm.jamKeluar} onChange={setF("jamKeluar")} />
                </div>
              </div>
              <div className="form-group">
                <label>Keterangan</label>
                <input type="text" value={editForm.keterangan} onChange={setF("keterangan")}
                  placeholder="Keterangan absensi..." />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setEditing(null)}>Batal</button>
              <button className="btn btn-primary" onClick={saveEdit} disabled={saving}>
                {saving ? "Menyimpan..." : "Simpan Perubahan"}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ── CONFIRM HAPUS ── */}
      <ConfirmDialog
        show={!!confirmId}
        title="Hapus Data Absensi"
        message="Data absensi ini akan dihapus permanen dan tidak bisa dikembalikan."
        onConfirm={hapus}
        onCancel={() => setConfirmId(null)}
        loading={deleting}
      />
    </div>
  );
}
