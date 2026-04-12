import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import TopHeader from '../../components/TopHeader';
import Spinner from '../../components/Spinner';
import EmptyState from '../../components/EmptyState';
import { useToast } from '../../components/Toast';
import { referralsAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { fmtDate, copyToClipboard, initials } from '../../utils';

const TIERS = [
  { count: 1,  reward: '₦5,000 Cash',      icon: '🎁' },
  { count: 3,  reward: '₦15,000 Cash',     icon: '💰' },
  { count: 5,  reward: '10% Plot Discount', icon: '🏷️' },
  { count: 10, reward: '₦50,000 Cash',     icon: '💎' },
  { count: 15, reward: '20% Plot Discount', icon: '🌟' },
  { count: 20, reward: 'FREE Plot of Land', icon: '🏆' },
];

export default function Referral() {
  const { user }      = useAuth();
  const { showToast } = useToast();
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied,  setCopied]  = useState(false);

  useEffect(() => {
    referralsAPI.getMy().then(r => setData(r.data.data || r.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const referralCode = user?.referral_code || '';
  const referralLink = `https://app.britariproperties.com/register?ref=${referralCode}`;
  const referred     = data?.referrals || [];
  const total        = data?.total_referrals || referred.length;
  const active       = data?.active_referrals || referred.filter(r => r.status === 'active').length;

  async function handleCopy() {
    await copyToClipboard(referralCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    showToast('Referral code copied!', 'success');
  }

  async function handleShare() {
    const text = `Join MyBritari and own land in Nigeria! Use my referral code: ${referralCode}\n${referralLink}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Join MyBritari', text, url: referralLink });
      } catch {}
    } else {
      await copyToClipboard(text);
      showToast('Share link copied!', 'success');
    }
  }

  // Next tier
  const nextTier = TIERS.find(t => t.count > total);
  const toNext   = nextTier ? nextTier.count - total : 0;

  if (loading) return <Layout><div className="flex justify-center py-20"><Spinner size="lg" /></div></Layout>;

  return (
    <Layout>
      <TopHeader title="Refer & Earn" showBack />
      <div className="overflow-y-auto">
        {/* Hero card */}
        <div className="bg-navy px-5 py-6">
          <p className="text-white/60 text-xs font-700 uppercase tracking-wide mb-1">Referral Program</p>
          <h2 className="text-white font-900 text-2xl mb-1">Refer Friends. Earn Big.</h2>
          <p className="text-white/60 text-sm mb-5">20 referrals = a FREE plot of land worth millions.</p>

          {/* Referral code */}
          <div className="bg-white/10 rounded-2xl p-4 border border-white/10 mb-3">
            <p className="text-white/50 text-xs font-700 mb-2">YOUR CODE</p>
            <div className="flex items-center justify-between">
              <p className="text-white font-900 text-2xl tracking-widest">{referralCode}</p>
              <button
                onClick={handleCopy}
                className={`text-xs font-800 px-3 py-2 rounded-xl transition-all ${copied ? 'bg-success-bg text-success' : 'bg-white/20 text-white'}`}
              >
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>

          <button
            onClick={handleShare}
            className="w-full bg-red text-white py-3.5 rounded-2xl font-800 text-sm flex items-center justify-center gap-2"
          >
            <span>Share My Referral Link</span>
            <span>↗</span>
          </button>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-2 mt-4">
            {[
              { label: 'Referred', val: total },
              { label: 'Active', val: active },
              { label: 'To Free Plot', val: Math.max(0, 20 - total) },
            ].map(s => (
              <div key={s.label} className="bg-white/10 rounded-xl px-2 py-3 border border-white/10 text-center">
                <p className="text-white font-900 text-xl">{s.val}</p>
                <p className="text-white/50 text-[10px] font-700">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="px-4 py-4">
          {/* Progress to next reward */}
          {nextTier && (
            <div className="bg-white rounded-2xl border border-border p-4 mb-5">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-800 text-textmain">Progress to Next Reward</p>
                <span className="text-lg">{nextTier.icon}</span>
              </div>
              <div className="h-2 rounded-full bg-surface-2 mb-2 overflow-hidden">
                <div className="h-full bg-red rounded-full transition-all" style={{ width: `${Math.min(100, (total / nextTier.count) * 100)}%` }} />
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-textsub">{total} of {nextTier.count} referrals</span>
                <span className="text-xs font-700 text-red">{toNext} more → {nextTier.reward}</span>
              </div>
            </div>
          )}

          {/* Reward tiers */}
          <p className="text-sm font-800 text-textmain mb-3">Reward Tiers</p>
          <div className="space-y-2 mb-5">
            {TIERS.map(t => {
              const earned = total >= t.count;
              return (
                <div
                  key={t.count}
                  className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all
                    ${earned ? 'bg-success-bg border-success/20' : 'bg-white border-border'}`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{t.icon}</span>
                    <div>
                      <p className={`text-sm font-800 ${earned ? 'text-success' : 'text-textmain'}`}>{t.reward}</p>
                      <p className={`text-xs ${earned ? 'text-success/70' : 'text-textsub'}`}>{t.count} referral{t.count > 1 ? 's' : ''}</p>
                    </div>
                  </div>
                  {earned ? (
                    <span className="text-success text-lg">✅</span>
                  ) : (
                    <span className={`text-xs font-700 px-2 py-1 rounded-full ${total >= t.count - 2 ? 'bg-warning-bg text-warning' : 'bg-surface-2 text-textmuted'}`}>
                      {Math.max(0, t.count - total)} to go
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Free plot note */}
          <div className="bg-navy rounded-2xl p-4 mb-5">
            <p className="text-white font-900 text-sm">🏆 The Ultimate Reward</p>
            <p className="text-white/70 text-xs mt-1">Refer 20 active clients and receive a <span className="text-white font-800">FREE 200sqm plot</span> — worth over ₦2,000,000!</p>
          </div>

          {/* Referred people */}
          {referred.length > 0 && (
            <div>
              <p className="text-sm font-800 text-textmain mb-3">People You Referred</p>
              <div className="space-y-2">
                {referred.map((r, i) => (
                  <div key={r.id || i} className="bg-white rounded-2xl border border-border p-3.5 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-navy flex items-center justify-center flex-shrink-0">
                      <span className="text-white font-800 text-sm">{initials(r.referred_name?.split(' ')[0], r.referred_name?.split(' ')[1]) || '?'}</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-800 text-textmain">{r.referred_name || r.referred_email}</p>
                      <p className="text-xs text-textsub">{fmtDate(r.created_at)}</p>
                    </div>
                    {r.status === 'active' && (
                      <span className="bg-success-bg text-success text-[10px] font-800 px-2 py-0.5 rounded-full">Active</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {referred.length === 0 && (
            <EmptyState icon="👥" title="No referrals yet" subtitle="Share your code and start earning rewards!" />
          )}

          <div className="h-4" />
        </div>
      </div>
    </Layout>
  );
}
