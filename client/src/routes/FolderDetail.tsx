import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { MoreVertical, Plus, GraduationCap } from 'lucide-react';
import AppShell from './AppShell';
import { createClass, deleteClass, getClasses, getFolder, updateClass } from '../api';
import { Class, Folder } from '../types';
import './EntityGrid.css';
import './FolderDetail.css';

export default function FolderDetail() {
  const { folderId } = useParams<{ folderId: string }>();
  const navigate = useNavigate();
  const id = Number(folderId);

  const [folder, setFolder] = useState<Folder | null>(null);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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
    setLoading(true);
    Promise.all([getFolder(id), getClasses()])
      .then(([folderRes, classesRes]) => {
        if (cancelled) return;
        setFolder(folderRes.data);
        setClasses(classesRes.data.filter((c) => c.folder_id === id));
      })
      .catch(() => {
        if (!cancelled) setError('Could not load this folder.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  const classCount = useMemo(() => classes.length, [classes]);

  const handleCreate = async () => {
    const name = newName.trim();
    if (!name) return;
    setCreating(true);
    try {
      const { data } = await createClass(name, id);
      setClasses((prev) => [data, ...prev]);
      setShowCreate(false);
      setNewName('');
    } catch {
      setError('Could not create the class. Try again.');
    } finally {
      setCreating(false);
    }
  };

  const handleRename = async (classId: number) => {
    const name = renameValue.trim();
    setRenamingId(null);
    if (!name) return;
    try {
      const { data } = await updateClass(classId, { name });
      setClasses((prev) => prev.map((c) => (c.id === classId ? data : c)));
    } catch {
      setError('Could not rename the class. Try again.');
    }
  };

  const handleDelete = async (classId: number) => {
    setOpenMenuId(null);
    try {
      await deleteClass(classId);
      setClasses((prev) => prev.filter((c) => c.id !== classId));
    } catch {
      setError('Could not delete the class. Try again.');
    }
  };

  if (loading) {
    return (
      <AppShell>
        <div className="loading">Loading folder…</div>
      </AppShell>
    );
  }

  if (!folder) {
    return (
      <AppShell>
        <div className="error">Folder not found. <Link to="/folders">Back to My Folders</Link></div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="folders-panel">
        <div className="folder-detail-breadcrumb">
          <Link to="/folders">My Folders</Link>
          <span>&gt;</span>
          <span>{folder.name}</span>
        </div>

        <div className="folder-detail-header">
          <div className="folder-detail-title-group">
            <div className="folder-card-icon" aria-hidden="true" />
            <div>
              <h1>{folder.name}</h1>
              <p className="folder-card-meta">
                {classCount} {classCount === 1 ? 'class' : 'classes'}
              </p>
            </div>
          </div>
          <button type="button" className="btn-secondary folders-grid-new" onClick={() => setShowCreate(true)}>
            <Plus size={16} />
            Add Class
          </button>
        </div>

        {error && <div className="error">{error}</div>}

        {classes.length === 0 ? (
          <div className="empty-state">
            <GraduationCap size={40} className="empty-state-icon" aria-hidden="true" />
            <h3>No classes yet</h3>
            <p>Add one to start uploading notes.</p>
          </div>
        ) : (
          <div className="folders-grid">
            {classes.map((cls) => (
              <div
                key={cls.id}
                className="folder-card"
                onClick={() => renamingId !== cls.id && navigate(`/folders/${id}/classes/${cls.id}`)}
              >
                <div className="folder-card-icon" aria-hidden="true" />
                <div className="folder-card-body">
                  <div className="folder-card-title-row">
                    {renamingId === cls.id ? (
                      <input
                        autoFocus
                        className="folder-card-rename-input"
                        value={renameValue}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => setRenameValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleRename(cls.id);
                          if (e.key === 'Escape') setRenamingId(null);
                        }}
                        onBlur={() => handleRename(cls.id)}
                      />
                    ) : (
                      <h3>{cls.name}</h3>
                    )}
                    <button
                      type="button"
                      className="folder-card-menu-btn"
                      aria-label={`Options for ${cls.name}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenMenuId((prev) => (prev === cls.id ? null : cls.id));
                      }}
                    >
                      <MoreVertical size={16} />
                    </button>
                    {openMenuId === cls.id && (
                      <div className="folder-card-menu" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => {
                            setRenamingId(cls.id);
                            setRenameValue(cls.name);
                            setOpenMenuId(null);
                          }}
                        >
                          Rename
                        </button>
                        <button type="button" className="destructive" onClick={() => handleDelete(cls.id)}>
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showCreate && (
        <div className="modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Add class</h3>
            <input
              autoFocus
              type="text"
              placeholder="Class name"
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
