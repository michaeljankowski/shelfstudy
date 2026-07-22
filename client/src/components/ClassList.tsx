import { useState } from 'react';
import axios from 'axios';
import { Class } from '../types';
import { createClass, updateClass, deleteClass } from '../api';
import './ClassList.css';

interface Props {
  classes: Class[];
  selectedClass: Class | null;
  onSelectClass: (cls: Class) => void;
  onClassCreated: (cls: Class) => void;
  onClassUpdated: (cls: Class) => void;
  onClassDeleted: (classId: number) => void;
  loading: boolean;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export default function ClassList({
  classes,
  selectedClass,
  onSelectClass,
  onClassCreated,
  onClassUpdated,
  onClassDeleted,
  loading,
  collapsed,
  onToggleCollapse,
}: Props) {
  const [newClassName, setNewClassName] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClassName.trim()) return;

    try {
      setCreating(true);
      setError('');
      const response = await createClass(newClassName.trim());
      onClassCreated(response.data);
      setNewClassName('');
    } catch (err) {
      const message = axios.isAxiosError(err) ? err.response?.data?.error : undefined;
      setError(message || 'Failed to create class');
    } finally {
      setCreating(false);
    }
  };

  const handleStartEdit = (cls: Class, e: React.MouseEvent) => {
    e.stopPropagation(); // don't select the class when clicking its edit button
    setEditingId(cls.id);
    setEditingName(cls.name);
  };

  const handleSaveEdit = async (classId: number) => {
    if (!editingName.trim()) {
      setEditingId(null);
      return;
    }

    try {
      const response = await updateClass(classId, { name: editingName.trim() });
      onClassUpdated(response.data);
      setEditingId(null);
    } catch {
      setError('Failed to rename class');
      setEditingId(null);
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingName('');
  };

  const handleDelete = async (classId: number, e: React.MouseEvent) => {
    e.stopPropagation();

    const confirmed = window.confirm(
      'Delete this class? All notes in this class will also be deleted.'
    );
    if (!confirmed) return;

    try {
      await deleteClass(classId);
      onClassDeleted(classId);
    } catch {
      setError('Failed to delete class');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, classId: number) => {
    if (e.key === 'Enter') {
      handleSaveEdit(classId);
    } else if (e.key === 'Escape') {
      handleCancelEdit();
    }
  };

  return (
    <div className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      <button
        className="sidebar-toggle"
        onClick={onToggleCollapse}
        title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {collapsed ? '→' : '←'}
      </button>

      <div className="sidebar-header">
        <h1>Mike's App</h1>
        <p>AI-Powered Study Tool</p>
      </div>

      <div className="class-create">
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="New class name..."
            value={newClassName}
            onChange={(e) => setNewClassName(e.target.value)}
            disabled={creating}
          />
          <button
            type="submit"
            className="btn-primary"
            disabled={creating || !newClassName.trim()}
          >
            {creating ? 'Creating...' : '+ Add Class'}
          </button>
        </form>
        {error && <div className="class-error">{error}</div>}
      </div>

      <div className="class-list">
        {loading ? (
          <div className="loading">Loading classes...</div>
        ) : classes.length === 0 ? (
          <div className="empty-state-small">
            <p>No classes yet</p>
            <p style={{ fontSize: '0.75rem', marginTop: '4px' }}>
              Create your first class above
            </p>
          </div>
        ) : (
          classes.map((cls) => (
            <div
              key={cls.id}
              className={`class-item ${selectedClass?.id === cls.id ? 'active' : ''} ${editingId === cls.id ? 'editing' : ''}`}
              onClick={() => editingId !== cls.id && onSelectClass(cls)}
            >
              {editingId === cls.id ? (
                <div className="class-edit-container">
                  <input
                    type="text"
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, cls.id)}
                    autoFocus
                    className="class-edit-input"
                    onClick={(e) => e.stopPropagation()}
                  />
                  <div className="class-edit-actions">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSaveEdit(cls.id);
                      }}
                      className="edit-save-btn"
                      title="Save"
                    >
                      ✓
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCancelEdit();
                      }}
                      className="edit-cancel-btn"
                      title="Cancel"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="class-content">
                    <div className="class-name">{cls.name}</div>
                  </div>
                  <div className="class-actions">
                    <button
                      onClick={(e) => handleStartEdit(cls, e)}
                      className="class-action-btn edit-btn"
                      title="Rename class"
                    >
                      ✎
                    </button>
                    <button
                      onClick={(e) => handleDelete(cls.id, e)}
                      className="class-action-btn delete-btn"
                      title="Delete class"
                    >
                      ✕
                    </button>
                  </div>
                </>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
