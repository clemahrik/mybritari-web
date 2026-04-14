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
  const sizes = parseArr(estate.plot_sizes).filter(s => s.is_active !== false && Number(s.price) > 0);
  const startPrice = sizes.length > 0
    ? Math.min(...sizes.map(s => Number(s.price)))
    : Number(estate.price_per_plot || 0);
  const maxPrice = sizes.length > 0
    ? Math.max(...sizes.map(s => Number(s.price)))
    : startPrice;

  return (
    <div className="bg-white rounded-2xl overflow-hidden border border-border mb-4 shadow-sm">
      {/* Image */}
      {estate.cover_image ? (
        <div className="relative">
          <img src={estate.cover_image} alt={estate.name} className="w-full h-52 object-cover" />
          {!!estate.is_exclusive && (
            <span className="absolute top-3 right-3 bg-red text-white text-xs font-bold px-2.5 py-1 rounded-full">
              ★ Exclusive
            </span>
          )}
        </div>
      ) : (
        <div className="w-full h-52 bg-surface-2 flex items-center justify-center relative">
          <span className="text-4xl">🏘</span>
          {!!estate.is_exclusive && (
            <span className="absolute top-3 right-3 bg-red text-white text-xs font-bold px-2.5 py-1 rounded-full">
              ★ Exclusive
            </span>
          )}
        </div>
      )}

      <div className="p-4">
        <p className="font-900 text-textmain text-lg mb-0.5">{estate.name}</p>
        <p className="text-xs text-textsub mb-3">📍 {estate.location}, {estate.state}</p>

        {/* ── Prominent Price Panel ── */}
        {startPrice > 0 && (
          <div className="bg-navy rounded-2xl px-4 pt-4 pb-3 mb-3">
            <p className="text-[11px] text-white/50 font-700 uppercase tracking-widest mb-0.5">
              {sizes.length > 1 ? 'Plot Price — Starting From' : 'Price Per Plot'}
            </p>
            <div className="flex items-end gap-1 mb-2">
              <p className="text-3xl font-900 text-white leading-none">{fmtMoney(startPrice)}</p>
              {sizes.length > 1 && maxPrice > startPrice && (
                <p className="text-base font-700 text-white/60 leading-none mb-0.5"> – {fmtMoney(maxPrice)}</p>
              )}
            </div>

            {/* Size breakdown chips */}
            {sizes.length > 0 ? (
              <div className="flex gap-1.5 flex-wrap mb-2.5">
                {sizes.map(s => (
                  <span key={s.id || s.label} className="bg-white/10 text-white text-[11px] font-700 px-2.5 py-1 rounded-full">
                    {s.label} · {fmtMoney(s.price)}
                  </span>
                ))}
              </div>
            ) : estate.standard_plot_size > 0 ? (
              <p className="text-xs text-white/50 mb-2.5">{estate.standard_plot_size} sqm per plot</p>
            ) : null}

            {/* Badges row */}
            <div className="flex gap-2 flex-wrap">
              <span className="bg-success/20 text-success text-[11px] font-700 px-2.5 py-1 rounded-full">
                ✓ Zero Interest Installment
              </span>
              {estate.available_plots > 0 && (
                <span className="bg-white/10 text-white/80 text-[11px] font-700 px-2.5 py-1 rounded-full">
                  {estate.available_plots} plots available
                </span>
              )}
            </div>
          </div>
        )}

        {/* Features */}
        {feats.length > 0 && (
          <div className="flex gap-1.5 flex-wrap mb-3">
            {feats.slice(0, 4).map(f => (
              <span key={f} className="bg-red-light text-red text-[10px] font-700 px-2 py-0.5 rounded-full">{f}</span>
            ))}
          </div>
        )}

        <button
          onClick={() => onReserve(estate)}
          className="w-full bg-red text-white font-800 py-3.5 rounded-2xl text-sm active:opacity-80"
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

  // Reservation modal
  const [reserveModal,     setReserveModal]     = useState(false);
  const [selectedEstate,   setSelectedEstate]   = useState(null);
  const [selectedPlotSize, setSelectedPlotSize] = useState(null); // {label,price,available_plots}
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
    // Auto-select the first active plot size (if estate has plot sizes defined)
    const sizes = parseArr(estate.plot_sizes).filter(s => s.is_active !== false);
    setSelectedPlotSize(sizes.length > 0 ? sizes[0] : null);
    setReserveModal(true);
    plansAPI.getByEstate(estate.id)
      .then(r => setPlans(r.data.data || []))
      .catch(() => setPlans([]));
  }, []);

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
        initial_deposit:   payType === 'installment' ? deposit : undefined,
        plot_size_label:   selectedPlotSize?.label || null,
        price_per_plot:    pricePerPlot,
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

  const activePlotSizes = parseArr(selectedEstate?.plot_sizes).filter(s => s.is_active !== false);
  const sqm          = selectedPlotSize ? (parseInt(selectedPlotSize.label) || selectedEstate?.standard_plot_size || 200) : (selectedEstate?.standard_plot_size || 200);
  const pricePerPlot = selectedPlotSize ? Number(selectedPlotSize.price || 0) : Number(selectedEstate?.price_per_plot || 0);
  const totalPrice   = pricePerPlot * numPlots;
  const durationMos  = selectedPlan?.duration_months || 1;
  const durationWks  = selectedPlan?.duration_weeks || null;
  // Minimum deposit = one installment period (weekly or monthly) based on full plot price
  const minDeposit   = selectedPlan
    ? (payPeriod === 'weekly'
        ? (durationWks ? Math.ceil(totalPrice / durationWks) : Math.ceil(totalPrice / (durationMos * 4)))
        : Math.ceil(totalPrice / durationMos))
    : 0;
  const deposit      = Number(depositAmount) || minDeposit;
  const remaining    = Math.max(0, totalPrice - deposit);
  const monthlyAmt   = selectedPlan ? Math.ceil(remaining / Math.max(1, durationMos - 1)) : 0;
  const weeklyAmt    = selectedPlan
    ? (durationWks ? Math.ceil(remaining / Math.max(1, durationWks - 1)) : Math.ceil(remaining / Math.max(1, durationMos * 4 - 1)))
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
                <p className="font-800 text-textmain text-base mb-3">Choose Payment Type</p>

                {/* Live cost banner */}
                <div className="bg-navy rounded-2xl px-4 py-3 mb-4 flex items-center justify-between">
                  <div>
                    <p className="text-[11px] text-white/50 font-700 uppercase tracking-wide">Total for {numPlots} plot{numPlots > 1 ? 's' : ''}</p>
                    <p className="text-2xl font-900 text-white leading-tight">{totalPrice > 0 ? fmtMoney(totalPrice) : '—'}</p>
                  </div>
                  {selectedPlotSize ? (
                    <div className="text-right">
                      <p className="text-[11px] text-white/50 font-700">Plot size</p>
                      <p className="text-sm font-800 text-white">{selectedPlotSize.label}</p>
                      <p className="text-xs text-white/60">{fmtMoney(pricePerPlot)}/plot</p>
                    </div>
                  ) : pricePerPlot > 0 ? (
                    <div className="text-right">
                      <p className="text-[11px] text-white/50 font-700">Per plot</p>
                      <p className="text-sm font-800 text-white">{fmtMoney(pricePerPlot)}</p>
                    </div>
                  ) : null}
                </div>

                {/* Plot size selector — only shown when estate has multiple sizes */}
                {activePlotSizes.length > 0 && (
                  <div className="mb-5">
                    <p className="text-xs font-700 text-textsub uppercase tracking-wide mb-2">Plot Size</p>
                    <div className="flex gap-2 flex-wrap">
                      {activePlotSizes.map(s => (
                        <button
                          key={s.id || s.label}
                          onClick={() => setSelectedPlotSize(s)}
                          className={`px-4 py-2.5 rounded-xl border-2 text-sm font-700 transition-all
                            ${selectedPlotSize?.label === s.label ? 'border-red bg-red text-white' : 'border-border text-textmain'}`}
                        >
                          <span>{s.label}</span>
                          <span className={`block text-[11px] mt-0.5 ${selectedPlotSize?.label === s.label ? 'text-white/80' : 'text-textsub'}`}>{fmtMoney(s.price)}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-3 mb-5">
                  <button
                    onClick={() => setPayType('outright')}
                    className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all
                      ${payType === 'outright' ? 'border-navy bg-navy' : 'border-navy bg-surface-2'}`}
                  >
                    <span className="text-2xl flex-shrink-0">💵</span>
                    <div className="flex-1 text-left">
                      <p className={`font-800 text-sm mb-0.5 ${payType === 'outright' ? 'text-white' : 'text-textmain'}`}>Pay in Full</p>
                      <p className={`text-xs ${payType === 'outright' ? 'text-white/70' : 'text-textsub'}`}>
                        {fmtMoney(pricePerPlot)} — One payment, done
                      </p>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all
                      ${payType === 'outright' ? 'border-white bg-white' : 'border-[#0B1F3A] bg-transparent'}`}>
                      {payType === 'outright' && <div className="w-2.5 h-2.5 rounded-full bg-navy" />}
                    </div>
                  </button>
                  <button
                    onClick={() => setPayType('installment')}
                    className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all
                      ${payType === 'installment' ? 'border-navy bg-navy' : 'border-navy bg-surface-2'}`}
                  >
                    <span className="text-2xl flex-shrink-0">📅</span>
                    <div className="flex-1 text-left">
                      <p className={`font-800 text-sm mb-0.5 ${payType === 'installment' ? 'text-white' : 'text-textmain'}`}>Pay in Installments</p>
                      <p className={`text-xs ${payType === 'installment' ? 'text-white/70' : 'text-textsub'}`}>
                        Spread over time — zero interest
                      </p>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all
                      ${payType === 'installment' ? 'border-white bg-white' : 'border-[#0B1F3A] bg-transparent'}`}>
                      {payType === 'installment' && <div className="w-2.5 h-2.5 rounded-full bg-navy" />}
                    </div>
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
                    const totalPeriods  = isWeekly
                      ? (plan.duration_weeks  || 52)
                      : (plan.duration_months || 12);
                    const paymentAmt    = Math.ceil(totalPrice / totalPeriods);
                    const periodLabel   = isWeekly ? '/wk' : '/mo';
                    const durationLabel = isWeekly
                      ? `${plan.duration_weeks} weeks`
                      : `${plan.duration_months} months`;
                    const isSelected    = selectedPlan?.id === plan.id;
                    return (
                      <button
                        key={plan.id}
                        onClick={() => { setSelectedPlan(plan); setDepositAmount(String(paymentAmt)); }}
                        className={`w-full text-left p-4 rounded-2xl border-2 transition-all
                          ${isSelected ? 'border-navy bg-navy' : 'border-navy bg-white'}`}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <p className={`font-800 text-sm ${isSelected ? 'text-white' : 'text-textmain'}`}>{plan.name}</p>
                            <p className={`text-xs mt-0.5 ${isSelected ? 'text-white/70' : 'text-textsub'}`}>
                              {totalPeriods} equal payments · {durationLabel}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className={`font-800 text-sm ${isSelected ? 'text-white' : 'text-textmain'}`}>
                              {fmtMoney(paymentAmt)}{periodLabel}
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
                    <p className="text-xs font-700 text-textsub uppercase tracking-wide mb-1.5">
                      Pay More Upfront <span className="font-400 normal-case tracking-normal">(optional — default is equal payments)</span>
                    </p>
                    <input
                      type="number"
                      value={depositAmount}
                      onChange={e => setDepositAmount(e.target.value)}
                      className="w-full h-12 px-4 rounded-xl border border-border bg-surface-2 text-textmain font-800 text-base mb-2"
                      placeholder={`Default 1st payment: ${fmtMoney(minDeposit)}`}
                    />
                    <div className="flex justify-between text-xs text-textsub">
                      <span>Remaining after 1st payment</span>
                      <span className="font-800 text-textmain">{fmtMoney(Math.max(0, totalPrice - (Number(depositAmount) || minDeposit)))}</span>
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

                {/* Total price hero */}
                <div className="bg-navy rounded-2xl p-4 mb-3 text-center">
                  <p className="text-xs text-white/50 font-700 uppercase tracking-widest mb-1">
                    {payType === 'outright' ? 'You Are Paying' : 'Total Amount'}
                  </p>
                  <p className="text-4xl font-900 text-white mb-1">{fmtMoney(totalPrice)}</p>
                  <p className="text-xs text-white/60">
                    {numPlots} plot{numPlots > 1 ? 's' : ''} · {selectedPlotSize ? selectedPlotSize.label : `${sqm}sqm`} · {fmtMoney(pricePerPlot)}/plot
                  </p>
                  {payType === 'installment' && selectedPlan && (
                    <div className="mt-3 pt-3 border-t border-white/10 flex justify-around text-center">
                      <div>
                        <p className="text-xs text-white/50 font-700">1st Payment</p>
                        <p className="text-base font-900 text-white">{fmtMoney(deposit)}</p>
                      </div>
                      <div className="w-px bg-white/10" />
                      <div>
                        <p className="text-xs text-white/50 font-700">{payPeriod === 'weekly' ? 'Weekly' : 'Monthly'} Payment</p>
                        <p className="text-base font-900 text-white">{fmtMoney(payPeriod === 'weekly' ? weeklyAmt : monthlyAmt)}</p>
                      </div>
                      <div className="w-px bg-white/10" />
                      <div>
                        <p className="text-xs text-white/50 font-700">Duration</p>
                        <p className="text-base font-900 text-white">
                          {payPeriod === 'weekly' && selectedPlan.duration_weeks ? `${selectedPlan.duration_weeks}wks` : `${selectedPlan.duration_months}mo`}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Detail rows */}
                <div className="bg-surface-2 rounded-2xl p-4 space-y-2.5 mb-4">
                  {[
                    { label: 'Estate',  val: selectedEstate?.name },
                    { label: 'Payment', val: payType === 'outright' ? 'Full Payment' : `Installment — ${selectedPlan?.name}` },
                    { label: 'Plots',   val: `${numPlots} plot${numPlots > 1 ? 's' : ''}` },
                    { label: 'Plot',    val: 'Assigned by Britari team after payment' },
                  ].map(r => (
                    <div key={r.label} className="flex items-start justify-between gap-4">
                      <span className="text-xs text-textsub font-700 shrink-0">{r.label}</span>
                      <span className="text-xs font-800 text-textmain text-right">{r.val || '—'}</span>
                    </div>
                  ))}
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
