import React from 'react';

const GradientOrbs: React.FC = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Forest mist layer */}
      <div
        className="absolute w-96 h-96 bg-gradient-to-br from-emerald-900/35 to-lime-900/25 rounded-full mix-blend-multiply filter blur-3xl opacity-35 animate-float"
        style={{ top: '-10%', left: '-5%', animationDelay: '0s' }}
      />
      
      {/* Canopy shadow layer */}
      <div
        className="absolute w-80 h-80 bg-gradient-to-br from-green-900/35 to-emerald-800/25 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-float"
        style={{ top: '10%', right: '-5%', animationDelay: '2s' }}
      />
      
      {/* Warm earth highlight */}
      <div
        className="absolute w-72 h-72 bg-gradient-to-br from-amber-200/35 to-stone-300/25 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-float"
        style={{ top: '40%', left: '5%', animationDelay: '1s' }}
      />
      
      {/* Mid-depth foliage haze */}
      <div
        className="absolute w-64 h-64 bg-gradient-to-br from-emerald-800/30 to-olive-700/25 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-float"
        style={{ top: '50%', right: '10%', animationDelay: '3s' }}
      />
      
      {/* Ground depth layer */}
      <div
        className="absolute w-56 h-56 bg-gradient-to-br from-stone-600/30 to-amber-800/20 rounded-full mix-blend-multiply filter blur-3xl opacity-25 animate-float"
        style={{ bottom: '10%', left: '20%', animationDelay: '1.5s' }}
      />
      
      {/* Fresh air light pocket */}
      <div
        className="absolute w-60 h-60 bg-gradient-to-br from-lime-100/35 to-stone-100/25 rounded-full mix-blend-multiply filter blur-3xl opacity-25 animate-float"
        style={{ bottom: '-5%', right: '15%', animationDelay: '2.5s' }}
      />
    </div>
  );
};

export default GradientOrbs;
