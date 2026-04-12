import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import TopHeader from '../../components/TopHeader';
import Spinner from '../../components/Spinner';
import Badge from '../../components/Badge';
import EmptyState from '../../components/EmptyState';
import { useToast } from '../../components/Toast';
import { loansAPI, contractsAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { fmtMoney, fmtDate } from '../../utils';

const PURPOSES = ['Business Capital', 'Medical Emergency', 'Education', 'Home Renovation', 'Other'];

export default function LoanRequest() {
  const { user }      = useAuth();
  const { showToast } = useToast();
  const [loans,      setLoans]     = useState([]);
  const [contracts,  setContracts] = useState([]);
  const [loading,    setLoading]   = useState(true);
  const [submitting, setSubmitting]= useState(false);
  const [form, setForm]            = useState({ contract_id: '', loan_amount: '', purpose: '', repayment_months: '12' });

  useEffect(() => {
    Promise.all([
      loansAPI.getAll().catch(() => ({ data: { data: [] } })),
      contractsAPI.getAll().catch(() => ({ data: { data: [] } })),
    ]).then(([lR, cR]) => {
      setLoans(lR.data.data || []);
      setContracts((cR.data.data || []).filter(c => c.status === 'active'));
    }).finally(() => setLoading(false));
  }, []);

  const isKycVerified = user?.kyc_status === 'verified';

  // Eligibility: has active contract
  const eligible = isKycVerified && contracts.length > 0;

  const selectedContract = contracts.find(c => c.id === form.contract_id);
  const maxLoan = selectedContract ? Math.floor(Number(selectedContract.total_amount) * 0.3) : 0;

  const set = (k) => (v) => setForm(f => ({ ...f, [k]: v }));

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.contract_id) return showToast('Please select a contract', 'error');
    if (!form.loan_amount || Number(form.loan_amount) <= 0) return showToast('Please enter loan amount', 'error');
    if (Number(form.loan_amount) > maxLoan) return showToast(`Maximum loan is ${fmtMoney(maxLoan)}`, 'error');
    if (!form.purpose) return showToast('Please select a purpose', 'error');

    setSubmitting(true);
    try {
      await loansAPI.request({
        contract_id:      form.contract_id,
        loan_amount:      Number(form.loan_amount),
        purpose:          form.purpose,
        repayment_months: Number(form.repayment_months),
        property_value:   Number(selectedContract?.total_amount || 0),
      });
      showToast('Loan request submitted! We\'ll review within 48 hours.', 'success');
      setForm({ contract_id: '', loan_amount: '', purpose: '', repayment_months: '12' });
      const r = await loansAPI.getAll().catch(() => ({ data: { data: [] } }));
      setLoans(r.data.data || []);
    } catch (e) {
      showToast(e?.response?.data?.message || 'Request failed', 'error');
    } finally { setSubmitting(false); }
  }

  if (loading) return <Layout><div className="flex justify-center py-20"><Spinner size="lg" /></div></Layout>;

  return (
    <Layout>
      <TopHeader title="Property Loan" showBack />
      <div className="px-4 py-4">
        {/* Info card */}
        <div className="bg-navy rounded-2xl p-4 mb-4">
          <p className="text-white font-900 text-base mb-1">Property-Backed Loan</p>
          <p className="text-white/70 text-sm">Get up to <span className="text-white font-800">30%</span> of your plot value as a loan. Quick approval, simple process.</p>
          <div className="grid grid-cols-3 gap-2 mt-4">
            {[
              { label: 'Max', val: '30% of value' },
              { label: 'Interest', val: '15%' },
              { label: 'Tenure', val: 'Up to 6 months' },
            ].map(s => (
              <div key={s.label} className="bg-white/10 rounded-xl px-2 py-2.5 border border-white/10 text-center">
                <p className="text-white font-800 text-xs">{s.val}</p>
                <p className="text-white/50 text-[10px] mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Eligibility check */}
        {!isKycVerified && (
          <div className="bg-warning-bg border border-warning/30 rounded-2xl p-4 mb-4">
            <p className="text-warning font-800 text-sm">⚠️ KYC Required</p>
            <p className="text-warning/80 text-xs mt-1">Complete your KYC verification to be eligible for a loan.</p>
          </div>
        )}
        {isKycVerified && contracts.length === 0 && (
          <div className="bg-warning-bg border border-warning/30 rounded-2xl p-4 mb-4">
            <p className="text-warning font-800 text-sm">⚠️ Active Contract Required</p>
            <p className="text-warning/80 text-xs mt-1">You need at least one active contract to apply for a loan.</p>
          </div>
        )}

        {/* Loan form */}
        {eligible && (
          <div className="bg-white rounded-2xl border border-border p-4 mb-5">
            <p className="font-800 text-textmain text-sm mb-4">Apply for a Loan</p>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="text-xs font-700 text-textsub block mb-1.5">Select Contract *</label>
                <select value={form.contract_id} onChange={e => set('contract_id')(e.target.value)} className="w-full h-11 px-4 rounded-xl border border-border bg-surface-2 text-sm" required>
                  <option value="">Choose contract...</option>
                  {contracts.map(c => <option key={c.id} value={c.id}>{c.contract_number} — {c.estate_name} (Value: {fmtMoney(c.total_amount)})</option>)}
                </select>
                {selectedContract && <p className="text-xs text-success font-700 mt-1">Max loan: {fmtMoney(maxLoan)}</p>}
              </div>
              <div>
                <label className="text-xs font-700 text-textsub block mb-1.5">Loan Amount *</label>
                <input
                  type="number"
                  value={form.loan_amount}
                  onChange={e => set('loan_amount')(e.target.value)}
                  className="w-full h-11 px-4 rounded-xl border border-border bg-surface-2 text-sm"
                  placeholder={`Max: ${fmtMoney(maxLoan)}`}
                  max={maxLoan}
                  required
                />
              </div>
              <div>
                <label className="text-xs font-700 text-textsub block mb-1.5">Purpose *</label>
                <select value={form.purpose} onChange={e => set('purpose')(e.target.value)} className="w-full h-11 px-4 rounded-xl border border-border bg-surface-2 text-sm" required>
                  <option value="">Select purpose...</option>
                  {PURPOSES.map(p => <option key={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-700 text-textsub block mb-1.5">Repayment Period</label>
                <select value={form.repayment_months} onChange={e => set('repayment_months')(e.target.value)} className="w-full h-11 px-4 rounded-xl border border-border bg-surface-2 text-sm">
                  {[3,6].map(m => <option key={m} value={m}>{m} months</option>)}
                </select>
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-red text-white py-4 rounded-2xl font-800 flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {submitting ? <Spinner size="sm" color="white" /> : 'Submit Loan Request →'}
              </button>
            </form>
          </div>
        )}

        {/* Previous loans */}
        {loans.length > 0 && (
          <div>
            <p className="font-800 text-textmain text-base mb-3">My Loan Requests</p>
            <div className="space-y-3">
              {loans.map(l => (
                <div key={l.id} className="bg-white rounded-2xl border border-border p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-800 text-textmain text-sm">{fmtMoney(l.loan_amount)}</p>
                    <Badge label={l.status} variant={l.status} />
                  </div>
                  <p className="text-xs text-textsub">{l.loan_number}</p>
                  <p className="text-xs text-textsub">{fmtDate(l.created_at)} · {l.repayment_months} months</p>
                  <p className="text-xs text-textsub">{l.purpose}</p>
                  {l.admin_notes && <p className="text-xs text-textsub mt-2 bg-surface rounded-lg px-3 py-2">{l.admin_notes}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {loans.length === 0 && !eligible && (
          <EmptyState icon="💰" title="No loan requests" subtitle="Complete your KYC and have an active contract to apply." />
        )}

        <div className="h-4" />
      </div>
    </Layout>
  );
}
