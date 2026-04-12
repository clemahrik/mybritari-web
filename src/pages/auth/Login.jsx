import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/Toast';
import Spinner from '../../components/Spinner';

export default function Login() {
  const navigate       = useNavigate();
  const { login }      = useAuth();
  const { showToast }  = useToast();
  const [email,  setEmail]  = useState('');
  const [pass,   setPass]   = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState('');
  const [shake, setShake]   = useState(false);

  async function handleLogin(e) {
    e.preventDefault();
    if (!email.trim() || !pass) {
      setShake(true);
      setTimeout(() => setShake(false), 500);
      setError('Please enter your email and password.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const user = await login(email.trim().toLowerCase(), pass);
      if (!user.terms_accepted) navigate('/terms', { replace: true });
      else if (user.kyc_status === 'not_submitted') navigate('/kyc', { replace: true });
      else navigate('/dashboard', { replace: true });
    } catch (e) {
      const msg = e?.response?.data?.message || 'Invalid email or password.';
      setError(msg);
      setShake(true);
      setTimeout(() => setShake(false), 500);
    } finally { setLoading(false); }
  }

  return (
    <div className="flex flex-col bg-surface" style={{ maxWidth: 430, width: '100%', minHeight: '100vh' }}>
      {/* Navy header */}
      <div className="bg-navy px-6 pb-9 pt-12">
        <button onClick={() => navigate('/')} className="text-white/60 text-sm font-600 mb-6 flex items-center gap-1">
          ← Back
        </button>
        <div className="flex flex-col items-center">
          <div className="w-14 h-14 rounded-2xl bg-red flex items-center justify-center mb-4">
            <span className="text-white font-900 text-2xl">B</span>
          </div>
          <h1 className="text-white font-900 text-2xl mb-1.5">Welcome Back</h1>
          <p className="text-white/60 text-sm">Sign in to your Britari account</p>
        </div>
      </div>

      {/* Form */}
      <div className="flex-1 bg-white rounded-t-3xl -mt-5 px-6 pt-8 pb-10">
        <form onSubmit={handleLogin} className={shake ? 'animate-bounce' : ''}>
          <div className="mb-[18px]">
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

          <div className="mb-5">
            <label className="block text-xs font-700 text-textsub uppercase tracking-wide mb-2">Password</label>
            <div className="relative">
              <input
                type={showPw ? 'text' : 'password'}
                value={pass}
                onChange={e => setPass(e.target.value)}
                placeholder="Your password"
                className="w-full h-[54px] px-4 pr-12 rounded-xl border border-border bg-surface-2 text-textmain text-[15px] focus:border-navy"
                autoComplete="current-password"
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

          {error && (
            <div className="mb-4 px-4 py-3 bg-red-light rounded-xl text-red text-sm font-600">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-between bg-red text-white font-800 text-base px-6 py-[17px] rounded-2xl mb-3 disabled:opacity-70"
          >
            {loading ? (
              <div className="flex-1 flex justify-center"><Spinner size="sm" color="white" /></div>
            ) : (
              <>
                <span>Sign In</span>
                <span className="text-xl">→</span>
              </>
            )}
          </button>

          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-border" />
            <span className="text-textmuted text-xs font-600">OR</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          <p className="text-center text-textmuted text-sm">
            Don't have an account?{' '}
            <Link to="/register" className="text-red font-800">Create Account</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
