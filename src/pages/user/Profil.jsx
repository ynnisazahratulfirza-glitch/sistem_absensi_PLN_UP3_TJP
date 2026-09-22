// pages/user/Profil.jsx
import { useEffect, useState } from "react";
import { collection, getDocs, query, where, updateDoc, doc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "../../lib/firebase";

export default function UserProfil() {
  const [userData, setUserData] = useState(null);
  const [docId, setDocId] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) return;
      const snap = await getDocs(query(collection(db, "users"), where("uid", "==", u.uid)));
      if (!snap.empty) {
        setUserData(snap.docs[0].data());
        setDocId(snap.docs[0].id);
      }
    });
    return () => unsub();
  }, []);

  const handleFoto = async (e) => {
    const file = e.target.files[0];
    if (!file || !docId) return;
    setUploading(true);
    try {
      // Compress ke Base64
      const reader = new FileReader();
      reader.onload = async (ev) => {
        const img = new Image();
        img.onload = async () => {
          const canvas = document.createElement("canvas");
          const MAX = 400;
          let w = img.width, h = img.height;
          if (w > MAX) { h = (h * MAX) / w; w = MAX; }
          canvas.width = w; canvas.height = h;
          canvas.getContext("2d").drawImage(img, 0, 0, w, h);
          const base64 = canvas.toDataURL("image/jpeg", 0.75);
          await updateDoc(doc(db, "users", docId), { fotoURL: base64 });
          setUserData({ ...userData, fotoURL: base64 });
          setMsg("Foto profil berhasil diperbarui!");
          setUploading(false);
        };
        img.src = ev.target.result;
      };
      reader.readAsDataURL(file);
    } catch {
      setMsg("Gagal upload foto.");
      setUploading(false);
    }
  };

  const initials = userData?.nama
    ? userData.nama.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2)
    : "U";

  return (
    <div>
      <div className="page-header">Profil Saya</div>
      <div className="card profil-wrap">
        <div className="profil-top">

          {/* Foto Profil */}
          <div className="profil-photo-box">
            {userData?.fotoURL ? (
              <img src={userData.fotoURL} className="profil-photo" alt="profil" />
            ) : (
              <div className="profil-initials">{initials}</div>
            )}
            <label className="change-photo-label">
              {uploading ? "Mengupload..." : "Ganti Foto"}
              <input type="file" accept="image/*" onChange={handleFoto} style={{ display: "none" }} disabled={uploading} />
            </label>
            {msg && <p className="profil-msg">{msg}</p>}
          </div>

          {/* Detail Profil */}
          <div className="profil-details">
            <div className="profil-name">{userData?.nama}</div>
            <div className="profil-jabatan">{userData?.jabatan}</div>
            <div className="profil-items">
              <div className="profil-item">
                <span className="profil-label">NIP</span>
                <span className="profil-value">{userData?.nip}</span>
              </div>
              <div className="profil-item">
                <span className="profil-label">Email</span>
                <span className="profil-value">{userData?.email}</span>
              </div>
              <div className="profil-item">
                <span className="profil-label">Jabatan</span>
                <span className="profil-value">{userData?.jabatan}</span>
              </div>
              <div className="profil-item">
                <span className="profil-label">Role</span>
                <span className="badge badge-blue">Karyawan</span>
              </div>
              <div className="profil-item">
                <span className="profil-label">Terdaftar</span>
                <span className="profil-value">{userData?.createdAt?.slice(0, 10) || "-"}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
