import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { authAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export default function VerifyEmail() {
  const [searchParams]  = useSearchParams();
  const navigate        = useNavigate();
  const { refreshUser } = useAuth();
  const [status, setStatus] = useState('loading'); // 'loading' | 'success' | 'error' | 'no-token'
  const [message, setMessage] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) { setStatus('no-token'); return; }

    authAPI.verifyEmail(token)
      .then(res => {
        setMessage(res.data.message || 'Email verified successfully!');
        setStatus('success');
        // Refresh user state so the banner disappears on dashboard
        refreshUser().catch(() => {});
      })
      .catch(err => {
        setMessage(err.response?.data?.message || 'Verification failed. The link may have expired.');
        setStatus('error');
      });
  }, []);

  return (
    <div className="min-h-screen bg-surface-2 flex items-center justify-center px-5">
      <div className="bg-white rounded-3xl p-8 w-full max-w-sm text-center shadow-sm border border-border">

        {status === 'loading' && (
          <>
            <div className="text-5xl mb-4">⏳</div>
            <h2 className="text-lg font-800 text-textmain mb-2">Verifying your email…</h2>
            <p className="text-sm text-textsub">Just a moment.</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="text-5xl mb-4">✅</div>
            <h2 className="text-lg font-800 text-textmain mb-2">Email Verified!</h2>
            <p className="text-sm text-textsub mb-6">{message}</p>
            <button
              onClick={() => navigate('/dashboard')}
              className="w-full bg-red text-white py-3.5 rounded-2xl font-800 text-sm"
            >
              Go to Dashboard →
            </button>
          </>
        )}

        {(status === 'error' || status === 'no-token') && (
          <>
            <div className="text-5xl mb-4">⚠️</div>
            <h2 className="text-lg font-800 text-textmain mb-2">Link Invalid or Expired</h2>
            <p className="text-sm text-textsub mb-6">
              {status === 'no-token'
                ? 'No verification token found in this link.'
                : message}
            </p>
            <button
              onClick={() => navigate('/dashboard')}
              className="w-full bg-navy text-white py-3.5 rounded-2xl font-800 text-sm mb-3"
            >
              Go to Dashboard
            </button>
            <p className="text-xs text-textsub">
              You can request a new link from the banner on your dashboard.
            </p>
          </>
        )}

      </div>
    </div>
  );
}
