import { useNavigate } from 'react-router-dom';

export default function TopHeader({ title, showBack = false, onBack, rightElement, transparent = false }) {
  const navigate = useNavigate();

  const handleBack = () => {
    if (onBack) onBack();
    else navigate(-1);
  };

  return (
    <div
      className={`sticky top-0 z-30 flex items-center justify-between px-4 ${transparent ? 'bg-transparent' : 'bg-navy'}`}
      style={{ height: 56, minHeight: 56 }}
    >
      {/* Left */}
      <div className="w-10">
        {showBack && (
          <button
            onClick={handleBack}
            className="flex items-center justify-center w-9 h-9 rounded-xl"
            style={{ background: 'rgba(255,255,255,0.12)' }}
          >
            <span className="text-white text-base">←</span>
          </button>
        )}
      </div>

      {/* Center */}
      <h1 className="flex-1 text-center text-white font-800 text-[15px] tracking-[-0.2px] truncate px-2">
        {title}
      </h1>

      {/* Right */}
      <div className="w-10 flex justify-end">
        {rightElement || null}
      </div>
    </div>
  );
}
