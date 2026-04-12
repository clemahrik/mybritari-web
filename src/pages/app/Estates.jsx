import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import TopHeader from '../../components/TopHeader';
import Spinner from '../../components/Spinner';
import EmptyState from '../../components/EmptyState';
import { useToast } from '../../components/Toast';
import { estatesAPI, plansAPI, contractsAPI } from '../../services/api';
import { fmtMoney, parseArr } from '../../utils';

function EstateCard({ estate, onReserve }) {
  const feats = parseArr(estate.features);
  return (
    <div className="bg-white rounded-2xl overflow-hidden border border-border mb-4">
      {estate.cover_image ? (
        <div className="relative">
          <img src={estate.cover_image} alt={estate.name} className="w-full h-48 object-cover" />
          {estate.is_exclusive && (
            <span className="absolute top-3 right-3 bg-red text-white text-xs font-bold px-2 py-1 rounded-full">
              ★ Exclusive
            </span>
          )}
        </div>
      ) : (
        <div className="w-full h-48 bg-surface-2 flex items-center justify-center relative">
          <span className="text-4xl">🏘</span>
          {estate.is_exclusive && (
            <span className="absolute top-3 right-3 bg-red text-white text-xs font-bold px-2 py-1 rounded-full">
              ★ Exclusive
            </span>
          )}
        </div>
      )}
      <div className="p-4">
        <p className="font-900 text-textmain text-base mb-0.5">{estate.name}</p>
        <p className="text-xs text-textsub mb-3">📍 {estate.location}, {estate.state}</p>
        <div className="flex gap-2 flex-wrap mb-3">
          <span className="bg-surface-2 text-textsub text-[11px] font-700 px-2.5 py-1 rounded-full">{fmtMoney(estate.price_per_plot)}/plot</span>
          <span className="bg-surface-2 text-textsub text-[11px] font-700 px-2.5 py-1 rounded-full">{estate.standard_plot_size}sqm</span>
          <span className="bg-success-bg text-success text-[11px] font-700 px-2.5 py-1 rounded-full">{estate.available_plots} available</span>
        </div>
        {feats.length > 0 && (
          <div className="flex gap-1.5 flex-wrap mb-3">
            {feats.slice(0, 4).map(f => (
              <span key={f} className="bg-red-light text-red text-[10px] font-700 px-2 py-0.5 rounded-full">{f}</span>
            ))}
          </div>
        )}
        <button
          onClick={() => onReserve(estate)}
          className="w-full bg-red text-white font-800 py-3 rounded-2xl text-sm active:opacity-80"
        >
          Reserve a Plot →
        </button>
      </div>
    </div>
  );
}

export default function Estates() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [estates,       setEstates]       = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [search,        setSearch]        = useState('');
  const [stateFilter,   setStateFilter]   = useState('');
  const [showUnlock,    setShowUnlock]    = useState(false);
  const [unlockCode,    setUnlockCode]    = useState('');
  const [unlocking,     setUnlocking]     = useState(false);
  const [unlockMessage, setUnlockMessage] = useState('');
  const [unlockSuccess, setUnlockSuccess] = useState(false);

  // Reservation modal
  const [reserveModal,     setReserveModal]     = useState(false);
  const [selectedEstate,   setSelectedEstate]   = useState(null);
  const [reserveStep,      setReserveStep]      = useState(1);
  const [plans,            setPlans]            = useState([]);
  const [payType,          setPayType]          = useState('');      // 'full' | 'installment'
  const [payPeriod,        setPayPeriod]        = useState('monthly'); // 'monthly' | 'weekly'
  const [selectedPlan,     setSelectedPlan]     = useState(null);
  const [numPlots,         setNumPlots]         = useState(1);
  const [depositAmount,    setDepositAmount]    = useState('');
  const [reserving,        setReserving]        = useState(false);
  const [reservedContract, setReservedContract] = useState(null);

  useEffect(() => {
    estatesAPI.getAll()
      .then(r => setEstates(r.data.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const openReserve = useCallback(async (estate) => {
    setSelectedEstate(estate);
    setReserveStep(1);
    setPayType('');
    setPayPeriod('monthly');
    setSelectedPlan(null);
    setDepositAmount('');
    setNumPlots(1);
    setReservedContract(null);
    setReserveModal(true);
    plansAPI.getByEstate(estate.id)
      .then(r => setPlans(r.data.data || []))
      .catch(() => setPlans([]));
  }, []);

  async function handleUnlock() {
    if (!unlockCode.trim()) return;
    setUnlocking(true);
    setUnlockMessage('');
    try {
      const res = await estatesAPI.unlock(unlockCode.trim().toUpperCase());
      if (res?.data?.already_had_access) {
        setUnlockMessage('You already have access to this estate');
        setUnlockSuccess(true);
      } else {
        setUnlockMessage('Estate unlocked! Refreshing...');
        setUnlockSuccess(true);
        setTimeout(async () => {
          const r = await estatesAPI.getAll().catch(() => ({ data: { data: [] } }));
          setEstates(r.data.data || []);
          setShowUnlock(false);
          setUnlockCode('');
          setUnlockMessage('');
        }, 1500);
      }
    } catch {
      setUnlockMessage('Invalid or expired code. Please check and try again.');
      setUnlockSuccess(false);
    } finally { setUnlocking(false); }
  }

  async function handleReserve() {
    if (!selectedEstate) return;
    setReserving(true);
    try {
      const res = await contractsAPI.reserve({
        estate_id:         selectedEstate.id,
        purchase_type:     payType,
        plan_id:           selectedPlan?.id,
        num_plots:         numPlots,
        payment_frequency: payType === 'installment' ? payPeriod : undefined,
        initial_deposit:   payType === 'installment' ? Number(depositAmount) : undefined,
      });
      setReservedContract(res.data.data || res.data);
      setReserveStep(4);
    } catch (e) {
      showToast(e?.response?.data?.message || 'Reservation failed', 'error');
    } finally { setReserving(false); }
  }

  const allStates = [...new Set(estates.map(e => e.state).filter(Boolean))];
  const filtered  = estates.filter(e => {
    const q  = search.toLowerCase();
    const ok = !q || e.name?.toLowerCase().includes(q) || e.location?.toLowerCase().includes(q);
    const st = !stateFilter || e.state === stateFilter;
    return ok && st;
  });

  const sqm          = selectedEstate?.standard_plot_size || 200;
  const pricePerPlot = Number(selectedEstate?.price_per_plot || 0);
  const totalPrice   = pricePerPlot * numPlots;
  const minDeposit   = selectedPlan ? Math.ceil(totalPrice * ((selectedPlan.min_deposit_percent || 10) / 100)) : 0;
  const deposit      = Number(depositAmount) || minDeposit;
  const remaining    = Math.max(0, totalPrice - deposit);
  const durationMos  = selectedPlan?.duration_months || 1;
  const durationWks  = selectedPlan?.duration_weeks || null;
  const monthlyAmt   = selectedPlan ? Math.ceil(remaining / durationMos) : 0;
  const weeklyAmt    = selectedPlan
    ? (durationWks ? Math.ceil(remaining / durationWks) : Math.ceil(remaining / (durationMos * 4)))
    : 0;

  return (
    <Layout>
      <TopHeader title="Our Estates" />
      <div className="px-4 py-4">

        {/* Search */}
        <div className="relative mb-3">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-textmuted">🔍</span>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search estates..."
            className="w-full h-11 pl-10 pr-4 rounded-2xl border border-border bg-white text-[14px] text-textmain"
          />
        </div>

        {/* State filters */}
        {allStates.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-none">
            <button
              onClick={() => setStateFilter('')}
              className={`flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-700 border transition-all
                ${!stateFilter ? 'bg-navy text-white border-navy' : 'bg-white text-textsub border-border'}`}
            >
              All
            </button>
            {allStates.map(s => (
              <button
                key={s}
                onClick={() => setStateFilter(s === stateFilter ? '' : s)}
                className={`flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-700 border transition-all
                  ${stateFilter === s ? 'bg-navy text-white border-navy' : 'bg-white text-textsub border-border'}`}
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {/* Access code unlock */}
        <div className="mb-4">
          <p
            onClick={() => { setShowUnlock(v => !v); setUnlockMessage(''); }}
            className="text-sm text-red font-semibold cursor-pointer py-2 px-4 text-center"
          >
            {showUnlock ? '▲ Hide' : 'Have an access code? Tap to unlock exclusive estates →'}
          </p>
          {showUnlock && (
            <div className="px-4 pb-4">
              <input
                value={unlockCode}
                onChange={e => setUnlockCode(e.target.value.toUpperCase())}
                placeholder="Enter your access code"
                className="w-full border border-border rounded-xl px-4 py-3 text-sm mb-2 uppercase"
              />
              <button
                onClick={handleUnlock}
                disabled={unlocking}
                className="w-full bg-red text-white font-bold py-3 rounded-xl text-sm disabled:opacity-60"
              >
                {unlocking ? 'Unlocking...' : 'Unlock Estate →'}
              </button>
              {unlockMessage && (
                <p className={`text-sm mt-2 text-center font-medium ${unlockSuccess ? 'text-success' : 'text-red'}`}>
                  {unlockMessage}
                </p>
              )}
            </div>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><Spinner size="lg" /></div>
        ) : filtered.length === 0 ? (
          <EmptyState icon="🏘" title="No estates found" subtitle="Try adjusting your search or check back later." />
        ) : (
          filtered.map(e => <EstateCard key={e.id} estate={e} onReserve={openReserve} />)
        )}
      </div>

      {/* Reservation Modal — slide-up sheet */}
      {reserveModal && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center"
          onClick={e => { if (e.target === e.currentTarget) setReserveModal(false); }}
        >
          <div className="bg-white w-full max-w-[430px] rounded-t-3xl p-6 max-h-[85vh] overflow-y-auto">

            {/* Step progress dots */}
            {reserveStep < 4 && (
              <div className="flex gap-1.5 mb-5">
                {[1, 2, 3].map(s => (
                  <div key={s} className={`flex-1 h-1 rounded-full ${s <= reserveStep ? 'bg-red' : 'bg-border'}`} />
                ))}
              </div>
            )}

            {/* ── Step 1: Payment type ── */}
            {reserveStep === 1 && (
              <div>
                <p className="font-800 text-textmain text-base mb-4">Choose Payment Type</p>
                <div className="space-y-3 mb-5">
                  <button
                    onClick={() => setPayType('outright')}
                    className={`w-full text-left p-4 rounded-2xl border-2 transition-all
                      ${payType === 'outright' ? 'border-navy bg-navy' : 'border-border bg-white'}`}
                  >
                    <p className={`font-800 text-sm mb-0.5 ${payType === 'outright' ? 'text-white' : 'text-textmain'}`}>Pay in Full</p>
                    <p className={`text-xs ${payType === 'outright' ? 'text-white/70' : 'text-textsub'}`}>
                      {fmtMoney(pricePerPlot)} — One payment, done
                    </p>
                  </button>
                  <button
                    onClick={() => setPayType('installment')}
                    className={`w-full text-left p-4 rounded-2xl border-2 transition-all
                      ${payType === 'installment' ? 'border-navy bg-navy' : 'border-border bg-white'}`}
                  >
                    <p className={`font-800 text-sm mb-0.5 ${payType === 'installment' ? 'text-white' : 'text-textmain'}`}>Pay in Installments</p>
                    <p className={`text-xs ${payType === 'installment' ? 'text-white/70' : 'text-textsub'}`}>
                      Spread over time — zero interest
                    </p>
                  </button>
                </div>

                {/* Number of plots */}
                <div className="mb-5">
                  <p className="text-xs font-700 text-textsub uppercase tracking-wide mb-2">Number of Plots</p>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map(n => (
                      <button
                        key={n}
                        onClick={() => setNumPlots(n)}
                        className={`flex-1 py-3 rounded-xl border-2 font-800 text-sm transition-all
                          ${numPlots === n ? 'border-red bg-red text-white' : 'border-border text-textmain'}`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-textsub mt-1.5 text-center">{numPlots * sqm}sqm total · {fmtMoney(totalPrice)}</p>
                </div>

                <button
                  disabled={!payType}
                  onClick={() => payType === 'outright' ? setReserveStep(3) : setReserveStep(2)}
                  className="w-full bg-red text-white py-4 rounded-2xl font-800 disabled:opacity-40"
                >
                  Next →
                </button>
              </div>
            )}

            {/* ── Step 2: Choose plan (installments only) ── */}
            {reserveStep === 2 && (
              <div>
                <p className="font-800 text-textmain text-base mb-4">Choose Plan</p>

                {/* Monthly / Weekly tabs */}
                {selectedEstate?.allow_weekly_payment && (
                  <div className="flex gap-2 mb-4">
                    {['monthly', 'weekly'].map(p => (
                      <button
                        key={p}
                        onClick={() => { setPayPeriod(p); setSelectedPlan(null); setDepositAmount(''); }}
                        className={`flex-1 py-2.5 rounded-xl text-sm font-700 border-2 transition-all
                          ${payPeriod === p ? 'border-navy bg-navy text-white' : 'border-border text-textsub'}`}
                      >
                        {p === 'monthly' ? 'Monthly' : 'Weekly'}
                      </button>
                    ))}
                  </div>
                )}

                <div className="space-y-2 mb-4">
                  {plans
                    .filter(plan => !!plan.is_active && (plan.payment_frequency || 'monthly') === payPeriod)
                    .map(plan => {
                    const isWeekly      = plan.payment_frequency === 'weekly';
                    const estDep        = Number(selectedEstate?.initial_deposit_amount || 0);
                    const planDeposit   = estDep || Math.ceil(totalPrice * ((plan.min_deposit_percent || 10) / 100));
                    const planRemaining = Math.max(0, totalPrice - planDeposit);
                    const displayAmt    = isWeekly && plan.duration_weeks
                      ? Math.ceil(planRemaining / plan.duration_weeks)
                      : Math.ceil(planRemaining / (plan.duration_months || 1));
                    const periodLabel   = isWeekly ? '/wk' : '/mo';
                    const durationLabel = isWeekly && plan.duration_weeks
                      ? `${plan.duration_weeks} weeks`
                      : `${plan.duration_months} months`;
                    const isSelected    = selectedPlan?.id === plan.id;
                    return (
                      <button
                        key={plan.id}
                        onClick={() => { setSelectedPlan(plan); setDepositAmount(String(planDeposit)); }}
                        className={`w-full text-left p-4 rounded-2xl border-2 transition-all
                          ${isSelected ? 'border-navy bg-navy' : 'border-border bg-white'}`}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <p className={`font-800 text-sm ${isSelected ? 'text-white' : 'text-textmain'}`}>{plan.name}</p>
                            <p className={`text-xs mt-0.5 ${isSelected ? 'text-white/70' : 'text-textsub'}`}>
                              {durationLabel} · deposit: {fmtMoney(planDeposit)}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className={`font-800 text-sm ${isSelected ? 'text-white' : 'text-textmain'}`}>
                              {fmtMoney(displayAmt)}{periodLabel}
                            </p>
                            <span className="text-[10px] font-700 px-1.5 py-0.5 rounded-full bg-success-bg text-success">
                              Zero Interest
                            </span>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                  {plans.filter(p => !!p.is_active && (p.payment_frequency || 'monthly') === payPeriod).length === 0 && (
                    <p className="text-center text-textsub text-sm py-4">No plans available. Please contact support.</p>
                  )}
                </div>

                {selectedPlan && (
                  <div className="mb-4">
                    <p className="text-xs font-700 text-textsub uppercase tracking-wide mb-1.5">Initial Deposit</p>
                    <input
                      type="number"
                      value={depositAmount}
                      onChange={e => setDepositAmount(e.target.value)}
                      className="w-full h-12 px-4 rounded-xl border border-border bg-surface-2 text-textmain font-800 text-base mb-2"
                      placeholder={`Minimum: ${fmtMoney(minDeposit)}`}
                    />
                    <div className="flex justify-between text-xs text-textsub">
                      <span>Remaining after deposit</span>
                      <span className="font-800 text-textmain">{fmtMoney(Math.max(0, totalPrice - (Number(depositAmount) || 0)))}</span>
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  <button onClick={() => setReserveStep(1)} className="flex-1 py-4 rounded-2xl border-2 border-border font-700 text-textsub">← Back</button>
                  <button
                    onClick={() => setReserveStep(3)}
                    disabled={!selectedPlan}
                    className="flex-1 py-4 rounded-2xl bg-red text-white font-800 disabled:opacity-40"
                  >
                    Next →
                  </button>
                </div>
              </div>
            )}

            {/* ── Step 3: Confirm ── */}
            {reserveStep === 3 && (
              <div>
                <p className="font-800 text-textmain text-base mb-4">Confirm Reservation</p>

                {/* Navy summary card */}
                <div className="bg-navy rounded-2xl overflow-hidden mb-4">
                  <div className="p-4 space-y-2.5">
                    {[
                      { label: 'Estate',      val: selectedEstate?.name },
                      { label: 'Payment',     val: payType === 'outright' ? 'Full Payment' : 'Installment' },
                      { label: 'Plots',       val: `${numPlots} plot${numPlots > 1 ? 's' : ''} (${numPlots * sqm}sqm)` },
                      { label: 'Total Price', val: fmtMoney(totalPrice) },
                      ...(payType === 'installment' && selectedPlan ? [
                        { label: 'Plan',    val: selectedPlan.name },
                        { label: 'Deposit', val: fmtMoney(deposit) },
                        { label: payPeriod === 'weekly' ? 'Weekly' : 'Monthly', val: fmtMoney(payPeriod === 'weekly' ? weeklyAmt : monthlyAmt) },
                      ] : []),
                      { label: 'Plot', val: 'To be assigned by Britari team' },
                    ].map(r => (
                      <div key={r.label} className="flex items-center justify-between">
                        <span className="text-xs text-white/60 font-700">{r.label}</span>
                        <span className="text-sm font-800 text-white">{r.val || '—'}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Amber note */}
                <div className="bg-warning/10 border border-warning/30 rounded-2xl p-3 mb-5">
                  <p className="text-xs text-warning font-700">
                    Your plot will be assigned by our team after payment confirmation.
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setReserveStep(payType === 'outright' ? 1 : 2)}
                    className="flex-1 py-4 rounded-2xl border-2 border-border font-700 text-textsub"
                  >
                    ← Back
                  </button>
                  <button
                    onClick={handleReserve}
                    disabled={reserving}
                    className="flex-1 py-4 rounded-2xl bg-red text-white font-800 flex items-center justify-center"
                  >
                    {reserving ? <Spinner size="sm" color="white" /> : 'Confirm Reservation →'}
                  </button>
                </div>
              </div>
            )}

            {/* ── Step 4: Success ── */}
            {reserveStep === 4 && reservedContract && (
              <div className="flex flex-col items-center py-4 text-center">
                <div className="w-16 h-16 rounded-full bg-success-bg flex items-center justify-center mb-4">
                  <span className="text-3xl text-success font-900">✓</span>
                </div>
                <p className="font-900 text-xl text-textmain mb-1">Reservation Confirmed!</p>
                <p className="text-textsub text-sm mb-1">Contract No</p>
                <p className="font-900 text-lg text-navy mb-2">{reservedContract.contract_number || '—'}</p>
                <p className="text-sm text-textsub mb-6">Make your deposit to secure your reservation</p>
                <button
                  onClick={() => { setReserveModal(false); navigate(`/payment?contractId=${reservedContract.id || reservedContract.contract_id}`); }}
                  className="w-full bg-red text-white py-4 rounded-2xl font-800 mb-3"
                >
                  Pay Now →
                </button>
                <button
                  onClick={() => setReserveModal(false)}
                  className="w-full border-2 border-navy text-navy py-4 rounded-2xl font-800"
                >
                  Pay Later
                </button>
              </div>
            )}

          </div>
        </div>
      )}
    </Layout>
  );
}
