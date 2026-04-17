import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Layout from '../../components/Layout';
import TopHeader from '../../components/TopHeader';
import Spinner from '../../components/Spinner';
import { useToast } from '../../components/Toast';
import { contractsAPI, paymentsAPI } from '../../services/api';
import { fmtMoney, pct, copyToClipboard, fileToBase64 } from '../../utils';
import { useAuth } from '../../context/AuthContext';

export default function Payment() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const contractId = searchParams.get('contractId');
  const { showToast } = useToast();

  const [contract,     setContract]     = useState(null);
  const [allContracts, setAllContracts] = useState([]);
  const [bankAccounts, setBankAccounts] = useState([]);
  const [schedule,     setSchedule]     = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [amount,       setAmount]       = useState('');
  const [copied,       setCopied]       = useState('');
  const [showReceipt,  setShowReceipt]  = useState(false);

  const [receiptForm, setReceiptForm] = useState({
    amount: '', payment_date: '', bank_name: '', teller_number: '', receipt_note: '', receipt_image: '',
  });
  const [submitting,      setSubmitting]      = useState(false);
  const [paystackLoading, setPaystackLoading] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    async function load() {
      const bR = await paymentsAPI.getBankAccounts().catch(() => ({ data: { data: [] } }));
      setBankAccounts(bR.data.data || []);

      if (contractId) {
        const [cR, scR] = await Promise.all([
          contractsAPI.getOne(contractId).catch(() => null),
          contractsAPI.getSchedule(contractId).catch(() => null),
        ]);
        if (cR?.data?.data) {
          setContract(cR.data.data);
          const inst = cR.data.data.payment_frequency === 'weekly'
            ? cR.data.data.weekly_installment
            : cR.data.data.monthly_installment;
          setAmount(String(inst || ''));
          setReceiptForm(f => ({ ...f, amount: String(inst || '') }));
        }
        if (scR?.data) {
          const sd = scR.data.data || scR.data;
          setSchedule(Array.isArray(sd) ? sd : (sd.schedule || []));
        }
      } else {
        // No contractId in URL — fetch all active contracts for the selector
        const cListR = await contractsAPI.getAll().catch(() => ({ data: { data: [] } }));
        const active = (cListR.data.data || []).filter(c => c.status === 'active');
        setAllContracts(active);
        // Auto-select if only one active contract
        if (active.length === 1) {
          navigate(`/payment?contractId=${active[0].id}`, { replace: true });
          return;
        }
      }
      setLoading(false);
    }
    load();
  }, [contractId]);

  // Helper: set both amount and receipt form amount together
  const setAmt = (val) => {
    setAmount(String(val));
    setReceiptForm(f => ({ ...f, amount: String(val) }));
  };

  async function handleCopy(text, key) {
    await copyToClipboard(text);
    setCopied(key);
    setTimeout(() => setCopied(''), 2500);
    showToast('Copied to clipboard!', 'success');
  }

  async function handleReceiptImage(file) {
    if (!file) return;
    const b64 = await fileToBase64(file);
    setReceiptForm(f => ({ ...f, receipt_image: b64 }));
  }

  async function handlePaystack() {
    if (!contractId) return showToast('Please select a contract', 'error');
    if (!amount || Number(amount) <= 0) return showToast('Enter a valid amount', 'error');
    setPaystackLoading(true);
    try {
      const callbackUrl = `${window.location.origin}/payment/callback`;
      const res = await paymentsAPI.initializePaystack({
        contract_id:  contractId,
        amount:       Number(amount),
        callback_url: callbackUrl,
      });
      const url = res.data?.data?.authorization_url || res.data?.authorization_url;
      if (!url) throw new Error('No authorization URL returned');
      window.location.href = url;
    } catch (e) {
      showToast(e?.response?.data?.message || 'Could not initialize payment', 'error');
      setPaystackLoading(false);
    }
  }

  async function handleSubmitReceipt(e) {
    e.preventDefault();
    const { amount: amt, payment_date, bank_name, teller_number } = receiptForm;
    if (!amt || !payment_date || !bank_name || !teller_number)
      return showToast('Please fill in all required fields', 'error');
    if (!contractId) return showToast('Please select a contract', 'error');

    setSubmitting(true);
    try {
      await paymentsAPI.submitReceipt({
        contract_id:   contractId,
        amount:        Number(amt),
        payment_date,
        bank_name,
        teller_number,
        receipt_note:  receiptForm.receipt_note,
        receipt_image: receiptForm.receipt_image,
      });
      showToast('Receipt submitted! Admin will verify within 24 hours.', 'success');
      navigate('/contracts');
    } catch (e) {
      showToast(e?.response?.data?.message || 'Submission failed', 'error');
    } finally { setSubmitting(false); }
  }

  const progress      = contract ? pct(contract.amount_paid, contract.total_amount) : 0;
  const currentPeriod = schedule?.find(p => p.status === 'due' || p.status === 'defaulted') || null;

  return (
    <Layout>
      <TopHeader title="Make Payment" showBack />

      {loading ? (
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      ) : !contractId && allContracts.length === 0 ? (
        <div className="px-4 py-12 text-center">
          <p className="text-4xl mb-4">📄</p>
          <p className="font-800 text-textmain text-base mb-2">No Active Contracts</p>
          <p className="text-sm text-textsub mb-6">You don't have any active contracts to make a payment for.</p>
          <button onClick={() => navigate('/estates')} className="bg-navy text-white font-800 px-6 py-3 rounded-2xl text-sm">Browse Estates</button>
        </div>
      ) : !contractId && allContracts.length > 1 ? (
        <div className="px-4 py-4">
          <p className="font-800 text-textmain text-base mb-1">Select a Contract</p>
          <p className="text-sm text-textsub mb-4">Choose which contract you want to make a payment for.</p>
          <div className="space-y-3">
            {allContracts.map(c => {
              const inst = c.payment_frequency === 'weekly' ? c.weekly_installment : c.monthly_installment;
              return (
                <button
                  key={c.id}
                  onClick={() => navigate(`/payment?contractId=${c.id}`)}
                  className="w-full bg-white border border-border rounded-2xl p-4 text-left hover:border-navy transition-colors"
                >
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-800 text-textmain text-sm">{c.estate_name || 'Estate'}</p>
                    <span className="bg-success-bg text-success text-[10px] font-700 px-2 py-0.5 rounded-full uppercase">{c.status}</span>
                  </div>
                  <p className="text-xs text-textsub">{c.contract_number} · Plot {c.plot_label || '—'}</p>
                  <div className="flex items-center justify-between mt-3">
                    <p className="text-xs text-textsub">Balance: <span className="font-700 text-textmain">{fmtMoney(c.outstanding_balance)}</span></p>
                    <p className="text-xs text-red font-700">{fmtMoney(inst)}/{c.payment_frequency === 'weekly' ? 'wk' : 'mo'} →</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="px-4 py-4 overflow-y-auto">

          {/* Contract summary */}
          {contract && (
            <div className="bg-navy rounded-2xl p-4 mb-4">
              <p className="text-white/60 text-xs font-700 uppercase mb-1">Contract</p>
              <p className="text-white font-900 text-base">{contract.estate_name || 'Estate'}</p>
              <p className="text-white/60 text-xs">{contract.contract_number} · Plot {contract.plot_label || '—'}</p>
              <div className="h-1.5 rounded-full bg-white/20 mt-3 mb-1.5 overflow-hidden">
                <div className="h-full bg-red rounded-full" style={{ width: `${progress}%` }} />
              </div>
              <div className="flex justify-between text-xs text-white/60">
                <span>{progress}% paid</span>
                <span>{fmtMoney(contract.outstanding_balance)} remaining</span>
              </div>
            </div>
          )}

          {/* Bank transfer details */}
          <div className="mb-4">
            <p className="text-sm font-800 text-textmain mb-3">Bank Transfer Details</p>
            {bankAccounts.length === 0 ? (
              <div className="bg-warning-bg border border-warning/30 rounded-2xl p-4 text-sm text-warning font-700 text-center">
                Contact support for bank details.
              </div>
            ) : (
              bankAccounts.map(acc => (
                <div key={acc.id} className="bg-white rounded-2xl border border-border p-4 mb-3">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="text-xs text-textsub font-700 uppercase">{acc.bank_name}</p>
                      <p className="font-800 text-textmain text-sm">{acc.account_name}</p>
                    </div>
                    {acc.is_primary && (
                      <span className="bg-success-bg text-success text-[10px] font-800 px-2 py-0.5 rounded-full">PRIMARY</span>
                    )}
                  </div>
                  <div className="flex items-center justify-between bg-surface rounded-xl px-4 py-3">
                    <span className="font-900 text-navy text-xl tracking-widest">{acc.account_number}</span>
                    <button
                      onClick={() => handleCopy(acc.account_number, acc.id)}
                      className={`text-xs font-800 px-3 py-1.5 rounded-xl transition-all
                        ${copied === acc.id ? 'bg-success-bg text-success' : 'bg-surface-2 text-textsub'}`}
                    >
                      {copied === acc.id ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Amount to Pay */}
          {contract && (
            <div className="bg-white rounded-2xl border border-border p-4 mb-4">
              <p className="text-sm font-bold text-navy uppercase tracking-wide mb-3">Amount to Pay</p>

              {currentPeriod && (
                <div className="bg-surface rounded-xl p-3 mb-3">
                  <p className="text-sm font-semibold text-textmain">
                    {currentPeriod.period_label || currentPeriod.label}
                  </p>
                  <p className="text-lg font-bold text-red">
                    {fmtMoney(currentPeriod.amount_due || currentPeriod.amount)} due
                  </p>
                  {Number(currentPeriod.carry_forward_amount) > 0 && (
                    <p className="text-xs text-warning mt-1">
                      Includes {fmtMoney(currentPeriod.carry_forward_amount)} carried forward
                    </p>
                  )}
                </div>
              )}

              <label className="text-xs text-textsub uppercase tracking-wide font-semibold">
                Enter Amount
              </label>
              <input
                type="number"
                value={amount}
                onChange={e => setAmt(e.target.value)}
                className="w-full border border-border rounded-xl px-4 py-3 text-lg font-bold text-navy mt-1 mb-3"
                placeholder="0"
              />
              <p className="text-xs text-textsub mb-3">
                You can pay more than the minimum to get ahead on your schedule.
              </p>

              {Number(contract.outstanding_balance) > 0 && (
                <button
                  onClick={() => setAmt(contract.outstanding_balance)}
                  className="w-full border-2 border-navy text-navy font-bold py-3 rounded-xl text-sm"
                >
                  Pay Full Balance — {fmtMoney(contract.outstanding_balance)}
                </button>
              )}
            </div>
          )}

          {/* Survey fee section */}
          {contract &&
           Number(contract.outstanding_balance) <= 0 &&
           Number(contract.survey_fee_amount) > 0 &&
           !contract.survey_fee_paid && (
            <div className="bg-warning/10 border border-warning rounded-2xl p-4 mb-4">
              <p className="text-sm font-bold text-warning mb-1">🎉 Main Payment Complete!</p>
              <p className="text-sm text-textmain mb-3">
                Your survey fee of {fmtMoney(contract.survey_fee_amount)} is now due.
              </p>
              <button
                onClick={() => setAmt(contract.survey_fee_amount)}
                className="w-full bg-warning text-white font-bold py-3 rounded-xl text-sm"
              >
                Pay Survey Fee — {fmtMoney(contract.survey_fee_amount)}
              </button>
            </div>
          )}

          {/* Infrastructure fee note */}
          {contract && Number(contract.infrastructure_fee_amount) > 0 && (
            <div className="bg-surface rounded-2xl p-4 mb-4">
              <p className="text-sm text-textmuted">Infrastructure Fee: To be announced</p>
              <p className="text-xs text-textmuted mt-1">Payable when construction begins — not due yet</p>
            </div>
          )}

          {/* Submit receipt CTA */}
          <button
            onClick={() => setShowReceipt(v => !v)}
            className="w-full flex items-center justify-between bg-success-bg border border-success/30 text-success font-800 py-4 px-5 rounded-2xl mb-4 text-sm"
          >
            <span>I've Transferred — Submit Receipt</span>
            <span>{showReceipt ? '▲' : '▼'}</span>
          </button>

          {/* Receipt form */}
          {showReceipt && (
            <form onSubmit={handleSubmitReceipt} className="bg-white rounded-2xl border border-border p-4 mb-4">
              <p className="font-800 text-textmain text-sm mb-4">Payment Receipt</p>
              <div className="mb-3">
                <label className="text-xs font-700 text-textsub uppercase tracking-wide block mb-1.5">Amount *</label>
                <input
                  type="number"
                  value={receiptForm.amount}
                  onChange={e => setReceiptForm(f => ({ ...f, amount: e.target.value }))}
                  className="w-full h-11 px-4 rounded-xl border border-border bg-surface-2 text-sm"
                  placeholder="Amount transferred"
                  required
                />
              </div>
              <div className="mb-3">
                <label className="text-xs font-700 text-textsub uppercase tracking-wide block mb-1.5">Payment Date *</label>
                <input
                  type="date"
                  value={receiptForm.payment_date}
                  onChange={e => setReceiptForm(f => ({ ...f, payment_date: e.target.value }))}
                  className="w-full h-11 px-4 rounded-xl border border-border bg-surface-2 text-sm"
                  required
                />
              </div>
              <div className="mb-3">
                <label className="text-xs font-700 text-textsub uppercase tracking-wide block mb-1.5">Your Bank *</label>
                <input
                  value={receiptForm.bank_name}
                  onChange={e => setReceiptForm(f => ({ ...f, bank_name: e.target.value }))}
                  className="w-full h-11 px-4 rounded-xl border border-border bg-surface-2 text-sm"
                  placeholder="e.g. Zenith Bank"
                  required
                />
              </div>
              <div className="mb-3">
                <label className="text-xs font-700 text-textsub uppercase tracking-wide block mb-1.5">Teller / Reference Number *</label>
                <input
                  value={receiptForm.teller_number}
                  onChange={e => setReceiptForm(f => ({ ...f, teller_number: e.target.value }))}
                  className="w-full h-11 px-4 rounded-xl border border-border bg-surface-2 text-sm"
                  placeholder="Transaction reference"
                  required
                />
              </div>
              <div className="mb-3">
                <label className="text-xs font-700 text-textsub uppercase tracking-wide block mb-1.5">Note (Optional)</label>
                <input
                  value={receiptForm.receipt_note}
                  onChange={e => setReceiptForm(f => ({ ...f, receipt_note: e.target.value }))}
                  className="w-full h-11 px-4 rounded-xl border border-border bg-surface-2 text-sm"
                  placeholder="Additional note"
                />
              </div>
              <div className="mb-4">
                <label className="text-xs font-700 text-textsub uppercase tracking-wide block mb-1.5">Receipt Image (Optional)</label>
                <div className="border-2 border-dashed border-border rounded-2xl p-4 text-center">
                  {receiptForm.receipt_image ? (
                    <div>
                      <img src={receiptForm.receipt_image} alt="Receipt" className="max-h-24 mx-auto rounded-xl mb-2" />
                      <button type="button" onClick={() => setReceiptForm(f => ({ ...f, receipt_image: '' }))} className="text-red text-xs font-700">Remove</button>
                    </div>
                  ) : (
                    <label className="cursor-pointer">
                      <p className="text-sm text-textmuted mb-2">📷 Tap to upload receipt photo</p>
                      <input type="file" accept="image/*" className="hidden" onChange={e => handleReceiptImage(e.target.files[0])} />
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
          )}

          {/* Card payment — Paystack */}
          <button
            onClick={handlePaystack}
            disabled={paystackLoading || !amount || Number(amount) <= 0}
            className="w-full bg-navy text-white rounded-2xl p-4 flex items-center justify-center gap-3 disabled:opacity-50"
          >
            {paystackLoading ? (
              <Spinner size="sm" color="white" />
            ) : (
              <>
                <span className="text-2xl">💳</span>
                <div className="text-left">
                  <p className="text-sm font-800">Pay with Card</p>
                  <p className="text-xs text-white/70">Secure payment via Paystack</p>
                </div>
              </>
            )}
          </button>

          <div className="h-6" />
        </div>
      )}
    </Layout>
  );
}

