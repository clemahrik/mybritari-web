import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../../services/api';
import Spinner from '../../components/Spinner';

export default function ForgotPassword() {
  const navigate  = useNavigate();
  const [email,   setEmail]   = useState('');
  const [loading, setLoading] = useState(false);
  const [sent,    setSent]    = useState(false);
  const [error,   setError]   = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email.trim()) return setError('Please enter your email address.');
    setLoading(true);
    setError('');
    try {
      await authAPI.forgotPassword({ email: email.trim().toLowerCase() });
      setSent(true);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally { setLoading(false); }
  }

  return (
    <div className="flex flex-col bg-surface" style={{ maxWidth: 430, width: '100%', minHeight: '100vh' }}>
      <div className="bg-navy px-6 pb-9 pt-12">
        <button onClick={() => navigate('/login')} className="text-white/60 text-sm font-600 mb-6">← Back</button>
        <div className="flex flex-col items-center">
          <div className="w-14 h-14 rounded-2xl bg-red flex items-center justify-center mb-4">
            <span className="text-white font-900 text-2xl">B</span>
          </div>
          <h1 className="text-white font-900 text-2xl mb-1.5">Forgot Password</h1>
          <p className="text-white/60 text-sm text-center">Enter your email to receive a reset link</p>
        </div>
      </div>

      <div className="flex-1 bg-white rounded-t-3xl -mt-5 px-6 pt-8 pb-10">
        {sent ? (
          <div className="flex flex-col items-center text-center pt-6">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
              <span className="text-3xl">✓</span>
            </div>
            <h2 className="text-textmain font-800 text-lg mb-2">Check Your Email</h2>
            <p className="text-textsub text-sm leading-6 mb-6">
              If <strong>{email}</strong> is registered, you'll receive a password reset link shortly. Check your spam folder if you don't see it.
            </p>
            <button
              onClick={() => navigate('/login')}
              className="w-full flex items-center justify-between bg-red text-white font-800 text-base px-6 py-[17px] rounded-2xl"
            >
              <span>Back to Login</span>
              <span className="text-xl">→</span>
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="mb-5">
              <label className="block text-xs font-700 text-textsub uppercase tracking-wide mb-2">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full h-[54px] px-4 rounded-xl border border-border bg-surface-2 text-textmain text-[15px] focus:border-navy"
                autoComplete="email"
              />
            </div>

            {error && (
              <div className="mb-4 px-4 py-3 bg-red-light rounded-xl text-red text-sm font-600">{error}</div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-between bg-red text-white font-800 text-base px-6 py-[17px] rounded-2xl mb-4 disabled:opacity-70"
            >
              {loading ? (
                <div className="flex-1 flex justify-center"><Spinner size="sm" color="white" /></div>
              ) : (
                <>
                  <span>Send Reset Link</span>
                  <span className="text-xl">→</span>
                </>
              )}
            </button>

            <p className="text-center text-textmuted text-sm">
              Remember your password?{' '}
              <button type="button" onClick={() => navigate('/login')} className="text-red font-800">Sign In</button>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
