// Standalone "we've moved to mobile" landing page.
//
// The MyBritari client web portal was retired once the Android + iOS apps went
// live (2026-06-15). App.jsx now renders ONLY this page for every URL. It is
// intentionally self-contained — no AuthProvider, no API calls, no router — so
// the portal is genuinely "down" and can never break or hit the backend.
// To bring the web portal back: restore the commented-out code in App.jsx.

const PLAY_URL = 'https://play.google.com/store/apps/details?id=com.britariproperties.mybritari&hl=en';
const IOS_URL  = 'https://apps.apple.com/ng/app/mybritari/id6763293989';

export default function GetTheApp() {
  return (
    <div className="min-h-screen w-full bg-navy flex items-center justify-center px-6 py-12">
      <div className="w-full" style={{ maxWidth: 430 }}>
        {/* Logo */}
        <div className="flex items-center gap-3 mb-10">
          <div className="w-11 h-11 rounded-xl bg-red flex items-center justify-center">
            <span className="text-white font-900 text-lg">B</span>
          </div>
          <div>
            <div className="text-white font-900 text-sm tracking-widest">BRITARI</div>
            <div className="text-white/60 font-700 text-[9px] tracking-[2px] mt-0.5">PROPERTIES</div>
          </div>
        </div>

        {/* Headline */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-7 h-0.5 bg-red" />
          <span className="text-red font-800 text-[11px] tracking-[2.5px]">NOW ON MOBILE</span>
        </div>
        <h1
          className="text-white font-900 mb-4"
          style={{ fontSize: 40, lineHeight: 1.15, letterSpacing: -1 }}
        >
          We&apos;ve moved{'\n'}to the app.
        </h1>
        <p className="text-white/70 text-[15px] leading-6 mb-9">
          The MyBritari web portal has retired. Manage your investments, payments and
          documents on our mobile app — download it free below.
        </p>

        {/* Store buttons */}
        <div className="flex flex-col gap-3">
          <a
            href={PLAY_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between w-full bg-red text-white font-800 text-base px-6 py-[18px] rounded-2xl active:opacity-85"
          >
            <span>Get it on Google Play</span>
            <span className="text-xl">→</span>
          </a>
          <a
            href={IOS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between w-full text-white font-700 text-base px-6 py-[18px] rounded-2xl border border-white/30 active:opacity-85"
          >
            <span>Download on the App Store</span>
            <span className="text-xl">→</span>
          </a>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-center gap-4 mt-8">
          <div className="flex items-center gap-1.5">
            <span className="text-green-400 text-xs">✓</span>
            <span className="text-white/50 text-xs">Verified Properties</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-green-400 text-xs">✓</span>
            <span className="text-white/50 text-xs">Secure Payments</span>
          </div>
        </div>
        <p className="text-white/40 text-xs text-center mt-6">
          Need help? britariproperties@gmail.com for support
        </p>
      </div>
    </div>
  );
}
