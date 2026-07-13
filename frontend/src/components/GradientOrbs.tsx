import React from 'react';

const GradientOrbs: React.FC = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      <div className="absolute left-[-8%] top-[-12%] h-[22rem] w-[22rem] rounded-full bg-[radial-gradient(circle,rgba(124,92,255,0.28)_0%,rgba(124,92,255,0.08)_38%,transparent_70%)] blur-3xl parallax-slow" />
      <div className="absolute right-[-10%] top-[8%] h-[20rem] w-[20rem] rounded-full bg-[radial-gradient(circle,rgba(48,213,246,0.22)_0%,rgba(48,213,246,0.07)_38%,transparent_68%)] blur-3xl parallax-medium" />
      <div className="absolute bottom-[8%] left-[8%] h-[18rem] w-[18rem] rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.13)_0%,rgba(255,255,255,0.05)_34%,transparent_70%)] blur-3xl parallax-fast" />
      <div className="absolute bottom-[-8%] right-[18%] h-[24rem] w-[24rem] rounded-full bg-[radial-gradient(circle,rgba(212,175,55,0.12)_0%,rgba(212,175,55,0.05)_30%,transparent_70%)] blur-3xl parallax-slow" />
    </div>
  );
};

export default GradientOrbs;
