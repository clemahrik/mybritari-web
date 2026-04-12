export default function Spinner({ size = 'md', color = 'red' }) {
  const sz = size === 'sm' ? 'w-5 h-5 border-2' : size === 'lg' ? 'w-12 h-12 border-4' : 'w-8 h-8 border-3';
  const cl = color === 'white' ? 'border-white border-t-transparent' : 'border-red border-t-transparent';
  return (
    <div className={`${sz} ${cl} rounded-full animate-spin`} />
  );
}

export function FullPageSpinner() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-surface">
      <Spinner size="lg" color="red" />
    </div>
  );
}
