import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import TopHeader from '../../components/TopHeader';
import EmptyState from '../../components/EmptyState';
import Spinner from '../../components/Spinner';
import { contractsAPI } from '../../services/api';
import { fmtMoney, fmtDate, pct } from '../../utils';

const TABS      = ['All','Active','Completed','Forfeited'];
const TAB_MAP   = { All: null, Active: 'active', Completed: 'completed', Forfeited: 'forfeited' };
const STATUS_CLR= { paid: 'text-success', due: 'text-red', defaulted: 'text-red', upcoming: 'text-textmuted', survey: 'text-warning' };
const STATUS_ICO= { paid: '✓', due: '⚡', defaulted: '✗', upcoming: '○', survey: '📋' };

function ScheduleRow({ row }) {
  const st  = row.status?.toLowerCase() || 'upcoming';
  const clr = STATUS_CLR[st] || 'text-textmuted';
  const ico = STATUS_ICO[st] || '○';
  return (
    <div className={`flex items-center gap-3 py-2.5 border-b border-border last:border-0`}>
      <span className={`text-base font-800 w-5 text-center ${clr}`}>{ico}</span>
      <div className="flex-1">
        <p className="text-xs font-700 text-textmain">{row.label}</p>
        {row.paid_at && <p className="text-[10px] text-textmuted">Paid {fmtDate(row.paid_at)}</p>}
      </div>
      <div className="text-right">
        <p className={`text-xs font-800 ${clr}`}>{fmtMoney(row.amount)}</p>
        {(st === 'due' || st === 'defaulted') && (
          <p className="text-[10px] text-red font-700">{st === 'due' ? 'DUE' : 'DEFAULTED'}</p>
        )}
      </div>
    </div>
  );
}

function ContractCard({ contract, navigate }) {
  const [expanded, setExpanded] = useState(false);
  const [schedule, setSchedule] = useState(null);
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

  const statusClr = contract.status === 'active' ? 'text-success bg-success-bg' : contract.status === 'completed' ? 'text-success bg-success-bg' : 'text-red bg-red-light';

  return (
    <div className="bg-white rounded-2xl border border-border mb-4 overflow-hidden">
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="font-900 text-textmain text-sm">{contract.estate_name || 'Estate'}</p>
            <p className="text-xs text-textsub mt-0.5">{contract.contract_number}</p>
            {contract.plot_label && <p className="text-xs text-textsub">Plot: {contract.plot_label}</p>}
          </div>
          <span className={`text-[10px] font-800 px-2.5 py-1 rounded-full uppercase ${statusClr}`}>{contract.status}</span>
        </div>

        {/* Progress */}
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
            { label: 'Paid',        val: fmtMoney(contract.amount_paid) },
            { label: 'Balance',     val: fmtMoney(contract.outstanding_balance) },
            { label: contract.payment_frequency === 'weekly' ? 'Weekly' : 'Monthly', val: fmtMoney(contract.payment_frequency === 'weekly' ? contract.weekly_installment : contract.monthly_installment) },
          ].map(s => (
            <div key={s.label} className="bg-surface rounded-xl px-3 py-2 text-center">
              <p className="text-[10px] font-700 text-textmuted mb-0.5">{s.label}</p>
              <p className="text-xs font-800 text-textmain">{s.val}</p>
            </div>
          ))}
        </div>

        {contract.next_due_date && (
          <p className="text-xs text-textsub mb-3">Next due: <span className="font-700 text-textmain">{fmtDate(contract.next_due_date)}</span></p>
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
            {loadingSched ? <Spinner size="sm" /> : (expanded ? '▲ Hide' : '▼ Schedule')}
          </button>
        </div>
      </div>

      {/* Schedule panel */}
      {expanded && schedule && (
        <div className="border-t border-border px-4 py-3 bg-surface max-h-72 overflow-y-auto">
          {(schedule.schedule || schedule || []).map((row, i) => (
            <ScheduleRow key={i} row={row} />
          ))}
          {schedule.survey_fee > 0 && (
            <div className="flex items-center justify-between py-2.5 mt-1 bg-warning-bg rounded-xl px-3">
              <p className="text-xs font-700 text-warning">Survey Fee</p>
              <p className="text-xs font-800 text-warning">{fmtMoney(schedule.survey_fee)}</p>
            </div>
          )}
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
    contractsAPI.getAll().then(r => setContracts(r.data.data || [])).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const filtered = TAB_MAP[tab]
    ? contracts.filter(c => c.status === TAB_MAP[tab])
    : contracts;

  const totalPaid  = contracts.reduce((s, c) => s + (Number(c.amount_paid) || 0), 0);
  const totalOwing = contracts.reduce((s, c) => s + (Number(c.outstanding_balance) || 0), 0);

  return (
    <Layout>
      <div className="bg-navy">
        <TopHeader title="My Contracts" />
        {/* Summary */}
        <div className="px-4 pb-4">
          <div className="flex gap-3 overflow-x-auto scrollbar-none">
            {[
              { label: 'CONTRACTS', val: contracts.length },
              { label: 'TOTAL PAID', val: fmtMoney(totalPaid) },
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

      {/* Tabs */}
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
