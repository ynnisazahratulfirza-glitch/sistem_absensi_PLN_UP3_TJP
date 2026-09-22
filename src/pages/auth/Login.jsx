// pages/auth/Login.jsx
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../../lib/firebase";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      const snap = await getDoc(doc(db, "users", cred.user.uid));
      if (!snap.exists()) {
        setError("Akun tidak ditemukan.");
        return;
      }
      const data = snap.data();
      if (data.status === "nonaktif") {
        setError("Akun Anda telah dinonaktifkan. Hubungi admin.");
        return;
      }
      const role = data.role;
      navigate(role === "admin" ? "/admin" : "/user", { replace: true });
    } catch (err) {
      setError("Email atau password salah. Silakan coba lagi.");
    } finally {
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
            onChange={(e) => setEmail(e.target.value)}
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
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button type="button" className="eye-btn" onClick={() => setShowPass(!showPass)}>
              {showPass ? "Sembunyikan" : "Tampilkan"}
            </button>
          </div>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <button type="submit" className="btn btn-primary w-full" disabled={loading}>
          {loading ? "Memuat..." : "Masuk"}
        </button>
      </form>

      <p className="auth-switch">
        Belum punya akun? <Link to="/register">Daftar Sekarang</Link>
      </p>
    </div>
  );
}
