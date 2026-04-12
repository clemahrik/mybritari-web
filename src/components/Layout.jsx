import BottomNav from './BottomNav';

export default function Layout({ children, noPad = false }) {
  return (
    <div
      className="relative bg-surface flex flex-col"
      style={{ maxWidth: 430, width: '100%', minHeight: '100vh' }}
    >
      <div className={`flex-1 ${noPad ? '' : 'pb-16'}`}>
        {children}
      </div>
      <BottomNav />
    </div>
  );
}
