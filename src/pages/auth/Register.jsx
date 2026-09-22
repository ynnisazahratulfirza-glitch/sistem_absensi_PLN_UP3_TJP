// pages/auth/Register.jsx
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, collection, getDocs, query, where } from "firebase/firestore";
import { auth, db } from "../../lib/firebase";

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    nama: "", nip: "", jabatan: "", email: "", password: "", password2: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); setSuccess("");

    if (form.password !== form.password2) return setError("Password tidak sama!");
    if (form.password.length < 6) return setError("Password minimal 6 karakter!");

    const usersSnap = await getDocs(query(collection(db, "users"), where("role", "==", "user")));
    if (usersSnap.size >= 4) return setError("Batas maksimal 4 user sudah tercapai. Hubungi admin.");

    const nipSnap = await getDocs(query(collection(db, "users"), where("nip", "==", form.nip)));
    if (!nipSnap.empty) return setError("NIP sudah terdaftar!");

    setLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, form.email, form.password);
      await setDoc(doc(db, "users", cred.user.uid), {
        uid: cred.user.uid,
        nama: form.nama,
        nip: form.nip,
        jabatan: form.jabatan,
        email: form.email,
        role: "user",
        fotoURL: "",
        createdAt: new Date().toISOString(),
      });
      setSuccess("Akun berhasil dibuat! Mengarahkan ke halaman login...");
      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      if (err.code === "auth/email-already-in-use") setError("Email sudah terdaftar!");
      else setError("Gagal mendaftar. Coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-card">
      <h2>Buat Akun Baru</h2>
      <p className="auth-sub">Isi data diri dengan benar</p>

      <form onSubmit={handleSubmit}>
        <div className="form-row">
          <div className="form-group">
            <label>Nama Lengkap</label>
            <input type="text" placeholder="Nama lengkap" value={form.nama} onChange={set("nama")} required />
          </div>
          <div className="form-group">
            <label>NIP / ID Karyawan</label>
            <input type="text" placeholder="NIP001" value={form.nip} onChange={set("nip")} required />
          </div>
        </div>

        <div className="form-group">
          <label>Jabatan</label>
          <input type="text" placeholder="Contoh: Teknisi Listrik" value={form.jabatan} onChange={set("jabatan")} required />
        </div>

        <div className="form-group">
          <label>Email</label>
          <input type="email" placeholder="email@gmail.com" value={form.email} onChange={set("email")} required />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Password</label>
            <div className="input-wrap">
              <input
                type={showPass ? "text" : "password"}
                placeholder="Min. 6 karakter"
                value={form.password}
                onChange={set("password")}
                required minLength={6}
              />
              <button type="button" className="eye-btn" onClick={() => setShowPass(!showPass)}>
                {showPass ? "Sembunyikan" : "Tampilkan"}
              </button>
            </div>
          </div>
          <div className="form-group">
            <label>Konfirmasi Password</label>
            <div className="input-wrap">
              <input
                type={showPass ? "text" : "password"}
                placeholder="Ulangi password"
                value={form.password2}
                onChange={set("password2")}
                required
              />
            </div>
          </div>
        </div>

        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <button type="submit" className="btn btn-primary w-full" disabled={loading}>
          {loading ? "Mendaftar..." : "Daftar"}
        </button>
      </form>

      <p className="auth-switch">
        Sudah punya akun? <Link to="/login">Masuk di sini</Link>
      </p>
    </div>
  );
}
