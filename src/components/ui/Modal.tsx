import { useEffect, type ReactNode } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { useLang } from '../../i18n/LanguageContext';

export function Modal({
  open,
  title,
  description,
  onClose,
  children,
  footer,
  width = 'max-w-lg',
}: {
  open: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  children?: ReactNode;
  footer?: ReactNode;
  width?: string;
}) {
  const { t } = useLang();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label={t('common.close')}
        onClick={onClose}
        className="absolute inset-0 bg-[rgba(22,33,28,0.45)] backdrop-blur-[2px]"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`animate-fade-up relative w-full ${width} rounded-xl border border-line bg-white shadow-xl`}
      >
        <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
          <div>
            <h3 className="text-[17px] font-semibold">{title}</h3>
            {description && <p className="mt-1 text-sm text-muted">{description}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-md p-1.5 text-muted transition hover:bg-[#f2f7f4] hover:text-ink"
          >
            <X size={18} />
          </button>
        </div>
        {children && <div className="max-h-[70vh] overflow-y-auto px-5 py-4">{children}</div>}
        {footer && (
          <div className="flex flex-wrap items-center justify-end gap-3 border-t border-line px-5 py-4">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
  busy = false,
  onConfirm,
  onCancel,
  tone = 'danger',
}: {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  tone?: 'danger' | 'primary';
}) {
  return (
    <Modal
      open={open}
      title={title}
      onClose={onCancel}
      width="max-w-md"
      footer={
        <>
          <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={busy}>
            {cancelLabel}
          </button>
          <button
            type="button"
            className={`btn ${tone === 'danger' ? 'btn-danger' : 'btn-primary'}`}
            onClick={onConfirm}
            disabled={busy}
          >
            {busy ? 'Working…' : confirmLabel}
          </button>
        </>
      }
    >
      <div className="flex gap-3">
        <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#fdecea] text-[#b42318]">
          <AlertTriangle size={18} />
        </span>
        <p className="text-sm leading-relaxed text-muted">{message}</p>
      </div>
    </Modal>
  );
}
