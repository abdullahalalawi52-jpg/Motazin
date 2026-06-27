import React, { memo } from 'react';

export const MotazinLogo = memo(({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" fill="none" strokeLinecap="round" strokeLinejoin="round" className={`stroke-[url(#motazin-gradient-light)] dark:stroke-[url(#motazin-gradient-dark)] ${className || ''}`}>
    <defs>
      {/* Dark Mode Gradients (Bright/Neon) */}
      <linearGradient id="motazin-gradient-dark" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#22d3ee" /> {/* Cyan 400 */}
        <stop offset="50%" stopColor="#818cf8" /> {/* Indigo 400 */}
        <stop offset="100%" stopColor="#c084fc" /> {/* Purple 400 */}
      </linearGradient>
      <linearGradient id="motazin-highlight-dark" x1="0%" y1="100%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#67e8f9" />
        <stop offset="100%" stopColor="#d8b4fe" />
      </linearGradient>

      {/* Light Mode Gradients (Rich/Dark for high contrast) */}
      <linearGradient id="motazin-gradient-light" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#0891b2" /> {/* Cyan 600 */}
        <stop offset="50%" stopColor="#4f46e5" /> {/* Indigo 600 */}
        <stop offset="100%" stopColor="#9333ea" /> {/* Purple 600 */}
      </linearGradient>
      <linearGradient id="motazin-highlight-light" x1="0%" y1="100%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#0e7490" /> {/* Cyan 700 */}
        <stop offset="100%" stopColor="#7e22ce" /> {/* Purple 700 */}
      </linearGradient>

      <filter id="glow">
        <feGaussianBlur stdDeviation="0.6" result="coloredBlur"/>
        <feMerge>
          <feMergeNode in="coloredBlur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
    </defs>

    {/* SCALE (Background) */}
    {/* Base and pole */}
    <path d="M10 28h12" strokeWidth="1.5" opacity="0.8" className="stroke-[url(#motazin-gradient-light)] dark:stroke-[url(#motazin-gradient-dark)]" />
    <path d="M16 26v2" strokeWidth="1.5" opacity="0.8" className="stroke-[url(#motazin-gradient-light)] dark:stroke-[url(#motazin-gradient-dark)]" />

    {/* Decorative Top Pivot */}
    <path d="M14.5 5 L17.5 5 M16 5 L16 4" strokeWidth="1" className="stroke-[url(#motazin-gradient-light)] dark:stroke-[url(#motazin-gradient-dark)]" strokeLinecap="round" />
    <circle cx="16" cy="3" r="1" strokeWidth="1.2" className="stroke-[url(#motazin-gradient-light)] dark:stroke-[url(#motazin-gradient-dark)]" fill="none" />
    <path d="M16 2 L16 1" strokeWidth="1" className="stroke-[url(#motazin-gradient-light)] dark:stroke-[url(#motazin-gradient-dark)]" strokeLinecap="round" />
    <circle cx="16" cy="0.5" r="0.5" className="fill-[url(#motazin-gradient-light)] dark:fill-[url(#motazin-gradient-dark)]" stroke="none" />

    {/* Curved Arms (The Beam) */}
    <path d="M 15 3 C 11 4.5, 7 2, 4 6" strokeWidth="1.5" className="stroke-[url(#motazin-gradient-light)] dark:stroke-[url(#motazin-gradient-dark)]" fill="none" strokeLinecap="round" />
    <path d="M 17 3 C 21 4.5, 25 2, 28 6" strokeWidth="1.5" className="stroke-[url(#motazin-gradient-light)] dark:stroke-[url(#motazin-gradient-dark)]" fill="none" strokeLinecap="round" />

    {/* Left Bowl */}
    {/* Strings hanging from the classic beam */}
    <path d="M4 6 L1 18 M4 6 L7 18" strokeWidth="1" className="stroke-[url(#motazin-gradient-light)] dark:stroke-[url(#motazin-gradient-dark)]" fill="none" opacity="0.7" />
    {/* Solid Pan */}
    <path d="M1 18 c 0 3.5, 6 3.5, 6 0 z" className="fill-[url(#motazin-gradient-light)] dark:fill-[url(#motazin-gradient-dark)]" stroke="none" opacity="0.85" />
    <path d="M1 18 c 1.5 1, 4.5 1, 6 0" strokeWidth="0.8" className="stroke-white dark:stroke-[#080c14]" fill="none" opacity="0.5" />
    
    {/* Right Bowl */}
    {/* Strings hanging from the classic beam */}
    <path d="M28 6 L25 18 M28 6 L31 18" strokeWidth="1" className="stroke-[url(#motazin-gradient-light)] dark:stroke-[url(#motazin-gradient-dark)]" fill="none" opacity="0.7" />
    {/* Solid Pan */}
    <path d="M25 18 c 0 3.5, 6 3.5, 6 0 z" className="fill-[url(#motazin-gradient-light)] dark:fill-[url(#motazin-gradient-dark)]" stroke="none" opacity="0.85" />
    <path d="M25 18 c 1.5 1, 4.5 1, 6 0" strokeWidth="0.8" className="stroke-white dark:stroke-[#080c14]" fill="none" opacity="0.5" />

    {/* CALCULATOR (Foreground) */}
    <g transform="translate(9, 5)" filter="url(#glow)">
      {/* Body */}
      <rect width="14" height="21" rx="3" className="fill-white dark:fill-[#080c14] stroke-[url(#motazin-highlight-light)] dark:stroke-[url(#motazin-highlight-dark)]" strokeWidth="1.2" />
      
      {/* Inner bezel */}
      <rect width="12" height="19" x="1" y="1" rx="2" strokeWidth="0.5" opacity="0.6" />
      
      {/* Screen */}
      <rect width="10" height="5" x="2" y="2" rx="1.5" className="fill-[url(#motazin-gradient-light)] dark:fill-[url(#motazin-gradient-dark)] stroke-[url(#motazin-highlight-light)] dark:stroke-[url(#motazin-highlight-dark)]" opacity="0.15" strokeWidth="0.8" />
      <path d="M4 4.5h3 M9 4.5h1" strokeWidth="1" className="stroke-[url(#motazin-highlight-light)] dark:stroke-[url(#motazin-highlight-dark)]" />
      
      {/* Buttons */}
      <g className="fill-[url(#motazin-gradient-light)] dark:fill-[url(#motazin-gradient-dark)]" opacity="0.9" stroke="none">
        <rect width="2.5" height="2" x="2" y="8.5" rx="0.5" />
        <rect width="2.5" height="2" x="5.75" y="8.5" rx="0.5" />
        <rect width="2.5" height="2" x="9.5" y="8.5" rx="0.5" />
        
        <rect width="2.5" height="2" x="2" y="11.5" rx="0.5" />
        <rect width="2.5" height="2" x="5.75" y="11.5" rx="0.5" />
        <rect width="2.5" height="2" x="9.5" y="11.5" rx="0.5" />
        
        <rect width="2.5" height="2" x="2" y="14.5" rx="0.5" />
        <rect width="2.5" height="2" x="5.75" y="14.5" rx="0.5" />
        <rect width="2.5" height="5" x="9.5" y="14.5" rx="0.5" className="fill-[url(#motazin-highlight-light)] dark:fill-[url(#motazin-highlight-dark)]" opacity="1" />
        
        <rect width="6.25" height="2" x="2" y="17.5" rx="0.5" />
      </g>
    </g>
  </svg>
));
