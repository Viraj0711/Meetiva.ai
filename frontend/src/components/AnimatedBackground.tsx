import React from 'react';

const AnimatedBackground: React.FC = () => {
  return (
    <div className="fixed inset-0 pointer-events-none" aria-hidden="true" style={{ zIndex: 0 }}>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(124,92,255,0.18),transparent_24%),radial-gradient(circle_at_top_right,rgba(48,213,246,0.12),transparent_20%),radial-gradient(circle_at_bottom_center,rgba(212,175,55,0.06),transparent_28%),linear-gradient(180deg,#090d1a 0%,#0b1020 42%,#090d16 100%)]" />
      <div className="absolute inset-0 grain-overlay opacity-35" />
      <div className="absolute inset-0 fine-grid opacity-35" />

      <div className="absolute -left-40 top-[-8rem] h-[30rem] w-[30rem] rounded-full bg-gradient-to-br from-purple-500/30 via-fuchsia-500/12 to-transparent blur-3xl parallax-slow" />
      <div className="absolute right-[-8rem] top-[12%] h-[26rem] w-[26rem] rounded-full bg-gradient-to-br from-cyan-400/20 via-sky-500/10 to-transparent blur-3xl parallax-medium" />
      <div className="absolute bottom-[-10rem] left-[12%] h-[24rem] w-[24rem] rounded-full bg-gradient-to-br from-amber-300/10 via-orange-400/8 to-transparent blur-3xl parallax-fast" />
      <div className="absolute bottom-[10%] right-[18%] h-[18rem] w-[18rem] rounded-full bg-gradient-to-br from-white/12 via-white/5 to-transparent blur-3xl parallax-slow" />

      <div className="absolute inset-x-0 top-0 h-[32rem] bg-[linear-gradient(180deg,rgba(255,255,255,0.05),transparent_50%)] opacity-40" />
    </div>
  );
};

export default AnimatedBackground;
