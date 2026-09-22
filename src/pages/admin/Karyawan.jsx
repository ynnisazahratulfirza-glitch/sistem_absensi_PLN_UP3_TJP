// pages/admin/Karyawan.jsx
import { useEffect, useState } from "react";
import { collection, getDocs, updateDoc, doc } from "firebase/firestore";
import { db } from "../../lib/firebase";
import ConfirmDialog from "../../components/ConfirmDialog";

export default function AdminKaryawan() {
  const [users, setUsers]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [confirm, setConfirm]     = useState(null); // { type, id, nama }
  const [processing, setProcessing] = useState(false);

  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, "users"));
      const list = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .filter((u) => u.role === "user" && u.status !== "deleted")
        .sort((a, b) => (a.nama || "").localeCompare(b.nama || ""));
      setUsers(list);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  // Toggle aktif / nonaktif
  const handleToggle = async () => {
    setProcessing(true);
    try {
      const user   = users.find((u) => u.id === confirm.id);
      const newStatus = user.status === "nonaktif" ? "aktif" : "nonaktif";
      await updateDoc(doc(db, "users", confirm.id), { status: newStatus });
      await fetchUsers();
      setConfirm(null);
    } catch (e) { console.error(e); }
    setProcessing(false);
  };

  // Hapus user - tandai deleted di Firestore (Auth tidak bisa dihapus dari client)
  const handleHapus = async () => {
    setProcessing(true);
    try {
      // Tandai sebagai deleted agar tidak bisa login
      await updateDoc(doc(db, "users", confirm.id), {
        status: "deleted",
        deletedAt: new Date().toISOString(),
      });
      await fetchUsers();
      setConfirm(null);
    } catch (e) { console.error(e); }
    setProcessing(false);
  };

  const isAktif = (u) => u.status !== "nonaktif";

  return (
    <div>
      <div className="page-header">Daftar Karyawan</div>

      {/* Summary */}
      <div className="stats-row" style={{ gridTemplateColumns: "repeat(3,1fr)" }}>
        <div className="stat-card blue">
          <div className="stat-icon-box blue-bg">ALL</div>
          <div className="stat-info">
            <div className="stat-value">{users.length}</div>
            <div className="stat-label">Total Karyawan</div>
          </div>
        </div>
        <div className="stat-card green">
          <div className="stat-icon-box green-bg">AKT</div>
          <div className="stat-info">
            <div className="stat-value">{users.filter(isAktif).length}</div>
            <div className="stat-label">Aktif</div>
          </div>
        </div>
        <div className="stat-card red">
          <div className="stat-icon-box red-bg">OFF</div>
          <div className="stat-info">
            <div className="stat-value">{users.filter((u) => !isAktif(u)).length}</div>
            <div className="stat-label">Nonaktif</div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header-bar">
          <span className="count-badge">
            {users.length} / 4 slot terpakai
          </span>
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
                  <th>Jabatan</th>
                  <th>Email</th>
                  <th>Terdaftar</th>
                  <th>Status</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="empty-cell">
                      Belum ada karyawan terdaftar
                    </td>
                  </tr>
                ) : (
                  users.map((u, i) => (
                    <tr key={u.id}>
                      <td>{i + 1}</td>
                      <td>
                        {u.fotoURL
                          ? <img src={u.fotoURL} className="tbl-avatar" alt="" />
                          : <div className="tbl-avatar-placeholder">{u.nama?.[0]}</div>}
                      </td>
                      <td><strong>{u.nama}</strong></td>
                      <td>{u.nip}</td>
                      <td>{u.jabatan}</td>
                      <td>{u.email}</td>
                      <td>
                        <span className="text-muted" style={{ fontSize: 12 }}>
                          {u.createdAt ? u.createdAt.slice(0, 10) : "-"}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${isAktif(u) ? "badge-green" : "badge-red"}`}>
                          {isAktif(u) ? "Aktif" : "Nonaktif"}
                        </span>
                      </td>
                      <td>
                        <div className="aksi-btns">
                          {/* Toggle Aktif/Nonaktif */}
                          <button
                            className={isAktif(u) ? "btn-edit" : "btn-detail"}
                            onClick={() => setConfirm({
                              type: "toggle",
                              id: u.id,
                              nama: u.nama,
                              aktif: isAktif(u),
                            })}
                          >
                            {isAktif(u) ? "Nonaktifkan" : "Aktifkan"}
                          </button>

                          {/* Hapus */}
                          <button
                            className="btn-hapus"
                            onClick={() => setConfirm({
                              type: "hapus",
                              id: u.id,
                              nama: u.nama,
                            })}
                          >
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
      </div>

      {/* Confirm Toggle */}
      {confirm?.type === "toggle" && (
        <ConfirmDialog
          show={true}
          title={confirm.aktif ? "Nonaktifkan Karyawan" : "Aktifkan Karyawan"}
          message={
            confirm.aktif
              ? `${confirm.nama} akan dinonaktifkan dan tidak bisa login.`
              : `${confirm.nama} akan diaktifkan kembali.`
          }
          onConfirm={handleToggle}
          onCancel={() => setConfirm(null)}
          loading={processing}
          confirmLabel={confirm.aktif ? "Ya, Nonaktifkan" : "Ya, Aktifkan"}
          danger={confirm.aktif}
        />
      )}

      {/* Confirm Hapus */}
      {confirm?.type === "hapus" && (
        <ConfirmDialog
          show={true}
          title="Hapus Karyawan"
          message={`Data karyawan ${confirm.nama} akan dihapus permanen. Tindakan tidak bisa dibatalkan.`}
          onConfirm={handleHapus}
          onCancel={() => setConfirm(null)}
          loading={processing}
        />
      )}
    </div>
  );
}
