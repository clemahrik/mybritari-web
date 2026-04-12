import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

const DEFAULT_SLIDES = [
  {
    img:     'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&q=80',
    eyebrow: 'LAND OWNERSHIP',
    title:   'Own Land\nIn Nigeria.',
    sub:     'Premium 200sqm plots starting from ₦2,000,000',
  },
  {
    img:     'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200&q=80',
    eyebrow: 'FLEXIBLE PAYMENT',
    title:   'Pay Over\n24 Months.\nZero Interest.',
    sub:     'Same total price. No hidden fees. No surprises.',
  },
  {
    img:     'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200&q=80',
    eyebrow: 'SECURE & TRUSTED',
    title:   'Your Future\nBuilt Today.',
    sub:     'Britari Properties Limited — Trusted by thousands.',
  },
];

export default function Welcome() {
  const navigate = useNavigate();
  const [slides, setSlides] = useState(DEFAULT_SLIDES);
  const [idx, setIdx]       = useState(0);
  const [fade, setFade]     = useState(true);
  const timerRef            = useRef(null);

  useEffect(() => {
    api.get('/settings').then(r => {
      const s    = r.data?.data || {};
      const imgs = [s.hero_image_1, s.hero_image_2, s.hero_image_3].filter(Boolean);
      if (imgs.length > 0) {
        setSlides(DEFAULT_SLIDES.map((sl, i) => ({ ...sl, img: imgs[i] || sl.img })));
      }
    }).catch(() => {});

    timerRef.current = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setIdx(i => (i + 1) % DEFAULT_SLIDES.length);
        setFade(true);
      }, 300);
    }, 5000);
    return () => clearInterval(timerRef.current);
  }, []);

  const slide = slides[idx];

  return (
    <div
      className="relative flex flex-col justify-between overflow-hidden bg-navy"
      style={{ maxWidth: 430, width: '100%', minHeight: '100vh' }}
    >
      {/* Background image */}
      <img
        src={slide.img}
        alt=""
        className="absolute inset-0 w-full h-full object-cover"
        style={{ transition: 'opacity 0.3s', opacity: fade ? 1 : 0 }}
      />
      {/* Navy overlay */}
      <div className="absolute inset-0" style={{ background: 'rgba(11,31,58,0.72)' }} />

      {/* Content */}
      <div className="relative z-10 flex flex-col justify-between h-full px-7 py-14" style={{ minHeight: '100vh' }}>
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-red flex items-center justify-center">
            <span className="text-white font-900 text-lg">B</span>
          </div>
          <div>
            <div className="text-white font-900 text-sm tracking-widest">BRITARI</div>
            <div className="text-white/60 font-700 text-[9px] tracking-[2px] mt-0.5">PROPERTIES</div>
          </div>
        </div>

        {/* Slide text */}
        <div style={{ opacity: fade ? 1 : 0, transition: 'opacity 0.3s' }}>
          <div className="flex items-center gap-3 mb-5">
            <div className="w-7 h-0.5 bg-red" />
            <span className="text-red font-800 text-[11px] tracking-[2.5px]">{slide.eyebrow}</span>
          </div>
          <h1
            className="text-white font-900 mb-4"
            style={{ fontSize: 46, lineHeight: 1.13, letterSpacing: -1, whiteSpace: 'pre-line' }}
          >
            {slide.title}
          </h1>
          <p className="text-white/70 text-[15px] leading-6 mb-8">{slide.sub}</p>

          {/* Dots */}
          <div className="flex items-center gap-2">
            {DEFAULT_SLIDES.map((_, i) => (
              <div
                key={i}
                className="h-0.5 rounded-full transition-all duration-300"
                style={{
                  width:           i === idx ? 32 : 12,
                  backgroundColor: i === idx ? '#C8102E' : 'rgba(255,255,255,0.25)',
                }}
              />
            ))}
          </div>
        </div>

        {/* Buttons */}
        <div className="flex flex-col gap-3">
          <button
            onClick={() => navigate('/register')}
            className="flex items-center justify-between w-full bg-red text-white font-800 text-base px-6 py-[18px] rounded-2xl active:opacity-85"
          >
            <span>Create Account</span>
            <span className="text-xl">→</span>
          </button>
          <button
            onClick={() => navigate('/login')}
            className="w-full text-white font-600 text-[15px] py-4 rounded-2xl border border-white/30 active:opacity-85"
          >
            I already have an account
          </button>

          {/* Trust badges */}
          <div className="flex items-center justify-center gap-4 mt-2">
            <div className="flex items-center gap-1.5">
              <span className="text-green-400 text-xs">✓</span>
              <span className="text-white/50 text-xs">Verified Properties</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-green-400 text-xs">✓</span>
              <span className="text-white/50 text-xs">Secure Payments</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
