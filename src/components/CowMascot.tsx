import React from 'react';

interface CowMascotProps {
  variant?: 'hero' | 'signin' | 'compact' | 'badge';
  className?: string;
  showGrass?: boolean;
  showMilkDrop?: boolean;
}

export default function CowMascot({
  variant = 'hero',
  className = '',
  showGrass = true,
  showMilkDrop = true,
}: CowMascotProps) {
  if (variant === 'compact') {
    return (
      <div className={`relative inline-block select-none ${className}`} aria-hidden="true">
        <svg
          viewBox="0 0 100 80"
          className="w-12 h-10 overflow-visible"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Compact Tail */}
          <g className="animate-cow-tail origin-[24px_38px]">
            <path
              d="M24 38 C 16 38, 12 48, 14 56"
              stroke="#26352B"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            <circle cx="14" cy="56" r="3" fill="#26352B" />
          </g>

          {/* Legs */}
          <path d="M34 52 L34 70" stroke="#26352B" strokeWidth="4" strokeLinecap="round" className="animate-cow-leg-1" />
          <path d="M44 52 L44 70" stroke="#26352B" strokeWidth="4" strokeLinecap="round" className="animate-cow-leg-2" />
          <path d="M60 52 L60 70" stroke="#26352B" strokeWidth="4" strokeLinecap="round" className="animate-cow-leg-1" />
          <path d="M70 52 L70 70" stroke="#26352B" strokeWidth="4" strokeLinecap="round" className="animate-cow-leg-2" />

          {/* Body */}
          <rect x="24" y="28" width="54" height="28" rx="14" fill="#FFFFFF" stroke="#DCE9D5" strokeWidth="1.5" />
          {/* Spots */}
          <path d="M38 28 C38 36, 48 38, 50 32 C52 28, 44 28, 38 28 Z" fill="#26352B" />
          <circle cx="62" cy="42" r="6" fill="#26352B" />

          {/* Head */}
          <g className="animate-cow-head origin-[74px_30px]">
            <rect x="68" y="16" width="22" height="22" rx="9" fill="#FFFFFF" stroke="#DCE9D5" strokeWidth="1.5" />
            {/* Horns */}
            <path d="M72 16 Q 70 10 74 9" stroke="#E5D6A7" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M84 16 Q 86 10 82 9" stroke="#E5D6A7" strokeWidth="2.5" strokeLinecap="round" />
            {/* Ears */}
            <ellipse cx="66" cy="22" rx="4" ry="2" fill="#FFFFFF" stroke="#DCE9D5" strokeWidth="1" transform="rotate(-15 66 22)" />
            <ellipse cx="92" cy="22" rx="4" ry="2" fill="#FFFFFF" stroke="#DCE9D5" strokeWidth="1" transform="rotate(15 92 22)" />
            {/* Eyes */}
            <circle cx="75" cy="24" r="1.5" fill="#26352B" />
            <circle cx="83" cy="24" r="1.5" fill="#26352B" />
            {/* Pink Muzzle */}
            <ellipse cx="79" cy="32" rx="8" ry="5" fill="#FCE7F3" />
            <circle cx="76" cy="32" r="0.8" fill="#DB2777" />
            <circle cx="82" cy="32" r="0.8" fill="#DB2777" />
          </g>
        </svg>
      </div>
    );
  }

  return (
    <div
      className={`relative inline-flex flex-col items-center select-none ${className}`}
      role="img"
      aria-label="Friendly PureDrop Dairy cow mascot"
    >
      {/* Floating milk-drop decoration */}
      {showMilkDrop && (
        <div className="absolute -top-3 right-6 pointer-events-none animate-milk-drop z-10">
          <svg width="22" height="26" viewBox="0 0 22 26" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M11 2 C 11 2, 2 13, 2 18 C 2 22.4 6 24 11 24 C 16 24 20 22.4 20 18 C 20 13, 11 2, 11 2 Z"
              fill="#FFFFFF"
              stroke="#DCE9D5"
              strokeWidth="1.5"
            />
            {/* Subtle gloss */}
            <path
              d="M7 16 C 7 14, 9 12, 12 11"
              stroke="#EAF4E5"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
          </svg>
        </div>
      )}

      {/* Main Vector Cow Illustration */}
      <svg
        viewBox="0 0 170 125"
        className="w-full h-auto max-w-[200px] overflow-visible"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="grassGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#397548" />
            <stop offset="100%" stopColor="#2E5E3A" />
          </linearGradient>
          <filter id="cowShadow" x="-10%" y="-10%" width="120%" height="130%" filterUnits="userSpaceOnUse">
            <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#26352B" floodOpacity="0.08" />
          </filter>
        </defs>

        {/* Ground shadow beneath hooves */}
        <ellipse cx="85" cy="112" rx="55" ry="5" fill="#EAF4E5" />

        {/* Cow Tail (Layered behind back leg) */}
        <g className="animate-cow-tail origin-[36px_58px]">
          <path
            d="M36 58 C 24 60, 18 72, 22 86 C 23 89, 25 92, 25 94"
            stroke="#26352B"
            strokeWidth="3.5"
            strokeLinecap="round"
          />
          {/* Fluffy tail tuft */}
          <path
            d="M23 93 C 20 95, 18 100, 24 104 C 28 102, 28 97, 26 93 Z"
            fill="#26352B"
          />
        </g>

        {/* Rear Legs */}
        <g className="animate-cow-leg-1 origin-[48px_72px]">
          {/* Rear Leg 1 (Far side) */}
          <path
            d="M48 72 L 48 108"
            stroke="#DCE9D5"
            strokeWidth="7"
            strokeLinecap="round"
          />
          {/* Hoof */}
          <path d="M44 105 L 52 105 L 52 109 L 44 109 Z" fill="#26352B" rx="1" />
        </g>

        <g className="animate-cow-leg-2 origin-[108px_72px]">
          {/* Front Leg 1 (Far side) */}
          <path
            d="M108 72 L 108 108"
            stroke="#DCE9D5"
            strokeWidth="7"
            strokeLinecap="round"
          />
          {/* Hoof */}
          <path d="M104 105 L 112 105 L 112 109 L 104 109 Z" fill="#26352B" rx="1" />
        </g>

        {/* Subtle Pink Udder */}
        <ellipse cx="56" cy="74" rx="8" ry="6" fill="#FCE7F3" stroke="#FBCFE8" strokeWidth="1" />
        <circle cx="53" cy="79" r="1.5" fill="#F472B6" />
        <circle cx="58" cy="79" r="1.5" fill="#F472B6" />

        {/* Cow Body (Plump, friendly rounded rectangle) */}
        <g filter="url(#cowShadow)">
          <rect
            x="34"
            y="42"
            width="82"
            height="44"
            rx="20"
            fill="#FFFFFF"
            stroke="#DCE9D5"
            strokeWidth="2"
          />
          {/* Distinctive organic dairy spots */}
          <path
            d="M52 42 C 54 54, 70 56, 74 46 C 76 42, 64 42, 52 42 Z"
            fill="#26352B"
          />
          <path
            d="M86 52 C 84 62, 98 68, 102 58 C 104 50, 94 48, 86 52 Z"
            fill="#26352B"
          />
          <ellipse cx="45" cy="68" rx="7" ry="5" fill="#26352B" />
        </g>

        {/* Near Legs (In front of body) */}
        <g className="animate-cow-leg-2 origin-[56px_72px]">
          {/* Rear Leg 2 (Near) */}
          <path
            d="M56 72 L 56 109"
            stroke="#FFFFFF"
            strokeWidth="7"
            strokeLinecap="round"
          />
          <path
            d="M56 72 L 56 109"
            stroke="#26352B"
            strokeWidth="7"
            strokeLinecap="round"
            strokeDasharray="20 40"
          />
          <path d="M52 106 L 60 106 L 60 110 L 52 110 Z" fill="#26352B" rx="1" />
        </g>

        <g className="animate-cow-leg-1 origin-[116px_72px]">
          {/* Front Leg 2 (Near) */}
          <path
            d="M116 72 L 116 109"
            stroke="#FFFFFF"
            strokeWidth="7"
            strokeLinecap="round"
          />
          <path d="M112 106 L 120 106 L 120 110 L 112 110 Z" fill="#26352B" rx="1" />
        </g>

        {/* Head & Neck Assembly */}
        <g className="animate-cow-head origin-[112px_48px]">
          {/* Neck */}
          <path d="M100 48 L 116 34 L 124 50 L 106 62 Z" fill="#FFFFFF" />

          {/* Green Collar with Golden Bell */}
          <path d="M108 42 L 120 54" stroke="#397548" strokeWidth="4" strokeLinecap="round" />
          <g className="animate-cow-bell origin-[116px_52px]">
            <circle cx="116" cy="54" r="4.5" fill="#F59E0B" stroke="#D97706" strokeWidth="1" />
            <circle cx="116" cy="56" r="1.5" fill="#92400E" />
          </g>

          {/* Head Base */}
          <rect
            x="108"
            y="20"
            width="34"
            height="34"
            rx="14"
            fill="#FFFFFF"
            stroke="#DCE9D5"
            strokeWidth="2"
          />
          {/* Head Patch over eye */}
          <path
            d="M124 20 C 126 28, 138 32, 142 26 C 142 20, 132 20, 124 20 Z"
            fill="#26352B"
          />

          {/* Gentle Horns */}
          <path
            d="M116 20 C 114 12, 110 10, 114 8 C 118 10, 119 15, 118 20"
            fill="#FDE68A"
            stroke="#D97706"
            strokeWidth="1"
            strokeLinecap="round"
          />
          <path
            d="M134 20 C 136 12, 140 10, 136 8 C 132 10, 131 15, 132 20"
            fill="#FDE68A"
            stroke="#D97706"
            strokeWidth="1"
            strokeLinecap="round"
          />

          {/* Cute Floppy Ears */}
          <g>
            <ellipse cx="106" cy="28" rx="6" ry="3.5" fill="#FFFFFF" stroke="#DCE9D5" strokeWidth="1.5" transform="rotate(-20 106 28)" />
            <ellipse cx="106" cy="28" rx="3.5" ry="2" fill="#FCE7F3" transform="rotate(-20 106 28)" />

            <ellipse cx="144" cy="28" rx="6" ry="3.5" fill="#FFFFFF" stroke="#DCE9D5" strokeWidth="1.5" transform="rotate(20 144 28)" />
            <ellipse cx="144" cy="28" rx="3.5" ry="2" fill="#FCE7F3" transform="rotate(20 144 28)" />
          </g>

          {/* Sweet Eyes with sparkle */}
          <g>
            <circle cx="118" cy="32" r="2.5" fill="#26352B" />
            <circle cx="117.2" cy="31.2" r="0.9" fill="#FFFFFF" />

            <circle cx="132" cy="32" r="2.5" fill="#26352B" />
            <circle cx="131.2" cy="31.2" r="0.9" fill="#FFFFFF" />
          </g>

          {/* Pink Chewing Muzzle */}
          <g className="animate-cow-chew">
            <rect
              x="112"
              y="40"
              width="26"
              height="16"
              rx="8"
              fill="#FCE7F3"
              stroke="#FBCFE8"
              strokeWidth="1.5"
            />
            {/* Nostrils */}
            <ellipse cx="120" cy="46" rx="1.5" ry="2" fill="#DB2777" />
            <ellipse cx="130" cy="46" rx="1.5" ry="2" fill="#DB2777" />
            {/* Gentle Smile */}
            <path
              d="M122 51 Q 125 53 128 51"
              stroke="#DB2777"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </g>
        </g>

        {/* Fresh grass / clover blades beneath the feet */}
        {showGrass && (
          <g className="animate-grass">
            {/* Left clump */}
            <path d="M40 110 Q 36 102 32 101 Q 38 106 42 110" fill="url(#grassGrad)" />
            <path d="M43 111 Q 44 100 48 98 Q 47 105 45 111" fill="url(#grassGrad)" />
            <path d="M45 112 Q 50 104 55 103 Q 51 108 47 112" fill="url(#grassGrad)" />

            {/* Center clover */}
            <circle cx="82" cy="107" r="2.5" fill="#397548" />
            <circle cx="85" cy="105" r="2.5" fill="#397548" />
            <circle cx="87" cy="108" r="2.5" fill="#397548" />

            {/* Right clump */}
            <path d="M102 111 Q 98 103 94 102 Q 100 107 104 111" fill="url(#grassGrad)" />
            <path d="M118 111 Q 120 101 125 99 Q 122 106 119 111" fill="url(#grassGrad)" />
            <path d="M122 112 Q 128 105 134 105 Q 129 109 124 112" fill="url(#grassGrad)" />
          </g>
        )}
      </svg>
    </div>
  );
}
