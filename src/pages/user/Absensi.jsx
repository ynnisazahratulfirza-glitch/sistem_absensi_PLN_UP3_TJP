// pages/user/Absensi.jsx
import { useEffect, useState, useRef } from "react";
import { collection, getDocs, query, where, addDoc, updateDoc, doc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "../../lib/firebase";

export default function UserAbsensi() {
  const [user, setUser] = useState(null);
  const [absensiHariIni, setAbsensiHariIni] = useState(null);
  const [absensiId, setAbsensiId] = useState(null);
  const [foto, setFoto] = useState(null);
  const [fotoPreview, setFotoPreview] = useState(null);
  const [keterangan, setKeterangan] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });
  const [clock, setClock] = useState("");
  const intervalRef = useRef(null);

  const today = new Date().toISOString().split("T")[0];
  const bulan = today.slice(0, 7);

  useEffect(() => {
    const tick = () => {
      setClock(new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
    };
    tick();
    intervalRef.current = setInterval(tick, 1000);
    return () => clearInterval(intervalRef.current);
  }, []);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) return;
      const snap = await getDocs(query(collection(db, "users"), where("uid", "==", u.uid)));
      if (!snap.empty) setUser(snap.docs[0].data());
      await fetchAbsensi(u.uid);
    });
    return () => unsub();
  }, []);

  const fetchAbsensi = async (uid) => {
    const snap = await getDocs(
      query(collection(db, "absensi"), where("uid", "==", uid), where("tanggal", "==", today))
    );
    if (!snap.empty) {
      setAbsensiHariIni(snap.docs[0].data());
      setAbsensiId(snap.docs[0].id);
    } else {
      setAbsensiHariIni(null);
      setAbsensiId(null);
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
        setFoto(base64);
        setFotoPreview(base64);
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  };

  const jamSekarang = () =>
    new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });

  const absenMasuk = async () => {
    if (!foto) return setMsg({ type: "error", text: "Wajib upload foto selfie sebelum absen." });
    setLoading(true);
    try {
      await addDoc(collection(db, "absensi"), {
        uid: user.uid,
        tanggal: today,
        bulan,
        jamMasuk: jamSekarang(),
        jamKeluar: null,
        status: "Hadir",
        fotoAbsensi: foto,
        keterangan,
        createdAt: new Date().toISOString(),
      });
      setMsg({ type: "success", text: "Absen masuk berhasil dicatat." });
      await fetchAbsensi(user.uid);
      setFoto(null); setFotoPreview(null); setKeterangan("");
    } catch {
      setMsg({ type: "error", text: "Gagal absen. Coba lagi." });
    } finally {
      setLoading(false);
    }
  };

  const absenKeluar = async () => {
    if (!absensiId) return;
    setLoading(true);
    try {
      const updateData = { jamKeluar: jamSekarang() };
      if (foto) updateData.fotoKeluar = foto;
      await updateDoc(doc(db, "absensi", absensiId), updateData);
      setMsg({ type: "success", text: "Absen keluar berhasil dicatat." });
      await fetchAbsensi(user.uid);
      setFoto(null); setFotoPreview(null);
    } catch {
      setMsg({ type: "error", text: "Gagal absen keluar." });
    } finally {
      setLoading(false);
    }
  };

  const dateStr = new Date().toLocaleDateString("id-ID", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });

  const sudahMasuk = !!absensiHariIni;
  const sudahKeluar = !!absensiHariIni?.jamKeluar;

  return (
    <div>
      <div className="page-header">Absensi Hari Ini</div>
      <div className="absensi-wrapper">

        {/* Kiri: Jam & Status */}
        <div className="absensi-left-panel">
          <div className="clock-card">
            <div className="clock-time">{clock}</div>
            <div className="clock-date">{dateStr}</div>
          </div>

          {/* Status box */}
          {sudahMasuk && (
            <div className="status-info-card">
              <div className="status-info-title">Status Absensi</div>
              <div className="status-info-row">
                <span>Jam Masuk</span>
                <strong className="val-green">{absensiHariIni.jamMasuk}</strong>
              </div>
              <div className="status-info-row">
                <span>Jam Keluar</span>
                <strong className={sudahKeluar ? "val-red" : "val-gray"}>
                  {absensiHariIni.jamKeluar || "Belum keluar"}
                </strong>
              </div>
              <div className="status-info-row">
                <span>Status</span>
                <span className="badge badge-green">{absensiHariIni.status}</span>
              </div>
              {absensiHariIni.keterangan && (
                <div className="status-info-row">
                  <span>Keterangan</span>
                  <span>{absensiHariIni.keterangan}</span>
                </div>
              )}
            </div>
          )}

          {sudahKeluar && (
            <div className="done-banner">Absensi hari ini selesai</div>
          )}
        </div>

        {/* Kanan: Upload & Aksi */}
        {!sudahKeluar && (
          <div className="absensi-right-panel">
            <div className="upload-title">
              {!sudahMasuk ? "Foto Selfie Masuk" : "Foto Selfie Keluar"}
            </div>

            {/* Preview Foto */}
            <div className="foto-frame" onClick={() => document.getElementById("foto-input").click()}>
              {fotoPreview ? (
                <img src={fotoPreview} className="foto-frame-img" alt="preview" />
              ) : (
                <div className="foto-frame-empty">
                  <div className="foto-frame-icon">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5">
                      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                      <circle cx="12" cy="13" r="4"/>
                    </svg>
                  </div>
                  <p>Klik untuk upload foto</p>
                  <small>Format JPG / PNG</small>
                </div>
              )}
              <input
                type="file" id="foto-input" accept="image/*"
                onChange={handleFoto} style={{ display: "none" }}
              />
            </div>

            {fotoPreview && (
              <button
                className="btn btn-outline btn-sm"
                style={{ marginBottom: 12 }}
                onClick={() => document.getElementById("foto-input").click()}
              >
                Ganti Foto
              </button>
            )}

            {/* Keterangan */}
            <div className="form-group">
              <label>Keterangan <span style={{ color: "#a0aec0", fontWeight: 400 }}>(opsional)</span></label>
              <input
                type="text"
                placeholder="Contoh: WFH, Sakit, Dinas Luar..."
                value={keterangan}
                onChange={(e) => setKeterangan(e.target.value)}
              />
            </div>

            {/* Tombol */}
            {!sudahMasuk ? (
              <button className="btn-absen masuk" onClick={absenMasuk} disabled={loading}>
                {loading ? "Memproses..." : "Absen Masuk"}
              </button>
            ) : (
              <button className="btn-absen keluar" onClick={absenKeluar} disabled={loading}>
                {loading ? "Memproses..." : "Absen Keluar"}
              </button>
            )}

            {msg.text && (
              <div className={`alert ${msg.type === "success" ? "alert-success" : "alert-error"}`}
                style={{ marginTop: 12 }}>
                {msg.text}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
