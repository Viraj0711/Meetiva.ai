import React from 'react';

const CARD_SHADOW = '0 1px 2px rgba(0,0,0,0.04), 0 4px 16px rgba(91,63,214,0.07), inset 0 1px 0 rgba(255,255,255,0.95)';
const CARD_SHADOW_HOVER = '0 2px 4px rgba(0,0,0,0.06), 0 12px 36px rgba(91,63,214,0.13), inset 0 1px 0 rgba(255,255,255,1)';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  padding?: boolean;
}

export const Card: React.FC<CardProps> = ({ children, className = '', onClick, padding = true }) => {
  const [hov, setHov] = React.useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => onClick && setHov(true)}
      onMouseLeave={() => setHov(false)}
      className={`bg-white rounded-3xl border overflow-hidden ${padding ? 'p-6' : ''} ${onClick ? 'cursor-pointer' : ''} ${className}`}
      style={{
        borderColor: hov ? 'rgba(91,63,214,0.3)' : '#E4E0F5',
        boxShadow: hov ? CARD_SHADOW_HOVER : CARD_SHADOW,
        transform: hov ? 'translateY(-2px)' : 'translateY(0)',
        transition: 'box-shadow 0.22s ease, transform 0.22s ease, border-color 0.22s ease',
      }}
    >
      {children}
    </div>
  );
};
