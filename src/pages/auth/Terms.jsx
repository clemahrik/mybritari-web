import { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/Toast';
import Spinner from '../../components/Spinner';
import api from '../../services/api';

const SECTIONS = [
  {
    title: 'General Terms',
    bullets: [
      'You are expected to register either via app or hard copy form.',
      'Upon submission of Application, you will receive an offer letter by email, client portal, WhatsApp and physical copy.',
      'All documents including offer letter, contract of sale, deed of assignment, receipts, survey, provisional allocation letter will be accessed on the client\'s dashboard. Hard copies will also be provided.',
    ],
  },
  {
    title: 'Payment Structure',
    bullets: [
      'The Subscriber agrees to pay the agreed weekly or monthly instalment consistently for the selected duration, as specified in the chosen payment plan and clearly stated in the Offer Letter.',
      'The Subscriber is required to make all payments strictly in accordance with the schedule outlined in the Contract of Sale Agreement or Offer Letter.',
      'All payments must be made on or before the agreed due date. Any payment not made within 7 days after the due date shall attract a late payment penalty of 5% of the applicable weekly or monthly instalment.',
      'Where default continues beyond 4 weeks (1 month), an additional 20% penalty shall be applied to the total outstanding balance.',
      'A continued default exceeding 10 consecutive weeks (2 months) may result in further penalties of up to 30% increase on the total outstanding balance, in addition to any previously accrued charges.',
    ],
  },
  {
    title: 'Allocation Policy',
    bullets: [
      'Final Allocation of land shall be STRICTLY AFTER FULL PAYMENT of the total plot value and Survey fee of ₦100,000 (One Hundred Thousand Naira).',
      'Early allocation may only be granted at the discretion of the company under special promotions and as development sets in early.',
      'Allocation is done during official allocation events organized by the company. Allocation is also done after perimeter fence and beaconing of plots is completed. Usually, beaconing is done after the lifespan of the sales period — either after the first year or second year of sales of the estate plots.',
      'You can only start building on the land after full payment on land and all other statutory fees including infrastructure fee.',
    ],
  },
  {
    title: 'Refund Policy',
    intro: 'Subscription is voluntary but contractual upon payment. In the event of withdrawal:',
    bullets: [
      'A 30% administrative fee will be deducted from the total amount paid.',
      'Refund will be processed within 100 working days after official request.',
      'No refund will be made for subscribers who default for more than 12 weeks (3 months) without communication — treated as abandonment subscription.',
      'Upon abandonment: The Company reserves the right to terminate this Agreement. The Subscriber shall forfeit up to 40% of total payments made.',
      'All refund requests must be submitted in writing.',
      'There shall be no refund after completion of payment. The Subscriber can only solicit management to assist in selling the plot. In this event, only the cost price will be returned.',
    ],
  },
  {
    title: 'Loan Access Policy',
    bullets: [
      'Subscribers who have paid consistently for a minimum period of 12 months are eligible to apply for a loan facility.',
      'Loan access is limited to 30% of the total land value subscribed.',
      'Loan approval is subject to: (1) Payment consistency, (2) Internal credit assessment.',
      'Default on loan repayment will lead to increase in interest and possibly suspension of promotional benefits.',
    ],
    subTitle: 'Loan Repayment Terms:',
    subBullets: [
      'Maximum duration: 6 months.',
      'Interest rate: 15% (subject to review).',
    ],
  },
  {
    title: 'Default & Forfeiture',
    bullets: [
      'Failure to meet payment obligations may result in loss of land allocation and a complete forfeiture of land benefits, as well as repricing of the plot at current market value.',
      'Continuous default beyond 12 weeks (3 months) without communication will lead to termination of contract. In this case, only 40% of total payment will be refunded.',
      'Payment that exceeds the timeline attracts an additional fee of 100% rise in the cost of land.',
    ],
  },
  {
    title: 'Title & Documentation',
    intro: 'Upon full payment, subscriber is entitled to:',
    bullets: [
      'Hard copy Receipt of total Payment.',
      'Deed of Assignment.',
      'Final Allocation stating your Plot and Block.',
    ],
  },
  {
    title: 'Other Levies After Allocation',
    bullets: [
      'Infrastructure/Development fee — paid when development sets in. Cost is determined by the cost of construction materials.',
      'Payment for Architectural drawings.',
      'Corner piece plot attracts an extra 20% of the total cost of land.',
    ],
  },
  {
    title: 'Other Conditions',
    bullets: [
      'Prices of land are subject to review based on market conditions. However, this does not affect existing subscribers.',
      'The company reserves the right to amend policies without prior notice.',
      'Subscribers agree to abide by estate rules and development guidelines.',
      'You can resell your plot/property after complete payment and allocation. A letter of notice of ownership transfer must be written to Britari Properties Limited and a transfer fee is applicable.',
      'The Subscriber will not transfer this agreement, land or property to any third party, agent or persons — either to sell, lease, or carry any transaction — without the consent of the estate management.',
    ],
  },
];

export default function Terms() {
  const navigate      = useNavigate();
  const { updateUser } = useAuth();
  const { showToast }  = useToast();
  const [loading, setLoading] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [scrollPct, setScrollPct] = useState(0);
  const scrollRef = useRef(null);

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const scrollTop    = el.scrollTop;
    const scrollHeight = el.scrollHeight - el.clientHeight;
    const pct          = scrollHeight > 0 ? Math.round((scrollTop / scrollHeight) * 100) : 100;
    setScrollPct(pct);
    if (pct >= 95) setScrolled(true);
  }, []);

  async function handleAccept() {
    setLoading(true);
    try {
      await api.post('/auth/accept-terms');
      updateUser({ terms_accepted: 1, terms_accepted_at: new Date().toISOString() });
      showToast('Terms accepted!', 'success');
      navigate('/kyc', { replace: true });
    } catch (e) {
      showToast(e?.response?.data?.message || 'Failed to accept terms', 'error');
    } finally { setLoading(false); }
  }

  return (
    <div className="flex flex-col bg-surface overflow-hidden" style={{ maxWidth: 430, width: '100%', height: '100vh' }}>
      {/* Header */}
      <div className="bg-navy px-5 pt-12 pb-4 sticky top-0 z-10">
        <h1 className="text-white font-900 text-lg text-center">Terms & Conditions</h1>
        {/* Progress bar */}
        <div className="mt-3 h-1 bg-white/20 rounded-full overflow-hidden">
          <div
            className="h-full bg-red rounded-full transition-all duration-200"
            style={{ width: `${scrollPct}%` }}
          />
        </div>
        {!scrolled && (
          <p className="text-white/60 text-xs text-center mt-2">Scroll to the bottom to enable accept</p>
        )}
      </div>

      {/* Scrollable content */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-5 py-6"
        style={{ paddingBottom: 120 }}
      >
        <div className="bg-navy rounded-2xl px-5 py-4 mb-6">
          <p className="text-white font-900 text-base">Britari Properties Limited</p>
          <p className="text-white/70 text-sm mt-1">Client Subscription Agreement — Please read carefully</p>
        </div>

        {SECTIONS.map((sec, si) => (
          <div key={si} className="mb-6">
            <h2 className="text-base font-800 text-textmain mb-3">{si + 1}. {sec.title}</h2>
            {sec.intro && <p className="text-sm text-textsub mb-3 leading-5">{sec.intro}</p>}
            <ul className="space-y-2.5">
              {sec.bullets.map((b, bi) => (
                <li key={bi} className="flex gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-red mt-2 flex-shrink-0" />
                  <p className="text-sm text-textsub leading-5 flex-1">{b}</p>
                </li>
              ))}
            </ul>
            {sec.subTitle && (
              <div className="mt-3">
                <p className="text-sm font-700 text-textmain mb-2">{sec.subTitle}</p>
                <ul className="space-y-2">
                  {sec.subBullets?.map((b, bi) => (
                    <li key={bi} className="flex gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-navy-light mt-2 flex-shrink-0" />
                      <p className="text-sm text-textsub leading-5 flex-1">{b}</p>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {sec.outro && <p className="text-sm text-textsub mt-3 italic">{sec.outro}</p>}
          </div>
        ))}

        <div className="h-6" />
      </div>

      {/* Fixed accept button */}
      <div className="sticky bottom-0 bg-white border-t border-border px-5 py-4">
        {!scrolled && (
          <p className="text-xs text-center text-textmuted mb-3">
            ↓ Keep scrolling to enable the accept button
          </p>
        )}
        <button
          onClick={handleAccept}
          disabled={!scrolled || loading}
          className={`w-full flex items-center justify-between px-6 py-[17px] rounded-2xl font-800 text-base transition-all
            ${scrolled ? 'bg-red text-white' : 'bg-surface-2 text-textmuted cursor-not-allowed'}`}
        >
          {loading ? (
            <div className="flex-1 flex justify-center"><Spinner size="sm" color="white" /></div>
          ) : (
            <>
              <span>I Accept These Terms</span>
              {scrolled && <span className="text-xl">→</span>}
            </>
          )}
        </button>
      </div>
    </div>
  );
}
