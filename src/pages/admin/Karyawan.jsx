// pages/admin/Karyawan.jsx
import { useEffect, useState } from "react";
import { collection, getDocs, query, where, updateDoc, doc } from "firebase/firestore";
import { db } from "../../lib/firebase";

export default function AdminKaryawan() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = async () => {
    setLoading(true);
    const snap = await getDocs(query(collection(db, "users"), where("role", "==", "user")));
    setUsers(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    setLoading(false);
  };

  const toggleStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === "aktif" ? "nonaktif" : "aktif";
    await updateDoc(doc(db, "users", id), { status: newStatus });
    fetchUsers();
  };

  return (
    <div>
      <div className="page-header">Daftar Karyawan</div>
      <div className="card">
        <div className="card-header-bar">
          <span className="count-badge">Total: {users.length} / 4 karyawan</span>
        </div>
        {loading ? (
          <div className="loading-msg">Memuat...</div>
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
                  <th>Status</th>
                  <th>Terdaftar</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr><td colSpan={9} className="empty-cell">Belum ada karyawan</td></tr>
                ) : (
                  users.map((u, i) => (
                    <tr key={u.id}>
                      <td>{i + 1}</td>
                      <td>
                        {u.fotoURL ? (
                          <img src={u.fotoURL} className="tbl-avatar" alt="foto" />
                        ) : (
                          <div className="tbl-avatar-placeholder">{u.nama?.[0]}</div>
                        )}
                      </td>
                      <td><strong>{u.nama}</strong></td>
                      <td>{u.nip}</td>
                      <td>{u.jabatan}</td>
                      <td>{u.email}</td>
                      <td>
                        <span className={`badge ${u.status !== "nonaktif" ? "badge-green" : "badge-red"}`}>
                          {u.status !== "nonaktif" ? "Aktif" : "Nonaktif"}
                        </span>
                      </td>
                      <td>{u.createdAt ? u.createdAt.slice(0, 10) : "-"}</td>
                      <td>
                        <button
                          className={`btn btn-sm ${u.status !== "nonaktif" ? "btn-danger" : "btn-success"}`}
                          onClick={() => toggleStatus(u.id, u.status !== "nonaktif" ? "aktif" : "nonaktif")}
                        >
                          {u.status !== "nonaktif" ? "Nonaktifkan" : "Aktifkan"}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
