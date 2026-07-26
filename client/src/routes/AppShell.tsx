import { ReactNode } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Folder, Clock, Trash2, Search, Calendar, NotebookPen } from 'lucide-react';
import './AppShell.css';

interface Props {
  children: ReactNode;
  searchQuery?: string;
  onSearchChange?: (value: string) => void;
}

// Persistent chrome (top search header + left nav) shared by every
// authenticated screen, matching designimages/3.png and 4.png. Recent/Trash
// and the calendar/notes header icons have no backing feature yet — they're
// visibly present but inert, not wired to fake behavior.
export default function AppShell({ children, searchQuery, onSearchChange }: Props) {
  const searchable = onSearchChange !== undefined;

  return (
    <div className="app-shell">
      <header className="app-shell-header">
        <Link to="/folders" className="app-shell-wordmark">
          ShelfStudy
        </Link>
        <div className="app-shell-search">
          <Search size={18} aria-hidden="true" />
          <input
            type="text"
            placeholder={searchable ? 'Search folders...' : 'Search notes, classes, or ask AI...'}
            aria-label="Search folders"
            value={searchQuery ?? ''}
            onChange={(e) => onSearchChange?.(e.target.value)}
            disabled={!searchable}
          />
        </div>
        <div className="app-shell-header-actions">
          <button type="button" className="app-shell-icon-btn" aria-label="Calendar" title="Coming soon" disabled>
            <Calendar size={20} />
          </button>
          <button type="button" className="app-shell-icon-btn" aria-label="Notes" title="Coming soon" disabled>
            <NotebookPen size={20} />
          </button>
        </div>
      </header>
      <div className="app-shell-body">
        <nav className="app-shell-nav" aria-label="Primary">
          <NavLink
            to="/folders"
            className={({ isActive }) => `app-shell-nav-item${isActive ? ' active' : ''}`}
          >
            <Folder size={18} />
            My Folders
          </NavLink>
          <span className="app-shell-nav-item disabled" title="Coming soon" aria-disabled="true">
            <Clock size={18} />
            Recent
          </span>
          <span className="app-shell-nav-item disabled" title="Coming soon" aria-disabled="true">
            <Trash2 size={18} />
            Trash
          </span>
        </nav>
        <main className="app-shell-content">{children}</main>
      </div>
    </div>
  );
}
