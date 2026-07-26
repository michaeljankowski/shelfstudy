import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MoreVertical, Plus, FolderOpen } from 'lucide-react';
import AppShell from './AppShell';
import { createFolder, deleteFolder, getClasses, getFolders, updateFolder } from '../api';
import { Folder } from '../types';
import './EntityGrid.css';

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
  const [creating, setCreating] = useState(false);
  const [renamingId, setRenamingId] = useState<number | null>(null);
  const [renameValue, setRenameValue] = useState('');

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

  const visibleFolders = useMemo(
    () => folders.filter((f) => f.name.toLowerCase().includes(search.toLowerCase())),
    [folders, search],
  );

  const handleCreate = async () => {
    const name = newName.trim();
    if (!name) return;
    setCreating(true);
    try {
      const { data } = await createFolder(name);
      setFolders((prev) => [data, ...prev]);
      setShowCreate(false);
      setNewName('');
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

  return (
    <AppShell searchQuery={search} onSearchChange={setSearch}>
      <div className="folders-panel">
        <div className="folders-grid-header">
          <h1>My Folders</h1>
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
              onClick={() => renamingId !== folder.id && navigate(`/folders/${folder.id}`)}
            >
              <div className="folder-card-icon" aria-hidden="true" />
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
                    <MoreVertical size={16} />
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
            </div>
          ))}
        </div>
        )}
      </div>

      {showCreate && (
        <div className="modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>New folder</h3>
            <input
              autoFocus
              type="text"
              placeholder="Folder name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            />
            <div className="modal-actions">
              <button type="button" className="btn-secondary" onClick={() => setShowCreate(false)}>
                Cancel
              </button>
              <button type="button" className="btn-primary" disabled={!newName.trim() || creating} onClick={handleCreate}>
                {creating ? 'Creating…' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
