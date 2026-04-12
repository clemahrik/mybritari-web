export default function EmptyState({ icon = '📭', title, subtitle, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="text-5xl mb-4">{icon}</div>
      <p className="text-base font-700 text-textmain mb-2">{title}</p>
      {subtitle && <p className="text-sm text-textsub mb-6">{subtitle}</p>}
      {action && (
        <button
          onClick={action.onPress}
          className="bg-red text-white px-6 py-3 rounded-2xl text-sm font-700"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
