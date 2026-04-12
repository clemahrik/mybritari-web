import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import TopHeader from '../../components/TopHeader';
import Spinner from '../../components/Spinner';
import Badge from '../../components/Badge';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/Toast';
import { authAPI } from '../../services/api';
import { fmtDate, initials, copyToClipboard } from '../../utils';

const KYC_INFO = {
  not_submitted: { icon: '📋', color: 'bg-surface-2', textColor: 'text-textsub',  label: 'KYC Not Submitted', sub: 'Complete your verification to unlock all features.' },
  pending:       { icon: '⏳', color: 'bg-warning-bg', textColor: 'text-warning',  label: 'KYC Under Review',  sub: 'We\'re reviewing your documents. This takes 24-48 hours.' },
  verified:      { icon: '✅', color: 'bg-success-bg', textColor: 'text-success',  label: 'KYC Verified',      sub: 'Your identity has been verified. All features unlocked!' },
  rejected:      { icon: '❌', color: 'bg-red-light',  textColor: 'text-red',      label: 'KYC Rejected',      sub: 'Your documents were rejected. Please resubmit.' },
};

export default function Profile() {
  const navigate = useNavigate();
  const { user, logout, updateUser } = useAuth();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving,  setSaving]  = useState(false);
  const [profile, setProfile] = useState(null);
  const [form, setForm]       = useState({ first_name: '', last_name: '', phone: '', address: '' });
  const [showPwForm, setShowPwForm] = useState(false);
  const [pwForm, setPwForm]   = useState({ current_password: '', new_password: '', confirm: '' });
  const [changingPw, setChangingPw] = useState(false);
  const [copied, setCopied]   = useState(false);

  useEffect(() => {
    authAPI.getProfile().then(r => {
      const p = r.data.data;
      setProfile(p);
      setForm({ first_name: p.first_name || '', last_name: p.last_name || '', phone: p.phone || '', address: p.address || '' });
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  async function handleSave() {
    setSaving(true);
    try {
      await authAPI.updateProfile(form);
      updateUser(form);
      setProfile(p => ({ ...p, ...form }));
      setEditing(false);
      showToast('Profile updated!', 'success');
    } catch (e) {
      showToast(e?.response?.data?.message || 'Update failed', 'error');
    } finally { setSaving(false); }
  }

  async function handleChangePassword(e) {
    e.preventDefault();
    if (pwForm.new_password !== pwForm.confirm)
      return showToast('Passwords do not match', 'error');
    if (pwForm.new_password.length < 8)
      return showToast('Password must be at least 8 characters', 'error');
    setChangingPw(true);
    try {
      await authAPI.changePassword({ current_password: pwForm.current_password, new_password: pwForm.new_password });
      showToast('Password changed!', 'success');
      setShowPwForm(false);
      setPwForm({ current_password: '', new_password: '', confirm: '' });
    } catch (e) {
      showToast(e?.response?.data?.message || 'Failed to change password', 'error');
    } finally { setChangingPw(false); }
  }

  async function handleCopyCode() {
    await copyToClipboard(profile?.referral_code || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    showToast('Referral code copied!', 'success');
  }

  function handleLogout() {
    if (window.confirm('Are you sure you want to sign out?')) logout();
  }

  const kycStatus = profile?.kyc_status || 'not_submitted';
  const kycInfo   = KYC_INFO[kycStatus] || KYC_INFO.not_submitted;

  if (loading) return (
    <Layout><div className="flex justify-center py-20"><Spinner size="lg" /></div></Layout>
  );

  return (
    <Layout>
      <TopHeader title="My Profile" />

      <div className="overflow-y-auto">
        {/* Hero card */}
        <div className="bg-navy px-5 pb-6 pt-2">
          <div className="flex flex-col items-center">
            <div className="w-20 h-20 rounded-full bg-red flex items-center justify-center mb-3">
              <span className="text-white font-900 text-2xl">{initials(profile?.first_name, profile?.last_name)}</span>
            </div>
            <p className="text-white font-900 text-xl">{profile?.first_name} {profile?.last_name}</p>
            <p className="text-white/60 text-sm mt-0.5">{profile?.email}</p>
            {profile?.phone && <p className="text-white/60 text-sm">{profile?.phone}</p>}
            <div className="flex items-center gap-2 mt-3">
              <Badge label={kycStatus === 'not_submitted' ? 'Unverified' : kycStatus} variant={kycStatus} />
              <span className="text-white/40 text-xs">Member since {fmtDate(profile?.created_at)}</span>
            </div>
          </div>
        </div>

        <div className="px-4 py-4 space-y-4">
          {/* KYC Status */}
          <div className={`rounded-2xl p-4 flex items-start gap-3 ${kycInfo.color}`}>
            <span className="text-2xl">{kycInfo.icon}</span>
            <div className="flex-1">
              <p className={`font-800 text-sm ${kycInfo.textColor}`}>{kycInfo.label}</p>
              <p className={`text-xs mt-0.5 ${kycInfo.textColor} opacity-75`}>{kycInfo.sub}</p>
              {profile?.kyc_rejection_reason && (
                <p className="text-xs text-red font-700 mt-1">Reason: {profile.kyc_rejection_reason}</p>
              )}
            </div>
            {(kycStatus === 'not_submitted' || kycStatus === 'rejected') && (
              <button onClick={() => navigate('/kyc')} className={`text-xs font-800 ${kycInfo.textColor} flex-shrink-0`}>
                {kycStatus === 'rejected' ? 'Resubmit →' : 'Start →'}
              </button>
            )}
          </div>

          {/* Account Details */}
          <div className="bg-white rounded-2xl border border-border overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <p className="font-800 text-textmain text-sm">Account Details</p>
              {!editing ? (
                <button onClick={() => setEditing(true)} className="text-red text-sm font-700">Edit</button>
              ) : (
                <div className="flex gap-3">
                  <button onClick={() => setEditing(false)} className="text-textsub text-sm font-700">Cancel</button>
                  <button onClick={handleSave} disabled={saving} className="text-red text-sm font-700">
                    {saving ? <Spinner size="sm" /> : 'Save'}
                  </button>
                </div>
              )}
            </div>
            <div className="p-4 space-y-3">
              {editing ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-700 text-textsub mb-1 block">First Name</label>
                      <input value={form.first_name} onChange={e => setForm(f => ({ ...f, first_name: e.target.value }))} className="w-full h-11 px-3 rounded-xl border border-border bg-surface-2 text-sm" />
                    </div>
                    <div>
                      <label className="text-xs font-700 text-textsub mb-1 block">Last Name</label>
                      <input value={form.last_name} onChange={e => setForm(f => ({ ...f, last_name: e.target.value }))} className="w-full h-11 px-3 rounded-xl border border-border bg-surface-2 text-sm" />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-700 text-textsub mb-1 block">Phone</label>
                    <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} className="w-full h-11 px-3 rounded-xl border border-border bg-surface-2 text-sm" />
                  </div>
                  <div>
                    <label className="text-xs font-700 text-textsub mb-1 block">Address</label>
                    <input value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} className="w-full h-11 px-3 rounded-xl border border-border bg-surface-2 text-sm" />
                  </div>
                </div>
              ) : (
                [
                  { label: 'Full Name', val: `${profile?.first_name} ${profile?.last_name}` },
                  { label: 'Email',     val: profile?.email },
                  { label: 'Phone',     val: profile?.phone || '—' },
                  { label: 'Address',   val: profile?.address || '—' },
                ].map(r => (
                  <div key={r.label} className="flex items-center justify-between">
                    <span className="text-xs text-textmuted font-700">{r.label}</span>
                    <span className="text-sm text-textmain font-700 max-w-[200px] text-right truncate">{r.val}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Referral code */}
          <div className="bg-white rounded-2xl border border-border p-4">
            <p className="font-800 text-textmain text-sm mb-3">Your Referral Code</p>
            <div className="flex items-center justify-between bg-surface rounded-xl px-4 py-3">
              <span className="font-900 text-navy text-base tracking-widest">{profile?.referral_code || '—'}</span>
              <button
                onClick={handleCopyCode}
                className={`text-xs font-800 px-3 py-1.5 rounded-xl transition-all ${copied ? 'bg-success-bg text-success' : 'bg-surface-2 text-textsub'}`}
              >
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <button onClick={() => navigate('/referral')} className="mt-3 text-red text-sm font-700">
              View Referral Dashboard →
            </button>
          </div>

          {/* Security */}
          <div className="bg-white rounded-2xl border border-border overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <p className="font-800 text-textmain text-sm">Security</p>
            </div>
            <button
              onClick={() => setShowPwForm(v => !v)}
              className="w-full flex items-center justify-between px-4 py-3.5"
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">🔒</span>
                <span className="text-sm font-700 text-textmain">Change Password</span>
              </div>
              <span className="text-textmuted">{showPwForm ? '▲' : '▼'}</span>
            </button>
            {showPwForm && (
              <form onSubmit={handleChangePassword} className="px-4 pb-4 space-y-3">
                {[
                  { key: 'current_password', label: 'Current Password', ph: 'Enter current password' },
                  { key: 'new_password',     label: 'New Password',     ph: 'Min. 8 characters' },
                  { key: 'confirm',          label: 'Confirm New',      ph: 'Repeat new password' },
                ].map(f => (
                  <div key={f.key}>
                    <label className="text-xs font-700 text-textsub block mb-1">{f.label}</label>
                    <input
                      type="password"
                      value={pwForm[f.key]}
                      onChange={e => setPwForm(p => ({ ...p, [f.key]: e.target.value }))}
                      className="w-full h-11 px-3 rounded-xl border border-border bg-surface-2 text-sm"
                      placeholder={f.ph}
                    />
                  </div>
                ))}
                <button
                  type="submit"
                  disabled={changingPw}
                  className="w-full bg-navy text-white py-3 rounded-xl font-700 text-sm flex items-center justify-center"
                >
                  {changingPw ? <Spinner size="sm" color="white" /> : 'Update Password'}
                </button>
              </form>
            )}
          </div>

          {/* Quick links */}
          <div className="bg-white rounded-2xl border border-border overflow-hidden">
            {[
              { icon: '🔔', label: 'Notifications', path: '/notifications' },
              { icon: '🎁', label: 'Referral Dashboard', path: '/referral' },
              { icon: '🎧', label: 'Support', path: '/support' },
            ].map((item, i) => (
              <button
                key={item.label}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center gap-3 px-4 py-3.5 text-left ${i > 0 ? 'border-t border-border' : ''}`}
              >
                <span className="text-xl">{item.icon}</span>
                <span className="text-sm font-700 text-textmain flex-1">{item.label}</span>
                <span className="text-textmuted">→</span>
              </button>
            ))}
          </div>

          {/* Sign out */}
          <button
            onClick={handleLogout}
            className="w-full py-4 rounded-2xl border-2 border-red text-red font-800 text-sm"
          >
            Sign Out
          </button>

          <div className="h-4" />
        </div>
      </div>
    </Layout>
  );
}
