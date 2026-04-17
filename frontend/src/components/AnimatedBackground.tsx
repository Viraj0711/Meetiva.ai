import React from 'react';

const AnimatedBackground: React.FC = () => {
  return (
    <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 0 }} aria-hidden="true">
      <div className="absolute inset-0 bg-[#eef2e7]" />

      <div
        className="absolute -top-20 left-[-8%] h-[34rem] w-[34rem] rounded-full blur-3xl"
        style={{ background: 'rgba(42, 74, 56, 0.18)' }}
      />
      <div
        className="absolute top-[12%] right-[-10%] h-[30rem] w-[30rem] rounded-full blur-3xl"
        style={{ background: 'rgba(86, 112, 82, 0.16)' }}
      />
      <div
        className="absolute bottom-[-10%] left-[10%] h-[28rem] w-[28rem] rounded-full blur-3xl"
        style={{ background: 'rgba(129, 106, 77, 0.12)' }}
      />

      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(1200px 520px at 50% 100%, rgba(42, 74, 56, 0.14), transparent 72%), radial-gradient(900px 380px at 50% 0%, rgba(255, 255, 255, 0.36), transparent 70%)',
        }}
      />
    </div>
  );
};

export default AnimatedBackground;
