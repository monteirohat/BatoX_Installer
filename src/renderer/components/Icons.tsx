// Inline SVG icons (stroke style, inherit the text color).

import type { ReactNode } from "react";

type Props = { size?: number };

function Svg({ size = 24, children }: Props & { children: ReactNode }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {children}
    </svg>
  );
}

export const PackageIcon = (p: Props) => (
  <Svg {...p}><path d="M21 8l-9-5-9 5 9 5 9-5z" /><path d="M3 8v8l9 5 9-5V8" /><path d="M12 13v8" /></Svg>
);
export const ConsoleIcon = (p: Props) => (
  <Svg {...p}><rect x="2" y="7" width="20" height="11" rx="5" /><path d="M7 11v3M5.5 12.5h3M15 12h.01M18 13h.01" /></Svg>
);
export const BoltIcon = (p: Props) => (
  <Svg {...p}><path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z" /></Svg>
);
export const CheckIcon = (p: Props) => (
  <Svg {...p}><path d="M5 12.5l4.5 4.5L19 7.5" /></Svg>
);
export const XIcon = (p: Props) => (
  <Svg {...p}><path d="M6 6l12 12M18 6L6 18" /></Svg>
);
export const MinusIcon = (p: Props) => (
  <Svg {...p}><path d="M6 12h12" /></Svg>
);
export const ExternalIcon = (p: Props) => (
  <Svg {...p}><path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" /></Svg>
);
export const CopyIcon = (p: Props) => (
  <Svg {...p}><rect x="9" y="9" width="11" height="11" rx="2" /><path d="M5 15V5a1 1 0 0 1 1-1h10" /></Svg>
);
export const AlertIcon = (p: Props) => (
  <Svg {...p}><path d="M12 3l10 18H2L12 3z" /><path d="M12 10v4M12 17.5v.01" /></Svg>
);
export const GitHubIcon = (p: Props) => (
  <Svg {...p}><path d="M9 19c-4 1.5-4-2-6-2.5m12 5v-3.5c0-1 .1-1.4-.5-2 2.8-.3 5.5-1.4 5.5-6a4.6 4.6 0 0 0-1.3-3.2 4.2 4.2 0 0 0-.1-3.2s-1.1-.3-3.5 1.3a12 12 0 0 0-6.2 0C6.5 2.8 5.4 3.1 5.4 3.1a4.2 4.2 0 0 0-.1 3.2A4.6 4.6 0 0 0 4 9.5c0 4.6 2.7 5.7 5.5 6-.6.6-.6 1.2-.5 2V21" /></Svg>
);

export function Spinner({ size = 18 }: Props) {
  return <span className="spinner" style={{ width: size, height: size }} aria-hidden="true" />;
}
