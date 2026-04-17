import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Layout from '../../components/Layout';
import TopHeader from '../../components/TopHeader';
import Spinner from '../../components/Spinner';
import Badge from '../../components/Badge';
import EmptyState from '../../components/EmptyState';
import { useToast } from '../../components/Toast';
import { contractsAPI, paymentsAPI } from '../../services/api';
import { fmtMoney, fmtDate, fileToBase64 } from '../../utils';

export default function PaymentReceipt() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { showToast } = useToast();
  const initContractId = searchParams.get('contractId') || '';

  const [contracts,   setContracts]   = useState([]);
  const [receipts,    setReceipts]    = useState([]);
  const [bankAccounts,setBankAccounts]= useState([]);
  const [loading,     setLoading]     = useState(true);
  const [submitting,  setSubmitting]  = useState(false);
  const [contractId,  setContractId]  = useState(initContractId);

  const [form, setForm] = useState({
    amount: '', payment_date: '', bank_name: '', teller_number: '', receipt_note: '', receipt_image: '',
  });

  useEffect(() => {
    async function load() {
      const [cR, rR, bR] = await Promise.all([
        contractsAPI.getAll().catch(() => ({ data: { data: [] } })),
        paymentsAPI.getReceipts().catch(() => ({ data: { data: [] } })),
        paymentsAPI.getBankAccounts().catch(() => ({ data: { data: [] } })),
      ]);
      setContracts(cR.data.data || []);
      setReceipts(rR.data.data || rR.data || []);
      setBankAccounts(bR.data.data || []);
      setLoading(false);
    }
    load();
  }, []);

  const set = (k) => (v) => setForm(f => ({ ...f, [k]: v }));

  async function handleSubmit(e) {
    e.preventDefault();
    if (!contractId) return showToast('Please select a contract', 'error');
    if (!form.amount || !form.payment_date || !form.bank_name || !form.teller_number)
      return showToast('Please fill all required fields', 'error');

    setSubmitting(true);
    try {
      await paymentsAPI.submitReceipt({
        contract_id:   contractId,
        amount:        Number(form.amount),
        payment_date:  form.payment_date,
        bank_name:     form.bank_name,
        teller_number: form.teller_number,
        receipt_note:  form.receipt_note,
        receipt_image: form.receipt_image,
      });
      showToast('Receipt submitted successfully!', 'success');
      setForm({ amount: '', payment_date: '', bank_name: '', teller_number: '', receipt_note: '', receipt_image: '' });
      // Reload receipts
      const rR = await paymentsAPI.getReceipts().catch(() => ({ data: { data: [] } }));
      setReceipts(rR.data.data || rR.data || []);
    } catch (e) {
      showToast(e?.response?.data?.message || 'Failed to submit receipt', 'error');
    } finally { setSubmitting(false); }
  }

  return (
    <Layout>
      <TopHeader title="Submit Receipt" showBack />

      {loading ? (
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      ) : (
        <div className="px-4 py-4">
          {/* Bank details reminder */}
          {bankAccounts[0] && (
            <div className="bg-navy rounded-2xl p-4 mb-4">
              <p className="text-white/60 text-xs font-700 mb-2">TRANSFER TO</p>
              <p className="text-white font-900">{bankAccounts[0].bank_name}</p>
              <p className="text-white/80 text-sm">{bankAccounts[0].account_name}</p>
              <p className="text-white font-900 text-xl tracking-widest mt-1">{bankAccounts[0].account_number}</p>
            </div>
          )}

          {/* Form */}
          <div className="bg-white rounded-2xl border border-border p-4 mb-5">
            <p className="font-800 text-textmain text-sm mb-4">Receipt Details</p>
            <form onSubmit={handleSubmit}>
              {/* Contract selector */}
              <div className="mb-3">
                <label className="text-xs font-700 text-textsub uppercase tracking-wide block mb-1.5">Contract *</label>
                <select
                  value={contractId}
                  onChange={e => setContractId(e.target.value)}
                  className="w-full h-11 px-4 rounded-xl border border-border bg-surface-2 text-sm"
                  required
                >
                  <option value="">Select contract...</option>
                  {contracts.map(c => (
                    <option key={c.id} value={c.id}>{c.contract_number} — {c.estate_name}</option>
                  ))}
                </select>
              </div>
              <div className="mb-3">
                <label className="text-xs font-700 text-textsub uppercase tracking-wide block mb-1.5">Amount *</label>
                <input type="number" value={form.amount} onChange={e => set('amount')(e.target.value)} className="w-full h-11 px-4 rounded-xl border border-border bg-surface-2 text-sm" placeholder="Amount transferred" required />
              </div>
              <div className="mb-3">
                <label className="text-xs font-700 text-textsub uppercase tracking-wide block mb-1.5">Payment Date *</label>
                <input type="date" value={form.payment_date} onChange={e => set('payment_date')(e.target.value)} className="w-full h-11 px-4 rounded-xl border border-border bg-surface-2 text-sm" required />
              </div>
              <div className="mb-3">
                <label className="text-xs font-700 text-textsub uppercase tracking-wide block mb-1.5">Your Bank Name *</label>
                <input value={form.bank_name} onChange={e => set('bank_name')(e.target.value)} className="w-full h-11 px-4 rounded-xl border border-border bg-surface-2 text-sm" placeholder="e.g. GTBank" required />
              </div>
              <div className="mb-3">
                <label className="text-xs font-700 text-textsub uppercase tracking-wide block mb-1.5">Teller / Reference *</label>
                <input value={form.teller_number} onChange={e => set('teller_number')(e.target.value)} className="w-full h-11 px-4 rounded-xl border border-border bg-surface-2 text-sm" placeholder="Transaction reference" required />
              </div>
              <div className="mb-3">
                <label className="text-xs font-700 text-textsub uppercase tracking-wide block mb-1.5">Note</label>
                <input value={form.receipt_note} onChange={e => set('receipt_note')(e.target.value)} className="w-full h-11 px-4 rounded-xl border border-border bg-surface-2 text-sm" placeholder="Optional note" />
              </div>
              <div className="mb-4">
                <label className="text-xs font-700 text-textsub uppercase tracking-wide block mb-1.5">Receipt Image</label>
                <div className="border-2 border-dashed border-border rounded-xl p-3 text-center">
                  {form.receipt_image ? (
                    <div>
                      <img src={form.receipt_image} alt="Receipt" className="max-h-24 mx-auto rounded-lg mb-1" />
                      <button type="button" onClick={() => set('receipt_image')('')} className="text-red text-xs font-700">Remove</button>
                    </div>
                  ) : (
                    <label className="cursor-pointer">
                      <p className="text-xs text-textmuted">📷 Upload receipt photo (optional)</p>
                      <input type="file" accept="image/*" className="hidden" onChange={async e => { if (!e.target.files[0]) return; const b = await fileToBase64(e.target.files[0]); set('receipt_image')(b); }} />
                    </label>
                  )}
                </div>
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-red text-white py-4 rounded-2xl font-800 flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {submitting ? <Spinner size="sm" color="white" /> : 'Submit Receipt →'}
              </button>
            </form>
          </div>

          {/* Previous receipts */}
          {receipts.length > 0 && (
            <div>
              <p className="font-800 text-textmain text-base mb-3">Previous Receipts</p>
              <div className="space-y-3">
                {receipts.map(r => (
                  <div key={r.id} className="bg-white rounded-2xl border border-border p-4">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-800 text-textmain text-sm">{fmtMoney(r.amount)}</p>
                      <Badge label={r.status} variant={r.status} />
                    </div>
                    <p className="text-xs text-textsub">{fmtDate(r.payment_date)} · {r.bank_name}</p>
                    <p className="text-xs text-textsub">Ref: {r.teller_number}</p>
                    {r.status === 'rejected' && r.admin_notes && (
                      <p className="text-xs text-red font-700 mt-2 bg-red-light rounded-lg px-3 py-2">
                        Rejected: {r.admin_notes}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="h-6" />
        </div>
      )}
    </Layout>
  );
}
