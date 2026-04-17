import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/Toast';
import Spinner from '../../components/Spinner';
import api from '../../services/api';

function Field({ label, value, onChange, type = 'text', placeholder, autoComplete }) {
  const [showPw, setShowPw] = useState(false);
  const isPw = type === 'password';
  return (
    <div className="mb-[18px]">
      <label className="block text-xs font-700 text-textsub uppercase tracking-wide mb-2">{label}</label>
      <div className="relative">
        <input
          type={isPw ? (showPw ? 'text' : 'password') : type}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className="w-full h-[54px] px-4 pr-10 rounded-xl border border-border bg-surface-2 text-textmain text-[15px] focus:border-navy"
        />
        {isPw && (
          <button
            type="button"
            onClick={() => setShowPw(v => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-textmuted text-lg w-8 h-8 flex items-center justify-center"
          >
            {showPw ? '👁' : '👁‍🗨'}
          </button>
        )}
      </div>
    </div>
  );
}

export default function Register() {
  const navigate         = useNavigate();
  const { updateUser }   = useAuth();
  const { showToast }    = useToast();
  const [form, setForm] = useState({
    first_name: '', last_name: '', email: '', phone: '',
    password: '', confirm: '', referral_code: '', access_code: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const set = (k) => (v) => setForm(f => ({ ...f, [k]: v }));

  async function handleRegister(e) {
    e.preventDefault();
    const { first_name, last_name, email, phone, password, confirm, referral_code, access_code } = form;

    if (!first_name || !last_name || !email || !phone || !password)
      return setError('Please fill in all required fields.');
    if (password.length < 8)
      return setError('Password must be at least 8 characters.');
    if (password !== confirm)
      return setError('Passwords do not match.');

    setError('');
    setLoading(true);
    try {
      const payload = {
        first_name: first_name.trim(),
        last_name:  last_name.trim(),
        email:      email.trim().toLowerCase(),
        phone:      phone.trim(),
        password,
        referral_code: referral_code.trim() || undefined,
        access_code:   access_code.toUpperCase().trim() || undefined,
      };
      const res = await api.post('/auth/register', payload);
      const { token, user } = res.data;
      localStorage.setItem('mybritari_token', token);
      localStorage.setItem('mybritari_user', JSON.stringify(user));
      updateUser(user); // hydrate AuthContext so subsequent updateUser calls merge correctly
      if (access_code.trim()) {
        showToast('Account created! If your access code was valid, exclusive estates have been unlocked for you.', 'success');
      }
      navigate('/terms', { replace: true });
    } catch (e) {
      setError(e?.response?.data?.message || 'Registration failed. Please try again.');
    } finally { setLoading(false); }
  }

  return (
    <div className="flex flex-col bg-surface" style={{ maxWidth: 430, width: '100%', minHeight: '100vh' }}>
      {/* Navy header */}
      <div className="bg-navy px-6 pt-12 pb-9">
        <button onClick={() => navigate('/')} className="text-white/60 text-sm font-600 mb-6">← Back</button>
        <div className="flex flex-col items-center">
          <div className="w-14 h-14 rounded-2xl bg-red flex items-center justify-center mb-4">
            <span className="text-white font-900 text-2xl">B</span>
          </div>
          <h1 className="text-white font-900 text-2xl mb-1.5">Create Account</h1>
          <p className="text-white/60 text-sm">Join thousands of land owners in Nigeria</p>
        </div>
      </div>

      {/* Form */}
      <div className="flex-1 bg-white rounded-t-3xl -mt-5 px-6 pt-8 pb-10 overflow-y-auto">
        <form onSubmit={handleRegister}>
          <div className="grid grid-cols-2 gap-4">
            <Field label="First Name *" value={form.first_name} onChange={set('first_name')} placeholder="John" autoComplete="given-name" />
            <Field label="Last Name *"  value={form.last_name}  onChange={set('last_name')}  placeholder="Doe"  autoComplete="family-name" />
          </div>
          <Field label="Email Address *" value={form.email}  onChange={set('email')}  type="email"    placeholder="you@example.com"  autoComplete="email" />
          <Field label="Phone Number"    value={form.phone}  onChange={set('phone')}  type="tel"      placeholder="+234 800 000 0000" autoComplete="tel" />
          <Field label="Password *"      value={form.password} onChange={set('password')} type="password" placeholder="Min. 8 characters" autoComplete="new-password" />
          <Field label="Confirm Password *" value={form.confirm} onChange={set('confirm')} type="password" placeholder="Repeat password" autoComplete="new-password" />

          {/* Optional fields */}
          <div className="mb-4">
            <p className="text-xs text-textsub mb-3">
              Were you referred? Enter their name below (optional)
            </p>
            <Field label="Referred By" value={form.referral_code} onChange={set('referral_code')} placeholder="e.g. James Doe" />
          </div>

          <div className="mb-5">
            <label className="block text-xs font-700 text-textsub uppercase tracking-wide mb-2">
              Access Code (Optional)
            </label>
            <input
              value={form.access_code}
              onChange={e => set('access_code')(e.target.value.toUpperCase())}
              placeholder="Enter exclusive access code if you have one"
              className="w-full h-[54px] px-4 rounded-xl border border-border bg-surface-2 text-textmain text-[15px] uppercase tracking-widest focus:border-navy"
            />
            <p className="text-xs text-textsub mt-1.5">
              Have a special access code? Enter it to unlock exclusive estates after signing up.
            </p>
          </div>

          {error && (
            <div className="mb-4 px-4 py-3 bg-red-light rounded-xl text-red text-sm font-600">
              {error}
            </div>
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
                <span>Create Account</span>
                <span className="text-xl">→</span>
              </>
            )}
          </button>

          <p className="text-center text-textmuted text-sm">
            Already have an account?{' '}
            <Link to="/login" className="text-red font-800">Sign In</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
