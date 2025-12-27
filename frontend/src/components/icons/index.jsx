import React from 'react';

// Common props for all icons
const defaultProps = {
  width: 24,
  height: 24,
  'aria-hidden': true,
  xmlns: 'http://www.w3.org/2000/svg',
};

export function PlayIcon({ className = '', size = 24, ...props }) {
  return (
    <svg {...defaultProps} width={size} height={size} fill="currentColor" viewBox="0 0 24 24" className={className} {...props}>
      <path fillRule="evenodd" d="M8.6 5.2A1 1 0 0 0 7 6v12a1 1 0 0 0 1.6.8l8-6a1 1 0 0 0 0-1.6l-8-6Z" clipRule="evenodd" />
    </svg>
  );
}

export function CogIcon({ className = '', size = 24, ...props }) {
  return (
    <svg {...defaultProps} width={size} height={size} fill="currentColor" viewBox="0 0 24 24" className={className} {...props}>
      <path fillRule="evenodd" d="M9.586 2.586A2 2 0 0 1 11 2h2a2 2 0 0 1 2 2v.089l.473.196.063-.063a2.002 2.002 0 0 1 2.828 0l1.414 1.414a2 2 0 0 1 0 2.827l-.063.064.196.473H20a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2h-.089l-.196.473.063.063a2.002 2.002 0 0 1 0 2.828l-1.414 1.414a2 2 0 0 1-2.828 0l-.063-.063-.473.196V20a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2v-.089l-.473-.196-.063.063a2.002 2.002 0 0 1-2.828 0l-1.414-1.414a2 2 0 0 1 0-2.827l.063-.064L4.089 15H4a2 2 0 0 1-2-2v-2a2 2 0 0 1 2-2h.09l.195-.473-.063-.063a2 2 0 0 1 0-2.828l1.414-1.414a2 2 0 0 1 2.827 0l.064.063L9 4.089V4a2 2 0 0 1 .586-1.414ZM8 12a4 4 0 1 1 8 0 4 4 0 0 1-8 0Z" clipRule="evenodd" />
    </svg>
  );
}

export function TerminalIcon({ className = '', size = 24, ...props }) {
  return (
    <svg {...defaultProps} width={size} height={size} fill="none" viewBox="0 0 24 24" className={className} {...props}>
      <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m8 9 3 3-3 3m5 0h3M4 19h16a1 1 0 0 0 1-1V6a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1Z" />
    </svg>
  );
}

export function InfoIcon({ className = '', size = 24, ...props }) {
  return (
    <svg {...defaultProps} width={size} height={size} fill="none" viewBox="0 0 24 24" className={className} {...props}>
      <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 11h2v5m-2 0h4m-2.592-8.5h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
  );
}

export function ListIcon({ className = '', size = 24, ...props }) {
  return (
    <svg {...defaultProps} width={size} height={size} fill="none" viewBox="0 0 24 24" className={className} {...props}>
      <path stroke="currentColor" strokeLinecap="round" strokeWidth="2" d="M9 8h10M9 12h10M9 16h10M4.99 8H5m-.02 4h.01m0 4H5" />
    </svg>
  );
}

export function ClipboardCopyIcon({ className = '', size = 24, ...props }) {
  return (
    <svg {...defaultProps} width={size} height={size} fill="none" viewBox="0 0 24 24" className={className} {...props}>
      <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 4h3a1 1 0 0 1 1 1v15a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h3m0 3h6m-6 7 2 2 4-4m-5-9v4h4V3h-4Z" />
    </svg>
  );
}

export function ReverseIcon({ className = '', size = 24, ...props }) {
  return (
    <svg {...defaultProps} width={size} height={size} fill="currentColor" viewBox="0 0 24 24" className={className} {...props}>
      <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16h13M4 16l4-4m-4 4 4 4M20 8H7m13 0-4 4m4-4-4-4" />
    </svg>
  );
}

export function JourneyIcon({ className = '', size = 24, ...props }) {
  return (
    <svg {...defaultProps} width={size} height={size} fill="none" viewBox="0 0 24 24" className={className} {...props}>
      <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.03v13m0-13c-2.819-.831-4.715-1.076-8.029-1.023A.99.99 0 0 0 3 6v11c0 .563.466 1.014 1.03 1.007 3.122-.043 5.018.212 7.97 1.023m0-13c2.819-.831 4.715-1.076 8.029-1.023A.99.99 0 0 1 21 6v11c0 .563-.466 1.014-1.03 1.007-3.122-.043-5.018.212-7.97 1.023" />
    </svg>
  );
}

export function GridIcon({ className = '', size = 24, ...props }) {
  return (
    <svg {...defaultProps} width={size} height={size} fill="none" viewBox="0 0 24 24" className={className} {...props}>
      <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.143 4H4.857A.857.857 0 0 0 4 4.857v4.286c0 .473.384.857.857.857h4.286A.857.857 0 0 0 10 9.143V4.857A.857.857 0 0 0 9.143 4Zm10 0h-4.286a.857.857 0 0 0-.857.857v4.286c0 .473.384.857.857.857h4.286A.857.857 0 0 0 20 9.143V4.857A.857.857 0 0 0 19.143 4Zm-10 10H4.857a.857.857 0 0 0-.857.857v4.286c0 .473.384.857.857.857h4.286a.857.857 0 0 0 .857-.857v-4.286A.857.857 0 0 0 9.143 14Zm10 0h-4.286a.857.857 0 0 0-.857.857v4.286c0 .473.384.857.857.857h4.286a.857.857 0 0 0 .857-.857v-4.286a.857.857 0 0 0-.857-.857Z" />
    </svg>
  );
}

export function ErdIcon({ className = '', size = 24, ...props }) {
  return (
    <svg {...defaultProps} width={size} height={size} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
      <rect x="3" y="3" width="6" height="6" rx="1" fill="currentColor" />
      <rect x="15" y="3" width="6" height="6" rx="1" fill="currentColor" />
      <rect x="9" y="15" width="6" height="6" rx="1" fill="currentColor" />
      <line x1="6" y1="9" x2="12" y2="15" />
      <line x1="18" y1="9" x2="12" y2="15" />
    </svg>
  );
}

export function SaveIcon({ className = '', size = 24, ...props }) {
  return (
    <svg {...defaultProps} width={size} height={size} fill="none" viewBox="0 0 24 24" className={className} {...props}>
      <path stroke="currentColor" strokeLinejoin="round" strokeWidth="2" d="M4 5a1 1 0 0 1 1-1h11.586a1 1 0 0 1 .707.293l2.414 2.414a1 1 0 0 1 .293.707V19a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5Z" />
      <path stroke="currentColor" strokeLinejoin="round" strokeWidth="2" d="M8 4h8v4H8V4Zm7 10a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
    </svg>
  );
}

export function SearchIcon({ className = '', size = 24, ...props }) {
  return (
    <svg {...defaultProps} width={size} height={size} fill="none" viewBox="0 0 24 24" className={className} {...props}>
      <path stroke="currentColor" strokeLinecap="round" strokeWidth="2" d="m21 21-3.5-3.5M17 10a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z" />
    </svg>
  );
}

export function CodeIcon({ className = '', size = 24, ...props }) {
  return (
    <svg {...defaultProps} width={size} height={size} fill="none" viewBox="0 0 24 24" className={className} {...props}>
      <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m8 8-4 4 4 4m8 0 4-4-4-4m-2-3-4 14" />
    </svg>
  );
}

export function MinusIcon({ className = '', size = 24, ...props }) {
  return (
    <svg {...defaultProps} width={size} height={size} fill="none" viewBox="0 0 24 24" className={className} {...props}>
      <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 12h14" />
    </svg>
  );
}

export function PlusIcon({ className = '', size = 24, ...props }) {
  return (
    <svg {...defaultProps} width={size} height={size} fill="none" viewBox="0 0 24 24" className={className} {...props}>
      <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 12h14m-7 7V5" />
    </svg>
  );
}

export function DbIcon({ className = '', size = 24, ...props }) {
  return (
    <svg {...defaultProps} width={size} height={size} fill="none" viewBox="0 0 24 24" className={className} {...props}>
      <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 6c0 1.657-3.134 3-7 3S5 7.657 5 6m14 0c0-1.657-3.134-3-7-3S5 4.343 5 6m14 0v6M5 6v6m0 0c0 1.657 3.134 3 7 3s7-1.343 7-3M5 12v6c0 1.657 3.134 3 7 3s7-1.343 7-3v-6" />
    </svg>
  );
}

export function ShareIcon({ className = '', size = 24, ...props }) {
  return (
    <svg {...defaultProps} width={size} height={size} fill="currentColor" viewBox="0 0 24 24" className={className} {...props}>
      <path d="M17.5 3a3.5 3.5 0 0 0-3.456 4.06L8.143 9.704a3.5 3.5 0 1 0-.01 4.6l5.91 2.65a3.5 3.5 0 1 0 .863-1.805l-5.94-2.662a3.53 3.53 0 0 0 .002-.961l5.948-2.667A3.5 3.5 0 1 0 17.5 3Z" />
    </svg>
  );
}

export function DryormIcon({ className = '', size = 40, ...props }) {
  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      fill="currentColor"
      viewBox="600 600 510 450"
      className={className}
      {...props}
    >
      <g transform="translate(460, 460)">
        <path d="m 298.83457,149.42704 c 23.05105,0 43.75018,1.2661 57.24,3.50865 14.5515,2.41905 22.65368,4.06455 30.15967,6.13058 2.87786,0.79213 6.41101,1.7591 7.84783,2.14915 11.96758,3.24885 29.27072,11.31532 37.90532,17.69409 7.15106,5.28281 13.96918,12.71105 16.77411,18.3815 3.28452,6.63991 3.49914,16.91216 0.46534,23.38511 -7.7969,16.63404 -31.7382,31.20315 -66.04614,40.59622 -13.6413,3.73482 -24.7609,5.81643 -45.44652,8.50972 -7.54751,0.98268 -51.08075,1.89448 -59.87978,1.27006 -14.18373,-1.00655 -35.80547,-3.77911 -43.71645,-5.62203 -15.39637,-3.5867 -19.46505,-4.66193 -27.5352,-7.28053 -29.5988,-9.60427 -48.81957,-22.02647 -55.77827,-36.39759 -4.48847,-9.26953 -3.45952,-21.7378 2.48135,-29.75335 7.44482,-10.0447 18.50295,-17.79765 36.23403,-25.48315 7.68359,-3.33045 22.93215,-8.0172 31.53707,-9.69547 2.87845,-0.56138 7.00002,-1.3649 9.15882,-1.78626 20.59698,-4.02032 40.01328,-5.6067 68.59907,-5.6067 z" />
      </g>
    </svg>
  );
}

// Spinner icon for loading states
export function SpinnerIcon({ className = '', size = 24, ...props }) {
  return (
    <svg {...defaultProps} width={size} height={size} fill="none" viewBox="0 0 24 24" className={`animate-spin ${className}`} {...props}>
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
  );
}

// Moon icon for dark mode toggle
export function MoonIcon({ className = '', size = 24, ...props }) {
  return (
    <svg {...defaultProps} width={size} height={size} fill="currentColor" viewBox="0 0 24 24" className={className} {...props}>
      <path fillRule="evenodd" d="M11.675 2.015a.998.998 0 0 0-.403.011C6.09 2.4 2 6.722 2 12c0 5.523 4.477 10 10 10 4.356 0 8.058-2.784 9.43-6.667a1 1 0 0 0-1.02-1.33c-.08.006-.105.005-.127.005h-.001l-.028-.002A5.227 5.227 0 0 0 20 14a8 8 0 0 1-8-8c0-.952.166-1.867.47-2.715a1 1 0 0 0-.795-1.27Z" clipRule="evenodd" />
    </svg>
  );
}

// Sun icon for light mode toggle
export function SunIcon({ className = '', size = 24, ...props }) {
  return (
    <svg {...defaultProps} width={size} height={size} fill="currentColor" viewBox="0 0 24 24" className={className} {...props}>
      <path fillRule="evenodd" d="M13 3a1 1 0 1 0-2 0v2a1 1 0 1 0 2 0V3ZM6.343 4.929A1 1 0 0 0 4.93 6.343l1.414 1.414a1 1 0 0 0 1.414-1.414L6.343 4.929Zm12.728 1.414a1 1 0 0 0-1.414-1.414l-1.414 1.414a1 1 0 0 0 1.414 1.414l1.414-1.414ZM12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10Zm-9 4a1 1 0 1 0 0 2h2a1 1 0 1 0 0-2H3Zm16 0a1 1 0 1 0 0 2h2a1 1 0 1 0 0-2h-2ZM7.757 17.657a1 1 0 1 0-1.414-1.414l-1.414 1.414a1 1 0 1 0 1.414 1.414l1.414-1.414Zm9.9-1.414a1 1 0 0 0-1.414 1.414l1.414 1.414a1 1 0 0 0 1.414-1.414l-1.414-1.414ZM13 19a1 1 0 1 0-2 0v2a1 1 0 1 0 2 0v-2Z" clipRule="evenodd" />
    </svg>
  );
}

// X/Close icon
export function XIcon({ className = '', size = 24, ...props }) {
  return (
    <svg {...defaultProps} width={size} height={size} fill="none" viewBox="0 0 24 24" className={className} {...props}>
      <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18 18 6M6 6l12 12" />
    </svg>
  );
}

// Chevron Down icon
export function ChevronDownIcon({ className = '', size = 24, ...props }) {
  return (
    <svg {...defaultProps} width={size} height={size} fill="none" viewBox="0 0 24 24" className={className} {...props}>
      <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m19 9-7 7-7-7" />
    </svg>
  );
}

// Chevron Right icon
export function ChevronRightIcon({ className = '', size = 24, ...props }) {
  return (
    <svg {...defaultProps} width={size} height={size} fill="none" viewBox="0 0 24 24" className={className} {...props}>
      <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m9 5 7 7-7 7" />
    </svg>
  );
}

// Check icon
export function CheckIcon({ className = '', size = 24, ...props }) {
  return (
    <svg {...defaultProps} width={size} height={size} fill="none" viewBox="0 0 24 24" className={className} {...props}>
      <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 11.917 9.724 16.5 19 7.5" />
    </svg>
  );
}

// External link icon
export function ExternalLinkIcon({ className = '', size = 24, ...props }) {
  return (
    <svg {...defaultProps} width={size} height={size} fill="none" viewBox="0 0 24 24" className={className} {...props}>
      <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 14v4.833A1.166 1.166 0 0 1 16.833 20H5.167A1.167 1.167 0 0 1 4 18.833V7.167A1.166 1.166 0 0 1 5.167 6h4.618m4.447-2H20v5.768m-7.889 2.121 7.778-7.778" />
    </svg>
  );
}

// GitHub icon
export function GitHubIcon({ className = '', size = 24, ...props }) {
  return (
    <svg {...defaultProps} width={size} height={size} fill="currentColor" viewBox="0 0 24 24" className={className} {...props}>
      <path fillRule="evenodd" d="M12.006 2a9.847 9.847 0 0 0-6.484 2.44 10.32 10.32 0 0 0-3.393 6.17 10.48 10.48 0 0 0 1.317 6.955 10.045 10.045 0 0 0 5.4 4.418c.504.095.683-.223.683-.494 0-.245-.01-1.052-.014-1.908-2.78.62-3.366-1.21-3.366-1.21a2.711 2.711 0 0 0-1.11-1.5c-.907-.637.07-.621.07-.621.317.044.62.163.885.346.266.183.487.426.647.71.135.253.318.476.538.655a2.079 2.079 0 0 0 2.37.196c.045-.52.27-1.006.635-1.37-2.219-.259-4.554-1.138-4.554-5.07a4.022 4.022 0 0 1 1.031-2.75 3.77 3.77 0 0 1 .096-2.713s.839-.275 2.749 1.05a9.26 9.26 0 0 1 5.004 0c1.906-1.325 2.74-1.05 2.74-1.05.37.858.406 1.828.101 2.713a4.017 4.017 0 0 1 1.029 2.75c0 3.939-2.339 4.805-4.564 5.058a2.471 2.471 0 0 1 .679 1.897c0 1.372-.012 2.477-.012 2.814 0 .272.18.592.687.492a10.05 10.05 0 0 0 5.388-4.421 10.473 10.473 0 0 0 1.313-6.948 10.32 10.32 0 0 0-3.39-6.165A9.847 9.847 0 0 0 12.007 2Z" clipRule="evenodd" />
    </svg>
  );
}

// Expand icon (for zen mode)
export function ExpandIcon({ className = '', size = 24, ...props }) {
  return (
    <svg {...defaultProps} width={size} height={size} fill="none" viewBox="0 0 24 24" className={className} {...props}>
      <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 4H4m0 0v4m0-4 5 5m7-5h4m0 0v4m0-4-5 5M8 20H4m0 0v-4m0 4 5-5m7 5h4m0 0v-4m0 4-5-5" />
    </svg>
  );
}

// Compress icon (for exiting zen mode)
export function CompressIcon({ className = '', size = 24, ...props }) {
  return (
    <svg {...defaultProps} width={size} height={size} fill="none" viewBox="0 0 24 24" className={className} {...props}>
      <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 9V4m0 5H4m0 0 5-5m6 5h5m0 0V4m0 5-5-5m-6 11v5m0-5H4m5 5-5-5m11 0h5m0 0v5m0-5-5 5" />
    </svg>
  );
}

export default {
  PlayIcon,
  CogIcon,
  TerminalIcon,
  InfoIcon,
  ListIcon,
  ClipboardCopyIcon,
  ReverseIcon,
  JourneyIcon,
  GridIcon,
  ErdIcon,
  SaveIcon,
  SearchIcon,
  CodeIcon,
  MinusIcon,
  PlusIcon,
  DbIcon,
  ShareIcon,
  DryormIcon,
  SpinnerIcon,
  MoonIcon,
  SunIcon,
  XIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  CheckIcon,
  ExternalLinkIcon,
  GitHubIcon,
  ExpandIcon,
  CompressIcon,
};
