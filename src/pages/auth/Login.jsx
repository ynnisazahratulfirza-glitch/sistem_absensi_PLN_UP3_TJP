// pages/auth/Login.jsx - FINAL FIX
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
      // Login ke Firebase Auth
      const cred = await signInWithEmailAndPassword(auth, email, password);

      // Tunggu sebentar agar Firestore sync
      await sleep(300);

      // Coba ambil dokumen user — retry sampai 3x
      let snap = null;
      for (let i = 0; i < 3; i++) {
        snap = await getDoc(doc(db, "users", cred.user.uid));
        if (snap.exists()) break;
        await sleep(500);
      }

      // Masih tidak ada setelah retry
      if (!snap || !snap.exists()) {
        // Cek apakah ini admin (email admin hardcoded sebagai fallback)
        if (email === "admin@gmail.com") {
          // Buat dokumen admin jika belum ada
          await setDoc(doc(db, "users", cred.user.uid), {
            uid: cred.user.uid,
            nama: "Administrator",
            nip: "ADMIN001",
            jabatan: "Administrator Sistem",
            email: "admin@gmail.com",
            role: "admin",
            status: "aktif",
            fotoURL: "",
            createdAt: new Date().toISOString(),
          });
          navigate("/admin", { replace: true });
          return;
        }
        await signOut(auth);
        setError("Data akun tidak ditemukan. Silakan daftar ulang.");
        setLoading(false);
        return;
      }

      const data = snap.data();

      // Cek status akun
      if (data.status === "nonaktif" || data.status === "deleted") {
        await signOut(auth);
        setError("Akun Anda telah dinonaktifkan. Hubungi admin.");
        setLoading(false);
        return;
      }

      // Sukses
      navigate(data.role === "admin" ? "/admin" : "/user", { replace: true });

    } catch (err) {
      console.error("Login error:", err.code, err.message);
      const code = err.code;
      if (
        code === "auth/user-not-found" ||
        code === "auth/wrong-password" ||
        code === "auth/invalid-credential" ||
        code === "auth/invalid-email"
      ) {
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
