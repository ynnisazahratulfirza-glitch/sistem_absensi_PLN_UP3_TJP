// pages/user/Lembur.jsx
import { useEffect, useState } from "react";
import { collection, getDocs, query, where, addDoc, deleteDoc, doc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "../../lib/firebase";

export default function UserLembur() {
  const [user, setUser] = useState(null);
  const [form, setForm] = useState({ tanggal: "", mulai: "", selesai: "", nukonfiden: "", keterangan: "" });
  const [foto, setFoto] = useState(null);
  const [fotoPreview, setFotoPreview] = useState(null);
  const [jumlahJam, setJumlahJam] = useState(null);
  const [riwayat, setRiwayat] = useState([]);
  const [totalJam, setTotalJam] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const bulanIni = new Date().toISOString().slice(0, 7);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) return;
      const snap = await getDocs(query(collection(db, "users"), where("uid", "==", u.uid)));
      if (!snap.empty) setUser(snap.docs[0].data());
      await fetchRiwayat(u.uid);
    });
    return () => unsub();
  }, []);

  const fetchRiwayat = async (uid) => {
    try {
      // Tanpa orderBy untuk hindari butuh composite index
      const snap = await getDocs(
        query(collection(db, "lembur"),
          where("uid", "==", uid),
          where("bulan", "==", bulanIni))
      );
      const data = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .sort((a, b) => b.tanggal.localeCompare(a.tanggal)); // sort di client
      setRiwayat(data);
      setTotalJam(data.reduce((s, d) => s + (d.jumlahJam || 0), 0));
    } catch (e) {
      console.error("fetchRiwayat error:", e);
    }
  };

  const set = (k) => (e) => {
    const newForm = { ...form, [k]: e.target.value };
    setForm(newForm);
    if ((k === "mulai" || k === "selesai") && newForm.mulai && newForm.selesai) {
      const [hm, mm] = newForm.mulai.split(":").map(Number);
      const [hs, ms] = newForm.selesai.split(":").map(Number);
      const totalMenit = (hs * 60 + ms) - (hm * 60 + mm);
      setJumlahJam(totalMenit > 0 ? (totalMenit / 60).toFixed(1) : null);
    }
  };

  const handleFoto = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX = 600;
        let w = img.width, h = img.height;
        if (w > MAX) { h = (h * MAX) / w; w = MAX; }
        canvas.width = w; canvas.height = h;
        canvas.getContext("2d").drawImage(img, 0, 0, w, h);
        const base64 = canvas.toDataURL("image/jpeg", 0.7);
        setFoto(base64); setFotoPreview(base64);
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); setSuccess("");
    if (!jumlahJam || Number(jumlahJam) <= 0) return setError("Jam selesai harus lebih dari jam mulai.");
    setLoading(true);
    try {
      await addDoc(collection(db, "lembur"), {
        uid: user.uid,
        tanggal: form.tanggal,
        bulan: form.tanggal.slice(0, 7),
        jamMulai: form.mulai,
        jamSelesai: form.selesai,
        jumlahJam: Number(jumlahJam),
        nukonfiden: form.nukonfiden,
        keterangan: form.keterangan,
        fotoBukti: foto || "",
        createdAt: new Date().toISOString(),
      });
      // Reset form dulu
      setForm({ tanggal: "", mulai: "", selesai: "", nukonfiden: "", keterangan: "" });
      setFoto(null); setFotoPreview(null); setJumlahJam(null);
      // Ambil riwayat terbaru
      await fetchRiwayat(user.uid);
      // Tampilkan sukses setelah semua selesai
      setSuccess("Data lembur berhasil disimpan.");
    } catch (err) {
      console.error(err);
      setError("Gagal menyimpan data lembur: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const hapus = async (id) => {
    if (!window.confirm("Hapus data lembur ini?")) return;
    await deleteDoc(doc(db, "lembur", id));
    await fetchRiwayat(user.uid);
  };

  return (
    <div>
      <div className="page-header">Input Lembur</div>

      <div className="lembur-layout">
        {/* Form */}
        <div className="card">
          <div className="card-title">Form Input Lembur</div>
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label>Tanggal Lembur</label>
                <input type="date" value={form.tanggal} onChange={set("tanggal")} required />
              </div>
              <div className="form-group">
                <label>Nukonfiden</label>
                <input type="text" placeholder="Kode / Numenklatur" value={form.nukonfiden} onChange={set("nukonfiden")} required />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Jam Mulai Lembur</label>
                <input type="time" value={form.mulai} onChange={set("mulai")} required />
              </div>
              <div className="form-group">
                <label>Jam Selesai Lembur</label>
                <input type="time" value={form.selesai} onChange={set("selesai")} required />
              </div>
            </div>

            {jumlahJam && (
              <div className="jam-result-box">
                Jumlah Jam Lembur: <strong>{jumlahJam} Jam</strong>
              </div>
            )}

            {/* Upload Foto */}
            <div className="form-group">
              <label>Foto Bukti Lembur <span style={{ color: "#a0aec0", fontWeight: 400 }}>(opsional)</span></label>
              <div className="foto-bukti-wrap">
                {fotoPreview ? (
                  <img src={fotoPreview} className="foto-bukti-preview" alt="preview" />
                ) : (
                  <div className="foto-bukti-empty" onClick={() => document.getElementById("foto-bukti-input").click()}>
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5">
                      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                      <circle cx="12" cy="13" r="4"/>
                    </svg>
                    <small>Klik untuk upload</small>
                  </div>
                )}
                <input type="file" id="foto-bukti-input" accept="image/*" onChange={handleFoto} style={{ display: "none" }} />
              </div>
              <label className="btn btn-outline btn-sm" style={{ marginTop: 8, cursor: "pointer" }}
                onClick={() => document.getElementById("foto-bukti-input").click()}>
                {fotoPreview ? "Ganti Foto" : "Pilih Foto Bukti"}
              </label>
            </div>

            <div className="form-group">
              <label>Keterangan Lembur</label>
              <textarea rows={2} placeholder="Deskripsi pekerjaan lembur..."
                value={form.keterangan} onChange={set("keterangan")} />
            </div>

            {error && <div className="alert alert-error">{error}</div>}
            {success && <div className="alert alert-success">{success}</div>}

            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? "Menyimpan..." : "Simpan Lembur"}
            </button>
          </form>
        </div>
      </div>

      {/* Riwayat */}
      <div className="card" style={{ marginTop: 20 }}>
        <div className="card-title">Riwayat Lembur Bulan Ini</div>
        <div className="total-bar">
          Total jam lembur bulan ini: <strong>{totalJam} Jam</strong>
          <span style={{ marginLeft: 8, color: "#718096" }}>({riwayat.length} kali)</span>
        </div>
        <div className="table-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th>Tanggal</th>
                <th>Jam Mulai</th>
                <th>Jam Selesai</th>
                <th>Jumlah Jam</th>
                <th>Nukonfiden</th>
                <th>Foto Bukti</th>
                <th>Keterangan</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {riwayat.length === 0 ? (
                <tr><td colSpan={8} className="empty-cell">Belum ada data lembur bulan ini</td></tr>
              ) : (
                riwayat.map((r) => (
                  <tr key={r.id}>
                    <td>{r.tanggal}</td>
                    <td><span className="time-badge green">{r.jamMulai}</span></td>
                    <td><span className="time-badge red">{r.jamSelesai}</span></td>
                    <td><strong>{r.jumlahJam} Jam</strong></td>
                    <td><code className="kode-box">{r.nukonfiden}</code></td>
                    <td>
                      {r.fotoBukti ? (
                        <a href={r.fotoBukti} target="_blank" rel="noreferrer">
                          <img src={r.fotoBukti} className="tbl-avatar bukti-thumb" alt="bukti" />
                        </a>
                      ) : <span className="text-muted">-</span>}
                    </td>
                    <td>{r.keterangan || <span className="text-muted">-</span>}</td>
                    <td>
                      <button className="btn btn-danger btn-sm" onClick={() => hapus(r.id)}>Hapus</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
