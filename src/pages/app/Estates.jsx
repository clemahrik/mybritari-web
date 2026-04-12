import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import TopHeader from '../../components/TopHeader';
import Modal from '../../components/Modal';
import Spinner from '../../components/Spinner';
import EmptyState from '../../components/EmptyState';
import { useToast } from '../../components/Toast';
import api, { estatesAPI, plansAPI, plotsAPI, contractsAPI } from '../../services/api';
import { fmtMoney, parseArr } from '../../utils';

function EstateCard({ estate, onReserve }) {
  const feats = parseArr(estate.features);
  return (
    <div className="bg-white rounded-2xl overflow-hidden border border-border mb-4">
      {estate.cover_image ? (
        <div className="relative">
          <img src={estate.cover_image} alt={estate.name} className="w-full h-48 object-cover" />
          {estate.is_exclusive ? (
            <span className="absolute top-3 left-3 bg-navy text-white text-[10px] font-800 px-2.5 py-1 rounded-full uppercase tracking-wide">Exclusive</span>
          ) : null}
        </div>
      ) : (
        <div className="w-full h-48 bg-surface-2 flex items-center justify-center">
          <span className="text-4xl">🏘</span>
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
            {feats.slice(0,4).map(f => (
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
  const [estates,  setEstates]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState('');
  const [stateFilter, setStateFilter] = useState('');
  const [showCode, setShowCode] = useState(false);
  const [accessCode, setAccessCode] = useState('');
  const [unlocking, setUnlocking] = useState(false);

  // Reservation modal state
  const [reserveModal, setReserveModal] = useState(false);
  const [selectedEstate, setSelectedEstate] = useState(null);
  const [reserveStep, setReserveStep] = useState(1);
  const [plans, setPlans] = useState([]);
  const [plots, setPlots] = useState([]);
  const [payType, setPayType] = useState('');  // 'full' | 'installment'
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [numPlots, setNumPlots] = useState(1);
  const [selectedPlot, setSelectedPlot] = useState(null);
  const [depositAmount, setDepositAmount] = useState('');
  const [reserving, setReserving] = useState(false);
  const [reservedContract, setReservedContract] = useState(null);

  useEffect(() => {
    estatesAPI.getAll().then(r => setEstates(r.data.data || [])).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const openReserve = useCallback(async (estate) => {
    setSelectedEstate(estate);
    setReserveStep(1);
    setPayType('');
    setSelectedPlan(null);
    setDepositAmount('');
    setReservedContract(null);
    setReserveModal(true);
    // Load plans and plots
    const [pR, plR] = await Promise.all([
      plansAPI.getByEstate(estate.id).catch(() => ({ data: { data: [] } })),
      plotsAPI.getByEstate(estate.id).catch(() => ({ data: { data: [] } })),
    ]);
    setPlans(pR.data.data || []);
    setPlots((plR.data.data || []).filter(p => p.status === 'available'));
  }, []);

  async function handleUnlock() {
    if (!accessCode.trim()) return;
    setUnlocking(true);
    try {
      await estatesAPI.unlock(accessCode.trim().toUpperCase());
      showToast('Access code accepted! New estates unlocked.', 'success');
      const r = await estatesAPI.getAll();
      setEstates(r.data.data || []);
      setShowCode(false); setAccessCode('');
    } catch (e) {
      showToast(e?.response?.data?.message || 'Invalid access code', 'error');
    } finally { setUnlocking(false); }
  }

  async function handleReserve() {
    if (!selectedEstate) return;
    setReserving(true);
    try {
      const plotId = selectedPlot?.id;
      const res = await contractsAPI.reserve({
        estate_id:      selectedEstate.id,
        purchase_type:  payType,
        plan_id:        selectedPlan?.id,
        num_plots:      numPlots,
        plot_id:        plotId,
        initial_deposit: payType === 'installment' ? Number(depositAmount) : undefined,
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

  const sqm        = selectedEstate?.standard_plot_size || 200;
  const pricePerPlot = Number(selectedEstate?.price_per_plot || 0);
  const totalPrice = pricePerPlot * numPlots;
  const minDeposit = selectedPlan ? Math.ceil(totalPrice * ((selectedPlan.min_deposit_percent || 10) / 100)) : 0;
  const monthlyAmt = selectedPlan ? Math.ceil((totalPrice - (Number(depositAmount) || minDeposit)) / (selectedPlan.duration_months || 1)) : 0;

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
        <div className="bg-white rounded-2xl border border-border mb-4 overflow-hidden">
          <button
            onClick={() => setShowCode(v => !v)}
            className="w-full flex items-center justify-between p-4"
          >
            <div className="flex items-center gap-3">
              <span className="text-xl">🔐</span>
              <span className="text-sm font-700 text-textmain">Have an exclusive access code?</span>
            </div>
            <span className="text-textmuted">{showCode ? '▲' : '▼'}</span>
          </button>
          {showCode && (
            <div className="px-4 pb-4 flex gap-2">
              <input
                value={accessCode}
                onChange={e => setAccessCode(e.target.value.toUpperCase())}
                placeholder="Enter access code"
                className="flex-1 h-11 px-4 rounded-xl border border-border bg-surface-2 text-sm uppercase tracking-widest"
              />
              <button
                onClick={handleUnlock}
                disabled={unlocking}
                className="bg-red text-white px-5 h-11 rounded-xl text-sm font-700 disabled:opacity-60"
              >
                {unlocking ? <Spinner size="sm" color="white" /> : 'Unlock'}
              </button>
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

      {/* Reservation Modal */}
      <Modal open={reserveModal} onClose={() => setReserveModal(false)} title={selectedEstate?.name}>
        <div className="px-5 pb-6">
          {reserveStep < 4 && (
            <div className="flex gap-1.5 mb-5 mt-2">
              {[1,2,3].map(s => (
                <div key={s} className={`flex-1 h-1 rounded-full ${s <= reserveStep ? 'bg-red' : 'bg-border'}`} />
              ))}
            </div>
          )}

          {/* Step 1: Payment type */}
          {reserveStep === 1 && (
            <div>
              <p className="font-800 text-textmain text-base mb-4">Choose Payment Type</p>
              <div className="space-y-3 mb-4">
                {[
                  { id: 'full', icon: '💎', title: 'Full Payment', sub: `Pay ${fmtMoney(pricePerPlot)} outright` },
                  { id: 'installment', icon: '📅', title: 'Installment Plan', sub: 'Spread payments over months' },
                ].map(t => (
                  <button
                    key={t.id}
                    onClick={() => setPayType(t.id)}
                    className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 text-left transition-all
                      ${payType === t.id ? 'border-red bg-red-light' : 'border-border bg-white'}`}
                  >
                    <span className="text-2xl">{t.icon}</span>
                    <div>
                      <p className={`font-800 text-sm ${payType === t.id ? 'text-red' : 'text-textmain'}`}>{t.title}</p>
                      <p className="text-xs text-textsub">{t.sub}</p>
                    </div>
                  </button>
                ))}
              </div>
              {/* Number of plots */}
              <div className="mb-4">
                <p className="text-xs font-700 text-textsub uppercase tracking-wide mb-2">Number of Plots</p>
                <div className="flex gap-2">
                  {[1,2,3,4,5].map(n => (
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
                onClick={() => setReserveStep(2)}
                className="w-full bg-red text-white py-4 rounded-2xl font-800 disabled:opacity-40"
              >
                Continue →
              </button>
            </div>
          )}

          {/* Step 2: Choose plan / deposit */}
          {reserveStep === 2 && (
            <div>
              <p className="font-800 text-textmain text-base mb-4">
                {payType === 'full' ? 'Choose Plot' : 'Choose Plan'}
              </p>
              {payType === 'installment' && (
                <div className="space-y-2 mb-4">
                  {plans.map(plan => (
                    <button
                      key={plan.id}
                      onClick={() => { setSelectedPlan(plan); setDepositAmount(String(Math.ceil(totalPrice * ((plan.min_deposit_percent || 10) / 100)))); }}
                      className={`w-full flex items-center justify-between p-4 rounded-2xl border-2 text-left transition-all
                        ${selectedPlan?.id === plan.id ? 'border-red bg-red-light' : 'border-border bg-white'}`}
                    >
                      <div>
                        <p className={`font-800 text-sm ${selectedPlan?.id === plan.id ? 'text-red' : 'text-textmain'}`}>{plan.name}</p>
                        <p className="text-xs text-textsub">Min deposit: {plan.min_deposit_percent}%</p>
                      </div>
                      <div className="text-right">
                        <p className="font-800 text-sm text-textmain">
                          {fmtMoney(Math.ceil((totalPrice - Math.ceil(totalPrice * ((plan.min_deposit_percent || 10) / 100))) / (plan.duration_months || 1)))}/mo
                        </p>
                      </div>
                    </button>
                  ))}
                  {selectedPlan && (
                    <div className="mt-3">
                      <p className="text-xs font-700 text-textsub uppercase tracking-wide mb-1.5">Initial Deposit Amount</p>
                      <input
                        type="number"
                        value={depositAmount}
                        onChange={e => setDepositAmount(e.target.value)}
                        className="w-full h-12 px-4 rounded-xl border border-border bg-surface-2 text-textmain text-sm"
                        placeholder={`Minimum: ${fmtMoney(minDeposit)}`}
                      />
                    </div>
                  )}
                </div>
              )}
              {/* Available plots (optional selection) */}
              {plots.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs font-700 text-textsub uppercase tracking-wide mb-2">Select Plot (Optional)</p>
                  <div className="flex gap-2 flex-wrap max-h-32 overflow-y-auto">
                    {plots.slice(0,20).map(p => (
                      <button
                        key={p.id}
                        onClick={() => setSelectedPlot(selectedPlot?.id === p.id ? null : p)}
                        className={`px-3 py-1.5 rounded-xl border text-xs font-700 transition-all
                          ${selectedPlot?.id === p.id ? 'border-red bg-red text-white' : 'border-border text-textsub'}`}
                      >
                        {p.plot_label || p.plot_number}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex gap-2">
                <button onClick={() => setReserveStep(1)} className="flex-1 py-4 rounded-2xl border-2 border-border font-700 text-textsub">← Back</button>
                <button
                  onClick={() => setReserveStep(3)}
                  disabled={payType === 'installment' && !selectedPlan}
                  className="flex-1 py-4 rounded-2xl bg-red text-white font-800 disabled:opacity-40"
                >
                  Continue →
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Confirm */}
          {reserveStep === 3 && (
            <div>
              <p className="font-800 text-textmain text-base mb-4">Confirm Reservation</p>
              <div className="bg-surface rounded-2xl p-4 space-y-3 mb-5">
                {[
                  { label: 'Estate',        val: selectedEstate?.name },
                  { label: 'Payment Type',  val: payType === 'full' ? 'Full Payment' : 'Installment' },
                  { label: 'Plots',         val: `${numPlots} plot${numPlots > 1 ? 's' : ''} (${numPlots * sqm}sqm)` },
                  { label: 'Total Price',   val: fmtMoney(totalPrice) },
                  ...(payType === 'installment' ? [
                    { label: 'Plan',          val: selectedPlan?.name },
                    { label: 'Initial Deposit', val: fmtMoney(depositAmount) },
                    { label: 'Monthly',       val: fmtMoney(monthlyAmt) },
                  ] : []),
                  ...(selectedPlot ? [{ label: 'Plot', val: selectedPlot.plot_label || selectedPlot.plot_number }] : []),
                ].map(r => (
                  <div key={r.label} className="flex items-center justify-between">
                    <span className="text-xs text-textmuted font-700">{r.label}</span>
                    <span className="text-sm font-800 text-textmain">{r.val || '—'}</span>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <button onClick={() => setReserveStep(2)} className="flex-1 py-4 rounded-2xl border-2 border-border font-700 text-textsub">← Back</button>
                <button
                  onClick={handleReserve}
                  disabled={reserving}
                  className="flex-1 py-4 rounded-2xl bg-red text-white font-800 flex items-center justify-center"
                >
                  {reserving ? <Spinner size="sm" color="white" /> : 'Confirm →'}
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Success */}
          {reserveStep === 4 && reservedContract && (
            <div className="flex flex-col items-center py-6 text-center">
              <div className="w-16 h-16 rounded-full bg-success-bg flex items-center justify-center mb-4">
                <span className="text-3xl">✅</span>
              </div>
              <p className="font-900 text-xl text-textmain mb-2">Reserved!</p>
              <p className="text-textsub text-sm mb-1">Contract Number</p>
              <p className="font-900 text-lg text-navy mb-6">{reservedContract.contract_number || '—'}</p>
              <button
                onClick={() => { setReserveModal(false); navigate(`/payment?contractId=${reservedContract.id || reservedContract.contract_id}`); }}
                className="w-full bg-red text-white py-4 rounded-2xl font-800 mb-3"
              >
                Pay Now →
              </button>
              <button onClick={() => { setReserveModal(false); navigate('/contracts'); }} className="text-textsub text-sm font-700">
                View Contracts
              </button>
            </div>
          )}
        </div>
      </Modal>
    </Layout>
  );
}
