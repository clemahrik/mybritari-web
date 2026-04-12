import { useEffect } from 'react';

export default function Modal({ open, onClose, title, children, fullScreen = false }) {
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center"
      style={{ background: 'rgba(11,31,58,0.6)' }}
      onClick={onClose}
    >
      <div
        className={`bg-white w-full max-w-[430px] rounded-t-3xl overflow-hidden
          ${fullScreen ? 'h-full rounded-none' : 'max-h-[92vh]'}`}
        onClick={e => e.stopPropagation()}
      >
        {/* Handle bar */}
        {!fullScreen && (
          <div className="flex justify-center pt-3 pb-2">
            <div className="w-10 h-1 bg-border rounded-full" />
          </div>
        )}
        {title && (
          <div className="flex items-center justify-between px-5 py-3 border-b border-border">
            <h2 className="text-base font-800 text-textmain">{title}</h2>
            <button onClick={onClose} className="text-textmuted text-xl w-8 h-8 flex items-center justify-center">✕</button>
          </div>
        )}
        <div className="overflow-y-auto" style={{ maxHeight: fullScreen ? '100%' : 'calc(92vh - 80px)' }}>
          {children}
        </div>
      </div>
    </div>
  );
}
