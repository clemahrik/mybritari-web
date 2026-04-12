import { useNavigate, useLocation } from 'react-router-dom';

const TABS = [
  {
    label: 'Home',
    path: '/dashboard',
    icon: (active) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? '#C8102E' : '#A0AEC0'}>
        <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
      </svg>
    ),
  },
  {
    label: 'Estates',
    path: '/estates',
    icon: (active) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? '#C8102E' : '#A0AEC0'}>
        <path d="M17 11V3H7v4H3v14h8v-4h2v4h8V11h-4zM7 19H5v-2h2v2zm0-4H5v-2h2v2zm0-4H5v-2h2v2zm4 4H9v-2h2v2zm0-4H9v-2h2v2zm0-4H9V7h2v2zm4 8h-2v-2h2v2zm0-4h-2v-2h2v2zm0-4h-2V7h2v2zm4 8h-2v-2h2v2zm0-4h-2v-2h2v2z"/>
      </svg>
    ),
  },
  {
    label: 'Contracts',
    path: '/contracts',
    icon: (active) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? '#C8102E' : '#A0AEC0'}>
        <path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.89 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm4 18H6V4h7v5h5v11zm-5-5h-2v-2h2v2zm0-4h-2V9h2v2z"/>
      </svg>
    ),
  },
  {
    label: 'Vault',
    path: '/documents',
    icon: (active) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? '#C8102E' : '#A0AEC0'}>
        <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zM12 17c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>
      </svg>
    ),
  },
  {
    label: 'Profile',
    path: '/profile',
    icon: (active) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? '#C8102E' : '#A0AEC0'}>
        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
      </svg>
    ),
  },
];

export default function BottomNav() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const current   = location.pathname;

  return (
    <div
      className="fixed bottom-0 left-1/2 -translate-x-1/2 z-30 bg-white border-t border-border"
      style={{ width: '100%', maxWidth: 430, height: 64 }}
    >
      <div className="flex h-full">
        {TABS.map(tab => {
          const active = current === tab.path || current.startsWith(tab.path + '/');
          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              className="flex-1 flex flex-col items-center justify-center gap-0.5 transition-opacity active:opacity-70"
            >
              {tab.icon(active)}
              <span
                className="text-[10px] font-700 tracking-wide"
                style={{ color: active ? '#C8102E' : '#A0AEC0' }}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
