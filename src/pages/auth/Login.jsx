// pages/auth/Login.jsx
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../../lib/firebase";

export default function Login() {
  const navigate  = useNavigate();
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error,    setError]    = useState("");
  const [loading,  setLoading]  = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      const snap = await getDoc(doc(db, "users", cred.user.uid));

      // Akun tidak ada di Firestore
      if (!snap.exists()) {
        await signOut(auth);
        setError("Email atau password tidak terdaftar.");
        setLoading(false);
        return;
      }

      const data = snap.data();

      // Akun nonaktif atau deleted
      if (data.status === "nonaktif" || data.status === "deleted") {
        await signOut(auth);
        setError("Akun Anda telah dinonaktifkan. Hubungi admin.");
        setLoading(false);
        return;
      }

      // Sukses — arahkan sesuai role
      navigate(data.role === "admin" ? "/admin" : "/user", { replace: true });

    } catch (err) {
      // Firebase error: wrong password / email not found
      const code = err.code;
      if (
        code === "auth/user-not-found" ||
        code === "auth/wrong-password" ||
        code === "auth/invalid-credential" ||
        code === "auth/invalid-email"
      ) {
        setError("Email atau password tidak terdaftar.");
      } else {
        setError("Gagal masuk. Periksa koneksi internet Anda.");
      }
      setLoading(false);
    }
  };

  return (
    <div className="auth-card">
      <h2>Selamat Datang</h2>
      <p className="auth-sub">Masuk ke akun Anda</p>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Email</label>
          <input
            type="email"
            placeholder="email@gmail.com"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setError(""); }}
            required
          />
        </div>

        <div className="form-group">
          <label>Password</label>
          <div className="input-wrap">
            <input
              type={showPass ? "text" : "password"}
              placeholder="Masukkan password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(""); }}
              required
            />
            <button type="button" className="eye-btn" onClick={() => setShowPass(!showPass)}>
              {showPass ? "Sembunyikan" : "Tampilkan"}
            </button>
          </div>
        </div>

        {/* Pesan error */}
        {error && (
          <div className="alert alert-error" style={{ marginBottom: 12 }}>
            {error}
          </div>
        )}

        <button type="submit" className="btn btn-primary w-full" disabled={loading}>
          {loading ? "Memeriksa..." : "Masuk"}
        </button>
      </form>

      <p className="auth-switch">
        Belum punya akun? <Link to="/register">Daftar Sekarang</Link>
      </p>
    </div>
  );
}
