import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import TopHeader from '../../components/TopHeader';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { fmtMoney, fmtDate, greet, pct } from '../../utils';
import Spinner from '../../components/Spinner';

const QUICK = [
  { icon: '↑', label: 'Pay Now',    path: '/payment'         },
  { icon: '🏘', label: 'Estates',   path: '/estates'         },
  { icon: '📄', label: 'Contracts', path: '/contracts'       },
  { icon: '📥', label: 'Receipt',   path: '/payment-receipt' },
  { icon: '💰', label: 'Loan',      path: '/loan'            },
  { icon: '🗂', label: 'Docs',      path: '/documents'       },
  { icon: '📍', label: 'Inspect',   path: '/inspection'      },
  { icon: '🎁', label: 'Refer',     path: '/referral'        },
];

function ProgressBar({ percent }) {
  return (
    <div className="h-1.5 rounded-full bg-white/20 overflow-hidden">
      <div className="h-full bg-red rounded-full" style={{ width: `${percent}%`, transition: 'width 0.6s' }} />
    </div>
  );
}

export default function Dashboard() {
  const navigate      = useNavigate();
  const { user, logout } = useAuth();
  const [contracts,  setContracts]  = useState([]);
  const [estates,    setEstates]    = useState([]);
  const [notifs,     setNotifs]     = useState([]);
  const [settings,   setSettings]   = useState({});
  const [bankAccount,setBankAccount]= useState(null);
  const [loading,    setLoading]    = useState(true);
  const [showBal,    setShowBal]    = useState(true);
  const [promoIdx,   setPromoIdx]   = useState(0);
  const promoTimer = useRef(null);

  const load = useCallback(async () => {
    try {
      const [cR, nR, eR, sR, bR] = await Promise.all([
        api.get('/contracts').catch(() => ({ data: { data: [] } })),
        api.get('/notifications').catch(() => ({ data: { data: [] } })),
        api.get('/estates').catch(() => ({ data: { data: [] } })),
        api.get('/settings').catch(() => ({ data: { data: {} } })),
        api.get('/bank-accounts?primary=true').catch(() => ({ data: { data: null } })),
      ]);
      setContracts(cR.data.data || []);
      setNotifs(nR.data.data    || []);
      setEstates((eR.data.data  || []).slice(0, 3));
      setSettings(sR.data.data  || {});
      setBankAccount(bR.data.data || null);
    } catch {} finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, []);

  useEffect(() => {
    promoTimer.current = setInterval(() => setPromoIdx(i => (i + 1) % 3), 5000);
    return () => clearInterval(promoTimer.current);
  }, []);

  const totalPaid  = contracts.reduce((s, c) => s + (Number(c.amount_paid) || 0), 0);
  const totalOwing = contracts.reduce((s, c) => s + (Number(c.outstanding_balance) || 0), 0);
  const totalValue = totalPaid + totalOwing;
  const active     = contracts.filter(c => c.status === 'active');
  const unread     = notifs.filter(n => !n.is_read).length;

  const promos = [
    { title: settings.promo_1_title || 'Pay Over 24 Months',    sub: settings.promo_1_subtitle || 'Zero interest — same total price always' },
    { title: settings.promo_2_title || 'Refer & Earn',           sub: settings.promo_2_subtitle || '20 full referrals = a FREE plot of land' },
    { title: settings.promo_3_title || 'Property-Backed Loans',  sub: settings.promo_3_subtitle || 'Get up to 50% of your plot value as cash' },
  ];

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-navy">
      <Spinner size="lg" color="white" />
    </div>
  );

  const isSuspended = user?.is_suspended;
  const kycStatus   = user?.kyc_status;

  return (
    <Layout>
      {/* Suspension overlay */}
      {isSuspended && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/90 px-6">
          <div className="bg-white rounded-3xl p-6 text-center max-w-xs w-full">
            <div className="text-4xl mb-3">⛔</div>
            <h2 className="text-lg font-900 text-textmain mb-2">Account Suspended</h2>
            <p className="text-sm text-textsub mb-5">Your account has been suspended. Please contact support to resolve this issue.</p>
            <button onClick={() => navigate('/support')} className="w-full bg-red text-white py-3 rounded-2xl font-700 mb-3">Contact Support</button>
            <button onClick={logout} className="text-red text-sm font-700">Sign Out</button>
          </div>
        </div>
      )}

      {/* Top Header */}
      <TopHeader
        title=""
        rightElement={
          <button onClick={() => navigate('/notifications')} className="relative">
            <span className="text-white text-xl">🔔</span>
            {unread > 0 && (
              <span className="absolute -top-1 -right-1 bg-red text-white text-[9px] font-800 min-w-[16px] h-4 rounded-full flex items-center justify-center px-1">
                {unread > 9 ? '9+' : unread}
              </span>
            )}
          </button>
        }
      />

      <div className="overflow-y-auto">
        {/* Navy header section */}
        <div className="bg-navy px-5 pb-6 -mt-[56px] pt-[72px]">
          <div className="flex items-center justify-between mb-5">
            <div>
              <p className="text-white/60 text-sm">{greet()},</p>
              <p className="text-white font-900 text-xl">{user?.first_name} {user?.last_name}</p>
            </div>
            <button
              onClick={() => navigate('/profile')}
              className="w-11 h-11 rounded-full bg-red flex items-center justify-center"
            >
              <span className="text-white font-800 text-base">
                {(user?.first_name?.[0] || '') + (user?.last_name?.[0] || '')}
              </span>
            </button>
          </div>

          {/* Portfolio card */}
          <div className="bg-navy-mid rounded-2xl p-5 border border-white/10">
            <div className="flex items-center justify-between mb-4">
              <p className="text-white/60 text-xs font-700 uppercase tracking-wide">Portfolio Value</p>
              <button onClick={() => setShowBal(v => !v)} className="text-white/60 text-sm">
                {showBal ? '👁' : '👁‍🗨'}
              </button>
            </div>
            <p className="text-white font-900 text-3xl mb-1">
              {showBal ? fmtMoney(totalValue) : '₦ ••••••'}
            </p>
            <p className="text-white/50 text-xs mb-5">{active.length} active contract{active.length !== 1 ? 's' : ''}</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white/10 rounded-xl px-3 py-2.5 border border-white/10">
                <p className="text-white/50 text-[10px] font-700 mb-1">TOTAL PAID</p>
                <p className="text-white font-800 text-sm">{showBal ? fmtMoney(totalPaid) : '••••'}</p>
              </div>
              <div className="bg-white/10 rounded-xl px-3 py-2.5 border border-white/10">
                <p className="text-white/50 text-[10px] font-700 mb-1">OUTSTANDING</p>
                <p className="text-white font-800 text-sm">{showBal ? fmtMoney(totalOwing) : '••••'}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="px-4 mt-4">
          {/* KYC banner */}
          {(kycStatus === 'not_submitted' || kycStatus === 'rejected') && (
            <button
              onClick={() => navigate('/kyc')}
              className="w-full bg-warning-bg border border-warning/30 rounded-2xl p-4 flex items-center gap-3 mb-4 text-left"
            >
              <span className="text-2xl">⚠️</span>
              <div className="flex-1">
                <p className="text-sm font-800 text-warning">
                  {kycStatus === 'rejected' ? 'KYC Rejected — Resubmit' : 'Complete Your KYC'}
                </p>
                <p className="text-xs text-warning/70 mt-0.5">
                  {kycStatus === 'rejected' ? 'Your KYC was rejected. Tap to resubmit.' : 'Verify your identity to unlock all features.'}
                </p>
              </div>
              <span className="text-warning font-800">→</span>
            </button>
          )}

          {/* Quick action buttons */}
          <div className="grid grid-cols-4 gap-2 mb-5">
            {[
              { icon: '💳', label: 'Pay Now',       path: '/payment'         },
              { icon: '🏦', label: 'Transfer',       path: '/payment'         },
              { icon: '🎧', label: 'Support',        path: '/support'         },
              { icon: '📥', label: 'Receipt',        path: '/payment-receipt' },
            ].map(b => (
              <button
                key={b.label}
                onClick={() => navigate(b.path)}
                className="flex flex-col items-center gap-1.5 bg-white border border-border rounded-2xl py-3 active:bg-surface-2"
              >
                <span className="text-2xl">{b.icon}</span>
                <span className="text-[10px] font-700 text-textsub">{b.label}</span>
              </button>
            ))}
          </div>

          {/* Promo banner */}
          <div className="bg-navy rounded-2xl p-5 mb-5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 rounded-full bg-white/5 -translate-y-1/2 translate-x-1/2" />
            <p className="text-red text-xs font-800 uppercase tracking-wide mb-1">Featured Offer</p>
            <p className="text-white font-900 text-base mb-1">{promos[promoIdx].title}</p>
            <p className="text-white/60 text-xs">{promos[promoIdx].sub}</p>
            <div className="flex gap-1.5 mt-4">
              {promos.map((_, i) => (
                <div key={i} className={`h-0.5 rounded-full transition-all ${i === promoIdx ? 'w-6 bg-red' : 'w-2 bg-white/30'}`} />
              ))}
            </div>
          </div>

          {/* My Contracts */}
          {active.length > 0 && (
            <div className="mb-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-base font-800 text-textmain">My Contracts</p>
                <button onClick={() => navigate('/contracts')} className="text-red text-sm font-700">View All →</button>
              </div>
              <div className="space-y-3">
                {active.slice(0, 3).map(c => {
                  const p = pct(c.amount_paid, c.total_amount);
                  return (
                    <div key={c.id} className="bg-white rounded-2xl p-4 border border-border">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="text-sm font-800 text-textmain">{c.estate_name || 'Estate'}</p>
                          <p className="text-xs text-textsub">{c.contract_number} · Plot {c.plot_label || c.plot_id || '—'}</p>
                        </div>
                        <span className="bg-success-bg text-success text-[10px] font-700 px-2 py-0.5 rounded-full uppercase">{c.status}</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-surface-2 mb-2">
                        <div className="h-full bg-red rounded-full transition-all" style={{ width: `${p}%` }} />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-textsub">{p}% paid · {fmtMoney(c.outstanding_balance)} left</span>
                        <button onClick={() => navigate(`/payment?contractId=${c.id}`)} className="text-xs font-800 text-red">Pay Now →</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Featured Estates */}
          {estates.length > 0 && (
            <div className="mb-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-base font-800 text-textmain">Featured Estates</p>
                <button onClick={() => navigate('/estates')} className="text-red text-sm font-700">View All →</button>
              </div>
              <div className="space-y-3">
                {estates.map(e => (
                  <div key={e.id} className="bg-white rounded-2xl overflow-hidden border border-border">
                    {e.cover_image && (
                      <img src={e.cover_image} alt={e.name} className="w-full h-36 object-cover" />
                    )}
                    <div className="p-4">
                      <p className="font-800 text-textmain text-sm">{e.name}</p>
                      <p className="text-xs text-textsub mt-0.5">📍 {e.location}, {e.state}</p>
                      <div className="flex items-center justify-between mt-3">
                        <p className="text-sm font-800 text-red">{fmtMoney(e.price_per_plot)}<span className="text-xs text-textmuted font-500">/plot</span></p>
                        <button onClick={() => navigate('/estates')} className="text-xs font-700 text-navy bg-surface-2 px-3 py-1.5 rounded-xl">View →</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick Access */}
          <div className="mb-6">
            <p className="text-base font-800 text-textmain mb-3">Quick Access</p>
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
              {QUICK.map(q => (
                <button
                  key={q.label}
                  onClick={() => navigate(q.path)}
                  className="flex-shrink-0 flex flex-col items-center gap-1.5 bg-white border border-border rounded-2xl px-4 py-3 min-w-[70px]"
                >
                  <span className="text-xl">{q.icon}</span>
                  <span className="text-[10px] font-700 text-textsub whitespace-nowrap">{q.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="h-4" />
        </div>
      </div>
    </Layout>
  );
}
