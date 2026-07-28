import { ReactNode } from 'react';
import { Link, NavLink } from 'react-router-dom';
import {
  CalendarDays,
  Calendar,
  ClipboardList,
  Clock,
  Folder,
  ListTodo,
  NotebookPen,
  Search,
  Timer,
  Trash2,
} from 'lucide-react';
import './AppShell.css';

interface Props {
  children: ReactNode;
  searchQuery?: string;
  onSearchChange?: (value: string) => void;
}

export default function AppShell({ children, searchQuery, onSearchChange }: Props) {
  const searchable = onSearchChange !== undefined;

  return (
    <div className="app-shell">
      <header className="app-shell-header">
        <Link to="/folders" className="app-shell-wordmark">
          ShelfStudy
        </Link>
        <div className="app-shell-search" role={searchable ? undefined : 'search'} aria-label={searchable ? undefined : 'Global search is not available on this page'}>
          <Search size={18} aria-hidden="true" />
          {searchable ? (
            <input
              type="text"
              placeholder="Search folders..."
              aria-label="Search folders"
              value={searchQuery ?? ''}
              onChange={(e) => onSearchChange?.(e.target.value)}
            />
          ) : (
            <span className="app-shell-search-placeholder">Search notes, classes, or ask AI...</span>
          )}
        </div>
        <div className="app-shell-header-actions">
          <NavLink to="/productivity/calendar" className="app-shell-icon-btn" aria-label="Calendar" title="Calendar — coming soon">
            <Calendar size={20} />
          </NavLink>
          <NavLink to="/productivity/todo" className="app-shell-icon-btn" aria-label="To-do list" title="To-do list — coming soon">
            <NotebookPen size={20} />
          </NavLink>
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
          <NavLink to="/recent" className={({ isActive }) => `app-shell-nav-item${isActive ? ' active' : ''}`}>
            <Clock size={18} />
            Recent
          </NavLink>
          <NavLink to="/trash" className={({ isActive }) => `app-shell-nav-item${isActive ? ' active' : ''}`}>
            <Trash2 size={18} />
            Trash
          </NavLink>
          <div className="app-shell-nav-section" aria-label="Productivity">
            <p>Productivity</p>
            <NavLink to="/productivity/todo" className={({ isActive }) => `app-shell-nav-item${isActive ? ' active' : ''}`}>
              <ListTodo size={18} />
              To-do list
            </NavLink>
            <NavLink to="/productivity/assignments" className={({ isActive }) => `app-shell-nav-item${isActive ? ' active' : ''}`}>
              <ClipboardList size={18} />
              Assignments
            </NavLink>
            <NavLink to="/productivity/timer" className={({ isActive }) => `app-shell-nav-item${isActive ? ' active' : ''}`}>
              <Timer size={18} />
              Study timer
            </NavLink>
            <NavLink to="/productivity/calendar" className={({ isActive }) => `app-shell-nav-item${isActive ? ' active' : ''}`}>
              <CalendarDays size={18} />
              Calendar
            </NavLink>
          </div>
        </nav>
        <main className="app-shell-content">{children}</main>
      </div>
    </div>
  );
}
