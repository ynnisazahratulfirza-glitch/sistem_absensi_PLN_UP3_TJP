// components/ConfirmDialog.jsx
export default function ConfirmDialog({
  show, title, message,
  onConfirm, onCancel, loading,
  confirmLabel = "Ya, Hapus",
  danger = true,
}) {
  if (!show) return null;
  return (
    <div className="confirm-overlay" onClick={onCancel}>
      <div className="confirm-box" onClick={(e) => e.stopPropagation()}>
        <div className="confirm-icon-wrap">
          <div className={`confirm-icon ${danger ? "danger" : "warning"}`}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
              stroke={danger ? "#dc2626" : "#d97706"} strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
          </div>
        </div>
        <div className="confirm-title">{title}</div>
        <div className="confirm-msg">{message}</div>
        <div className="confirm-btns">
          <button className="btn btn-outline" onClick={onCancel} disabled={loading}>
            Batal
          </button>
          <button
            className={`btn ${danger ? "btn-danger" : "btn-warning"}`}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? "Memproses..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
