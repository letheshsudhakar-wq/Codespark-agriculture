import React from 'react';

export const FarmHeroIllustration = () => {
  return (
    <div style={{ width: '100%', maxWidth: '320px', margin: '0 auto', display: 'flex', justifyContent: 'center' }}>
      <svg viewBox="0 0 340 260" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: 'auto' }}>
        <defs>
          <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#EAF8DC" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#F8FAF5" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="sunGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#B8F52A" />
            <stop offset="100%" stopColor="#E8D21D" />
          </linearGradient>
          <linearGradient id="hill1" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#A8E424" />
            <stop offset="100%" stopColor="#075C28" />
          </linearGradient>
          <linearGradient id="hill2" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1E823E" />
            <stop offset="100%" stopColor="#0B451E" />
          </linearGradient>
          <linearGradient id="soilLayer" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#4E3629" />
            <stop offset="100%" stopColor="#2A1B14" />
          </linearGradient>
        </defs>

        {/* Sky Background circle */}
        <circle cx="170" cy="130" r="115" fill="url(#skyGrad)" />

        {/* Morning Sun */}
        <circle cx="230" cy="80" r="28" fill="url(#sunGrad)" opacity="0.9" />

        {/* Distant Hills */}
        <path d="M40 180 Q100 130 180 160 T320 170 L320 220 L40 220 Z" fill="url(#hill2)" opacity="0.6" />
        <path d="M20 190 Q90 145 160 175 T320 185 L320 220 L20 220 Z" fill="url(#hill1)" opacity="0.85" />

        {/* Lush Crop Rows */}
        <path d="M20 205 Q90 185 170 190 T320 200 L320 230 L20 230 Z" fill="#075C28" />
        
        {/* Soil Base Layer */}
        <path d="M15 220 Q170 215 325 220 L325 250 L15 250 Z" fill="url(#soilLayer)" />

        {/* Sprouting Crop Sprigs */}
        <g stroke="#B8F52A" strokeWidth="2.5" strokeLinecap="round">
          <path d="M60 210 Q65 190 70 180" />
          <path d="M70 180 Q62 175 58 182" fill="#B8F52A" />
          <path d="M70 180 Q78 175 82 182" fill="#B8F52A" />

          <path d="M100 210 Q105 185 110 175" />
          <path d="M110 175 Q102 170 98 177" fill="#B8F52A" />
          <path d="M110 175 Q118 170 122 177" fill="#B8F52A" />

          <path d="M240 212 Q245 190 250 180" />
          <path d="M250 180 Q242 175 238 182" fill="#B8F52A" />
          <path d="M250 180 Q258 175 262 182" fill="#B8F52A" />
        </g>

        {/* Friendly Farmer Figure */}
        <g transform="translate(145, 115)">
          {/* Shadow */}
          <ellipse cx="25" cy="100" rx="20" ry="5" fill="#052E13" opacity="0.4" />
          
          {/* Traditional Hat / Pagri */}
          <path d="M15 25 C15 15, 35 15, 35 25 Z" fill="#FFFFFF" />
          <path d="M12 25 Q25 22 38 25 Q25 28 12 25 Z" fill="#B8F52A" />

          {/* Face */}
          <circle cx="25" cy="30" r="8" fill="#E0A96D" />
          
          {/* Kurta Body */}
          <path d="M16 38 L34 38 L37 72 L13 72 Z" fill="#FFFFFF" stroke="#075C28" strokeWidth="1" />
          
          {/* Sleeves / Arms with Tablet/Plant */}
          <path d="M16 42 L8 56 L15 58" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" />
          <path d="M34 42 L42 54 L34 60" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" />
          
          {/* Smart Device / Soil Scanner in Hand */}
          <rect x="33" y="52" width="10" height="15" rx="2" fill="#171632" />
          <circle cx="38" cy="59" r="2" fill="#B8F52A" />

          {/* Dhoti / Pants */}
          <path d="M15 72 L18 96 L23 96 L24 76 L26 76 L27 96 L32 96 L35 72 Z" fill="#EAF8DC" />
        </g>

        {/* Smart Soil Sensor Pin */}
        <g transform="translate(265, 175)">
          <path d="M12 0 C5.37 0 0 5.37 0 12 C0 21 12 34 12 34 C12 34 24 21 24 12 C24 5.37 18.63 0 12 0 Z" fill="#171632" />
          <circle cx="12" cy="12" r="7" fill="#B8F52A" />
          <path d="M12 8 L12 16 M8 12 L16 12" stroke="#171632" strokeWidth="1.8" strokeLinecap="round" />
        </g>
      </svg>
    </div>
  );
};

