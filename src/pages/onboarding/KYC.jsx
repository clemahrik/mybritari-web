import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/Toast';
import Spinner from '../../components/Spinner';
import api from '../../services/api';
import { fileToBase64 } from '../../utils';

const NIGERIAN_STATES = [
  'Abia','Adamawa','Akwa Ibom','Anambra','Bauchi','Bayelsa','Benue','Borno',
  'Cross River','Delta','Ebonyi','Edo','Ekiti','Enugu','FCT','Gombe','Imo',
  'Jigawa','Kaduna','Kano','Katsina','Kebbi','Kogi','Kwara','Lagos','Nasarawa',
  'Niger','Ogun','Ondo','Osun','Oyo','Plateau','Rivers','Sokoto','Taraba',
  'Yobe','Zamfara',
];
const ID_TYPES = [
  { id: 'nin',       label: "NIN",              icon: '🪪' },
  { id: 'voter',     label: "Voter's Card",      icon: '🗳️' },
  { id: 'driver',    label: "Driver's License",  icon: '🚗' },
  { id: 'passport',  label: "Int'l Passport",    icon: '📘' },
];
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

function StepDot({ step, current }) {
  const active = current === step, done = current > step;
  return (
    <div className="flex flex-col items-center">
      <div className={`w-7 h-7 rounded-full flex items-center justify-center border-2 text-xs font-800
        ${done || active ? 'bg-red border-red text-white' : 'bg-surface-2 border-border text-textmuted'}`}>
        {done ? '✓' : step}
      </div>
      <span className={`text-[9px] font-700 mt-1 ${active ? 'text-red' : 'text-textmuted'}`}>
        {['','Details','ID','Photo','Next of Kin','Review'][step]}
      </span>
    </div>
  );
}

export default function KYC() {
  const navigate      = useNavigate();
  const { updateUser } = useAuth();
  const { showToast }  = useToast();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [confirmed, setConfirmed] = useState(false);

  const [form, setForm] = useState({
    first_name: '', last_name: '', date_of_birth: '',
    dob_day: '', dob_month: '', dob_year: '',
    gender: '', marital_status: '', phone: '',
    state_of_origin: '', address: '', occupation: '',
    id_type: '', id_number: '', id_image: '',
    passport_photo: '',
    nok_name: '', nok_relationship: '', nok_phone: '', nok_email: '', nok_address: '',
  });

  const set = (k) => (v) => setForm(f => ({ ...f, [k]: v }));

  const currentYear = new Date().getFullYear();
  const years       = Array.from({ length: 80 }, (_, i) => currentYear - 18 - i);
  const days        = Array.from({ length: 31 }, (_, i) => i + 1);

  async function handleImageUpload(key, file) {
    if (!file) return;
    const base64 = await fileToBase64(file);
    set(key)(base64);
  }

  function nextStep() {
    setError('');
    if (step === 1) {
      if (!form.first_name || !form.last_name || !form.phone || !form.address || !form.occupation)
        return setError('Please fill in all required fields.');
      if (!form.dob_day || !form.dob_month || !form.dob_year)
        return setError('Please enter your date of birth.');
      if (!form.gender) return setError('Please select your gender.');
    }
    if (step === 2) {
      if (!form.id_type)   return setError('Please select an ID type.');
      if (!form.id_number) return setError('Please enter your ID number.');
    }
    if (step === 3) {
      if (!form.passport_photo) return setError('Please upload your passport photo.');
    }
    if (step === 4) {
      if (!form.nok_name || !form.nok_phone || !form.nok_relationship)
        return setError('Please fill in Next of Kin details.');
    }
    setStep(s => s + 1);
  }

  async function handleSubmit() {
    if (!confirmed) return setError('Please confirm that all information is correct.');
    setLoading(true);
    setError('');
    try {
      const dob = form.dob_year && form.dob_month && form.dob_day
        ? `${form.dob_year}-${String(MONTHS.indexOf(form.dob_month) + 1).padStart(2,'0')}-${String(form.dob_day).padStart(2,'0')}`
        : '';
      await api.post('/auth/kyc', {
        first_name: form.first_name, last_name: form.last_name,
        date_of_birth: dob, gender: form.gender, marital_status: form.marital_status,
        phone: form.phone, address: form.address, occupation: form.occupation,
        state_of_origin: form.state_of_origin,
        id_type: form.id_type, id_number: form.id_number, id_image: form.id_image,
        passport_photo: form.passport_photo,
        nok_name: form.nok_name, nok_relationship: form.nok_relationship,
        nok_phone: form.nok_phone, nok_email: form.nok_email, nok_address: form.nok_address,
      });
      updateUser({ kyc_status: 'pending' });
      showToast('KYC submitted! We\'ll review within 24-48 hours.', 'success');
      navigate('/dashboard', { replace: true });
    } catch (e) {
      setError(e?.response?.data?.message || 'Submission failed. Please try again.');
    } finally { setLoading(false); }
  }

  const inputCls = "w-full h-[50px] px-4 rounded-xl border border-border bg-surface-2 text-textmain text-[14px] focus:border-navy";
  const selectCls = inputCls;
  const labelCls  = "block text-xs font-700 text-textsub uppercase tracking-wide mb-1.5";

  return (
    <div className="flex flex-col bg-surface" style={{ maxWidth: 430, width: '100%', minHeight: '100vh' }}>
      {/* Header */}
      <div className="bg-navy px-5 pt-12 pb-5 sticky top-0 z-10">
        <h1 className="text-white font-900 text-lg text-center mb-4">Identity Verification</h1>
        {/* Step dots */}
        <div className="flex items-start justify-between px-2">
          {[1,2,3,4,5].map(s => (
            <div key={s} className="flex items-center flex-1">
              <StepDot step={s} current={step} />
              {s < 5 && <div className="flex-1 h-0.5 bg-white/20 mb-3 mx-1" />}
            </div>
          ))}
        </div>
        {/* Progress */}
        <div className="mt-3 h-1 bg-white/20 rounded-full overflow-hidden">
          <div className="h-full bg-red rounded-full transition-all" style={{ width: `${(step / 5) * 100}%` }} />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-5 py-5">
        {/* Step 1: Personal Details */}
        {step === 1 && (
          <div>
            <h2 className="text-base font-800 text-textmain mb-4">Personal Details</h2>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <label className={labelCls}>First Name *</label>
                <input value={form.first_name} onChange={e => set('first_name')(e.target.value)} className={inputCls} placeholder="John" />
              </div>
              <div>
                <label className={labelCls}>Last Name *</label>
                <input value={form.last_name} onChange={e => set('last_name')(e.target.value)} className={inputCls} placeholder="Doe" />
              </div>
            </div>

            <div className="mb-4">
              <label className={labelCls}>Date of Birth *</label>
              <div className="grid grid-cols-3 gap-2">
                <select value={form.dob_day} onChange={e => set('dob_day')(e.target.value)} className={selectCls}>
                  <option value="">Day</option>
                  {days.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
                <select value={form.dob_month} onChange={e => set('dob_month')(e.target.value)} className={selectCls}>
                  <option value="">Month</option>
                  {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
                <select value={form.dob_year} onChange={e => set('dob_year')(e.target.value)} className={selectCls}>
                  <option value="">Year</option>
                  {years.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <label className={labelCls}>Gender *</label>
                <select value={form.gender} onChange={e => set('gender')(e.target.value)} className={selectCls}>
                  <option value="">Select</option>
                  <option>Male</option><option>Female</option><option>Other</option>
                </select>
              </div>
              <div>
                <label className={labelCls}>Marital Status</label>
                <select value={form.marital_status} onChange={e => set('marital_status')(e.target.value)} className={selectCls}>
                  <option value="">Select</option>
                  <option>Single</option><option>Married</option><option>Divorced</option><option>Widowed</option>
                </select>
              </div>
            </div>

            <div className="mb-4">
              <label className={labelCls}>Phone Number *</label>
              <input value={form.phone} onChange={e => set('phone')(e.target.value)} className={inputCls} placeholder="+234 800 000 0000" type="tel" />
            </div>
            <div className="mb-4">
              <label className={labelCls}>State of Origin</label>
              <select value={form.state_of_origin} onChange={e => set('state_of_origin')(e.target.value)} className={selectCls}>
                <option value="">Select State</option>
                {NIGERIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="mb-4">
              <label className={labelCls}>Residential Address *</label>
              <textarea value={form.address} onChange={e => set('address')(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-border bg-surface-2 text-textmain text-[14px] resize-none" rows={3} placeholder="Your full address" />
            </div>
            <div className="mb-4">
              <label className={labelCls}>Occupation *</label>
              <input value={form.occupation} onChange={e => set('occupation')(e.target.value)} className={inputCls} placeholder="e.g. Engineer" />
            </div>
          </div>
        )}

        {/* Step 2: ID */}
        {step === 2 && (
          <div>
            <h2 className="text-base font-800 text-textmain mb-4">Means of Identification</h2>
            <div className="grid grid-cols-2 gap-3 mb-5">
              {ID_TYPES.map(t => (
                <button
                  key={t.id}
                  onClick={() => set('id_type')(t.id)}
                  className={`flex flex-col items-center py-4 rounded-2xl border-2 gap-2 transition-all
                    ${form.id_type === t.id ? 'border-red bg-red-light' : 'border-border bg-white'}`}
                >
                  <span className="text-2xl">{t.icon}</span>
                  <span className={`text-xs font-700 ${form.id_type === t.id ? 'text-red' : 'text-textsub'}`}>{t.label}</span>
                </button>
              ))}
            </div>
            <div className="mb-4">
              <label className={labelCls}>ID Number *</label>
              <input value={form.id_number} onChange={e => set('id_number')(e.target.value)} className={inputCls} placeholder="Enter your ID number" />
            </div>
            <div className="mb-4">
              <label className={labelCls}>Upload ID Document</label>
              <div className="border-2 border-dashed border-border rounded-2xl p-5 text-center">
                {form.id_image ? (
                  <div>
                    <img src={form.id_image} alt="ID" className="max-h-40 mx-auto rounded-xl mb-2 object-cover" />
                    <button onClick={() => set('id_image')('')} className="text-red text-sm font-700">Remove</button>
                  </div>
                ) : (
                  <label className="cursor-pointer">
                    <div className="text-3xl mb-2">📄</div>
                    <p className="text-sm font-700 text-textmain mb-1">Upload ID Document</p>
                    <p className="text-xs text-textmuted mb-3">JPG, PNG or PDF · Max 5MB</p>
                    <span className="bg-surface-2 text-textsub font-700 text-xs px-4 py-2 rounded-xl">Choose File</span>
                    <input type="file" accept="image/*,.pdf" className="hidden" onChange={e => handleImageUpload('id_image', e.target.files[0])} />
                  </label>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Passport Photo */}
        {step === 3 && (
          <div>
            <h2 className="text-base font-800 text-textmain mb-2">Passport Photo</h2>
            <div className="bg-warning-bg border border-warning/30 rounded-2xl p-4 mb-5">
              <p className="text-xs font-700 text-warning mb-2">📸 Photo Guidelines</p>
              <ul className="space-y-1">
                {['Clear, well-lit face photo', 'White or light background', 'No sunglasses or hats', 'Look directly at camera'].map(g => (
                  <li key={g} className="flex gap-2 text-xs text-warning/80">
                    <span>•</span><span>{g}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex flex-col items-center">
              {form.passport_photo ? (
                <div className="flex flex-col items-center gap-3">
                  <div className="w-36 h-36 rounded-full overflow-hidden border-4 border-red">
                    <img src={form.passport_photo} alt="Passport" className="w-full h-full object-cover" />
                  </div>
                  <button onClick={() => set('passport_photo')('')} className="text-red text-sm font-700">Change Photo</button>
                </div>
              ) : (
                <label className="cursor-pointer flex flex-col items-center">
                  <div className="w-36 h-36 rounded-full border-2 border-dashed border-border bg-surface-2 flex flex-col items-center justify-center mb-3">
                    <span className="text-3xl mb-1">🤳</span>
                    <span className="text-xs text-textmuted">Tap to upload</span>
                  </div>
                  <span className="bg-red text-white font-700 text-sm px-6 py-3 rounded-2xl">Upload Photo</span>
                  <input type="file" accept="image/*" className="hidden" onChange={e => handleImageUpload('passport_photo', e.target.files[0])} />
                </label>
              )}
            </div>
          </div>
        )}

        {/* Step 4: Next of Kin */}
        {step === 4 && (
          <div>
            <h2 className="text-base font-800 text-textmain mb-4">Next of Kin</h2>
            <div className="mb-4">
              <label className={labelCls}>Full Name *</label>
              <input value={form.nok_name} onChange={e => set('nok_name')(e.target.value)} className={inputCls} placeholder="Next of Kin's full name" />
            </div>
            <div className="mb-4">
              <label className={labelCls}>Relationship *</label>
              <select value={form.nok_relationship} onChange={e => set('nok_relationship')(e.target.value)} className={selectCls}>
                <option value="">Select Relationship</option>
                {['Spouse','Parent','Sibling','Child','Friend','Other'].map(r => <option key={r}>{r}</option>)}
              </select>
            </div>
            <div className="mb-4">
              <label className={labelCls}>Phone Number *</label>
              <input value={form.nok_phone} onChange={e => set('nok_phone')(e.target.value)} className={inputCls} placeholder="+234 800 000 0000" type="tel" />
            </div>
            <div className="mb-4">
              <label className={labelCls}>Email Address</label>
              <input value={form.nok_email} onChange={e => set('nok_email')(e.target.value)} className={inputCls} placeholder="email@example.com" type="email" />
            </div>
            <div className="mb-4">
              <label className={labelCls}>Address</label>
              <textarea value={form.nok_address} onChange={e => set('nok_address')(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-border bg-surface-2 text-textmain text-[14px] resize-none" rows={3} placeholder="Their residential address" />
            </div>
          </div>
        )}

        {/* Step 5: Review */}
        {step === 5 && (
          <div>
            <h2 className="text-base font-800 text-textmain mb-4">Review & Submit</h2>
            <div className="space-y-3">
              {[
                { label: 'Name',        value: `${form.first_name} ${form.last_name}` },
                { label: 'D.O.B',       value: `${form.dob_day} ${form.dob_month} ${form.dob_year}` },
                { label: 'Gender',      value: form.gender },
                { label: 'Phone',       value: form.phone },
                { label: 'State',       value: form.state_of_origin || '—' },
                { label: 'Occupation',  value: form.occupation },
                { label: 'ID Type',     value: form.id_type },
                { label: 'ID Number',   value: form.id_number },
                { label: 'Next of Kin', value: `${form.nok_name} (${form.nok_relationship})` },
                { label: 'NOK Phone',   value: form.nok_phone },
              ].map(r => (
                <div key={r.label} className="flex items-center justify-between bg-white rounded-xl px-4 py-3 border border-border">
                  <span className="text-xs font-700 text-textmuted">{r.label}</span>
                  <span className="text-sm font-700 text-textmain">{r.value || '—'}</span>
                </div>
              ))}
            </div>

            <label className="flex items-start gap-3 mt-5 cursor-pointer">
              <input
                type="checkbox"
                checked={confirmed}
                onChange={e => setConfirmed(e.target.checked)}
                className="mt-0.5 w-5 h-5 accent-red"
              />
              <span className="text-sm text-textsub leading-5">
                I confirm that all information provided is accurate and correct to the best of my knowledge.
              </span>
            </label>
          </div>
        )}

        {error && (
          <div className="mt-4 px-4 py-3 bg-red-light rounded-xl text-red text-sm font-600">
            {error}
          </div>
        )}
      </div>

      {/* Footer buttons */}
      <div className="sticky bottom-0 bg-white border-t border-border px-5 py-4 flex gap-3">
        {step > 1 && (
          <button
            onClick={() => { setStep(s => s - 1); setError(''); }}
            className="flex-1 h-[52px] rounded-2xl border-2 border-border font-700 text-textsub"
          >
            ← Back
          </button>
        )}
        {step < 5 ? (
          <button
            onClick={nextStep}
            className="flex-1 h-[52px] bg-red text-white rounded-2xl font-800 flex items-center justify-between px-5"
          >
            <span>Continue</span><span>→</span>
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={loading || !confirmed}
            className="flex-1 h-[52px] bg-red text-white rounded-2xl font-800 flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {loading ? <Spinner size="sm" color="white" /> : 'Submit KYC →'}
          </button>
        )}
      </div>
    </div>
  );
}
