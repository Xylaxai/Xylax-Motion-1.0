import React from 'react';

// Reverted to the original SVG logo design concept
export const LogoIcon = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 200 200" className={className} xmlns="http://www.w3.org/2000/svg">
        <defs>
            <linearGradient id="logo-pink-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ff1de8" />
                <stop offset="100%" stopColor="#FF1493" />
            </linearGradient>
            <filter id="logo-glow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="3.5" result="coloredBlur" />
                <feMerge>
                    <feMergeNode in="coloredBlur" />
                    <feMergeNode in="SourceGraphic" />
                </feMerge>
            </filter>
        </defs>
        <g transform="translate(0, 10)" filter="url(#logo-glow)">
            {/* Rays */}
            <g stroke="url(#logo-pink-gradient)" strokeWidth="3" strokeLinecap="round">
                {[...Array(11)].map((_, i) => (
                    <g key={i} transform={`rotate(${(i - 5) * 18}, 100, 60)`}>
                        <line x1="100" y1="5" x2="100" y2="20" />
                        <circle cx="100" cy="0" r="3" fill="url(#logo-pink-gradient)" />
                    </g>
                ))}
            </g>

            {/* Brain */}
            <path
                d="M100 25 C 60 25, 50 55, 50 75 C 50 95, 70 115, 100 115 M100 25 C 140 25, 150 55, 150 75 C 150 95, 130 115, 100 115"
                fill="none"
                stroke="url(#logo-pink-gradient)"
                strokeWidth="5"
                strokeLinecap="round"
            />
            <line x1="100" y1="25" x2="100" y2="115" stroke="url(#logo-pink-gradient)" strokeWidth="2" />
            {/* Circuit details */}
            <circle cx="80" cy="50" r="3" fill="url(#logo-pink-gradient)" />
            <path d="M80 50 L 85 60 L 75 70" fill="none" stroke="url(#logo-pink-gradient)" strokeWidth="2" />
            <circle cx="75" cy="70" r="3" fill="url(#logo-pink-gradient)" />
            
            <circle cx="120" cy="50" r="3" fill="url(#logo-pink-gradient)" />
            <path d="M120 50 L 115 60 L 125 70" fill="none" stroke="url(#logo-pink-gradient)" strokeWidth="2" />
            <circle cx="125" cy="70" r="3" fill="url(#logo-pink-gradient)" />

            {/* Film Strip */}
            <path
                d="M 40 100 C 60 140, 140 140, 160 100 L 170 105 L 170 145 L 160 150 C 140 110, 60 110, 40 150 L 30 145 L 30 105 Z"
                fill="url(#logo-pink-gradient)"
                stroke="url(#logo-pink-gradient)"
                strokeWidth="1"
            />
            {/* Eye */}
            <circle cx="100" cy="125" r="12" fill="none" stroke="black" strokeOpacity="0.5" strokeWidth="2"/>
            <circle cx="100" cy="125" r="5" fill="black" fillOpacity="0.5"/>
            
            {/* Film strip holes */}
            {[50, 70, 130, 150].map(x => (
                <React.Fragment key={x}>
                    <rect x={x} y="107" width="10" height="5" rx="1" fill="black" fillOpacity="0.5"/>
                    <rect x={x} y="138" width="10" height="5" rx="1" fill="black" fillOpacity="0.5"/>
                </React.Fragment>
            ))}
        </g>
    </svg>
);


export const SunIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" />
  </svg>
);

export const MoonIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z" />
  </svg>
);


export const DownloadIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
  </svg>
);

export const MagicWandIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 0 0-5.78 1.128 2.25 2.25 0 0 1-2.475 2.118A2.25 2.25 0 0 1 .75 15.75c0-1.38 1.12-2.5 2.5-2.5.31 0 .62.057.908.163v-1.162c.054.02.11.033.167.042a3 3 0 0 0 5.78-1.128 2.25 2.25 0 0 1 2.475-2.118 2.25 2.25 0 0 1 2.475 2.118c0 1.38-1.12 2.5-2.5 2.5a2.25 2.25 0 0 1-1.472-.518v1.162a2.986 2.986 0 0 0-.167.042 3 3 0 0 0-1.128 5.78z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607z" />
    </svg>
);

export const ScissorsIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M7.848 8.25l-2.322 2.322m2.322-2.322a2.25 2.25 0 013.182 0l2.322 2.322m-5.504 0l5.504 5.504m-5.504-5.504L2.25 13.5m1.5-1.5a2.25 2.25 0 010 3.182l2.322 2.322m0 0a2.25 2.25 0 013.182 0l2.322-2.322m-5.504 5.504l5.504-5.504m.75-3.375 2.322-2.322a2.25 2.25 0 013.182 0l2.322 2.322m0 0a2.25 2.25 0 010 3.182l-2.322 2.322m0-5.504-5.504 5.504" />
    </svg>
);

export const UploadIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
    </svg>
);

export const PlusIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
);

export const PlayIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path fillRule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.647c1.295.748 1.295 2.535 0 3.284L7.279 20.99c-1.25.72-2.779-.217-2.779-1.643V5.653Z" clipRule="evenodd" />
    </svg>
);

export const PauseIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path fillRule="evenodd" d="M6.75 5.25a.75.75 0 0 1 .75.75v12a.75.75 0 0 1-1.5 0V6a.75.75 0 0 1 .75-.75Zm9 0a.75.75 0 0 1 .75.75v12a.75.75 0 0 1-1.5 0V6a.75.75 0 0 1 .75-.75Z" clipRule="evenodd" />
    </svg>
);

export const EditorIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
  </svg>
);

// FIX: Added missing icons to resolve import errors.
export const StarIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.32 1.011l-4.2 3.96a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 21.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.2-3.96a.563.563 0 01.32-1.011l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
    </svg>
);

export const FilmstripIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h12A2.25 2.25 0 0120.25 6v12A2.25 2.25 0 0118 20.25H6A2.25 2.25 0 013.75 18V6zM3 8.25h18M3 15.75h18M8.25 3v18M15.75 3v18" />
    </svg>
);

export const EffectsIcon = ({ className }: { className?: string }) => (
    <MagicWandIcon className={className} />
);

export const TransformIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 7.5l-2.25-1.313M21 7.5v2.25m0-2.25l-2.25 1.313M3 7.5l2.25-1.313M3 7.5l2.25 1.313M3 7.5v2.25m9 3l2.25-1.313M12 12.75l-2.25-1.313M12 12.75V15m0-2.25l2.25 1.313M12 12.75l-2.25 1.313M6 16.5l2.25-1.313M6 16.5l2.25 1.313M6 16.5v2.25m12-3l-2.25 1.313M18 16.5l-2.25-1.313M18 16.5v2.25" />
    </svg>
);

export const CropIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 3.75H6A2.25 2.25 0 003.75 6v1.5M16.5 3.75H18A2.25 2.25 0 0120.25 6v1.5m0 9V18A2.25 2.25 0 0118 20.25h-1.5m-9 0H6A2.25 2.25 0 013.75 18v-1.5" />
    </svg>
);

export const KeyframeIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path fillRule="evenodd" d="M11.03 2.22a.75.75 0 011.94 0l9 6.75a.75.75 0 010 1.06l-9 6.75a.75.75 0 01-1.94 0l-9-6.75a.75.75 0 010-1.06l9-6.75zM12 13.38l6.81-5.11-6.81-5.11L5.19 8.27 12 13.38z" clipRule="evenodd" />
    </svg>
);

export const BrainCircuitIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.898 20.562L16.25 21.75l-.648-1.188a2.25 2.25 0 00-1.635-1.635L12.75 18.25l1.188-.648a2.25 2.25 0 001.635-1.635L16.25 15l.648 1.188a2.25 2.25 0 001.635 1.635L19.75 18.25l-1.188.648a2.25 2.25 0 00-1.635 1.635z" />
  </svg>
);
