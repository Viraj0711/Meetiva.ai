import React from 'react';

const GradientOrbs: React.FC = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Large soft blue orb top-left */}
      <div
        className="absolute w-96 h-96 bg-gradient-to-br from-blue-200/50 to-cyan-200/40 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-float"
        style={{ top: '-10%', left: '-5%', animationDelay: '0s' }}
      />
      
      {/* Medium soft blue orb top-right */}
      <div
        className="absolute w-80 h-80 bg-gradient-to-br from-blue-200/40 to-blue-300/35 rounded-full mix-blend-multiply filter blur-3xl opacity-35 animate-float"
        style={{ top: '10%', right: '-5%', animationDelay: '2s' }}
      />
      
      {/* Soft amber accent orb middle-left */}
      <div
        className="absolute w-72 h-72 bg-gradient-to-br from-amber-100/40 to-orange-100/30 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-float"
        style={{ top: '40%', left: '5%', animationDelay: '1s' }}
      />
      
      {/* Soft cyan orb middle-right */}
      <div
        className="absolute w-64 h-64 bg-gradient-to-br from-cyan-200/40 to-sky-200/35 rounded-full mix-blend-multiply filter blur-3xl opacity-35 animate-float"
        style={{ top: '50%', right: '10%', animationDelay: '3s' }}
      />
      
      {/* Soft indigo orb bottom-left */}
      <div
        className="absolute w-56 h-56 bg-gradient-to-br from-indigo-200/40 to-blue-200/30 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-float"
        style={{ bottom: '10%', left: '20%', animationDelay: '1.5s' }}
      />
      
      {/* Soft amber accent orb bottom-right */}
      <div
        className="absolute w-60 h-60 bg-gradient-to-br from-amber-100/35 to-orange-100/25 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-float"
        style={{ bottom: '-5%', right: '15%', animationDelay: '2.5s' }}
      />
    </div>
  );
};

export default GradientOrbs;
