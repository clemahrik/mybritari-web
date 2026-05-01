import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { authAPI } from '../../services/api';
import Spinner from '../../components/Spinner';

export default function ResetPassword() {
  const navigate  = useNavigate();
  const [params]  = useSearchParams();
  const token     = params.get('token');

  const [password,  setPassword]  = useState('');
  const [confirm,   setConfirm]   = useState('');
  const [showPw,    setShowPw]    = useState(false);
  const [loading,   setLoading]   = useState(false);
  const [done,      setDone]      = useState(false);
  const [error,     setError]     = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    if (!password || !confirm) return setError('Please fill in both fields.');
    if (password.length < 8) return setError('Password must be at least 8 characters.');
    if (password !== confirm) return setError('Passwords do not match.');
    if (!token) return setError('Invalid reset link.');

    setLoading(true);
    setError('');
    try {
      await authAPI.resetPassword({ token, password });
      setDone(true);
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to reset password. The link may have expired.');
    } finally { setLoading(false); }
  }

  if (!token) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-surface px-6">
        <p className="text-red font-700 text-center">Invalid reset link. Please request a new one.</p>
        <button onClick={() => navigate('/forgot-password')} className="mt-4 text-red font-800 underline">Request New Link</button>
      </div>
    );
  }

  return (
    <div className="flex flex-col bg-surface" style={{ maxWidth: 430, width: '100%', minHeight: '100vh' }}>
      <div className="bg-navy px-6 pb-9 pt-12">
        <div className="flex flex-col items-center">
          <div className="w-14 h-14 rounded-2xl bg-red flex items-center justify-center mb-4">
            <span className="text-white font-900 text-2xl">B</span>
          </div>
          <h1 className="text-white font-900 text-2xl mb-1.5">Reset Password</h1>
          <p className="text-white/60 text-sm">Enter your new password below</p>
        </div>
      </div>

      <div className="flex-1 bg-white rounded-t-3xl -mt-5 px-6 pt-8 pb-10">
        {done ? (
          <div className="flex flex-col items-center text-center pt-6">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
              <span className="text-3xl">✓</span>
            </div>
            <h2 className="text-textmain font-800 text-lg mb-2">Password Reset!</h2>
            <p className="text-textsub text-sm leading-6 mb-6">
              Your password has been updated. You can now log in with your new password on the website or mobile app.
            </p>
            <button
              onClick={() => navigate('/login')}
              className="w-full flex items-center justify-between bg-red text-white font-800 text-base px-6 py-[17px] rounded-2xl"
            >
              <span>Go to Login</span>
              <span className="text-xl">→</span>
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="mb-5">
              <label className="block text-xs font-700 text-textsub uppercase tracking-wide mb-2">New Password</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Min. 8 characters"
                  className="w-full h-[54px] px-4 pr-12 rounded-xl border border-border bg-surface-2 text-textmain text-[15px] focus:border-navy"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-textmuted text-lg w-8 h-8 flex items-center justify-center"
                >
                  {showPw ? '👁' : '👁‍🗨'}
                </button>
              </div>
            </div>

            <div className="mb-5">
              <label className="block text-xs font-700 text-textsub uppercase tracking-wide mb-2">Confirm Password</label>
              <input
                type={showPw ? 'text' : 'password'}
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                placeholder="Repeat new password"
                className="w-full h-[54px] px-4 rounded-xl border border-border bg-surface-2 text-textmain text-[15px] focus:border-navy"
                autoComplete="new-password"
              />
            </div>

            {error && (
              <div className="mb-4 px-4 py-3 bg-red-light rounded-xl text-red text-sm font-600">{error}</div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-between bg-red text-white font-800 text-base px-6 py-[17px] rounded-2xl disabled:opacity-70"
            >
              {loading ? (
                <div className="flex-1 flex justify-center"><Spinner size="sm" color="white" /></div>
              ) : (
                <>
                  <span>Reset Password</span>
                  <span className="text-xl">→</span>
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
