// SeedAdmin.jsx - Buat akun admin pertama kali
// Akses: /seed-admin (hapus route ini setelah admin dibuat)
import { useState } from "react";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { auth, db } from "../../lib/firebase";

export default function SeedAdmin() {
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  const createAdmin = async () => {
    setLoading(true);
    setStatus("");
    try {
      let uid;
      try {
        const cred = await createUserWithEmailAndPassword(auth, "admin@gmail.com", "adminplnup3");
        uid = cred.user.uid;
      } catch (err) {
        if (err.code === "auth/email-already-in-use") {
          const cred = await signInWithEmailAndPassword(auth, "admin@gmail.com", "adminplnup3");
          uid = cred.user.uid;
        } else throw err;
      }

      await setDoc(doc(db, "users", uid), {
        uid,
        nama: "Administrator",
        nip: "ADMIN001",
        jabatan: "Administrator Sistem",
        email: "admin@gmail.com",
        role: "admin",
        fotoURL: "",
        createdAt: new Date().toISOString(),
      }, { merge: true });

      setStatus("sukses");
    } catch (err) {
      setStatus("error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center",
      justifyContent: "center", background: "#f5f6fa", fontFamily: "Segoe UI, sans-serif"
    }}>
      <div style={{
        background: "white", borderRadius: 16, padding: 40,
        maxWidth: 460, width: "100%", boxShadow: "0 4px 24px rgba(0,0,0,.1)", textAlign: "center"
      }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>
          <img src="/vite.svg" style={{ width: 48 }} alt="" />
        </div>
        <h2 style={{ color: "#1e3a8a", marginBottom: 8 }}>Setup Admin</h2>
        <p style={{ color: "#718096", marginBottom: 24 }}>
          Klik tombol di bawah untuk membuat akun admin sistem.
        </p>

        {status === "sukses" ? (
          <div>
            <div style={{
              background: "#f0fdf4", border: "1px solid #bbf7d0",
              borderRadius: 10, padding: 16, marginBottom: 20, color: "#16a34a"
            }}>
              Akun admin berhasil dibuat / diperbarui!<br />
              <strong>Email:</strong> admin@gmail.com<br />
              <strong>Password:</strong> adminplnup3
            </div>
            <a href="/login" style={{
              display: "block", background: "#1e3a8a", color: "white",
              padding: "12px 24px", borderRadius: 10, textDecoration: "none", fontWeight: 600
            }}>
              Pergi ke Halaman Login
            </a>
          </div>
        ) : (
          <>
            {status && status.startsWith("error") && (
              <div style={{
                background: "#fef2f2", border: "1px solid #fecaca",
                borderRadius: 10, padding: 12, marginBottom: 16, color: "#dc2626", fontSize: 13
              }}>
                {status}
              </div>
            )}
            <button
              onClick={createAdmin}
              disabled={loading}
              style={{
                width: "100%", padding: "13px 24px", background: "#1e3a8a",
                color: "white", border: "none", borderRadius: 10,
                fontSize: 15, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.7 : 1
              }}
            >
              {loading ? "Memproses..." : "Buat Akun Admin"}
            </button>
            <p style={{ marginTop: 12, fontSize: 12, color: "#a0aec0" }}>
              Hapus route /seed-admin setelah selesai.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
