const VARIANTS = {
  active:       'bg-success-bg text-success',
  completed:    'bg-success-bg text-success',
  pending:      'bg-warning-bg text-warning',
  verified:     'bg-success-bg text-success',
  rejected:     'bg-red-light text-red',
  forfeited:    'bg-red-light text-red',
  not_submitted:'bg-surface-2 text-textmuted',
  open:         'bg-warning-bg text-warning',
  closed:       'bg-success-bg text-success',
  approved:     'bg-success-bg text-success',
  review:       'bg-warning-bg text-warning',
  default:      'bg-surface-2 text-textsub',
};

export default function Badge({ label, variant }) {
  const cls = VARIANTS[variant] || VARIANTS[label?.toLowerCase?.()] || VARIANTS.default;
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-700 uppercase tracking-wide ${cls}`}>
      {label}
    </span>
  );
}
