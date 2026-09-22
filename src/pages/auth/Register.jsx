// pages/auth/Register.jsx
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "../../lib/firebase";

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    nama: "", nip: "", jabatan: "", email: "", password: "", password2: "",
  });
  const [error,    setError]    = useState("");
  const [success,  setSuccess]  = useState("");
  const [loading,  setLoading]  = useState(false);
  const [showPass, setShowPass] = useState(false);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); setSuccess("");

    if (form.password !== form.password2) return setError("Password tidak sama!");
    if (form.password.length < 6) return setError("Password minimal 6 karakter!");

    setLoading(true);
    try {
      // 1. Buat akun Firebase Auth
      const cred = await createUserWithEmailAndPassword(auth, form.email, form.password);

      // 2. Simpan data ke Firestore (simpel, tanpa query dulu)
      await setDoc(doc(db, "users", cred.user.uid), {
        uid:       cred.user.uid,
        nama:      form.nama,
        nip:       form.nip,
        jabatan:   form.jabatan,
        email:     form.email,
        role:      "user",
        status:    "aktif",
        fotoURL:   "",
        createdAt: new Date().toISOString(),
      });

      setSuccess("Akun berhasil dibuat! Mengarahkan ke halaman login...");
      setTimeout(() => navigate("/login"), 2000);

    } catch (err) {
      console.error("Register error:", err.code, err.message);
      if (err.code === "auth/email-already-in-use") {
        setError("Email sudah terdaftar. Silakan login atau gunakan email lain.");
      } else if (err.code === "auth/invalid-email") {
        setError("Format email tidak valid!");
      } else if (err.code === "auth/weak-password") {
        setError("Password terlalu lemah. Gunakan minimal 6 karakter.");
      } else if (err.code === "auth/network-request-failed") {
        setError("Tidak ada koneksi internet. Coba lagi.");
      } else {
        setError("Gagal mendaftar (" + (err.code || err.message) + ")");
      }
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
            <input type="text" placeholder="Nama lengkap"
              value={form.nama} onChange={set("nama")} required />
          </div>
          <div className="form-group">
            <label>NIP / ID Karyawan</label>
            <input type="text" placeholder="NIP001"
              value={form.nip} onChange={set("nip")} required />
          </div>
        </div>

        <div className="form-group">
          <label>Jabatan</label>
          <input type="text" placeholder="Contoh: Teknisi Listrik"
            value={form.jabatan} onChange={set("jabatan")} required />
        </div>

        <div className="form-group">
          <label>Email</label>
          <input type="email" placeholder="email@gmail.com"
            value={form.email} onChange={set("email")} required />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Password</label>
            <div className="input-wrap">
              <input type={showPass ? "text" : "password"} placeholder="Min. 6 karakter"
                value={form.password} onChange={set("password")} required minLength={6} />
              <button type="button" className="eye-btn" onClick={() => setShowPass(!showPass)}>
                {showPass ? "Sembunyikan" : "Tampilkan"}
              </button>
            </div>
          </div>
          <div className="form-group">
            <label>Konfirmasi Password</label>
            <div className="input-wrap">
              <input type={showPass ? "text" : "password"} placeholder="Ulangi password"
                value={form.password2} onChange={set("password2")} required />
            </div>
          </div>
        </div>

        {error   && <div className="alert alert-error">{error}</div>}
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
