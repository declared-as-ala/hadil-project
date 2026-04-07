import { useState } from 'react';
import './ConfirmDialog.css';

export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message = 'Are you sure you want to perform this action?',
  confirmLabel = 'Confirm',
  confirmVariant = 'danger',
  loading = false,
}) {
  const [isConfirming, setIsConfirming] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    setIsConfirming(true);
    try {
      await onConfirm();
    } finally {
      setIsConfirming(false);
    }
  };

  return (
    <div className="confirm-overlay" onClick={onClose}>
      <div className="confirm-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="confirm-icon">
          {confirmVariant === 'danger' ? '\u26A0\uFE0F' : '\u2139\uFE0F'}
        </div>
        <h3 className="confirm-title">{title}</h3>
        <p className="confirm-message">{message}</p>
        <div className="confirm-actions">
          <button className="btn btn-outline" onClick={onClose} disabled={loading || isConfirming}>
            Cancel
          </button>
          <button
            className={`btn btn-${confirmVariant}`}
            onClick={handleConfirm}
            disabled={loading || isConfirming}
          >
            {isConfirming ? 'Processing...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
