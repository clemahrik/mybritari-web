import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import TopHeader from '../../components/TopHeader';
import Spinner from '../../components/Spinner';
import Badge from '../../components/Badge';
import EmptyState from '../../components/EmptyState';
import { useToast } from '../../components/Toast';
import { supportAPI, contractsAPI, settingsAPI } from '../../services/api';
import { fmtDate } from '../../utils';

const CATEGORIES = ['Payment Issue', 'Contract Query', 'KYC Issue', 'Technical', 'Complaint', 'Other'];

export default function Support() {
  const { showToast } = useToast();
  const [tickets,    setTickets]   = useState([]);
  const [contracts,  setContracts] = useState([]);
  const [settings,   setSettings]  = useState({});
  const [loading,    setLoading]   = useState(true);
  const [submitting, setSubmitting]= useState(false);
  const [expanded,   setExpanded]  = useState(null);
  const [form, setForm] = useState({ subject: '', category: '', contract_id: '', message: '' });

  useEffect(() => {
    Promise.all([
      supportAPI.getTickets().catch(() => ({ data: { data: [] } })),
      contractsAPI.getAll().catch(() => ({ data: { data: [] } })),
      settingsAPI.getAll().catch(() => ({ data: { data: {} } })),
    ]).then(([tR, cR, sR]) => {
      setTickets(tR.data.data || []);
      setContracts(cR.data.data || []);
      setSettings(sR.data.data || {});
    }).finally(() => setLoading(false));
  }, []);

  const set = (k) => (v) => setForm(f => ({ ...f, [k]: v }));

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.subject || !form.category || form.message.length < 20)
      return showToast('Please fill all fields. Message must be at least 20 characters.', 'error');
    setSubmitting(true);
    try {
      await supportAPI.createTicket({
        subject:     form.subject,
        category:    form.category,
        contract_id: form.contract_id || undefined,
        message:     form.message,
      });
      showToast('Ticket submitted! We\'ll get back to you shortly.', 'success');
      setForm({ subject: '', category: '', contract_id: '', message: '' });
      const r = await supportAPI.getTickets().catch(() => ({ data: { data: [] } }));
      setTickets(r.data.data || []);
    } catch (e) {
      showToast(e?.response?.data?.message || 'Submission failed', 'error');
    } finally { setSubmitting(false); }
  }

  const phone   = settings.support_phone || '';
  const email   = settings.support_email || '';
  const whatsapp = settings.whatsapp_number || phone;

  return (
    <Layout>
      <TopHeader title="Support" showBack />

      {loading ? (
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      ) : (
        <div className="px-4 py-4">
          {/* Contact cards */}
          <div className="grid grid-cols-3 gap-2 mb-5">
            {[
              { icon: '📞', label: 'Call', action: phone ? () => window.open(`tel:${phone}`) : null },
              { icon: '📧', label: 'Email', action: email ? () => window.open(`mailto:${email}`) : null },
              { icon: '💬', label: 'WhatsApp', action: whatsapp ? () => window.open(`https://wa.me/${whatsapp.replace(/[^0-9]/g,'')}`) : null },
            ].map(c => (
              <button
                key={c.label}
                onClick={c.action}
                disabled={!c.action}
                className={`flex flex-col items-center gap-2 py-4 rounded-2xl border border-border font-700 text-xs
                  ${c.action ? 'bg-white active:bg-surface-2 text-textmain' : 'bg-surface-2 text-textmuted cursor-not-allowed'}`}
              >
                <span className="text-2xl">{c.icon}</span>
                <span>{c.label}</span>
              </button>
            ))}
          </div>

          {/* Submit ticket */}
          <div className="bg-white rounded-2xl border border-border p-4 mb-5">
            <p className="font-800 text-textmain text-base mb-4">Submit a Ticket</p>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="text-xs font-700 text-textsub block mb-1.5">Subject *</label>
                <input value={form.subject} onChange={e => set('subject')(e.target.value)} className="w-full h-11 px-4 rounded-xl border border-border bg-surface-2 text-sm" placeholder="Brief description" required />
              </div>
              <div>
                <label className="text-xs font-700 text-textsub block mb-1.5">Category *</label>
                <select value={form.category} onChange={e => set('category')(e.target.value)} className="w-full h-11 px-4 rounded-xl border border-border bg-surface-2 text-sm" required>
                  <option value="">Select category...</option>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-700 text-textsub block mb-1.5">Related Contract (Optional)</label>
                <select value={form.contract_id} onChange={e => set('contract_id')(e.target.value)} className="w-full h-11 px-4 rounded-xl border border-border bg-surface-2 text-sm">
                  <option value="">None</option>
                  {contracts.map(c => <option key={c.id} value={c.id}>{c.contract_number} — {c.estate_name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-700 text-textsub block mb-1.5">Message * (min. 20 chars)</label>
                <textarea
                  value={form.message}
                  onChange={e => set('message')(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-border bg-surface-2 text-sm resize-none"
                  rows={4}
                  placeholder="Describe your issue in detail..."
                  required
                />
                <p className="text-[10px] text-textmuted text-right mt-1">{form.message.length} / 20 min</p>
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-red text-white py-4 rounded-2xl font-800 flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {submitting ? <Spinner size="sm" color="white" /> : 'Submit Ticket →'}
              </button>
            </form>
          </div>

          {/* My tickets */}
          {tickets.length > 0 && (
            <div>
              <p className="font-800 text-textmain text-base mb-3">My Tickets</p>
              <div className="space-y-3">
                {tickets.map(t => (
                  <div key={t.id} className="bg-white rounded-2xl border border-border overflow-hidden">
                    <button
                      onClick={() => setExpanded(expanded === t.id ? null : t.id)}
                      className="w-full flex items-start justify-between p-4 text-left"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-800 text-textmain">{t.subject}</p>
                          <Badge label={t.status} variant={t.status === 'open' ? 'pending' : 'completed'} />
                        </div>
                        <div className="flex gap-2">
                          <span className="text-[10px] font-700 text-textsub bg-surface-2 px-2 py-0.5 rounded-full">{t.category}</span>
                          <span className="text-[10px] text-textmuted">{fmtDate(t.created_at)}</span>
                        </div>
                      </div>
                      <span className="text-textmuted ml-2">{expanded === t.id ? '▲' : '▼'}</span>
                    </button>
                    {expanded === t.id && (
                      <div className="border-t border-border px-4 pb-4 pt-3 bg-surface">
                        <p className="text-xs font-700 text-textmuted mb-1">Your message</p>
                        <p className="text-sm text-textmain leading-5 mb-3">{t.message}</p>
                        {t.admin_reply && (
                          <div className="bg-white rounded-xl border border-border p-3">
                            <p className="text-xs font-700 text-success mb-1">✅ Admin Reply</p>
                            <p className="text-sm text-textmain leading-5">{t.admin_reply}</p>
                            {t.replied_at && <p className="text-[10px] text-textmuted mt-1">{fmtDate(t.replied_at)}</p>}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="h-4" />
        </div>
      )}
    </Layout>
  );
}
