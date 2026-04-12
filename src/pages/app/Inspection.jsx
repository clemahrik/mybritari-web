import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import TopHeader from '../../components/TopHeader';
import Spinner from '../../components/Spinner';
import Badge from '../../components/Badge';
import EmptyState from '../../components/EmptyState';
import { useToast } from '../../components/Toast';
import { inspectionsAPI, estatesAPI } from '../../services/api';
import { fmtDate } from '../../utils';

const TIMES = ['9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM'];

export default function Inspection() {
  const { showToast } = useToast();
  const [inspections, setInspections] = useState([]);
  const [estates,     setEstates]     = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [submitting,  setSubmitting]  = useState(false);
  const [form, setForm] = useState({
    estate_id: '', preferred_date: '', preferred_time: '', party_size: '1', notes: '',
  });

  useEffect(() => {
    Promise.all([
      inspectionsAPI.getAll().catch(() => ({ data: { data: [] } })),
      estatesAPI.getAll().catch(() => ({ data: { data: [] } })),
    ]).then(([iR, eR]) => {
      setInspections(iR.data.data || []);
      setEstates(eR.data.data || []);
    }).finally(() => setLoading(false));
  }, []);

  const set = (k) => (v) => setForm(f => ({ ...f, [k]: v }));

  // Min date = tomorrow
  const minDate = new Date();
  minDate.setDate(minDate.getDate() + 1);
  const minDateStr = minDate.toISOString().split('T')[0];

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.estate_id || !form.preferred_date)
      return showToast('Please select an estate and date', 'error');
    setSubmitting(true);
    try {
      await inspectionsAPI.book({
        estate_id:      form.estate_id,
        preferred_date: form.preferred_date,
        preferred_time: form.preferred_time,
        party_size:     Number(form.party_size),
        notes:          form.notes,
      });
      showToast('Inspection booked! We\'ll confirm shortly.', 'success');
      setForm({ estate_id: '', preferred_date: '', preferred_time: '', party_size: '1', notes: '' });
      const r = await inspectionsAPI.getAll().catch(() => ({ data: { data: [] } }));
      setInspections(r.data.data || []);
    } catch (e) {
      showToast(e?.response?.data?.message || 'Booking failed', 'error');
    } finally { setSubmitting(false); }
  }

  if (loading) return <Layout><div className="flex justify-center py-20"><Spinner size="lg" /></div></Layout>;

  return (
    <Layout>
      <TopHeader title="Book Inspection" showBack />
      <div className="px-4 py-4">
        {/* Info */}
        <div className="bg-navy rounded-2xl p-4 mb-4">
          <p className="text-white font-900 text-base mb-1">📍 Site Inspection</p>
          <p className="text-white/70 text-sm">Visit any of our estates with a Britari agent. Free of charge.</p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-2xl border border-border p-4 mb-5">
          <p className="font-800 text-textmain text-sm mb-4">Book a Visit</p>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="text-xs font-700 text-textsub block mb-1.5">Select Estate *</label>
              <select value={form.estate_id} onChange={e => set('estate_id')(e.target.value)} className="w-full h-11 px-4 rounded-xl border border-border bg-surface-2 text-sm" required>
                <option value="">Choose estate...</option>
                {estates.map(e => <option key={e.id} value={e.id}>{e.name} — {e.location}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-700 text-textsub block mb-1.5">Preferred Date *</label>
              <input type="date" value={form.preferred_date} min={minDateStr} onChange={e => set('preferred_date')(e.target.value)} className="w-full h-11 px-4 rounded-xl border border-border bg-surface-2 text-sm" required />
            </div>
            <div>
              <label className="text-xs font-700 text-textsub block mb-1.5">Preferred Time</label>
              <select value={form.preferred_time} onChange={e => set('preferred_time')(e.target.value)} className="w-full h-11 px-4 rounded-xl border border-border bg-surface-2 text-sm">
                <option value="">Any time</option>
                {TIMES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-700 text-textsub block mb-1.5">Party Size</label>
              <select value={form.party_size} onChange={e => set('party_size')(e.target.value)} className="w-full h-11 px-4 rounded-xl border border-border bg-surface-2 text-sm">
                {[1,2,3,4,5].map(n => <option key={n} value={n}>{n} person{n > 1 ? 's' : ''}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-700 text-textsub block mb-1.5">Additional Notes</label>
              <textarea value={form.notes} onChange={e => set('notes')(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-border bg-surface-2 text-sm resize-none" rows={3} placeholder="Any special requests?" />
            </div>
            <button type="submit" disabled={submitting} className="w-full bg-red text-white py-4 rounded-2xl font-800 flex items-center justify-center gap-2 disabled:opacity-60">
              {submitting ? <Spinner size="sm" color="white" /> : 'Book Inspection →'}
            </button>
          </form>
        </div>

        {/* Previous */}
        {inspections.length > 0 && (
          <div>
            <p className="font-800 text-textmain text-base mb-3">My Inspections</p>
            <div className="space-y-3">
              {inspections.map(i => (
                <div key={i.id} className="bg-white rounded-2xl border border-border p-4">
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="font-800 text-textmain text-sm">{i.estate_name || 'Estate'}</p>
                    <Badge label={i.status} variant={i.status === 'confirmed' ? 'verified' : i.status === 'pending' ? 'pending' : 'default'} />
                  </div>
                  <p className="text-xs text-textsub">{fmtDate(i.preferred_date)} {i.preferred_time ? '· ' + i.preferred_time : ''}</p>
                  <p className="text-xs text-textsub">{i.party_size} person{i.party_size > 1 ? 's' : ''}</p>
                  {i.confirmed_date && <p className="text-xs text-success font-700 mt-1">Confirmed: {fmtDate(i.confirmed_date)}</p>}
                  {i.admin_notes && <p className="text-xs text-textsub mt-1 italic">{i.admin_notes}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="h-4" />
      </div>
    </Layout>
  );
}
