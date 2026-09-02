import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, MoreVertical, Plus, FolderOpen } from 'lucide-react';
import StudyIcon, { STUDY_ICON_OPTIONS, StudyIconId } from '../components/StudyIcon';
import AppShell from './AppShell';
import { createFolder, deleteFolder, getClasses, getFolders, updateFolder } from '../api';
import { Folder } from '../types';
import { formatFolderLastOpened, markFolderOpened, readFolderLastOpened } from '../utils/folderLastOpened';
import './EntityGrid.css';

type FolderSort = 'last-opened' | 'class-count' | 'created-desc' | 'name-asc' | 'name-desc';

export default function FoldersGrid() {
  const navigate = useNavigate();
  const [folders, setFolders] = useState<Folder[]>([]);
  const [classCounts, setClassCounts] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newIcon, setNewIcon] = useState<StudyIconId | null>(null);
  const [creating, setCreating] = useState(false);
  const [renamingId, setRenamingId] = useState<number | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [lastOpened, setLastOpened] = useState(readFolderLastOpened);
  const [sortBy, setSortBy] = useState<FolderSort>('last-opened');

  useEffect(() => {
    if (openMenuId === null) return;
    const close = () => setOpenMenuId(null);
    window.addEventListener('click', close);
    return () => window.removeEventListener('click', close);
  }, [openMenuId]);

  useEffect(() => {
    let cancelled = false;

    Promise.all([getFolders(), getClasses()])
      .then(([foldersRes, classesRes]) => {
        if (cancelled) return;
        setFolders(foldersRes.data);
        const counts: Record<number, number> = {};
        for (const cls of classesRes.data) {
          if (cls.folder_id != null) counts[cls.folder_id] = (counts[cls.folder_id] ?? 0) + 1;
        }
        setClassCounts(counts);
      })
      .catch(() => {
        if (!cancelled) setError('Could not load folders. Is the server running?');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const visibleFolders = useMemo(() => {
    const filtered = folders.filter((folder) => (
      folder.name.toLowerCase().includes(search.toLowerCase())
    ));

    return [...filtered].sort((a, b) => {
      if (sortBy === 'name-asc') return a.name.localeCompare(b.name);
      if (sortBy === 'name-desc') return b.name.localeCompare(a.name);
      if (sortBy === 'created-desc') {
        return Date.parse(b.created_at) - Date.parse(a.created_at);
      }
      if (sortBy === 'class-count') {
        const countDifference = (classCounts[b.id] ?? 0) - (classCounts[a.id] ?? 0);
        return countDifference || a.name.localeCompare(b.name);
      }

      const openedDifference = Date.parse(lastOpened[b.id] ?? '') - Date.parse(lastOpened[a.id] ?? '');
      if (!Number.isNaN(openedDifference) && openedDifference !== 0) return openedDifference;
      if (lastOpened[a.id]) return -1;
      if (lastOpened[b.id]) return 1;
      return Date.parse(b.created_at) - Date.parse(a.created_at);
    });
  }, [classCounts, folders, lastOpened, search, sortBy]);

  const handleCreate = async () => {
    const name = newName.trim();
    if (!name || !newIcon) return;
    setCreating(true);
    try {
      const { data } = await createFolder(name, newIcon);
      setFolders((prev) => [data, ...prev]);
      setShowCreate(false);
      setNewName('');
      setNewIcon(null);
    } catch {
      setError('Could not create the folder. Try again.');
    } finally {
      setCreating(false);
    }
  };

  const handleRename = async (id: number) => {
    const name = renameValue.trim();
    setRenamingId(null);
    if (!name) return;
    try {
      const { data } = await updateFolder(id, { name });
      setFolders((prev) => prev.map((f) => (f.id === id ? data : f)));
    } catch {
      setError('Could not rename the folder. Try again.');
    }
  };

  const handleDelete = async (id: number) => {
    setOpenMenuId(null);
    try {
      await deleteFolder(id);
      setFolders((prev) => prev.filter((f) => f.id !== id));
    } catch {
      setError('Could not delete the folder. Try again.');
    }
  };

  const openFolder = (id: number) => {
    const openedAt = new Date();
    markFolderOpened(id, openedAt);
    setLastOpened((previous) => ({ ...previous, [id]: openedAt.toISOString() }));
    navigate(`/folders/${id}`);
  };

  return (
    <AppShell searchQuery={search} onSearchChange={setSearch}>
      <div className="folders-panel">
        <div className="folders-grid-header">
          <div className="folders-grid-heading">
            <h1>My Folders</h1>
            <label className="folders-sort">
              <span>Sort by</span>
              <span className="folders-sort-control">
                <select value={sortBy} onChange={(event) => setSortBy(event.target.value as FolderSort)}>
                  <option value="last-opened">Recently opened</option>
                  <option value="class-count">Most classes</option>
                  <option value="created-desc">Newest created</option>
                  <option value="name-asc">Name: A–Z</option>
                  <option value="name-desc">Name: Z–A</option>
                </select>
                <ChevronDown size={17} aria-hidden="true" />
              </span>
            </label>
          </div>
          <button type="button" className="btn-secondary folders-grid-new" onClick={() => setShowCreate(true)}>
            <Plus size={16} />
            New Folder
          </button>
        </div>

        {error && <div className="error">{error}</div>}

        {loading ? (
        <div className="loading">Loading folders…</div>
      ) : visibleFolders.length === 0 ? (
        <div className="empty-state">
          <FolderOpen size={40} className="empty-state-icon" aria-hidden="true" />
          <h3>{folders.length === 0 ? 'No folders yet' : 'No folders match your search'}</h3>
          <p>{folders.length === 0 ? 'Create one to start organizing your classes.' : 'Try a different search term.'}</p>
        </div>
      ) : (
        <div className="folders-grid">
          {visibleFolders.map((folder) => (
            <div
              key={folder.id}
              className="folder-card"
              role="link"
              tabIndex={0}
              aria-label={`Open folder ${folder.name}`}
              onClick={() => renamingId !== folder.id && openFolder(folder.id)}
              onKeyDown={(e) => {
                if (renamingId !== folder.id && (e.key === 'Enter' || e.key === ' ')) {
                  e.preventDefault();
                  openFolder(folder.id);
                }
              }}
            >
              <div className="folder-card-icon" aria-hidden="true"><StudyIcon icon={folder.icon} /></div>
              <div className="folder-card-body">
                <div className="folder-card-title-row">
                  {renamingId === folder.id ? (
                    <input
                      autoFocus
                      className="folder-card-rename-input"
                      value={renameValue}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => setRenameValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleRename(folder.id);
                        if (e.key === 'Escape') setRenamingId(null);
                      }}
                      onBlur={() => handleRename(folder.id)}
                    />
                  ) : (
                    <h3>{folder.name}</h3>
                  )}
                  <button
                    type="button"
                    className="folder-card-menu-btn"
                    aria-label={`Options for ${folder.name}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenMenuId((prev) => (prev === folder.id ? null : folder.id));
                    }}
                  >
                    <MoreVertical size={24} />
                  </button>
                  {openMenuId === folder.id && (
                    <div className="folder-card-menu" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => {
                          setRenamingId(folder.id);
                          setRenameValue(folder.name);
                          setOpenMenuId(null);
                        }}
                      >
                        Rename
                      </button>
                      <button type="button" className="destructive" onClick={() => handleDelete(folder.id)}>
                        Delete
                      </button>
                    </div>
                  )}
                </div>
                <p className="folder-card-meta">
                  {classCounts[folder.id] ?? 0} {classCounts[folder.id] === 1 ? 'class' : 'classes'}
                </p>
              </div>
              <p className="folder-card-last-opened">
                Last opened: <time dateTime={lastOpened[folder.id]}>{formatFolderLastOpened(lastOpened[folder.id])}</time>
              </p>
            </div>
          ))}
        </div>
        )}
      </div>

      {showCreate && (
        <div className="modal-overlay" onClick={() => !creating && setShowCreate(false)}>
          <div
            className="modal icon-picker-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="new-folder-title"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => {
              if (e.key === 'Escape' && !creating) setShowCreate(false);
            }}
          >
            <h3 id="new-folder-title">New folder</h3>
            <input
              autoFocus
              type="text"
              placeholder="Folder name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            />
            <fieldset className="icon-picker-fieldset">
              <legend>Choose an icon <span aria-hidden="true">(required)</span></legend>
              <div className="icon-picker-grid">
                {STUDY_ICON_OPTIONS.map((option) => (
                  <button key={option.id} type="button" className="icon-picker-option" aria-pressed={newIcon === option.id} aria-label={`Choose ${option.label} icon`} onClick={() => setNewIcon(option.id)}>
                    <StudyIcon icon={option.id} />
                    <span>{option.label}</span>
                  </button>
                ))}
              </div>
            </fieldset>
            <div className="modal-actions">
              <button type="button" className="btn-secondary" disabled={creating} onClick={() => setShowCreate(false)}>
                Cancel
              </button>
              <button type="button" className="btn-primary" disabled={!newName.trim() || !newIcon || creating} onClick={handleCreate}>
                {creating ? 'Creating…' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
