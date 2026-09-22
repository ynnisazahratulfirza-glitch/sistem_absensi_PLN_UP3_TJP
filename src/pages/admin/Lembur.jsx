import { useEffect, useState } from "react";
import { collection, getDocs, updateDoc, deleteDoc, doc } from "firebase/firestore";
import { db } from "../../lib/firebase";
import ConfirmDialog from "../../components/ConfirmDialog";

export default function AdminLembur() {
  const [allData, setAllData]         = useState([]);
  const [users, setUsers]             = useState([]);
  const [filterMonth, setFilterMonth] = useState(new Date().toISOString().slice(0, 7));
  const [filterUser, setFilterUser]   = useState("");
  const [loading, setLoading]         = useState(true);
  const [selected, setSelected]       = useState(null);
  const [editing, setEditing]         = useState(null);
  const [editForm, setEditForm]       = useState({});
  const [saving, setSaving]           = useState(false);
  const [deleting, setDeleting]       = useState(false);
  const [confirmId, setConfirmId]     = useState(null);

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      // Ambil semua users
      const usersSnap = await getDocs(collection(db, "users"));
      const userMap = {};
      const userList = [];
      usersSnap.docs.forEach((d) => {
        const data = d.data();
        userMap[data.uid] = data;
        if (data.role === "user") userList.push(data);
      });
      setUsers(userList);

      // Ambil semua lembur
      const lemSnap = await getDocs(collection(db, "lembur"));
      const rows = lemSnap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
        nama:    userMap[d.data().uid]?.nama    || "-",
        nip:     userMap[d.data().uid]?.nip     || "-",
        jabatan: userMap[d.data().uid]?.jabatan || "-",
        fotoURL: userMap[d.data().uid]?.fotoURL || "",
      }));
      setAllData(rows);
    } catch (e) {
      console.error("loadAll error:", e);
    }
    setLoading(false);
  };

  // Filter di client
  const filtered = allData.filter((d) => {
    const bulan  = d.bulan || (d.tanggal || "").slice(0, 7);
    const matchM = bulan === filterMonth;
    const matchU = filterUser ? d.uid === filterUser : true;
    return matchM && matchU;
  }).sort((a, b) => (b.tanggal || "").localeCompare(a.tanggal || ""));

  // Hitung total jam per user dalam bulan yang difilter
  const totalPerUser = {};
  filtered.forEach((d) => {
    totalPerUser[d.uid] = (totalPerUser[d.uid] || 0) + (d.jumlahJam || 0);
  });

  const totalJamAll = filtered.reduce((s, d) => s + (d.jumlahJam || 0), 0);

  const openEdit = (row) => {
    setEditing(row);
    setEditForm({
      tanggal:    row.tanggal    || "",
      jamMulai:   row.jamMulai   || "",
      jamSelesai: row.jamSelesai || "",
      nukonfiden: row.nukonfiden || "",
      keterangan: row.keterangan || "",
    });
  };

  const saveEdit = async () => {
    setSaving(true);
    try {
      const [hm, mm] = editForm.jamMulai.split(":").map(Number);
      const [hs, ms] = editForm.jamSelesai.split(":").map(Number);
      const menit = (hs * 60 + ms) - (hm * 60 + mm);
      const jumlahJam = menit > 0 ? parseFloat((menit / 60).toFixed(1)) : 0;
      await updateDoc(doc(db, "lembur", editing.id), {
        tanggal:    editForm.tanggal,
        bulan:      editForm.tanggal.slice(0, 7),
        jamMulai:   editForm.jamMulai,
        jamSelesai: editForm.jamSelesai,
        jumlahJam,
        nukonfiden: editForm.nukonfiden,
        keterangan: editForm.keterangan,
      });
      setEditing(null);
      await loadAll();
    } catch (e) { console.error(e); }
    setSaving(false);
  };

  const hapus = async () => {
    setDeleting(true);
    try {
      await deleteDoc(doc(db, "lembur", confirmId));
      setAllData((prev) => prev.filter((d) => d.id !== confirmId));
      setConfirmId(null);
    } catch (e) { console.error(e); }
    setDeleting(false);
  };

  const setF = (k) => (e) => setEditForm({ ...editForm, [k]: e.target.value });

  return (
    <div>
      <div className="page-header">Data Lembur Karyawan</div>

      <div className="stats-row" style={{ gridTemplateColumns: "repeat(2,1fr)" }}>
        <div className="stat-card blue">
          <div className="stat-icon-box blue-bg">LBR</div>
          <div className="stat-info">
            <div className="stat-value">{filtered.length}</div>
            <div className="stat-label">Total Data Lembur</div>
          </div>
        </div>
        <div className="stat-card orange">
          <div className="stat-icon-box orange-bg">JAM</div>
          <div className="stat-info">
            <div className="stat-value">{totalJamAll} Jam</div>
            <div className="stat-label">Total Jam</div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="filter-row">
          <div className="form-group">
            <label>Bulan</label>
            <input
              type="month"
              value={filterMonth}
              onChange={(e) => setFilterMonth(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>Karyawan</label>
            <select value={filterUser} onChange={(e) => setFilterUser(e.target.value)}>
              <option value="">Semua</option>
              {users.map((u) => (
                <option key={u.uid} value={u.uid}>{u.nama}</option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="loading-msg">Memuat data...</div>
        ) : (
          <div className="table-wrap">
            <table className="tbl">
              <thead>
                <tr>
                  <th>No</th>
                  <th>Foto</th>
                  <th>Nama</th>
                  <th>NIP</th>
                  <th>Tanggal</th>
                  <th>Jam Mulai</th>
                  <th>Jam Selesai</th>
                  <th>Jumlah Jam</th>
                  <th>Total Jam (Bulan)</th>
                  <th>Nukonfiden</th>
                  <th>Bukti Foto</th>
                  <th>Keterangan</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={13} className="empty-cell">
                      Tidak ada data lembur untuk bulan {filterMonth}
                    </td>
                  </tr>
                ) : (
                  filtered.map((row, i) => (
                    <tr key={row.id}>
                      <td>{i + 1}</td>
                      <td>
                        {row.fotoURL
                          ? <img src={row.fotoURL} className="tbl-avatar" alt="" />
                          : <div className="tbl-avatar-placeholder">{row.nama?.[0]}</div>}
                      </td>
                      <td><strong>{row.nama}</strong></td>
                      <td>{row.nip}</td>
                      <td>{row.tanggal}</td>
                      <td><span className="time-badge green">{row.jamMulai}</span></td>
                      <td><span className="time-badge red">{row.jamSelesai}</span></td>
                      <td><strong>{row.jumlahJam} Jam</strong></td>
                      <td>
                        <span className="badge badge-purple">
                          {totalPerUser[row.uid] || 0} Jam
                        </span>
                      </td>
                      <td><code className="kode-box">{row.nukonfiden}</code></td>
                      <td>
                        {row.fotoBukti
                          ? <img src={row.fotoBukti} className="tbl-avatar bukti-thumb" alt="bukti"
                              onClick={() => setSelected(row)} />
                          : <span className="text-muted">-</span>}
                      </td>
                      <td>{row.keterangan || <span className="text-muted">-</span>}</td>
                      <td>
                        <div className="aksi-btns">
                          <button className="btn-detail" onClick={() => setSelected(row)}>Detail</button>
                          <button className="btn-edit"   onClick={() => openEdit(row)}>Edit</button>
                          <button className="btn-hapus" onClick={() => setConfirmId(row.id)}>
                            Hapus
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
        <div className="table-footer">Total: {filtered.length} data</div>
      </div>

      {/* Modal Detail */}
      {selected && (
        <div className="modal-overlay" onClick={() => setSelected(null)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Detail Lembur</h3>
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
                  <span className="detail-value">{selected.tanggal}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Nukonfiden</span>
                  <code className="kode-box">{selected.nukonfiden}</code>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Jam Mulai</span>
                  <span className="detail-value val-green">{selected.jamMulai}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Jam Selesai</span>
                  <span className="detail-value val-red">{selected.jamSelesai}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Jumlah Jam</span>
                  <strong>{selected.jumlahJam} Jam</strong>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Total Jam Bulan Ini</span>
                  <span className="badge badge-purple">
                    {totalPerUser[selected.uid] || 0} Jam
                  </span>
                </div>
                <div className="detail-item full">
                  <span className="detail-label">Keterangan</span>
                  <span className="detail-value">{selected.keterangan || "-"}</span>
                </div>
              </div>
              <div className="detail-foto-section">
                <div className="detail-foto-title">Foto Bukti Lembur</div>
                {selected.fotoBukti
                  ? <div className="detail-foto-box">
                      <a href={selected.fotoBukti} target="_blank" rel="noreferrer">
                        <img src={selected.fotoBukti} className="detail-foto-img" alt="bukti" />
                        <small>Klik untuk perbesar</small>
                      </a>
                    </div>
                  : <div className="detail-foto-empty">Tidak ada foto bukti</div>}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setSelected(null)}>Tutup</button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL EDIT LEMBUR ── */}
      {editing && (
        <div className="modal-overlay" onClick={() => setEditing(null)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Edit Lembur — {editing.nama}</h3>
              <button className="modal-close" onClick={() => setEditing(null)}>&#10005;</button>
            </div>
            <div className="modal-body">
              <div className="form-row">
                <div className="form-group">
                  <label>Tanggal</label>
                  <input type="date" value={editForm.tanggal} onChange={setF("tanggal")} />
                </div>
                <div className="form-group">
                  <label>Nukonfiden</label>
                  <input type="text" value={editForm.nukonfiden} onChange={setF("nukonfiden")}
                    placeholder="Kode/Numenklatur" />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Jam Mulai</label>
                  <input type="time" value={editForm.jamMulai} onChange={setF("jamMulai")} />
                </div>
                <div className="form-group">
                  <label>Jam Selesai</label>
                  <input type="time" value={editForm.jamSelesai} onChange={setF("jamSelesai")} />
                </div>
              </div>
              {editForm.jamMulai && editForm.jamSelesai && (() => {
                const [hm,mm] = editForm.jamMulai.split(":").map(Number);
                const [hs,ms] = editForm.jamSelesai.split(":").map(Number);
                const menit   = (hs*60+ms)-(hm*60+mm);
                return menit > 0
                  ? <div className="jam-result-box">Jumlah Jam: <strong>{(menit/60).toFixed(1)} Jam</strong></div>
                  : null;
              })()}
              <div className="form-group">
                <label>Keterangan</label>
                <input type="text" value={editForm.keterangan} onChange={setF("keterangan")}
                  placeholder="Keterangan lembur..." />
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
        title="Hapus Data Lembur"
        message="Data lembur ini akan dihapus permanen dan tidak bisa dikembalikan."
        onConfirm={hapus}
        onCancel={() => setConfirmId(null)}
        loading={deleting}
      />
    </div>
  );
}
