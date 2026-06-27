import React from 'react';
import { cn } from '../utils/cn';

export const Confetti: React.FC = () => {
  const colors = ['bg-indigo-500', 'bg-emerald-500', 'bg-rose-500', 'bg-amber-500', 'bg-purple-500', 'bg-sky-500'];
  return (
    <div className="fixed inset-0 pointer-events-none z-[999] overflow-hidden">
      {Array.from({ length: 45 }).map((_, i) => {
        const size = Math.random() * 8 + 6;
        const left = Math.random() * 100;
        const color = colors[Math.floor(Math.random() * colors.length)];
        const delay = Math.random() * 3;
        const duration = Math.random() * 2 + 3;
        const rotationSpeed = Math.random() * 720 - 360;
        return (
          <div
            key={i}
            className={cn("absolute rounded-sm opacity-90 animate-confetti-fall", color)}
            style={{
              width: `${size}px`,
              height: `${size * 1.5}px`,
              left: `${left}%`,
              top: `-20px`,
              animationDelay: `${delay}s`,
              animationDuration: `${duration}s`,
              transform: `rotate(${Math.random() * 360}deg)`,
              '--rotation-deg': `${rotationSpeed}deg`,
            } as React.CSSProperties}
          />
        );
      })}
    </div>
  );
};
