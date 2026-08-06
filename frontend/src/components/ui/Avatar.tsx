import React from 'react';

const GRAD = '#5B3FD6';

type AvatarSize = 'xs' | 'sm' | 'md';

const sizeMap: Record<AvatarSize, string> = {
  xs: 'w-6 h-6 text-[10px]',
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
};

interface AvatarProps {
  name: string;
  size?: AvatarSize;
  bg?: string;
}

export const Avatar: React.FC<AvatarProps> = ({ name, size = 'md', bg }) => {
  const initials = name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();
  return (
    <div
      className={`${sizeMap[size]} rounded-full flex items-center justify-center font-bold text-white flex-shrink-0`}
      style={{ background: bg ?? GRAD }}
    >
      {initials}
    </div>
  );
};
