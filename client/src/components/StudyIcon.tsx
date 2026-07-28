import type { SVGProps } from 'react';

export const STUDY_ICON_OPTIONS = [
  { id: 'atom', label: 'Atom' },
  { id: 'flask', label: 'Flask' },
  { id: 'calculator', label: 'Calculator' },
  { id: 'chart', label: 'Bar chart' },
  { id: 'books', label: 'Bookshelf' },
  { id: 'notebook', label: 'Open notebook' },
  { id: 'paw', label: 'Paw print' },
  { id: 'sprout', label: 'Sprout' },
  { id: 'globe', label: 'Globe' },
  { id: 'monitor', label: 'Computer monitor' },
] as const;

export type StudyIconId = (typeof STUDY_ICON_OPTIONS)[number]['id'];

type StudyIconProps = SVGProps<SVGSVGElement> & { icon?: string | null };

export default function StudyIcon({ icon, ...props }: StudyIconProps) {
  const common = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  const paths: Record<string, React.ReactNode> = {
    atom: <><circle cx="12" cy="12" r="2.5" /><ellipse cx="12" cy="12" rx="9.5" ry="3.8" /><ellipse cx="12" cy="12" rx="9.5" ry="3.8" transform="rotate(60 12 12)" /><ellipse cx="12" cy="12" rx="9.5" ry="3.8" transform="rotate(120 12 12)" /></>,
    flask: <><path d="M9 3h6M10 3v7L4.8 19a2 2 0 0 0 1.7 3h11a2 2 0 0 0 1.7-3L14 10V3" /><path d="M8 14h8M10 7h4" /></>,
    calculator: <><rect x="4" y="3" width="16" height="18" rx="2" /><path d="M8 8h8M8 13h2M14 13h2M8 17h2M14 17h2" /></>,
    chart: <><path d="M3 21h18M6 19v-5h3v5M11 19V9h3v10M16 19V5h3v14M5 10l5-3 4 2 5-5" /><path d="M16 4h3v3" /></>,
    books: <><path d="M4 20h16v2H4zM5 20V5h4v15M10 20V4h4v16M15 20l-2-14 4-.6L20 20" /><path d="M6.5 8h1M11.5 8h1M16 12l2-.3" /></>,
    notebook: <><path d="M3 5.5c3.5-.8 6.3-.2 9 1.7 2.7-1.9 5.5-2.5 9-1.7V19c-3.5-.8-6.3-.2-9 1.7-2.7-1.9-5.5-2.5-9-1.7z" /><path d="M12 7.2V20.7M6 10h3M6 13h3M15 10h3M15 13h3" /><path d="M17.5 4.5l2 1-3 7-2 .8.5-2z" /></>,
    paw: <><path d="M7.5 10.5c-1.2-1.8-3.8-1-3.6 1.2.2 2.3 2 4.1 3.6 4.1M16.5 10.5c1.2-1.8 3.8-1 3.6 1.2-.2 2.3-2 4.1-3.6 4.1" /><ellipse cx="8" cy="6.5" rx="2" ry="2.7" /><ellipse cx="12" cy="5.3" rx="2" ry="2.8" /><ellipse cx="16" cy="6.5" rx="2" ry="2.7" /><path d="M12 12c-3 0-5.5 2.8-5.5 5.3 0 2.2 1.4 3.7 3.3 3.1.8-.3 1.3-.8 2.2-.8s1.4.5 2.2.8c1.9.6 3.3-.9 3.3-3.1C17.5 14.8 15 12 12 12z" /></>,
    sprout: <><path d="M12 21V12" /><path d="M12 13C7 13 4.5 9.7 4 5c4.8-.1 7.3 2.2 8 8zM12 10c.8-4.7 3.2-7 8-7-.5 4.7-3 8-8 8z" /></>,
    globe: <><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c2.6 2.4 3.9 5.4 3.9 9S14.6 18.6 12 21M12 3C9.4 5.4 8.1 8.4 8.1 12S9.4 18.6 12 21" /><path d="M5 7c2 .8 3.6.7 5-.4M14 17c1.6-1 3.1-1 5-.2" /></>,
    monitor: <><rect x="3" y="4" width="18" height="13" rx="2" /><path d="M9 21h6M12 17v4" /></>,
  };
  return <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" {...props}><g {...common}>{paths[icon ?? ''] ?? <path d="M3 7h7l2 2h9v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />}</g></svg>;
}
