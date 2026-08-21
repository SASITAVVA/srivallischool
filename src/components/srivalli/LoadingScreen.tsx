'use client';

import { useState, useEffect } from 'react';

interface LoadingScreenProps {
  onComplete: () => void;
}

export function LoadingScreen({ onComplete }: LoadingScreenProps) {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 200);   // book opens
    const t2 = setTimeout(() => setPhase(2), 700);   // lightbulb glows
    const t3 = setTimeout(() => setPhase(3), 1100);  // stars & text appear
    const t4 = setTimeout(() => {
      setPhase(4); // fade out
      setTimeout(onComplete, 400);
    }, 1600);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); };
  }, [onComplete]);

  return (
    <div
      className={`fixed inset-0 z-[9999] flex items-center justify-center transition-opacity duration-400 ${phase >= 4 ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
      style={{ background: 'linear-gradient(135deg, #fce4ec 0%, #e1bee7 30%, #fff3e0 70%, #fce4ec 100%)' }}
    >
      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {['A', 'B', 'C', '✨', '✏️', '📖', '⭐', '💡', '🎤'].map((item, i) => (
          <span
            key={i}
            aria-hidden="true"
            className="absolute text-lg md:text-xl font-bold"
            style={{
              left: `${10 + (i * 10) % 80}%`,
              top: `${15 + (i * 13) % 70}%`,
              opacity: phase >= 2 ? 0.7 : 0,
              transform: phase >= 2 ? 'translateY(0) rotate(0deg)' : 'translateY(20px) rotate(15deg)',
              transition: `all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) ${i * 0.08}s`,
              color: ['#880e4f', '#4a148c', '#bf360c', '#FFD600', '#4CAF50', '#2196F3', '#E91E63', '#FF9800', '#9C27B0'][i],
            }}
          >
            {item}
          </span>
        ))}
      </div>

      <div className="relative flex flex-col items-center">
        {/* Book + Lightbulb Animation */}
        <div className="relative w-28 h-28 md:w-36 md:h-36 mb-6">
          {/* Book */}
          <svg
            aria-hidden="true"
            viewBox="0 0 120 120"
            className={`w-full h-full transition-all duration-700 ${phase >= 1 ? 'scale-100 opacity-100' : 'scale-50 opacity-0'}`}
            style={{ transformOrigin: 'center' }}
          >
            {/* Left page */}
            <path
              d="M60 20 C40 20 20 25 15 30 L15 90 C20 85 40 80 60 80 Z"
              fill="white" stroke="#9C27B0" strokeWidth="2.5"
              className="transition-all duration-700"
              style={{
                transform: phase >= 1 ? 'rotateY(0deg)' : 'rotateY(90deg)',
                transformOrigin: 'right center',
              }}
            />
            {/* Right page */}
            <path
              d="M60 20 C80 20 100 25 105 30 L105 90 C100 85 80 80 60 80 Z"
              fill="white" stroke="#E91E63" strokeWidth="2.5"
              className="transition-all duration-700"
              style={{
                transform: phase >= 1 ? 'rotateY(0deg)' : 'rotateY(-90deg)',
                transformOrigin: 'left center',
              }}
            />
            {/* Spine */}
            <line x1="60" y1="20" x2="60" y2="80" stroke="#7B1FA2" strokeWidth="3" className="transition-all duration-500" style={{ opacity: phase >= 1 ? 1 : 0 }} />
            {/* Lines on pages */}
            {[35, 45, 55, 65].map((y, i) => (
              <g key={i} style={{ opacity: phase >= 1 ? 0.3 : 0, transition: `opacity 0.5s ${0.5 + i * 0.1}s` }}>
                <line x1="25" y1={y} x2="52" y2={y} stroke="#9C27B0" strokeWidth="1.5" strokeLinecap="round" />
                <line x1="68" y1={y} x2="95" y2={y} stroke="#E91E63" strokeWidth="1.5" strokeLinecap="round" />
              </g>
            ))}
          </svg>

          {/* Lightbulb */}
          <div
            className={`absolute -top-2 left-1/2 -translate-x-1/2 transition-all duration-500 ${phase >= 2 ? 'opacity-100 scale-110' : 'opacity-0 scale-50'}`}
          >
            <div className={`relative ${phase >= 2 ? 'animate-pulse' : ''}`}>
              {/* Glow effect */}
              <div className="absolute inset-0 bg-yellow-300 rounded-full blur-xl opacity-40" style={{ width: '50px', height: '50px', left: '-8px', top: '-8px' }} />
              <svg aria-hidden="true" width="36" height="36" viewBox="0 0 36 36" fill="none">
                <path d="M18 2C11 2 6 7 6 13C6 17 8 20 11 22V27C11 28 12 29 13 29H23C24 29 25 28 25 27V22C28 20 30 17 30 13C30 7 25 2 18 2Z" fill="#FFD600" stroke="#FF9800" strokeWidth="1.5" />
                <rect x="13" y="29" x2="10" width="10" height="3" rx="1.5" fill="#FF9800" />
                <rect x="14" y="32" width="8" height="2" rx="1" fill="#F57C00" />
                {/* Rays */}
                {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => (
                  <line
                    key={i}
                    x1="18" y1="18"
                    x2={18 + Math.cos((angle * Math.PI) / 180) * 22}
                    y2={18 + Math.sin((angle * Math.PI) / 180) * 22}
                    stroke="#FFD600" strokeWidth="1.5" strokeLinecap="round"
                    style={{ opacity: 0.5 + (i % 2) * 0.3 }}
                  />
                ))}
              </svg>
            </div>
          </div>

          {/* Sparkle stars around */}
          {phase >= 2 && [
            { x: -40, y: -30, size: 12, delay: 0 },
            { x: 40, y: -20, size: 10, delay: 0.1 },
            { x: -45, y: 20, size: 8, delay: 0.2 },
            { x: 45, y: 25, size: 11, delay: 0.15 },
            { x: 0, y: -45, size: 9, delay: 0.25 },
          ].map((star, i) => (
            <div
              key={i}
              className="absolute"
              style={{
                left: `calc(50% + ${star.x}px)`,
                top: `calc(50% + ${star.y}px)`,
                animation: `sparkle 1.5s ease-in-out infinite ${star.delay}s`,
              }}
            >
              <svg aria-hidden="true" width={star.size} height={star.size} viewBox="0 0 24 24">
                <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" fill="#FFD600" />
              </svg>
            </div>
          ))}
        </div>

        {/* Brand text */}
        <div
          className={`text-center transition-all duration-700 ${phase >= 3 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
          style={{ transitionDelay: '0.1s' }}
        >
          <div
            className="text-3xl md:text-4xl font-extrabold tracking-tight"
            style={{
              background: 'linear-gradient(135deg, #E91E63, #9C27B0, #FF9800)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            SRIVALLI SMARTSPEAK
          </div>
          <p className="text-sm md:text-base text-gray-600 mt-2 tracking-wide font-light">
            Speak Clearly &bull; Think Creatively &bull; Shine Confidently
          </p>
        </div>

        {/* Loading bar */}
        <div
          className={`mt-6 w-48 h-1 bg-white/50 rounded-full overflow-hidden transition-all duration-500 ${phase >= 1 ? 'opacity-100 w-48' : 'opacity-0 w-0'}`}
        >
          <div
            className="h-full rounded-full"
            style={{
              background: 'linear-gradient(90deg, #E91E63, #9C27B0, #FF9800)',
              width: phase >= 3 ? '100%' : '0%',
              transition: 'width 1s cubic-bezier(0.4, 0, 0.2, 1)',
              transitionDelay: '0.3s',
            }}
          />
        </div>
      </div>

      {/* Sparkle keyframes */}
      <style jsx>{`
        @keyframes sparkle {
          0%, 100% { opacity: 0.4; transform: scale(0.8) rotate(0deg); }
          50% { opacity: 1; transform: scale(1.2) rotate(180deg); }
        }
      `}</style>
    </div>
  );
}
