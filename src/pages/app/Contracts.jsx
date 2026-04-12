import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import TopHeader from '../../components/TopHeader';
import EmptyState from '../../components/EmptyState';
import Spinner from '../../components/Spinner';
import { contractsAPI } from '../../services/api';
import { fmtMoney, fmtDate, pct } from '../../utils';

const TABS    = ['All', 'Active', 'Completed', 'Forfeited'];
const TAB_MAP = { All: null, Active: 'active', Completed: 'completed', Forfeited: 'forfeited' };

function ScheduleRow({ period, contractId, navigate }) {
  const st = (period.status || 'upcoming').toLowerCase();

  if (st === 'paid') {
    return (
      <div className="flex items-center justify-between py-3 border-b border-border last:border-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-success/10 flex items-center justify-center flex-shrink-0">
            <span className="text-success text-sm font-bold">✓</span>
          </div>
          <div>
            <p className="text-sm font-semibold text-textmain">{period.period_label || period.label}</p>
            {period.paid_at && (
              <p className="text-xs text-textsub">Paid on {fmtDate(period.paid_at)}</p>
            )}
          </div>
        </div>
        <span className="text-sm font-bold text-success">
          {fmtMoney(period.amount_paid || period.amount)}
        </span>
      </div>
    );
  }

  if (st === 'due') {
    return (
      <div className="py-3 border-b border-border last:border-0">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-red/10 flex items-center justify-center flex-shrink-0">
              <span className="text-red text-sm font-bold">⚡</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-textmain">{period.period_label || period.label}</p>
              <p className="text-xs text-red font-700">DUE NOW</p>
              {Number(period.carry_forward_amount) > 0 && (
                <p className="text-xs text-warning mt-0.5">
                  Includes {fmtMoney(period.carry_forward_amount)} carry-forward from previous period
                </p>
              )}
            </div>
          </div>
          <span className="text-sm font-bold text-red">
            {fmtMoney(period.amount_due || period.amount)}
          </span>
        </div>
        {contractId && (
          <button
            onClick={() => navigate(`/payment?contractId=${contractId}`)}
            className="w-full bg-red text-white text-xs font-700 py-2 rounded-xl"
          >
            Pay Now →
          </button>
        )}
      </div>
    );
  }

  if (st === 'defaulted') {
    return (
      <div className="flex items-center justify-between py-3 border-b border-border last:border-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-red flex items-center justify-center flex-shrink-0">
            <span className="text-white text-sm font-bold">✗</span>
          </div>
          <div>
            <p className="text-sm font-semibold text-textmain">{period.period_label || period.label}</p>
            <p className="text-xs text-red font-700">MISSED</p>
            {Number(period.carry_forward_amount) > 0 && (
              <p className="text-xs text-textsub">{fmtMoney(period.carry_forward_amount)} carried to next period</p>
            )}
          </div>
        </div>
        <span className="text-sm font-bold text-textmuted">
          {fmtMoney(period.amount_due || period.amount)}
        </span>
      </div>
    );
  }

  // upcoming
  return (
    <div className="flex items-center justify-between py-3 border-b border-border last:border-0">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-surface-2 flex items-center justify-center flex-shrink-0">
          <span className="text-textmuted text-sm">○</span>
        </div>
        <div>
          <p className="text-sm font-semibold text-textsub">{period.period_label || period.label}</p>
          {period.due_date && (
            <p className="text-xs text-textmuted">{fmtDate(period.due_date)}</p>
          )}
        </div>
      </div>
      <span className="text-sm font-bold text-textmuted">
        {fmtMoney(period.amount_due || period.amount)}
      </span>
    </div>
  );
}

function ContractCard({ contract, navigate }) {
  const [expanded,     setExpanded]     = useState(false);
  const [schedule,     setSchedule]     = useState(null);
  const [loadingSched, setLoadingSched] = useState(false);
  const progress = pct(contract.amount_paid, contract.total_amount);

  async function loadSchedule() {
    if (schedule) { setExpanded(v => !v); return; }
    setLoadingSched(true);
    try {
      const r = await contractsAPI.getSchedule(contract.id);
      setSchedule(r.data.data || r.data);
      setExpanded(true);
    } catch {} finally { setLoadingSched(false); }
  }

  const statusClr = (contract.status === 'active' || contract.status === 'completed')
    ? 'text-success bg-success-bg'
    : 'text-red bg-red-light';

  const periods     = schedule ? (Array.isArray(schedule) ? schedule : (schedule.schedule || [])) : [];
  const paidCount   = periods.filter(p => p.status === 'paid').length;
  const totalPeriods = periods.length;

  return (
    <div className="bg-white rounded-2xl border border-border mb-4 overflow-hidden">
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="font-900 text-textmain text-sm">{contract.estate_name || 'Estate'}</p>
            <p className="text-xs text-textsub mt-0.5">{contract.contract_number}</p>
            {contract.plot_label && <p className="text-xs text-textsub">Plot: {contract.plot_label}</p>}
          </div>
          <span className={`text-[10px] font-800 px-2.5 py-1 rounded-full uppercase ${statusClr}`}>
            {contract.status}
          </span>
        </div>

        {/* Progress bar */}
        <div className="h-2 rounded-full bg-surface-2 mb-2 overflow-hidden">
          <div className="h-full bg-red rounded-full transition-all" style={{ width: `${progress}%` }} />
        </div>
        <div className="flex justify-between text-xs text-textsub mb-3">
          <span>{progress}% paid</span>
          <span>{fmtMoney(contract.outstanding_balance)} remaining</span>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          {[
            { label: 'Paid',    val: fmtMoney(contract.amount_paid) },
            { label: 'Balance', val: fmtMoney(contract.outstanding_balance) },
            {
              label: contract.payment_frequency === 'weekly' ? 'Weekly' : 'Monthly',
              val:   fmtMoney(contract.payment_frequency === 'weekly' ? contract.weekly_installment : contract.monthly_installment),
            },
          ].map(s => (
            <div key={s.label} className="bg-surface rounded-xl px-3 py-2 text-center">
              <p className="text-[10px] font-700 text-textmuted mb-0.5">{s.label}</p>
              <p className="text-xs font-800 text-textmain">{s.val}</p>
            </div>
          ))}
        </div>

        {contract.next_due_date && (
          <p className="text-xs text-textsub mb-3">
            Next due: <span className="font-700 text-textmain">{fmtDate(contract.next_due_date)}</span>
          </p>
        )}

        <div className="flex gap-2">
          <button
            onClick={() => navigate(`/payment?contractId=${contract.id}`)}
            className="flex-1 bg-red text-white py-2.5 rounded-xl font-800 text-sm"
          >
            Make Payment →
          </button>
          <button
            onClick={loadSchedule}
            disabled={loadingSched}
            className="flex-1 border border-border py-2.5 rounded-xl font-700 text-textsub text-sm flex items-center justify-center gap-1"
          >
            {loadingSched ? <Spinner size="sm" /> : (expanded ? 'Hide Schedule ▲' : 'View Schedule ▼')}
          </button>
        </div>
      </div>

      {/* Schedule panel */}
      {expanded && schedule && (
        <div className="border-t border-border bg-surface">

          {/* Progress summary */}
          {totalPeriods > 0 && (
            <div className="px-4 py-3 border-b border-border">
              <div className="flex justify-between text-xs mb-1.5">
                <span className="font-700 text-textmain">{paidCount} of {totalPeriods} payments completed</span>
              </div>
              <div className="h-2 bg-surface-2 rounded-full overflow-hidden mb-1.5">
                <div
                  className="h-full bg-red rounded-full transition-all"
                  style={{ width: `${(paidCount / totalPeriods) * 100}%` }}
                />
              </div>
              <p className="text-xs text-textsub">
                {fmtMoney(contract.amount_paid)} paid of {fmtMoney(contract.total_amount)}
              </p>
            </div>
          )}

          {/* Period rows */}
          <div className="px-4 max-h-80 overflow-y-auto">
            {periods.map((period, i) => (
              <ScheduleRow key={i} period={period} contractId={contract.id} navigate={navigate} />
            ))}

            {/* Survey fee row */}
            {Number(contract.survey_fee_amount) > 0 && (
              Number(contract.outstanding_balance) > 0 ? (
                <div className="flex items-center justify-between py-3 border-b border-border">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-surface-2 flex items-center justify-center flex-shrink-0">
                      <span className="text-textmuted text-sm">📋</span>
                    </div>
                    <p className="text-sm text-textsub">Survey Fee — Unlocks after main payment</p>
                  </div>
                  <span className="text-sm font-bold text-textmuted">{fmtMoney(contract.survey_fee_amount)}</span>
                </div>
              ) : (
                <div className="bg-warning/10 border border-warning rounded-xl p-3 mt-2 mb-1">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-700 text-warning">🎉 Survey Fee Due</p>
                    <span className="text-sm font-bold text-warning">{fmtMoney(contract.survey_fee_amount)}</span>
                  </div>
                  <button
                    onClick={() => navigate(`/payment?contractId=${contract.id}`)}
                    className="w-full bg-warning text-white text-xs font-700 py-2 rounded-xl"
                  >
                    Pay Survey Fee →
                  </button>
                </div>
              )
            )}

            {/* Infrastructure fee */}
            <p className="text-xs text-textmuted py-2 border-t border-border mt-1">
              Infrastructure Fee — Payable when construction begins
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Contracts() {
  const navigate = useNavigate();
  const [contracts, setContracts] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [tab,       setTab]       = useState('All');

  useEffect(() => {
    contractsAPI.getAll()
      .then(r => setContracts(r.data.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered  = TAB_MAP[tab] ? contracts.filter(c => c.status === TAB_MAP[tab]) : contracts;
  const totalPaid  = contracts.reduce((s, c) => s + (Number(c.amount_paid) || 0), 0);
  const totalOwing = contracts.reduce((s, c) => s + (Number(c.outstanding_balance) || 0), 0);

  return (
    <Layout>
      <div className="bg-navy">
        <TopHeader title="My Contracts" />
        <div className="px-4 pb-4">
          <div className="flex gap-3 overflow-x-auto scrollbar-none">
            {[
              { label: 'CONTRACTS',   val: contracts.length },
              { label: 'TOTAL PAID',  val: fmtMoney(totalPaid) },
              { label: 'OUTSTANDING', val: fmtMoney(totalOwing) },
            ].map(s => (
              <div key={s.label} className="flex-shrink-0 bg-white/10 rounded-2xl px-4 py-3 border border-white/10">
                <p className="text-white/50 text-[10px] font-700 uppercase tracking-wide mb-1">{s.label}</p>
                <p className="text-white font-900 text-base">{s.val}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex border-b border-border bg-white sticky top-0 z-10">
        {TABS.map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-3 text-xs font-700 border-b-2 transition-all
              ${tab === t ? 'border-red text-red' : 'border-transparent text-textmuted'}`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="px-4 py-4">
        {loading ? (
          <div className="flex justify-center py-12"><Spinner size="lg" /></div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon="📄"
            title="No contracts yet"
            subtitle="Reserve a plot to get started"
            action={{ label: 'Browse Estates', onPress: () => navigate('/estates') }}
          />
        ) : (
          filtered.map(c => <ContractCard key={c.id} contract={c} navigate={navigate} />)
        )}
      </div>
    </Layout>
  );
}
