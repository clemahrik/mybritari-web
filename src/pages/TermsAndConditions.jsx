import { useNavigate } from 'react-router-dom';

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

export default function TermsAndConditions() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50" style={{ maxWidth: 430, width: '100%', margin: '0 auto' }}>

      {/* Header */}
      <div className="bg-navy px-5 pt-12 pb-5 sticky top-0 z-10">
        <div className="flex items-center gap-3 mb-3">
          <button
            onClick={() => navigate(-1)}
            className="text-white/70 text-sm font-600 hover:text-white transition-colors"
          >
            ← Back
          </button>
        </div>
        <h1 className="text-white font-900 text-xl">Terms &amp; Conditions</h1>
        <p className="text-white/60 text-xs mt-1">Britari Properties Limited — Last Updated: April 2026</p>
      </div>

      {/* Content */}
      <div className="px-5 py-6 space-y-6">

        {/* Intro card */}
        <div className="bg-navy rounded-2xl px-5 py-4">
          <p className="text-white font-800 text-base">Client Subscription Agreement</p>
          <p className="text-white/70 text-sm mt-1 leading-5">
            Please read all terms carefully before subscribing. By registering and making any payment, you agree to be bound by these terms.
          </p>
        </div>

        {/* Sections */}
        {SECTIONS.map((sec, si) => (
          <div key={si} className="bg-white rounded-2xl px-5 py-5 shadow-sm border border-gray-100">
            <h2 className="text-base font-800 text-gray-900 mb-3 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-red text-white text-xs font-900 flex items-center justify-center flex-shrink-0">
                {si + 1}
              </span>
              {sec.title}
            </h2>
            {sec.intro && (
              <p className="text-sm text-gray-600 mb-3 leading-5 italic">{sec.intro}</p>
            )}
            <ul className="space-y-2.5">
              {sec.bullets.map((b, bi) => (
                <li key={bi} className="flex gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-red mt-2 flex-shrink-0" />
                  <p className="text-sm text-gray-600 leading-5 flex-1">{b}</p>
                </li>
              ))}
            </ul>
            {sec.subTitle && (
              <div className="mt-4 pt-3 border-t border-gray-100">
                <p className="text-sm font-700 text-gray-800 mb-2">{sec.subTitle}</p>
                <ul className="space-y-2">
                  {sec.subBullets?.map((b, bi) => (
                    <li key={bi} className="flex gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-gray-400 mt-2 flex-shrink-0" />
                      <p className="text-sm text-gray-600 leading-5 flex-1">{b}</p>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}

        {/* Footer note */}
        <div className="bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4">
          <p className="text-sm font-700 text-amber-800 mb-1">Important Notice</p>
          <p className="text-xs text-amber-700 leading-5">
            These terms are subject to change. Existing subscribers will be notified of material changes.
            For queries, contact us at <span className="font-700">support@britariproperties.com</span>.
          </p>
        </div>

        <div className="h-8" />
      </div>
    </div>
  );
}
