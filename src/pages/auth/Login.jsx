import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "../../lib/firebase";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

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
      const uid  = cred.user.uid;

      // Cek apakah ada data pending dari register
      const pending = localStorage.getItem("pendingUserData");
      if (pending) {
        try {
          const userData = JSON.parse(pending);
          if (userData.uid === uid) {
            await setDoc(doc(db, "users", uid), userData);
            localStorage.removeItem("pendingUserData");
          }
        } catch (e) {
          console.error("Failed to save pending user data:", e);
        }
      }

      // Ambil data user dengan retry
      let snap = null;
      for (let i = 0; i < 4; i++) {
        snap = await getDoc(doc(db, "users", uid));
        if (snap.exists()) break;
        await sleep(500);
      }

      if (!snap || !snap.exists()) {
        await signOut(auth);
        setError("Data akun tidak ditemukan. Silakan daftar ulang.");
        setLoading(false);
        return;
      }

      const data = snap.data();
      if (data.status === "nonaktif" || data.status === "deleted") {
        await signOut(auth);
        setError("Akun Anda telah dinonaktifkan. Hubungi admin.");
        setLoading(false);
        return;
      }

      navigate(data.role === "admin" ? "/admin" : "/user", { replace: true });

    } catch (err) {
      const code = err.code;
      if (code === "auth/user-not-found" || code === "auth/wrong-password" ||
          code === "auth/invalid-credential" || code === "auth/invalid-email") {
        setError("Email atau password salah.");
      } else if (code === "auth/too-many-requests") {
        setError("Terlalu banyak percobaan. Tunggu beberapa menit.");
      } else {
        setError("Gagal login: " + (code || err.message));
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

        {error && (
          <div className="alert alert-error">{error}</div>
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
